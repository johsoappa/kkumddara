import { describe, expect, it } from "vitest";
import { MODE_POINTS, type Mode } from "./scenario";
import {
  CAMERA_STAGES,
  SCENE_ANCHORS,
  TARGET_PIN_TEXT,
  fitCameraFraming,
  framingPointsForStage,
  projectPointToScreen,
  sceneInteractionId,
  scaledCameraPosition,
  targetPinsForAnchor,
  type Vec3,
} from "./interactions3d";

// F9 — 조작 대상 핀 스펙: 실제 대상에만 붙고, 번호가 아니라 행동 동사를 쓰며,
// 아래 안내 문구(SCENE_HINTS)와 같은 말을 쓴다.
describe("targetPinsForAnchor", () => {
  const entries = Object.entries(SCENE_ANCHORS);

  it("모든 지점 앵커에 대해 핀 id가 유일하다", () => {
    for (const [id, anchor] of entries) {
      const pins = targetPinsForAnchor(anchor);
      expect(new Set(pins.map((p) => p.id)).size, id).toBe(pins.length);
    }
  });

  it("select: 대상 1개당 '누르기' 핀 1개, 대상보다 아래에 놓인다", () => {
    for (const [id, anchor] of entries) {
      if (anchor.kind !== "select") continue;
      const pins = targetPinsForAnchor(anchor);
      expect(pins, id).toHaveLength(anchor.targets.length);
      pins.forEach((pin, i) => {
        expect(pin.kind).toBe("press");
        expect(pin.world[0]).toBe(anchor.targets[i][0]);
        expect(pin.world[1]).toBeLessThan(anchor.targets[i][1]);
        expect(pin.world[2]).toBe(anchor.targets[i][2]);
      });
    }
  });

  it("place: 토큰 수만큼 '끌기' 핀 + 드롭존에 '놓는 곳' 핀 정확히 1개", () => {
    for (const [id, anchor] of entries) {
      if (anchor.kind !== "place") continue;
      const pins = targetPinsForAnchor(anchor);
      expect(pins.filter((p) => p.kind === "drag"), id).toHaveLength(anchor.tokens.length);
      const drops = pins.filter((p) => p.kind === "drop");
      expect(drops).toHaveLength(1);
      expect(drops[0].world[0]).toBe(anchor.dropZone[0]);
      // 평평한 원판이라 카메라 쪽(+z) 가장자리에 둔다 — 원판 중심보다 앞이다
      expect(drops[0].world[2]).toBeGreaterThan(anchor.dropZone[2]);
      // 연결선 끝은 실제 드롭 원판 위(판정 반경 안)다 — 장식이 아니라 목적지를 가리킨다
      const end = drops[0].anchor;
      expect(end, `${id} 드롭 핀 연결선`).toBeDefined();
      expect(end![1]).toBe(anchor.dropZone[1]);
      expect(Math.hypot(end![0] - anchor.dropZone[0], end![2] - anchor.dropZone[2])).toBeLessThanOrEqual(
        anchor.dropRadius,
      );
      // 토큰 핀에는 연결선이 없다
      pins.filter((p) => p.kind === "drag").forEach((p) => expect(p.anchor).toBeUndefined());
    }
  });

  it("order: 타일 슬롯마다 '끌기' 핀 + 확정 버튼에 '누르기' 핀 1개", () => {
    for (const [id, anchor] of entries) {
      if (anchor.kind !== "order") continue;
      const pins = targetPinsForAnchor(anchor);
      expect(pins.filter((p) => p.kind === "drag"), id).toHaveLength(anchor.slots.length);
      expect(pins.filter((p) => p.kind === "press")).toHaveLength(1);
      expect(pins.filter((p) => p.kind === "drop")).toHaveLength(0);
    }
  });

  it("핀 문구는 번호가 아니라 행동 동사다", () => {
    expect(TARGET_PIN_TEXT).toEqual({ press: "누르기", drag: "끌기", drop: "놓는 곳" });
    for (const text of Object.values(TARGET_PIN_TEXT)) {
      expect(text).not.toMatch(/\d/);
    }
  });
});

