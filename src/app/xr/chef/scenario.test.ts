import { describe, expect, it } from "vitest";
import { CHOICE_POINTS, aggregateResult, type ChoiceRecord } from "./scenario";

// G2.1-D1: aggregateResult(C 동점 규칙) 자체를 순수 함수 단위에서 검증한다.
// main(eaadadf) 기준에는 chef XR 테스트가 전혀 없었고, 이번 G2.1 작업도
// aggregateResult 본문은 건드리지 않았다 — 이 테스트는 로직 변경이 아니라
// "이미 존재하던 로직이 기대대로 동작한다"는 회귀 증빙이다.

function record(point: number, choiceId: string): ChoiceRecord {
  const point_ = CHOICE_POINTS.find((p) => p.point === point);
  const choice = point_?.choices.find((c) => c.id === choiceId);
  if (!choice) throw new Error(`fixture error: ${choiceId} not found at point ${point}`);
  return { point, choiceId: choice.id, axis: choice.axis };
}

describe("aggregateResult — C 동점 규칙", () => {
  it("단독 최다 축이 있으면 동점 규칙 없이 그 축을 반환한다", () => {
    const history = [
      record(1, "p1_a"), // axis1
      record(2, "p2_a"), // axis2
      record(3, "p3_a"), // axis5
      record(4, "p4_a"), // axis1
      record(5, "p5_a"), // axis1
    ];
    expect(aggregateResult(history)).toBe("axis1");
  });

  it("2:2:1 동점 — 마지막 지점(비후보)을 건너뛰고, 후보 중 더 나중에 나온 축을 반환한다", () => {
    // 구성: axis1×2(지점1,4), axis2×2(지점2,3), axis3×1(지점5, 동점 후보 아님)
    // 역순 탐색: 지점5(axis3, 후보 아님→스킵) → 지점4(axis1, 후보→채택)
    // 지점3의 p3_c(axis2)가 실제로는 OrderInteraction으로 확정되는 선택이지만,
    // 이 테스트는 aggregateResult 자체만 순수하게 검증한다 (UI 통합 검증은
    // XrChefClient.test.tsx의 "G2.1-D1" 케이스가 담당).
    const history = [
      record(1, "p1_a"), // axis1
      record(2, "p2_a"), // axis2
      record(3, "p3_c"), // axis2
      record(4, "p4_a"), // axis1
      record(5, "p5_b"), // axis3
    ];
    expect(aggregateResult(history)).toBe("axis1");
  });

  it("2:2:1 동점 — 마지막 지점이 후보이면 그 축을 바로 반환한다", () => {
    // 구성: axis1×2(지점1,4), axis2×2(지점3,5), axis4×1(지점2, 후보 아님)
    const history = [
      record(1, "p1_a"), // axis1
      record(2, "p2_c"), // axis4
      record(3, "p3_c"), // axis2
      record(4, "p4_a"), // axis1
      record(5, "p5_c"), // axis2
    ];
    expect(aggregateResult(history)).toBe("axis2");
  });
});
