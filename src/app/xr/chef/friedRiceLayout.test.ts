import { describe, expect, it } from "vitest";
import {
  INGREDIENTS,
  friedRiceReducer,
  initialFriedRiceState,
  type FriedRiceAction,
  type IngredientId,
} from "./friedRice";
import {
  FRIED_RICE_MENTOR,
  FRIED_RICE_MENTOR_FACE_Y,
  FRIED_RICE_MENTOR_HAT_TOP_Y,
  FRIED_RICE_MENTOR_HEAD_RADIUS,
  FRIED_RICE_MENTOR_POSES,
  MINI_TICKET,
  SHELF_ORIGINS,
  TICKET,
  TRAY,
  TRAY_LABEL,
  convergedCamera,
  framingPointsFor,
  isInsideTray,
  mentorPoseKeyFor,
  pinsFor,
  receivesPointer,
  traySlotPosition,
} from "./friedRiceLayout";
import { maxNonOverlappingHitAreaScale, projectPointToScreen, type Vec3 } from "./interactions3d";

function run(actions: FriedRiceAction[]) {
  return actions.reduce(friedRiceReducer, initialFriedRiceState);
}
const toPrep: FriedRiceAction[] = [
  { type: "OPEN_ORDER" },
  { type: "CHECK_REQUEST" },
  { type: "START_PREP" },
];
const add = (...ids: IngredientId[]): FriedRiceAction[] =>
  ids.map((id) => ({ type: "ADD_INGREDIENT", id }));

// 실제 화면: aspect-square, max 460px, min 320px, 가로는 (뷰포트 - 32px)와 544px 중 작은 값
const VIEWPORTS = [
  { name: "375px", width: 343, height: 343 },
  { name: "360px", width: 328, height: 328 },
  { name: "데스크톱", width: 544, height: 460 },
] as const;

function project(point: Vec3, viewport: (typeof VIEWPORTS)[number], stage: "order" | "prep") {
  const cam = convergedCamera(stage, viewport.width / viewport.height);
  return projectPointToScreen(point, {
    cameraPos: cam.cameraPos,
    forward: cam.forward,
    fovDeg: cam.fovDeg,
    viewportWidthPx: viewport.width,
    viewportHeightPx: viewport.height,
  });
}

describe("볶음밥 시범 — 조작 대상 핀", () => {
  it("글로 진행하기(interactive=false)에서는 핀이 없다", () => {
    expect(pinsFor(initialFriedRiceState, false)).toEqual([]);
    expect(pinsFor(run(toPrep), false)).toEqual([]);
  });

  it("주문표가 닫혀 있으면 주문표에만, 열린 뒤에는 요청 메모에만 '누르기' 핀이 붙는다", () => {
    const closed = pinsFor(initialFriedRiceState, true);
    expect(closed.map((p) => [p.id, p.kind])).toEqual([["ticket", "press"]]);
    const opened = pinsFor(run([{ type: "OPEN_ORDER" }]), true);
    expect(opened.map((p) => [p.id, p.kind])).toEqual([["request-note", "press"]]);
    const checked = pinsFor(run([{ type: "OPEN_ORDER" }, { type: "CHECK_REQUEST" }]), true);
    expect(checked.map((p) => p.id)).toEqual(["request-note"]);
  });

  it("재료 준비 중에는 선반에 남은 재료마다 '끌기', 트레이에 '놓는 곳', 작은 주문표에 '누르기'가 붙는다", () => {
    const pins = pinsFor(run(toPrep), true);
    expect(pins.filter((p) => p.kind === "drag").map((p) => p.id)).toEqual([
      "ingredient-rice",
      "ingredient-carrot",
      "ingredient-pea",
      "ingredient-onion",
    ]);
    expect(pins.filter((p) => p.kind === "drop").map((p) => p.id)).toEqual(["tray"]);
    expect(pins.filter((p) => p.kind === "press").map((p) => p.id)).toEqual(["mini-ticket"]);
  });

  it("트레이에 올린 재료의 '끌기' 핀은 사라진다(선반에 없으므로)", () => {
    const pins = pinsFor(run([...toPrep, ...add("rice", "onion")]), true);
    expect(pins.map((p) => p.id)).not.toContain("ingredient-rice");
    expect(pins.map((p) => p.id)).not.toContain("ingredient-onion");
    expect(pins.filter((p) => p.kind === "drag")).toHaveLength(2);
  });

  it("준비를 마치면 핀이 없다", () => {
    const done = run([...toPrep, ...add("rice", "carrot", "pea"), { type: "FINISH_PREP" }]);
    expect(pinsFor(done, true)).toEqual([]);
  });

  it("'놓는 곳' 핀의 연결선 끝은 트레이 위(드롭 판정 영역 안)다", () => {
    const drop = pinsFor(run(toPrep), true).find((p) => p.kind === "drop");
    expect(drop?.anchor).toBeDefined();
    expect(isInsideTray({ x: drop!.anchor![0], z: drop!.anchor![2] })).toBe(true);
  });
});

