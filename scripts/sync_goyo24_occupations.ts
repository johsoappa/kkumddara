#!/usr/bin/env npx tsx
// ====================================================
// scripts/sync_goyo24_occupations.ts
// 고용24 직업정보 D01 API → occupation_goyo24_profile upsert
//
// [실행 방법]
//   # dry-run (실제 upsert 없음, 매핑 결과만 출력)
//   npx tsx scripts/sync_goyo24_occupations.ts --dry-run
//
//   # 실제 실행
//   npx tsx scripts/sync_goyo24_occupations.ts
//
// [필요 환경변수]
//   GOYO24_OCCUPATION_API_KEY   — 고용24 직업정보 API 인증키
//   NEXT_PUBLIC_SUPABASE_URL    — Supabase 프로젝트 URL
//   SUPABASE_SERVICE_ROLE_KEY   — Supabase service_role 키 (RLS 우회, write 전용)
//
//   .env.local 또는 환경변수로 제공
//
// [보안 규칙]
//   - 인증키를 console.log / 로그 / 파일에 출력 금지
//   - 인증키 포함 URL 출력 금지
//   - 이 스크립트 자체를 git에 커밋해도 키는 포함되지 않음
//
// [흐름]
//   1. occupation_master에서 is_active=true 직업 목록 조회
//   2. MANUAL_MAPPING 에 직업명이 있으면 해당 jobCd를 L01 검색 없이 우선 사용
//   3. 없으면 name_ko 기준으로 고용24 L01 목록 API 검색
//   4. K-prefix jobCd 후보 추출 + 최적 매핑 선택
//   5. D01 상세 API 호출
//   6. sal/jobSatis/jobProspect/relMajorList 파싱
//   7. occupation_goyo24_profile upsert
// ====================================================

import { createClient }                                      from "@supabase/supabase-js";
import type {
  Goyo24JobListItem,
  Goyo24D01ParsedData,
  Goyo24RelMajor,
  ParsedSalary,
  ProspectLabel,
  OccupationGoyo24ProfileUpsert,
  SyncResult,
} from "../src/types/goyo24";

// ─── .env.local 수동 로드 ────────────────────────────────────
// Next.js 런타임이 아니므로 dotenv 없이 직접 파싱
import { readFileSync, existsSync } from "fs";
import { join }                     from "path";

function loadDotEnvLocal(): void {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadDotEnvLocal();

// ─── 환경변수 검증 ───────────────────────────────────────────
const OCCUPATION_API_KEY  = process.env.GOYO24_OCCUPATION_API_KEY;
const SUPABASE_URL        = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!OCCUPATION_API_KEY) {
  console.error("❌ GOYO24_OCCUPATION_API_KEY 환경변수가 없습니다.");
  process.exit(1);
}
if (!SUPABASE_URL) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL 환경변수가 없습니다.");
  process.exit(1);
}
if (!SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.");
  console.error("   배치 스크립트는 RLS를 우회하기 위해 service_role 키가 필요합니다.");
  process.exit(1);
}

// ─── 설정 ────────────────────────────────────────────────────
const IS_DRY_RUN  = process.argv.includes("--dry-run");
const API_BASE    = "https://www.work24.go.kr/cm/openApi/call/wk";
const REQUEST_DELAY_MS = 500;  // API 요청 간 지연 (과부하 방지)
const MAX_MAJORS  = 10;        // 저장할 관련학과 최대 개수

