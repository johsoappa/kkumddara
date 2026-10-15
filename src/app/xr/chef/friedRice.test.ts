import { describe, expect, it } from "vitest";
import {
  FRIED_RICE_DONE,
  INGREDIENTS,
  ORDER,
  REQUIRED_IDS,
  activeStepIndex,
  bubbleFor,
  friedRiceReducer,
  initialFriedRiceState,
  prepGuidance,
  prepStatus,
  type FriedRiceAction,
  type FriedRiceState,
  type IngredientId,
} from "./friedRice";

function run(actions: FriedRiceAction[], from: FriedRiceState = initialFriedRiceState): FriedRiceState {
  return actions.reduce(friedRiceReducer, from);
}

const READY_ORDER: FriedRiceAction[] = [
  { type: "OPEN_ORDER" },
  { type: "CHECK_REQUEST" },
  { type: "START_PREP" },
];

function add(...ids: IngredientId[]): FriedRiceAction[] {
  return ids.map((id) => ({ type: "ADD_INGREDIENT", id }));
}

describe("볶음밥 시범 — 시나리오 데이터", () => {
  it("주문: 채소 볶음밥 1개, 양파 빼기 요청", () => {
    expect(ORDER.customerLine).toBe("채소 볶음밥 주세요. 양파는 빼 주세요.");
    expect(ORDER.menu).toBe("채소 볶음밥");
    expect(ORDER.request).toContain("양파");
  });

  it("재료는 밥·당근·완두콩·양파 네 가지이고 필요한 것은 앞의 셋뿐이다", () => {
    expect(INGREDIENTS.map((item) => item.name)).toEqual(["밥", "당근", "완두콩", "양파"]);
    expect(REQUIRED_IDS).toEqual(["rice", "carrot", "pea"]);
  });
});

describe("볶음밥 시범 — 1단계 주문 확인", () => {
  it("주문표는 닫힘 → 열림 → 요청 확인 순서로만 진행된다", () => {
    let state = initialFriedRiceState;
    expect(state.order).toBe("closed");
    // 열기 전에는 요청을 확인할 수 없다
    expect(friedRiceReducer(state, { type: "CHECK_REQUEST" })).toBe(state);
    state = friedRiceReducer(state, { type: "OPEN_ORDER" });
    expect(state.order).toBe("opened");
    // 요청 확인 전에는 재료 준비로 갈 수 없다
    expect(friedRiceReducer(state, { type: "START_PREP" })).toBe(state);
    state = friedRiceReducer(state, { type: "CHECK_REQUEST" });
    expect(state.order).toBe("requestChecked");
    expect(state.requestViews).toBe(1);
  });

  it("이미 연 주문표를 다시 열어도 상태가 그대로다", () => {
    const opened = run([{ type: "OPEN_ORDER" }]);
    expect(friedRiceReducer(opened, { type: "OPEN_ORDER" })).toBe(opened);
  });

  it("요청 다시 보기는 확인 뒤에만 되고, 횟수만 늘며 단계는 바꾸지 않는다", () => {
    const closed = initialFriedRiceState;
    expect(friedRiceReducer(closed, { type: "REVIEW_REQUEST" })).toBe(closed);
    const checked = run([{ type: "OPEN_ORDER" }, { type: "CHECK_REQUEST" }]);
    const again = friedRiceReducer(checked, { type: "REVIEW_REQUEST" });
    expect(again.requestViews).toBe(checked.requestViews + 1);
    expect(again.phase).toBe("order");
    expect(again.order).toBe("requestChecked");
  });

  it("주문 확인을 마치면 재료 준비 단계로 간다", () => {
    expect(run(READY_ORDER).phase).toBe("prep");
  });

  it("주문 단계에서는 재료를 올릴 수 없다", () => {
    const state = run([{ type: "OPEN_ORDER" }, ...add("rice")]);
    expect(state.tray).toEqual([]);
  });

  it("손님 말풍선 → 선배 말풍선(주문표 확인 안내) 순으로 안내가 바뀐다", () => {
    expect(bubbleFor(initialFriedRiceState)).toEqual({ speaker: "손님", text: ORDER.customerLine });
    const opened = run([{ type: "OPEN_ORDER" }]);
    expect(bubbleFor(opened).speaker).toBe("선배 요리사");
    expect(bubbleFor(opened).text).toContain("요청");
    const checked = run([{ type: "OPEN_ORDER" }, { type: "CHECK_REQUEST" }]);
    expect(bubbleFor(checked).text).toContain("양파는 빼 주세요");
  });
});

