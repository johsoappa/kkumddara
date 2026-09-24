// ====================================================
// humanoidPose.ts — 수의사 XR R4 프로토타입: 관절 기반 포즈 데이터 (순수 데이터)
//
// VetHumanoid.tsx(절차형 사람 리그)가 이 값을 관절(몸통·머리·양팔·양다리) 각도로
// 그대로 적용한다. 캐릭터 전체를 한 덩어리로 돌리는 대신 관절별로 자세가 달라진다.
// 단위: 라디안. 양수 방향 규약(캐릭터 앞=+z, 캐릭터의 왼쪽=+x):
//   - torsoYaw: 상체 좌우 비틀기, torsoLean: 앞으로 숙임(+)
//   - headYaw: 시선 좌우, headPitch: 아래를 봄(+)
//   - arm.fwd: 팔을 앞으로 듦(+), arm.abd: 몸에서 바깥으로 벌림(+), arm.elbow: 팔꿈치 굽힘(+)
//   - leg.fwd: 다리를 앞으로(+), leg.abd: 바깥으로 벌림(+), leg.knee: 무릎 굽힘(+)
// ====================================================

export interface ArmJoint {
  fwd: number;
  abd: number;
  elbow: number;
}

export interface LegJoint {
  fwd: number;
  abd: number;
  knee: number;
}

export interface HumanoidPose {
  torsoYaw: number;
  torsoLean: number;
  headYaw: number;
  headPitch: number;
  armL: ArmJoint;
  armR: ArmJoint;
  legL: LegJoint;
  legR: LegJoint;
}

export type HumanoidPoseName =
  | "idle"
  | "attentive"
  | "listening"
  | "observing"
  | "recording"
  | "explaining"
  | "complete";

const IDLE: HumanoidPose = {
  torsoYaw: 0,
  torsoLean: 0.02,
  headYaw: 0,
  headPitch: 0.05,
  armL: { fwd: 0.06, abd: 0.22, elbow: 0.18 },
  armR: { fwd: 0.06, abd: 0.22, elbow: 0.18 },
  legL: { fwd: 0, abd: 0.07, knee: 0.02 },
  legR: { fwd: 0, abd: 0.07, knee: 0.02 },
};

function pose(overrides: Partial<HumanoidPose>): HumanoidPose {
  return { ...IDLE, ...overrides };
}

