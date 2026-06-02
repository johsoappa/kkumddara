// ====================================================
// 명따라 결과 → "함께 살펴볼 직업" 정적 매핑
//
// [목적]
//   명따라(사주·만세력) 결과를 직업 단정이 아니라 "성향 참고 → 함께 탐색해볼 직업"으로
//   연결한다. 오행 주기운(dominant: 목/화/토/금/수)을 성향 그룹으로 매핑한다.
//
// [최신 상세 보장 — 중요]
//   /explore/[id] 는 occupation_master.legacy_occupation_id = id 인 active 행이 있을 때만
//   최신(db) 상세를 렌더하고, "미래를 그리는 참고 지표"(occupation_goyo24_profile)를 표시한다.
//   따라서 여기서 사용하는 id는 모두 아래 조건을 만족하는 것만 채택했다.
//     ① occupation_master 에 is_active = true 로 seed됨
//     ② legacy_occupation_id == id (→ /explore/[id] db 라우팅)
//     ③ occupation_goyo24_profile 보유 (→ 참고 지표 표시)
//   근거 migration:
//     - 050_add_missing_occupations_for_roadmap.sql (is_active=true, legacy==slug)
//     - 051_seed_goyo24_profiles_for_new_16_occupations.sql (goyo24)
//     - 053_seed_first_wave_occupations.sql (is_active=true, legacy==slug)
//     - 054_seed_goyo24_profiles_for_first_wave_occupations.sql (goyo24)
//   ⚠️ financial-analyst, writer, entrepreneur, teacher 등 정적 OCCUPATIONS 전용 id는
//      occupation_master/goyo24 미보유 → 구형 static 상세로 떨어지므로 사용하지 않는다.
//
// [원칙]
//   - AI 호출 없음 (정적 매핑)
//   - "사주에 맞는 직업" / "타고난 직업" 같은 단정 표현 금지
//   - 확장 직업은 정적 OCCUPATIONS에 없으므로 표시 데이터(name/emoji/description)를 직접 명시
//   - 검증되지 않은 id는 VERIFIED_IDS 필터로 렌더링 단계에서 제외
// ====================================================

export interface CareerLinkCard {
  id:          string; // /explore/[id] (= occupation_master.legacy_occupation_id)
  name:        string;
  emoji:       string;
  description: string;
  reason:      string; // 성향 연결 이유 (그룹 공통, 단정 아님)
}

interface CareerItem {
  id:          string;
  name:        string;
  emoji:       string;
  description: string;
}

interface DominantGroup {
  traitLabel: string;
  reason:     string;
  items:      CareerItem[];
}

// ① is_active=true ② legacy_occupation_id==id ③ goyo24 보유 — 3조건 모두 검증된 id 집합
// (050/051/053/054 seed 기준). 이 집합에 없는 id는 렌더링하지 않는다(방어적 필터).
const VERIFIED_IDS = new Set<string>([
  // 050 + 051 (new 16 / 기존 활성, legacy==slug, goyo24)
  "life-science-researcher", "clinical-laboratory-technologist",
  "interior-designer", "spatial-designer", "nutritionist",
  "physical-therapist", "counselor",
  // 053 + 054 (first wave, legacy==slug, goyo24)
  "climate-data-analyst", "video-director", "radiologic-technologist",
  "product-manager", "human-resources-specialist", "financial-planner",
  "after-school-teacher", "youth-worker",
]);