describe("볶음밥 시범 — 드롭 판정·배치", () => {
  it("트레이 한가운데·가장자리 근처는 안, 선반 줄과 트레이 밖은 바깥이다", () => {
    expect(isInsideTray({ x: TRAY.center[0], z: TRAY.center[2] })).toBe(true);
    expect(isInsideTray({ x: 0.7, z: TRAY.center[2] + 0.2 })).toBe(true);
    expect(isInsideTray({ x: 0, z: SHELF_ORIGINS.rice[2] })).toBe(false);
    expect(isInsideTray({ x: TRAY.width, z: TRAY.center[2] })).toBe(false);
  });

  it("선반 재료의 원래 자리는 드롭 영역 밖이다(잡기만 해도 올라가지 않는다)", () => {
    for (const item of INGREDIENTS) {
      const o = SHELF_ORIGINS[item.id];
      expect(isInsideTray({ x: o[0], z: o[2] })).toBe(false);
    }
  });

  it("트레이 자리는 재료마다 고정이고 선반 칸의 바로 아래(x 동일)이며 트레이 안이다", () => {
    for (const item of INGREDIENTS) {
      const slot = traySlotPosition(item.id);
      expect(slot[0]).toBe(SHELF_ORIGINS[item.id][0]);
      expect(isInsideTray({ x: slot[0], z: slot[2] })).toBe(true);
      expect(Math.abs(slot[0] - TRAY.center[0])).toBeLessThanOrEqual(TRAY.width / 2);
    }
  });

  it("선반 재료의 터치 영역은 서로 겹치지 않는다", () => {
    const origins = INGREDIENTS.map((item) => SHELF_ORIGINS[item.id]);
    // 기본 크기(배율 1)에서도 이웃과 겹치지 않아야 한다(상한이 0.9 이상)
    expect(maxNonOverlappingHitAreaScale(origins)).toBeGreaterThanOrEqual(0.9);
  });
});

