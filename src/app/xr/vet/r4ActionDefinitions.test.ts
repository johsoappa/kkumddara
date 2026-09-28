import { describe, expect, it } from "vitest";
import { CHOICE_POINTS, SPROUT_POINTS } from "./scenario";
import {
  R4_ACTION_DEFINITIONS,
  R4_ACTION_ID_LIST,
  getR4ActionCopy,
  getR4ActionDefinition,
  isR4Action,
  type R4ActionGeometry,
} from "./r4ActionDefinitions";
import { distanceXY } from "./r4ActionState";
import { isFiniteVec3, type Vec3 } from "./sceneLayout";

const ALL_CHOICE_IDS = [
  ...CHOICE_POINTS.flatMap((p) => p.choices.map((c) => c.id)),
  ...SPROUT_POINTS.flatMap((p) => p.choices.map((c) => c.id)),
];

// G2.2-R4-B: choice ID 21개 전체에 대한 정의 완전성·중복 없음·금지 표현 없음·
// 목표 영역 중첩 없음을 전수 검증한다. scenario.ts의 choice ID·axis·문구
// 자체는 이 파일에서 다루지 않는다(scenario.test.ts/r4Prototype.test.ts가 검증).

describe("정의 완전성", () => {
  it("scenario.ts의 21개 choice ID 전체에 R4 action 정의가 있다 — 정의되지 않은 ID 없음", () => {
    expect(ALL_CHOICE_IDS).toHaveLength(21);
    for (const id of ALL_CHOICE_IDS) {
      expect(isR4Action(id)).toBe(true);
      expect(getR4ActionDefinition(id)).not.toBeNull();
    }
  });

  it("R4_ACTION_ID_LIST는 scenario.ts의 choice ID 집합과 정확히 같다(추가·누락 없음)", () => {
    expect(new Set(R4_ACTION_ID_LIST)).toEqual(new Set(ALL_CHOICE_IDS));
    expect(R4_ACTION_ID_LIST).toHaveLength(21);
  });

  it("중복 ID가 없다", () => {
    expect(new Set(R4_ACTION_ID_LIST).size).toBe(R4_ACTION_ID_LIST.length);
  });

  it("scenario.ts에 없는 ID는 isR4Action이 false다", () => {
    expect(isR4Action("not_a_real_choice")).toBe(false);
    expect(getR4ActionCopy("not_a_real_choice")).toBeNull();
  });

  it("s1_a/s1_b는 legacy(R4-A 승인 동작)로 남아 있다", () => {
    expect(R4_ACTION_DEFINITIONS.s1_a.geometry.kind).toBe("legacy");
    expect(R4_ACTION_DEFINITIONS.s1_b.geometry.kind).toBe("legacy");
  });
});

describe("copy — 문구 안전성", () => {
  it("모든 정의에 title·instruction·doneAnnouncement가 있고 진단·치료 표현이 없다", () => {
    for (const id of R4_ACTION_ID_LIST) {
      const copy = R4_ACTION_DEFINITIONS[id].copy;
      expect(copy.title.length).toBeGreaterThan(0);
      expect(copy.instruction.length).toBeGreaterThan(0);
      expect(copy.doneAnnouncement.length).toBeGreaterThan(0);
      const text = copy.title + copy.instruction + copy.doneAnnouncement + (copy.altLabel ?? "") + (copy.altSteps ?? []).join("");
      expect(text).not.toMatch(/진단|질병|치료|처방|투약/);
    }
  });

  it("legacy가 아닌 정의는 altLabel(단일 단계) 또는 altSteps(여러 단계) 중 하나만 가진다", () => {
    for (const id of R4_ACTION_ID_LIST) {
      const def = R4_ACTION_DEFINITIONS[id];
      if (def.geometry.kind === "legacy") continue;
      const hasLabel = !!def.copy.altLabel;
      const hasSteps = !!def.copy.altSteps && def.copy.altSteps.length > 0;
      expect(hasLabel !== hasSteps).toBe(true); // 정확히 하나만 참
      if (def.geometry.kind === "dragToTarget") expect(hasLabel).toBe(true);
      else expect(hasSteps).toBe(true);
    }
  });

  it("altSteps 단계 수는 조작 대상 개수(토큰·경유점)와 같다", () => {
    for (const id of R4_ACTION_ID_LIST) {
      const def = R4_ACTION_DEFINITIONS[id];
      const steps = def.copy.altSteps;
      if (!steps) continue;
      const g = def.geometry;
      const expectedCount =
        g.kind === "orderedPath" || g.kind === "reviewPath"
          ? g.waypoints.length
          : g.kind === "orderedSlots"
            ? g.tokens.length
            : g.kind === "multiSource"
              ? g.sources.length
              : g.kind === "matchTarget"
                ? g.tokens.length
                : 0;
      expect(steps.length).toBe(expectedCount);
    }
  });
});

