// ====================================================
// XR 수의사 시나리오 데이터 — 나침반 v0.3 + 새싹 v0.3
//
// - 이 파일은 순수 데이터 + 순수 함수만 담는다 (React/브라우저 의존 없음)
// - G2.2-R1: 참고 브랜치(goal/dream-map-qa-20260830, cf277c8)의 수의사 v0.3
//   시나리오 문구·축 매핑·집계 로직(C 동점 규칙)을 그대로 이식했다. 원본은
//   공용 ../scenarioEngine 모듈을 가져다 썼지만, 그 모듈은 현재 main에는
//   존재하지 않는다 — 현재 main의 chef/scenario.ts가 이미 같은 공용 로직을
//   파일별로 자체 보유하는 방식으로 진화했으므로, 이 파일도 동일한 패턴을
//   따라 자체 완결형으로 둔다(집계 로직·피드백 문구는 원본과 한 글자도
//   다르지 않다 — chef/scenario.ts에 남아있는 동일 문구와 대조 가능).
// - 수의사 원본 시나리오에는 select(선택형) 상호작용만 존재한다 — 드래그(place)·
//   순서 교체(order)형은 요리사 G2.1에서 추가된 것으로 수의사 v0.3에는 없으므로
//   이식하지 않는다(작업지시서 3-1: "실제 존재하는 유형만 이식").
// - 실제 진료·처방·진단명은 다루지 않는다. 관찰·기록·소통·협업 행동만 다룬다.
// ====================================================

export type Mode = "compass" | "sprout";

export const SCENARIO_VERSIONS: Record<Mode, string> = {
  compass: "v0.3",
  sprout: "v0.3",
};

/** 지점별 카메라 연출 단계 (좌표 매핑은 VetScene이 담당) */
export type CameraStage = "overview" | "approach" | "search" | "survey" | "plating";

export type AxisId = "axis1" | "axis2" | "axis3" | "axis4" | "axis5";

export interface Choice {
  id: string; // choice_id (예: p1_a, s1_a)
  label: string; // 버튼 문구
  axis: AxisId; // 판단 축 태그 (고정 — 새싹모드에서는 이벤트 기록용, 화면 노출 금지)
}

export interface ChoicePoint {
  point: number; // 지점 번호
  title: string;
  situation?: string; // 새싹모드에는 상황 문구가 없어 선택적
  reaction: string; // 선택 후 공통 반응
  cameraStage: CameraStage;
  choices: Choice[];
}

/** 사용자의 선택 기록 1건 — 지점 순서(1→N) 보존이 C 규칙 역순 탐색의 전제 */
export interface ChoiceRecord {
  point: number;
  choiceId: string;
  axis: AxisId;
}

// 진료·판단을 대신하지 않는다는 점을 별도로 못박는 직업 특화 고지
// (RESULT_NOTICE는 "적성 검사가 아니다"는 의미라 이것과 별개로 유지한다)
export const VET_SAFETY_NOTICE =
  "이 체험은 직업 이해를 위한 활동이며 실제 진료나 판단을 대신하지 않습니다.";

// ---------- 공통 시작 (선택 지점 진입 전) ----------

export const INTRO = {
  narration: "오늘은 작은 동물병원에서 첫 상담을 시작하는 날이에요.",
  senior:
    "반가워요. 오늘은 제가 옆에서 함께할게요. 진찰과 처치는 제가 맡을 테니, 우리는 보호자 이야기를 듣고 관찰과 기록을 해봐요.",
  firstOrder: "첫 보호자가 도착했어요. 반려동물이 평소와 다르다고 해요.",
} as const;

// ---------- 나침반모드 선택 지점 5개 (v0.3) ----------

