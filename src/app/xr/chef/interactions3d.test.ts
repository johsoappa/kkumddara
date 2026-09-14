import { describe, expect, it } from "vitest";
import { MODE_POINTS, type CameraStage, type Mode } from "./scenario";
import {
  CAMERA_STAGES,
  CELEBRATE_LANDMARKS,
  DROP_ZONE_LABEL_SCALE,
  DROP_ZONE_RING_MULTIPLIER,
  LABEL_HALF_HEIGHT_LARGE,
  LABEL_HALF_HEIGHT_SMALL,
  LABEL_HALF_WIDTH_LARGE,
  LABEL_HALF_WIDTH_SMALL,
  LABEL_OFFSET_LARGE,
  LABEL_OFFSET_SMALL,
  LABEL_SCALE_SMALL,
  OVERVIEW_LANDMARKS,
  MAX_GRAB_DEPTH_RATIO,
  SCENE_ANCHORS,
  beginPlaceDrag,
  easeAlpha,
  easeVec3,
  fitCameraFraming,
  fitVerticalFov,
  framingPointsForAnchor,
  framingPointsForStage,
  hitTestDropZone,
  cameraRayForScreenPoint,
  intersectRayWithPlane,
  intersectRayWithPlaneY,
  isEarlyReadabilityStage,
  maxNonOverlappingHitAreaScale,
  placeDragPoint,
  projectPointToScreen,
  PLACE_HIT_AREA_CENTER_Y,
  PLACE_HIT_AREA_MIN_PX,
  PLACE_HIT_AREA_SIZE,
  placeHitAreaScale,
  projectedBoxScreenSize,
  reorderOnDrag,
  scaledCameraPosition,
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

describe("isEarlyReadabilityStage — G2.1-R1-F15 1~3단계 라벨 가독성 보정 대상 판정", () => {
  it.each(["compass_p1", "compass_p2", "compass_p3", "sprout_p1", "sprout_p2", "sprout_p3"])(
    "%s는 보정 대상이다 (point <= 3)",
    (id) => {
      expect(isEarlyReadabilityStage(id)).toBe(true);
    },
  );

  it.each(["compass_p4", "compass_p5"])(
    "%s는 보정 대상이 아니다 (point > 3, plating — 4~5단계 회귀 방지)",
    (id) => {
      expect(isEarlyReadabilityStage(id)).toBe(false);
    },
  );

  it("모든 MODE_POINTS 지점에 대해 sceneInteractionId(mode, point)와 일관된 결과를 낸다", () => {
    (["compass", "sprout"] as Mode[]).forEach((mode) => {
      MODE_POINTS[mode].forEach((point) => {
        const id = sceneInteractionId(mode, point.point);
        expect(isEarlyReadabilityStage(id)).toBe(point.point <= 3);
      });
    });
  });

  it("형식이 다른 id는 안전하게 false를 반환한다", () => {
    expect(isEarlyReadabilityStage("")).toBe(false);
    expect(isEarlyReadabilityStage("unknown")).toBe(false);
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

describe("SCENE_ANCHORS — 조리대 상판 안에 파묻혀 가려지는 앵커가 없는지 검증", () => {
  // ChefScene.tsx Kitchen()의 "조리대 상판" 박스와 동일한 값(회귀 재현/검증용 고정 복사):
  // position [0, 1.02, -1.2], size [4.1, 0.08, 1.3] → bounds.
  // G2.1-R1-F1에서 compass_p5의 y=1.0~1.05 좌표가 이 상판 높이(0.98~1.06)와 겹쳐
  // 상판에 파묻힌 채 렌더링되어(실제로는 그려지지만 카메라 각도에서 거의 완전히
  // 가려져) 화면에 아무것도 안 보이는 것처럼 보이는 버그가 있었다. select 타겟은
  // 조리대 위에서 손으로 집는 오브젝트이므로 상판 표면보다 확실히 위(margin)에
  // 있어야 한다.
  const COUNTER_TOP_BOUNDS = { xMin: -2.05, xMax: 2.05, zMin: -1.85, zMax: -0.55, yTop: 1.06 };
  const CLEARANCE = 0.05;

  function isOverCounterFootprint(p: Vec3): boolean {
    return (
      p[0] >= COUNTER_TOP_BOUNDS.xMin &&
      p[0] <= COUNTER_TOP_BOUNDS.xMax &&
      p[2] >= COUNTER_TOP_BOUNDS.zMin &&
      p[2] <= COUNTER_TOP_BOUNDS.zMax
    );
  }

  const modes: Mode[] = ["compass", "sprout"];
  for (const mode of modes) {
    MODE_POINTS[mode].forEach((point) => {
      if (point.interactionKind !== "select") return; // place/order는 조리대 표면 자체를 활용하므로 대상 아님
      it(`${mode} 지점${point.point} — select 타겟이 조리대 상판 안에 파묻혀 있지 않다`, () => {
        const id = sceneInteractionId(mode, point.point);
        const anchor = SCENE_ANCHORS[id];
        if (anchor.kind !== "select") throw new Error(`${id}는 select여야 한다`);

        anchor.targets.forEach((p, i) => {
          if (isOverCounterFootprint(p)) {
            expect(
              p[1],
              `${id}의 ${i}번째 타겟 ${JSON.stringify(p)}가 조리대 상판(top=${COUNTER_TOP_BOUNDS.yTop}) 발치에 파묻혀 있다`,
            ).toBeGreaterThan(COUNTER_TOP_BOUNDS.yTop + CLEARANCE);
          }
        });
      });
    });
  }
});

describe("SCENE_ANCHORS — select 타겟끼리 라벨이 겹치지 않을 만큼 떨어져 있는지 검증", () => {
  // G2.1-R1-F2: compass_p5의 실제 원인 — 카메라 프레이밍(FOV)이 아니라, 타겟
  // 3개가 서로 0.6~0.77 거리로 붙어 있어 라벨 스프라이트 폭(LABEL_SCALE_LARGE[0]
  // = 0.85, 즉 절반 폭 0.425끼리 마주 닿는 거리)보다 가까웠던 것이었다.
  // depthTest가 꺼진 billboard 라벨끼리 이보다 가까우면 서로를 가려 "부분
  // 노출"처럼 보인다. 이 테스트는 그런 종류의 회귀를 잡는다.
  const MIN_SEPARATION = LABEL_HALF_WIDTH_LARGE * 2; // 0.85

  function dist3(a: Vec3, b: Vec3): number {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
  }

  const modes: Mode[] = ["compass", "sprout"];
  for (const mode of modes) {
    MODE_POINTS[mode].forEach((point) => {
      if (point.interactionKind !== "select") return;
      it(`${mode} 지점${point.point} — select 타겟들이 라벨 폭(${MIN_SEPARATION}) 이상 떨어져 있다`, () => {
        const id = sceneInteractionId(mode, point.point);
        const anchor = SCENE_ANCHORS[id];
        if (anchor.kind !== "select") throw new Error(`${id}는 select여야 한다`);

        for (let i = 0; i < anchor.targets.length; i++) {
          for (let j = i + 1; j < anchor.targets.length; j++) {
            expect(
              dist3(anchor.targets[i], anchor.targets[j]),
              `${id}의 타겟 ${i}, ${j}가 서로 너무 가까워 라벨이 겹칠 수 있다`,
            ).toBeGreaterThan(MIN_SEPARATION);
          }
        }
      });
    });
  }
});

describe("SCENE_ANCHORS — plating select 타겟이 냄비(pot) 소품에 파묻혀 있지 않다", () => {
  // ChefScene.tsx Kitchen()의 냄비(몸통) 지오메트리와 동일한 값(회귀 재현/검증용
  // 고정 복사): position [-0.9, 1.25, -1.2], cylinderGeometry radius 0.35,
  // height 0.35 → y 범위 1.075~1.425. select 타겟 메시 자체도 반경 0.17
  // (SceneInteractions.tsx의 SelectTarget sphereGeometry)이라, 두 반경의 합
  // (0.35 + 0.17)보다 가깝고 냄비 높이 범위 안에 있으면 냄비 속에 파묻혀
  // 가려진다 — 조리대 상판 파묻힘과 같은 계열의 버그다.
  // G2.1-R1-F4: compass_p5뿐 아니라 compass_p4의 타겟1도 냄비 중심에서
  // 0.2만큼만 떨어져 있어(필요한 최소 거리 0.57) 실제로는 파묻혀 있었다 —
  // 두 앵커 모두 검증한다.
  const POT = { cx: -0.9, cz: -1.2, radius: 0.35, yMin: 1.075, yMax: 1.425 };
  const TARGET_RADIUS = 0.17;
  const CLEARANCE = 0.05;

  it.each(["compass_p4", "compass_p5"] as const)(
    "%s의 타겟 3개가 모두 냄비 반경 밖이거나 냄비 위로 확실히 떠 있다",
    (id) => {
      const anchor = SCENE_ANCHORS[id];
      if (anchor.kind !== "select") throw new Error(`${id}는 select여야 한다`);

      anchor.targets.forEach((p, i) => {
        const clearsAbove = p[1] > POT.yMax + TARGET_RADIUS + CLEARANCE;
        if (clearsAbove) return;

        const dx = p[0] - POT.cx;
        const dz = p[2] - POT.cz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        expect(
          dist,
          `${id}의 ${i}번째 타겟 ${JSON.stringify(p)}가 냄비 속에 파묻혀 있다`,
        ).toBeGreaterThanOrEqual(POT.radius + TARGET_RADIUS + CLEARANCE);
      });
    },
  );
});

describe("SCENE_ANCHORS — plating select 타겟 라벨이 후드(hood)에 파묻혀 있지 않다 (G2.1-R1-F4)", () => {
  // ChefScene.tsx Kitchen()의 후드 지오메트리와 동일한 값(회귀 재현/검증용
  // 고정 복사): position [0, 2.2, -1.2], boxGeometry [1.4, 0.5, 0.8] →
  // x -0.7~0.7, y 1.95~2.45, z -1.6~-0.8. depthTest가 꺼진 라벨은 후드 뒤에
  // 가려지는 대신 후드 앞에 그대로 그려져 "타겟과 동떨어진 곳에 라벨이
  // 떠 있는"것처럼 보인다 — compass_p4 타겟3, compass_p5 타겟1이 실제로
  // 이 문제가 있었다(라벨 상단이 후드 바닥보다 위로 올라감).
  const HOOD = { xMin: -0.7, xMax: 0.7, yMin: 1.95, yMax: 2.45, zMin: -1.6, zMax: -0.8 };
  const CLEARANCE = 0.05;

  it.each(["compass_p4", "compass_p5"] as const)(
    "%s의 타겟 라벨이 모두 후드 풋프린트 밖이거나 후드 바닥보다 확실히 아래에 있다",
    (id) => {
      const anchor = SCENE_ANCHORS[id];
      if (anchor.kind !== "select") throw new Error(`${id}는 select여야 한다`);

      anchor.targets.forEach((p, i) => {
        const labelTop = p[1] + LABEL_OFFSET_LARGE + LABEL_HALF_HEIGHT_LARGE;
        const inHoodFootprint =
          p[0] >= HOOD.xMin - LABEL_HALF_WIDTH_LARGE &&
          p[0] <= HOOD.xMax + LABEL_HALF_WIDTH_LARGE &&
          p[2] >= HOOD.zMin &&
          p[2] <= HOOD.zMax;
        if (!inHoodFootprint) return;

        expect(
          labelTop,
          `${id}의 ${i}번째 타겟 ${JSON.stringify(p)} 라벨이 후드(바닥=${HOOD.yMin}) 속에 파묻혀 있다`,
        ).toBeLessThan(HOOD.yMin - CLEARANCE);
      });
    },
  );
});

describe("SCENE_ANCHORS — place 토큰의 통합 hit area가 옆 토큰과 겹치지 않는다 (G2.1-R1-F5)", () => {
  // G2.1-R1-F5: place 토큰에 재료 mesh(0.22)보다 훨씬 큰 보이지 않는 hit
  // area(PLACE_HIT_AREA_SIZE)를 추가해 라벨을 눌러도 드래그가 시작되게
  // 했다. 이 hit area가 옆 토큰의 hit area와 겹치면 손끝으로 엉뚱한
  // choice를 잡을 수 있으므로, 모든 place 앵커의 토큰 쌍에 대해 AABB
  // (axis-aligned bounding box)가 겹치지 않는지 검증한다 — 단순 중심간
  // 거리 비교가 아니라 실제 hit area 상자끼리의 축별 겹침을 확인한다.
  const [hw, hh, hd] = PLACE_HIT_AREA_SIZE.map((n) => n / 2);

  function hitAreaBoundsOverlap(a: Vec3, b: Vec3): boolean {
    const dx = Math.abs(a[0] - b[0]);
    const dy = Math.abs(a[1] - b[1]); // 두 hit area 모두 같은 로컬 Y 오프셋만큼 뜨므로 dy는 토큰 자체의 y차와 같다
    const dz = Math.abs(a[2] - b[2]);
    return dx < hw * 2 && dy < hh * 2 && dz < hd * 2;
  }

  const modes: Mode[] = ["compass", "sprout"];
  for (const mode of modes) {
    MODE_POINTS[mode].forEach((point) => {
      if (point.interactionKind !== "place") return;
      it(`${mode} 지점${point.point} — 토큰 hit area끼리 AABB가 겹치지 않는다`, () => {
        const id = sceneInteractionId(mode, point.point);
        const anchor = SCENE_ANCHORS[id];
        if (anchor.kind !== "place") throw new Error(`${id}는 place여야 한다`);

        for (let i = 0; i < anchor.tokens.length; i++) {
          for (let j = i + 1; j < anchor.tokens.length; j++) {
            expect(
              hitAreaBoundsOverlap(anchor.tokens[i], anchor.tokens[j]),
              `${id}의 토큰 ${i}, ${j} hit area가 서로 겹쳐 잘못된 choice가 선택될 수 있다`,
            ).toBe(false);
          }
        }
      });
    });
  }

  it("PLACE_HIT_AREA_CENTER_Y가 라벨 세로 범위(오프셋±반높이)를 hit area가 덮도록 잡혀 있다", () => {
    const labelTop = LABEL_OFFSET_SMALL + LABEL_HALF_HEIGHT_SMALL;
    const labelBottom = LABEL_OFFSET_SMALL - LABEL_HALF_HEIGHT_SMALL;
    const hitTop = PLACE_HIT_AREA_CENTER_Y + hh;
    const hitBottom = PLACE_HIT_AREA_CENTER_Y - hh;
    expect(hitTop).toBeGreaterThanOrEqual(labelTop);
    expect(hitBottom).toBeLessThanOrEqual(labelBottom);
  });
});

describe("place hit area — 실제 화면 px 기준 터치 크기 (G2.1-R1-F5 보강)", () => {
  // 48 CSS px 기준을 "고정 world 크기"로 추정하지 않는다. 렌더링과 똑같은
  // 카메라(CAMERA_STAGES + fitCameraFraming + scaledCameraPosition)와 실제
  // canvas CSS 크기로 hit area 상자를 화면에 투영해 px을 측정하고, 그 측정값이
  // PLACE_HIT_AREA_MIN_PX 이상이 되도록 placeHitAreaScale이 배율을 정하는지
  // 검증한다. SceneInteractions의 DragToken은 매 프레임 같은 함수를 호출한다.

  /** 375px 뷰포트에서 canvas가 실제로 차지하는 CSS 크기 (실브라우저 실측) */
  const MOBILE_CANVAS = { width: 343.2, height: 420 };
  /** 데스크톱 1280px 뷰포트에서의 실측 canvas CSS 크기 */
  const DESKTOP_CANVAS = { width: 544, height: 432 };

  function unit(v: Vec3): Vec3 {
    const len = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  /** place 지점의 "수렴 후" 실제 카메라 상태 — CameraRig가 같은 식을 쓴다 */
  function cameraForPlace(tokens: Vec3[], dropZone: Vec3, dropRadius: number, canvas: { width: number; height: number }) {
    const stage = CAMERA_STAGES.search;
    const aspect = canvas.width / canvas.height;
    const anchor = { kind: "place" as const, tokens, dropZone, dropRadius };
    const framing = fitCameraFraming({
      cameraPos: stage.position,
      lookAt: stage.lookAt,
      points: framingPointsForAnchor(anchor),
      aspect,
    });
    const cameraPos = scaledCameraPosition(stage.position, stage.lookAt, framing.distanceScale);
    return {
      cameraPos,
      forward: unit([
        stage.lookAt[0] - cameraPos[0],
        stage.lookAt[1] - cameraPos[1],
        stage.lookAt[2] - cameraPos[2],
      ]),
      fovDeg: framing.fovDeg,
    };
  }

  function hitCenter(token: Vec3): Vec3 {
    return [token[0], token[1] + PLACE_HIT_AREA_CENTER_Y, token[2]];
  }

  it("projectedBoxScreenSize — 가까울수록·화면이 클수록 더 큰 px로 측정된다", () => {
    const base = {
      size: PLACE_HIT_AREA_SIZE,
      cameraPos: [0, 0, 0] as Vec3,
      forward: [0, 0, -1] as Vec3,
      fovDeg: 50,
      viewportWidthPx: 400,
      viewportHeightPx: 400,
    };
    const near = projectedBoxScreenSize({ ...base, center: [0, 0, -2] });
    const far = projectedBoxScreenSize({ ...base, center: [0, 0, -4] });
    expect(near.widthPx).toBeGreaterThan(far.widthPx);
    expect(near.heightPx).toBeGreaterThan(far.heightPx);

    const bigger = projectedBoxScreenSize({
      ...base,
      center: [0, 0, -2],
      viewportWidthPx: 800,
      viewportHeightPx: 800,
    });
    expect(bigger.heightPx).toBeCloseTo(near.heightPx * 2, 5);
  });

  it("카메라 뒤에 있는 상자는 측정 불가(0)로 돌려준다", () => {
    const behind = projectedBoxScreenSize({
      center: [0, 0, 2],
      size: PLACE_HIT_AREA_SIZE,
      cameraPos: [0, 0, 0],
      forward: [0, 0, -1],
      fovDeg: 50,
      viewportWidthPx: 400,
      viewportHeightPx: 400,
    });
    expect(behind).toEqual({ widthPx: 0, heightPx: 0 });
  });

  const modes: Mode[] = ["compass", "sprout"];
  for (const mode of modes) {
    MODE_POINTS[mode].forEach((point) => {
      if (point.interactionKind !== "place") return;
      const id = sceneInteractionId(mode, point.point);

      it(`${id} — 375px에서 모든 토큰의 hit area가 ${PLACE_HIT_AREA_MIN_PX} CSS px 이상으로 측정된다`, () => {
        const anchor = SCENE_ANCHORS[id];
        if (anchor.kind !== "place") throw new Error(`${id}는 place여야 한다`);
        const cam = cameraForPlace(anchor.tokens, anchor.dropZone, anchor.dropRadius, MOBILE_CANVAS);
        const maxScale = maxNonOverlappingHitAreaScale(anchor.tokens);

        anchor.tokens.forEach((token, index) => {
          const box = {
            center: hitCenter(token),
            cameraPos: cam.cameraPos,
            forward: cam.forward,
            fovDeg: cam.fovDeg,
            viewportWidthPx: MOBILE_CANVAS.width,
            viewportHeightPx: MOBILE_CANVAS.height,
          };
          const scale = placeHitAreaScale({ ...box, maxScale });
          const measured = projectedBoxScreenSize({
            ...box,
            size: PLACE_HIT_AREA_SIZE.map((n) => n * scale) as Vec3,
          });
          expect(
            Math.min(measured.widthPx, measured.heightPx),
            `${id} 토큰${index}의 375px 실측 터치 크기가 ${PLACE_HIT_AREA_MIN_PX}px 미만이다 ` +
              `(${measured.widthPx.toFixed(1)}x${measured.heightPx.toFixed(1)}px, scale ${scale.toFixed(3)})`,
          ).toBeGreaterThanOrEqual(PLACE_HIT_AREA_MIN_PX);
        });
      });

      it(`${id} — 화면에 맞춰 커진 hit area도 옆 토큰과 겹치지 않는다`, () => {
        const anchor = SCENE_ANCHORS[id];
        if (anchor.kind !== "place") throw new Error(`${id}는 place여야 한다`);
        const maxScale = maxNonOverlappingHitAreaScale(anchor.tokens);
        // 기본 크기를 줄이는 일은 없어야 하므로 상한은 항상 1 이상이어야 한다
        expect(maxScale).toBeGreaterThanOrEqual(1);

        for (const canvas of [MOBILE_CANVAS, DESKTOP_CANVAS]) {
          const cam = cameraForPlace(anchor.tokens, anchor.dropZone, anchor.dropRadius, canvas);
          const scales = anchor.tokens.map((token) =>
            placeHitAreaScale({
              center: hitCenter(token),
              cameraPos: cam.cameraPos,
              forward: cam.forward,
              fovDeg: cam.fovDeg,
              viewportWidthPx: canvas.width,
              viewportHeightPx: canvas.height,
              maxScale,
            }),
          );

          for (let i = 0; i < anchor.tokens.length; i++) {
            for (let j = i + 1; j < anchor.tokens.length; j++) {
              // 크기가 다른 두 AABB는 축별 간격이 (크기i + 크기j)/2 이상이면 겹치지 않는다
              const separated = PLACE_HIT_AREA_SIZE.some((baseSize, axis) => {
                const gap = Math.abs(anchor.tokens[i][axis] - anchor.tokens[j][axis]);
                return gap >= (baseSize * scales[i] + baseSize * scales[j]) / 2;
              });
              expect(
                separated,
                `${id} 토큰 ${i}, ${j}의 확대된 hit area(${scales[i].toFixed(3)}, ${scales[j].toFixed(3)}배)가 겹친다`,
              ).toBe(true);
            }
          }
        }
      });

      it(`${id} — 확대된 hit area도 라벨 세로 범위를 계속 덮는다`, () => {
        const anchor = SCENE_ANCHORS[id];
        if (anchor.kind !== "place") throw new Error(`${id}는 place여야 한다`);
        const cam = cameraForPlace(anchor.tokens, anchor.dropZone, anchor.dropRadius, MOBILE_CANVAS);
        const maxScale = maxNonOverlappingHitAreaScale(anchor.tokens);

        for (const token of anchor.tokens) {
          const scale = placeHitAreaScale({
            center: hitCenter(token),
            cameraPos: cam.cameraPos,
            forward: cam.forward,
            fovDeg: cam.fovDeg,
            viewportWidthPx: MOBILE_CANVAS.width,
            viewportHeightPx: MOBILE_CANVAS.height,
            maxScale,
          });
          // 배율은 중심 기준으로 커지므로 1 이상이면 기본 커버리지가 유지된다
          expect(scale).toBeGreaterThanOrEqual(1);
          const halfHeight = (PLACE_HIT_AREA_SIZE[1] * scale) / 2;
          expect(PLACE_HIT_AREA_CENTER_Y + halfHeight).toBeGreaterThanOrEqual(
            LABEL_OFFSET_SMALL + LABEL_HALF_HEIGHT_SMALL,
          );
        }
      });
    });
  }
});

// ---------- place 드래그 검증 공용 헬퍼 (G2.1-R1-F6 / F7) ----------
// 고정 월드 좌표 비교가 아니라, 실제 카메라(CAMERA_STAGES + fitCameraFraming +
// scaledCameraPosition)와 375px Canvas 투영값으로 검증하기 위한 공용 계산이다.

type PlaceAnchorShape = { tokens: Vec3[]; dropZone: Vec3; dropRadius: number };

/** 375px 뷰포트에서 Canvas가 실제로 차지하는 CSS 크기 (실브라우저 실측) */
const PLACE_MOBILE_CANVAS = { width: 343.2, height: 420 };

function unitVec(v: Vec3): Vec3 {
  const length = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / length, v[1] / length, v[2] / length];
}

/** place 지점이 375px에서 실제로 그려지는 카메라 위치·FOV·뷰포트를 재현한다. */
function viewForPlaceAnchor(anchor: PlaceAnchorShape) {
  const stage = CAMERA_STAGES.search;
  const aspect = PLACE_MOBILE_CANVAS.width / PLACE_MOBILE_CANVAS.height;
  const framing = fitCameraFraming({
    cameraPos: stage.position,
    lookAt: stage.lookAt,
    points: framingPointsForAnchor({ kind: "place", ...anchor }),
    aspect,
  });
  const cameraPos = scaledCameraPosition(stage.position, stage.lookAt, framing.distanceScale);
  return {
    cameraPos,
    forward: unitVec([
      stage.lookAt[0] - cameraPos[0],
      stage.lookAt[1] - cameraPos[1],
      stage.lookAt[2] - cameraPos[2],
    ]),
    fovDeg: framing.fovDeg,
    viewportWidthPx: PLACE_MOBILE_CANVAS.width,
    viewportHeightPx: PLACE_MOBILE_CANVAS.height,
  };
}

/** 화면 bounding box (CSS px) */
type ScreenBox = { left: number; right: number; top: number; bottom: number };

/** 카메라 정규직교 축 — interactions3d.ts의 cameraBasis와 같은 규약(world up = +Y) */
function cameraAxes(forward: Vec3): { fwd: Vec3; right: Vec3; up: Vec3 } {
  const fwd = unitVec(forward);
  const right = unitVec([-fwd[2], 0, fwd[0]]);
  const up = unitVec([
    right[1] * fwd[2] - right[2] * fwd[1],
    right[2] * fwd[0] - right[0] * fwd[2],
    right[0] * fwd[1] - right[1] * fwd[0],
  ]);
  return { fwd, right, up };
}

function boxOf(points: { xPx: number; yPx: number }[]): ScreenBox {
  return {
    left: Math.min(...points.map((p) => p.xPx)),
    right: Math.max(...points.map((p) => p.xPx)),
    top: Math.min(...points.map((p) => p.yPx)),
    bottom: Math.max(...points.map((p) => p.yPx)),
  };
}

/**
 * 라벨(THREE.Sprite)의 화면 bounding box. Sprite는 항상 카메라를 향하므로
 * 네 모서리를 카메라 right/up 축으로 만들어야 실제 렌더와 같은 결과가 나온다
 * (framingPointsForAnchor의 labelCorners는 FOV 계산용 world X/Y 근사라 다르다).
 * scale은 sprite.scale과 같은 world 크기다(labelSprite.ts: sprite.scale.set(w, h, 1)).
 */
function spriteScreenBox(
  center: Vec3,
  view: ReturnType<typeof viewForPlaceAnchor>,
  scale: [number, number] = LABEL_SCALE_SMALL,
): ScreenBox | null {
  const { right, up } = cameraAxes(view.forward);
  const halfWidth = scale[0] / 2;
  const halfHeight = scale[1] / 2;
  const points: { xPx: number; yPx: number }[] = [];
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const projected = projectPointToScreen(
        [
          center[0] + right[0] * halfWidth * sx + up[0] * halfHeight * sy,
          center[1] + right[1] * halfWidth * sx + up[1] * halfHeight * sy,
          center[2] + right[2] * halfWidth * sx + up[2] * halfHeight * sy,
        ],
        view,
      );
      if (!projected) return null;
      points.push(projected);
    }
  }
  return boxOf(points);
}

/** 축 정렬 박스의 화면 bounding box (projectedBoxScreenSize의 "위치까지 포함" 버전) */
function boxScreenBox(
  center: Vec3,
  size: Vec3,
  view: ReturnType<typeof viewForPlaceAnchor>,
): ScreenBox | null {
  const points: { xPx: number; yPx: number }[] = [];
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const projected = projectPointToScreen(
          [
            center[0] + (size[0] / 2) * sx,
            center[1] + (size[1] / 2) * sy,
            center[2] + (size[2] / 2) * sz,
          ],
          view,
        );
        if (!projected) return null;
        points.push(projected);
      }
    }
  }
  return boxOf(points);
}

