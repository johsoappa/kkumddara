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
export const OBSERVE_HOME: Vec3 = [-0.6, 0.95, OBSERVE_PLANE_Z];
export const OBSERVE_WAYPOINTS: [Vec3, Vec3] = [
  [0.27, 1.02, OBSERVE_PLANE_Z], // 콩이 머리 쪽
  [0.0, 0.8, OBSERVE_PLANE_Z], // 콩이 몸통·다리 쪽
];

/** 목표 판정 반경(월드) — 화면상 약 40~55px 지름으로 44px 터치 영역을 넘게 잡는다. */
export const TARGET_RADIUS = 0.3;

export function distanceXY(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function isNearTarget(point: Vec3, target: Vec3, radius = TARGET_RADIUS): boolean {
  return distanceXY(point, target) <= radius;
}

/** 관찰 링이 지나간 지점 기록 — 머리 → 몸통 순서로만 진행된다. */
export interface ObserveProgress {
  head: boolean;
  body: boolean;
}

export const OBSERVE_INITIAL: ObserveProgress = { head: false, body: false };

export function advanceObserve(progress: ObserveProgress, point: Vec3): ObserveProgress {
  if (!progress.head) {
    return isNearTarget(point, OBSERVE_WAYPOINTS[0]) ? { head: true, body: false } : progress;
  }
  if (!progress.body && isNearTarget(point, OBSERVE_WAYPOINTS[1])) {
    return { head: true, body: true };
  }
  return progress;
}

export function isObserveComplete(progress: ObserveProgress): boolean {
  return progress.head && progress.body;
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