describe("볶음밥 시범 — 화면 배치(수렴한 카메라)", () => {
  for (const viewport of VIEWPORTS) {
    it(`${viewport.name}: 단계별 필수 좌표가 모두 화면 안에 들어온다`, () => {
      for (const stage of ["order", "prep"] as const) {
        for (const point of framingPointsFor(stage)) {
          const p = project(point, viewport, stage);
          expect(p, `${stage} ${point}`).not.toBeNull();
          expect(p!.xPx).toBeGreaterThanOrEqual(0);
          expect(p!.xPx).toBeLessThanOrEqual(viewport.width);
          expect(p!.yPx).toBeGreaterThanOrEqual(0);
          expect(p!.yPx).toBeLessThanOrEqual(viewport.height);
        }
      }
    });

    it(`${viewport.name}: 선배 요리사 얼굴이 화면 안에 있고 주문표·트레이와 겹치지 않는다`, () => {
      const faceWorld: Vec3 = [FRIED_RICE_MENTOR.x, FRIED_RICE_MENTOR_FACE_Y, FRIED_RICE_MENTOR.z];
      for (const stage of ["order", "prep"] as const) {
        const face = project(faceWorld, viewport, stage)!;
        expect(face.xPx).toBeGreaterThan(20);
        expect(face.yPx).toBeGreaterThan(20);
        // 얼굴 반지름(px)
        const edge = project(
          [faceWorld[0] + FRIED_RICE_MENTOR_HEAD_RADIUS, faceWorld[1], faceWorld[2]],
          viewport,
          stage,
        )!;
        const radiusPx = Math.abs(edge.xPx - face.xPx);
        expect(radiusPx).toBeGreaterThan(14);
      }
      // 1단계: 주문표의 왼쪽 가장자리는 얼굴 오른쪽 끝보다 오른쪽이다(얼굴을 가리지 않는다)
      const faceOrder = project(faceWorld, viewport, "order")!;
      const radiusOrder = Math.abs(
        project([faceWorld[0] + FRIED_RICE_MENTOR_HEAD_RADIUS, faceWorld[1], faceWorld[2]], viewport, "order")!
          .xPx - faceOrder.xPx,
      );
      const ticketLeft = project(
        [TICKET.center[0] - TICKET.width / 2, TICKET.center[1], TICKET.center[2]],
        viewport,
        "order",
      )!;
      expect(ticketLeft.xPx).toBeGreaterThan(faceOrder.xPx + radiusOrder);
    });

    it(`${viewport.name}: 준비 단계에서 '끌기'·'놓는 곳'·'누르기' 핀끼리 겹치지 않는다`, () => {
      const pins = pinsFor(run(toPrep), true);
      const pts = pins.map((pin) => ({ id: pin.id, p: project(pin.world, viewport, "prep")! }));
      // 알약 크기(실측 약 46x20px)보다 넉넉한 간격
      for (let i = 0; i < pts.length; i += 1) {
        for (let j = i + 1; j < pts.length; j += 1) {
          const dx = Math.abs(pts[i].p.xPx - pts[j].p.xPx);
          const dy = Math.abs(pts[i].p.yPx - pts[j].p.yPx);
          expect(dx >= 50 || dy >= 24, `${pts[i].id} ↔ ${pts[j].id} (dx=${dx.toFixed(0)}, dy=${dy.toFixed(0)})`).toBe(true);
        }
      }
    });

    it(`${viewport.name}: 선반 재료 이름표는 서로 겹치지 않고, '준비 트레이' 이름표·핀과도 분리된다`, () => {
      // 이름표 월드 폭 0.46 → 화면 px
      const labels = INGREDIENTS.map((item) => {
        const o = SHELF_ORIGINS[item.id];
        const c = project([o[0], o[1] + 0.35, o[2]], viewport, "prep")!;
        const r = project([o[0] + 0.23, o[1] + 0.35, o[2]], viewport, "prep")!;
        return { id: item.id, x: c.xPx, y: c.yPx, half: Math.abs(r.xPx - c.xPx) };
      });
      for (let i = 0; i < labels.length - 1; i += 1) {
        expect(labels[i + 1].x - labels[i].x).toBeGreaterThan(labels[i].half + labels[i + 1].half - 1);
      }
      // '준비 트레이' 이름표는 아래쪽 핀(조리대 앞)보다 더 아래에 있다
      const trayPin = project(pinsFor(run(toPrep), true).find((p) => p.id === "tray")!.world, viewport, "prep")!;
      const trayLabel = project(TRAY_LABEL.position, viewport, "prep")!;
      expect(trayLabel.yPx).toBeGreaterThan(trayPin.yPx + 14);
    });

    it(`${viewport.name}: 작은 주문표의 '누르기' 핀은 선반 이름표 윗선보다 위에 있다`, () => {
      const pin = project(pinsFor(run(toPrep), true).find((p) => p.id === "mini-ticket")!.world, viewport, "prep")!;
      const pea = SHELF_ORIGINS.pea;
      const peaLabelTop = project([pea[0], pea[1] + 0.35 + 0.12, pea[2]], viewport, "prep")!;
      expect(pin.yPx + 10).toBeLessThan(peaLabelTop.yPx);
      // 작은 주문표 본체는 선배 요리사 모자보다 오른쪽이다
      const miniLeft = project(
        [MINI_TICKET.center[0] - MINI_TICKET.width / 2, MINI_TICKET.center[1], MINI_TICKET.center[2]],
        viewport,
        "prep",
      )!;
      const hat = project(
        [FRIED_RICE_MENTOR.x + FRIED_RICE_MENTOR_HEAD_RADIUS, FRIED_RICE_MENTOR_HAT_TOP_Y, FRIED_RICE_MENTOR.z],
        viewport,
        "prep",
      )!;
      expect(miniLeft.xPx).toBeGreaterThan(hat.xPx);
    });
  }
});