describe("place 드래그 방향성 — 화면 좌측으로 끌면 토큰도 화면 좌측으로 (G2.1-R1-F6)", () => {
  // Gate C 실브라우저 QA: compass_p2의 "다른 방법을 생각해본다"를 라벨에서 잡고
  // 왼쪽으로 끌면 좌우가 아니라 앞뒤로 움직이며 커졌다 작아졌다 한다.
  //
  // 원인은 hit area나 pointer capture가 아니라 드래그 평면의 높이였다. 드래그
  // 좌표는 intersectRayWithPlaneY(planeY = 토큰 자신의 y)로 구하는데, 이전 3번
  // 토큰은 y=1.55라서 그 평면이 search stage 카메라 높이(1.40)보다 위에 있었다.
  // 카메라보다 위에 있는 수평면은 시선과 거의 평행해, 포인터를 조금만 움직여도
  // 교차점이 깊이 방향으로 폭주하고 결국 교차 자체가 사라진다.
  //
  // 아래 검증은 고정 월드 좌표 비교가 아니라 실제 카메라(CAMERA_STAGES +
  // fitCameraFraming + scaledCameraPosition)와 375px viewport 투영으로 수행한다.

  /** 드래그 평면이 카메라보다 최소 이만큼은 아래에 있어야 시선이 평면을 제대로 만난다 */
  const MIN_PLANE_CLEARANCE = 0.15;
  const viewForPlace = viewForPlaceAnchor;

  /**
   * 라벨 중심을 잡고 드롭존까지 끄는 실제 제스처를 그대로 재현한다.
   * 각 단계에서 R3F가 넘겨주는 것과 같은 광선을 만들어(cameraRayForScreenPoint)
   * SceneInteractions가 쓰는 것과 같은 함수(intersectRayWithPlaneY)로 좌표를 구하고,
   * 그 좌표에 놓인 토큰을 다시 화면에 투영해 "화면에서 어떻게 보이는지"를 잰다.
   */
  function dragProfile(anchor: { tokens: Vec3[]; dropZone: Vec3; dropRadius: number }, index: number) {
    const view = viewForPlace(anchor);
    const token = anchor.tokens[index];
    const planeY = token[1];
    const grab = projectPointToScreen([token[0], token[1] + LABEL_OFFSET_SMALL, token[2]], view);
    const goal = projectPointToScreen(anchor.dropZone, view);
    if (!grab || !goal) throw new Error("라벨 또는 드롭존이 카메라 뒤에 있다");

    const steps: { xPx: number; yPx: number; depth: number; world: { x: number; z: number } }[] = [];
    const STEP_COUNT = 10;
    for (let s = 0; s <= STEP_COUNT; s += 1) {
      const px = grab.xPx + ((goal.xPx - grab.xPx) * s) / STEP_COUNT;
      const py = grab.yPx + ((goal.yPx - grab.yPx) * s) / STEP_COUNT;
      const ray = cameraRayForScreenPoint(px, py, view);
      const world = intersectRayWithPlaneY(ray.origin, ray.direction, planeY);
      if (!world) continue;
      // SceneInteractions의 useFrame이 놓는 위치와 동일하게 살짝 들어올린 지점
      const screen = projectPointToScreen([world.x, planeY + 0.07, world.z], view);
      if (!screen) continue;
      steps.push({ xPx: screen.xPx, yPx: screen.yPx, depth: screen.depth, world });
    }
    return { view, grab, goal, planeY, steps };
  }

  const COMPASS_P2 = SCENE_ANCHORS.compass_p2;
  if (COMPASS_P2.kind !== "place") throw new Error("compass_p2는 place여야 한다");
  const NAMES = ["선배에게 물어본다", "수납장을 차례로 확인한다", "다른 방법을 생각해본다"];

  it("compass_p2 세 토큰이 같은 조리대 높이·같은 깊이 줄에서 시작한다", () => {
    const ys = COMPASS_P2.tokens.map((t) => t[1]);
    const zs = COMPASS_P2.tokens.map((t) => t[2]);
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThanOrEqual(0.05);
    expect(Math.max(...zs) - Math.min(...zs)).toBeLessThanOrEqual(0.1);

    // 화면에서 좌·중·우로 구분되는 가로 줄인지 (x가 서로 다르고 순서가 유지되는지)
    const xs = COMPASS_P2.tokens.map((t) => t[0]);
    expect(xs[0]).toBeLessThan(xs[1]);
    expect(xs[1]).toBeLessThan(xs[2]);
  });

  it("compass_p2 세 토큰의 카메라 깊이 차가 과도하지 않다", () => {
    const view = viewForPlace(COMPASS_P2);
    const depths = COMPASS_P2.tokens.map((t) => {
      const p = projectPointToScreen(t, view);
      if (!p) throw new Error("토큰이 카메라 뒤에 있다");
      return p.depth;
    });
    expect(Math.max(...depths) / Math.min(...depths)).toBeLessThanOrEqual(1.2);
  });

  it("모든 place 토큰의 드래그 평면이 카메라보다 아래에 있다 (F6 핵심 불변식)", () => {
    // 이 조건이 깨지면(평면이 카메라 위) 시선이 평면을 뚫지 못하고 스치기만 해서
    // 드래그가 깊이 방향으로 폭주한다 — Gate C가 신고한 바로 그 증상이다.
    const cameraY = scaledCameraPosition(
      CAMERA_STAGES.search.position,
      CAMERA_STAGES.search.lookAt,
      1,
    )[1];
    const modes: Mode[] = ["compass", "sprout"];
    for (const mode of modes) {
      MODE_POINTS[mode].forEach((point) => {
        if (point.interactionKind !== "place") return;
        const id = sceneInteractionId(mode, point.point);
        const anchor = SCENE_ANCHORS[id];
        if (anchor.kind !== "place") throw new Error(`${id}는 place여야 한다`);
        anchor.tokens.forEach((token, i) => {
          expect(
            cameraY - token[1],
            `${id} 토큰${i}(y=${token[1]})의 드래그 평면이 카메라(y=${cameraY})보다 충분히 아래가 아니다`,
          ).toBeGreaterThanOrEqual(MIN_PLANE_CLEARANCE);
        });
      });
    }
  });

  COMPASS_P2.tokens.forEach((_token, index) => {
    it(`compass_p2 ${NAMES[index]} — 라벨에서 드롭존까지 끄는 동안 포인터를 따라 이동한다`, () => {
      const { steps, grab, goal } = dragProfile(COMPASS_P2, index);

      // 1) 드래그 도중 추적이 끊기지 않는다 (교차 실패로 토큰이 멈추면 안 된다)
      expect(steps.length, "드래그 경로에서 평면 교차가 끊겼다").toBeGreaterThanOrEqual(10);

      // 2) 화면 x가 포인터가 가는 방향으로만 간다 (반대로 되돌아가지 않는다)
      // G2.1-R1-F8: 첫 토큰이 드롭존보다 왼쪽(x=-0.15 < 0.4)으로 옮겨져 이 지점만
      // "우측으로 끄는" 제스처가 됐다. 방향을 좌측으로 못 박으면 배치가 바뀔 때마다
      // 테스트가 깨지므로, 포인터가 실제로 가는 방향의 부호로 판정한다.
      const dragSign = Math.sign(goal.xPx - grab.xPx) || 1;
      for (let i = 1; i < steps.length; i += 1) {
        expect(
          (steps[i].xPx - steps[i - 1].xPx) * dragSign,
          `${NAMES[index]}: step${i}에서 토큰이 포인터 반대 방향으로 되돌아갔다`,
        ).toBeGreaterThanOrEqual(-0.5);
      }

      // 3) 깊이가 단조 감소한다 — 앞뒤로 튀거나 멀리 날아가지 않는다
      for (let i = 1; i < steps.length; i += 1) {
        expect(
          steps[i].depth,
          `${NAMES[index]}: step${i}에서 토큰이 카메라에서 더 멀어졌다(앞뒤 폭주)`,
        ).toBeLessThanOrEqual(steps[i - 1].depth + 1e-6);
      }

      // 4) 마지막에는 드롭존 판정 반경 안에 들어온다
      const last = steps[steps.length - 1];
      const dist = Math.hypot(last.world.x - COMPASS_P2.dropZone[0], last.world.z - COMPASS_P2.dropZone[2]);
      expect(dist, `${NAMES[index]}: 경로 끝이 드롭존 반경 밖이다`).toBeLessThanOrEqual(
        COMPASS_P2.dropRadius,
      );

      // 5) 토큰이 포인터를 따라간다 — 끝났을 때 포인터가 있는 자리에 있다
      expect(
        Math.abs(last.xPx - goal.xPx),
        `${NAMES[index]}: 드래그가 끝났는데 토큰이 포인터에서 ${Math.abs(last.xPx - goal.xPx).toFixed(1)}px 떨어져 있다`,
      ).toBeLessThanOrEqual(15);

      // 6) 포인터가 가로로 의미 있게 움직인 경우, 토큰도 같은 방향으로 그만큼 따라간다
      const pointerDx = goal.xPx - grab.xPx;
      const tokenDx = last.xPx - steps[0].xPx;
      if (Math.abs(pointerDx) > 10) {
        expect(Math.sign(tokenDx), `${NAMES[index]}: 토큰이 포인터와 반대 방향으로 갔다`).toBe(
          Math.sign(pointerDx),
        );
        expect(Math.abs(tokenDx)).toBeGreaterThanOrEqual(Math.abs(pointerDx) * 0.5);
      }
    });
  });

  it("오른쪽 끝 토큰은 좌측 드래그 시 화면에서 충분히 크게 좌측 이동한다", () => {
    const index = COMPASS_P2.tokens.length - 1;
    const { steps } = dragProfile(COMPASS_P2, index);
    const totalLeftPx = steps[0].xPx - steps[steps.length - 1].xPx;
    expect(
      totalLeftPx,
      `오른쪽 끝 토큰의 화면 좌측 이동량이 ${totalLeftPx.toFixed(1)}px에 그친다`,
    ).toBeGreaterThanOrEqual(60);
  });

  it("회귀 가드 — 예전 지그재그 좌표(y=1.55)를 쓰면 이 검증이 실제로 실패한다", () => {
    // 테스트가 결함을 실제로 잡는지 확인한다. 예전 3번 토큰 좌표로 되돌리면
    // 드래그 평면이 카메라 위로 올라가 추적이 중간에 끊기거나 깊이가 폭주해야 한다.
    const legacy = {
      tokens: [
        [1.3, 1.12, -1.75],
        [2.1, 1.12, -1.75],
        [1.7, 1.55, -2.15],
      ] as Vec3[],
      dropZone: COMPASS_P2.dropZone,
      dropRadius: COMPASS_P2.dropRadius,
    };
    const cameraY = scaledCameraPosition(
      CAMERA_STAGES.search.position,
      CAMERA_STAGES.search.lookAt,
      1,
    )[1];
    expect(cameraY - legacy.tokens[2][1]).toBeLessThan(MIN_PLANE_CLEARANCE);

    const { steps } = dragProfile(legacy, 2);
    const trackingBroke = steps.length < 10;
    const depthRanAway = steps.some((s, i) => i > 0 && s.depth > steps[i - 1].depth + 1e-6);
    expect(
      trackingBroke || depthRanAway,
      "예전 좌표인데도 방향성 검증을 통과했다 — 이 테스트는 결함을 잡지 못한다",
    ).toBe(true);
  });
});