// ─── goyo24 미지원 직업 목록 ─────────────────────────────────
// 아래 직업은 고용24 직업정보 DB에 대응 코드가 없어 L01·D01 모두 불가.
// sync 루프에서 이 Set에 포함된 직업은 skip → goyo24_profile 행 없음.
// 상세 페이지의 Goyo24InfoSection은 profile=null 시 자동으로 섹션 비표시.
//
// [등록 이력 — 2026-05-10]
//   AI 엔지니어       : "인공지능", "AI", "머신러닝" 키워드 모두 L01 0건
//   클라우드 엔지니어  : 직업 분류 없음 (IT 인프라 전반 포괄)
//   VR·AR 개발자      : 전용 코드 없음 (관련 분류 미분리)
//   창업가            : 직업 분류 제외 범주
//   탄소중립전문가     : 신생 직업, goyo24 미등재
//   과학수사관         : L01 0건 (수사 관련 특수직 미등재)
//   광고기획자         : K000000872(마케터)와 코드 중복 — 혼동 방지를 위해 skip
//   기자              : 서비스 직업명과 고용24 직업 정의 불일치 → skip
// [등록 이력 — 2026-05-11 2차 추가]
//   일러스트레이터     : "일러스트레이터", "삽화가", "일러스트" 키워드 모두 L01 오류 (미등재)
//   외교관            : "외교관", "외무공무원", "외교" 키워드 모두 L01 오류 (공무원 계열 미분류)
//   신재생에너지 전문가: "신재생에너지", "에너지관리사", "재생에너지" 키워드 모두 L01 오류 (신생 직업)
//   환경 엔지니어      : 수질·대기·토양·건축 등 분야별 코드만 존재 — 단일 코드 선택 불가
// [등록 이력 — 2026-05-25 3차 추가 (migration 050 신규 직업)]
//   AI 서비스 기획자  : "AI기획", "서비스기획" 키워드 L01 0건 (신생 직업, 고용24 미분류)
//                       → migration 051 manual profile row로 운영
//   팟캐스트 기획자   : "팟캐스트", "오디오기획" 키워드 L01 0건 (신생 미디어 직종)
//                       → migration 051 manual profile row로 운영
const GOYO24_UNSUPPORTED = new Set<string>([
  "AI 엔지니어",
  "클라우드 엔지니어",
  "VR·AR 개발자",
  "창업가",
  "탄소중립전문가",
  "과학수사관",
  "광고기획자",
  "기자",
  // ── 2차 추가 (2026-05-11) ─────────────────────────────────
  "일러스트레이터",
  "외교관",
  "신재생에너지 전문가",
  "환경 엔지니어",
  // ── 3차 추가 (2026-05-25) — migration 050 신규 직업 중 미지원 ──
  "AI 서비스 기획자",   // 신생 직업, 고용24 분류 없음 (051 manual row 운영)
  "팟캐스트 기획자",   // 신생 미디어 직종, 고용24 분류 없음 (051 manual row 운영)
]);

