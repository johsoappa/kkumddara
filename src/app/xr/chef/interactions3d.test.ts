import { describe, expect, it } from "vitest";
import { MODE_POINTS, type Mode } from "./scenario";
import {
  CELEBRATE_LANDMARKS,
  LABEL_HALF_HEIGHT_LARGE,
  LABEL_HALF_HEIGHT_SMALL,
  LABEL_HALF_WIDTH_LARGE,
  LABEL_HALF_WIDTH_SMALL,
  LABEL_OFFSET_LARGE,
  LABEL_OFFSET_SMALL,
  OVERVIEW_LANDMARKS,
  SCENE_ANCHORS,
  easeAlpha,
  easeVec3,
  fitCameraFraming,
  fitVerticalFov,
  framingPointsForAnchor,
  framingPointsForStage,
  hitTestDropZone,
  reorderOnDrag,
  sceneInteractionId,
  type Vec3,
} from "./interactions3d";

describe("sceneInteractionId", () => {
  it("모드+지점 번호로 안정적인 id를 만든다 (stage/kind로 추론하지 않음)", () => {
    expect(sceneInteractionId("compass", 4)).toBe("compass_p4");
    expect(sceneInteractionId("compass", 5)).toBe("compass_p5");
    expect(sceneInteractionId("sprout", 3)).toBe("sprout_p3");
    // compass p4/p5와 sprout p3는 모두 select+plating이지만 id는 모두 다르다
    const ids = [
      sceneInteractionId("compass", 4),
      sceneInteractionId("compass", 5),
      sceneInteractionId("sprout", 3),
    ];
    expect(new Set(ids).size).toBe(3);
  });
});

describe("SCENE_ANCHORS — 앵커가 해당 stage 카메라의 정면(전방)에 있는지 검증", () => {
  // ChefScene.tsx의 CAMERA_STAGES와 동일한 값(회귀 재현/검증용 고정 복사).
  // G2.1-R1-F1에서 compass_p5가 plating 카메라 시야 반대쪽(z=+0.5~1.15, 카메라는
  // -z를 바라봄)에 있어 아예 렌더링되지 않는 버그가 있었다 — 이 테스트는 그런
  // "앵커가 카메라 뒤/옆에 있어 화면에 나타나지 않는" 종류의 회귀를 잡는다.
  const CAMERA_STAGES_FOR_TEST: Record<string, { position: Vec3; lookAt: Vec3 }> = {
    overview: { position: [0, 1.8, 3.2], lookAt: [0, 1.1, -1.2] },
    approach: { position: [0, 1.6, 2.3], lookAt: [0, 1.0, -1.2] },
    search: { position: [-1.0, 1.4, 2.1], lookAt: [0.2, 0.8, -1.2] },
    survey: { position: [0, 2.1, 3.6], lookAt: [0, 1.0, -1.2] },
    plating: { position: [0.4, 1.6, 0.6], lookAt: [0.1, 1.05, -1.1] },
    celebrate: { position: [0.6, 1.5, 1.4], lookAt: [0.3, 1.05, -0.6] },
  };

  function isInFrontOfCamera(cameraPos: Vec3, lookAt: Vec3, point: Vec3): boolean {
    const forward: Vec3 = [
      lookAt[0] - cameraPos[0],
      lookAt[1] - cameraPos[1],
      lookAt[2] - cameraPos[2],
    ];
    const rel: Vec3 = [
      point[0] - cameraPos[0],
      point[1] - cameraPos[1],
      point[2] - cameraPos[2],
    ];
    const dot = forward[0] * rel[0] + forward[1] * rel[1] + forward[2] * rel[2];
    return dot > 0;
  }

  const modes: Mode[] = ["compass", "sprout"];
  for (const mode of modes) {
    MODE_POINTS[mode].forEach((point) => {
      it(`${mode} 지점${point.point} — 앵커의 모든 대상이 ${point.cameraStage} 카메라 정면에 있다`, () => {
        const id = sceneInteractionId(mode, point.point);
        const anchor = SCENE_ANCHORS[id];
        const { position, lookAt } = CAMERA_STAGES_FOR_TEST[point.cameraStage];

        const corePoints: Vec3[] =
          anchor.kind === "select"
            ? anchor.targets
            : anchor.kind === "place"
              ? [...anchor.tokens, anchor.dropZone]
              : [...anchor.slots, anchor.confirm];

        corePoints.forEach((p, i) => {
          expect(
            isInFrontOfCamera(position, lookAt, p),
            `${id}의 ${i}번째 점 ${JSON.stringify(p)}가 카메라 뒤/옆에 있어 렌더링되지 않을 수 있다`,
          ).toBe(true);
        });
      });
    });
  }
});

