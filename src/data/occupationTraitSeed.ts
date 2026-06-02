// ====================================================
// 직업별 "이 일을 할 때 자주 쓰는 힘" 프론트 정적 seed
//
// [배경]
//   occupation_traits 테이블은 content 단일 컬럼 + occupation_id(uuid) 구조라
//   display_name/child_description/parent_note를 한 행에 담기 어렵다(설계 문서 A안).
//   따라서 스키마 변경/seed INSERT 없이 프론트 정적 데이터로 먼저 제공한다.
//   key = occupation_master.legacy_occupation_id (= /explore/[id] params.id) 기준.
//
// [원칙]
//   - 초등학생·학부모 눈높이 문구
//   - 직업 강요/단정 표현 금지 ("반드시 필요", "이 직업에 맞는 아이" 등)
//   - "자주 쓰는 힘" 톤 유지
//   - 데이터 있는 직업에서만 UI 표시 (없으면 섹션 미노출)
//
// 관련 설계: docs/occupation-traits-seed-design-phase1.md
// ====================================================

export interface OccupationTraitView {
  traitCode:        string;
  displayName:      string;
  childDescription: string;
  parentNote:       string;
}

export interface OccupationTraitSet {
  occupationId:   string; // = legacy_occupation_id (/explore/[id] params.id)
  occupationName: string;
  traits:         OccupationTraitView[];
}

