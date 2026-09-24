import { describe, expect, it } from "vitest";
import { CHOICE_POINTS, SPROUT_POINTS, type Mode } from "./scenario";
import { sceneInteractionId } from "./sceneLayout";
import {
  CHOICE_FEEDBACK,
  DOG_NAME,
  actionCardChoiceIds,
  allChoices,
  choiceLabel,
  classifyChoice,
  pointCategory,
  resolveStage,
  targetKindForChoice,
} from "./vetStoryboard";

// G2.2-R3-B 테스트 요구사항(작업지시서 §10) 대응:
//   3) 모든 choice에 HUD·행동 로그·결과 타임라인 문구 존재
//   4) 모든 choice가 sceneTarget 또는 actionCard 중 정확히 하나로 분류됨
//   5) actionCard에 잘못된 3D 타깃이 없음
// 좌표/포즈 계산은 순수 함수 수준 정합성만 검증한다 — 실제 화면에서
// 이 자세가 "자연스럽게 보이는지"는 이 테스트가 증명하지 못한다.

const MODES: Mode[] = ["compass", "sprout"];

describe("DOG_NAME — 서사 전제", () => {
  it("강아지 이름은 '콩이'다", () => {
    expect(DOG_NAME).toBe("콩이");
  });
});

describe("classifyChoice / targetKindForChoice — 모든 choice가 sceneTarget|actionCard 중 하나로 분류된다", () => {
  it.each(MODES)("%s 모드의 모든 choice가 정확히 하나로 분류된다", (mode) => {
    const points = mode === "compass" ? CHOICE_POINTS : SPROUT_POINTS;
    for (const point of points) {
      const id = sceneInteractionId(mode, point.point);
      for (const choice of point.choices) {
        const classification = classifyChoice(id, choice.id);
        expect(["sceneTarget", "actionCard"]).toContain(classification);
      }
    }
  });

  it.each(MODES)("%s 모드: actionCard로 분류된 choice는 targetKind가 null이다(잘못된 3D 타깃 없음)", (mode) => {
    const points = mode === "compass" ? CHOICE_POINTS : SPROUT_POINTS;
    for (const point of points) {
      const id = sceneInteractionId(mode, point.point);
      for (const choice of point.choices) {
        if (classifyChoice(id, choice.id) === "actionCard") {
          expect(targetKindForChoice(id, choice.id)).toBeNull();
        } else {
          expect(targetKindForChoice(id, choice.id)).not.toBeNull();
        }
      }
    }
  });

  it("나침반 3지점('두 상황의 상태와 순서를 비교한다')에서만 모니터가 sceneTarget이다(반복 재사용 근본 해소 확인)", () => {
    const points = CHOICE_POINTS;
    let monitorCount = 0;
    for (const point of points) {
      const id = sceneInteractionId("compass", point.point);
      for (const choice of point.choices) {
        if (targetKindForChoice(id, choice.id) === "monitor") monitorCount += 1;
      }
    }
    expect(monitorCount).toBe(1);
  });
});

describe("CHOICE_FEEDBACK — 모든 choice에 선택 후 피드백 문구가 존재한다", () => {
  it("scenario.ts의 모든 choice id가 CHOICE_FEEDBACK에 존재하고 빈 문자열이 아니다", () => {
    for (const choice of allChoices()) {
      expect(CHOICE_FEEDBACK[choice.id], `${choice.id}의 피드백이 없습니다`).toBeDefined();
      expect(CHOICE_FEEDBACK[choice.id].length).toBeGreaterThan(0);
    }
  });

  it("CHOICE_FEEDBACK에는 scenario.ts에 없는 choice id가 없다(고아 데이터 방지)", () => {
    const validIds = new Set(allChoices().map((c) => c.id));
    for (const id of Object.keys(CHOICE_FEEDBACK)) {
      expect(validIds.has(id)).toBe(true);
    }
  });
});

describe("choiceLabel — history(point+choiceId)에서 실제 choice.label을 되찾는다", () => {
  it("compass_p3_c/sprout_s2_b의 label이 scenario.ts 원본과 정확히 같다", () => {
    expect(choiceLabel("compass", 3, "p3_c")).toBe(
      CHOICE_POINTS.find((p) => p.point === 3)!.choices.find((c) => c.id === "p3_c")!.label,
    );
    expect(choiceLabel("sprout", 2, "s2_b")).toBe(
      SPROUT_POINTS.find((p) => p.point === 2)!.choices.find((c) => c.id === "s2_b")!.label,
    );
  });

  it("존재하지 않는 point/choiceId 조합은 빈 문자열을 반환한다(방어)", () => {
    expect(choiceLabel("compass", 99, "nope")).toBe("");
  });
});

