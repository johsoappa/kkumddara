import { describe, expect, it } from "vitest";
import { CHOICE_POINTS, SPROUT_POINTS, type Mode } from "./scenario";
import {
  MIN_TARGET_SPACING,
  MODE_POINT_CHOICES,
  SCENE_TARGETS,
  cameraForPoint,
  fitVerticalFov,
  overviewCamera,
  pairwiseMinDistance,
  resolveTargets,
  sceneInteractionId,
} from "./sceneLayout";

// G2.2-R2 필수 테스트 1~3:
// "새싹 3개 point / 나침반 5개 point 각각에서 scene target과 기존 choice ID가
// 정확히 1:1 연결되고, 선택 가능한 target이 1개 이상 존재한다."
// scenario.ts는 이 파일에서 읽기만 한다 — 수정하지 않는다.

const MODES: Mode[] = ["compass", "sprout"];

describe("SCENE_TARGETS — 모든 mode·point에서 choices와 1:1 대응", () => {
  it.each(MODES)("%s 모드의 모든 point에 대해 target 개수 === choices 개수 (1개 이상)", (mode) => {
    const points = mode === "compass" ? CHOICE_POINTS : SPROUT_POINTS;
    for (const point of points) {
      const id = sceneInteractionId(mode, point.point);
      const targets = SCENE_TARGETS[id];
      expect(targets, `${id}에 대응하는 SCENE_TARGETS 항목이 없습니다`).toBeDefined();
      expect(targets.length).toBeGreaterThan(0);
      expect(targets.length).toBe(point.choices.length);
    }
  });

  it.each(MODES)("%s 모드의 모든 point에서 resolveTargets가 choice.id를 그대로 보존한다", (mode) => {
    const points = mode === "compass" ? CHOICE_POINTS : SPROUT_POINTS;
    for (const point of points) {
      const id = sceneInteractionId(mode, point.point);
      const resolved = resolveTargets(id, point.choices);
      expect(resolved.map((r) => r.choice.id)).toEqual(point.choices.map((c) => c.id));
      expect(resolved.map((r) => r.choice.axis)).toEqual(point.choices.map((c) => c.axis));
    }
  });

  it("MODE_POINT_CHOICES는 scenario.ts의 실제 choices 배열과 길이가 같다(회귀 고정)", () => {
    expect(MODE_POINT_CHOICES.compass.map((c) => c.length)).toEqual(
      CHOICE_POINTS.map((p) => p.choices.length),
    );
    expect(MODE_POINT_CHOICES.sprout.map((c) => c.length)).toEqual(
      SPROUT_POINTS.map((p) => p.choices.length),
    );
  });

  it("정의되지 않은 sceneInteractionId는 빈 배열을 반환한다(0개 타깃 방지 확인용 방어)", () => {
    expect(resolveTargets("compass_p99", [])).toEqual([]);
  });
});

describe("SCENE_TARGETS — 같은 point 안에서 동시에 등장하는 타깃 간 최소 간격", () => {
  it.each(Object.keys(SCENE_TARGETS))(
    "%s의 타깃들은 서로 최소 간격(%s) 이상 떨어져 있다",
    (id) => {
      const positions = SCENE_TARGETS[id].map((t) => t.position);
      if (positions.length < 2) return;
      expect(pairwiseMinDistance(positions)).toBeGreaterThanOrEqual(MIN_TARGET_SPACING);
    },
  );
});

describe("fitVerticalFov — 좁은 세로 화면에서 FOV가 더 넓게 계산된다", () => {
  const cameraPos: [number, number, number] = [0, 1.8, 3.2];
  const lookAt: [number, number, number] = [0, 1.1, -1.2];
  const points: [number, number, number][] = [
    [1.4, 1.5, -1.6],
    [-1.4, 1.35, -0.6],
  ];

  it("가로가 넓은 화면(aspect>1)보다 세로로 좁은 화면(aspect<1)에서 필요한 FOV가 더 크거나 같다", () => {
    const wideFov = fitVerticalFov({ cameraPos, lookAt, points, aspect: 1.6 });
    const narrowFov = fitVerticalFov({ cameraPos, lookAt, points, aspect: 0.5 });
    expect(narrowFov).toBeGreaterThanOrEqual(wideFov);
  });

  it("계산된 FOV는 항상 min/max 범위 안에 있다", () => {
    const fov = fitVerticalFov({ cameraPos, lookAt, points, aspect: 0.4, minFovDeg: 42, maxFovDeg: 80 });
    expect(fov).toBeGreaterThanOrEqual(42);
    expect(fov).toBeLessThanOrEqual(80);
  });

  it("타깃이 카메라에서 멀리 흩어질수록 더 넓은 FOV가 필요하다", () => {
    const closePoints: [number, number, number][] = [[0.1, 1.3, -1.3]];
    const farPoints: [number, number, number][] = [
      [2.5, 2.2, -2.5],
      [-2.5, 0.5, -2.5],
    ];
    const closeFov = fitVerticalFov({ cameraPos, lookAt, points: closePoints, aspect: 0.7 });
    const farFov = fitVerticalFov({ cameraPos, lookAt, points: farPoints, aspect: 0.7 });
    expect(farFov).toBeGreaterThanOrEqual(closeFov);
  });
});

describe("cameraForPoint / overviewCamera — 카메라는 항상 씬 앞쪽(+z 방향)에 위치한다", () => {
  it.each(Object.keys(SCENE_TARGETS))("%s의 카메라 z가 모든 타깃보다 크다(카메라가 대상 뒤로 파묻히지 않음)", (id) => {
    const { position, points } = cameraForPoint(id);
    for (const point of points) {
      expect(position[2]).toBeGreaterThan(point[2]);
    }
  });

  it("overviewCamera의 카메라 z도 모든 랜드마크보다 크다", () => {
    const { position, points } = overviewCamera();
    for (const point of points) {
      expect(position[2]).toBeGreaterThan(point[2]);
    }
  });
});
