import { describe, expect, it } from "vitest";
import {
  friedRiceReducer,
  initialFriedRiceState,
  type FriedRiceAction,
  type FriedRiceState,
  type HeatLevel,
  type IngredientId,
} from "./friedRice";
import {
  BELL,
  FRIED_RICE_MENTOR,
  FRIED_RICE_MENTOR_FACE_Y,
  FRIED_RICE_MENTOR_HEAD_RADIUS,
  KNOB_HIT_WIDTH,
  KNOB_LABEL_CENTER_Y,
  KNOB_LABEL_SCALE,
  KNOB_RADIUS,
  KNOB_X,
  KNOB_Y,
  KNOB_Z,
  MINI_TICKET,
  MOUND_ORIGIN,
  PLATE,
  SHELF_ORIGINS,
  TRAY,
  WOK,
  convergedCamera,
  isInsidePlate,
  isInsideTray,
  knobPosition,
  mentorPoseKeyFor,
  pinsFor,
  stageForPhase,
} from "./friedRiceLayout";
import { projectPointToScreen, type Vec3 } from "./interactions3d";

function run(actions: FriedRiceAction[]): FriedRiceState {
  return actions.reduce(friedRiceReducer, initialFriedRiceState);
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
const wok = (...ids: IngredientId[]): FriedRiceAction[] => ids.map((id) => ({ type: "ADD_TO_WOK", id }));
const cook = run([...toDone, { type: "START_COOK" }]);
const heat = run([...toDone, { type: "START_COOK" }, ...wok("carrot", "pea", "rice"), { type: "CONFIRM_COOK_ORDER" }]);
const plate = (level: HeatLevel, plated: boolean) =>
  run([
    ...toDone,
    { type: "START_COOK" },
    ...wok("carrot", "pea", "rice"),
    { type: "CONFIRM_COOK_ORDER" },
    { type: "SET_HEAT", level },
    { type: "CONFIRM_HEAT" },
    ...(plated ? ([{ type: "PLATE" }] as FriedRiceAction[]) : []),
  ]);

const VIEWPORTS = [
  { name: "375px", width: 343, height: 343 },
  { name: "360px", width: 328, height: 328 },
  { name: "데스크톱", width: 544, height: 460 },
] as const;

function project(point: Vec3, viewport: (typeof VIEWPORTS)[number]) {
  const cam = convergedCamera("prep", viewport.width / viewport.height);
  return projectPointToScreen(point, {
    cameraPos: cam.cameraPos,
    forward: cam.forward,
    fovDeg: cam.fovDeg,
    viewportWidthPx: viewport.width,
    viewportHeightPx: viewport.height,
  })!;
}

describe("F11-3~5 카메라·단계", () => {
  it("3~5단계는 재료 준비와 같은 카메라(prep 프레이밍)를 쓴다 — 단계 전환 때 카메라가 다시 움직이지 않는다", () => {
    for (const state of [cook, heat, plate("medium", false), plate("medium", true)]) {
      expect(stageForPhase(state.phase)).toBe("prep");
    }
  });
});

describe("F11-3~5 조작 대상 핀", () => {
  it("3단계: 트레이에 남은 재료마다 '누르기', 팬에 넣은 재료는 사라지고, 작은 주문표 핀이 남는다", () => {
    expect(pinsFor(cook, true).map((p) => [p.id, p.kind])).toEqual([
      ["tray-rice", "press"],
      ["tray-carrot", "press"],
      ["tray-pea", "press"],
      ["mini-ticket", "press"],
    ]);
    const one = run([...toDone, { type: "START_COOK" }, ...wok("carrot")]);
    expect(pinsFor(one, true).map((p) => p.id)).toEqual(["tray-rice", "tray-pea", "mini-ticket"]);
    const all = run([...toDone, { type: "START_COOK" }, ...wok("carrot", "pea", "rice")]);
    expect(pinsFor(all, true).map((p) => p.id)).toEqual(["mini-ticket"]);
  });

  it("4단계: 불 손잡이 3개에 '누르기', 선택해도 핀은 그대로다", () => {
    const ids = pinsFor(heat, true).map((p) => p.id);
    expect(ids).toEqual(["knob-low", "knob-medium", "knob-high", "mini-ticket"]);
    const picked = friedRiceReducer(heat, { type: "SET_HEAT", level: "high" });
    expect(pinsFor(picked, true).map((p) => p.id)).toEqual(ids);
  });

  it("5단계: 담기 전에는 볶음밥 '끌기'와 접시 '놓는 곳', 담은 뒤에는 전달 벨 '누르기'만 남는다", () => {
    const before = pinsFor(plate("medium", false), true);
    expect(before.filter((p) => p.kind === "drag").map((p) => p.id)).toEqual(["mound"]);
    expect(before.filter((p) => p.kind === "drop").map((p) => p.id)).toEqual(["plate"]);
    const after = pinsFor(plate("medium", true), true);
    expect(after.map((p) => [p.id, p.kind])).toEqual([
      ["bell", "press"],
      ["mini-ticket", "press"],
    ]);
  });

  it("전달 후·2단계 마무리·글로 진행하기에는 핀이 없다", () => {
    const served = friedRiceReducer(plate("medium", true), { type: "SERVE" });
    expect(pinsFor(served, true)).toEqual([]);
    expect(pinsFor(run(toDone), true)).toEqual([]);
    for (const state of [cook, heat, plate("low", false)]) {
      expect(pinsFor(state, false)).toEqual([]);
    }
  });

  it("'놓는 곳'(접시) 핀의 연결선 끝은 접시 판정 영역 안이다", () => {
    const drop = pinsFor(plate("medium", false), true).find((p) => p.kind === "drop")!;
    expect(isInsidePlate({ x: drop.anchor![0], z: drop.anchor![2] })).toBe(true);
  });
});

describe("F11-3~5 배치·판정", () => {
  it("볶음밥을 잡은 자리(팬)는 접시 판정 밖이라 잡기만 해서는 담기지 않는다", () => {
    expect(isInsidePlate({ x: MOUND_ORIGIN[0], z: MOUND_ORIGIN[2] })).toBe(false);
    expect(isInsidePlate({ x: PLATE.center[0], z: PLATE.center[2] })).toBe(true);
    expect(isInsidePlate({ x: BELL.center[0], z: BELL.center[2] })).toBe(false);
  });

  it("접시·벨·불 손잡이는 같은 앞줄에서 서로 겹치지 않는다", () => {
    const knobMin = KNOB_X[0] - KNOB_RADIUS;
    const knobMax = KNOB_X[2] + KNOB_RADIUS;
    // 접시와 벨 사이, 벨과 화면 오른쪽 끝(재료 줄 너비) 사이에 여유
    expect(BELL.center[0] - PLATE.center[0]).toBeGreaterThan(PLATE.radius + 0.15);
    expect(knobMax - knobMin).toBeLessThan(TRAY.width);
    // 손잡이 간격이 손잡이 지름보다 크다
    expect(KNOB_X[1] - KNOB_X[0]).toBeGreaterThan(KNOB_RADIUS * 2);
    // 보이지 않는 누르기 영역끼리도 겹치지 않는다(경계에서 두 손잡이가 동시에 맞지 않게)
    expect(KNOB_X[1] - KNOB_X[0]).toBeGreaterThan(KNOB_HIT_WIDTH);
    expect(KNOB_X[2] - KNOB_X[1]).toBeGreaterThan(KNOB_HIT_WIDTH);
    // 이름표가 손잡이 간격보다 넓지 않다
    expect(KNOB_LABEL_SCALE[0]).toBeLessThan(KNOB_X[1] - KNOB_X[0]);
    expect(knobPosition(1)[0]).toBe(0.4);
  });

  it("팬은 선반 줄 깊이에 있고 트레이(앞줄)·접시 판정과 겹치지 않는다", () => {
    expect(WOK.center[2]).toBe(SHELF_ORIGINS.rice[2]);
    expect(isInsideTray({ x: WOK.center[0], z: WOK.center[2] })).toBe(false);
    expect(isInsidePlate({ x: WOK.center[0], z: WOK.center[2] })).toBe(false);
  });

  it("선배 요리사는 3·4단계에는 조리대를 가리키고, 담은 뒤·전달 후에는 손을 펴 소개한다", () => {
    expect(mentorPoseKeyFor(cook)).toBe("pointCounter");
    expect(mentorPoseKeyFor(heat)).toBe("pointCounter");
    expect(mentorPoseKeyFor(plate("medium", false))).toBe("pointCounter");
    expect(mentorPoseKeyFor(plate("medium", true))).toBe("present");
    expect(mentorPoseKeyFor(friedRiceReducer(plate("medium", true), { type: "SERVE" }))).toBe("present");
  });
});

describe("F11-3~5 화면 배치(수렴한 카메라)", () => {
  for (const viewport of VIEWPORTS) {
    it(`${viewport.name}: 3~5단계 핀이 모두 화면 안에 들어오고 서로 겹치지 않는다`, () => {
      const states = [cook, heat, plate("medium", false), plate("medium", true)];
      for (const state of states) {
        const pts = pinsFor(state, true).map((pin) => ({ id: pin.id, p: project(pin.world, viewport) }));
        for (const { id, p } of pts) {
          expect(p.xPx, `${state.phase} ${id} x`).toBeGreaterThan(20);
          expect(p.xPx, `${state.phase} ${id} x`).toBeLessThan(viewport.width - 20);
          expect(p.yPx, `${state.phase} ${id} y`).toBeGreaterThan(0);
          expect(p.yPx, `${state.phase} ${id} y`).toBeLessThan(viewport.height);
        }
        for (let i = 0; i < pts.length; i += 1) {
          for (let j = i + 1; j < pts.length; j += 1) {
            const dx = Math.abs(pts[i].p.xPx - pts[j].p.xPx);
            const dy = Math.abs(pts[i].p.yPx - pts[j].p.yPx);
            expect(
              dx >= 50 || dy >= 24,
              `${state.phase}: ${pts[i].id} ↔ ${pts[j].id} (dx=${dx.toFixed(0)}, dy=${dy.toFixed(0)})`,
            ).toBe(true);
          }
        }
      }
    });

    it(`${viewport.name}: 불 손잡이 이름표끼리 겹치지 않고 팬·접시·벨이 화면 안에 있다`, () => {
      const labels = [0, 1, 2].map((i) => {
        const k = knobPosition(i);
        const c = project([k[0], KNOB_Y + KNOB_LABEL_CENTER_Y, k[2]], viewport);
        const r = project([k[0] + KNOB_LABEL_SCALE[0] / 2, KNOB_Y + KNOB_LABEL_CENTER_Y, k[2]], viewport);
        return { x: c.xPx, half: Math.abs(r.xPx - c.xPx) };
      });
      for (let i = 0; i < 2; i += 1) {
        expect(labels[i + 1].x - labels[i].x).toBeGreaterThan(labels[i].half + labels[i + 1].half - 1);
      }
      const targets: Array<[string, Vec3]> = [
        ["wok-left", [WOK.center[0] - WOK.radius, WOK.center[1], WOK.center[2]]],
        ["wok-handle", [WOK.center[0] + WOK.radius + 0.3, WOK.rimY, WOK.center[2]]],
        ["plate-left", [PLATE.center[0] - PLATE.radius, PLATE.center[1], PLATE.center[2]]],
        ["bell-right", [BELL.center[0] + 0.2, BELL.center[1] + 0.35, BELL.center[2]]],
        ["mini-ticket", [MINI_TICKET.center[0], MINI_TICKET.center[1], MINI_TICKET.center[2]]],
      ];
      for (const [name, point] of targets) {
        const p = project(point, viewport);
        expect(p.xPx, name).toBeGreaterThanOrEqual(0);
        expect(p.xPx, name).toBeLessThanOrEqual(viewport.width);
        expect(p.yPx, name).toBeGreaterThanOrEqual(0);
        expect(p.yPx, name).toBeLessThanOrEqual(viewport.height);
      }
    });
  }
});

describe("F11-4 불 손잡이 이름표는 선배 요리사 얼굴을 덮지 않는다", () => {
  // 이름표 스프라이트: 손잡이 위 KNOB_LABEL_CENTER_Y, 월드 크기 KNOB_LABEL_SCALE
  const LABEL_HALF_W = KNOB_LABEL_SCALE[0] / 2;
  const LABEL_HALF_H = KNOB_LABEL_SCALE[1] / 2;

  for (const viewport of VIEWPORTS) {
    it(`${viewport.name}: 세 이름표 모두 얼굴 원과 겹치지 않는다`, () => {
      const faceWorld: Vec3 = [FRIED_RICE_MENTOR.x, FRIED_RICE_MENTOR_FACE_Y, FRIED_RICE_MENTOR.z];
      const face = project(faceWorld, viewport);
      const edge = project(
        [faceWorld[0] + FRIED_RICE_MENTOR_HEAD_RADIUS, faceWorld[1], faceWorld[2]],
        viewport,
      );
      const faceRadius = Math.abs(edge.xPx - face.xPx);
      for (let i = 0; i < 3; i += 1) {
        const k = knobPosition(i);
        const centerY = KNOB_Y + KNOB_LABEL_CENTER_Y - 0.0;
        void k;
        const c = project([k[0], centerY, k[2]], viewport);
        const right = project([k[0] + LABEL_HALF_W, centerY, k[2]], viewport);
        const top = project([k[0], centerY + LABEL_HALF_H, k[2]], viewport);
        const halfW = Math.abs(right.xPx - c.xPx);
        const halfH = Math.abs(top.yPx - c.yPx);
        // 직사각형과 원의 최소 거리
        const nearestX = Math.max(c.xPx - halfW, Math.min(face.xPx, c.xPx + halfW));
        const nearestY = Math.max(c.yPx - halfH, Math.min(face.yPx, c.yPx + halfH));
        const distance = Math.hypot(face.xPx - nearestX, face.yPx - nearestY);
        expect(distance, `knob ${i} label ↔ face`).toBeGreaterThan(faceRadius);
      }
    });
  }

  it("손잡이는 여전히 화면 안쪽 줄(KNOB_Y/Z) 위에 있고 오른쪽 끝도 선반 줄 폭 안이다", () => {
    expect(KNOB_Y).toBeGreaterThan(1.06);
    expect(KNOB_Z).toBe(-0.84);
    // 손잡이 + 이름표 오른쪽 끝이 선반 줄 폭(±1.0)보다 크게 벗어나지 않는다(카메라가 많이 물러나지 않는다)
    expect(KNOB_X[2] + KNOB_LABEL_SCALE[0] / 2).toBeLessThanOrEqual(1.06);
    expect(KNOB_X[2] + KNOB_RADIUS).toBeLessThanOrEqual(1.03);
  });
});
