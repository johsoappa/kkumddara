// ====================================================
// friedRice.ts — "손님의 채소 볶음밥 한 접시 만들기" 시범 시나리오 (F11, 순수 로직)
//
// 기존 나침반·새싹 체험(scenario.ts)과 완전히 분리된 실험 시나리오다.
// 전체 흐름: 주문 확인 → 재료 준비 → 조리 순서 → 불 조절 → 플레이팅·전달.
// 1·2단계(주문 확인·재료 준비)는 F11 시범, 3·4·5단계(조리 순서·불 조절·플레이팅·전달)는 F11-3~5로 이어 붙였다.
// "완성"이라는 표현은 마지막 전달 단계(served)에서만 쓴다.
//
// 원칙
//  - 이 파일은 React/three에 의존하지 않는다. 화면(DOM·3D)은 모두 이 상태를 읽기만 한다.
//  - 재료 한 개를 놓았다고 다음 단계로 넘어가지 않는다. 준비 상태(tray)를 쌓다가
//    "필요한 재료만 정확히" 갖춰졌을 때만 완료할 수 있다.
//  - 정답/오답 점수는 만들지 않는다. 주문표에 적힌 요청을 지키는지만 확인한다.
// ====================================================

export type IngredientId = "rice" | "carrot" | "pea" | "onion";

export interface Ingredient {
  id: IngredientId;
  /** 화면에 표시하는 이름 */
  name: string;
  /** 이번 주문(양파 뺀 채소 볶음밥)에 필요한 재료인지 */
  required: boolean;
}

/** 선반에 놓이는 순서(왼쪽 → 오른쪽). 양파는 일부러 마지막에 둔다(헷갈리는 재료). */
export const INGREDIENTS: readonly Ingredient[] = [
  { id: "rice", name: "밥", required: true },
  { id: "carrot", name: "당근", required: true },
  { id: "pea", name: "완두콩", required: true },
  { id: "onion", name: "양파", required: false },
];

export const REQUIRED_IDS: readonly IngredientId[] = INGREDIENTS.filter((item) => item.required).map(
  (item) => item.id,
);

export function ingredientName(id: IngredientId): string {
  return INGREDIENTS.find((item) => item.id === id)?.name ?? id;
}

// ---------- 주문 ----------

export const ORDER = {
  /** 손님이 하는 말 — 1단계 시작 대사 */
  customerLine: "채소 볶음밥 주세요. 양파는 빼 주세요.",
  menu: "채소 볶음밥",
  quantity: 1,
  /** 주문표 요청 칸 문구 */
  request: "양파는 빼 주세요",
  /** 요청을 짧게 되짚는 말(재료 준비 중 안내에 쓴다) */
  requestShort: "양파 빼기",
} as const;

// ---------- 진행 상태 ----------

/**
 * order(1) → prep(2) → done(2단계 마무리 확인) → cook(3) → heat(4) → plate(5) → served(끝).
 * `done`은 "재료 준비 완료"를 알리는 체크포인트이며, 사용자가 다음 단계로 가기 전까지 머문다.
 */
export type FriedRicePhase = "order" | "prep" | "done" | "cook" | "heat" | "plate" | "served";

/** 불 세기 — 정오 판정 없이 "어떤 결과가 되는지"만 설명한다. */
export type HeatLevel = "low" | "medium" | "high";

/** 1단계 안의 진행: 주문표 닫힘 → 열어서 메뉴 확인 → 요청 칸까지 확인 */
export type OrderProgress = "closed" | "opened" | "requestChecked";

