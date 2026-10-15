import { describe, expect, it } from "vitest";
import {
  FRIED_RICE_DONE,
  FRIED_RICE_SERVED,
  FRIED_RICE_STEPS,
  HEAT_LEVELS,
  SERVED_CUSTOMER_LINE,
  activeStepIndex,
  bubbleFor,
  cookOrderBubble,
  cookOrderNote,
  cookOrderSummary,
  firstSentence,
  friedRiceReducer,
  heatNote,
  initialFriedRiceState,
  outcomeSummary,
  stepStatus,
  trayRemaining,
  withRo,
  type FriedRiceAction,
  type FriedRicePhase,
  type FriedRiceState,
  type HeatLevel,
  type IngredientId,
} from "./friedRice";

function run(actions: FriedRiceAction[], from: FriedRiceState = initialFriedRiceState): FriedRiceState {
  return actions.reduce(friedRiceReducer, from);
}

const toDone: FriedRiceAction[] = [
  { type: "OPEN_ORDER" },
  { type: "CHECK_REQUEST" },
  { type: "START_PREP" },
  { type: "ADD_INGREDIENT", id: "rice" },
  { type: "ADD_INGREDIENT", id: "carrot" },
  { type: "ADD_INGREDIENT", id: "pea" },
  { type: "FINISH_PREP" },
];
const wokAll = (...ids: IngredientId[]): FriedRiceAction[] => ids.map((id) => ({ type: "ADD_TO_WOK", id }));
const toHeat = (...ids: IngredientId[]): FriedRiceAction[] => [
  ...toDone,
  { type: "START_COOK" },
  ...wokAll(...ids),
  { type: "CONFIRM_COOK_ORDER" },
];
const toPlate = (level: HeatLevel): FriedRiceAction[] => [
  ...toHeat("carrot", "pea", "rice"),
  { type: "SET_HEAT", level },
  { type: "CONFIRM_HEAT" },
];

describe("F11-3 조리 순서", () => {
  it("2단계 마무리(done)에서만 조리 순서로 갈 수 있다", () => {
    const prep = run(toDone.slice(0, 6));
    expect(prep.phase).toBe("prep");
    expect(friedRiceReducer(prep, { type: "START_COOK" })).toBe(prep);
    const cook = run([...toDone, { type: "START_COOK" }]);
    expect(cook.phase).toBe("cook");
    expect(cook.wok).toEqual([]);
    expect(trayRemaining(cook)).toEqual(["rice", "carrot", "pea"]);
  });

  it("트레이에 올린 재료만, 한 번씩, 넣은 순서대로 팬에 들어간다", () => {
    const cook = run([...toDone, { type: "START_COOK" }]);
    // 양파는 트레이에 없으므로 들어가지 않는다
    expect(friedRiceReducer(cook, { type: "ADD_TO_WOK", id: "onion" })).toBe(cook);
    const one = run(wokAll("carrot"), cook);
    expect(one.wok).toEqual(["carrot"]);
    expect(friedRiceReducer(one, { type: "ADD_TO_WOK", id: "carrot" })).toBe(one);
    expect(trayRemaining(one)).toEqual(["rice", "pea"]);
    expect(run(wokAll("pea", "rice"), one).wok).toEqual(["carrot", "pea", "rice"]);
  });

  it("재료를 한 개만 넣어서는 순서를 확정할 수 없고, 마지막 재료를 뺄 수 있다", () => {
    const cook = run([...toDone, { type: "START_COOK" }, ...wokAll("rice")]);
    expect(friedRiceReducer(cook, { type: "CONFIRM_COOK_ORDER" })).toBe(cook);
    const undone = friedRiceReducer(cook, { type: "UNDO_WOK" });
    expect(undone.wok).toEqual([]);
    expect(friedRiceReducer(undone, { type: "UNDO_WOK" })).toBe(undone);
  });

  it("순서에는 정답이 없다 — 어떤 순서든 확정하면 4단계로 간다", () => {
    for (const order of [
      ["rice", "carrot", "pea"],
      ["carrot", "pea", "rice"],
      ["pea", "rice", "carrot"],
    ] as IngredientId[][]) {
      const heat = run(toHeat(...order));
      expect(heat.phase).toBe("heat");
      expect(heat.wok).toEqual(order);
    }
  });

  it("순서 설명은 평가가 아니라 결과를 설명하고, 순서에 따라 다르다", () => {
    expect(cookOrderNote(["rice"])).toContain("밥을 먼저");
    expect(cookOrderNote(["carrot"])).toContain("당근을 먼저");
    expect(cookOrderNote(["pea"])).toContain("완두콩을 먼저");
    expect(cookOrderNote(["carrot", "rice"])).toContain("채소를 먼저");
    expect(cookOrderNote(["rice", "carrot"])).toContain("당근을 나중에");
    expect(cookOrderSummary(["carrot", "pea", "rice"])).toContain("밥을 마지막에");
    expect(cookOrderSummary(["rice", "carrot", "pea"])).toContain("밥을 먼저 볶는");
    expect(cookOrderSummary(["carrot", "rice", "pea"])).toContain("밥을 중간에");
    for (const text of [
      cookOrderNote(["rice"]),
      cookOrderSummary(["rice", "carrot", "pea"]),
      cookOrderSummary(["carrot", "pea", "rice"]),
    ]) {
      // 정답·오답·점수 표현 없음
      expect(text).not.toMatch(/정답|오답|틀|잘못|점수|실패|완성/);
    }
  });

  it("팬 단계의 말풍선은 선배가 하고, 완성이라고 말하지 않는다", () => {
    const cook = run([...toDone, { type: "START_COOK" }]);
    expect(bubbleFor(cook).speaker).toBe("선배 요리사");
    expect(bubbleFor(run(wokAll("carrot"), cook)).text).toContain("당근을 먼저");
    expect(bubbleFor(run(wokAll("carrot", "pea", "rice"), cook)).text).toContain("이대로 정할까요");
    expect(bubbleFor(cook).text).not.toMatch(/완성/);
  });
});