// ─── 수동 매핑 테이블 ────────────────────────────────────────
// L01 자동 검색으로 찾지 못하거나 오매핑된 직업을 jobCd로 직접 지정.
// 여기 등록된 직업은 L01 API를 호출하지 않고 바로 D01 상세를 가져온다.
//
// [추가 이력]
//   2026-05-10 1차: dry-run 실패 4건 중 3건 수동 확정 반영
//     - 데이터 분석가    → K000001080 (데이터분석가(빅데이터분석가))
//     - 영상콘텐츠 제작자 → K000001025 (미디어콘텐츠창작자(크리에이터))
//     - 심리상담사       → K000001049 (심리상담전문가)
//   2026-05-10 2차: L01 오매핑 3건 수동 보정
//     - 소프트웨어 개발자  → K000001176 (응용소프트웨어개발자) — 시스템(K000000853) 오매핑 보정
//     - 교사             → K000001065 (중·고등학교교사) — 보조교사(K000000849) 오매핑 보정
//     - 마케터            → K000000872 (광고·홍보·마케팅전문가) — 텔레마케터(K000007451) 오매핑 보정
//   2026-05-10: 생명과학 연구원 — D01 비교 후 K000001048 권장
//     OZ.대표 최종 승인 시 아래 주석 해제
//   2026-05-10 1차 확장 (11개): 오매핑 방지 + L01 검색 불가 직업 수동 확정
const MANUAL_MAPPING: Record<string, string> = {
  // ── 오매핑 보정 (L01 자동 검색이 엉뚱한 직업을 선택) ──────
  "소프트웨어 개발자":  "K000001176", // 응용소프트웨어개발자 (vs 시스템 K000000853 오매핑 보정)
  "중·고등학교 교사":  "K000001065", // 중·고등학교교사 (vs 보조교사 K000000849 오매핑 보정)
  "마케터":            "K000000872", // 광고·홍보·마케팅전문가 (vs 텔레마케터 K000007451 오매핑 보정)
  // ── 검색 불가 직업 수동 확정 ───────────────────────────────
  "데이터 분석가":      "K000001080", // 데이터분석가(빅데이터분석가)
  "영상콘텐츠 제작자":  "K000001025", // 미디어콘텐츠창작자(크리에이터)
  "심리상담사":         "K000001049", // 심리상담전문가
  // ── OZ.대표 결정 대기 ──────────────────────────────────────
  // 생명과학 연구원: K000001048 권장 (생물학연구원, 직접 연구 수행 / 전망 유지)
  // 대안:            K000000852   (생명과학시험원, 생명과학 분류 직접 대응 / 관련학과 10개)
  // [확정 2026-05-10] OZ.대표 결정: K000001048 (생물학연구원) 사용
  "생명과학 연구원":   "K000001048", // 생물학연구원 (직접 연구 수행 / 전망 유지)
  // ── 1차 추가 직업 (2026-05-10) ────────────────────────────────
  "사이버보안 전문가": "K000000832", // 정보보안전문가 (L01['사이버보안'] 검색 불가)
  "게임 개발자":       "K000007580", // 게임프로그래머 (게임기획자 코드 없음)
  "건축가":            "K000001014", // 건축가(건축설계사)
  "패션 디자이너":     "K000007454", // 의상디자이너 (L01['패션'] 오매핑 방지)
  "웹툰 작가":         "K000007518", // 만화가 (웹툰 전용 코드 없음)
  "소방관":            "K000007495", // 소방관 (오매핑 방지용)
  "방송 PD":           "K000001138", // 방송연출가 (L01['방송 PD'] 검색 불가)
  "우주항공 엔지니어": "K000000877", // 항공공학기술자 (L01['우주'] 검색 불가)
  "로봇 엔지니어":     "K000000860", // 로봇공학기술자 (오매핑 방지용)
  "의사":              "K000007504", // 일반의사 (세분화 오매핑 방지)
  "치과의사":          "K000007472", // 치과의사 (세분화 오매핑 방지용)
  // ── 1차 확장 2차 보정 (2026-05-11) ───────────────────────────
  // dry-run 실패 1건 + 후보 다중 자동 매핑 3건 → 수동 고정
  "초등학교 교사":     "K000007558", // 초등학교교사 (L01 API 오류 — 직접 지정)
  "약사":              "K000000993", // 약사 (후보 2개 — 수동 확정)
  "수의사":            "K000001011", // 수의사 (후보 2개 — 수동 확정)
  "회계사":            "K000007449", // 공인회계사 (후보 2개 — 수동 확정)
  // ── 2차 추가 직업 (2026-05-11) ────────────────────────────────
  // L01 자동 검색 불가 또는 서비스명과 고용24 jobNm 불일치 → 수동 확정
  "제품 디자이너":     "K000001000", // 제품디자이너 (L01['산업디자이너'] 오류, '제품디자이너'로 히트)
  "UX/UI 디자이너":    "K000000890", // UX·UI디자이너 (L01['UX디자이너'] 오류, 'UI디자이너'로 히트)
  "포토그래퍼":        "K000001007", // 사진작가 및 사진사 (L01['포토그래퍼'] 검색 불가)
  "무역전문가":        "K000000918", // 무역사무원 (L01['무역전문가'] 오류, '무역사무원'으로 히트)
  "은행원":            "K000001136", // 은행사무원 (L01['은행원', '금융사무원'] 오류, '은행사무원'으로 히트)
  // ── 3차 추가 (2026-05-25) — migration 050 신규 직업 occ_code 확정 ──
  // L01 자동 검색 시 오매핑 위험 또는 직접 지정이 더 안전한 직업
  "로봇공학자":        "K000000860", // 로봇공학기술자 (서비스명 '로봇 엔지니어'와 동일 코드, 오매핑 방지)
};

