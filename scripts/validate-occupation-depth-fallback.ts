// ====================================================
// validate-occupation-depth-fallback.ts
// G1.7-A2-PRE1/PRE2/A3 정적 완전성 검증
//
// [목적]
//   OCCUPATION_DEPTH_SEED를 /explore/[id]의 3차 폴백(occupation_master →
//   OCCUPATIONS → OCCUPATION_DEPTH_SEED → not-found) 데이터 원본이자
//   전 모드 공통 심화 4탭+다음미션 게이트로 안전하게 쓸 수 있는지 로컬 정적
//   검사만으로 확인한다. 네트워크·DB·환경변수 접근 없음.
//
// [G1.7-A3]
//   전체 127개 직업(OCCUPATIONS ∪ QUIZ_DATA ∪ {chef}) 전수 콘텐츠 완전성을
//   검증하도록 확장했다. 대상 목록은 이 스크립트가 직접 재계산한다(하드코딩 금지).
//
// [실행]
//   node scripts/validate-occupation-depth-fallback.ts
// ====================================================

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { OCCUPATION_DEPTH_SEED, getOccupationDepth } from "../src/data/occupationDepthSeed.ts";
import { OCCUPATIONS } from "../src/data/occupations.ts";
import { QUIZ_DATA } from "../src/data/quizData.ts";
import { DREAM_MAP_OCCUPATION_IDS } from "../src/lib/featureFlags.ts";

let failures = 0;
function check(label: string, ok: boolean, detail?: string): void {
  if (ok) {
    console.log(`PASS  ${label}`);
  } else {
    failures++;
    console.log(`FAIL  ${label}${detail ? " — " + detail : ""}`);
  }
}

const depthIds = Object.keys(OCCUPATION_DEPTH_SEED);
const staticIds = new Set(OCCUPATIONS.map((o) => o.id));
const quizIds = new Set(QUIZ_DATA.map((q) => q.occupationId));

// ── 대상 127개 재계산: OCCUPATIONS ∪ QUIZ_DATA ∪ {chef} ──
// chef는 어느 정적/퀴즈 목록에도 없고 심화 시드에만 존재하는 3차 폴백 기준 직업이라
// 별도로 합집합에 포함한다(G1.7-A1 감사 문서 §2.2 근거와 동일).
const targetIds = new Set<string>([...Array.from(staticIds), ...Array.from(quizIds), "chef"]);

console.log(`INFO  대상 ID 재계산: OCCUPATIONS ${staticIds.size} / QUIZ_DATA ${quizIds.size} / 합집합+chef ${targetIds.size}`);

// ── 1. 대상 ID 수 127개 ─────────────────────
check("대상 ID(OCCUPATIONS ∪ QUIZ_DATA ∪ {chef}) 수 = 127", targetIds.size === 127, `실제 ${targetIds.size}`);

// ── 2. 심화 콘텐츠 ID 수 127개 ─────────────────
check("OCCUPATION_DEPTH_SEED ID 수 = 127", depthIds.length === 127, `실제 ${depthIds.length}`);

// ── 3. 대상-심화 / 심화-대상 차집합 0개 ─────────────────
const targetMinusDepth = Array.from(targetIds).filter((id) => !(id in OCCUPATION_DEPTH_SEED));
check("대상 - 심화 차집합 = 0개 (대상인데 심화 시드 누락)", targetMinusDepth.length === 0, targetMinusDepth.join(", "));

const depthMinusTarget = depthIds.filter((id) => !targetIds.has(id));
check("심화 - 대상 차집합 = 0개 (대상 아닌데 심화 시드에 존재)", depthMinusTarget.length === 0, depthMinusTarget.join(", "));

// ── 4. 중복·빈 ID 0개 ─────────────────────
const emptyIds = depthIds.filter((id) => id.trim().length === 0);
check("심화 시드에 빈 ID 없음", emptyIds.length === 0, `빈 ID ${emptyIds.length}건`);

const dupCheck = new Map<string, number>();
for (const id of depthIds) dupCheck.set(id, (dupCheck.get(id) ?? 0) + 1);
const dups = Array.from(dupCheck.entries()).filter(([, n]) => n > 1);
check("심화 시드에 중복 ID 없음", dups.length === 0, dups.map(([id]) => id).join(", "));

// ── 5. 기존 4개 심화 직업 ID 및 콘텐츠 구조 보존 ──
const EXPECTED_EXISTING = ["webtoon-artist", "creator", "veterinarian", "chef"];
const missingExisting = EXPECTED_EXISTING.filter((id) => !(id in OCCUPATION_DEPTH_SEED));
check(
  "기존 4개 심화 직업(webtoon-artist/creator/veterinarian/chef) 유지",
  missingExisting.length === 0,
  missingExisting.join(", ")
);

const chefInStatic = staticIds.has("chef");
check(
  "chef는 OCCUPATIONS(정적)에 존재하지 않음 — 3차 폴백 회귀 기준 직업 자격 유지",
  !chefInStatic,
  chefInStatic ? "OCCUPATIONS에 chef가 추가되어 회귀 기준 직업으로 부적합해짐" : undefined
);

