import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
    expect(afterHead).toEqual({ head: true, leftHead: false, body: false });
    expect(isObserveComplete(afterHead)).toBe(false);
    const done = advanceObserve(afterHead, body);
    expect(done).toEqual({ head: true, leftHead: true, body: true });
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

// ---------- G2.2-R4-A1: 콩이 자세·관찰 반응 / 새싹2 겹침 ----------
import { DOG_POSES, lerpDogPose, r4DogPoseName, r4SeniorOffset, type DogPoseName } from "./r4Prototype";

describe("R4-A1 — 콩이 자세와 관찰 반응", () => {
  const names = Object.keys(DOG_POSES) as DogPoseName[];

  it("모든 자세 값이 유한하고, resting은 다리를 접고 고개를 숙이며 observing은 귀·꼬리·앞발이 최대다", () => {
    for (const n of names) {
      expect(Object.values(DOG_POSES[n]).every((v) => Number.isFinite(v))).toBe(true);
    }
    expect(DOG_POSES.resting.legFold).toBe(1);
    expect(DOG_POSES.resting.headPitch).toBeGreaterThan(0.2);
    expect(DOG_POSES.observing.earPerk).toBe(1);
    expect(DOG_POSES.observing.tailWag).toBe(1);
    expect(DOG_POSES.observing.pawLift).toBe(1);
    expect(DOG_POSES.alert.legFold).toBe(0);
  });

  it("세 자세는 서로 관절 값 3개 이상이 다르다", () => {
    const keys = Object.keys(DOG_POSES.resting) as (keyof typeof DOG_POSES.resting)[];
    for (const [a, b] of [["resting", "alert"], ["alert", "observing"], ["resting", "observing"]] as const) {
      const diff = keys.filter((k) => Math.abs(DOG_POSES[a][k] - DOG_POSES[b][k]) > 0.1);
      expect(diff.length, `${a}→${b}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("lerpDogPose는 양 끝에서 원래 자세와 같고 t를 제한한다", () => {
    expect(lerpDogPose(DOG_POSES.resting, DOG_POSES.alert, 0)).toEqual(DOG_POSES.resting);
    expect(lerpDogPose(DOG_POSES.resting, DOG_POSES.alert, 9)).toEqual(DOG_POSES.alert);
  });

  it("s1_b 관찰 진행 중: 링이 머리를 지나면 alert, 몸통까지 지나면 observing, 시작 전엔 resting", () => {
    expect(r4DogPoseName("choosing", 1, "s1_b", 0)).toBe("resting");
    expect(r4DogPoseName("choosing", 1, "s1_b", 1)).toBe("alert");
    expect(r4DogPoseName("choosing", 1, "s1_b", 2)).toBe("observing");
  });

  it("reaction: s1_b는 observing, s1_a는 alert, 결과 화면은 편안히 resting", () => {
    expect(r4DogPoseName("reaction", 1, "s1_b", 0)).toBe("observing");
    expect(r4DogPoseName("reaction", 1, "s1_a", 0)).toBe("alert");
    expect(r4DogPoseName("result", 3, null, 0)).toBe("resting");
    expect(r4DogPoseName("intro", 1, null, 0)).toBe("resting");
  });

  it("새싹2에서만 선배가 콩이 뒤에 겹치지 않도록 위치를 조정한다(다른 지점은 null)", () => {
    expect(r4SeniorOffset("choosing", 2)).toEqual([0.12, 0.22]);
    expect(r4SeniorOffset("reaction", 2)).toEqual([0.12, 0.22]);
    expect(r4SeniorOffset("choosing", 1)).toBeNull();
    expect(r4SeniorOffset("choosing", 3)).toBeNull();
    expect(r4SeniorOffset("intro", 2)).toBeNull();
  });
});

// ---------- G2.2-R4-A1-C1: 관찰 동작 순차 판정 ----------
import {
  OBSERVE_HOME,
  OBSERVE_SAFETY_MARGIN,
  OBSERVE_TARGET_RADIUS,
  createObserveGesture,
  distanceXY,
  observeStep,
} from "./r4Prototype";
import { vi } from "vitest";
import type { Vec3 } from "./sceneLayout";

describe("R4-A1-C1 — 머리·몸통 판정 영역 분리", () => {
  const [head, body] = OBSERVE_WAYPOINTS;

  it("머리·몸통 판정 영역이 겹치지 않고 안전 여백(0.05) 이상 떨어져 있다", () => {
    const dist = distanceXY(head, body);
    expect(dist).toBeGreaterThan(OBSERVE_TARGET_RADIUS * 2 + OBSERVE_SAFETY_MARGIN);
    expect(OBSERVE_SAFETY_MARGIN).toBeGreaterThanOrEqual(0.05);
    // 수정 후 수치: 중심 거리 0.658, 반경 합 0.58, 여백 0.078
    expect(dist).toBeCloseTo(0.658, 2);
    expect(dist - OBSERVE_TARGET_RADIUS * 2).toBeGreaterThanOrEqual(OBSERVE_SAFETY_MARGIN);
  });

  it("두 판정 반경은 모바일 44px 터치 영역을 넘는 크기다(약 78px/월드단위)", () => {
    expect(2 * OBSERVE_TARGET_RADIUS * 78).toBeGreaterThanOrEqual(44);
  });

  it("한 좌표가 머리와 몸통 판정을 동시에 만족할 수 없다(두 영역이 서로소)", () => {
    for (let t = 0; t <= 1; t += 0.01) {
      const p: Vec3 = [head[0] + (body[0] - head[0]) * t, head[1] + (body[1] - head[1]) * t, head[2]];
      expect(isNearTarget(p, head, OBSERVE_TARGET_RADIUS) && isNearTarget(p, body, OBSERVE_TARGET_RADIUS)).toBe(false);
    }
  });

  it("표시 링 위치 = 판정 좌표(OBSERVE_WAYPOINTS 상수를 R4ActionLayer가 그대로 사용)", () => {
    const layer = readFileSync(join(__dirname, "R4ActionLayer.tsx"), "utf8");
    expect(layer).toContain("OBSERVE_WAYPOINTS[0]");
    expect(layer).toContain("OBSERVE_WAYPOINTS[1]");
    expect(layer).toContain("radius={OBSERVE_TARGET_RADIUS}");
  });
});

describe("R4-A1-C1 — 출발 위치와 머리로 가는 경로", () => {
  it("출발 위치는 머리·몸통 판정 영역 밖이고, 출발→머리 직선 경로는 몸통 판정 영역을 지나지 않는다", () => {
    const [head, body] = OBSERVE_WAYPOINTS;
    expect(isNearTarget(OBSERVE_HOME, head, OBSERVE_TARGET_RADIUS)).toBe(false);
    expect(isNearTarget(OBSERVE_HOME, body, OBSERVE_TARGET_RADIUS)).toBe(false);
    for (let t = 0; t <= 1; t += 0.01) {
      const p: Vec3 = [OBSERVE_HOME[0] + (head[0] - OBSERVE_HOME[0]) * t, OBSERVE_HOME[1] + (head[1] - OBSERVE_HOME[1]) * t, head[2]];
      expect(isNearTarget(p, body, OBSERVE_TARGET_RADIUS)).toBe(false);
    }
  });
});

describe("R4-A1-C1 — 실제 pointer 입력 순서 재현", () => {
  const [head, body] = OBSERVE_WAYPOINTS;
  const HOME: Vec3 = OBSERVE_HOME;
  function nearHead(dx = 0.02, dy = 0.02): Vec3 {
    return [head[0] + dx, head[1] + dy, head[2]];
  }
  function setup() {
    const onProgress = vi.fn();
    const onComplete = vi.fn();
    return { gesture: createObserveGesture({ onProgress, onComplete }), onProgress, onComplete };
  }

  it("1) 몸통을 먼저 통과하면 진행도 0을 유지한다", () => {
    const { gesture, onComplete } = setup();
    gesture.move(HOME);
    gesture.move(body);
    gesture.move([body[0] + 0.02, body[1], body[2]]);
    expect(observeStep(gesture.progress)).toBe(0);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("2) 머리에 진입하면 진행도 1이고 중간 반응(onProgress 1)만 발생한다", () => {
    const { gesture, onProgress, onComplete } = setup();
    gesture.move(HOME);
    gesture.move(nearHead());
    expect(observeStep(gesture.progress)).toBe(1);
    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("3) 머리 좌표를 반복 입력해도 진행도 1을 유지한다", () => {
    const { gesture, onComplete } = setup();
    for (let i = 0; i < 30; i++) gesture.move(head);
    expect(observeStep(gesture.progress)).toBe(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("4·5) 머리 위치에서 작은 이동·흔들기를 해도 진행도 1을 유지하고 완료되지 않는다", () => {
    const { gesture, onComplete } = setup();
    gesture.move(head);
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 8;
      gesture.move([head[0] + Math.cos(a) * 0.15, head[1] + Math.sin(a) * 0.15, head[2]]);
    }
    expect(observeStep(gesture.progress)).toBe(1);
    expect(gesture.progress.leftHead).toBe(false);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("머리 영역 경계 안쪽 끝까지 움직여도(반경 0.29) 완료되지 않는다", () => {
    const { gesture, onComplete } = setup();
    gesture.move(head);
    gesture.move([head[0] - 0.28, head[1], head[2]]); // 몸통 방향 경계 안쪽(반경 0.29)
    expect(observeStep(gesture.progress)).toBe(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("6·7) 머리에서 몸통까지 실제로 이동하면 진행도 2, 완료 콜백이 정확히 한 번 호출된다", () => {
    const { gesture, onProgress, onComplete } = setup();
    gesture.move(HOME);
    gesture.move(nearHead());
    // 머리 → 몸통 직선 이동(드래그)
    for (let t = 0; t <= 1.0001; t += 0.1) {
      gesture.move([head[0] + (body[0] - head[0]) * t, head[1] + (body[1] - head[1]) * t, head[2]]);
    }
    expect(observeStep(gesture.progress)).toBe(2);
    expect(gesture.progress).toEqual({ head: true, leftHead: true, body: true });
    expect(onProgress.mock.calls.map((c) => c[0])).toEqual([1, 2]);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(gesture.done).toBe(true);
  });

  it("8) 완료 후 추가 pointer 이벤트·더블 입력에도 콜백이 중복 호출되지 않는다", () => {
    const { gesture, onProgress, onComplete } = setup();
    gesture.move(head);
    gesture.move(body);
    for (let i = 0; i < 10; i++) {
      gesture.move(body);
      gesture.move(head);
      gesture.move(body);
    }
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledTimes(2);
  });

  it("머리 진입 이벤트 하나로 몸통까지 통과하지 않는다(같은 pointer 위치로 연속 통과 불가)", () => {
    const { gesture, onComplete } = setup();
    // 같은 좌표를 두 번 보내도(머리) 몸통 단계로 넘어가지 않는다
    gesture.move(head);
    gesture.move(head);
    expect(observeStep(gesture.progress)).toBe(1);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