// ─── Supabase 클라이언트 (service_role) ─────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ─── 유틸: API 지연 ──────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── 유틸: XML 단일 태그 값 추출 ────────────────────────────
function extractTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(re);
  return match ? match[1].trim() : null;
}

// ─── 유틸: XML 반복 태그 값 배열 추출 ───────────────────────
function extractAllTags(xml: string, tag: string): string[] {
  const re     = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const result: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    result.push(m[1].trim());
  }
  return result;
}

// ─── 유틸: XML <outerTag>...</outerTag> 블록 배열 추출 ──────
function extractAllBlocks(xml: string, outerTag: string): string[] {
  const re     = new RegExp(`<${outerTag}>([\\s\\S]*?)<\\/${outerTag}>`, "gi");
  const result: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    result.push(m[1].trim());
  }
  return result;
}

// ─── API: L01 직업 목록 검색 ────────────────────────────────
async function fetchJobList(keyword: string): Promise<Goyo24JobListItem[]> {
  const params = new URLSearchParams({
    authKey:    OCCUPATION_API_KEY!,
    returnType: "XML",
    target:     "JOBCD",
    srchType:   "K",
    keyword:    keyword,
    pageIndex:  "1",
    pageSize:   "10",
  });

  // 인증키 포함 URL 출력 금지 — endpoint만 로깅
  const endpoint = `${API_BASE}/callOpenApiSvcInfo212L01.do`;
  const response = await fetch(`${endpoint}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`L01 HTTP ${response.status}`);
  }

  const xml = await response.text();

  // 오류 응답 확인 (<error> 또는 <message>)
  const errMsg = extractTag(xml, "error") ?? extractTag(xml, "message");
  if (errMsg) {
    throw new Error(`L01 API 오류: ${errMsg}`);
  }

  // <jobList> 블록 반복 파싱
  const blocks = extractAllBlocks(xml, "jobList");
  return blocks.map((block) => ({
    jobClcd:   extractTag(block, "jobClcd")   ?? "",
    jobClcdNM: extractTag(block, "jobClcdNM") ?? "",
    jobCd:     extractTag(block, "jobCd")     ?? "",
    jobNm:     extractTag(block, "jobNm")     ?? "",
  })).filter((item) => item.jobCd.startsWith("K"));
}

// ─── API: D01 직업 상세 조회 ─────────────────────────────────
async function fetchJobDetail(jobCd: string): Promise<Goyo24D01ParsedData> {
  const params = new URLSearchParams({
    authKey:    OCCUPATION_API_KEY!,
    returnType: "XML",
    target:     "JOBDTL",
    jobGb:      "1",
    jobCd:      jobCd,
    dtlGb:      "1",
  });

  const endpoint = `${API_BASE}/callOpenApiSvcInfo212D01.do`;
  const response = await fetch(`${endpoint}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`D01 HTTP ${response.status}`);
  }

  const xml = await response.text();

  // 오류 응답 확인
  const errMsg = extractTag(xml, "error") ?? extractTag(xml, "message");
  if (errMsg) {
    throw new Error(`D01 API 오류: ${errMsg}`);
  }

  // 루트 <jobSum> 내부 파싱
  const relMajorBlocks = extractAllBlocks(xml, "relMajorList");
  const relMajorList: Goyo24RelMajor[] = relMajorBlocks.map((block) => ({
    majorCd: extractTag(block, "majorCd") ?? "",
    majorNm: extractTag(block, "majorNm") ?? "",
  })).filter((m) => m.majorNm.length > 0);

  const jobSatisRaw = extractTag(xml, "jobSatis");

  return {
    jobCd,
    jobLrclNm:   extractTag(xml, "jobLrclNm")  ?? undefined,
    jobMdclNm:   extractTag(xml, "jobMdclNm")  ?? undefined,
    jobSmclNm:   extractTag(xml, "jobSmclNm")  ?? undefined,
    sal:         extractTag(xml, "sal")         ?? undefined,
    jobSatis:    jobSatisRaw ? parseFloat(jobSatisRaw) : undefined,
    jobProspect: extractTag(xml, "jobProspect") ?? undefined,
    relMajorList,
  };
}