describe("place 드래그 — 라벨 상·중·하 어디를 잡아도 첫 이동부터 따라온다 (G2.1-R1-F7)", () => {
  // F6 재판정에서 남은 문제: 라벨 위쪽 절반을 잡고 수평으로 끌면 토큰이 아예
  // 움직이지 않고(Dead Zone), 아래쪽을 잡으면 잡는 순간 깊이가 2배로 튄다.
  // 아래 검증은 전부 실제 카메라(CAMERA_STAGES.search + fitCameraFraming +
  // scaledCameraPosition)와 375px Canvas 투영값으로 수행하는 순수 계산이며,
  // 사람이 실제로 손가락을 댄 결과가 아니다.

  /** 이 검증에서 쓰는 "화면 기준 좌측 이동" 거리 (CSS px) */
  const DRAG_LEFT_PX = 80;
  /** 80px 포인터 이동 대비 토큰이 최소 이만큼은 화면에서 좌측으로 가야 한다 */
  const MIN_TOKEN_LEFT_PX = 60;
  /** 수평 드래그만으로 카메라 거리가 이 비율 넘게 변하면 원근 점프로 본다 */
  const MAX_DEPTH_RATIO = 1.02;

  const GRAB_POINTS = [
    { name: "라벨 상단 중앙", dy: LABEL_HALF_HEIGHT_SMALL },
    { name: "라벨 중앙", dy: 0 },
    { name: "라벨 하단 중앙", dy: -LABEL_HALF_HEIGHT_SMALL },
  ];

  const PLACE_IDS = ["compass_p2", "sprout_p2"] as const;

  function placeAnchorOf(id: string) {
    const anchor = SCENE_ANCHORS[id];
    if (anchor.kind !== "place") throw new Error(`${id}는 place여야 한다`);
    return anchor;
  }

  /** 라벨 위 한 점을 잡고 세션을 연다 — 실제 R3F가 넘기는 것과 같은 광선을 만든다. */
  function grabAt(anchor: PlaceAnchorShape, index: number, dy: number) {
    const view = viewForPlaceAnchor(anchor);
    const token = anchor.tokens[index];
    const grabWorld: Vec3 = [token[0], token[1] + LABEL_OFFSET_SMALL + dy, token[2]];
    const grabScreen = projectPointToScreen(grabWorld, view);
    if (!grabScreen) throw new Error("라벨 잡는 지점이 카메라 뒤에 있다");
    const ray = cameraRayForScreenPoint(grabScreen.xPx, grabScreen.yPx, view);
    const session = beginPlaceDrag({
      rayOrigin: ray.origin,
      rayDirection: ray.direction,
      cameraForward: view.forward,
      tokenOrigin: token,
    });
    return { view, token, grabScreen, session };
  }

  /** 세션을 연 뒤 화면 좌표를 그대로 옮겨 드래그를 재현한다. */
  function dragTo(
    session: ReturnType<typeof grabAt>["session"],
    view: ReturnType<typeof viewForPlaceAnchor>,
    xPx: number,
    yPx: number,
  ) {
    const ray = cameraRayForScreenPoint(xPx, yPx, view);
    return placeDragPoint(session, ray.origin, ray.direction);
  }

  PLACE_IDS.forEach((id) => {
    const anchor = placeAnchorOf(id);
    anchor.tokens.forEach((token, index) => {
      GRAB_POINTS.forEach(({ name, dy }) => {
        it(`${id} 토큰${index} — ${name}을 잡고 좌측 ${DRAG_LEFT_PX}px 끌면 토큰도 좌측으로 따라간다`, () => {
          const { view, grabScreen, session } = grabAt(anchor, index, dy);

          // 0) 토큰 y는 조리대 높이로 고정된다 (SceneInteractions가 이 값으로 mesh를 놓는다)
          expect(session.planeY).toBe(token[1]);

          // 1) 잡는 순간 토큰이 움직이지 않는다 — 라벨 어디를 눌렀든 원위치 그대로
          const atGrab = dragTo(session, view, grabScreen.xPx, grabScreen.yPx);
          expect(atGrab, `${name}: 잡는 순간 좌표를 계산하지 못했다`).not.toBeNull();
          expect(Math.hypot(atGrab!.x - token[0], atGrab!.z - token[2])).toBeLessThan(1e-6);

          // 2) 좌측으로 조금씩 움직이는 동안 매 단계 유효한 좌표가 나온다
          const steps: { world: { x: number; z: number }; xPx: number; depth: number }[] = [];
          const STEP_COUNT = 10;
          for (let s = 0; s <= STEP_COUNT; s += 1) {
            const px = grabScreen.xPx - (DRAG_LEFT_PX * s) / STEP_COUNT;
            const world = dragTo(session, view, px, grabScreen.yPx);
            expect(world, `${name}: step${s}에서 드래그 좌표가 없다(교차 실패)`).not.toBeNull();
            expect(Number.isFinite(world!.x) && Number.isFinite(world!.z)).toBe(true);
            const screen = projectPointToScreen([world!.x, session.planeY + 0.07, world!.z], view);
            expect(screen, `${name}: step${s}에서 토큰이 카메라 뒤로 갔다`).not.toBeNull();
            steps.push({ world: world!, xPx: screen!.xPx, depth: screen!.depth });
          }
          expect(steps).toHaveLength(STEP_COUNT + 1);

          // 3) 화면 x가 좌측으로만 간다 (첫 이동부터, 되돌아가지 않는다)
          expect(steps[1].xPx, `${name}: 첫 이동에서 토큰이 좌측으로 가지 않았다`).toBeLessThan(
            steps[0].xPx,
          );
          for (let s = 1; s < steps.length; s += 1) {
            expect(
              steps[s].xPx,
              `${name}: step${s}에서 토큰이 오른쪽으로 되돌아갔다(방향 역전)`,
            ).toBeLessThanOrEqual(steps[s - 1].xPx + 1e-6);
          }

          // 4) 이동량이 포인터 이동량에 걸맞게 충분하다
          const tokenLeftPx = steps[0].xPx - steps[steps.length - 1].xPx;
          expect(
            tokenLeftPx,
            `${name}: 포인터를 ${DRAG_LEFT_PX}px 옮겼는데 토큰은 ${tokenLeftPx.toFixed(1)}px만 움직였다`,
          ).toBeGreaterThanOrEqual(MIN_TOKEN_LEFT_PX);

          // 5) 수평 드래그인데 카메라 거리가 급변하지 않는다 (원근 확대/축소 없음)
          const depths = steps.map((s) => s.depth);
          const depthRatio = Math.max(...depths) / Math.min(...depths);
          expect(
            depthRatio,
            `${name}: 수평 드래그인데 카메라 거리가 ${depthRatio.toFixed(3)}배 변했다`,
          ).toBeLessThanOrEqual(MAX_DEPTH_RATIO);
        });
      });

      it(`${id} 토큰${index} — 라벨 상단에서 시작해도 드롭존까지 끌어 놓을 수 있다`, () => {
        const { view, grabScreen, session } = grabAt(anchor, index, LABEL_HALF_HEIGHT_SMALL);
        const zones = [
          { id: "drop", x: anchor.dropZone[0], z: anchor.dropZone[2], radius: anchor.dropRadius },
        ];

        // 세션의 화면→월드 변환은 선형이므로, 1px 이동 두 번으로 야코비안을 재서
        // "드롭존에 놓으려면 포인터를 어디까지 옮겨야 하는지"를 역산한다.
        const base = dragTo(session, view, grabScreen.xPx, grabScreen.yPx)!;
        const byX = dragTo(session, view, grabScreen.xPx + 1, grabScreen.yPx)!;
        const byY = dragTo(session, view, grabScreen.xPx, grabScreen.yPx + 1)!;
        const j = [
          [byX.x - base.x, byY.x - base.x],
          [byX.z - base.z, byY.z - base.z],
        ];
        const det = j[0][0] * j[1][1] - j[0][1] * j[1][0];
        expect(Math.abs(det), "화면→월드 변환이 퇴화했다").toBeGreaterThan(1e-9);
        const tx = anchor.dropZone[0] - base.x;
        const tz = anchor.dropZone[2] - base.z;
        const dPxX = (tx * j[1][1] - j[0][1] * tz) / det;
        const dPxY = (j[0][0] * tz - tx * j[1][0]) / det;

        // 포인터가 375px Canvas 안에서 실제로 닿을 수 있는 거리여야 한다
        const endX = grabScreen.xPx + dPxX;
        const endY = grabScreen.yPx + dPxY;
        expect(endX).toBeGreaterThanOrEqual(0);
        expect(endX).toBeLessThanOrEqual(PLACE_MOBILE_CANVAS.width);
        expect(endY).toBeGreaterThanOrEqual(0);
        expect(endY).toBeLessThanOrEqual(PLACE_MOBILE_CANVAS.height);

        // 경로 내내 좌표가 유효하고, 끝에서 드롭 판정이 성립한다
        const STEP_COUNT = 12;
        let previousDepth = Infinity;
        let last: { x: number; z: number } | null = null;
        for (let s = 1; s <= STEP_COUNT; s += 1) {
          const world = dragTo(
            session,
            view,
            grabScreen.xPx + (dPxX * s) / STEP_COUNT,
            grabScreen.yPx + (dPxY * s) / STEP_COUNT,
          );
          expect(world, `step${s}에서 드래그 좌표가 없다`).not.toBeNull();
          const screen = projectPointToScreen([world!.x, session.planeY + 0.07, world!.z], view);
          expect(screen, `step${s}에서 토큰이 카메라 뒤로 갔다`).not.toBeNull();
          // 드롭존은 카메라 쪽에 있으므로 깊이는 단조 감소해야 한다 (뒤로 튀지 않음)
          expect(screen!.depth, `step${s}에서 토큰이 카메라에서 더 멀어졌다`).toBeLessThanOrEqual(
            previousDepth + 1e-6,
          );
          previousDepth = screen!.depth;
          last = world!;
        }
        expect(hitTestDropZone(last!, zones)).toBe("drop");
      });
    });
  });

  it("F6까지의 수평 평면 단독 경로는 라벨 상단·중앙에서 실제로 실패한다 (회귀 가드)", () => {
    // 이 테스트가 결함을 진짜로 잡는지 확인한다. F7 이전 경로(intersectRayWithPlaneY만
    // 사용)를 같은 지점에 그대로 적용하면 상단·중앙은 교차 없음(null), 하단은
    // 토큰보다 훨씬 먼 깊이에서 만나야 한다.
    const anchor = placeAnchorOf("compass_p2");
    const view = viewForPlaceAnchor(anchor);
    const token = anchor.tokens[anchor.tokens.length - 1];
    const forward = view.forward;
    const depthOf = (p: Vec3) =>
      (p[0] - view.cameraPos[0]) * forward[0] +
      (p[1] - view.cameraPos[1]) * forward[1] +
      (p[2] - view.cameraPos[2]) * forward[2];
    const tokenDepth = depthOf(token);

    const rayAt = (dy: number) => {
      const screen = projectPointToScreen(
        [token[0], token[1] + LABEL_OFFSET_SMALL + dy, token[2]],
        view,
      );
      if (!screen) throw new Error("라벨 지점이 카메라 뒤에 있다");
      return cameraRayForScreenPoint(screen.xPx, screen.yPx, view);
    };

    // 상단·중앙: 광선이 위를 향해 조리대 수평 평면과 아예 만나지 않는다 → 토큰이 멈춘다
    for (const dy of [LABEL_HALF_HEIGHT_SMALL, 0]) {
      const ray = rayAt(dy);
      expect(
        intersectRayWithPlaneY(ray.origin, ray.direction, token[1]),
        "라벨 상단/중앙에서 수평 평면 교차가 생겨버렸다 — 이 가드는 더 이상 결함을 잡지 못한다",
      ).toBeNull();
    }

    // 하단: 만나기는 하지만 토큰보다 1.6배 넘게 먼 깊이 → 잡는 순간 원근 점프
    const bottomRay = rayAt(-LABEL_HALF_HEIGHT_SMALL);
    const bottomHit = intersectRayWithPlaneY(bottomRay.origin, bottomRay.direction, token[1]);
    expect(bottomHit).not.toBeNull();
    const bottomDepth = depthOf([bottomHit!.x, token[1], bottomHit!.z]);
    expect(bottomDepth / tokenDepth).toBeGreaterThan(MAX_GRAB_DEPTH_RATIO);

    // F7 경로는 같은 세 지점 모두에서 정상 좌표를 돌려준다
    for (const dy of [LABEL_HALF_HEIGHT_SMALL, 0, -LABEL_HALF_HEIGHT_SMALL]) {
      const ray = rayAt(dy);
      const session = beginPlaceDrag({
        rayOrigin: ray.origin,
        rayDirection: ray.direction,
        cameraForward: forward,
        tokenOrigin: token,
      });
      expect(session.mode).toBe("stable");
      expect(placeDragPoint(session, ray.origin, ray.direction)).not.toBeNull();
    }
  });

  it("수평 평면이 충분히 안정적이면 기존 counter 모드를 그대로 쓴다 (F4 경로 보존)", () => {
    // 위에서 내려다보는 카메라라면 조리대 평면과 시선이 충분히 큰 각으로 만나므로
    // F4/F6이 쓰던 수평 ray-plane 경로가 유지된다. 이때도 grab offset 덕분에
    // 잡는 순간 토큰은 움직이지 않는다.
    const tokenOrigin: Vec3 = [0, 1, 0];
    const cameraPos: Vec3 = [0, 3, 0.4];
    const rayDirection: Vec3 = [0.1, -0.95, -0.28];
    const length = Math.hypot(...rayDirection);
    const direction: Vec3 = [
      rayDirection[0] / length,
      rayDirection[1] / length,
      rayDirection[2] / length,
    ];
    const session = beginPlaceDrag({
      rayOrigin: cameraPos,
      rayDirection: direction,
      cameraForward: [0, -1, -0.2],
      tokenOrigin,
    });
    expect(session.mode).toBe("counter");
    const atGrab = placeDragPoint(session, cameraPos, direction);
    expect(atGrab).not.toBeNull();
    expect(Math.hypot(atGrab!.x - tokenOrigin[0], atGrab!.z - tokenOrigin[2])).toBeLessThan(1e-9);
  });

  it("intersectRayWithPlane — 임의 평면과의 교차/평행/뒤쪽 처리", () => {
    const hit = intersectRayWithPlane([0, 0, 5], [0, 0, -1], [0, 0, 1], [0, 0, 1]);
    expect(hit).toEqual([0, 0, 1]);
    // 평면과 평행한 광선
    expect(intersectRayWithPlane([0, 0, 5], [1, 0, 0], [0, 0, 1], [0, 0, 1])).toBeNull();
    // 평면이 광선 뒤쪽에 있는 경우
    expect(intersectRayWithPlane([0, 0, 5], [0, 0, 1], [0, 0, 1], [0, 0, 1])).toBeNull();
  });
});

