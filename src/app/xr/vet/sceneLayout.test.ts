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
  RESULT_BADGE_POINT,
  SCALE_ANCHOR,
  SCENE_TARGETS,
  SENIOR_ANCHOR,
  SENIOR_HEAD_TOP,
  SENIOR_TARGET,
  TABLE_CENTER,
  WALL_SIGN_ANCHOR,
  cameraForPoint,
  fitVerticalFov,
  framingPointsForPositions,
  isFiniteVec3,
  overviewCamera,
  pairwiseMinDistance,
  projectToNdc,
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
    "%s의 타깃들은 서로 최소 간격(%s) 이상 떨어져 있다 — 장면 속 번호 배지·하이라이트 링이 겹치지 않는다",
    (id) => {
      const positions = SCENE_TARGETS[id].map((t) => t.position);
      if (positions.length < 2) return;
      expect(pairwiseMinDistance(positions)).toBeGreaterThanOrEqual(MIN_TARGET_SPACING);
    },
  );
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
