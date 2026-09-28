// ====================================================
// r4ActionState.ts — 수의사 XR R4-B: 공용 직접 조작 상태 전이 (순수 함수)
//
// G2.2-R4-B: 새싹2·3 / 나침반1~5 전체 21개 choice에 붙는 직접 조작을 6종의
// 재사용 가능한 조작 유형으로 일반화한다. 이 파일은 React/Three.js에
// 의존하지 않는 순수 데이터·함수만 담는다(scenario.ts/sceneLayout.ts와
// 동일한 설계 원칙). WebGL 없는 테스트 환경에서도 진행 순서·오답 처리·
// 중복 완료 방지·초기화·완료 콜백 횟수를 전부 검증할 수 있다.
//
// r4Prototype.ts의 기존 관찰 판정(advanceObserve 등, s1_b 전용)은 승인된
// 동작이라 건드리지 않는다 — 여기 orderedPath가 같은 원리를 N개 지점으로
// 일반화하지만 별도 구현이다(새싹1 s1_b는 기존 구현을 그대로 쓴다).
//
// 6종 매핑:
//   drag-to-target → createDragToTargetGesture
//   ordered-path    → createOrderedPathGesture (2개 지점이면 s1_b와 동등)
//   review-path     → createOrderedPathGesture (같은 로직의 별칭 — 순서대로
//                      "확인"하는 동작도 결국 지점을 순서대로 지나가는 것과 같다)
//   ordered-slots   → createOrderedSlotsState
//   multi-source     → createMultiSourceState
//   match-target    → createMatchTargetState
// ====================================================

import type { Vec3 } from "./sceneLayout";
import { distanceXY, isNearTarget, TARGET_RADIUS } from "./r4Prototype";

export { distanceXY, isNearTarget, TARGET_RADIUS };

// ---------- drag-to-target ----------

export interface DragToTargetGesture {
  /** point가 target 반경 안이면 완료 처리하고 true를 반환한다(이미 완료면 항상 false). */
  drop: (point: Vec3) => boolean;
  readonly done: boolean;
}

/** 카드 하나를 목표 한 곳으로 끄는 가장 단순한 조작 — BubbleAction과 동일한 원리를 일반화했다. */
export function createDragToTargetGesture(
  target: Vec3,
  radius: number,
  onComplete: () => void,
): DragToTargetGesture {
  let done = false;
  return {
    drop(point) {
      if (done) return false;
      if (!isNearTarget(point, target, radius)) return false;
      done = true;
      onComplete();
      return true;
    },
    get done() {
      return done;
    },
  };
}

// ---------- ordered-path / review-path ----------

export interface OrderedPathProgress {
  /** 성공적으로 지나간 지점 수(0..N). */
  visited: number;
  /** 마지막으로 지나간 지점 영역을 실제로 벗어났는가 — 벗어나야 다음 지점 진입이 인정된다. */
  left: boolean;
}

export function orderedPathInitial(): OrderedPathProgress {
  return { visited: 0, left: false };
}

export function orderedPathStep(progress: OrderedPathProgress): number {
  return progress.visited;
}

export function isOrderedPathComplete(progress: OrderedPathProgress, total: number): boolean {
  return progress.visited >= total;
}

/**
 * waypoints를 순서대로만 지나가야 진행되는 판정 — r4Prototype.ts의
 * advanceObserve(2지점 전용)를 N지점으로 일반화한 것이다. 규칙:
 *  - 0번째 지점은 아무 때나 진입하면 인정된다(단, 다른 지점을 먼저 지나가도 무시).
 *  - 이후 지점은 "직전 지점 영역을 벗어난 다음" 지점에 들어와야 인정된다
 *    (같은 자리에서 머물거나 흔드는 것만으로는 진행되지 않는다).
 *  - 이미 완료된 뒤에는 변하지 않는다.
 */
export function advanceOrderedPath(
  progress: OrderedPathProgress,
  point: Vec3,
  waypoints: Vec3[],
  radius: number,
): OrderedPathProgress {
  const total = waypoints.length;
  if (progress.visited >= total) return progress;
  if (progress.visited === 0 && !progress.left) {
    return isNearTarget(point, waypoints[0], radius) ? { visited: 1, left: false } : progress;
  }
  const currentWaypoint = waypoints[progress.visited - 1];
  if (!progress.left) {
    if (isNearTarget(point, currentWaypoint, radius)) return progress; // 같은 지점에 머무름
    return advanceOrderedPath({ ...progress, left: true }, point, waypoints, radius);
  }
  const nextWaypoint = waypoints[progress.visited];
  if (nextWaypoint && isNearTarget(point, nextWaypoint, radius)) {
    return { visited: progress.visited + 1, left: false };
  }
  return progress;
}

export interface OrderedPathGesture {
  move: (point: Vec3) => OrderedPathProgress;
  readonly progress: OrderedPathProgress;
  readonly done: boolean;
}