describe("SCENE_ANCHORS 매핑 무결성", () => {
  const modes: Mode[] = ["compass", "sprout"];

  for (const mode of modes) {
    MODE_POINTS[mode].forEach((point) => {
      it(`${mode} 지점${point.point} — anchor kind와 choices 개수가 시나리오와 일치한다`, () => {
        const id = sceneInteractionId(mode, point.point);
        const anchor = SCENE_ANCHORS[id];
        expect(anchor, `${id} 앵커가 존재해야 한다`).toBeDefined();
        expect(anchor.kind).toBe(point.interactionKind);

        if (anchor.kind === "select") {
          expect(anchor.targets.length).toBe(point.choices.length);
        } else if (anchor.kind === "place") {
          expect(anchor.tokens.length).toBe(point.choices.length);
        } else if (anchor.kind === "order") {
          expect(anchor.slots.length).toBe(point.choices.length);
        }
      });
    });
  }
});

describe("hitTestDropZone", () => {
  const zones = [{ id: "z1", x: 0, z: 0, radius: 0.3 }];

  it("반경 안이면 해당 zone id를 반환한다", () => {
    expect(hitTestDropZone({ x: 0.1, z: 0.1 }, zones)).toBe("z1");
  });

  it("반경 밖이면 null을 반환한다", () => {
    expect(hitTestDropZone({ x: 1, z: 1 }, zones)).toBeNull();
  });

  it("경계값(정확히 radius)은 포함으로 처리한다", () => {
    expect(hitTestDropZone({ x: 0.3, z: 0 }, zones)).toBe("z1");
  });

  it("여러 zone 중 먼저 맞는 것을 반환한다", () => {
    const multi = [
      { id: "a", x: -1, z: 0, radius: 0.2 },
      { id: "b", x: 1, z: 0, radius: 0.2 },
    ];
    expect(hitTestDropZone({ x: 1, z: 0 }, multi)).toBe("b");
  });
});

describe("reorderOnDrag", () => {
  const slotX = [-0.5, 0, 0.5];

  it("드래그한 타일이 오른쪽 슬롯을 넘어가면(정방향 교차) 순서가 바뀐다", () => {
    const order = ["a", "b", "c"]; // a는 slot 0
    const next = reorderOnDrag(order, "a", 0.5, slotX); // a가 slot 2 위치까지 이동
    expect(next).toEqual(["b", "c", "a"]);
  });

  it("드래그한 타일이 왼쪽 슬롯을 넘어가면(역방향 교차) 순서가 바뀐다", () => {
    const order = ["a", "b", "c"]; // c는 slot 2
    const next = reorderOnDrag(order, "c", -0.5, slotX); // c가 slot 0 위치까지 이동
    expect(next).toEqual(["c", "a", "b"]);
  });

  it("아직 이웃 슬롯을 넘지 않았으면(no-op) 같은 배열을 반환한다", () => {
    const order = ["a", "b", "c"];
    const next = reorderOnDrag(order, "b", 0.05, slotX); // slot 1 근처 그대로
    expect(next).toBe(order); // 참조 동일성까지 확인 — 불필요한 리렌더 방지
  });

  it("존재하지 않는 id면 원본을 그대로 반환한다", () => {
    const order = ["a", "b", "c"];
    expect(reorderOnDrag(order, "z", 0.5, slotX)).toBe(order);
  });
});

describe("easeAlpha / easeVec3", () => {
  it("dt가 0이면 alpha도 0이라 목표로 이동하지 않는다", () => {
    expect(easeAlpha(0, 0.35)).toBe(0);
  });

  it("dt가 커질수록 alpha가 1에 수렴한다", () => {
    const a1 = easeAlpha(0.1, 0.35);
    const a2 = easeAlpha(1, 0.35);
    const a3 = easeAlpha(10, 0.35);
    expect(a1).toBeLessThan(a2);
    expect(a2).toBeLessThan(a3);
    expect(a3).toBeGreaterThan(0.99);
  });

  it("halfLife가 0 이하이면 즉시 목표값(alpha=1)으로 스냅한다", () => {
    expect(easeAlpha(0.1, 0)).toBe(1);
  });

  it("easeVec3는 alpha=1이면 목표값과 정확히 같아진다(수렴)", () => {
    const result = easeVec3([0, 0, 0], [1, 2, 3], 1);
    expect(result).toEqual([1, 2, 3]);
  });

  it("easeVec3는 alpha=0이면 현재값을 그대로 유지한다(멱등)", () => {
    const result = easeVec3([1, 1, 1], [5, 5, 5], 0);
    expect(result).toEqual([1, 1, 1]);
  });

  it("easeVec3는 목표에 이미 도달했으면 그대로 유지한다(멱등)", () => {
    const result = easeVec3([2, 2, 2], [2, 2, 2], 0.5);
    expect(result).toEqual([2, 2, 2]);
  });
});