describe("F11-4 불 조절", () => {
  it("불 세기는 3가지(약·중·강)이고 고르기 전에는 확정할 수 없다", () => {
    expect(HEAT_LEVELS.map((o) => o.label)).toEqual(["약불", "중불", "강불"]);
    const heat = run(toHeat("carrot", "pea", "rice"));
    expect(heat.heat).toBeNull();
    expect(friedRiceReducer(heat, { type: "CONFIRM_HEAT" })).toBe(heat);
  });

  it("세기를 바꿔 고를 수 있고, 어떤 세기든 확정하면 5단계로 간다", () => {
    let heat = run(toHeat("carrot", "pea", "rice"));
    for (const level of ["low", "medium", "high"] as HeatLevel[]) {
      heat = friedRiceReducer(heat, { type: "SET_HEAT", level });
      expect(heat.heat).toBe(level);
      expect(friedRiceReducer(heat, { type: "CONFIRM_HEAT" }).phase).toBe("plate");
    }
  });

  it("같은 세기를 다시 골라도 상태 객체가 그대로다", () => {
    const heat = run([...toHeat("carrot", "pea", "rice"), { type: "SET_HEAT", level: "low" }]);
    expect(friedRiceReducer(heat, { type: "SET_HEAT", level: "low" })).toBe(heat);
  });

  it("조리 순서 단계에서는 불을 고를 수 없다", () => {
    const cook = run([...toDone, { type: "START_COOK" }]);
    expect(friedRiceReducer(cook, { type: "SET_HEAT", level: "high" })).toBe(cook);
  });

  it("불 설명은 세기와 순서에 따라 달라지고 정오를 평가하지 않는다", () => {
    expect(heatNote("low", ["carrot", "pea", "rice"])).toContain("천천히");
    expect(heatNote("medium", ["carrot", "pea", "rice"])).toContain("고르게");
    expect(heatNote("high", ["carrot", "pea", "rice"])).toContain("저어");
    expect(heatNote("high", ["rice", "carrot", "pea"])).toContain("밥을 먼저 넣었다면");
    expect(heatNote("low", ["rice", "carrot", "pea"])).toContain("밥을 먼저 넣었다면");
    expect(heatNote("high", ["carrot", "pea", "rice"])).not.toContain("밥을 먼저 넣었다면");
    for (const level of ["low", "medium", "high"] as HeatLevel[]) {
      expect(heatNote(level, ["rice", "carrot", "pea"])).not.toMatch(/정답|오답|틀|잘못|점수|실패|완성/);
    }
  });

  it("순서를 다시 정하러 돌아가면 팬과 불이 비워진다", () => {
    const heat = run([...toHeat("rice", "carrot", "pea"), { type: "SET_HEAT", level: "high" }]);
    const redo = friedRiceReducer(heat, { type: "REDO_COOK" });
    expect(redo).toMatchObject({ phase: "cook", wok: [], heat: null });
  });
});