// 오행 주기운(한글 한 글자) → 성향 그룹 매핑 (모든 id는 VERIFIED_IDS)
const DOMINANT_GROUPS: Record<string, DominantGroup> = {
  목: {
    traitLabel: "소통·성장 성향",
    reason:     "사람과 어울리고 돕거나 가르치는 걸 좋아하는 모습이 보일 때 함께 살펴보기 좋아요.",
    items: [
      { id: "counselor",           name: "심리상담사",   emoji: "💬", description: "마음을 듣고 함께 풀어가는 일을 살펴볼 수 있어요." },
      { id: "after-school-teacher", name: "방과후 교사",  emoji: "🍎", description: "아이들의 배움과 활동을 돕는 일을 살펴볼 수 있어요." },
      { id: "youth-worker",        name: "청소년지도사", emoji: "🧭", description: "청소년의 성장과 활동을 함께하는 일을 살펴볼 수 있어요." },
    ],
  },
  화: {
    traitLabel: "표현·창의 성향",
    reason:     "표현하고 만드는 걸 즐기는 모습이 보일 때 함께 탐색해볼 수 있어요.",
    items: [
      { id: "video-director",   name: "영상 감독",       emoji: "🎬", description: "이야기를 영상으로 만들어내는 일을 살펴볼 수 있어요." },
      { id: "interior-designer", name: "인테리어 디자이너", emoji: "🛋️", description: "공간을 보기 좋고 편하게 꾸미는 일을 살펴볼 수 있어요." },
      { id: "spatial-designer",  name: "공간 디자이너",    emoji: "📐", description: "전시·공간을 기획하고 연출하는 일을 살펴볼 수 있어요." },
    ],
  },
  토: {
    traitLabel: "안정·신뢰 성향",
    reason:     "꾸준하고 차분하게 해내는 강점이 보일 때 함께 살펴보기 좋아요.",
    items: [
      { id: "nutritionist",            name: "영양사",     emoji: "🥗", description: "건강한 식단과 영양을 설계하는 일을 살펴볼 수 있어요." },
      { id: "physical-therapist",      name: "물리치료사", emoji: "💪", description: "몸의 회복과 건강을 돕는 일을 살펴볼 수 있어요." },
      { id: "radiologic-technologist", name: "방사선사",   emoji: "🩻", description: "정밀 장비로 몸 속을 살피는 일을 살펴볼 수 있어요." },
    ],
  },
  금: {
    traitLabel: "실행·추진 성향",
    reason:     "목표를 향해 추진하고 이끄는 모습이 보일 때 함께 탐색해볼 수 있어요.",
    items: [
      { id: "product-manager",            name: "프로덕트 매니저", emoji: "📋", description: "팀과 함께 제품을 기획하고 이끄는 일을 살펴볼 수 있어요." },
      { id: "human-resources-specialist", name: "인사 전문가",    emoji: "🧑‍💼", description: "사람과 조직이 잘 성장하도록 돕는 일을 살펴볼 수 있어요." },
      { id: "financial-planner",          name: "재무 설계사",    emoji: "💰", description: "돈의 계획과 미래 준비를 돕는 일을 살펴볼 수 있어요." },
    ],
  },
  수: {
    traitLabel: "탐구·분석 성향",
    reason:     "관찰하고 깊이 파고드는 탐구 성향이 보일 때 함께 살펴보기 좋아요.",
    items: [
      { id: "life-science-researcher",          name: "생명과학 연구원", emoji: "🔬", description: "생명과 건강의 원리를 탐구하는 일을 살펴볼 수 있어요." },
      { id: "clinical-laboratory-technologist", name: "임상병리사",     emoji: "🧪", description: "검사와 데이터로 건강을 살피는 일을 살펴볼 수 있어요." },
      { id: "climate-data-analyst",             name: "기후 데이터 분석가", emoji: "🌍", description: "데이터로 기후와 환경 변화를 분석하는 일을 살펴볼 수 있어요." },
    ],
  },
};

// 성향 분류가 어려울 때 안전 fallback (모두 VERIFIED_IDS, 최신 상세+참고 지표 보유)
const FALLBACK_ITEMS: CareerItem[] = [
  { id: "counselor",       name: "심리상담사",     emoji: "💬", description: "마음을 듣고 함께 풀어가는 일을 살펴볼 수 있어요." },
  { id: "nutritionist",    name: "영양사",         emoji: "🥗", description: "건강한 식단과 영양을 설계하는 일을 살펴볼 수 있어요." },
  { id: "product-manager", name: "프로덕트 매니저", emoji: "📋", description: "팀과 함께 제품을 기획하고 이끄는 일을 살펴볼 수 있어요." },
];
const FALLBACK_REASON = "다양한 직업을 가볍게 살펴보며 아이가 흥미를 보이는 방향을 함께 찾아보세요.";

const MAX_CARDS = 3;

export interface MyeonddaraCareerLinks {
  traitLabel: string | null; // fallback이면 null
  cards:      CareerLinkCard[];
  isFallback: boolean;
}

/**
 * 오행 주기운(dominant)으로 함께 살펴볼 직업 카드를 반환한다.
 * 매칭되는 그룹이 없으면 안전 fallback을 제공한다.
 * VERIFIED_IDS(최신 상세+참고 지표 검증)에 없는 id는 자동 제외된다.
 */
export function getMyeonddaraCareerLinks(
  dominant: string | null | undefined
): MyeonddaraCareerLinks {
  const group  = dominant ? DOMINANT_GROUPS[dominant.trim()] : undefined;
  const items  = group?.items ?? FALLBACK_ITEMS;
  const reason = group?.reason ?? FALLBACK_REASON;

  const cards = items
    .filter((it) => VERIFIED_IDS.has(it.id)) // 검증되지 않은 id 방어적 제외
    .map((it) => ({ ...it, reason } satisfies CareerLinkCard))
    .slice(0, MAX_CARDS);

  return {
    traitLabel: group?.traitLabel ?? null,
    cards,
    isFallback: !group,
  };
}