describe("fitVerticalFov — G2.1-R1-F1", () => {
  // 카메라를 원점에 두고 -z를 바라보게 해 손계산으로 검증하기 쉬운 좌표계를 사용한다.
  const cameraPos: [number, number, number] = [0, 0, 0];
  const lookAt: [number, number, number] = [0, 0, -1];

  it("점이 넓게 퍼질수록 더 큰 FOV가 필요하다(단조 증가)", () => {
    const narrow = fitVerticalFov({
      cameraPos,
      lookAt,
      points: [[0.2, 0, -1]],
      aspect: 1,
    });
    const wide = fitVerticalFov({
      cameraPos,
      lookAt,
      points: [[0.8, 0, -1]],
      aspect: 1,
    });
    expect(wide).toBeGreaterThan(narrow);
  });

  it("동일한 수평 스프레드라도 aspect가 좁을수록(세로가 김) 더 큰 수직 FOV가 필요하다", () => {
    const wideAspect = fitVerticalFov({
      cameraPos,
      lookAt,
      points: [[0.6, 0, -1]],
      aspect: 1.3,
    });
    const narrowAspect = fitVerticalFov({
      cameraPos,
      lookAt,
      points: [[0.6, 0, -1]],
      aspect: 0.5,
    });
    expect(narrowAspect).toBeGreaterThan(wideAspect);
  });

  it("최소/최대 FOV 범위를 벗어나지 않는다(클램프)", () => {
    const tiny = fitVerticalFov({
      cameraPos,
      lookAt,
      points: [[0.001, 0, -1]],
      aspect: 1,
      minFovDeg: 40,
      maxFovDeg: 85,
    });
    expect(tiny).toBe(40);

    const huge = fitVerticalFov({
      cameraPos,
      lookAt,
      points: [[50, 0, -1]],
      aspect: 1,
      minFovDeg: 40,
      maxFovDeg: 85,
    });
    expect(huge).toBe(85);
  });

  it("카메라 뒤쪽(depth<=0)의 점은 계산에서 무시한다", () => {
    const withBehindPoint = fitVerticalFov({
      cameraPos,
      lookAt,
      points: [
        [0.4, 0, -1],
        [5, 0, 1], // 카메라 뒤쪽 — forward와 반대 방향
      ],
      aspect: 1,
    });
    const onlyFrontPoint = fitVerticalFov({
      cameraPos,
      lookAt,
      points: [[0.4, 0, -1]],
      aspect: 1,
    });
    expect(withBehindPoint).toBe(onlyFrontPoint);
  });

  it("유효한 점이 하나도 없으면 기본값(약 55도, 범위 내로 클램프)을 반환한다", () => {
    const result = fitVerticalFov({ cameraPos, lookAt, points: [], aspect: 1 });
    expect(result).toBeGreaterThanOrEqual(40);
    expect(result).toBeLessThanOrEqual(85);
  });
});