// ── 6. 모든 ID에 4탭(하는 일/필요한 힘/하루 모습/해보기) + 다음 미션 + 부모 질문 필드 존재 ──
const PLACEHOLDER_PATTERNS = ["곧 소개", "준비 중", "준비중", "TODO", "todo", "채워", "채울 예정"];

for (const [id, depth] of Object.entries(OCCUPATION_DEPTH_SEED)) {
  check(`[${id}] occupationName 비어있지 않음`, depth.occupationName.trim().length > 0);
  check(`[${id}] whatTheyDo(하는 일) 비어있지 않음`, depth.whatTheyDo.trim().length > 0);
  check(`[${id}] goodFit(필요한 힘) 비어있지 않음`, depth.goodFit.trim().length > 0);
  check(`[${id}] dayInLife(하루 모습) 비어있지 않음`, depth.dayInLife.trim().length > 0);
  check(`[${id}] missions(해보기) 최소 1개`, depth.missions.length >= 1);
  check(
    `[${id}] missions 각 항목의 label/text 비어있지 않음`,
    depth.missions.every((m) => m.label.trim().length > 0 && m.text.trim().length > 0)
  );
  check(`[${id}] nextMission(다음 미션) 비어있지 않음`, depth.nextMission.trim().length > 0);
  check(`[${id}] parentQuestions 최소 1개`, depth.parentQuestions.length >= 1);

  const fieldsToScan: Array<[string, string]> = [
    ["whatTheyDo", depth.whatTheyDo],
    ["goodFit", depth.goodFit],
    ["dayInLife", depth.dayInLife],
    ["nextMission", depth.nextMission],
    ...depth.missions.map((m, i): [string, string] => [`missions[${i}].text`, m.text]),
  ];
  for (const [fieldName, value] of fieldsToScan) {
    const hit = PLACEHOLDER_PATTERNS.find((p) => value.includes(p));
    check(`[${id}] ${fieldName}에 placeholder 문구 없음`, !hit, hit ? `"${hit}" 발견` : undefined);
  }
}

// ── 7. Dream Map 화이트리스트는 이번 변경과 무관하게 그대로인지(정책 분리 확인) ──
check(
  "DREAM_MAP_OCCUPATION_IDS는 webtoon-artist 1개만 유지(전수 확장과 무관)",
  DREAM_MAP_OCCUPATION_IDS.length === 1 && DREAM_MAP_OCCUPATION_IDS[0] === "webtoon-artist",
  JSON.stringify(DREAM_MAP_OCCUPATION_IDS)
);

// ── 8. 미존재 ID는 depth-only 대상으로 오인되지 않음(not-found 유지) ──
const nonExistentId = "존재하지-않는-테스트-id-g1-7-a3";
check(
  "미존재 ID는 getOccupationDepth()에서 null 반환 — depth-only/not-found 오인 방지",
  getOccupationDepth(nonExistentId) === null,
  String(getOccupationDepth(nonExistentId))
);

// ── 9. 심화 4탭 게이트가 isDreamMapActive에 종속되지 않음(정적 소스 스캔) ──
// 런타임 렌더 로직 자체를 이 스크립트가 실행할 수는 없으므로, page.tsx 소스 텍스트로
// 근사 확인한다. 실제 렌더 동작은 브라우저 QA로 별도 확인한다.
const __dirname = dirname(fileURLToPath(import.meta.url));
const pageTsxPath = join(__dirname, "..", "src", "app", "explore", "[id]", "page.tsx");
const pageSource = readFileSync(pageTsxPath, "utf-8");

check(
  "OccupationDepthSection(구 컴포넌트) 참조가 page.tsx에 남아있지 않음",
  !pageSource.includes("OccupationDepthSection")
);
check(
  "OccupationDepthTabs(신규 4탭 컴포넌트)가 page.tsx에서 사용됨",
  pageSource.includes("OccupationDepthTabs")
);
check(
  "dreamMapDepth는 getOccupationDepth() 결과를 조건 없이 그대로 대입받음(게이트 분리)",
  /const\s+dreamMapDepth\s*=\s*getOccupationDepth\(/.test(pageSource)
);
check(
  "dreamMapDepth 계산에 isDreamMapActive 삼항 게이트 패턴이 남아있지 않음",
  !/isDreamMapActive\s*\?\s*getOccupationDepth/.test(pageSource)
);
check(
  "chef의 '곧 소개할 예정' 임시 안내 문구가 page.tsx 소스에 남아있지 않음",
  !pageSource.includes("곧 자세히 소개할 예정")
);
check(
  "OccupationDepthTabs에 nextMission prop이 전달됨(다음 미션 5번째 축 배선)",
  /OccupationDepthTabs[\s\S]{0,400}?nextMission=/.test(pageSource)
);

console.log("");
console.log(
  "INFO  9번 검사는 소스 텍스트 패턴 매칭 기반 근사 검증이며, 실제 렌더 동작은 브라우저 QA로 별도 확인함."
);

console.log("");
if (failures === 0) {
  console.log(`VALIDATE_OCCUPATION_DEPTH_FALLBACK_PASS (심화 시드 ${depthIds.length}건 / 대상 ${targetIds.size}건 전수 검사 완료)`);
  process.exitCode = 0;
} else {
  console.log(`VALIDATE_OCCUPATION_DEPTH_FALLBACK_FAIL (${failures}건 실패)`);
  process.exitCode = 1;
}