/** 실제 pointer 이동을 그대로 흘려보내는 순서 지점 제스처 — 단계 변화 때만 onProgress,
 *  완료는 정확히 한 번만 onComplete(review-path도 같은 함수를 쓴다). */
export function createOrderedPathGesture(
  waypoints: Vec3[],
  radius: number,
  handlers: { onProgress?: (visited: number) => void; onComplete: () => void },
): OrderedPathGesture {
  let progress = orderedPathInitial();
  let done = false;
  return {
    move(point) {
      if (done) return progress;
      const next = advanceOrderedPath(progress, point, waypoints, radius);
      if (next === progress) return progress;
      const before = orderedPathStep(progress);
      progress = next;
      const after = orderedPathStep(progress);
      if (after !== before && after > 0) handlers.onProgress?.(after);
      if (isOrderedPathComplete(progress, waypoints.length)) {
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

/** review-path는 ordered-path와 판정 원리가 같다(지점을 순서대로 "확인"한다) — 별칭으로 노출한다. */
export const createReviewPathGesture = createOrderedPathGesture;
export const advanceReviewPath = advanceOrderedPath;

// ---------- ordered-slots ----------

export interface OrderedSlotsState {
  /** 순서대로 채워진 슬롯 수(0..total). */
  filled: number;
}

export function orderedSlotsInitial(): OrderedSlotsState {
  return { filled: 0 };
}

export interface OrderedSlotsResult {
  state: OrderedSlotsState;
  /** 이번 시도가 받아들여졌는가 — false면 카드가 원위치로 돌아가야 한다. */
  accepted: boolean;
}

/**
 * 카드 여러 장을 정해진 순서(슬롯 0→1→2...)로만 놓을 수 있는 판정.
 * cardCorrectSlot: 지금 놓으려는 카드가 원래 배정된 슬롯 번호.
 * 슬롯은 항상 왼쪽(0번)부터 순서대로 채워져야 한다 — cardCorrectSlot이
 * 지금까지 채운 수(filled)와 정확히 같을 때만 그 카드가 받아들여진다.
 * 이미 완료됐거나 순서가 맞지 않으면 상태가 바뀌지 않고 accepted=false다
 * (호출부가 카드를 원위치로 돌려보낸다).
 */
export function attemptPlaceOrderedSlot(
  state: OrderedSlotsState,
  cardCorrectSlot: number,
  total: number,
): OrderedSlotsResult {
  if (state.filled >= total) return { state, accepted: false };
  if (cardCorrectSlot !== state.filled) return { state, accepted: false };
  return { state: { filled: state.filled + 1 }, accepted: true };
}

export function isOrderedSlotsComplete(state: OrderedSlotsState, total: number): boolean {
  return state.filled >= total;
}

// ---------- multi-source ----------

export interface MultiSourceState {
  /** 소스별 배치 완료 여부 — 인덱스는 소스 정의 배열과 같은 순서. */
  placed: boolean[];
}

export function multiSourceInitial(total: number): MultiSourceState {
  return { placed: new Array(total).fill(false) };
}

/** 서로 다른 소스 두 개(이상)를 공통 영역 하나로 모으는 판정 — 순서는 상관없고
 *  전부 놓여야 완료된다. 이미 놓인 소스를 다시 놓아도 상태가 바뀌지 않는다(멱등). */
export function attemptPlaceMultiSource(state: MultiSourceState, sourceIndex: number): MultiSourceState {
  if (state.placed[sourceIndex]) return state;
  const placed = [...state.placed];
  placed[sourceIndex] = true;
  return { placed };
}

export function isMultiSourceComplete(state: MultiSourceState): boolean {
  return state.placed.every(Boolean);
}

// ---------- match-target ----------

export interface MatchTargetState {
  /** 토큰별 매칭 완료 여부. */
  matched: boolean[];
}

export function matchTargetInitial(total: number): MatchTargetState {
  return { matched: new Array(total).fill(false) };
}

export interface MatchTargetResult {
  state: MatchTargetState;
  accepted: boolean;
}

/**
 * 토큰마다 정해진 목표가 따로 있는 판정(표시·카드를 맞는 대상/행에 배치).
 * droppedTargetIndex가 tokenCorrectTargetIndex와 같을 때만 받아들여진다 —
 * 다르면 원위치로 돌아가야 한다(accepted=false, 상태 불변). 이미 매칭된
 * 토큰을 다시 놓아도 상태가 바뀌지 않는다.
 */
export function attemptMatchTarget(
  state: MatchTargetState,
  tokenIndex: number,
  droppedTargetIndex: number,
  tokenCorrectTargetIndex: number,
): MatchTargetResult {
  if (state.matched[tokenIndex]) return { state, accepted: false };
  if (droppedTargetIndex !== tokenCorrectTargetIndex) return { state, accepted: false };
  const matched = [...state.matched];
  matched[tokenIndex] = true;
  return { state: { matched }, accepted: true };
}

export function isMatchTargetComplete(state: MatchTargetState): boolean {
  return state.matched.every(Boolean);
}
