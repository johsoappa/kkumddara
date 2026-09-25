// ====================================================
// r4Prototype.ts — 수의사 XR R4-A 프로토타입: 직접 조작 설정·순수 로직
//
// /xr/vet?mode=sprout&r4=1 에서만 쓰인다(기본 R3 흐름은 이 파일을 참조하지 않는다).
// choice ID·axis·문구는 scenario.ts 그대로이고, 이 파일은 "선택 후 짧은 3D 조작"의
// 좌표·판정·포즈 선택만 담는다. analytics 구조는 건드리지 않는다.
// ====================================================

import type { Mode } from "./scenario";
import type { HumanoidPoseName } from "./humanoidPose";
import type { Vec3 } from "./sceneLayout";

/** R4 조작이 붙는 choice — 새싹 1단계 두 개뿐이다(나머지 지점은 프로토타입 승인 후). */
export type R4ActionChoiceId = "s1_a" | "s1_b";

export function isR4ActionChoice(mode: Mode, point: number, choiceId: string): choiceId is R4ActionChoiceId {
  return mode === "sprout" && point === 1 && (choiceId === "s1_a" || choiceId === "s1_b");
}

export interface R4ActionCopy {
  /** action 패널 제목 */
  title: string;
  /** 사용자가 해야 할 조작 설명 */
  instruction: string;
  /** 접근성 대체 버튼 문구(드래그와 같은 결과를 만든다) */
  altLabel: string;
  /** 스크린리더 완료 안내 */
  doneAnnouncement: string;
}

export const R4_ACTION_COPY: Record<R4ActionChoiceId, R4ActionCopy> = {
  s1_a: {
    title: "보호자 이야기를 기록해요",
    instruction: "보호자 옆 말풍선을 끌어서 기록판의 '듣기 기록'에 놓아보세요.",
    altLabel: "보호자 이야기를 기록하기",
    doneAnnouncement: "보호자 이야기를 기록판에 적었어요.",
  },
  s1_b: {
    title: "콩이를 차례로 살펴봐요",
    instruction: "관찰 링을 콩이의 머리 쪽, 그다음 몸통·다리 쪽으로 차례로 끌어보세요.",
    altLabel: "콩이의 모습을 차례로 살펴보기",
    doneAnnouncement: "콩이의 머리와 몸통·다리를 차례로 살펴봤어요.",
  },
};

// ---------- 월드 좌표(조작 평면과 목표) ----------

/** s1_a: 말풍선 카드는 보호자 옆 z=-0.7 평면에서 움직인다. */
export const BUBBLE_PLANE_Z = -0.7;
export const BUBBLE_HOME: Vec3 = [-0.62, 1.42, BUBBLE_PLANE_Z];
/** 기록판의 '듣기 기록' 영역(기록판 윗부분). */
export const RECORD_TARGET: Vec3 = [-0.5, 0.98, BUBBLE_PLANE_Z];

/** s1_b: 관찰 링은 콩이 깊이(z=-0.85) 평면에서 움직인다. */
export const OBSERVE_PLANE_Z = -0.85;
/** 관찰 링 출발 위치 — 콩이 위쪽. 예전 위치(-0.6,0.95)는 머리로 가는 직선이 몸통 판정 영역을 지나가 머리 재진입 드래그만으로 몸통이 통과될 수 있었다. */
export const OBSERVE_HOME: Vec3 = [0.05, 1.4, OBSERVE_PLANE_Z];
/**
 * G2.2-R4-A1-C1: 머리·몸통 판정 영역이 겹치지 않는다.
 * 이전: 머리 [0.27,1.02] / 몸통 [0.0,0.8] → 중심 거리 0.348, 반경 0.3+0.3=0.6 → 크게 겹쳐
 *       머리 통과 직후 포인터를 조금만 움직여도 몸통이 통과됐다.
 * 이후: 머리 [0.40,1.02] / 몸통 [-0.22,0.80] → 중심 거리 0.658, 반경 0.29+0.29=0.58 → 여백 0.078.
 * 링에 그려지는 위치·반경도 이 상수를 그대로 쓴다(R4ActionLayer) — 표시와 판정이 일치한다.
 */
export const OBSERVE_WAYPOINTS: [Vec3, Vec3] = [
  [0.4, 1.02, OBSERVE_PLANE_Z], // 콩이 머리 쪽
  [-0.22, 0.8, OBSERVE_PLANE_Z], // 콩이 몸통·다리 쪽
];
/** 관찰 지점 판정 반경(월드) — 화면 지름 약 45px 이상으로 44px 터치 영역을 넘는다. */
export const OBSERVE_TARGET_RADIUS = 0.29;
/** 머리·몸통 판정 영역 사이 최소 안전 여백(월드). */
export const OBSERVE_SAFETY_MARGIN = 0.05;