describe("compass_p2 첫 토큰 — 드롭존 라벨 '여기에 놓기'와 겹치지 않는다 (G2.1-R1-F8)", () => {
  // 375px 실브라우저 QA: 첫 선택지 "선배에게 물어본다" 라벨이 드롭존 라벨 뒤에
  // 가려져 보이지도, 잡히지도 않았다. 원인은 월드 거리가 아니라 투영이다 —
  // 드롭존(z=-1.05)이 토큰 줄(z=-1.75)보다 카메라에 가까워 라벨이 더 크게 그려지고,
  // 두 라벨의 화면 x 구간이 그대로 겹쳤다. 라벨 sprite는 depthTest:false라
  // 앞뒤 관계로 해결되지 않는다. 아래 검증은 모두 실제 카메라·FOV·375px 투영값이다.

  /** 두 라벨의 화면 가로 간격이 최소 이만큼은 벌어져 있어야 한다 (CSS px) */
  const MIN_LABEL_GAP_PX = 12;
  /** F6/F7까지 쓰던 첫 토큰 x — 회귀 가드에서 "이 값이면 실패한다"를 확인하는 데 쓴다 */
  const LEGACY_FIRST_TOKEN_X = 0.65;

  /**
   * ChefScene.tsx Kitchen()의 냄비 몸통 지오메트리와 동일한 값(고정 복사):
   * position [-0.9, 1.25, -1.2], cylinderGeometry radius 0.35, height 0.35
   * → y 1.075~1.425. 냄비는 토큰 줄(z=-1.75)보다 카메라에 가까워 실제로
   * 토큰 mesh를 가릴 수 있으므로, 월드 거리가 아니라 화면 실루엣으로 검증한다.
   */
  const POT = { cx: -0.9, cz: -1.2, radius: 0.35, yMin: 1.075, yMax: 1.425 };

  function potBodyScreenBox(view: ReturnType<typeof viewForPlaceAnchor>): ScreenBox {
    const points: { xPx: number; yPx: number }[] = [];
    for (let i = 0; i < 48; i += 1) {
      const theta = (i / 48) * Math.PI * 2;
      for (const y of [POT.yMin, POT.yMax]) {
        const projected = projectPointToScreen(
          [POT.cx + POT.radius * Math.cos(theta), y, POT.cz + POT.radius * Math.sin(theta)],
          view,
        );
        if (projected) points.push(projected);
      }
    }
    if (points.length === 0) throw new Error("냄비가 카메라 뒤에 있다");
    return boxOf(points);
  }

  const intersects = (a: ScreenBox, b: ScreenBox) =>
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

  const anchor = (() => {
    const a = SCENE_ANCHORS.compass_p2;
    if (a.kind !== "place") throw new Error("compass_p2는 place여야 한다");
    return a;
  })();

  /** 첫 토큰 x만 바꾼 가상의 앵커 — 회귀 가드에서 옛 좌표를 그대로 재현하는 데 쓴다 */
  function withFirstTokenX(x: number): PlaceAnchorShape {
    return {
      tokens: [[x, anchor.tokens[0][1], anchor.tokens[0][2]], ...anchor.tokens.slice(1)],
      dropZone: anchor.dropZone,
      dropRadius: anchor.dropRadius,
    };
  }

  /** 첫 토큰 라벨과 드롭존 라벨의 화면 bbox + 가로 간격 */
  function labelGap(a: PlaceAnchorShape) {
    const view = viewForPlaceAnchor(a);
    const token = spriteScreenBox([a.tokens[0][0], a.tokens[0][1] + LABEL_OFFSET_SMALL, a.tokens[0][2]], view);
    const drop = spriteScreenBox([a.dropZone[0], a.dropZone[1] + LABEL_OFFSET_SMALL, a.dropZone[2]], view);
    if (!token || !drop) throw new Error("라벨이 카메라 뒤에 있다");
    return { view, token, drop, gapPx: drop.left - token.right };
  }

  it("첫 토큰의 y·z는 그대로이고 x만 왼쪽으로 이동했다", () => {
    expect(anchor.tokens[0][1]).toBe(1.12);
    expect(anchor.tokens[0][2]).toBe(-1.75);
    expect(anchor.tokens[0][0]).toBeLessThan(LEGACY_FIRST_TOKEN_X);
    // 세 토큰이 같은 높이·같은 깊이의 가로 한 줄이라는 F6 불변식도 유지한다
    expect(anchor.tokens.map((t) => t[1])).toEqual([1.12, 1.12, 1.12]);
    expect(anchor.tokens.map((t) => t[2])).toEqual([-1.75, -1.75, -1.75]);
    const xs = anchor.tokens.map((t) => t[0]);
    expect(xs[0]).toBeLessThan(xs[1]);
    expect(xs[1]).toBeLessThan(xs[2]);
  });

  it("2·3번 토큰 좌표는 F7 기준값과 동일하다", () => {
    expect(anchor.tokens[1]).toEqual([1.35, 1.12, -1.75]);
    expect(anchor.tokens[2]).toEqual([2.05, 1.12, -1.75]);
    expect(anchor.dropZone).toEqual([0.4, 1.1, -1.05]);
    expect(anchor.dropRadius).toBe(0.36);
  });

  it("sprout_p2 좌표는 변경되지 않았다", () => {
    const sprout = SCENE_ANCHORS.sprout_p2;
    if (sprout.kind !== "place") throw new Error("sprout_p2는 place여야 한다");
    expect(sprout.tokens).toEqual([
      [1.35, 1.12, -1.75],
      [2.05, 1.12, -1.75],
    ]);
    expect(sprout.dropZone).toEqual([0.4, 1.1, -1.05]);
    expect(sprout.dropRadius).toBe(0.36);
  });

  it(`375px에서 첫 토큰 라벨과 '여기에 놓기' 라벨이 교차하지 않고 ${MIN_LABEL_GAP_PX}px 이상 벌어져 있다`, () => {
    const { token, drop, gapPx } = labelGap(anchor);
    expect(
      intersects(token, drop),
      `첫 토큰 라벨(x ${token.left.toFixed(1)}~${token.right.toFixed(1)})과 ` +
        `드롭존 라벨(x ${drop.left.toFixed(1)}~${drop.right.toFixed(1)})의 화면 bbox가 교차한다`,
    ).toBe(false);
    expect(
      gapPx,
      `두 라벨의 화면 가로 간격이 ${gapPx.toFixed(1)}px에 그친다`,
    ).toBeGreaterThanOrEqual(MIN_LABEL_GAP_PX);
  });

  it("회귀 가드 — 예전 첫 토큰 x(0.65)를 쓰면 두 라벨이 실제로 겹친다", () => {
    const { token, drop, gapPx } = labelGap(withFirstTokenX(LEGACY_FIRST_TOKEN_X));
    expect(
      intersects(token, drop),
      "예전 좌표인데도 라벨이 겹치지 않는다 — 이 테스트는 결함을 잡지 못한다",
    ).toBe(true);
    expect(gapPx).toBeLessThan(0);
  });

  it("첫 토큰 라벨은 이웃 토큰 라벨과도 겹치지 않는다", () => {
    const view = viewForPlaceAnchor(anchor);
    const boxes = anchor.tokens.map((t) => {
      const box = spriteScreenBox([t[0], t[1] + LABEL_OFFSET_SMALL, t[2]], view);
      if (!box) throw new Error("토큰 라벨이 카메라 뒤에 있다");
      return box;
    });
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        expect(intersects(boxes[i], boxes[j]), `토큰 ${i}, ${j} 라벨의 화면 bbox가 교차한다`).toBe(
          false,
        );
      }
    }
  });

  it("첫 토큰의 hit area가 375px에서 48 CSS px 이상이고 다른 토큰과 겹치지 않는다", () => {
    const view = viewForPlaceAnchor(anchor);
    const maxScale = maxNonOverlappingHitAreaScale(anchor.tokens);
    // 첫 토큰이 왼쪽으로 더 갔으므로 비겹침 상한은 2·3번 쌍이 정하고, 1 이상이어야 한다
    expect(maxScale).toBeGreaterThanOrEqual(1);

    const box = {
      center: [anchor.tokens[0][0], anchor.tokens[0][1] + PLACE_HIT_AREA_CENTER_Y, anchor.tokens[0][2]] as Vec3,
      cameraPos: view.cameraPos,
      forward: view.forward,
      fovDeg: view.fovDeg,
      viewportWidthPx: view.viewportWidthPx,
      viewportHeightPx: view.viewportHeightPx,
    };
    const scale = placeHitAreaScale({ ...box, maxScale });
    const measured = projectedBoxScreenSize({
      ...box,
      size: PLACE_HIT_AREA_SIZE.map((n) => n * scale) as Vec3,
    });
    expect(
      Math.min(measured.widthPx, measured.heightPx),
      `첫 토큰 hit area가 ${measured.widthPx.toFixed(1)}x${measured.heightPx.toFixed(1)}px에 그친다`,
    ).toBeGreaterThanOrEqual(PLACE_HIT_AREA_MIN_PX);

    // 축 하나에서라도 (크기i + 크기j)/2 이상 떨어져 있으면 두 hit area는 겹치지 않는다
    const scales = anchor.tokens.map((t) =>
      placeHitAreaScale({
        ...box,
        center: [t[0], t[1] + PLACE_HIT_AREA_CENTER_Y, t[2]] as Vec3,
        maxScale,
      }),
    );
    for (let j = 1; j < anchor.tokens.length; j += 1) {
      const separated = PLACE_HIT_AREA_SIZE.some((baseSize, axis) => {
        const gap = Math.abs(anchor.tokens[0][axis] - anchor.tokens[j][axis]);
        return gap >= (baseSize * scales[0] + baseSize * scales[j]) / 2;
      });
      expect(separated, `첫 토큰과 토큰 ${j}의 hit area가 겹친다`).toBe(true);
    }
  });

  it("첫 토큰 라벨·재료 mesh가 냄비 몸통 실루엣에 묻히지 않고 Canvas 안에 있다", () => {
    const view = viewForPlaceAnchor(anchor);
    const token = anchor.tokens[0];
    const pot = potBodyScreenBox(view);

    // 재료 mesh(0.22 정육면체)는 냄비보다 뒤(z=-1.75 < -1.2)라 화면에서 겹치면 가려진다
    // (SceneInteractions.tsx DragToken의 boxGeometry args=[0.22, 0.22, 0.22])
    const meshBox = boxScreenBox(token, [0.22, 0.22, 0.22], view);
    if (!meshBox) throw new Error("재료 mesh가 카메라 뒤에 있다");
    expect(intersects(meshBox, pot), "첫 토큰 재료 mesh가 냄비 몸통과 화면에서 겹친다").toBe(false);
    expect(meshBox.left, "첫 토큰 mesh가 냄비 왼쪽으로 넘어갔다").toBeGreaterThan(pot.right);

    // 라벨은 depthTest:false로 항상 위에 그려지지만, 냄비 위에 올라타 보이면 혼잡하다
    const label = spriteScreenBox([token[0], token[1] + LABEL_OFFSET_SMALL, token[2]], view);
    if (!label) throw new Error("라벨이 카메라 뒤에 있다");
    expect(label.left, "첫 토큰 라벨이 냄비 몸통 위로 올라탔다").toBeGreaterThan(pot.right);

    // Canvas 안전 영역
    for (const [name, box] of [["라벨", label], ["mesh", meshBox]] as const) {
      expect(box.left, `${name}의 왼쪽이 Canvas 밖이다`).toBeGreaterThanOrEqual(0);
      expect(box.right, `${name}의 오른쪽이 Canvas 밖이다`).toBeLessThanOrEqual(view.viewportWidthPx);
      expect(box.top, `${name}의 위쪽이 Canvas 밖이다`).toBeGreaterThanOrEqual(0);
      expect(box.bottom, `${name}의 아래쪽이 Canvas 밖이다`).toBeLessThanOrEqual(view.viewportHeightPx);
    }
  });

  it("첫 토큰은 새 좌표에서도 F7 stable drag가 그대로 동작한다 (라벨 상·중·하)", () => {
    const view = viewForPlaceAnchor(anchor);
    const token = anchor.tokens[0];
    const DRAG_LEFT_PX = 80;

    for (const [name, dy] of [
      ["라벨 상단", LABEL_HALF_HEIGHT_SMALL],
      ["라벨 중앙", 0],
      ["라벨 하단", -LABEL_HALF_HEIGHT_SMALL],
    ] as const) {
      const grab = projectPointToScreen([token[0], token[1] + LABEL_OFFSET_SMALL + dy, token[2]], view);
      if (!grab) throw new Error(`${name}이 카메라 뒤에 있다`);
      const ray = cameraRayForScreenPoint(grab.xPx, grab.yPx, view);
      const session = beginPlaceDrag({
        rayOrigin: ray.origin,
        rayDirection: ray.direction,
        cameraForward: view.forward,
        tokenOrigin: token,
      });
      expect(session.planeY).toBe(token[1]);

      // 잡는 순간 점프 없음
      const atGrab = placeDragPoint(session, ray.origin, ray.direction);
      expect(atGrab).not.toBeNull();
      expect(Math.hypot(atGrab!.x - token[0], atGrab!.z - token[2])).toBeLessThan(1e-6);

      const steps: { xPx: number; depth: number }[] = [];
      for (let s = 0; s <= 10; s += 1) {
        const moved = cameraRayForScreenPoint(grab.xPx - (DRAG_LEFT_PX * s) / 10, grab.yPx, view);
        const world = placeDragPoint(session, moved.origin, moved.direction);
        expect(world, `${name}: step${s}에서 드래그 좌표가 없다`).not.toBeNull();
        expect(Number.isFinite(world!.x) && Number.isFinite(world!.z)).toBe(true);
        const screen = projectPointToScreen([world!.x, session.planeY + 0.07, world!.z], view);
        expect(screen, `${name}: step${s}에서 토큰이 카메라 뒤로 갔다`).not.toBeNull();
        steps.push({ xPx: screen!.xPx, depth: screen!.depth });
      }

      expect(steps[1].xPx, `${name}: 첫 이동에서 좌측으로 가지 않았다`).toBeLessThan(steps[0].xPx);
      for (let s = 1; s < steps.length; s += 1) {
        expect(steps[s].xPx, `${name}: step${s}에서 방향이 역전됐다`).toBeLessThanOrEqual(
          steps[s - 1].xPx + 1e-6,
        );
      }
      expect(steps[0].xPx - steps[steps.length - 1].xPx, `${name}: 좌측 이동량이 부족하다`).toBeGreaterThanOrEqual(
        60,
      );
      const depths = steps.map((s) => s.depth);
      expect(
        Math.max(...depths) / Math.min(...depths),
        `${name}: 수평 드래그인데 카메라 거리가 변했다`,
      ).toBeLessThanOrEqual(1.02);
    }
  });

  it("첫 토큰을 왼쪽으로 옮겨도 카메라 프레이밍(FOV·거리)은 F7과 같다", () => {
    // framing 점이 좁아지지 않으므로 FOV·distanceScale이 그대로여야 한다 —
    // 이 값이 바뀌면 2·3번 토큰의 48px hit area·F7 드래그 수치까지 함께 흔들린다.
    const stage = CAMERA_STAGES.search;
    const aspect = PLACE_MOBILE_CANVAS.width / PLACE_MOBILE_CANVAS.height;
    const framing = fitCameraFraming({
      cameraPos: stage.position,
      lookAt: stage.lookAt,
      points: framingPointsForAnchor(anchor),
      aspect,
    });
    expect(framing.distanceScale).toBe(1);
    expect(framing.fovDeg).toBeCloseTo(60.51, 1);
  });
});

