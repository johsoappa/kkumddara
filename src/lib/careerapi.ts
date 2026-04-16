// ====================================================
// 커리어넷 Open API 유틸리티
//
// [공식 문서] https://www.career.go.kr/cnet/openapi/introduce.do
// [엔드포인트] https://www.career.go.kr/cnet/openapi/getOpenApi
//
// [필수 환경변수]
//   NEXT_PUBLIC_CAREER_API_KEY — 커리어넷 API 키
//   발급: https://www.career.go.kr/cnet/openapi/introduce.do (회원가입 후 신청)
//   등록: .env.local + Vercel Dashboard → Environment Variables
//
// [현재 상태]
//   ⚠ API 키 미발급 — 키 등록 후 실제 동작 가능
// ====================================================

const API_BASE = "https://www.career.go.kr/cnet/openapi/getOpenApi";
const API_KEY  = process.env.NEXT_PUBLIC_CAREER_API_KEY ?? "";

// ── 응답 타입 ──────────────────────────────────────────

/** 커리어넷 직업 목록 단일 항목 */
export interface CareerJobRaw {
  jobCd:   string;  // 직업 코드 (고유 식별자)
  jobNm:   string;  // 직업명
  jobGbn:  string;  // 직업 대분류명
  jobEng?: string;  // 영문명 (선택)
}

/** 정제된 직업 데이터 (Supabase 저장용) */
export interface CareerJobNormalized {
  id:          string;  // 슬러그 (jobCd 기반)
  career_code: string;  // 원본 jobCd
  name:        string;  // 직업명
  category:    string;  // 대분류
  description: string;  // 기본 설명 (careerapi에서 없으면 기본값)
  emoji:       string;  // 카테고리 기반 자동 매핑
  source:      "careerapi";
}

// ── 카테고리 → 이모지 매핑 ─────────────────────────────
const CATEGORY_EMOJI: Record<string, string> = {
  "경영·회계·사무":     "📊",
  "금융·보험":          "💰",
  "교육·연구·예술·스포츠": "🎓",
  "법률·경찰·소방·교도·국방": "⚖️",
  "보건·의료":          "🏥",
  "사회복지·종교":      "🤝",
  "문화·예술·디자인·방송": "🎨",
  "운전·운송":          "🚗",
  "영업·판매·무역":     "📈",
  "경비·청소":          "🔒",
  "음식서비스":         "🍳",
  "건설":               "🏗️",
  "기계":               "⚙️",
  "재료":               "🔩",
  "화학":               "🧪",
  "섬유·의복":          "👕",
  "전기·전자":          "⚡",
  "정보통신":           "💻",
  "식품가공":           "🥘",
  "인쇄·목재·가구·공예": "🪵",
  "환경·에너지·안전":   "🌿",
  "농림어업":           "🌾",
};

function getEmojiForCategory(category: string): string {
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (category.includes(key.substring(0, 3))) return emoji;
  }
  return "💼";
}

/** jobCd → URL-safe 슬러그 변환 */
function toSlug(jobCd: string): string {
  return `job-${jobCd.replace(/\s+/g, "-").toLowerCase()}`;
}

// ── API 호출 함수 ──────────────────────────────────────

/**
 * 커리어넷 직업 목록 전체 조회
 * @returns 정제된 직업 배열
 */
export async function fetchCareerJobs(): Promise<CareerJobNormalized[]> {
  if (!API_KEY) {
    console.error("[careerapi] ❌ NEXT_PUBLIC_CAREER_API_KEY 미설정");
    throw new Error("커리어넷 API 키가 설정되지 않았습니다. .env.local에 NEXT_PUBLIC_CAREER_API_KEY를 추가해 주세요.");
  }

  const url = `${API_BASE}?apiKey=${API_KEY}&svcType=api&svcCode=JOB&contentType=json`;

  let raw: CareerJobRaw[];
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const json = await res.json();

    // 커리어넷 응답 구조: { dataSearch: { content: [...] } }
    raw = json?.dataSearch?.content ?? [];
    if (!Array.isArray(raw) || raw.length === 0) {
      console.warn("[careerapi] ⚠ 응답 데이터가 비어 있습니다:", json);
      return [];
    }
  } catch (err) {
    console.error("[careerapi] ❌ API 호출 실패:", err);
    throw err;
  }

  console.log(`[careerapi] ✅ ${raw.length}개 직업 수신`);

  return raw.map((job): CareerJobNormalized => ({
    id:          toSlug(job.jobCd),
    career_code: job.jobCd,
    name:        job.jobNm,
    category:    job.jobGbn ?? "기타",
    description: `${job.jobNm}에 대한 정보입니다.`,  // 상세 API 연동 전 기본값
    emoji:       getEmojiForCategory(job.jobGbn ?? ""),
    source:      "careerapi",
  }));
}

/**
 * 직업 코드로 상세 정보 조회 (옵션 — 상세 API 제공 시 사용)
 * 현재는 기본값 반환 (추후 svcCode=JOBDTL 등으로 확장 가능)
 */
export async function fetchCareerJobDetail(
  jobCd: string
): Promise<{ description: string } | null> {
  if (!API_KEY) return null;

  try {
    const url = `${API_BASE}?apiKey=${API_KEY}&svcType=api&svcCode=JOBDTL&contentType=json&jobCd=${jobCd}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const detail = json?.dataSearch?.content?.[0];
    return detail ? { description: detail.work ?? "" } : null;
  } catch {
    return null;
  }
}