export interface FriedRiceState {
  phase: FriedRicePhase;
  order: OrderProgress;
  /** 준비 트레이에 올린 재료(올린 순서). 같은 재료는 한 번만 올라간다. */
  tray: IngredientId[];
  /** 요청 칸을 다시 본 횟수(1단계 확인 이후 포함) — 안내 문구 재생 트리거에만 쓴다 */
  requestViews: number;
  /** 양파를 올렸다가 안내를 받은 적이 있는지(되돌린 뒤에도 "요청을 확인했어요" 문구를 남기지 않는다) */
  onionNoticeShown: boolean;
  /** 3단계: 팬에 넣은 재료(넣은 순서). 트레이에 올린 재료 중에서만 들어간다. */
  wok: IngredientId[];
  /** 4단계: 고른 불 세기(고르기 전 null) */
  heat: HeatLevel | null;
  /** 5단계: 볶음밥을 접시에 담았는지 */
  plated: boolean;
}

export const initialFriedRiceState: FriedRiceState = {
  phase: "order",
  order: "closed",
  tray: [],
  requestViews: 0,
  onionNoticeShown: false,
  wok: [],
  heat: null,
  plated: false,
};

export type FriedRiceAction =
  | { type: "OPEN_ORDER" }
  | { type: "CHECK_REQUEST" }
  | { type: "REVIEW_REQUEST" }
  | { type: "START_PREP" }
  | { type: "ADD_INGREDIENT"; id: IngredientId }
  | { type: "REMOVE_INGREDIENT"; id: IngredientId }
  | { type: "FINISH_PREP" }
  | { type: "START_COOK" }
  | { type: "ADD_TO_WOK"; id: IngredientId }
  | { type: "UNDO_WOK" }
  | { type: "CONFIRM_COOK_ORDER" }
  | { type: "SET_HEAT"; level: HeatLevel }
  | { type: "CONFIRM_HEAT" }
  | { type: "REDO_COOK" }
  | { type: "REDO_HEAT" }
  | { type: "PLATE" }
  | { type: "SERVE" }
  | { type: "RESET" };

export function friedRiceReducer(state: FriedRiceState, action: FriedRiceAction): FriedRiceState {
  switch (action.type) {
    case "OPEN_ORDER":
      if (state.phase !== "order" || state.order !== "closed") return state;
      return { ...state, order: "opened" };
    case "CHECK_REQUEST":
      // 주문표를 먼저 열어야 요청 칸이 보인다
      if (state.phase !== "order" || state.order !== "opened") return state;
      return { ...state, order: "requestChecked", requestViews: state.requestViews + 1 };
    case "REVIEW_REQUEST":
      // "요청 다시 보기" — 1단계 확인 후, 재료 준비 중에도 다시 볼 수 있다. 상태는 바꾸지 않고 횟수만 센다.
      if (state.phase === "order" && state.order !== "requestChecked") return state;
      if (state.phase === "done" || state.phase === "served") return state;
      return { ...state, requestViews: state.requestViews + 1 };
    case "START_PREP":
      if (state.phase !== "order" || state.order !== "requestChecked") return state;
      return { ...state, phase: "prep" };
    case "ADD_INGREDIENT": {
      if (state.phase !== "prep") return state;
      if (state.tray.includes(action.id)) return state;
      return {
        ...state,
        tray: [...state.tray, action.id],
        onionNoticeShown: state.onionNoticeShown || action.id === "onion",
      };
    }
    case "REMOVE_INGREDIENT":
      if (state.phase !== "prep") return state;
      if (!state.tray.includes(action.id)) return state;
      return { ...state, tray: state.tray.filter((id) => id !== action.id) };
    case "FINISH_PREP":
      // 준비가 맞지 않으면 아무 일도 일어나지 않는다(재료 한 개로 끝나지 않는다)
      if (state.phase !== "prep" || !prepStatus(state.tray).ready) return state;
      return { ...state, phase: "done" };
    case "START_COOK":
      if (state.phase !== "done") return state;
      return { ...state, phase: "cook", wok: [], heat: null, plated: false };
    case "ADD_TO_WOK":
      // 트레이에 올린 재료만, 한 번씩만 팬에 들어간다
      if (state.phase !== "cook") return state;
      if (!state.tray.includes(action.id) || state.wok.includes(action.id)) return state;
      return { ...state, wok: [...state.wok, action.id] };
    case "UNDO_WOK":
      if (state.phase !== "cook" || state.wok.length === 0) return state;
      return { ...state, wok: state.wok.slice(0, -1) };
    case "CONFIRM_COOK_ORDER":
      // 트레이의 재료를 모두 넣어야 순서를 확정할 수 있다(순서 자체에는 정답이 없다)
      if (state.phase !== "cook" || state.wok.length !== state.tray.length) return state;
      return { ...state, phase: "heat", heat: null };
    case "SET_HEAT":
      if (state.phase !== "heat") return state;
      return state.heat === action.level ? state : { ...state, heat: action.level };
    case "CONFIRM_HEAT":
      if (state.phase !== "heat" || state.heat === null) return state;
      return { ...state, phase: "plate", plated: false };
    case "REDO_COOK":
      // 불 단계에서 순서를 다시 정하러 돌아간다
      if (state.phase !== "heat") return state;
      return { ...state, phase: "cook", wok: [], heat: null, plated: false };
    case "REDO_HEAT":
      // 담기 전이면 불 세기를 다시 고르러 돌아간다
      // 다시 고르는 것이므로 이전 선택은 비운다(그대로 "이 불로 볶기"를 눌러 넘어가지 못하게)
      if (state.phase !== "plate" || state.plated) return state;
      return { ...state, phase: "heat", heat: null };
    case "PLATE":
      if (state.phase !== "plate" || state.plated) return state;
      return { ...state, plated: true };
    case "SERVE":
      if (state.phase !== "plate" || !state.plated) return state;
      return { ...state, phase: "served" };
    case "RESET":
      return initialFriedRiceState;
    default:
      return state;
  }
}

