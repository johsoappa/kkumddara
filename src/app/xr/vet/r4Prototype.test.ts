import { describe, expect, it } from "vitest";
import { SPROUT_POINTS } from "./scenario";
import {
  HUMANOID_POSES,
  changedCategories,
  lerpPose,
  type HumanoidPoseName,
} from "./humanoidPose";
import {
  BUBBLE_HOME,
  DRAG_MIN_PX,
  OBSERVE_INITIAL,
  OBSERVE_WAYPOINTS,
  ORBIT_MAX_YAW,
  RECORD_TARGET,
  R4_ACTION_COPY,
  TAP_MAX_PX,
  TARGET_RADIUS,
  advanceObserve,
  classifyPointerGesture,
  clampOrbitYaw,
  isNearTarget,
  isObserveComplete,
  isR4ActionChoice,
  orbitPosition,
  r4ClipboardRows,
  r4PoseNames,
} from "./r4Prototype";

// R4-A 순수 로직 테스트. 3D 렌더·실제 pointer 동작은 jsdom에서 검증할 수 없다(브라우저 검수 대상).

describe("humanoidPose — 관절 기반 포즈", () => {
  const names = Object.keys(HUMANOID_POSES) as HumanoidPoseName[];

  it("필수 포즈 6종(idle·listening·observing·recording·explaining·complete)이 있다", () => {
    for (const n of ["idle", "listening", "observing", "recording", "explaining", "complete"] as const) {
      expect(HUMANOID_POSES[n]).toBeDefined();
    }
  });

  it("모든 포즈의 모든 관절 값이 유한한 숫자다", () => {
    for (const n of names) {
      const p = HUMANOID_POSES[n];
      const nums = [
        p.torsoYaw, p.torsoLean, p.headYaw, p.headPitch,
        ...Object.values(p.armL), ...Object.values(p.armR),
        ...Object.values(p.legL), ...Object.values(p.legR),
      ];
      expect(nums.every((v) => Number.isFinite(v))).toBe(true);
    }
  });

  it("idle이 아닌 모든 포즈는 idle과 신체 부위(몸통·머리·양팔·양다리) 2곳 이상이 다르다", () => {
    for (const n of names.filter((x) => x !== "idle")) {
      const changed = changedCategories(HUMANOID_POSES.idle, HUMANOID_POSES[n]);
      expect(changed.length, `${n}: ${changed.join(",")}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("idle은 양팔이 몸통에서 떨어지고(abd) 양다리가 벌어져(abd) 있다", () => {
    const p = HUMANOID_POSES.idle;
    expect(p.armL.abd).toBeGreaterThan(0.1);
    expect(p.armR.abd).toBeGreaterThan(0.1);
    expect(p.legL.abd).toBeGreaterThan(0.03);
    expect(p.legR.abd).toBeGreaterThan(0.03);
  });

  it("lerpPose는 t=0/1에서 양 끝 포즈와 같고 t를 0~1로 제한한다", () => {
    const a = HUMANOID_POSES.idle;
    const b = HUMANOID_POSES.observing;
    expect(lerpPose(a, b, 0)).toEqual(a);
    expect(lerpPose(a, b, 1)).toEqual(b);
    expect(lerpPose(a, b, 5)).toEqual(b);
    expect(lerpPose(a, b, -3)).toEqual(a);
  });
});

describe("r4Prototype — 조작 대상·판정", () => {
  it("R4 조작은 새싹 1단계 s1_a/s1_b에만 붙고 compass·다른 지점·다른 choice에는 없다", () => {
    expect(isR4ActionChoice("sprout", 1, "s1_a")).toBe(true);
    expect(isR4ActionChoice("sprout", 1, "s1_b")).toBe(true);
    expect(isR4ActionChoice("sprout", 2, "s2_a")).toBe(false);
    expect(isR4ActionChoice("sprout", 3, "s3_a")).toBe(false);
    expect(isR4ActionChoice("compass", 1, "p1_a")).toBe(false);
  });

  it("s1_a/s1_b의 ID·axis·문구는 scenario.ts 그대로다", () => {
    const [a, b] = SPROUT_POINTS[0].choices;
    expect([a.id, a.axis, a.label]).toEqual(["s1_a", "axis1", "보호자 이야기를 먼저 듣는다"]);
    expect([b.id, b.axis, b.label]).toEqual(["s1_b", "axis5", "콩이의 움직임과 자세를 먼저 살핀다"]);
  });

  it("두 action 모두 대체 버튼 문구·안내가 있고, 진단·치료 표현이 없다", () => {
    expect(R4_ACTION_COPY.s1_a.altLabel).toBe("보호자 이야기를 기록하기");
    expect(R4_ACTION_COPY.s1_b.altLabel).toBe("콩이의 모습을 차례로 살펴보기");
    for (const copy of Object.values(R4_ACTION_COPY)) {
      expect(copy.title + copy.instruction + copy.doneAnnouncement).not.toMatch(/진단|질병|치료|처방|투약/);
    }
  });

  it("말풍선은 기록 목표 반경 안에서만 스냅되고, 반경은 44px 터치를 넘는 크기다", () => {
    expect(isNearTarget([RECORD_TARGET[0] + 0.1, RECORD_TARGET[1] - 0.1, 0], RECORD_TARGET)).toBe(true);
    expect(isNearTarget(BUBBLE_HOME, RECORD_TARGET)).toBe(false);
    // 화면 약 78px/월드단위 기준 지름 = 2*0.3*78 ≈ 47px ≥ 44px
    expect(2 * TARGET_RADIUS * 78).toBeGreaterThanOrEqual(44);
  });

  it("관찰 링은 머리 → 몸통 순서로만 진행되고 두 지점을 지나야 완료된다", () => {
    const [head, body] = OBSERVE_WAYPOINTS;
    // 몸통을 먼저 지나도 진행되지 않는다
    expect(advanceObserve(OBSERVE_INITIAL, body)).toEqual(OBSERVE_INITIAL);
    const afterHead = advanceObserve(OBSERVE_INITIAL, head);
    expect(afterHead).toEqual({ head: true, body: false });
    expect(isObserveComplete(afterHead)).toBe(false);
    const done = advanceObserve(afterHead, body);
    expect(done).toEqual({ head: true, body: true });
    expect(isObserveComplete(done)).toBe(true);
    // 완료 후에는 변하지 않는다
    expect(advanceObserve(done, head)).toEqual(done);
  });

  it("탭/드래그 판정: 6px 미만=탭, 12px 이상=드래그, 사이는 무동작", () => {
    expect(TAP_MAX_PX).toBe(6);
    expect(DRAG_MIN_PX).toBe(12);
    expect(classifyPointerGesture(0)).toBe("tap");
    expect(classifyPointerGesture(5.9)).toBe("tap");
    expect(classifyPointerGesture(6)).toBe("ambiguous");
    expect(classifyPointerGesture(11.9)).toBe("ambiguous");
    expect(classifyPointerGesture(12)).toBe("drag");
    expect(classifyPointerGesture(200)).toBe("drag");
  });

  it("장면 회전은 ±15도로 제한되고 카메라 높이·중심 거리를 유지한다", () => {
    expect(clampOrbitYaw(10)).toBeCloseTo(ORBIT_MAX_YAW);
    expect(clampOrbitYaw(-10)).toBeCloseTo(-ORBIT_MAX_YAW);
    expect(ORBIT_MAX_YAW).toBeCloseTo(0.2618, 3);
    const pos: [number, number, number] = [0, 1.6, 2.9];
    const look: [number, number, number] = [0, 0.95, -1.0];
    const rotated = orbitPosition(pos, look, ORBIT_MAX_YAW);
    expect(rotated[1]).toBe(1.6);
    const r0 = Math.hypot(pos[0] - look[0], pos[2] - look[2]);
    const r1 = Math.hypot(rotated[0] - look[0], rotated[2] - look[2]);
    expect(r1).toBeCloseTo(r0, 6);
    expect(orbitPosition(pos, look, 0)).toEqual(pos);
  });
});

describe("r4PoseNames / r4ClipboardRows — 단계별 포즈·기록판", () => {
  it("s1_a는 보호자 listening + 선배 attentive, s1_b는 선배 observing", () => {
    expect(r4PoseNames("choosing", 1, "s1_a")).toEqual({ guardian: "listening", senior: "attentive" });
    expect(r4PoseNames("reaction", 1, "s1_b")).toEqual({ guardian: "attentive", senior: "observing" });
    expect(r4PoseNames("choosing", 1, null)).toEqual({ guardian: "idle", senior: "idle" });
    expect(r4PoseNames("intro", 1, null)).toEqual({ guardian: "idle", senior: "idle" });
  });

  it("새싹 2·3·결과 단계는 기록·안내·완료 포즈를 쓴다", () => {
    expect(r4PoseNames("choosing", 2, null).senior).toBe("recording");
    expect(r4PoseNames("choosing", 3, null).senior).toBe("explaining");
    expect(r4PoseNames("result", 3, null)).toEqual({ guardian: "complete", senior: "complete" });
  });

  it("새싹1 reaction에서만 기록판 줄이 추가된다(s1_a 1줄, s1_b 2줄)", () => {
    expect(r4ClipboardRows("reaction", 1, "s1_a")).toBe(1);
    expect(r4ClipboardRows("reaction", 1, "s1_b")).toBe(2);
    expect(r4ClipboardRows("choosing", 1, "s1_a")).toBeNull();
    expect(r4ClipboardRows("reaction", 2, "s2_b")).toBeNull();
  });
});