describe("F11-5 플레이팅·전달", () => {
  it("담기 전에는 전달할 수 없고, 담은 뒤에만 전달된다", () => {
    const plate = run(toPlate("medium"));
    expect(plate).toMatchObject({ phase: "plate", plated: false });
    expect(friedRiceReducer(plate, { type: "SERVE" })).toBe(plate);
    const plated = friedRiceReducer(plate, { type: "PLATE" });
    expect(plated.plated).toBe(true);
    expect(friedRiceReducer(plated, { type: "PLATE" })).toBe(plated);
    expect(friedRiceReducer(plated, { type: "SERVE" }).phase).toBe("served");
  });

  it("담기 전에는 불 세기를 다시 고르러 돌아갈 수 있고(이전 선택은 비워져 새로 골라야 한다), 담은 뒤에는 돌아갈 수 없다", () => {
    const plate = run(toPlate("high"));
    const redo = friedRiceReducer(plate, { type: "REDO_HEAT" });
    expect(redo).toMatchObject({ phase: "heat", heat: null });
    // 새로 고르지 않고는 확정할 수 없다
    expect(friedRiceReducer(redo, { type: "CONFIRM_HEAT" })).toBe(redo);
    const plated = friedRiceReducer(plate, { type: "PLATE" });
    expect(friedRiceReducer(plated, { type: "REDO_HEAT" })).toBe(plated);
  });

  it("'완성' 표현은 전달 후 마지막 화면에서만 나온다", () => {
    const phases: Array<[string, FriedRiceState]> = [
      ["order", initialFriedRiceState],
      ["prep", run(toDone.slice(0, 4))],
      ["done", run(toDone)],
      ["cook", run([...toDone, { type: "START_COOK" }])],
      ["heat", run(toHeat("carrot", "pea", "rice"))],
      ["plate", run(toPlate("medium"))],
      ["plated", run([...toPlate("medium"), { type: "PLATE" }])],
    ];
    for (const [name, state] of phases) {
      expect(bubbleFor(state).text, name).not.toMatch(/완성/);
    }
    const served = run([...toPlate("medium"), { type: "PLATE" }, { type: "SERVE" }]);
    expect(served.phase).toBe("served");
    expect(FRIED_RICE_SERVED.title).toContain("완성");
    // 2단계 마무리 문구는 여전히 완성이라고 말하지 않는다
    expect(`${FRIED_RICE_DONE.title}${FRIED_RICE_DONE.body}${FRIED_RICE_DONE.next}`).not.toMatch(/완성/);
  });

  it("전달 후에는 손님이 말하고(아바타 유지), 양파 요청이 반영된 결과를 보여 준다", () => {
    const served = run([...toPlate("medium"), { type: "PLATE" }, { type: "SERVE" }]);
    expect(bubbleFor(served)).toEqual({ speaker: "손님", text: SERVED_CUSTOMER_LINE });
    expect(SERVED_CUSTOMER_LINE).toContain("양파");
    expect(served.tray).not.toContain("onion");
    expect(outcomeSummary(served.wok, served.heat)).toBe("당근 → 완두콩 → 밥 순서로 넣고 중불로 볶았어요.");
  });

  it("전달이 끝난 뒤에는 어떤 조작도 상태를 바꾸지 않고, RESET만 처음으로 돌린다", () => {
    const served = run([...toPlate("medium"), { type: "PLATE" }, { type: "SERVE" }]);
    for (const action of [
      { type: "ADD_TO_WOK", id: "rice" },
      { type: "SET_HEAT", level: "low" },
      { type: "PLATE" },
      { type: "REDO_COOK" },
      { type: "REVIEW_REQUEST" },
    ] as FriedRiceAction[]) {
      expect(friedRiceReducer(served, action)).toBe(served);
    }
    expect(friedRiceReducer(served, { type: "RESET" })).toEqual(initialFriedRiceState);
  });
});