describe("fitCameraFraming — FOV로 부족하면 거리(distanceScale)로 보정한다", () => {
  it("여유 있는 경우 distanceScale=1이고 fitVerticalFov와 같은 fov를 준다", () => {
    const cameraPos: Vec3 = [0, 0, 5];
    const lookAt: Vec3 = [0, 0, 0];
    const points: Vec3[] = [[0.3, 0, 0]];
    const result = fitCameraFraming({ cameraPos, lookAt, points, aspect: 1 });
    expect(result.distanceScale).toBe(1);
    expect(result.fovDeg).toBeCloseTo(fitVerticalFov({ cameraPos, lookAt, points, aspect: 1 }));
  });

  it("카메라가 대상에 비해 너무 가까우면 fov는 maxFovDeg로 고정되고 distanceScale>1을 반환한다", () => {
    const cameraPos: Vec3 = [0, 0, 1];
    const lookAt: Vec3 = [0, 0, 0];
    const points: Vec3[] = [[3, 0, 0]]; // 카메라 지척에서 넓게 퍼진 점 — FOV만으론 못 담는 상황
    const result = fitCameraFraming({ cameraPos, lookAt, points, aspect: 1, maxFovDeg: 85 });
    expect(result.fovDeg).toBe(85);
    expect(result.distanceScale).toBeGreaterThan(1);
  });

  it("계산된 distanceScale만큼 카메라를 실제로 밀면, 그 위치에서 다시 계산한 FOV가 maxFovDeg 이내로 들어온다", () => {
    const cameraPos: Vec3 = [0, 0, 1];
    const lookAt: Vec3 = [0, 0, 0];
    const points: Vec3[] = [
      [3, 0, 0],
      [-2, 1, 0.5],
    ];
    const result = fitCameraFraming({ cameraPos, lookAt, points, aspect: 0.7, maxFovDeg: 85 });
    expect(result.distanceScale).toBeGreaterThan(1);

    const pushedCameraPos: Vec3 = [
      lookAt[0] + (cameraPos[0] - lookAt[0]) * result.distanceScale,
      lookAt[1] + (cameraPos[1] - lookAt[1]) * result.distanceScale,
      lookAt[2] + (cameraPos[2] - lookAt[2]) * result.distanceScale,
    ];
    const refit = fitVerticalFov({
      cameraPos: pushedCameraPos,
      lookAt,
      points,
      aspect: 0.7,
      maxFovDeg: 1000,
    });
    expect(refit).toBeLessThanOrEqual(85.01);
  });

  it.each(["compass_p4", "compass_p5", "sprout_p3"] as const)(
    "실제 %s(모바일 375px, plating 카메라)에서도 밀어낸 뒤 재계산한 FOV가 max 이내로 들어온다",
    (id) => {
      // ChefScene.tsx의 CAMERA_STAGES.plating과 동일한 값(회귀 재현용으로 고정 복사)
      const platingCameraPos: Vec3 = [0.4, 1.6, 0.6];
      const platingLookAt: Vec3 = [0.1, 1.05, -1.1];
      const anchor = SCENE_ANCHORS[id];
      const points = framingPointsForAnchor(anchor);
      const mobileAspect = 343 / 487; // 375px 폭 컨테이너의 대략적인 실측 aspect

      const result = fitCameraFraming({
        cameraPos: platingCameraPos,
        lookAt: platingLookAt,
        points,
        aspect: mobileAspect,
      });

      const pushedCameraPos: Vec3 = [
        platingLookAt[0] + (platingCameraPos[0] - platingLookAt[0]) * result.distanceScale,
        platingLookAt[1] + (platingCameraPos[1] - platingLookAt[1]) * result.distanceScale,
        platingLookAt[2] + (platingCameraPos[2] - platingLookAt[2]) * result.distanceScale,
      ];
      const refit = fitVerticalFov({
        cameraPos: pushedCameraPos,
        lookAt: platingLookAt,
        points,
        aspect: mobileAspect,
        maxFovDeg: 1000,
      });
      expect(refit).toBeLessThanOrEqual(85.01);
    },
  );

  it.each(["compass_p4", "compass_p5", "sprout_p3"] as const)(
    "실제 %s(데스크톱, plating 카메라)에서도 밀어낸 뒤 재계산한 FOV가 max 이내로 들어온다",
    (id) => {
      const platingCameraPos: Vec3 = [0.4, 1.6, 0.6];
      const platingLookAt: Vec3 = [0.1, 1.05, -1.1];
      const anchor = SCENE_ANCHORS[id];
      const points = framingPointsForAnchor(anchor);
      const desktopAspect = 544 / 432; // 이번 QA에서 실측한 데스크톱 canvas aspect

      const result = fitCameraFraming({
        cameraPos: platingCameraPos,
        lookAt: platingLookAt,
        points,
        aspect: desktopAspect,
      });
      const pushedCameraPos: Vec3 = [
        platingLookAt[0] + (platingCameraPos[0] - platingLookAt[0]) * result.distanceScale,
        platingLookAt[1] + (platingCameraPos[1] - platingLookAt[1]) * result.distanceScale,
        platingLookAt[2] + (platingCameraPos[2] - platingLookAt[2]) * result.distanceScale,
      ];
      const refit = fitVerticalFov({
        cameraPos: pushedCameraPos,
        lookAt: platingLookAt,
        points,
        aspect: desktopAspect,
        maxFovDeg: 1000,
      });
      expect(refit).toBeLessThanOrEqual(85.01);
    },
  );
});