export const OCCUPATION_TRAIT_SEED: Record<string, OccupationTraitSet> = {
  counselor: {
    occupationId: "counselor",
    occupationName: "심리상담사",
    traits: [
      { traitCode: "empathy",       displayName: "마음을 이해하는 힘", childDescription: "친구가 어떤 마음일지 생각해보는 힘이에요.",        parentNote: "아이가 타인의 감정에 관심을 보이는지 살펴볼 수 있어요." },
      { traitCode: "listening",     displayName: "차분히 듣는 힘",   childDescription: "상대방의 말을 끊지 않고 끝까지 들어보는 힘이에요.",   parentNote: "상담·교육 계열 직업 이해에 중요한 태도예요." },
      { traitCode: "communication", displayName: "쉽게 설명하는 힘",  childDescription: "어려운 이야기를 부드럽게 말해보는 힘이에요.",        parentNote: "아이의 표현력과 생각 정리 습관을 함께 살펴볼 수 있어요." },
    ],
  },
  nutritionist: {
    occupationId: "nutritionist",
    occupationName: "영양사",
    traits: [
      { traitCode: "body_awareness", displayName: "건강을 살피는 힘",   childDescription: "음식과 건강이 어떻게 연결되는지 생각해보는 힘이에요.", parentNote: "아이가 식습관·건강·생활 리듬에 관심을 보이는지 볼 수 있어요." },
      { traitCode: "analysis",       displayName: "균형 있게 생각하는 힘", childDescription: "한 가지가 아니라 여러 가지를 함께 생각해보는 힘이에요.", parentNote: "영양·생활·상황을 함께 고려하는 태도와 연결돼요." },
      { traitCode: "planning",       displayName: "계획하는 힘",       childDescription: "무엇을 언제 어떻게 준비할지 순서대로 생각하는 힘이에요.", parentNote: "식단·일정·준비 과정을 정리하는 활동과 연결할 수 있어요." },
    ],
  },
  "product-manager": {
    occupationId: "product-manager",
    occupationName: "프로덕트 매니저",
    traits: [
      { traitCode: "problem_solving", displayName: "문제를 발견하는 힘", childDescription: "불편한 점을 보고 더 나은 방법을 찾아보는 힘이에요.",   parentNote: "일상 속 불편함을 관찰하고 개선 아이디어를 내는지 볼 수 있어요." },
      { traitCode: "planning",        displayName: "의견을 정리하는 힘", childDescription: "여러 사람의 생각을 듣고 중요한 내용을 모아보는 힘이에요.", parentNote: "기획·협업·의사소통 역량과 연결돼요." },
      { traitCode: "collaboration",   displayName: "함께 만드는 힘",    childDescription: "혼자만 하는 것이 아니라 친구들과 같이 만들어보는 힘이에요.", parentNote: "팀 활동과 프로젝트형 학습에 잘 연결돼요." },
    ],
  },
  "financial-planner": {
    occupationId: "financial-planner",
    occupationName: "재무 설계사",
    traits: [
      { traitCode: "data_sense",     displayName: "숫자와 자료를 보는 힘", childDescription: "숫자나 표를 보고 차이를 찾아보는 힘이에요.",          parentNote: "돈·계획·비교 활동에 관심을 보이는지 살펴볼 수 있어요." },
      { traitCode: "planning",       displayName: "차분히 계획하는 힘",  childDescription: "지금 필요한 것과 나중에 필요한 것을 나누어 생각하는 힘이에요.", parentNote: "목표를 세우고 순서를 정하는 습관과 연결돼요." },
      { traitCode: "responsibility", displayName: "신뢰를 지키는 힘",   childDescription: "약속한 것을 소중하게 생각하고 책임 있게 행동하는 힘이에요.", parentNote: "금융·상담 계열에서 중요한 책임감과 연결돼요." },
    ],
  },
  "life-science-researcher": {
    occupationId: "life-science-researcher",
    occupationName: "생명과학 연구원",
    traits: [
      { traitCode: "observation",     displayName: "관찰하는 힘",         childDescription: "작은 변화나 차이를 자세히 살펴보는 힘이에요.",       parentNote: "자연·생물·실험 활동에 대한 흥미와 연결돼요." },
      { traitCode: "problem_solving", displayName: "궁금한 것을 실험하는 힘", childDescription: "왜 그런지 궁금한 것을 직접 확인해보는 힘이에요.",     parentNote: "질문을 실험과 탐구로 이어가는 태도를 볼 수 있어요." },
      { traitCode: "persistence",     displayName: "기록하는 힘",         childDescription: "본 것과 알게 된 것을 차근차근 적어두는 힘이에요.",     parentNote: "탐구 과정과 결과를 정리하는 습관과 연결돼요." },
    ],
  },
  "video-director": {
    occupationId: "video-director",
    occupationName: "영상 감독",
    traits: [
      { traitCode: "creativity",      displayName: "이야기를 상상하는 힘", childDescription: "머릿속에 장면과 이야기를 떠올려보는 힘이에요.",     parentNote: "상상력·이야기 구성·표현 활동과 연결돼요." },
      { traitCode: "design_thinking", displayName: "장면을 구성하는 힘",  childDescription: "어떤 순서로 보여주면 좋을지 생각하는 힘이에요.",     parentNote: "사진·영상·발표·구성 활동에서 관찰할 수 있어요." },
      { traitCode: "collaboration",   displayName: "함께 이끄는 힘",    childDescription: "친구들과 역할을 나누고 같이 완성해보는 힘이에요.",   parentNote: "협업과 리더십을 함께 살펴볼 수 있어요." },
    ],
  },
  "physical-therapist": {
    occupationId: "physical-therapist",
    occupationName: "물리치료사",
    traits: [
      { traitCode: "body_awareness", displayName: "몸을 이해하는 힘",    childDescription: "몸이 어떻게 움직이고 회복되는지 살펴보는 힘이에요.", parentNote: "운동·건강·신체 활동에 대한 관심과 연결돼요." },
      { traitCode: "care",           displayName: "회복을 돕는 힘",     childDescription: "아픈 곳이 나아질 수 있도록 천천히 도와주는 힘이에요.", parentNote: "돌봄과 건강 분야에 대한 태도를 살펴볼 수 있어요." },
      { traitCode: "communication",  displayName: "차근차근 설명하는 힘", childDescription: "동작이나 방법을 쉽게 알려주는 힘이에요.",        parentNote: "의료·운동 분야에서 중요한 설명력과 인내심으로 이어져요." },
    ],
  },
  "sports-data-analyst": {
    occupationId: "sports-data-analyst",
    occupationName: "스포츠 데이터 분석가",
    traits: [
      { traitCode: "data_sense",  displayName: "숫자와 자료를 보는 힘", childDescription: "경기 기록이나 숫자를 보고 차이를 찾아보는 힘이에요.", parentNote: "스포츠와 데이터에 동시에 관심이 있는지 살펴볼 수 있어요." },
      { traitCode: "observation", displayName: "경기 흐름을 읽는 힘",  childDescription: "경기에서 어떤 일이 이어지는지 살펴보는 힘이에요.",   parentNote: "관찰력과 전략적 사고를 함께 볼 수 있어요." },
      { traitCode: "analysis",    displayName: "차이를 발견하는 힘",   childDescription: "비슷해 보이는 장면 속에서 다른 점을 찾아내는 힘이에요.", parentNote: "분석 활동과 스포츠 관찰 활동으로 확장할 수 있어요." },
    ],
  },
  "youth-sports-coach": {
    occupationId: "youth-sports-coach",
    occupationName: "유소년 스포츠 코치",
    traits: [
      { traitCode: "collaboration", displayName: "함께 성장시키는 힘", childDescription: "친구가 더 잘할 수 있도록 같이 도와주는 힘이에요.",     parentNote: "아이의 리더십과 돌봄 태도를 함께 살펴볼 수 있어요." },
      { traitCode: "safety",        displayName: "안전하게 지도하는 힘", childDescription: "다치지 않게 조심하면서 알려주는 힘이에요.",           parentNote: "스포츠 지도에서 중요한 안전 판단과 책임감으로 연결돼요." },
      { traitCode: "empathy",       displayName: "응원하고 격려하는 힘", childDescription: "친구가 포기하지 않도록 힘이 되는 말을 해주는 힘이에요.", parentNote: "또래 관계와 긍정적 소통 방식을 볼 수 있어요." },
    ],
  },
  "after-school-teacher": {
    occupationId: "after-school-teacher",
    occupationName: "방과후 교사",
    traits: [
      { traitCode: "communication", displayName: "쉽게 알려주는 힘",     childDescription: "내가 아는 것을 친구가 이해하기 쉽게 말하는 힘이에요.", parentNote: "설명력과 교육 활동에 대한 관심을 살펴볼 수 있어요." },
      { traitCode: "listening",     displayName: "아이의 속도를 기다리는 힘", childDescription: "친구가 천천히 해도 기다려주는 힘이에요.",          parentNote: "배려심과 인내심을 함께 볼 수 있어요." },
      { traitCode: "planning",      displayName: "활동을 준비하는 힘",   childDescription: "무엇을 하면 재미있게 배울 수 있을지 미리 생각하는 힘이에요.", parentNote: "수업 준비·놀이 기획·활동 구성 능력과 연결돼요." },
    ],
  },
};

// 같은 직업을 가리키는 다른 라우팅 id(legacy/slug) → 표준 seed key 매핑.
// 심리상담사는 진입 id가 counselor / psychologist 등으로 갈릴 수 있어 별칭으로 흡수한다.
const TRAIT_ID_ALIAS: Record<string, string> = {
  psychologist: "counselor",
};

/** occupationId(legacy id/slug)로 traits set 조회. 별칭도 흡수. 없으면 null. */
export function getOccupationTraits(occupationId: string): OccupationTraitSet | null {
  const key = OCCUPATION_TRAIT_SEED[occupationId] ? occupationId : (TRAIT_ID_ALIAS[occupationId] ?? occupationId);
  return OCCUPATION_TRAIT_SEED[key] ?? null;
}