// ---------- 준비 현황 ----------

export interface PrepStatus {
  /** 트레이에 올린 필요한 재료 */
  have: IngredientId[];
  /** 아직 올리지 않은 필요한 재료 */
  missing: IngredientId[];
  /** 트레이에 양파가 있는지 */
  hasOnion: boolean;
  /** 필요한 재료가 모두 있고 양파가 없다 */
  ready: boolean;
}

export function prepStatus(tray: readonly IngredientId[]): PrepStatus {
  const have = REQUIRED_IDS.filter((id) => tray.includes(id));
  const missing = REQUIRED_IDS.filter((id) => !tray.includes(id));
  const hasOnion = tray.includes("onion");
  return { have, missing, hasOnion, ready: missing.length === 0 && !hasOnion };
}

export type PrepTone = "warn" | "info" | "ready";

export interface PrepGuidance {
  tone: PrepTone;
  text: string;
}

/**
 * 준비 상태에 맞는 안내 한 줄. 양파가 올라가 있으면 주문 요청을 다시 알려 주고(되돌리는 방법 포함),
 * 아니면 남은 재료를 알려 준다. 정답/오답 표현은 쓰지 않는다.
 */
export function prepGuidance(tray: readonly IngredientId[]): PrepGuidance {
  const status = prepStatus(tray);
  if (status.hasOnion) {
    return {
      tone: "warn",
      text: `주문표에 “${ORDER.request}”라고 적혀 있어요. 양파를 눌러 선반으로 되돌려 주세요.`,
    };
  }
  if (status.ready) {
    return { tone: "ready", text: "주문에 필요한 재료가 모두 준비됐어요. ‘재료 준비 완료’를 눌러 마무리해요." };
  }
  const names = status.missing.map(ingredientName).join(", ");
  return { tone: "info", text: `아직 올리지 않은 재료: ${names}` };
}

/** 3단계에서 아직 팬에 넣지 않은, 트레이에 남은 재료(트레이에 올린 순서 유지) */
export function trayRemaining(state: Pick<FriedRiceState, "tray" | "wok">): IngredientId[] {
  return state.tray.filter((id) => !state.wok.includes(id));
}