// ─── 파싱: sal 텍스트 → 임금 숫자 ───────────────────────────
function parseSalary(salRaw: string | undefined): ParsedSalary {
  if (!salRaw) return { surveyYear: null, lower: null, median: null, upper: null };

  // 예: "조사년도:2023년, 임금 하위(25%) 5000만원, 평균(50%) 6550만원, 상위(25%) 8625만원"
  const re = /조사년도:(\d+)년.*하위\(25%\)\s*(\d+)만원.*평균\(50%\)\s*(\d+)만원.*상위\(25%\)\s*(\d+)만원/;
  const m  = salRaw.match(re);
  if (!m) return { surveyYear: null, lower: null, median: null, upper: null };

  return {
    surveyYear: parseInt(m[1], 10),
    lower:      parseInt(m[2], 10),
    median:     parseInt(m[3], 10),
    upper:      parseInt(m[4], 10),
  };
}

// ─── 파싱: jobProspect → 레이블 추출 ────────────────────────
// D01 형식: "증가(44%) 현상유지(31%) 감소(24%)"
// → 가장 비율이 높은 항목의 레이블 반환
function parseProspectLabel(prospectRaw: string | undefined): ProspectLabel | null {
  if (!prospectRaw) return null;

  // 패턴 매핑: 원문 키워드 → 레이블
  const patterns: Array<[RegExp, ProspectLabel]> = [
    [/증가\((\d+)%\)/,      "증가"],
    [/다소\s*증가\((\d+)%\)/, "다소 증가"],
    [/현상\s*유지\((\d+)%\)|유지\((\d+)%\)/, "유지"],
    [/다소\s*감소\((\d+)%\)/, "다소 감소"],
    [/감소\((\d+)%\)/,      "감소"],
  ];

  let bestLabel: ProspectLabel | null = null;
  let bestRatio = -1;

  for (const [re, label] of patterns) {
    const m = prospectRaw.match(re);
    if (m) {
      const ratio = parseInt(m[1] ?? m[2] ?? "0", 10);
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestLabel = label;
      }
    }
  }

  return bestLabel;
}

// ─── 매핑: 꿈따라 직업명 → 고용24 jobCd 최적 후보 선택 ──────
// 전략: 검색 결과 중 이름 유사도가 가장 높은 항목 선택
function selectBestJobCd(
  nameKo:    string,
  candidates: Goyo24JobListItem[],
): Goyo24JobListItem | null {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  // 정확히 일치하는 항목 우선
  const exact = candidates.find(
    (c) => c.jobNm === nameKo || c.jobClcdNM === nameKo
  );
  if (exact) return exact;

  // 포함 관계 (jobNm에 nameKo가 포함되거나, nameKo에 jobNm이 포함)
  const partial = candidates.find(
    (c) =>
      c.jobNm.includes(nameKo) ||
      nameKo.includes(c.jobNm) ||
      c.jobClcdNM.includes(nameKo) ||
      nameKo.includes(c.jobClcdNM)
  );
  if (partial) return partial;

  // 후보가 여럿이면 첫 번째 반환 (수동 검수 대상 표시됨)
  return candidates[0];
}