// 실제 화면에서 핀이 서로, 그리고 화면 밖으로 겹치지 않는지 — 단계별 "수렴한" 카메라
// (FOV·거리 보정 포함)로 투영해 확인한다. 알약 크기는 11px 한글 3~4자 + 꼭지를 넉넉히 덮는
// 64x26 CSS px 상자로 본다.
describe("targetPinsForAnchor — 화면 배치", () => {
  // 알약 실제 폭(CSS px): 11px 굵은 한글 + 좌우 패딩·테두리 16px— 브라우저 실측: 끌기 34.2 · 놓는 곳 46.3 · 누르기 약 45(높이 20.2 + 꼭지 6). 꼭지(6px)까지 높이에 포함.
  const PILL_W: Record<string, number> = { press: 46, drag: 35, drop: 47 };
  const PILL_H = 26;
  const GAP = 2;
  const EDGE_MARGIN = 24; // ChefPinProjector의 좌우 안쪽 여백과 같은 값
  const VIEWPORTS: Array<[string, number, number]> = [
    ["375px 폰", 343, 487],
    ["360px 폰", 328, 480],
    ["데스크톱", 544, 540],
  ];

  function settledView(stage: keyof typeof CAMERA_STAGES, id: string, w: number, h: number) {
    const { position, lookAt } = CAMERA_STAGES[stage];
    const points = framingPointsForStage(stage, id);
    if (!points) throw new Error(`프레이밍 점이 없는 지점: ${id}`);
    const framing = fitCameraFraming({ cameraPos: position, lookAt, points, aspect: w / h });
    const cameraPos = scaledCameraPosition(position, lookAt, framing.distanceScale);
    const f: Vec3 = [lookAt[0] - cameraPos[0], lookAt[1] - cameraPos[1], lookAt[2] - cameraPos[2]];
    return {
      cameraPos,
      forward: f,
      fovDeg: framing.fovDeg,
      viewportWidthPx: w,
      viewportHeightPx: h,
    };
  }

  for (const mode of ["compass", "sprout"] as Mode[]) {
    for (const point of MODE_POINTS[mode]) {
      const id = sceneInteractionId(mode, point.point);
      it(`${id}: 모든 뷰포트에서 핀이 서로 겹치지 않고 화면 안에 있다`, () => {
        const anchor = SCENE_ANCHORS[id];
        const pins = targetPinsForAnchor(anchor);
        for (const [name, w, h] of VIEWPORTS) {
          const view = settledView(point.cameraStage, id, w, h);
          const boxes = pins.map((pin) => {
            const projected = projectPointToScreen(pin.world, view);
            expect(projected, `${id} ${name} ${pin.id}`).not.toBeNull();
            const x = Math.min(w - EDGE_MARGIN, Math.max(EDGE_MARGIN, projected!.xPx));
            const y = projected!.yPx;
            expect(y, `${id} ${name} ${pin.id} y`).toBeGreaterThan(PILL_H / 2);
            expect(y, `${id} ${name} ${pin.id} y`).toBeLessThan(h - PILL_H / 2);
            return { id: pin.id, kind: pin.kind, x, y };
          });
          for (let i = 0; i < boxes.length; i += 1) {
            for (let j = i + 1; j < boxes.length; j += 1) {
              const halfW = (PILL_W[boxes[i].kind] + PILL_W[boxes[j].kind]) / 2 + GAP;
              const overlapX = Math.abs(boxes[i].x - boxes[j].x) < halfW;
              const overlapY = Math.abs(boxes[i].y - boxes[j].y) < PILL_H + GAP;
              expect(
                overlapX && overlapY,
                `${id} ${name}: ${boxes[i].id}↔${boxes[j].id} 핀 겹침`,
              ).toBe(false);
            }
          }
        }
      });
    }
  }
});

// Codex 적대적 리뷰 반영: 선택지가 비어 있으면 누를 대상이 없는데 핀만 남으면 안 된다.
describe("targetPinsForAnchor — 렌더되는 선택지 수에 맞춘다", () => {
  it("select: 선택지 0개면 핀이 없고, 2개면 2개만", () => {
    const anchor = SCENE_ANCHORS.compass_p1;
    expect(targetPinsForAnchor(anchor, 0)).toEqual([]);
    expect(targetPinsForAnchor(anchor, 2).map((p) => p.id)).toEqual(["select-0", "select-1"]);
    expect(targetPinsForAnchor(anchor)).toHaveLength(3);
  });

  it("place: 선택지 0개여도 항상 렌더되는 드롭 원판 핀은 남는다", () => {
    const anchor = SCENE_ANCHORS.compass_p2;
    expect(targetPinsForAnchor(anchor, 0).map((p) => p.id)).toEqual(["drop-zone"]);
    expect(targetPinsForAnchor(anchor, 3).map((p) => p.id)).toEqual([
      "token-0",
      "token-1",
      "token-2",
      "drop-zone",
    ]);
  });

  it("order: 선택지 0개여도 항상 렌더되는 확정 버튼 핀은 남는다", () => {
    const anchor = SCENE_ANCHORS.compass_p3;
    expect(targetPinsForAnchor(anchor, 0).map((p) => p.id)).toEqual(["confirm"]);
  });
});