describe("말풍선 길이 — 화면이 밀리지 않게 짧게", () => {
  it("firstSentence는 첫 문장만 남기고, 문장부호가 없으면 그대로 둔다", () => {
    expect(firstSentence("강불은 빨리 볶여요. 하지만 저어 주세요.")).toBe("강불은 빨리 볶여요.");
    expect(firstSentence("문장 하나")).toBe("문장 하나");
    expect(firstSentence("")).toBe("");
  });

  it("순서 말풍선은 제목 한 문장 + 질문만, 패널 설명은 상세까지 담는다", () => {
    for (const order of [
      ["carrot", "pea", "rice"],
      ["rice", "carrot", "pea"],
      ["carrot", "rice", "pea"],
    ] as IngredientId[][]) {
      const bubble = cookOrderBubble(order);
      expect(bubble.endsWith("이대로 정할까요?")).toBe(true);
      expect(bubble.length).toBeLessThanOrEqual(46);
      expect(cookOrderSummary(order).length).toBeGreaterThan(bubble.length);
    }
  });

  it("어떤 단계의 말풍선도 3줄(약 66자)을 넘기지 않는다", () => {
    const states = [
      run([...toDone, { type: "START_COOK" }]),
      run(toHeat("rice", "carrot", "pea")),
      run([...toHeat("rice", "carrot", "pea"), { type: "SET_HEAT", level: "high" }]),
      run([...toHeat("carrot", "pea", "rice"), { type: "SET_HEAT", level: "low" }]),
      run(toPlate("medium")),
      run([...toPlate("medium"), { type: "PLATE" }]),
      run([...toPlate("medium"), { type: "PLATE" }, { type: "SERVE" }]),
    ];
    for (const state of states) {
      expect(bubbleFor(state).text.length, `${state.phase}: ${bubbleFor(state).text}`).toBeLessThanOrEqual(66);
    }
  });
});

describe("조사 처리", () => {
  it("(으)로: ㄹ 받침과 받침 없음은 '로', 그 밖은 '으로'", () => {
    expect(withRo("약불")).toBe("약불로");
    expect(withRo("중불")).toBe("중불로");
    expect(withRo("강불")).toBe("강불로");
    expect(withRo("가스")).toBe("가스로");
    expect(withRo("센불")).toBe("센불로");
    expect(withRo("밥")).toBe("밥으로");
  });
});

describe("F11-3~5 단계 표시줄", () => {
  const stepIds = FRIED_RICE_STEPS.map((s) => s.id);

  it("5단계가 모두 열려 있다", () => {
    expect(stepIds).toEqual(["order", "prep", "cook-order", "heat", "plating"]);
  });

  it("단계별로 현재/완료/예정이 맞다", () => {
    const status = (phase: FriedRicePhase) => FRIED_RICE_STEPS.map((_, i) => stepStatus(phase, i));
    expect(status("order")).toEqual(["current", "upcoming", "upcoming", "upcoming", "upcoming"]);
    expect(status("prep")).toEqual(["completed", "current", "upcoming", "upcoming", "upcoming"]);
    // 2단계를 마친 체크포인트: 3단계는 아직 현재가 아니다
    expect(status("done")).toEqual(["completed", "completed", "upcoming", "upcoming", "upcoming"]);
    expect(status("cook")).toEqual(["completed", "completed", "current", "upcoming", "upcoming"]);
    expect(status("heat")).toEqual(["completed", "completed", "completed", "current", "upcoming"]);
    expect(status("plate")).toEqual(["completed", "completed", "completed", "completed", "current"]);
    expect(status("served")).toEqual(["completed", "completed", "completed", "completed", "completed"]);
    expect(activeStepIndex("served")).toBe(5);
  });
});