describe("framingPointsForAnchor — 라벨 네 모서리까지 포함해 프레이밍 점을 만든다", () => {
  it("select 앵커: 타겟마다 [메시 위치, 라벨 네 모서리] 5점씩 만들고, 모서리는 라벨 폭·높이만큼 뻗어 있다", () => {
    const anchor = SCENE_ANCHORS.compass_p1;
    if (anchor.kind !== "select") throw new Error("compass_p1은 select여야 한다");
    const points = framingPointsForAnchor(anchor);
    expect(points).toHaveLength(anchor.targets.length * 5);

    anchor.targets.forEach((target, i) => {
      const group = points.slice(i * 5, i * 5 + 5);
      const mesh = group[0];
      const corners = group.slice(1);
      expect(mesh).toEqual(target);

      const xs = corners.map((c) => c[0]);
      const ys = corners.map((c) => c[1]);
      expect(Math.min(...xs)).toBeCloseTo(target[0] - LABEL_HALF_WIDTH_LARGE);
      expect(Math.max(...xs)).toBeCloseTo(target[0] + LABEL_HALF_WIDTH_LARGE);
      expect(Math.min(...ys)).toBeCloseTo(
        target[1] + LABEL_OFFSET_LARGE - LABEL_HALF_HEIGHT_LARGE,
      );
      expect(Math.max(...ys)).toBeCloseTo(
        target[1] + LABEL_OFFSET_LARGE + LABEL_HALF_HEIGHT_LARGE,
      );
      corners.forEach((c) => expect(c[2]).toBeCloseTo(target[2]));
    });
  });

  it("place 앵커: 토큰마다 5점 + 드롭존 1점(라벨 없음)", () => {
    const anchor = SCENE_ANCHORS.compass_p2;
    if (anchor.kind !== "place") throw new Error("compass_p2는 place여야 한다");
    const points = framingPointsForAnchor(anchor);
    expect(points).toHaveLength(anchor.tokens.length * 5 + 1);
    expect(points[points.length - 1]).toEqual(anchor.dropZone);

    const firstTokenCorners = points.slice(1, 5);
    const maxX = Math.max(...firstTokenCorners.map((c) => c[0]));
    expect(maxX).toBeCloseTo(anchor.tokens[0][0] + LABEL_HALF_WIDTH_SMALL);
  });

  it("order 앵커: 슬롯마다 5점 + 확인 프롭 5점", () => {
    const anchor = SCENE_ANCHORS.compass_p3;
    if (anchor.kind !== "order") throw new Error("compass_p3는 order여야 한다");
    const points = framingPointsForAnchor(anchor);
    expect(points).toHaveLength(anchor.slots.length * 5 + 5);
    expect(points[anchor.slots.length * 5]).toEqual(anchor.confirm);
  });
});

describe("framingPointsForStage", () => {
  it("overview/celebrate는 고정 랜드마크를 반환한다", () => {
    expect(framingPointsForStage("overview", null)).toBe(OVERVIEW_LANDMARKS);
    expect(framingPointsForStage("celebrate", "compass_p1")).toBe(CELEBRATE_LANDMARKS);
  });

  it("sceneInteractionId가 없으면(HTML 모드 등) null을 반환해 기본 FOV를 쓰게 한다", () => {
    expect(framingPointsForStage("approach", null)).toBeNull();
  });

  it("알 수 없는 sceneInteractionId면 null을 반환한다", () => {
    expect(framingPointsForStage("approach", "unknown_point")).toBeNull();
  });

  it("유효한 sceneInteractionId면 해당 앵커의 프레이밍 점을 반환한다", () => {
    const result = framingPointsForStage("plating", "compass_p4");
    expect(result).toEqual(framingPointsForAnchor(SCENE_ANCHORS.compass_p4));
  });

  it("나침반4·5, 새싹3은 모두 select+plating이지만 서로 다른 프레이밍 점을 반환한다", () => {
    const p4 = framingPointsForStage("plating", "compass_p4");
    const p5 = framingPointsForStage("plating", "compass_p5");
    const sprout3 = framingPointsForStage("plating", "sprout_p3");
    expect(p4).not.toEqual(p5);
    expect(p4).not.toEqual(sprout3);
  });
});
