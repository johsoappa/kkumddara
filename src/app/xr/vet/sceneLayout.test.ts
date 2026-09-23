import { describe, expect, it } from "vitest";
import { CHOICE_POINTS, SPROUT_POINTS, type Mode } from "./scenario";
import {
  CABINET_ANCHOR,
  CABINET_TARGET,
  CLIPBOARD_ANCHOR,
  CORE_FRAMING_POINTS,
  DOG_ANCHOR,
  GUARDIAN_ANCHOR,
  GUARDIAN_HEAD_TOP,
  GUARDIAN_TARGET,
  HERO_CAMERA_LOOKAT,
  HERO_CAMERA_POSITION,
  MIN_TARGET_SPACING,
  MODE_POINT_CHOICES,
  MONITOR_ANCHOR,
  PIN_RADIUS_PX,
  RESULT_BADGE_POINT,
  SCALE_ANCHOR,
  SCENE_TARGETS,
  SENIOR_ANCHOR,
  SENIOR_HEAD_TOP,
  SENIOR_TARGET,
  TABLE_CENTER,
  WALL_SIGN_ANCHOR,
  cameraForPoint,
  computeChoicePinPixels,
  fitVerticalFov,
  framingPointsForPositions,
  isFiniteVec3,
  overviewCamera,
  pairwiseMinDistance,
  projectToNdc,
  resolveActionCardChoices,
  resolvePinLayout,
  resolveScenePresentation,
  resolveTargets,
  resultCamera,
  sceneInteractionId,
  type VetScenePhase,
} from "./sceneLayout";

// G2.2-R2-L 필수 테스트 1: "새싹 3개 point / 나침반 5개 point 각각에서 scene
// target과 기존 choice ID가 정확히 1:1 연결된다"는 이전(R2/R2-R)에 이미
// 커버됐다 — 여기서는 그대로 유지하고, 이번 라운드의 실제 화면 문제(강아지
// 가림·인물 잘림·카메라 이동·라벨 겹침)에 대한 회귀 테스트를 추가한다.
//
// [중요] 아래 카메라·NDC 투영 테스트는 "카메라 수학이 내부적으로 일관되는가"
// 만 검증한다 — 실제 R3F Canvas가 이 수학대로 그려지는지, 사람 눈에 강아지·
// 인물이 실제로 잘리지 않고 보이는지는 이 테스트가 증명하지 못한다(jsdom은
// WebGL 컨텍스트를 구현하지 않는다). 완료 보고의 "실제 브라우저 확인 여부"
// 절을 반드시 함께 참고할 것 — 이 파일의 통과를 시각 검수 통과의 근거로
// 쓰지 않는다.

const MODES: Mode[] = ["compass", "sprout"];