// ---------- 말풍선(HUD) 문구 ----------

export type Speaker = "손님" | "선배 요리사";

export interface Bubble {
  speaker: Speaker;
  text: string;
}

/**
 * 지금 화면 위에 보여 줄 말풍선. 사람(손님/선배)이 말하는 문장만 담는다.
 * 1단계 시작은 손님의 주문, 이후 안내는 선배 요리사가 주문표를 가리키며 돕는다.
 */
export function bubbleFor(state: FriedRiceState): Bubble {
  if (state.phase === "order") {
    if (state.order === "closed") {
      return { speaker: "손님", text: ORDER.customerLine };
    }
    if (state.order === "opened") {
      return {
        speaker: "선배 요리사",
        text: "메뉴가 맞네요. 이제 노란 메모의 요청도 눌러서 확인해 볼까요?",
      };
    }
    return {
      speaker: "선배 요리사",
      text: `좋아요. “${ORDER.request}”는 꼭 지켜야 해요. 필요하면 요청 메모를 다시 눌러 보세요.`,
    };
  }
  if (state.phase === "prep") {
    const status = prepStatus(state.tray);
    if (status.hasOnion) {
      return {
        speaker: "선배 요리사",
        text: "잠깐, 주문표를 다시 볼까요? 양파는 빼 달라고 하셨어요. 양파를 눌러 되돌려 주세요.",
      };
    }
    if (status.ready) {
      return { speaker: "선배 요리사", text: "필요한 재료가 다 모였어요. 준비를 마무리해요." };
    }
    if (state.tray.length === 0) {
      return {
        speaker: "선배 요리사",
        text: "주문에 필요한 재료만 골라 준비 트레이로 끌어다 놓아요.",
      };
    }
    return { speaker: "선배 요리사", text: "좋아요. 나머지 재료도 주문표를 보며 올려 볼까요?" };
  }
  if (state.phase === "cook") {
    if (state.wok.length === 0) {
      return {
        speaker: "선배 요리사",
        text: "트레이의 재료를 눌러 팬에 넣어요. 어떤 순서로 넣을지는 직접 정해 보세요.",
      };
    }
    if (state.wok.length === state.tray.length) {
      return { speaker: "선배 요리사", text: cookOrderBubble(state.wok) };
    }
    return { speaker: "선배 요리사", text: cookOrderNote(state.wok) };
  }
  if (state.phase === "heat") {
    if (state.heat === null) {
      return {
        speaker: "선배 요리사",
        text: "이제 불 세기를 골라 봐요. 약불·중불·강불은 볶이는 모습이 각각 달라요.",
      };
    }
    return { speaker: "선배 요리사", text: firstSentence(heatNote(state.heat, state.wok)) };
  }
  if (state.phase === "plate") {
    return state.plated
      ? { speaker: "선배 요리사", text: "접시에 잘 담겼어요. 전달 벨을 눌러 손님께 내어 드려요." }
      : { speaker: "선배 요리사", text: "다 볶았어요. 볶음밥을 끌어서 접시에 담아 볼까요?" };
  }
  if (state.phase === "served") {
    return { speaker: "손님", text: SERVED_CUSTOMER_LINE };
  }
  return {
    speaker: "선배 요리사",
    text: "주문에 맞게 재료가 준비됐어요. 다음에는 조리 순서를 정해 볼 차례예요.",
  };
}

// ---------- 3단계 조리 순서 · 4단계 불 조절 문구 ----------
// 정오 판정이 아니라 "그렇게 하면 어떻게 되는지"만 설명한다. 어떤 순서·불 세기든 다음 단계로 갈 수 있다.