describe("place 드롭존 라벨 — DROP_ZONE_LABEL_SCALE로 나머지 토큰과도 겹치지 않는다 (G2.1-R1-F15)", () => {
  // G2.1-R1-F8은 첫 토큰(index 0)과 드롭존 라벨의 겹침만 해결했다. 375px 실측
  // 투영으로 다시 재보면(G2.1-R1-F15), compass_p2의 두 번째 토큰("수납장을
  // 차례로 확인한다" — sprout_p2에서는 첫 번째 토큰)과 드롭존 라벨이 여전히
  // 6.4px 겹쳐 있었다. 토큰 좌표를 옮기면 F6/F7/F8이 맞춰 둔 토큰-토큰 간격·
  // 드래그 평면·hit area를 전부 다시 검증해야 하므로, 대신 드롭존 라벨만
  // DROP_ZONE_LABEL_SCALE(LABEL_SCALE_SMALL보다 작음)로 줄여 겹침을 없앤다.
  // 프레이밍 계산(framingPointsForAnchor)은 그대로 LABEL_SCALE_SMALL 기준을
  // 써서 더 넉넉하게(보수적으로) 잡으므로 이 테스트는 카메라 FOV/거리에
  // 영향이 없음도 함께 확인한다.

  function boxesIntersect(
    a: { left: number; right: number; top: number; bottom: number },
    b: { left: number; right: number; top: number; bottom: number },
  ): boolean {
    return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  }

  it("DROP_ZONE_LABEL_SCALE은 LABEL_SCALE_SMALL보다 작다", () => {
    expect(DROP_ZONE_LABEL_SCALE[0]).toBeLessThan(LABEL_SCALE_SMALL[0]);
    expect(DROP_ZONE_LABEL_SCALE[1]).toBeLessThan(LABEL_SCALE_SMALL[1]);
  });

  it.each(["compass_p2", "sprout_p2"] as const)(
    "%s — 375px에서 모든 토큰 라벨이 DROP_ZONE_LABEL_SCALE 드롭존 라벨과 겹치지 않는다",
    (id) => {
      const anchor = SCENE_ANCHORS[id];
      if (anchor.kind !== "place") throw new Error(`${id}는 place여야 한다`);
      const view = viewForPlaceAnchor(anchor);

      const dropBox = spriteScreenBox(
        [anchor.dropZone[0], anchor.dropZone[1] + LABEL_OFFSET_SMALL, anchor.dropZone[2]],
        view,
        DROP_ZONE_LABEL_SCALE,
      );
      if (!dropBox) throw new Error("드롭존 라벨이 카메라 뒤에 있다");

      anchor.tokens.forEach((token, index) => {
        const tokenBox = spriteScreenBox([token[0], token[1] + LABEL_OFFSET_SMALL, token[2]], view);
        if (!tokenBox) throw new Error(`토큰 ${index} 라벨이 카메라 뒤에 있다`);
        expect(
          boxesIntersect(tokenBox, dropBox),
          `${id} 토큰${index} 라벨(x ${tokenBox.left.toFixed(1)}~${tokenBox.right.toFixed(1)})이 ` +
            `축소된 드롭존 라벨(x ${dropBox.left.toFixed(1)}~${dropBox.right.toFixed(1)})과 겹친다`,
        ).toBe(false);
      });
    },
  );

  it("드롭존 라벨 축소는 프레이밍(FOV·거리)에 영향을 주지 않는다 — framingPointsForAnchor는 LABEL_SCALE_SMALL 기준 그대로", () => {
    const anchor = SCENE_ANCHORS.compass_p2;
    if (anchor.kind !== "place") throw new Error("compass_p2는 place여야 한다");
    const stage = CAMERA_STAGES.search;
    const aspect = PLACE_MOBILE_CANVAS.width / PLACE_MOBILE_CANVAS.height;
    const framing = fitCameraFraming({
      cameraPos: stage.position,
      lookAt: stage.lookAt,
      points: framingPointsForAnchor(anchor),
      aspect,
    });
    // F7이 고정한 기준값과 동일 — 드롭존 라벨 렌더 크기를 바꿔도 프레이밍 점
    // 계산(framingPointsForAnchor)은 손대지 않았으므로 이 값은 F7과 같아야 한다.
    expect(framing.distanceScale).toBe(1);
    expect(framing.fovDeg).toBeCloseTo(60.51, 1);
  });
});