describe("SCENE_TARGETS — G2.2-R3-B: choiceId 기반 매칭(더 이상 항상 1:1은 아니다)", () => {
  // G2.2-R3-B: 물리적으로 대응할 대상이 없는 추상 행동(actionCard)은
  // SCENE_TARGETS에 항목이 없다 — 그래서 target 개수 <= choices 개수다.
  // resolveActionCardChoices가 그 나머지를 정확히 골라내는지도 함께 검증한다.

  it.each(MODES)("%s 모드의 모든 point에서 target 개수는 1 이상이고 choices 개수를 넘지 않는다", (mode) => {
    const points = mode === "compass" ? CHOICE_POINTS : SPROUT_POINTS;
    for (const point of points) {
      const id = sceneInteractionId(mode, point.point);
      const targets = SCENE_TARGETS[id];
      expect(targets, `${id}에 대응하는 SCENE_TARGETS 항목이 없습니다`).toBeDefined();
      expect(targets.length).toBeGreaterThan(0);
      expect(targets.length).toBeLessThanOrEqual(point.choices.length);
    }
  });

  it.each(MODES)("%s 모드의 모든 point에서 resolveTargets는 choiceId로 정확히 매칭되고, choices 순서를 보존한다", (mode) => {
    const points = mode === "compass" ? CHOICE_POINTS : SPROUT_POINTS;
    for (const point of points) {
      const id = sceneInteractionId(mode, point.point);
      const resolved = resolveTargets(id, point.choices);
      // resolved는 targets 개수만큼만 나오되, choices 안에서의 상대 순서는 유지된다
      const resolvedIds = resolved.map((r) => r.choice.id);
      const choiceIdsInOrder = point.choices.map((c) => c.id).filter((id_) => resolvedIds.includes(id_));
      expect(resolvedIds).toEqual(choiceIdsInOrder);
      for (const { target, choice } of resolved) {
        expect(target.choiceId).toBe(choice.id);
      }
    }
  });

  it.each(MODES)("%s 모드의 모든 point에서 sceneTarget+actionCard를 합치면 choices 전체와 정확히 같다", (mode) => {
    const points = mode === "compass" ? CHOICE_POINTS : SPROUT_POINTS;
    for (const point of points) {
      const id = sceneInteractionId(mode, point.point);
      const resolved = resolveTargets(id, point.choices);
      const actionCards = resolveActionCardChoices(id, point.choices);
      const combinedIds = new Set([...resolved.map((r) => r.choice.id), ...actionCards.map((c) => c.id)]);
      expect(combinedIds.size).toBe(point.choices.length);
      expect(combinedIds).toEqual(new Set(point.choices.map((c) => c.id)));
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
    expect(resolveActionCardChoices("compass_p99", [])).toEqual([]);
  });
});

describe("SCENE_TARGETS — 같은 point 안에서 동시에 등장하는 타깃 간 최소 간격", () => {
  it.each(Object.keys(SCENE_TARGETS))(
    "%s의 타깃들은 서로 최소 간격(%s) 이상 떨어져 있다 — hit box·발밑 링이 겹치지 않는다",
    (id) => {
      const positions = SCENE_TARGETS[id].map((t) => t.position);
      if (positions.length < 2) return;
      expect(pairwiseMinDistance(positions)).toBeGreaterThanOrEqual(MIN_TARGET_SPACING);
    },
  );
});

describe("SCENE_TARGETS — G2.2-R2-L2: 같은 point 안에서는 실제 오브젝트가 중복되지 않는다", () => {
  // 모든 choice가 실제 진료실 오브젝트(강아지·보호자·선배 수의사·기록판·약장·
  // 모니터·병원 사인)를 가리키므로, 한 지점 안에서 같은 kind가 두 번 나오면
  // 서로 다른 두 choice가 화면에서는 "같은 물건"을 가리키는 모순이 생긴다.
  it.each(Object.keys(SCENE_TARGETS))("%s의 타깃 kind는 서로 중복되지 않는다", (id) => {
    const kinds = SCENE_TARGETS[id].map((t) => t.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  it("SCENE_TARGETS에는 더 이상 추상 아이콘(icon) kind가 존재하지 않는다 — 전부 실제 오브젝트다", () => {
    const allowedKinds = new Set([
      "dog",
      "guardian",
      "senior",
      "clipboard",
      "cabinet",
      "monitor",
      "pawSign",
    ]);
    for (const targets of Object.values(SCENE_TARGETS)) {
      for (const target of targets) {
        expect(allowedKinds.has(target.kind)).toBe(true);
      }
    }
  });
});

describe("isFiniteVec3 — 3D 좌표 totality predicate", () => {
  it("숫자 3개로 이뤄진 배열만 true를 반환한다", () => {
    expect(isFiniteVec3([0, 1.5, -2])).toBe(true);
    expect(isFiniteVec3([0, 0, 0])).toBe(true);
  });

  it("undefined·NaN·Infinity·길이 불일치는 모두 false다", () => {
    expect(isFiniteVec3(undefined)).toBe(false);
    expect(isFiniteVec3(null)).toBe(false);
    expect(isFiniteVec3([1, 2])).toBe(false);
    expect(isFiniteVec3([1, 2, 3, 4])).toBe(false);
    expect(isFiniteVec3([1, NaN, 3])).toBe(false);
    expect(isFiniteVec3([1, Infinity, 3])).toBe(false);
    expect(isFiniteVec3([1, -Infinity, 3])).toBe(false);
    expect(isFiniteVec3(["1", 2, 3])).toBe(false);
  });
});

describe("상시 캐릭터/소품 앵커 — 전부 유효한 Vec3이고 바닥(y>=0) 기준이다", () => {
  const floorRooted: Record<string, unknown> = {
    GUARDIAN_ANCHOR,
    SENIOR_ANCHOR,
    CABINET_ANCHOR,
    TABLE_CENTER,
    SCALE_ANCHOR,
  };
  const other: Record<string, unknown> = {
    DOG_ANCHOR,
    GUARDIAN_TARGET,
    GUARDIAN_HEAD_TOP,
    SENIOR_TARGET,
    SENIOR_HEAD_TOP,
    CABINET_TARGET,
    CLIPBOARD_ANCHOR,
    MONITOR_ANCHOR,
    WALL_SIGN_ANCHOR,
    RESULT_BADGE_POINT,
  };

  it.each(Object.entries(floorRooted))("%s는 유효한 Vec3이고 y가 0 이상이다(바닥 아래로 꺼지지 않음)", (_name, value) => {
    expect(isFiniteVec3(value)).toBe(true);
    expect((value as [number, number, number])[1]).toBeGreaterThanOrEqual(0);
  });

  it.each(Object.entries(other))("%s는 유효한 Vec3다", (_name, value) => {
    expect(isFiniteVec3(value)).toBe(true);
  });

  it("G2.2-R2-L 회귀: GUARDIAN_ANCHOR/SENIOR_ANCHOR/CABINET_ANCHOR가 공중에 떠 있지 않는다(y===0)", () => {
    // 실제 사고: 이 세 앵커가 y=1.0~1.5였다 — 캐릭터/약장이 바닥에서 떨어진 채
    // 렌더돼 카메라 프레이밍 계산과 실제 시각적 위치가 어긋났다.
    expect(GUARDIAN_ANCHOR[1]).toBe(0);
    expect(SENIOR_ANCHOR[1]).toBe(0);
    expect(CABINET_ANCHOR[1]).toBe(0);
  });

  it("타깃 앵커(GUARDIAN_TARGET/SENIOR_TARGET/CABINET_TARGET)는 대응 루트 앵커보다 높은 위치다(가슴 높이)", () => {
    expect(GUARDIAN_TARGET[1]).toBeGreaterThan(GUARDIAN_ANCHOR[1]);
    expect(SENIOR_TARGET[1]).toBeGreaterThan(SENIOR_ANCHOR[1]);
    expect(CABINET_TARGET[1]).toBeGreaterThan(CABINET_ANCHOR[1]);
  });

  it("CORE_FRAMING_POINTS의 모든 점이 유효한 Vec3다", () => {
    for (const point of CORE_FRAMING_POINTS) {
      expect(isFiniteVec3(point)).toBe(true);
    }
  });
});

describe("SCENE_TARGETS — 모든 point의 모든 타깃 position이 유효한 Vec3", () => {
  it.each(Object.keys(SCENE_TARGETS))("%s의 모든 타깃 position이 유효하다", (id) => {
    for (const target of SCENE_TARGETS[id]) {
      expect(isFiniteVec3(target.position)).toBe(true);
    }
  });
});

describe("fitVerticalFov — 좁은 세로 화면에서 FOV가 더 넓게 계산된다", () => {
  const cameraPos = HERO_CAMERA_POSITION;
  const lookAt = HERO_CAMERA_LOOKAT;
  const points = CORE_FRAMING_POINTS;

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

  it("375px 세로 폭 대표 aspect(0.6~0.75)에서 핵심 3인 프레이밍에 필요한 FOV가 80° 상한과 뚜렷한 여유를 둔다(과도한 광각 방지)", () => {
    // 작업지시서: "좁은 화면에서 단순히 FOV만 키워 모든 대상을 작게 만드는
    // 방식으로 해결하지 마세요." — 오브젝트를 카메라 가까이 compact하게
    // 배치했으므로, 가장 좁은 대표 aspect(0.6)에서도 상한(80°)에 최소
    // 8° 이상 못 미쳐야 한다(=maxFovDeg에 거의 도달해 화질이 어안렌즈처럼
        // 왜곡되기 직전까지 가지 않는다).
    for (const aspect of [0.6, 0.66, 0.75]) {
      const fov = fitVerticalFov({
        cameraPos,
        lookAt,
        points: framingPointsForPositions(points),
        aspect,
      });
      expect(fov).toBeLessThan(72);
    }
  });
});

describe("HERO_CAMERA — position/lookAt은 어떤 mode·phase·point에서도 절대 움직이지 않는다", () => {
  // G2.2-R2-L 핵심 회귀 대상: "선택 단계마다 카메라가 특정 타깃을 따라 크게
  // 이동" 문제. 이전(R2/R2-R)에는 지점마다 카메라 position을 다시 계산했다.
  // 이제는 resolveScenePresentation이 어떤 phase·point를 받아도 camera.position/
  // lookAt이 항상 HERO_CAMERA와 정확히 같아야 한다(FOV만 바뀐다).
  function allPhasePointCombos(mode: Mode): Array<[VetScenePhase, number]> {
    const points = mode === "compass" ? CHOICE_POINTS : SPROUT_POINTS;
    const combos: Array<[VetScenePhase, number]> = [["intro", 1], ["result", 1]];
    for (const p of points) {
      combos.push(["choosing", p.point], ["reaction", p.point]);
    }
    return combos;
  }

  it.each(MODES)("%s 모드의 모든 phase·point에서 camera.position/lookAt이 HERO_CAMERA와 동일하다", (mode) => {
    for (const [phase, point] of allPhasePointCombos(mode)) {
      const points = mode === "compass" ? CHOICE_POINTS : SPROUT_POINTS;
      const pointData = points[point - 1];
      const choices = phase === "choosing" && pointData ? pointData.choices : [];
      const { camera } = resolveScenePresentation(mode, phase, point, choices);
      expect(camera.position).toEqual(HERO_CAMERA_POSITION);
      expect(camera.lookAt).toEqual(HERO_CAMERA_LOOKAT);
    }
  });
});

describe("cameraForPoint / overviewCamera / resultCamera — 카메라는 항상 씬 앞쪽(+z 방향)에 위치한다", () => {
  it.each(Object.keys(SCENE_TARGETS))("%s의 카메라 z가 모든 타깃보다 크다(카메라가 대상 뒤로 파묻히지 않음)", (id) => {
    const { position, points } = cameraForPoint(id);
    for (const point of points) {
      expect(position[2]).toBeGreaterThan(point[2]);
    }
  });

  it("overviewCamera의 카메라 z도 핵심 3인 전원보다 크다", () => {
    const { position, points } = overviewCamera();
    for (const point of points) {
      expect(position[2]).toBeGreaterThan(point[2]);
    }
  });

  it("resultCamera의 카메라 z도 핵심 3인 + 완료 배지보다 크다", () => {
    const { position, points } = resultCamera();
    for (const point of points) {
      expect(position[2]).toBeGreaterThan(point[2]);
    }
    expect(points).toContainEqual(RESULT_BADGE_POINT);
  });
});

describe(
  "resolveScenePresentation — 카메라 수학상 모든 mode·phase·point에서 핵심 인물·현재 타깃이 화면 안에 투영된다 " +
    "(주의: 이 테스트는 fitVerticalFov·projectToNdc 두 함수 사이의 수학적 일관성만 검증한다 — " +
    "실제 R3F 렌더 결과나 사람 눈에 보이는 화면을 검증하지 않는다. 완료 보고의 실제 브라우저 확인 절 참고.)",
  () => {
    const ASPECTS = [0.62, 0.7, 1.33]; // 좁은 세로 폰 ~ 데스크톱 대표값
    const NDC_MARGIN = 0.98;

    function assertFramingPointsOnScreen(mode: Mode, phase: VetScenePhase, point: number) {
      const points = mode === "compass" ? CHOICE_POINTS : SPROUT_POINTS;
      const pointData = points[point - 1];
      const choices = phase === "choosing" && pointData ? pointData.choices : [];
      const presentation = resolveScenePresentation(mode, phase, point, choices);
      const framingPoints = framingPointsForPositions(presentation.camera.points);

      for (const aspect of ASPECTS) {
        const fov = fitVerticalFov({
          cameraPos: presentation.camera.position,
          lookAt: presentation.camera.lookAt,
          points: framingPoints,
          aspect,
        });
        for (const p of framingPoints) {
          const ndc = projectToNdc(presentation.camera.position, presentation.camera.lookAt, fov, aspect, p);
          expect(
            ndc,
            `${mode}/${phase}/p${point} @ aspect ${aspect}: 점 [${p.join(",")}]이 카메라 뒤에 있어 투영할 수 없음`,
          ).not.toBeNull();
          if (ndc) {
            expect(Math.abs(ndc.ndcX)).toBeLessThanOrEqual(NDC_MARGIN);
            expect(Math.abs(ndc.ndcY)).toBeLessThanOrEqual(NDC_MARGIN);
          }
        }
      }
    }

    it("나침반: intro·1~5지점(choosing/reaction)·result 전 구간", () => {
      assertFramingPointsOnScreen("compass", "intro", 1);
      for (const point of CHOICE_POINTS) {
        assertFramingPointsOnScreen("compass", "choosing", point.point);
        assertFramingPointsOnScreen("compass", "reaction", point.point);
      }
      assertFramingPointsOnScreen("compass", "result", 1);
    });

    it("새싹: intro·1~3지점(choosing/reaction)·result 전 구간", () => {
      assertFramingPointsOnScreen("sprout", "intro", 1);
      for (const point of SPROUT_POINTS) {
        assertFramingPointsOnScreen("sprout", "choosing", point.point);
        assertFramingPointsOnScreen("sprout", "reaction", point.point);
      }
      assertFramingPointsOnScreen("sprout", "result", 1);
    });
  },
);

// ---------- G2.2-R3-B: 화면 핀(pin) 좌표 — 겹치지 않고 경계를 벗어나지 않는다 ----------
//
// SceneTargetPins.tsx가 렌더하는 32px 원형 핀의 실제 화면 좌표를 계산하는
// computeChoicePinPixels/resolvePinLayout은 순수 함수다(useFrame 없음).
// 여기서는 375×812의 실제 Canvas 폭(패딩 제외 대략값)과 이보다 더 좁은
// 320px 폭까지 포함해 "모든 mode·point에서 핀이 서로 최소 간격 이상
// 떨어지고 Canvas 밖으로 나가지 않는다"를 검증한다. 이 테스트도 실제
// 브라우저 렌더 결과가 아니라 좌표 계산의 정합성만 증명한다.

describe("computeChoicePinPixels / resolvePinLayout — 화면 핀 충돌·경계 회귀", () => {
  const CANVAS_SIZES = [
    { width: 288, height: 300 }, // 320px 폭 기기, 좌우 패딩 제외
    { width: 343, height: 300 }, // 375px 폭 기기
    { width: 343, height: 360 },
    { width: 700, height: 420 }, // 데스크톱 대표값
  ];

  it.each(MODES)("%s 모드의 모든 point에서, 여러 Canvas 크기에 대해 핀이 서로 겹치지 않고 경계 안에 있다", (mode) => {
    const points = mode === "compass" ? CHOICE_POINTS : SPROUT_POINTS;
    for (const point of points) {
      const id = sceneInteractionId(mode, point.point);
      for (const { width, height } of CANVAS_SIZES) {
        const pins = computeChoicePinPixels(id, point.choices, width, height);
        // 경계 안: 반지름만큼 여유를 둔 [radius, size-radius] 범위
        for (const pin of pins) {
          expect(pin.x).toBeGreaterThanOrEqual(PIN_RADIUS_PX - 0.01);
          expect(pin.x).toBeLessThanOrEqual(width - PIN_RADIUS_PX + 0.01);
          expect(pin.y).toBeGreaterThanOrEqual(PIN_RADIUS_PX - 0.01);
          expect(pin.y).toBeLessThanOrEqual(height - PIN_RADIUS_PX + 0.01);
        }
        // 서로 겹치지 않음: 중심 간 거리가 지름(2*radius) 이상
        for (let i = 0; i < pins.length; i += 1) {
          for (let j = i + 1; j < pins.length; j += 1) {
            const dx = pins[i].x - pins[j].x;
            const dy = pins[i].y - pins[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            expect(
              dist,
              `${id} @ ${width}x${height}: 핀 ${pins[i].choiceId}/${pins[j].choiceId}이 겹칩니다(거리 ${dist.toFixed(1)}px)`,
            ).toBeGreaterThanOrEqual(PIN_RADIUS_PX * 2 - 1);
          }
        }
      }
    }
  });

  it("width/height가 0 이하면 빈 배열을 반환한다(레이아웃 전 안전 가드)", () => {
    expect(computeChoicePinPixels("compass_p1", CHOICE_POINTS[0].choices, 0, 300)).toEqual([]);
    expect(computeChoicePinPixels("compass_p1", CHOICE_POINTS[0].choices, 300, 0)).toEqual([]);
  });

  it("각 핀의 ordinal은 choices 배열 안에서의 1-based 순번과 일치한다", () => {
    const pins = computeChoicePinPixels("compass_p3", CHOICE_POINTS[2].choices, 343, 300);
    for (const pin of pins) {
      const expectedOrdinal = CHOICE_POINTS[2].choices.findIndex((c) => c.id === pin.choiceId) + 1;
      expect(pin.ordinal).toBe(expectedOrdinal);
    }
  });

  it("resolvePinLayout — 서로 정확히 같은 좌표로 주어진 핀도 최소 간격만큼 떨어뜨린다", () => {
    const laidOut = resolvePinLayout(
      [
        { choiceId: "a", x: 100, y: 100 },
        { choiceId: "b", x: 100, y: 100 },
      ],
      343,
      300,
    );
    const dx = laidOut[0].x - laidOut[1].x;
    const dy = laidOut[0].y - laidOut[1].y;
    expect(Math.sqrt(dx * dx + dy * dy)).toBeGreaterThan(0);
  });
});