/** 목표 판정 반경(월드) — 화면상 약 40~55px 지름으로 44px 터치 영역을 넘게 잡는다. */
export const TARGET_RADIUS = 0.3;

export function distanceXY(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function isNearTarget(point: Vec3, target: Vec3, radius = TARGET_RADIUS): boolean {
  return distanceXY(point, target) <= radius;
}

/** 관찰 링이 지나간 지점 기록 — 머리 진입 → 머리 영역 이탈 → 몸통 진입 순서로만 진행된다. */
export interface ObserveProgress {
  head: boolean;
  /** 머리 진입 후 링이 머리 판정 영역을 실제로 벗어났는가 */
  leftHead: boolean;
  body: boolean;
}

export const OBSERVE_INITIAL: ObserveProgress = { head: false, leftHead: false, body: false };

export function observeStep(progress: ObserveProgress): 0 | 1 | 2 {
  return progress.body ? 2 : progress.head ? 1 : 0;
}

export function advanceObserve(progress: ObserveProgress, point: Vec3): ObserveProgress {
  const inHead = isNearTarget(point, OBSERVE_WAYPOINTS[0], OBSERVE_TARGET_RADIUS);
  const inBody = isNearTarget(point, OBSERVE_WAYPOINTS[1], OBSERVE_TARGET_RADIUS);
  if (progress.body) return progress;
  if (!progress.head) {
    // 몸통을 먼저 지나가도 진행되지 않는다
    return inHead ? { head: true, leftHead: false, body: false } : progress;
  }
  let next = progress;
  if (!next.leftHead) {
    // 머리 위치에 머물거나 머리 안에서 흔드는 것으로는 다음 단계로 넘어갈 수 없다
    if (inHead) return progress;
    next = { ...next, leftHead: true };
  }
  if (inBody) return { head: true, leftHead: true, body: true };
  return next;
}

export function isObserveComplete(progress: ObserveProgress): boolean {
  return progress.head && progress.leftHead && progress.body;
}

export interface ObserveGesture {
  move: (point: Vec3) => ObserveProgress;
  readonly progress: ObserveProgress;
  readonly done: boolean;
}

/** 실제 pointer 입력 순서를 그대로 흘려보내는 관찰 제스처 — 단계 변화 때만 onProgress, 완료는 정확히 한 번만 onComplete. */
export function createObserveGesture(handlers: {
  onProgress?: (step: 1 | 2) => void;
  onComplete: () => void;
}): ObserveGesture {
  let progress = OBSERVE_INITIAL;
  let done = false;
  return {
    move(point) {
      if (done) return progress;
      const next = advanceObserve(progress, point);
      if (next === progress) return progress;
      const before = observeStep(progress);
      progress = next;
      const after = observeStep(progress);
      if (after !== before && after > 0) handlers.onProgress?.(after as 1 | 2);
      if (isObserveComplete(progress)) {
        done = true;
        handlers.onComplete();
      }
      return progress;
    },
    get progress() {
      return progress;
    },
    get done() {
      return done;
    },
  };
}

// ---------- 탭·드래그 구분 ----------

export const TAP_MAX_PX = 6;
export const DRAG_MIN_PX = 12;

export type PointerGesture = "tap" | "ambiguous" | "drag";

/** 이동량 6px 미만=탭, 12px 이상=드래그, 사이는 아무 동작도 하지 않는다(오선택 방지). */
export function classifyPointerGesture(movedPx: number): PointerGesture {
  if (movedPx < TAP_MAX_PX) return "tap";
  if (movedPx >= DRAG_MIN_PX) return "drag";
  return "ambiguous";
}

// ---------- 장면 회전(orbit) ----------

export const ORBIT_MAX_YAW = (15 * Math.PI) / 180;
/** 드래그 1px당 회전(rad). 화면 폭 절반 가량 드래그하면 최대각에 도달한다. */
export const ORBIT_RAD_PER_PX = 0.0035;

export function clampOrbitYaw(yaw: number): number {
  return Math.min(ORBIT_MAX_YAW, Math.max(-ORBIT_MAX_YAW, yaw));
}

/** 카메라 위치를 lookAt 중심으로 yaw만큼 돌린다(높이는 유지). */
export function orbitPosition(position: Vec3, lookAt: Vec3, yaw: number): Vec3 {
  const dx = position[0] - lookAt[0];
  const dz = position[2] - lookAt[2];
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  return [lookAt[0] + dx * cos + dz * sin, position[1], lookAt[2] - dx * sin + dz * cos];
}

// ---------- 포즈·기록판 상태 ----------

export interface R4PoseNames {
  guardian: HumanoidPoseName;
  senior: HumanoidPoseName;
}

/**
 * 단계별 사람 캐릭터 포즈. choiceId는 action 진행 중이거나 reaction 단계에서 방금 고른 choice.
 * intro/기본은 idle, 새싹1은 선택에 따라 보호자 이야기(listening)/선배 관찰(observing),
 * 새싹2·3과 결과는 기록(recording)·안내(explaining)·완료(complete) 포즈를 쓴다.
 */
export function r4PoseNames(
  phase: "intro" | "choosing" | "reaction" | "result",
  point: number,
  choiceId: string | null,
): R4PoseNames {
  if (phase === "intro") return { guardian: "idle", senior: "idle" };
  if (phase === "result") return { guardian: "complete", senior: "complete" };
  if (point === 2) return { guardian: "attentive", senior: "recording" };
  if (point === 3) return { guardian: "attentive", senior: "explaining" };
  if (choiceId === "s1_a") return { guardian: "listening", senior: "attentive" };
  if (choiceId === "s1_b") return { guardian: "attentive", senior: "observing" };
  return { guardian: "idle", senior: "idle" };
}

/** 새싹1 reaction에서 기록판에 실제로 추가되는 줄 수(듣기 기록 1줄 / 관찰 표시 2개). */
export function r4ClipboardRows(phase: string, point: number, choiceId: string | null): number | null {
  if (point !== 1 || phase !== "reaction") return null;
  if (choiceId === "s1_a") return 1;
  if (choiceId === "s1_b") return 2;
  return null;
}

// ====================================================
// G2.2-R4-A1 — 콩이(강아지) 자세·관찰 반응 / 새싹2 겹침 보정
// ====================================================

export type DogPoseName = "resting" | "alert" | "observing";

/** 콩이 관절 값. headPitch: 아래(+)·위(-), headYaw: 카메라 쪽(-)/반대(+), earPerk 0=늘어짐 1=쫑긋,
 *  tailWag 0=정지 1=크게 흔듦, pawLift: 앞발 들기, legFold 1=엎드려 다리를 접음. */
export interface DogPose {
  bodyY: number;
  bodyScaleY: number;
  legFold: number;
  headPitch: number;
  headYaw: number;
  earPerk: number;
  tailWag: number;
  pawLift: number;
}

export const DOG_POSES: Record<DogPoseName, DogPose> = {
  // 평소보다 조용한 자세: 엎드려 다리를 접고 고개를 낮춘다
  resting: { bodyY: -0.09, bodyScaleY: 0.72, legFold: 1, headPitch: 0.4, headYaw: 0, earPerk: 0, tailWag: 0, pawLift: 0 },
  // 고개를 들고 카메라 쪽을 본다
  alert: { bodyY: 0, bodyScaleY: 0.8, legFold: 0, headPitch: -0.12, headYaw: -0.5, earPerk: 0.6, tailWag: 0.25, pawLift: 0 },
  // 관찰 중: 귀를 쫑긋 세우고 꼬리를 흔들며 앞발을 살짝 든다
  observing: { bodyY: 0, bodyScaleY: 0.8, legFold: 0, headPitch: -0.2, headYaw: -0.7, earPerk: 1, tailWag: 1, pawLift: 1 },
};

function lerpN(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpDogPose(a: DogPose, b: DogPose, t: number): DogPose {
  const k = Math.min(1, Math.max(0, t));
  return {
    bodyY: lerpN(a.bodyY, b.bodyY, k),
    bodyScaleY: lerpN(a.bodyScaleY, b.bodyScaleY, k),
    legFold: lerpN(a.legFold, b.legFold, k),
    headPitch: lerpN(a.headPitch, b.headPitch, k),
    headYaw: lerpN(a.headYaw, b.headYaw, k),
    earPerk: lerpN(a.earPerk, b.earPerk, k),
    tailWag: lerpN(a.tailWag, b.tailWag, k),
    pawLift: lerpN(a.pawLift, b.pawLift, k),
  };
}

/**
 * 콩이 자세 선택. observeStep은 s1_b 관찰 링이 지나간 지점 수(0=아직, 1=머리, 2=머리+몸통).
 * 진행 중에도 링이 머리를 지나면 고개를 들고, 몸통까지 지나면 귀·꼬리·앞발로 반응한다.
 */
export function r4DogPoseName(
  phase: "intro" | "choosing" | "reaction" | "result",
  point: number,
  choiceId: string | null,
  observeStep: number,
): DogPoseName {
  if (phase === "result") return "resting";
  if (point === 1) {
    if (phase === "reaction") return choiceId === "s1_b" ? "observing" : choiceId === "s1_a" ? "alert" : "resting";
    if (observeStep >= 2) return "observing";
    if (observeStep === 1) return "alert";
    return "resting";
  }
  if (point === 2) return "alert";
  return "resting";
}

/** 새싹2: 선배가 기록 자세로 몸을 숙일 때 머리가 콩이 뒤에 겹치지 않도록 진찰대에서 조금 떨어져 선다. */
export function r4SeniorOffset(phase: string, point: number): [number, number] | null {
  if (point === 2 && (phase === "choosing" || phase === "reaction")) return [0.12, 0.22];
  return null;
}
