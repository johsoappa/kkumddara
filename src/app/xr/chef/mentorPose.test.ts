import { describe, expect, it } from "vitest";
import {
  MENTOR_HOLD,
  MENTOR_REST,
  NOD_DURATION_S,
  WAVE_CYCLES,
  WAVE_DURATION_S,
  lerpMentorPose,
  mentorCueForPhase,
  mentorEaseAlpha,
  mentorTargetPose,
  type MentorCue,
} from "./mentorPose";

const CUES: MentorCue[] = ["greet", "watch", "respond", "present"];

describe("mentorCueForPhase — 진행 단계에서만 연출을 정한다", () => {
  it("도입=인사, 선택 중=지켜봄, 반응=끄덕임+가리킴, 결과=접시 소개", () => {
    expect(mentorCueForPhase("intro")).toBe("greet");
    expect(mentorCueForPhase("choosing")).toBe("watch");
    expect(mentorCueForPhase("reaction")).toBe("respond");
    expect(mentorCueForPhase("result")).toBe("present");
  });

  it("선택 내용(choice id·축)을 입력으로 받지 않아 선택을 평가하는 연출이 나올 수 없다", () => {
    expect(mentorCueForPhase.length).toBe(1);
    // 같은 반응 단계라면 어떤 선택이었든 같은 자세 — 입력이 시간·단서·reduced 뿐이다
    expect(mentorTargetPose.length).toBe(3);
  });
});

describe("mentorTargetPose — 반복 절제 + reduced-motion", () => {
  it("reduced-motion이면 경과 시간과 무관하게 정적 자세만 돌려준다", () => {
    for (const cue of CUES) {
      for (const t of [0, 0.2, 0.6, 1.1, 5]) {
        expect(mentorTargetPose(cue, t, true)).toEqual(MENTOR_HOLD[cue]);
      }
    }
  });

  it("손 흔들기는 정해진 시간(WAVE_DURATION_S) 동안만, 지정된 횟수(WAVE_CYCLES)만 일어나고 멈춘다", () => {
    // 요구사항: 두 번만 흔들고 멈춘다(상수가 바뀌면 연출 기준이 바뀌는 것이므로 의도적으로 고정)
    expect(WAVE_CYCLES).toBe(2);
    const hold = MENTOR_HOLD.greet.armR.abd;
    // 흔드는 동안은 abd가 hold 주변에서 변한다
    const during = [0.1, 0.2, 0.4, 0.5].map((t) => mentorTargetPose("greet", t, false).armR.abd);
    expect(new Set(during.map((v) => v.toFixed(3))).size).toBeGreaterThan(1);
    // 끝난 뒤에는 어떤 시점에서도 hold로 고정(반복 없음)
    for (const t of [WAVE_DURATION_S, WAVE_DURATION_S + 0.3, 10, 120]) {
      expect(mentorTargetPose("greet", t, false).armR.abd).toBe(hold);
    }
  });

  it("끄덕임은 한 번(내려갔다 올라옴)만 하고, 끝나면 조리대를 가리키는 자세로 고정된다", () => {
    const base = MENTOR_HOLD.watch.headPitch;
    const dip = mentorTargetPose("respond", NOD_DURATION_S * 0.25, false).headPitch;
    const back = mentorTargetPose("respond", NOD_DURATION_S * 0.99, false).headPitch;
    expect(dip).toBeGreaterThan(base + 0.1); // 고개가 숙여짐
    expect(Math.abs(back - base)).toBeLessThan(0.05); // 다시 올라옴
    for (const t of [NOD_DURATION_S, NOD_DURATION_S + 1, 30]) {
      expect(mentorTargetPose("respond", t, false)).toEqual(MENTOR_HOLD.respond);
    }
    // 끄덕이는 동안은 가리키는 팔을 아직 내려 둔다
    expect(mentorTargetPose("respond", 0.2, false).armL).toEqual(MENTOR_HOLD.watch.armL);
  });

  it("가리키는 팔은 조리대 쪽(+x, 월드 오른쪽)으로 벌어지고, 접시 소개는 앞으로 뻗는다", () => {
    expect(MENTOR_HOLD.respond.armL.abd).toBeGreaterThan(0.9);
    expect(MENTOR_HOLD.present.armL.fwd).toBeGreaterThan(0.6);
    // 도입에서 손을 드는 팔은 바깥쪽(armR) — 조리대 쪽 팔과 겹치지 않는다
    expect(MENTOR_HOLD.greet.armR.fwd).toBeGreaterThan(0.8);
  });

  it("모든 자세의 관절 각도가 사람이 만들 수 있는 범위 안이다", () => {
    for (const pose of [MENTOR_REST, ...CUES.map((c) => MENTOR_HOLD[c])]) {
      expect(Math.abs(pose.headYaw)).toBeLessThan(0.7);
      expect(Math.abs(pose.headPitch)).toBeLessThan(0.5);
      for (const arm of [pose.armL, pose.armR]) {
        expect(arm.fwd).toBeGreaterThanOrEqual(-0.3);
        expect(arm.fwd).toBeLessThan(1.6);
        expect(arm.abd).toBeGreaterThanOrEqual(0);
        expect(arm.abd).toBeLessThan(1.6);
        expect(arm.elbow).toBeGreaterThanOrEqual(0);
        expect(arm.elbow).toBeLessThan(2.0);
      }
    }
  });
});

describe("보간", () => {
  it("lerpMentorPose는 t=0이면 a, t=1이면 b이다", () => {
    const a = MENTOR_HOLD.watch;
    const b = MENTOR_HOLD.respond;
    // 부동소수 오차(a + (b-a)*1 ≠ b)를 피하려고 소수 6자리로 맞춰 비교한다
    const round = (p: unknown) => JSON.parse(JSON.stringify(p), (_k, v) => (typeof v === "number" ? Number(v.toFixed(6)) : v));
    expect(round(lerpMentorPose(a, b, 0))).toEqual(round(a));
    expect(round(lerpMentorPose(a, b, 1))).toEqual(round(b));
    expect(lerpMentorPose(a, b, 0.5).armL.abd).toBeCloseTo((a.armL.abd + b.armL.abd) / 2, 6);
  });

  it("mentorEaseAlpha는 프레임레이트와 무관하게 half-life로 수렴한다", () => {
    expect(mentorEaseAlpha(0)).toBe(0);
    expect(mentorEaseAlpha(0.14)).toBeCloseTo(0.5, 6);
    // 두 번 반 프레임 = 한 번 한 프레임
    const half = mentorEaseAlpha(0.07);
    expect(1 - (1 - half) * (1 - half)).toBeCloseTo(mentorEaseAlpha(0.14), 6);
  });
});