export const COOK_FACTS: Record<Exclude<IngredientId, "onion">, string> = {
  carrot: "당근은 단단해서 익는 데 시간이 더 걸려요.",
  pea: "완두콩은 금방 익어서 오래 볶으면 색이 어두워져요.",
  rice: "밥은 이미 익어 있어서 오래 볶을 필요가 없고, 팬 바닥에 오래 있으면 눌어붙기 쉬워요.",
};

/** 방금 넣은 재료(마지막)와 앞서 넣은 재료를 보고 한 줄 설명을 만든다. */
export function cookOrderNote(wok: readonly IngredientId[]): string {
  const last = wok[wok.length - 1];
  if (!last || last === "onion") return "";
  const first = wok.length === 1;
  if (last === "rice") {
    return first
      ? `밥을 먼저 넣었어요. ${COOK_FACTS.rice}`
      : "채소를 먼저 넣고 밥을 넣었어요. 채소가 먼저 익고 밥은 나중에 섞여요.";
  }
  if (last === "carrot") {
    return first
      ? `당근을 먼저 넣었어요. ${COOK_FACTS.carrot} 먼저 넣으면 충분히 익을 시간이 생겨요.`
      : "당근을 나중에 넣었어요. 앞서 넣은 재료보다 덜 익은 채로 남을 수 있어요.";
  }
  return first
    ? `완두콩을 먼저 넣었어요. ${COOK_FACTS.pea}`
    : "완두콩을 나중에 넣었어요. 금방 익어서 색이 선명하게 남아요.";
}

/** 모든 재료를 넣은 뒤의 순서 요약 — 제목(한 문장)과 설명으로 나눠, 말풍선에는 제목만 쓴다. */
export function cookOrderSummaryParts(wok: readonly IngredientId[]): { headline: string; detail: string } {
  const riceAt = wok.indexOf("rice");
  if (riceAt === -1) return { headline: "재료를 모두 넣었어요.", detail: "" };
  if (riceAt === wok.length - 1) {
    return {
      headline: "채소를 먼저 볶고 밥을 마지막에 섞는 순서예요.",
      detail: "채소가 잘 익고 밥이 덜 눌어붙어요.",
    };
  }
  if (riceAt === 0) {
    return {
      headline: "밥을 먼저 볶는 순서예요.",
      detail: "밥이 팬에 오래 있어 눌어붙을 수 있고 채소는 덜 익을 수 있어요. 불 세기로 조절해 볼 수 있어요.",
    };
  }
  return {
    headline: "밥을 중간에 넣는 순서예요.",
    detail: "먼저 넣은 재료는 잘 익고 나중에 넣은 재료는 덜 익을 수 있어요.",
  };
}

/** 패널용 전체 설명 */
export function cookOrderSummary(wok: readonly IngredientId[]): string {
  const { headline, detail } = cookOrderSummaryParts(wok);
  return `${headline}${detail ? ` ${detail}` : ""} 이대로 정할까요?`;
}

/** 말풍선용 짧은 설명 */
export function cookOrderBubble(wok: readonly IngredientId[]): string {
  return `${cookOrderSummaryParts(wok).headline} 이대로 정할까요?`;
}

/** 문장 하나만 남긴다(말풍선이 길어져 화면이 밀리지 않게) */
export function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?=\s|$)/);
  return match ? match[0] : text;
}

export interface HeatOption {
  id: HeatLevel;
  label: string;
  /** 짧은 한 줄(버튼 옆 보조 문구) */
  hint: string;
}

export const HEAT_LEVELS: readonly HeatOption[] = [
  { id: "low", label: "약불", hint: "천천히 익어요" },
  { id: "medium", label: "중불", hint: "고르게 볶기 좋아요" },
  { id: "high", label: "강불", hint: "빨리 볶여요" },
];

export function heatLabel(level: HeatLevel): string {
  return HEAT_LEVELS.find((option) => option.id === level)?.label ?? level;
}