describe("SCENE_ANCHORS — order 슬롯·확인 프롭 라벨이 서로 겹치지 않는다 (G2.1-R1-F3)", () => {
  // Gate C 실브라우저 QA: compass_p3(order) 슬롯 간격 0.55, 슬롯3-확인 간격 0.522가
  // 라벨 폭(LABEL_SCALE_SMALL[0]=0.58)보다 가까워 라벨끼리 겹쳤다. select와 달리
  // order/place는 여러 앵커가 없어(compass_p3가 유일한 order) 일반화된 루프 대신
  // 직접 검증한다.
  const MIN_SEPARATION = LABEL_HALF_WIDTH_SMALL * 2; // 0.58

  function dist3(a: Vec3, b: Vec3): number {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
  }

  it("compass_p3 — 슬롯끼리, 슬롯과 확인 프롭이 라벨 폭 이상 떨어져 있다", () => {
    const anchor = SCENE_ANCHORS.compass_p3;
    if (anchor.kind !== "order") throw new Error("compass_p3는 order여야 한다");

    const points: Vec3[] = [...anchor.slots, anchor.confirm];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        expect(
          dist3(points[i], points[j]),
          `compass_p3의 점 ${i}, ${j}가 서로 너무 가까워 라벨이 겹칠 수 있다`,
        ).toBeGreaterThan(MIN_SEPARATION);
      }
    }
  });
});