describe("geometry — 좌표 유효성·목표 영역 중첩 없음", () => {
  function collectPointsAndRadius(geometry: R4ActionGeometry): { points: Vec3[]; radius: number }[] {
    switch (geometry.kind) {
      case "legacy":
        return [];
      case "dragToTarget":
        return [{ points: [geometry.home, geometry.target], radius: geometry.radius }];
      case "orderedPath":
      case "reviewPath":
        return [{ points: [geometry.home, ...geometry.waypoints], radius: geometry.radius }];
      case "orderedSlots":
        return [
          {
            points: [...geometry.tokens.map((t) => t.home), ...geometry.slots],
            radius: geometry.radius,
          },
        ];
      case "multiSource":
        return [
          {
            points: [...geometry.sources.map((s) => s.home), geometry.target],
            radius: geometry.radius,
          },
        ];
      case "matchTarget":
        return [
          {
            points: [...geometry.tokens.map((t) => t.home), ...geometry.targets],
            radius: geometry.radius,
          },
        ];
      default:
        return [];
    }
  }

  it("모든 좌표가 유한한 Vec3다(NaN·Infinity 없음 — Canvas 마운트 오류 방지)", () => {
    for (const id of R4_ACTION_ID_LIST) {
      for (const { points } of collectPointsAndRadius(R4_ACTION_DEFINITIONS[id].geometry)) {
        for (const p of points) expect(isFiniteVec3(p)).toBe(true);
      }
    }
  });

  it("모든 조작 반경은 44px 터치 영역과 동등한 최소값(0.28) 이상이다", () => {
    for (const id of R4_ACTION_ID_LIST) {
      const geometry = R4_ACTION_DEFINITIONS[id].geometry;
      if (geometry.kind === "legacy") continue;
      expect(geometry.radius).toBeGreaterThanOrEqual(0.28);
    }
  });

  it("같은 action 안에서 동시에 존재하는 목표(슬롯/타깃/경유점)는 서로 겹치지 않는다 " +
    "(중심 간 거리 > 2*radius)", () => {
    for (const id of R4_ACTION_ID_LIST) {
      const geometry = R4_ACTION_DEFINITIONS[id].geometry;
      if (geometry.kind === "legacy") continue;
      // "목표"만 추린다 — orderedPath/reviewPath는 waypoints, orderedSlots는 slots,
      // multiSource는 target 1개뿐이라 비교 대상 없음, matchTarget은 targets.
      const targets: Vec3[] =
        geometry.kind === "orderedPath" || geometry.kind === "reviewPath"
          ? geometry.waypoints
          : geometry.kind === "orderedSlots"
            ? geometry.slots
            : geometry.kind === "matchTarget"
              ? geometry.targets
              : [];
      for (let i = 0; i < targets.length; i += 1) {
        for (let j = i + 1; j < targets.length; j += 1) {
          const dist = distanceXY(targets[i], targets[j]);
          expect(dist).toBeGreaterThan(geometry.radius * 2);
        }
      }
    }
  });

  it("orderedSlots/matchTarget의 토큰 개수와 슬롯·타깃 개수가 같다", () => {
    for (const id of R4_ACTION_ID_LIST) {
      const geometry = R4_ACTION_DEFINITIONS[id].geometry;
      if (geometry.kind === "orderedSlots") expect(geometry.tokens.length).toBe(geometry.slots.length);
      if (geometry.kind === "matchTarget") {
        expect(geometry.tokens.length).toBe(geometry.targets.length);
        // 모든 targetIndex가 유효 범위 안이고, 토큰마다 서로 다른 target을 가리킨다(전단사)
        const indices = geometry.tokens.map((t) => t.targetIndex);
        for (const i of indices) expect(i).toBeGreaterThanOrEqual(0);
        for (const i of indices) expect(i).toBeLessThan(geometry.targets.length);
        expect(new Set(indices).size).toBe(indices.length);
      }
    }
  });

  it("multiSource는 소스가 2개 이상이다(혼자서는 '함께 모으기'가 성립하지 않는다)", () => {
    for (const id of R4_ACTION_ID_LIST) {
      const geometry = R4_ACTION_DEFINITIONS[id].geometry;
      if (geometry.kind === "multiSource") expect(geometry.sources.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("orderedPath/reviewPath는 경유점이 2개 이상이다", () => {
    for (const id of R4_ACTION_ID_LIST) {
      const geometry = R4_ACTION_DEFINITIONS[id].geometry;
      if (geometry.kind === "orderedPath" || geometry.kind === "reviewPath") {
        expect(geometry.waypoints.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