describe("pointCategory — 결과 타임라인 카테고리 라벨", () => {
  it("나침반 5개 point 전부와 새싹 3개 point 전부에 카테고리가 있다", () => {
    for (const point of CHOICE_POINTS) {
      expect(pointCategory("compass", point.point).length).toBeGreaterThan(0);
    }
    for (const point of SPROUT_POINTS) {
      expect(pointCategory("sprout", point.point).length).toBeGreaterThan(0);
    }
  });
});

describe("resolveStage — mode+phase+point(+직전 선택)가 장면 상태를 결정론적으로 계산한다", () => {
  const NUMERIC_KEYS = [
    "guardianYaw",
    "guardianArm",
    "seniorYaw",
    "seniorArm",
    "dogYaw",
    "clipboardRows",
    "clipboardYaw",
  ] as const;

  function assertFinite(stage: ReturnType<typeof resolveStage>) {
    for (const key of NUMERIC_KEYS) {
      expect(Number.isFinite(stage.pose[key]), key).toBe(true);
    }
    for (const offset of [stage.pose.guardianOffset, stage.pose.seniorOffset]) {
      expect(offset).toHaveLength(2);
      expect(offset.every((n) => Number.isFinite(n))).toBe(true);
    }
    expect(typeof stage.pose.dogHeadUp).toBe("boolean");
    expect(typeof stage.pose.dogLow).toBe("boolean");
    expect(typeof stage.pose.waitingPairVisible).toBe("boolean");
    expect(["none", "guide", "tabs"]).toContain(stage.pose.card);
  }

  it("intro/result 상태는 항상 유효한 값이고, 결과에서만 강아지가 엎드린다", () => {
    const intro = resolveStage("compass", "intro", 1, null);
    const result = resolveStage("compass", "result", 1, null);
    assertFinite(intro);
    assertFinite(result);
    expect(result.dogResting).toBe(true);
    expect(intro.dogResting).toBe(false);
    expect(intro.pose.dogLow).toBe(true);
    expect(result.pose.card).toBe("guide");
    expect(result.pose.clipboardRows).toBe(4);
  });

  it.each(MODES)("%s 모드의 모든 point·모든 choice에서 choosing/reaction 상태가 유효하다", (mode) => {
    const points = mode === "compass" ? CHOICE_POINTS : SPROUT_POINTS;
    for (const point of points) {
      for (const choice of point.choices) {
        const id = sceneInteractionId(mode, point.point);
        const kind = targetKindForChoice(id, choice.id);
        assertFinite(resolveStage(mode, "choosing", point.point, null));
        assertFinite(resolveStage(mode, "reaction", point.point, kind, choice.id));
      }
    }
  });

  it("나침반 3지점(choosing/reaction)에서만 대기 보호자가 등장한다", () => {
    expect(resolveStage("compass", "choosing", 3, null).pose.waitingPairVisible).toBe(true);
    expect(resolveStage("compass", "reaction", 3, "senior", "p3_c").pose.waitingPairVisible).toBe(true);
    for (const point of [1, 2, 4, 5]) {
      expect(resolveStage("compass", "choosing", point, null).pose.waitingPairVisible).toBe(false);
    }
    expect(resolveStage("compass", "intro", 1, null).pose.waitingPairVisible).toBe(false);
    expect(resolveStage("compass", "result", 1, null).pose.waitingPairVisible).toBe(false);
  });

  it("기록판을 고르면 기록 줄이 실제로 2줄 늘고 justRecorded가 true다(다른 대상이면 그대로)", () => {
    const base = resolveStage("compass", "choosing", 2, null).pose.clipboardRows;
    const recorded = resolveStage("compass", "reaction", 2, "clipboard", "p2_b");
    expect(recorded.justRecorded).toBe(true);
    expect(recorded.pose.clipboardRows).toBe(Math.min(4, base + 2));
    const other = resolveStage("compass", "reaction", 2, "senior", "p2_a");
    expect(other.justRecorded).toBe(false);
    expect(other.pose.clipboardRows).toBe(base);
  });

  it("p4_c(기록과 콩이 상태를 함께 다시 살핀다)는 강아지 고개 들기 + 기록판 확인 표시를 함께 보여준다", () => {
    const stage = resolveStage("compass", "reaction", 4, "dog", "p4_c");
    expect(stage.pose.dogHeadUp).toBe(true);
    expect(stage.justRecorded).toBe(true);
    expect(stage.pose.clipboardRows).toBeGreaterThan(resolveStage("compass", "choosing", 4, null).pose.clipboardRows);
  });

  it("reaction에서 방금 고른 대상별로 실제 상태가 달라진다(보호자→몸 방향·팔, 선배→이동·팔, 강아지→고개)", () => {
    const base = resolveStage("sprout", "choosing", 1, null).pose;
    const guardian = resolveStage("sprout", "reaction", 1, "guardian", "s1_a").pose;
    const dog = resolveStage("sprout", "reaction", 1, "dog", "s1_b").pose;
    expect(guardian.guardianYaw).not.toBe(base.guardianYaw);
    expect(guardian.guardianArm).toBeGreaterThan(base.guardianArm);
    expect(dog.dogHeadUp).toBe(true);
    expect(dog.dogLow).toBe(false);
    const seniorBase = resolveStage("sprout", "choosing", 2, null).pose;
    const senior = resolveStage("sprout", "reaction", 2, "senior", "s2_a").pose;
    expect(senior.seniorOffset).not.toEqual(seniorBase.seniorOffset);
  });

  // HUD 문구는 이 상태에 포함되지 않는다 — 단계 전환마다 장면 상태 키가 2개 이상 실제로 달라져야 한다.
  function diffKeys(a: ReturnType<typeof resolveStage>, b: ReturnType<typeof resolveStage>): string[] {
    const keys = Object.keys(a.pose) as (keyof typeof a.pose)[];
    const changed: string[] = keys.filter((k) => JSON.stringify(a.pose[k]) !== JSON.stringify(b.pose[k])) as string[];
    if (a.dogResting !== b.dogResting) changed.push("dogResting");
    return changed;
  }

  it("새싹 1→2, 2→3, 3→결과 전환마다 HUD 이외의 장면 상태가 최소 2개 이상 달라진다", () => {
    const s = (p: number) => resolveStage("sprout", "choosing", p, null);
    const result = resolveStage("sprout", "result", 3, null);
    expect(diffKeys(s(1), s(2)).length).toBeGreaterThanOrEqual(2);
    expect(diffKeys(s(2), s(3)).length).toBeGreaterThanOrEqual(2);
    expect(diffKeys(s(3), result).length).toBeGreaterThanOrEqual(2);
  });

  it("나침반 1→2, 2→3, 3→4, 4→5, 5→결과 전환마다 HUD 이외의 장면 상태가 최소 2개 이상 달라진다", () => {
    const s = (p: number) => resolveStage("compass", "choosing", p, null);
    const result = resolveStage("compass", "result", 5, null);
    for (const [a, b] of [
      [s(1), s(2)],
      [s(2), s(3)],
      [s(3), s(4)],
      [s(4), s(5)],
      [s(5), result],
    ] as const) {
      expect(diffKeys(a, b).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("결과 상태에서는 두 사람이 서로 마주보는 방향(보호자 +yaw / 선배 -yaw)이고 서로 다가선다", () => {
    const { pose } = resolveStage("compass", "result", 5, null);
    expect(pose.guardianYaw).toBeGreaterThan(0.8);
    expect(pose.seniorYaw).toBeLessThan(-0.8);
    expect(pose.guardianOffset[0]).toBeGreaterThan(0);
    expect(pose.seniorOffset[0]).toBeLessThan(0);
  });
});

describe("actionCardChoiceIds — HTML 카드로만 선택하는 추상 행동 목록", () => {
  it("compass에는 4개(p1_b/p2_c/p4_b/p5_b), sprout에는 1개(s3_b)가 있다", () => {
    const compassCards = actionCardChoiceIds("compass");
    const sproutCards = actionCardChoiceIds("sprout");
    expect(compassCards.sort()).toEqual(["p1_b", "p2_c", "p4_b", "p5_b"].sort());
    expect(sproutCards).toEqual(["s3_b"]);
  });
});