export const HUMANOID_POSES: Record<HumanoidPoseName, HumanoidPose> = {
  idle: IDLE,
  // 상대를 바라보며 듣는 자세: 고개를 돌리고 한 손을 살짝 든다
  attentive: pose({
    torsoYaw: 0.15,
    torsoLean: 0.06,
    headYaw: 0.35,
    headPitch: -0.05,
    armR: { fwd: 0.3, abd: 0.2, elbow: 0.55 },
  }),
  // 보호자가 이야기하는 자세: 한 손은 앞으로 내밀고 다른 손은 가슴 앞
  listening: pose({
    torsoYaw: -0.1,
    torsoLean: 0.04,
    headYaw: -0.15,
    headPitch: -0.12,
    armR: { fwd: 1.0, abd: 0.25, elbow: 0.9 },
    armL: { fwd: 0.7, abd: -0.1, elbow: 1.7 },
    legR: { fwd: 0.12, abd: 0.07, knee: 0.08 },
  }),
  // 선배가 진찰대 쪽으로 팔을 뻗어 살피는 자세
  observing: pose({
    torsoYaw: 0.1,
    torsoLean: 0.3,
    headYaw: 0.25,
    headPitch: 0.5,
    armR: { fwd: 1.2, abd: 0.1, elbow: 0.2 },
    armL: { fwd: 0.3, abd: 0.2, elbow: 0.5 },
    legL: { fwd: -0.15, abd: 0.07, knee: 0.05 },
    legR: { fwd: 0.25, abd: 0.07, knee: 0.2 },
  }),
  // 한 손으로 기록판을 받치고 다른 손으로 적는 자세
  recording: pose({
    torsoYaw: 0.1,
    torsoLean: 0.2,
    headPitch: 0.45,
    armL: { fwd: 0.9, abd: 0.05, elbow: 1.4 },
    armR: { fwd: 1.1, abd: 0.1, elbow: 1.7 },
  }),
  // 손바닥을 펴서 안내하는 자세
  explaining: pose({
    torsoYaw: 0.2,
    torsoLean: 0.1,
    headYaw: 0.3,
    armR: { fwd: 0.8, abd: 0.6, elbow: 0.5 },
    armL: { fwd: 0.3, abd: 0.3, elbow: 0.6 },
  }),
  // 상담을 마친 자세: 서로를 바라보고 가볍게 고개를 끄덕인다
  complete: pose({
    torsoYaw: 0.1,
    torsoLean: 0.05,
    headYaw: 0.4,
    headPitch: -0.1,
    armR: { fwd: 0.6, abd: 0.35, elbow: 0.7 },
  }),
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpArm(a: ArmJoint, b: ArmJoint, t: number): ArmJoint {
  return { fwd: lerp(a.fwd, b.fwd, t), abd: lerp(a.abd, b.abd, t), elbow: lerp(a.elbow, b.elbow, t) };
}

function lerpLeg(a: LegJoint, b: LegJoint, t: number): LegJoint {
  return { fwd: lerp(a.fwd, b.fwd, t), abd: lerp(a.abd, b.abd, t), knee: lerp(a.knee, b.knee, t) };
}

/** 두 포즈를 t(0~1)로 보간한다 — 전환 애니메이션과 reduced-motion(t=1)에 공통으로 쓴다. */
export function lerpPose(a: HumanoidPose, b: HumanoidPose, t: number): HumanoidPose {
  const k = Math.min(1, Math.max(0, t));
  return {
    torsoYaw: lerp(a.torsoYaw, b.torsoYaw, k),
    torsoLean: lerp(a.torsoLean, b.torsoLean, k),
    headYaw: lerp(a.headYaw, b.headYaw, k),
    headPitch: lerp(a.headPitch, b.headPitch, k),
    armL: lerpArm(a.armL, b.armL, k),
    armR: lerpArm(a.armR, b.armR, k),
    legL: lerpLeg(a.legL, b.legL, k),
    legR: lerpLeg(a.legR, b.legR, k),
  };
}

export type PoseCategory = "trunk" | "head" | "armL" | "armR" | "legL" | "legR";

function armDiff(a: ArmJoint, b: ArmJoint): number {
  return Math.max(Math.abs(a.fwd - b.fwd), Math.abs(a.abd - b.abd), Math.abs(a.elbow - b.elbow));
}

function legDiff(a: LegJoint, b: LegJoint): number {
  return Math.max(Math.abs(a.fwd - b.fwd), Math.abs(a.abd - b.abd), Math.abs(a.knee - b.knee));
}

/** 두 포즈 사이에서 threshold(rad) 이상 달라진 신체 부위 목록 — 포즈 구분 테스트에 쓴다. */
export function changedCategories(a: HumanoidPose, b: HumanoidPose, threshold = 0.15): PoseCategory[] {
  const out: PoseCategory[] = [];
  if (Math.max(Math.abs(a.torsoYaw - b.torsoYaw), Math.abs(a.torsoLean - b.torsoLean)) >= threshold) out.push("trunk");
  if (Math.max(Math.abs(a.headYaw - b.headYaw), Math.abs(a.headPitch - b.headPitch)) >= threshold) out.push("head");
  if (armDiff(a.armL, b.armL) >= threshold) out.push("armL");
  if (armDiff(a.armR, b.armR) >= threshold) out.push("armR");
  if (legDiff(a.legL, b.legL) >= threshold) out.push("legL");
  if (legDiff(a.legR, b.legR) >= threshold) out.push("legR");
  return out;
}