describe("볶음밥 시범 — 선배 요리사 자세", () => {
  it("주문 확인 중에는 주문표를 가리키고, 준비 중에는 조리대를, 양파를 올리면 작은 주문표를 가리킨다", () => {
    expect(mentorPoseKeyFor(initialFriedRiceState)).toBe("pointTicket");
    expect(mentorPoseKeyFor(run([{ type: "OPEN_ORDER" }]))).toBe("pointTicket");
    expect(mentorPoseKeyFor(run(toPrep))).toBe("pointCounter");
    expect(mentorPoseKeyFor(run([...toPrep, ...add("rice")]))).toBe("pointCounter");
    expect(mentorPoseKeyFor(run([...toPrep, ...add("onion")]))).toBe("pointMiniTicket");
  });

  it("준비가 맞으면(완료 전후) 소개 자세다", () => {
    expect(mentorPoseKeyFor(run([...toPrep, ...add("rice", "carrot", "pea")]))).toBe("present");
    const done = run([...toPrep, ...add("rice", "carrot", "pea"), { type: "FINISH_PREP" }]);
    expect(mentorPoseKeyFor(done)).toBe("present");
  });

  it("자세는 선택의 정오를 평가하는 동작(박수·엄지·고개 젓기)이 아니라 안내 동작만이다", () => {
    for (const pose of Object.values(FRIED_RICE_MENTOR_POSES)) {
      // 고개를 좌우로 크게 돌리거나(젓기) 팔을 머리 위로 올리는(박수) 값이 없다
      expect(Math.abs(pose.headYaw)).toBeLessThan(0.5);
      expect(pose.armL.fwd).toBeLessThan(1.3);
      expect(pose.armR.fwd).toBeLessThan(0.5);
    }
  });

  it("선배 요리사에게는 조작 핸들러를 쓰지 않는다(씬 파일 확인)", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const mentor = readFileSync(join(__dirname, "ChefMentor.tsx"), "utf8");
    expect(mentor).not.toMatch(/onPointer|onClick/);
  });
});

describe("볶음밥 시범 — 드래그 중 포인터 수신", () => {
  it("평소에는 interactive인 대상이 모두 포인터를 받는다", () => {
    expect(receivesPointer(true, false, false)).toBe(true);
  });

  it("끄는 중에는 끄는 대상만 받고 나머지(트레이 재료·작은 주문표·이웃 재료)는 받지 않는다", () => {
    expect(receivesPointer(true, true, true)).toBe(true);
    expect(receivesPointer(true, true, false)).toBe(false);
  });

  it("interactive가 아니면(글로 진행하기·준비 단계 밖) 끄는 중이어도 받지 않는다", () => {
    expect(receivesPointer(false, false, false)).toBe(false);
    expect(receivesPointer(false, true, true)).toBe(false);
  });
});