// ─── 메인 실행 ───────────────────────────────────────────────
async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("고용24 직업정보 동기화 스크립트");
  console.log(`모드: ${IS_DRY_RUN ? "🔍 DRY-RUN (upsert 없음)" : "🚀 실제 실행"}`);
  console.log("=".repeat(60));

  // 1. occupation_master 목록 조회
  const { data: masters, error: masterErr } = await supabase
    .from("occupation_master")
    .select("id, name_ko, slug, legacy_occupation_id")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (masterErr) {
    console.error("❌ occupation_master 조회 실패:", masterErr.message);
    process.exit(1);
  }

  if (!masters || masters.length === 0) {
    console.warn("⚠️  occupation_master에 is_active=true 직업이 없습니다.");
    return;
  }

  console.log(`\n직업 수: ${masters.length}개\n`);

  const results: SyncResult[] = [];

  for (let i = 0; i < masters.length; i++) {
    const master = masters[i];
    const progress = `[${i + 1}/${masters.length}]`;
    console.log(`${progress} ${master.name_ko}`);

    try {
      // 2-0. GOYO24_UNSUPPORTED 직업 — goyo24 섹션 없이 운영
      if (GOYO24_UNSUPPORTED.has(master.name_ko)) {
        console.log(`  → goyo24 미지원 직업 skip (섹션 없이 운영)`);
        results.push({ occupationId: master.id, nameKo: master.name_ko, status: "skipped", reason: "unsupported" });
        continue;
      }

      // 2-A. MANUAL_MAPPING 우선 확인 (L01 API 호출 없이 바로 D01)
      let resolvedJobCd: string | null = MANUAL_MAPPING[master.name_ko] ?? null;
      let resolvedJobNm: string | null = null;
      let isManual = false;

      if (resolvedJobCd) {
        console.log(`  → 수동 매핑 적용: ${resolvedJobCd} (L01 검색 생략)`);
        isManual = true;
      } else {
        // 2-B. L01 목록 API 자동 검색
        await sleep(REQUEST_DELAY_MS);
        let candidates: Goyo24JobListItem[] = [];
        try {
          candidates = await fetchJobList(master.name_ko);
        } catch (e) {
          // 검색 실패 시 더 짧은 키워드로 재시도
          const shortKeyword = master.name_ko.replace(/\s*(개발자|엔지니어|전문가|관리자)$/, "").trim();
          if (shortKeyword !== master.name_ko) {
            await sleep(REQUEST_DELAY_MS);
            candidates = await fetchJobList(shortKeyword);
          } else {
            throw e;
          }
        }

        // 3. 최적 후보 선택
        const best = selectBestJobCd(master.name_ko, candidates);

        if (!best) {
          console.log(`  ⏭️  매핑 실패 — 고용24 검색 결과 없음`);
          results.push({
            occupationId: master.id,
            nameKo:       master.name_ko,
            status:       "skipped",
            reason:       "고용24 검색 결과 없음",
          });
          continue;
        }

        resolvedJobCd = best.jobCd;
        resolvedJobNm = best.jobNm;

        // 후보가 여럿이면 수동 검수 필요 표시
        const needsReview = candidates.length > 1;
        console.log(
          `  → 자동 매핑: ${best.jobNm} (${best.jobCd})` +
          (needsReview ? ` ⚠️  후보 ${candidates.length}개 — 수동 검수 권장` : "")
        );
      }

      // 4. D01 상세 API 호출
      // resolvedJobCd는 이 지점에서 반드시 non-null
      // (MANUAL_MAPPING 또는 L01 자동 매핑 중 하나에서 설정됨.
      //  best === null인 경우 위에서 continue로 처리됨)
      await sleep(REQUEST_DELAY_MS);
      const detail = await fetchJobDetail(resolvedJobCd!);

      // 5. 파싱
      const salary         = parseSalary(detail.sal);
      const prospectLabel  = parseProspectLabel(detail.jobProspect);
      const relatedMajors  = detail.relMajorList
        .map((m) => m.majorNm)
        .slice(0, MAX_MAJORS);

      console.log(
        `  임금: ${salary.median != null ? salary.median + "만원(중위)" : "없음"}` +
        ` | 만족도: ${detail.jobSatis ?? "없음"}` +
        ` | 전망: ${prospectLabel ?? "추출불가"}` +
        ` | 관련학과: ${relatedMajors.length}개`
      );

      // 6. dry-run이면 upsert 건너뜀
      if (IS_DRY_RUN) {
        results.push({
          occupationId:   master.id,
          nameKo:         master.name_ko,
          status:         "success",
          goyo24JobCd:    resolvedJobCd,
          goyo24JobName:  detail.jobSmclNm ?? resolvedJobNm ?? resolvedJobCd,
          reason:         `dry-run — upsert 건너뜀${isManual ? " (수동 매핑)" : ""}`,
        });
        continue;
      }

      // 7. upsert
      const upsertData: OccupationGoyo24ProfileUpsert = {
        occupation_id:     master.id,
        goyo24_occ_code:   resolvedJobCd,
        goyo24_job_name:   detail.jobSmclNm ?? resolvedJobNm ?? resolvedJobCd,
        salary_raw:        detail.sal        ?? null,
        salary_lower:      salary.lower,
        salary_median:     salary.median,
        salary_upper:      salary.upper,
        salary_survey_year: salary.surveyYear,
        job_satisfaction:  detail.jobSatis   ?? null,
        prospect_raw:      detail.jobProspect ?? null,
        prospect_label:    prospectLabel,
        related_majors:    relatedMajors,
        source:            "goyo24",
        synced_at:         new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase
        .from("occupation_goyo24_profile")
        .upsert(upsertData, { onConflict: "occupation_id" });

      if (upsertErr) {
        throw new Error(`upsert 실패: ${upsertErr.message}`);
      }

      console.log(`  ✅ upsert 완료`);
      results.push({
        occupationId:   master.id,
        nameKo:         master.name_ko,
        status:         "success",
        goyo24JobCd:    resolvedJobCd,
        goyo24JobName:  detail.jobSmclNm ?? resolvedJobNm ?? resolvedJobCd,
      });

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ 오류: ${errMsg}`);
      results.push({
        occupationId: master.id,
        nameKo:       master.name_ko,
        status:       "failed",
        error:        errMsg,
      });
    }
  }

  // ─── 최종 보고 ────────────────────────────────────────────
  const succeeded = results.filter((r) => r.status === "success");
  const skipped   = results.filter((r) => r.status === "skipped");
  const failed    = results.filter((r) => r.status === "failed");

  console.log("\n" + "=".repeat(60));
  console.log("실행 결과 요약");
  console.log("=".repeat(60));
  console.log(`✅ 성공: ${succeeded.length}개`);
  console.log(`⏭️  스킵: ${skipped.length}개`);
  console.log(`❌ 실패: ${failed.length}개`);
  console.log(`총계:    ${results.length}개`);

  if (skipped.length > 0) {
    console.log("\n[스킵 목록 — 수동 매핑 검토 필요]");
    for (const r of skipped) {
      console.log(`  • ${r.nameKo}: ${r.reason ?? ""}`);
    }
  }

  if (failed.length > 0) {
    console.log("\n[실패 목록]");
    for (const r of failed) {
      console.log(`  • ${r.nameKo}: ${r.error ?? ""}`);
    }
  }

  if (IS_DRY_RUN) {
    console.log("\n[DRY-RUN 완료 — 실제 DB 변경 없음]");
    console.log("실제 실행: npx tsx scripts/sync_goyo24_occupations.ts");
  }

  console.log("\n완료");
}

main().catch((err) => {
  console.error("치명적 오류:", err);
  process.exit(1);
});