export function heatNote(level: HeatLevel, wok: readonly IngredientId[]): string {
  const riceFirst = wok[0] === "rice";
  if (level === "low") {
    return `약불은 천천히 익어서 눌어붙을 걱정이 적어요. 대신 볶는 데 시간이 걸리고 물기가 남을 수 있어요.${
      riceFirst ? " 밥을 먼저 넣었다면 눌어붙기 덜해요." : ""
    }`;
  }
  if (level === "medium") {
    return "중불은 재료가 고르게 익기 좋은 불이에요. 저어 주며 볶으면 눌어붙지 않아요.";
  }
  return `강불은 빨리 볶여서 고슬고슬해져요. 하지만 계속 저어 주지 않으면 눌어붙거나 탈 수 있어요.${
    riceFirst ? " 밥을 먼저 넣었다면 더 자주 저어 주세요." : ""
  }`;
}

/** "~(으)로" — 받침이 없거나 ㄹ이면 "로", 그 밖의 받침이면 "으로" */
export function withRo(word: string): string {
  const last = word.charCodeAt(word.length - 1);
  const isHangul = last >= 0xac00 && last <= 0xd7a3;
  const final = isHangul ? (last - 0xac00) % 28 : 0;
  return `${word}${final === 0 || final === 8 ? "로" : "으로"}`;
}

/** 전달 화면의 "어떻게 만들었는지" 한 줄 */
export function outcomeSummary(wok: readonly IngredientId[], heat: HeatLevel | null): string {
  const order = wok.map(ingredientName).join(" → ");
  return heat ? `${order} 순서로 넣고 ${withRo(heatLabel(heat))} 볶았어요.` : `${order} 순서로 넣었어요.`;
}

export const SERVED_CUSTOMER_LINE = "양파가 없어서 좋네요. 잘 먹겠습니다!";

// ---------- 완료 화면 문구 ----------
// 2단계 마무리("재료 준비 완료")와 마지막 전달("한 접시 완성")은 서로 다른 지점이다.
// "완성"이라는 말은 손님에게 전달한 마지막 화면(FRIED_RICE_SERVED)에서만 쓴다.

export const FRIED_RICE_DONE = {
  title: "재료 준비 완료",
  body: "주문표를 확인하고, 필요한 재료만 준비 트레이에 담았어요. 아직 조리는 시작하지 않았어요.",
  next: "이제 재료를 팬에 넣는 순서를 정해 볼 차례예요.",
} as const;

export const FRIED_RICE_SERVED = {
  title: "한 접시 완성",
  body: "주문표 요청대로 양파를 뺀 채소 볶음밥을 손님께 전달했어요.",
} as const;

/** 단계 표시줄: 1~5단계 모두 이번 시범에서 열려 있다. */
export const FRIED_RICE_STEPS = [
  { id: "order", title: "주문 확인" },
  { id: "prep", title: "재료 준비" },
  { id: "cook-order", title: "조리 순서" },
  { id: "heat", title: "불 조절" },
  { id: "plating", title: "플레이팅·전달" },
] as const;

export function activeStepIndex(phase: FriedRicePhase): number {
  switch (phase) {
    case "order":
      return 0;
    case "prep":
      return 1;
    case "done":
    case "cook":
      return 2;
    case "heat":
      return 3;
    case "plate":
      return 4;
    case "served":
      return 5;
  }
}

export type StepStatus = "completed" | "current" | "upcoming";

/**
 * 단계 표시줄 상태. `done`은 2단계를 마친 체크포인트라 1·2단계는 완료, 3단계부터는 아직 "예정"이다
 * (다음 단계 버튼을 눌러야 3단계가 현재가 된다).
 */
export function stepStatus(phase: FriedRicePhase, index: number): StepStatus {
  if (phase === "served") return "completed";
  if (phase === "done") return index < 2 ? "completed" : "upcoming";
  const active = activeStepIndex(phase);
  if (index < active) return "completed";
  return index === active ? "current" : "upcoming";
}