export const CHOICE_POINTS: ChoicePoint[] = [
  {
    point: 1,
    title: "무엇부터 확인할까?",
    situation: "보호자가 \"아이가 요즘 밥을 잘 안 먹어요\"라며 이야기를 시작해요.",
    reaction: "좋아요. 그 방법으로 오늘 상담을 시작해볼게요.",
    cameraStage: "approach",
    choices: [
      { id: "p1_a", label: "차분히 관찰부터 시작한다", axis: "axis1" },
      { id: "p1_b", label: "다른 확인 순서를 생각해본다", axis: "axis4" },
      { id: "p1_c", label: "동물과 보호자를 함께 살펴본다", axis: "axis5" },
    ],
  },
  {
    point: 2,
    title: "이야기를 어떻게 들을까?",
    situation: "보호자가 최근 며칠 사이 달라진 점을 계속 이야기하고 있어요.",
    reaction: "좋아요. 그 방식으로 이야기를 정리해볼게요.",
    cameraStage: "search",
    choices: [
      { id: "p2_a", label: "선배 수의사에게 함께 들어달라고 한다", axis: "axis2" },
      { id: "p2_b", label: "중요한 내용을 순서대로 적어둔다", axis: "axis3" },
      { id: "p2_c", label: "다른 기록 방법을 생각해본다", axis: "axis4" },
    ],
  },
  {
    point: 3,
    title: "기록이 끝나기 전, 다음 순서가 도착했다",
    situation: "기록이 끝나기 전에 다음 순서의 보호자와 동물이 도착했어요.",
    reaction: "좋아요. 그 판단으로 다음 순서를 이어가볼게요.",
    cameraStage: "survey",
    choices: [
      { id: "p3_a", label: "전체 상황을 먼저 살핀다", axis: "axis5" },
      { id: "p3_b", label: "두 상황을 비교해본다", axis: "axis3" },
      { id: "p3_c", label: "선배와 역할을 나눈다", axis: "axis2" },
    ],
  },
  {
    point: 4,
    title: "관찰한 내용을 어떻게 정리할까?",
    situation: "이제 관찰하고 들은 내용을 진료기록에 정리할 차례예요.",
    reaction: "좋아요. 선택한 방식으로 기록을 정리해볼게요.",
    cameraStage: "plating",
    choices: [
      { id: "p4_a", label: "바로 정리를 시작한다", axis: "axis1" },
      { id: "p4_b", label: "새로운 정리 방법을 시도한다", axis: "axis4" },
      { id: "p4_c", label: "기록 전체를 다시 살펴본다", axis: "axis5" },
    ],
  },
  {
    point: 5,
    title: "보호자에게 다음 절차를 안내할 차례",
    situation: "보호자가 다음에 무엇을 확인해야 하는지 물어봐요.",
    reaction: "좋아요. 정리한 내용으로 다음 절차를 안내해볼게요.",
    cameraStage: "plating", // 지점4 시점 유지 (요리사 v1.1과 동일한 카메라 패턴)
    choices: [
      { id: "p5_a", label: "정리한 기록을 다시 확인한다", axis: "axis1" },
      { id: "p5_b", label: "안내할 순서를 다시 정리한다", axis: "axis3" },
      { id: "p5_c", label: "선배에게 안내 내용을 확인받는다", axis: "axis2" },
    ],
  },
];

// ---------- 새싹모드 선택 지점 3개 (v0.3 — 초3~4 축소판) ----------
// 축 태그는 이벤트 기록용으로만 사용한다. 화면 노출 금지.

export const SPROUT_POINTS: ChoicePoint[] = [
  {
    point: 1,
    title: "무엇부터 볼까?",
    reaction: "좋아요. 이제 이야기를 들어볼까요?",
    cameraStage: "approach",
    choices: [
      { id: "s1_a", label: "보호자 이야기를 먼저 듣는다", axis: "axis1" },
      { id: "s1_b", label: "동물을 먼저 살펴본다", axis: "axis5" },
    ],
  },
  {
    point: 2,
    title: "중요한 내용을 기록하자",
    reaction: "좋아요. 필요한 내용을 잘 기록했어요.",
    cameraStage: "search",
    choices: [
      { id: "s2_a", label: "선배에게 물어본다", axis: "axis2" },
      { id: "s2_b", label: "하나씩 적어본다", axis: "axis3" },
    ],
  },
  {
    point: 3,
    title: "보호자에게 안내하자",
    reaction: "좋아요. 첫 상담을 잘 안내했어요.",
    cameraStage: "plating",
    choices: [
      { id: "s3_a", label: "익숙한 방법으로 안내한다", axis: "axis4" },
      { id: "s3_b", label: "새롭게 안내해본다", axis: "axis4" },
    ],
  },
];

/** 모드별 선택 지점 배열 — 진행 로직은 이 매핑만 참조한다 */
export const MODE_POINTS: Record<Mode, ChoicePoint[]> = {
  compass: CHOICE_POINTS,
  sprout: SPROUT_POINTS,
};

// ---------- 새싹모드 종료 화면 (성취 중심 — 판단 축 결과 미노출) ----------

export const SPROUT_COMPLETE = {
  title: "첫 상담 완료!",
  congrats: "축하해요. 오늘 동물병원 체험을 끝냈어요!",
  summary:
    "보호자 이야기를 듣고 필요한 것을 직접 선택해봤어요. 내가 고른 방법으로 첫 상담도 마무리했어요.",
  nextAction: "이제 수의사의 일을 더 알아보는 다음 미션으로 가볼까요?",
} as const;

// ---------- 피드백 템플릿 5종 (최다 축 결과 — 나침반 전용, 직업 비의존) ----------
// chef/scenario.ts의 AXIS_FEEDBACK과 문구가 동일하다 — 원본이 공용
// scenarioEngine에서 가져다 쓰던 직업 비의존 텍스트를 그대로 유지했다.