describe("SCENE_ANCHORS — compass_p3 슬롯이 냄비(pot) 소품에 파묻혀 있지 않다 (G2.1-R1-F3)", () => {
  // 기존 슬롯0([-0.55,1.18,-1.2])은 냄비 중심에서 정확히 반경(0.35)만큼만 떨어져
  // 있어 경계에 걸쳐 있었다. order 타일은 boxGeometry([0.4,0.13,0.34]) — x 반폭 0.2로
  // 근사해 같은 계열의 파묻힘 회귀를 잡는다.
  const POT = { cx: -0.9, cz: -1.2, radius: 0.35, yMin: 1.075, yMax: 1.425 };
  const TILE_HALF_WIDTH = 0.2;
  const CLEARANCE = 0.05;

  it("compass_p3의 슬롯 3개가 모두 냄비 반경 밖이거나 냄비 위로 확실히 떠 있다", () => {
    const anchor = SCENE_ANCHORS.compass_p3;
    if (anchor.kind !== "order") throw new Error("compass_p3는 order여야 한다");

    anchor.slots.forEach((p, i) => {
      const clearsAbove = p[1] > POT.yMax + TILE_HALF_WIDTH + CLEARANCE;
      if (clearsAbove) return;

      const dx = p[0] - POT.cx;
      const dz = p[2] - POT.cz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      expect(
        dist,
        `compass_p3의 ${i}번째 슬롯 ${JSON.stringify(p)}가 냄비 속에 파묻혀 있다`,
      ).toBeGreaterThanOrEqual(POT.radius + TILE_HALF_WIDTH + CLEARANCE);
    });
  });
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

describe("intersectRayWithPlaneY — G2.1-R1-F4 드래그 좌표 계산", () => {
  // e.point(드래그 중인 mesh 자신과의 교차점) 대신 조리대 높이의 고정 평면과
  // 광선을 직접 교차시켜 드래그 좌표를 구한다 — mesh가 움직여도 안정적이다.
  it("카메라에서 아래를 향하는 광선이 평면과 만나는 지점을 정확히 계산한다", () => {
    const result = intersectRayWithPlaneY([0, 5, 0], [0, -1, 0], 1.1);
    expect(result).toEqual({ x: 0, z: 0 });
  });

  it("비스듬한 광선도 평면 y좌표에서 정확한 x/z를 계산한다", () => {
    // origin=(0,5,0)에서 direction=(1,-1,0) 방향으로 진행 시, y가 1.1이
    // 되려면 t=3.9만큼 진행해야 하고, 그때 x는 0+1*3.9=3.9
    const result = intersectRayWithPlaneY([0, 5, 0], [1, -1, 0], 1.1);
    expect(result?.x).toBeCloseTo(3.9);
    expect(result?.z).toBeCloseTo(0);
  });

  it("광선이 평면과 평행하면(수직 성분 0) null을 반환한다", () => {
    expect(intersectRayWithPlaneY([0, 5, 0], [1, 0, 0], 1.1)).toBeNull();
  });

  it("평면이 광선의 반대 방향(뒤쪽)에 있으면 null을 반환한다", () => {
    // 카메라가 평면보다 아래에 있는데 아래쪽으로 계속 진행하는 경우 등
    expect(intersectRayWithPlaneY([0, 0, 0], [0, -1, 0], 1.1)).toBeNull();
  });

  it("origin이 이미 평면 위에 있으면(t=0) 그 지점을 그대로 반환한다", () => {
    const result = intersectRayWithPlaneY([2, 1.1, 3], [0, -1, 0], 1.1);
    expect(result).toEqual({ x: 2, z: 3 });
  });
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

  // G2.1-R1-F3: place 드롭존에 라벨·확대 링을 추가하고 order 슬롯 간격을
  // 넓히면서, 두 stage("search"/"survey")의 카메라 프레이밍이 여전히
  // maxFovDeg 이내로 들어오는지(별도 거리 보정 없이도) 회귀 검증한다.
  it.each(["compass_p2", "sprout_p2"] as const)(
    "실제 %s(place, search 카메라, 모바일/데스크톱)에서 드롭존 라벨·링을 포함해도 FOV가 max 이내다",
    (id) => {
      const searchCameraPos: Vec3 = [-1.0, 1.4, 2.1];
      const searchLookAt: Vec3 = [0.2, 0.8, -1.2];
      const anchor = SCENE_ANCHORS[id];
      const points = framingPointsForAnchor(anchor);

      for (const aspect of [343 / 487, 544 / 432]) {
        const result = fitCameraFraming({
          cameraPos: searchCameraPos,
          lookAt: searchLookAt,
          points,
          aspect,
        });
        const pushedCameraPos: Vec3 = [
          searchLookAt[0] + (searchCameraPos[0] - searchLookAt[0]) * result.distanceScale,
          searchLookAt[1] + (searchCameraPos[1] - searchLookAt[1]) * result.distanceScale,
          searchLookAt[2] + (searchCameraPos[2] - searchLookAt[2]) * result.distanceScale,
        ];
        const refit = fitVerticalFov({
          cameraPos: pushedCameraPos,
          lookAt: searchLookAt,
          points,
          aspect,
          maxFovDeg: 1000,
        });
        expect(refit).toBeLessThanOrEqual(85.01);
      }
    },
  );

  it("실제 compass_p3(order, survey 카메라, 모바일/데스크톱)에서 넓어진 슬롯 간격도 FOV가 max 이내다", () => {
    const surveyCameraPos: Vec3 = [0, 2.1, 3.6];
    const surveyLookAt: Vec3 = [0, 1.0, -1.2];
    const anchor = SCENE_ANCHORS.compass_p3;
    const points = framingPointsForAnchor(anchor);

    for (const aspect of [343 / 487, 544 / 432]) {
      const result = fitCameraFraming({
        cameraPos: surveyCameraPos,
        lookAt: surveyLookAt,
        points,
        aspect,
      });
      const pushedCameraPos: Vec3 = [
        surveyLookAt[0] + (surveyCameraPos[0] - surveyLookAt[0]) * result.distanceScale,
        surveyLookAt[1] + (surveyCameraPos[1] - surveyLookAt[1]) * result.distanceScale,
        surveyLookAt[2] + (surveyCameraPos[2] - surveyLookAt[2]) * result.distanceScale,
      ];
      const refit = fitVerticalFov({
        cameraPos: pushedCameraPos,
        lookAt: surveyLookAt,
        points,
        aspect,
        maxFovDeg: 1000,
      });
      expect(refit).toBeLessThanOrEqual(85.01);
    }
  });
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

  it("place 앵커: 토큰마다 5점 + 드롭존 중심 1점 + 드롭존 라벨 4점 + 드롭존 링 4점", () => {
    // G2.1-R1-F3: 드롭존에 "여기에 놓기" 라벨과 확대 외곽선 링이 추가되어
    // 더 이상 "라벨 없음"이 아니다 — 프레이밍 점 개수가 tokens*5 + 1 + 4 + 4로 늘었다.
    const anchor = SCENE_ANCHORS.compass_p2;
    if (anchor.kind !== "place") throw new Error("compass_p2는 place여야 한다");
    const points = framingPointsForAnchor(anchor);
    expect(points).toHaveLength(anchor.tokens.length * 5 + 1 + 4 + 4);

    const firstTokenCorners = points.slice(1, 5);
    const maxX = Math.max(...firstTokenCorners.map((c) => c[0]));
    expect(maxX).toBeCloseTo(anchor.tokens[0][0] + LABEL_HALF_WIDTH_SMALL);

    const tail = points.slice(anchor.tokens.length * 5);
    expect(tail[0]).toEqual(anchor.dropZone);

    const dropLabelCorners = tail.slice(1, 5);
    const dropLabelMaxX = Math.max(...dropLabelCorners.map((c) => c[0]));
    expect(dropLabelMaxX).toBeCloseTo(anchor.dropZone[0] + LABEL_HALF_WIDTH_SMALL);

    const ringPoints = tail.slice(5);
    expect(ringPoints).toHaveLength(4);
    const expectedRingRadius = anchor.dropRadius * DROP_ZONE_RING_MULTIPLIER;
    ringPoints.forEach((p) => {
      const dx = p[0] - anchor.dropZone[0];
      const dz = p[2] - anchor.dropZone[2];
      expect(Math.sqrt(dx * dx + dz * dz)).toBeCloseTo(expectedRingRadius);
      expect(p[1]).toBeCloseTo(anchor.dropZone[1]);
    });
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

// ====================================================
// G2.1-R1-F10 — 공통 1단계·새싹 3단계 냄비 겹침 시작 배치 보정
//
// 375px 실브라우저 QA에서 나침반 1/5·새싹 1/3의 첫 선택지와 새싹 3/3의
// "익숙하게 담아본다"가 냄비 안에 갇히거나 냄비에 겹쳐 보였다. 원인은 월드
// 거리가 아니라 "실제 카메라·FOV·375px 투영에서의 화면 실루엣"이므로, 아래
// 검증은 전부 CAMERA_STAGES + fitCameraFraming + scaledCameraPosition으로
// 렌더링과 똑같은 카메라를 재현해 화면 bbox로 판정한다.
//
// 라벨 sprite는 depthTest:false라 냄비 뒤에 있어도 냄비 위에 그려진다 —
// 앞뒤(depth) 관계로는 해결되지 않고 화면 배치로만 해결된다.
// ====================================================
describe("select 앵커 — 냄비 겹침 시작 배치 (G2.1-R1-F10)", () => {
  /** 이번 보정 대상 3개 앵커. 그 외 앵커는 좌표를 건드리지 않는다. */
  const AFFECTED = [
    { id: "compass_p1", stage: "approach" as CameraStage, fixedIndex: 0 },
    { id: "sprout_p1", stage: "approach" as CameraStage, fixedIndex: 0 },
    { id: "sprout_p3", stage: "plating" as CameraStage, fixedIndex: 0 },
  ];

  /** 라벨과 냄비 사이 화면 최소 간격 (CSS px) — 지시서 요구값 */
  const MIN_POT_LABEL_GAP_PX = 10;

  /** 보정 전 좌표 — 회귀 가드에서 "이 값을 넣으면 실패한다"를 확인하는 데 쓴다 */
  const LEGACY_P1_TARGET0: Vec3 = [-0.9, 1.32, -1.15];
  const LEGACY_SPROUT_P3_TARGET0: Vec3 = [-0.9, 1.2, -1.0];

  /** SceneInteractions.tsx SelectTarget의 sphereGeometry 반경 */
  const TARGET_RADIUS = 0.17;

  /**
   * 실브라우저 실측 canvas CSS 크기.
   * 씬 컨테이너는 h-[60vh]라 같은 375px 폭이어도 기기 높이에 따라 canvas 높이가
   * 달라지고, 그러면 aspect가 바뀌어 fitCameraFraming의 FOV·distanceScale도
   * 달라진다. 그래서 375px은 두 가지 높이(기존 place 테스트가 쓰던 420,
   * 812px 높이 기기의 실측 487.2)를 모두 검증한다.
   */
  const CANVASES = [
    { name: "375px(h420)", width: 343.2, height: 420 },
    { name: "375px(h487)", width: 343.2, height: 487.2 },
    { name: "1280px(h432)", width: 544, height: 432 },
    { name: "1280px(h480)", width: 544, height: 480 },
  ];
  type Canvas = (typeof CANVASES)[number];

  /**
   * ChefScene.tsx Kitchen()의 냄비 지오메트리와 동일한 값(고정 복사).
   * 몸통: position [-0.9, 1.25, -1.2], cylinder radius 0.35, height 0.35 → y 1.075~1.425
   * 손잡이: position [-0.45, 1.3, -1.2], cylinder r 0.03 len 0.4, rotation z=π/2 → X축으로 눕는다
   */
  const POT_BODY = { cx: -0.9, cz: -1.2, radius: 0.35, yMin: 1.075, yMax: 1.425 };
  const POT_HANDLE = { xMin: -0.65, xMax: -0.25, yMin: 1.27, yMax: 1.33, zMin: -1.23, zMax: -1.17 };
  /** ChefScene.tsx Kitchen()의 후드: position [0, 2.2, -1.2], size [1.4, 0.5, 0.8] */
  const HOOD_CENTER: Vec3 = [0, 2.2, -1.2];
  const HOOD_SIZE: Vec3 = [1.4, 0.5, 0.8];

  /** select 지점이 그 화면 폭에서 실제로 그려지는 카메라 위치·FOV·뷰포트를 재현한다. */
  function viewForSelectTargets(targets: Vec3[], stage: CameraStage, canvas: Canvas) {
    const camera = CAMERA_STAGES[stage];
    const framing = fitCameraFraming({
      cameraPos: camera.position,
      lookAt: camera.lookAt,
      points: framingPointsForAnchor({ kind: "select", targets }),
      aspect: canvas.width / canvas.height,
    });
    const cameraPos = scaledCameraPosition(camera.position, camera.lookAt, framing.distanceScale);
    return {
      cameraPos,
      forward: unitVec([
        camera.lookAt[0] - cameraPos[0],
        camera.lookAt[1] - cameraPos[1],
        camera.lookAt[2] - cameraPos[2],
      ]),
      fovDeg: framing.fovDeg,
      viewportWidthPx: canvas.width,
      viewportHeightPx: canvas.height,
    };
  }

  type View = ReturnType<typeof viewForSelectTargets>;

  /** 냄비 몸통(원기둥) + 손잡이를 합친 화면 실루엣 bbox */
  function potScreenBox(view: View): ScreenBox {
    const points: { xPx: number; yPx: number }[] = [];
    for (let i = 0; i < 48; i += 1) {
      const theta = (i / 48) * Math.PI * 2;
      for (const y of [POT_BODY.yMin, POT_BODY.yMax]) {
        const projected = projectPointToScreen(
          [
            POT_BODY.cx + POT_BODY.radius * Math.cos(theta),
            y,
            POT_BODY.cz + POT_BODY.radius * Math.sin(theta),
          ],
          view,
        );
        if (projected) points.push(projected);
      }
    }
    for (const x of [POT_HANDLE.xMin, POT_HANDLE.xMax]) {
      for (const y of [POT_HANDLE.yMin, POT_HANDLE.yMax]) {
        for (const z of [POT_HANDLE.zMin, POT_HANDLE.zMax]) {
          const projected = projectPointToScreen([x, y, z], view);
          if (projected) points.push(projected);
        }
      }
    }
    if (points.length === 0) throw new Error("냄비가 카메라 뒤에 있다");
    return boxOf(points);
  }

  /** 선택 타겟 구(球)의 화면 실루엣 bbox — 카메라를 향한 원판으로 근사한다 */
  function targetMeshScreenBox(center: Vec3, view: View): ScreenBox {
    const { right, up } = cameraAxes(view.forward);
    const points: { xPx: number; yPx: number }[] = [];
    for (let i = 0; i < 48; i += 1) {
      const theta = (i / 48) * Math.PI * 2;
      const projected = projectPointToScreen(
        [
          center[0] + right[0] * TARGET_RADIUS * Math.cos(theta) + up[0] * TARGET_RADIUS * Math.sin(theta),
          center[1] + right[1] * TARGET_RADIUS * Math.cos(theta) + up[1] * TARGET_RADIUS * Math.sin(theta),
          center[2] + right[2] * TARGET_RADIUS * Math.cos(theta) + up[2] * TARGET_RADIUS * Math.sin(theta),
        ],
        view,
      );
      if (!projected) throw new Error("선택 타겟이 카메라 뒤에 있다");
      points.push(projected);
    }
    return boxOf(points);
  }

  function targetLabelScreenBox(center: Vec3, view: View): ScreenBox {
    const box = spriteScreenBox([center[0], center[1] + LABEL_OFFSET_LARGE, center[2]], view, [
      LABEL_HALF_WIDTH_LARGE * 2,
      LABEL_HALF_HEIGHT_LARGE * 2,
    ]);
    if (!box) throw new Error("라벨이 카메라 뒤에 있다");
    return box;
  }

  const boxesIntersect = (a: ScreenBox, b: ScreenBox) =>
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

  /** 교차하지 않는 두 bbox 사이의 화면 간격(px). 교차하면 0. */
  function boxGapPx(a: ScreenBox, b: ScreenBox): number {
    if (boxesIntersect(a, b)) return 0;
    const dx = Math.max(0, a.left - b.right, b.left - a.right);
    const dy = Math.max(0, a.top - b.bottom, b.top - a.bottom);
    return dx > 0 && dy > 0 ? Math.hypot(dx, dy) : Math.max(dx, dy);
  }

  function selectTargets(id: string): Vec3[] {
    const anchor = SCENE_ANCHORS[id];
    if (anchor.kind !== "select") throw new Error(`${id}는 select여야 한다`);
    return anchor.targets;
  }

  // ---------- 1. 영향 대상 라벨 vs 냄비 몸통·손잡이 ----------

  describe.each(AFFECTED)("$id — 보정 대상 라벨과 냄비", ({ id, stage, fixedIndex }) => {
    it.each(CANVASES)(
      `$name에서 보정 대상 라벨이 냄비와 교차하지 않고 ${MIN_POT_LABEL_GAP_PX}px 이상 벌어져 있다`,
      (canvas) => {
        const targets = selectTargets(id);
        const view = viewForSelectTargets(targets, stage, canvas);
        const pot = potScreenBox(view);
        const label = targetLabelScreenBox(targets[fixedIndex], view);

        expect(boxesIntersect(label, pot), `${id} 타겟${fixedIndex} 라벨이 냄비 실루엣과 겹친다`).toBe(false);
        expect(
          boxGapPx(label, pot),
          `${id} 타겟${fixedIndex} 라벨과 냄비 사이 간격이 ${MIN_POT_LABEL_GAP_PX}px 미만이다`,
        ).toBeGreaterThanOrEqual(MIN_POT_LABEL_GAP_PX);
      },
    );

    it.each(CANVASES)("$name에서 같은 앵커의 다른 라벨도 냄비와 교차하지 않는다", (canvas) => {
      const targets = selectTargets(id);
      const view = viewForSelectTargets(targets, stage, canvas);
      const pot = potScreenBox(view);
      targets.forEach((target, index) => {
        expect(
          boxesIntersect(targetLabelScreenBox(target, view), pot),
          `${id} 타겟${index} 라벨이 냄비 실루엣과 겹친다`,
        ).toBe(false);
      });
    });
  });

  // ---------- 2. 영향 대상 선택 타겟 mesh vs 냄비 ----------

  describe.each(AFFECTED)("$id — 선택 타겟 mesh와 냄비", ({ id, stage }) => {
    it.each(CANVASES)("$name에서 모든 선택 타겟 mesh가 냄비와 화면에서 겹치지 않는다", (canvas) => {
      const targets = selectTargets(id);
      const view = viewForSelectTargets(targets, stage, canvas);
      const pot = potScreenBox(view);
      targets.forEach((target, index) => {
        expect(
          boxesIntersect(targetMeshScreenBox(target, view), pot),
          `${id} 타겟${index} mesh가 냄비에 파묻히거나 겹쳐 보인다`,
        ).toBe(false);
      });
    });
  });

  // ---------- 3. Canvas 안전영역 + 후드 ----------

  describe.each(AFFECTED)("$id — Canvas 안전영역·후드", ({ id, stage }) => {
    it.each(CANVASES)("$name에서 라벨·타겟이 Canvas 밖으로 잘리지 않는다", (canvas) => {
      const targets = selectTargets(id);
      const view = viewForSelectTargets(targets, stage, canvas);
      targets.forEach((target, index) => {
        const boxes: [string, ScreenBox][] = [
          ["라벨", targetLabelScreenBox(target, view)],
          ["mesh", targetMeshScreenBox(target, view)],
        ];
        for (const [name, box] of boxes) {
          expect(box.left, `${id} 타겟${index} ${name} 좌측이 Canvas 밖이다`).toBeGreaterThanOrEqual(0);
          expect(box.top, `${id} 타겟${index} ${name} 상단이 Canvas 밖이다`).toBeGreaterThanOrEqual(0);
          expect(box.right, `${id} 타겟${index} ${name} 우측이 Canvas 밖이다`).toBeLessThanOrEqual(canvas.width);
          expect(box.bottom, `${id} 타겟${index} ${name} 하단이 Canvas 밖이다`).toBeLessThanOrEqual(canvas.height);
        }
      });
    });

    it.each(CANVASES)("$name에서 라벨이 후드 실루엣과 겹치지 않는다", (canvas) => {
      const targets = selectTargets(id);
      const view = viewForSelectTargets(targets, stage, canvas);
      const hood = boxScreenBox(HOOD_CENTER, HOOD_SIZE, view);
      if (!hood) return; // 후드가 카메라 뒤면 겹칠 수 없다
      targets.forEach((target, index) => {
        expect(
          boxesIntersect(targetLabelScreenBox(target, view), hood),
          `${id} 타겟${index} 라벨이 후드에 파묻힌다`,
        ).toBe(false);
      });
    });
  });

  // ---------- 4. 라벨끼리 / 라벨과 드롭존 ----------

  describe.each(AFFECTED)("$id — 선택지끼리 비겹침", ({ id, stage }) => {
    it.each(CANVASES)("$name에서 라벨끼리 화면에서 겹치지 않는다", (canvas) => {
      const targets = selectTargets(id);
      const view = viewForSelectTargets(targets, stage, canvas);
      const labels = targets.map((t) => targetLabelScreenBox(t, view));
      for (let i = 0; i < labels.length; i += 1) {
        for (let j = i + 1; j < labels.length; j += 1) {
          expect(boxesIntersect(labels[i], labels[j]), `${id} 라벨 ${i}·${j}가 화면에서 겹친다`).toBe(false);
        }
      }
    });
  });

  it("보정한 새싹 지점3 첫 선택지가 새싹 지점2 드롭존 자리와 혼동될 만큼 가깝지 않다", () => {
    // p3에는 드롭존이 렌더링되지 않지만, 직전 단계(p2)에서 "여기에 놓기"였던
    // 자리에 선택 타겟이 겹쳐 앉으면 사용자가 같은 조작으로 오인할 수 있다.
    //
    // 검사 범위는 이번에 옮긴 타겟1뿐이다. 타겟2("새롭게 담아본다", [0.5, 1.15, -0.8])는
    // 드롭존([0.4, 1.1, -1.05])과 xz로 0.27밖에 떨어져 있지 않지만 F10의 변경
    // 금지 대상("반대편 새롭게 담아본다는 회귀가 없도록 그대로 둔다")이라 손대지
    // 않는다 — 별도 후속 작업으로 분리해야 할 기존 이슈다.
    const dropAnchor = SCENE_ANCHORS.sprout_p2;
    if (dropAnchor.kind !== "place") throw new Error("sprout_p2는 place여야 한다");
    const minXzDistance = dropAnchor.dropRadius * DROP_ZONE_RING_MULTIPLIER + LABEL_HALF_WIDTH_LARGE;

    const corrected = selectTargets("sprout_p3")[0];
    const dx = corrected[0] - dropAnchor.dropZone[0];
    const dz = corrected[2] - dropAnchor.dropZone[2];
    expect(
      Math.hypot(dx, dz),
      "보정한 sprout_p3 타겟1이 sprout_p2 드롭존과 겹쳐 보일 만큼 가깝다",
    ).toBeGreaterThan(minXzDistance);
  });

  // ---------- 5. 보정 대상 외 앵커·좌표 불변 ----------

  it("보정한 타겟은 compass_p1·sprout_p1·sprout_p3의 첫 타겟뿐이다", () => {
    expect(selectTargets("compass_p1")[0]).toEqual([1.95, 1.25, -1.3]);
    expect(selectTargets("sprout_p1")[0]).toEqual([1.95, 1.25, -1.3]);
    expect(selectTargets("sprout_p3")[0]).toEqual([1.5, 1.25, -1.1]);

    // 같은 앵커 안의 나머지 타겟은 기존 기준값 그대로
    expect(selectTargets("compass_p1").slice(1)).toEqual([
      [0.8, 1.32, -1.0],
      [-1.55, 1.75, -1.55],
    ]);
    expect(selectTargets("sprout_p1").slice(1)).toEqual([[-1.55, 1.75, -1.55]]);
    expect(selectTargets("sprout_p3").slice(1)).toEqual([[0.5, 1.15, -0.8]]);
  });

  it("compass_p4·compass_p5 select 앵커는 F4 기준값에서 변경되지 않았다", () => {
    expect(selectTargets("compass_p4")).toEqual([
      [0.97, 1.2, -1.49],
      [-1.15, 1.67, -1.53],
      [-0.32, 1.16, -1.19],
    ]);
    expect(selectTargets("compass_p5")).toEqual([
      [0.04, 1.33, -1.44],
      [-0.46, 1.16, -0.73],
      [0.94, 1.23, -1.57],
    ]);
  });

  it("place·order 앵커(F5 hit area·F7 드래그 기준)는 변경되지 않았다", () => {
    const compassP2 = SCENE_ANCHORS.compass_p2;
    const sproutP2 = SCENE_ANCHORS.sprout_p2;
    const compassP3 = SCENE_ANCHORS.compass_p3;
    if (compassP2.kind !== "place" || sproutP2.kind !== "place") throw new Error("p2는 place여야 한다");
    if (compassP3.kind !== "order") throw new Error("compass_p3는 order여야 한다");

    expect(compassP2.tokens).toEqual([
      [-0.15, 1.12, -1.75],
      [1.35, 1.12, -1.75],
      [2.05, 1.12, -1.75],
    ]);
    expect(compassP2.dropZone).toEqual([0.4, 1.1, -1.05]);
    expect(compassP2.dropRadius).toBe(0.36);
    expect(sproutP2.tokens).toEqual([
      [1.35, 1.12, -1.75],
      [2.05, 1.12, -1.75],
    ]);
    expect(sproutP2.dropZone).toEqual([0.4, 1.1, -1.05]);
    expect(sproutP2.dropRadius).toBe(0.36);
    expect(compassP3.slots).toEqual([
      [-0.28, 1.18, -1.2],
      [0.42, 1.18, -1.2],
      [1.12, 1.18, -1.2],
    ]);
    expect(compassP3.confirm).toEqual([1.85, 1.18, -1.0]);
  });

  // ---------- 6. 회귀 가드: 보정 전 좌표를 넣으면 반드시 실패한다 ----------

  describe("회귀 가드 — 보정 전 좌표는 냄비 겹침 또는 최소 간격 미달로 걸린다", () => {
    const legacyCases = [
      { id: "compass_p1", stage: "approach" as CameraStage, legacy: LEGACY_P1_TARGET0 },
      { id: "sprout_p1", stage: "approach" as CameraStage, legacy: LEGACY_P1_TARGET0 },
      { id: "sprout_p3", stage: "plating" as CameraStage, legacy: LEGACY_SPROUT_P3_TARGET0 },
    ];

    it.each(legacyCases)(
      "$id의 이전 첫 타겟 좌표는 375px에서 기준을 통과하지 못한다",
      ({ id, stage, legacy }) => {
        const canvas = CANVASES[0];
        const targets: Vec3[] = [legacy, ...selectTargets(id).slice(1)];
        const view = viewForSelectTargets(targets, stage, canvas);
        const pot = potScreenBox(view);
        const label = targetLabelScreenBox(legacy, view);
        const mesh = targetMeshScreenBox(legacy, view);

        const meshOverlaps = boxesIntersect(mesh, pot);
        const labelTooClose = boxesIntersect(label, pot) || boxGapPx(label, pot) < MIN_POT_LABEL_GAP_PX;
        expect(
          meshOverlaps || labelTooClose,
          `${id}의 이전 좌표 ${JSON.stringify(legacy)}가 현재 기준을 통과해 버린다 — 회귀 가드가 무력하다`,
        ).toBe(true);
      },
    );

    it("이전 compass_p1 좌표는 타겟3 라벨과도 화면에서 겹쳤다", () => {
      const canvas = CANVASES[0];
      const targets: Vec3[] = [LEGACY_P1_TARGET0, ...selectTargets("compass_p1").slice(1)];
      const view = viewForSelectTargets(targets, "approach", canvas);
      expect(
        boxesIntersect(targetLabelScreenBox(targets[0], view), targetLabelScreenBox(targets[2], view)),
        "이전 좌표에서 첫 라벨과 세 번째 라벨이 겹치지 않는다면 회귀 가드 전제가 깨진 것이다",
      ).toBe(true);
    });
  });
});