describe("볶음밥 시범 — 2단계 재료 준비", () => {
  it("재료 한 개를 놓았다고 다음 단계로 넘어가지 않는다", () => {
    const state = run([...READY_ORDER, ...add("rice")]);
    expect(state.phase).toBe("prep");
    expect(prepStatus(state.tray).ready).toBe(false);
  });

  it("준비 완료 시도는 필요한 재료가 모두 있어야만 통한다", () => {
    const partial = run([...READY_ORDER, ...add("rice", "carrot")]);
    expect(friedRiceReducer(partial, { type: "FINISH_PREP" })).toBe(partial);
    const full = run([...READY_ORDER, ...add("rice", "carrot", "pea")]);
    expect(friedRiceReducer(full, { type: "FINISH_PREP" }).phase).toBe("done");
  });

  it("올리는 순서는 상관없다", () => {
    const state = run([...READY_ORDER, ...add("pea", "rice", "carrot"), { type: "FINISH_PREP" }]);
    expect(state.phase).toBe("done");
  });

  it("양파를 올리면 필요한 재료가 다 있어도 완료할 수 없다", () => {
    const state = run([...READY_ORDER, ...add("rice", "carrot", "pea", "onion")]);
    expect(prepStatus(state.tray)).toMatchObject({ ready: false, hasOnion: true, missing: [] });
    expect(friedRiceReducer(state, { type: "FINISH_PREP" })).toBe(state);
  });

  it("양파를 올리면 주문 요청을 다시 안내한다(되돌리는 방법 포함)", () => {
    const state = run([...READY_ORDER, ...add("onion")]);
    const guidance = prepGuidance(state.tray);
    expect(guidance.tone).toBe("warn");
    expect(guidance.text).toContain(ORDER.request);
    expect(guidance.text).toContain("되돌려");
    expect(bubbleFor(state).speaker).toBe("선배 요리사");
    expect(bubbleFor(state).text).toContain("양파");
    expect(state.onionNoticeShown).toBe(true);
  });

  it("양파를 되돌리면 안내가 풀리고 다시 완료할 수 있다", () => {
    let state = run([...READY_ORDER, ...add("rice", "carrot", "pea", "onion")]);
    state = friedRiceReducer(state, { type: "REMOVE_INGREDIENT", id: "onion" });
    expect(state.tray).toEqual(["rice", "carrot", "pea"]);
    expect(prepGuidance(state.tray).tone).toBe("ready");
    expect(friedRiceReducer(state, { type: "FINISH_PREP" }).phase).toBe("done");
  });

  it("필요한 재료도 되돌릴 수 있다", () => {
    const state = run([...READY_ORDER, ...add("rice", "carrot"), { type: "REMOVE_INGREDIENT", id: "rice" }]);
    expect(state.tray).toEqual(["carrot"]);
    expect(prepStatus(state.tray).missing).toEqual(["rice", "pea"]);
  });

  it("같은 재료를 두 번 올려도 한 번만 들어가고, 없는 재료를 빼도 상태가 그대로다", () => {
    const once = run([...READY_ORDER, ...add("rice")]);
    expect(friedRiceReducer(once, { type: "ADD_INGREDIENT", id: "rice" })).toBe(once);
    expect(friedRiceReducer(once, { type: "REMOVE_INGREDIENT", id: "carrot" })).toBe(once);
  });

  it("안내는 남은 재료를 이름으로 알려 준다", () => {
    expect(prepGuidance([]).text).toContain("밥, 당근, 완두콩");
    expect(prepGuidance(["rice"]).text).toContain("당근, 완두콩");
    expect(prepGuidance(["rice"]).text).not.toContain("밥");
  });

  it("준비 완료 후에는 더 올리거나 뺄 수 없다", () => {
    const done = run([...READY_ORDER, ...add("rice", "carrot", "pea"), { type: "FINISH_PREP" }]);
    expect(friedRiceReducer(done, { type: "ADD_INGREDIENT", id: "onion" })).toBe(done);
    expect(friedRiceReducer(done, { type: "REMOVE_INGREDIENT", id: "rice" })).toBe(done);
  });

  it("RESET은 처음 상태로 돌린다", () => {
    const done = run([...READY_ORDER, ...add("rice", "carrot", "pea"), { type: "FINISH_PREP" }]);
    expect(friedRiceReducer(done, { type: "RESET" })).toEqual(initialFriedRiceState);
  });
});

describe("볶음밥 시범 — 종료 문구", () => {
  it("종료 문구는 '재료 준비 완료'이고 음식을 완성했다고 말하지 않는다", () => {
    expect(FRIED_RICE_DONE.title).toBe("재료 준비 완료");
    const all = `${FRIED_RICE_DONE.title} ${FRIED_RICE_DONE.body} ${FRIED_RICE_DONE.next}`;
    expect(all).not.toMatch(/완성/);
    expect(all).toContain("조리는 시작하지 않았어요");
  });

  it("완료 말풍선도 조리 완료를 말하지 않는다", () => {
    const done = run([...READY_ORDER, ...add("rice", "carrot", "pea"), { type: "FINISH_PREP" }]);
    expect(bubbleFor(done).text).not.toMatch(/완성/);
    expect(activeStepIndex(done.phase)).toBe(2);
  });
});
