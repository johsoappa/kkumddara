// ====================================================
// XR 요리사 나침반모드 시나리오 데이터 — v1.1 확정본
//
// - 이 파일은 순수 데이터 + 순수 함수만 담는다 (React/브라우저 의존 없음)
// - 문구는 시나리오 v1.1 확정본을 그대로 사용한다 (임의 수정 금지)
// - 집계 로직(C 동점 규칙)은 aggregateResult()에 구현
// ====================================================

export const SCENARIO_VERSION = "v1.1";

export type AxisId = "axis1" | "axis2" | "axis3" | "axis4" | "axis5";

export interface Choice {
  id: string; // choice_id (예: p1_a)
  label: string; // 버튼 문구
  axis: AxisId; // 판단 축 태그 (고정)
}

export interface ChoicePoint {
  point: number; // 지점 번호 1~5
  title: string;
  situation: string;
  reaction: string; // 선택 후 공통 반응
  choices: Choice[];
}

/** 사용자의 선택 기록 1건 — 지점 순서(1→5) 보존이 C 규칙 역순 탐색의 전제 */
export interface ChoiceRecord {
  point: number;
  choiceId: string;
  axis: AxisId;
}

// ---------- 공통 시작 (선택 지점 진입 전) ----------

export const INTRO = {
  narration: "오늘은 작은 레스토랑 주방에서 첫 근무를 시작하는 날이에요.",
  senior:
    "반가워요. 오늘은 제가 옆에서 함께할게요. 뜨거운 조리와 칼 사용은 제가 맡을 테니, 우리는 주문을 보고 준비와 판단을 해봐요.",
  firstOrder: "첫 주문이 도착했어요. 샌드위치와 샐러드 한 접시예요.",
} as const;

// ---------- 선택 지점 5개 ----------

export const CHOICE_POINTS: ChoicePoint[] = [
  {
    point: 1,
    title: "무엇부터 볼까?",
    situation: "주문표와 재료, 조리대가 한꺼번에 눈에 들어와요.",
    reaction: "좋아요. 먼저 살펴본 기준으로 준비를 시작해볼게요.",
    choices: [
      { id: "p1_a", label: "바로 준비를 시작한다", axis: "axis1" },
      { id: "p1_b", label: "다른 준비 방법을 생각한다", axis: "axis4" },
      { id: "p1_c", label: "조리대 전체를 살펴본다", axis: "axis5" },
    ],
  },
  {
    point: 2,
    title: "필요한 접시가 보이지 않는다",
    situation: "음식을 담을 접시가 바로 보이지 않아요.",
    reaction: "좋아요. 지금 고른 방법으로 필요한 접시를 찾아볼게요.",
    choices: [
      { id: "p2_a", label: "선배에게 물어본다", axis: "axis2" },
      { id: "p2_b", label: "수납장을 차례로 확인한다", axis: "axis3" },
      { id: "p2_c", label: "다른 방법을 생각해본다", axis: "axis4" },
    ],
  },
  {
    point: 3,
    title: "새로운 주문 알림",
    situation: "첫 주문이 아직 끝나지 않았는데 새로운 주문 알림이 들어왔어요.",
    reaction: "좋아요. 그 판단으로 다음 순서를 이어가볼게요.",
    choices: [
      { id: "p3_a", label: "하던 일을 먼저 마무리한다", axis: "axis5" },
      { id: "p3_b", label: "두 주문을 비교해본다", axis: "axis3" },
      { id: "p3_c", label: "선배와 역할을 나눈다", axis: "axis2" },
    ],
  },
  {
    point: 4,
    title: "접시를 어떻게 마무리할까?",
    situation: "이제 음식을 접시에 담아 마무리할 차례예요.",
    reaction: "좋아요. 선택한 방식으로 접시를 마무리해볼게요.",
    choices: [
      { id: "p4_a", label: "바로 담기 시작한다", axis: "axis1" },
      { id: "p4_b", label: "새로운 배치를 시도한다", axis: "axis4" },
      { id: "p4_c", label: "접시 전체를 살펴본다", axis: "axis5" },
    ],
  },
  {
    point: 5,
    title: "주문 내용이 바뀌었다",
    situation: "주문표에 재료 하나를 빼달라는 요청이 새로 표시됐어요.",
    reaction: "좋아요. 바뀐 주문을 반영해서 마무리해볼게요.",
    choices: [
      { id: "p5_a", label: "주문표를 다시 확인한다", axis: "axis1" },
      { id: "p5_b", label: "준비 순서를 다시 정리한다", axis: "axis3" },
      { id: "p5_c", label: "선배에게 변경을 알린다", axis: "axis2" },
    ],
  },
];

// ---------- 피드백 템플릿 5종 (최다 축 결과) ----------

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
  "이제 실제 요리사의 일을 더 알아보는 다음 미션으로 가볼까요?";

export const RESULT_NOTICE =
  "이 결과는 오늘 체험에서 한 선택을 보여주는 거예요. 적성 검사나 진단 결과는 아니에요.";

/** v0.1 CTA — 이동 없음. 클릭 시 이벤트만 전송 후 아래 안내 표시 (실연동은 v0.2) */
export const CTA_LABEL = "다음 미션 시작하기";
export const CTA_CLICKED_NOTICE = "곧 미션이 열릴 예정이에요";

// ---------- 부모용 정적 안내 ----------

export const PARENT_GUIDE = {
  intro:
    "아이가 요리사가 실제로 마주할 수 있는 간단한 직업 상황을 보고 직접 선택해보는 체험입니다.",
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