export const AXIS_FEEDBACK: Record<AxisId, { title: string; body: string }> = {
  axis1: {
    title: "언제 움직일지 먼저 살펴보는 스타일",
    body: "이번 체험에서는 바로 시작할지 먼저 확인할지 판단하는 선택이 자주 나타났어요. 상황의 속도와 필요한 정보를 함께 살피려는 모습이 보였어요.",
  },
  axis2: {
    title: "함께하는 방법을 생각하는 스타일",
    body: "이번 체험에서는 혼자 해볼지 도움을 요청할지 생각하는 선택이 자주 나타났어요. 함께 일할 때 역할과 도움을 어떻게 나눌지 살펴보는 모습이 보였어요.",
  },
  axis3: {
    title: "해야 할 순서를 생각하는 스타일",
    body: "이번 체험에서는 순서대로 할지 우선순위를 바꿀지 판단하는 선택이 자주 나타났어요. 해야 할 일을 정리하고 상황에 맞게 흐름을 조절하려는 모습이 보였어요.",
  },
  axis4: {
    title: "어떤 방법으로 할지 생각하는 스타일",
    body: "이번 체험에서는 익숙한 방법과 새로운 방법 사이에서 방식을 고르는 선택이 자주 나타났어요. 상황에 맞는 방법을 스스로 찾아보려는 모습이 보였어요.",
  },
  axis5: {
    title: "어디에 집중할지 생각하는 스타일",
    body: "이번 체험에서는 한 가지에 집중할지 전체 상황을 살필지 결정하는 선택이 자주 나타났어요. 지금 무엇을 더 자세히 살펴볼지 스스로 조절하는 모습이 보였어요.",
  },
};

// ---------- 결과 하단 공통 ----------

export const RESULT_NEXT_ACTION =
  "이제 실제 수의사의 일을 더 알아보는 다음 미션으로 가볼까요?";

export const RESULT_NOTICE =
  "이 결과는 오늘 체험에서 한 선택을 보여주는 거예요. 적성 검사나 진단 결과는 아니에요.";

/** CTA — 이동 없음. 클릭 시 이벤트만 전송 후 아래 안내 표시 */
export const CTA_LABEL = "다음 미션 시작하기";
export const CTA_CLICKED_NOTICE = "곧 미션이 열릴 예정이에요";

// ---------- 부모용 정적 안내 ----------

export const PARENT_GUIDE = {
  intro:
    "아이가 수의사가 실제로 마주할 수 있는 간단한 직업 상황을 보고 직접 선택해보는 체험입니다.",
  axesNote: "체험에서 살펴보는 판단 축 (개별 아이의 데이터가 아닌 일반 설명입니다)",
  axes: [
    "먼저 시작할지 확인할지",
    "혼자 해결할지 도움 받을지",
    "순서와 우선순위",
    "새로운 방법 vs 익숙한 방법",
    "집중 vs 전체 살피기",
  ],
  questionsNote: "아이와 나눠볼 수 있는 질문",
  questions: [
    "어떤 상황이 가장 기억에 남았어?",
    "선택하면서 가장 고민됐던 순간은 언제였어?",
    "다시 해본다면 같은 선택을 하고 싶어?",
  ],
} as const;

// ---------- 집계 로직 (C 동점 규칙) ----------

/**
 * 5개 선택의 판단 축을 집계해 결과 축 1개를 반환한다.
 *
 * 1. 축별 카운트 → 단독 최다 축이 있으면 그 축
 * 2. 동점이면 동점 후보 축만 추린 뒤, 선택 기록을 마지막부터 역순으로
 *    탐색해 가장 먼저 발견되는 후보 축을 선택 (C 규칙)
 *
 * 단독 최다 축도 반드시 기록에 존재하므로 역순 탐색 하나로 두 경우를
 * 모두 처리한다. history는 지점 순서(1→5)를 보존해야 한다.
 */
export function aggregateResult(history: ChoiceRecord[]): AxisId {
  if (history.length === 0) {
    throw new Error("선택 기록이 비어 있어 결과를 계산할 수 없습니다.");
  }
  const counts = new Map<AxisId, number>();
  for (const record of history) {
    counts.set(record.axis, (counts.get(record.axis) ?? 0) + 1);
  }
  const entries = Array.from(counts.entries());
  const max = Math.max(...entries.map(([, count]) => count));
  const candidates = new Set(
    entries.filter(([, count]) => count === max).map(([axis]) => axis),
  );
  for (let i = history.length - 1; i >= 0; i--) {
    if (candidates.has(history[i].axis)) {
      return history[i].axis;
    }
  }
  // 후보는 항상 기록에서 나오므로 도달 불가 — 타입 안전용 방어
  return history[history.length - 1].axis;
}
