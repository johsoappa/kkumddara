import { describe, expect, it, vi } from "vitest";
import {
  advanceOrderedPath,
  attemptMatchTarget,
  attemptPlaceMultiSource,
  attemptPlaceOrderedSlot,
  createDragToTargetGesture,
  createOrderedPathGesture,
  isMatchTargetComplete,
  isMultiSourceComplete,
  isOrderedPathComplete,
  isOrderedSlotsComplete,
  matchTargetInitial,
  multiSourceInitial,
  orderedPathInitial,
  orderedSlotsInitial,
} from "./r4ActionState";
import type { Vec3 } from "./sceneLayout";

// G2.2-R4-B: 6종 공용 조작 유형의 판정 로직 — WebGL 없는 환경에서 진행 순서·오답
// 처리·중복 완료 방지·초기화·목표 영역 충돌·완료 콜백 횟수를 전수 검증한다.

describe("drag-to-target", () => {
  const target: Vec3 = [1, 1, 0];

  it("반경 안에 들어오면 완료 콜백이 정확히 한 번 호출된다", () => {
    const onComplete = vi.fn();
    const gesture = createDragToTargetGesture(target, 0.3, onComplete);
    expect(gesture.drop([2, 2, 0])).toBe(false); // 반경 밖
    expect(onComplete).not.toHaveBeenCalled();
    expect(gesture.drop([1.1, 1.05, 0])).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(gesture.done).toBe(true);
    // 완료 후 추가 drop은 무시된다(중복 방지)
    expect(gesture.drop([1, 1, 0])).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("초기화 — 새 gesture 인스턴스는 이전 상태를 공유하지 않는다", () => {
    const a = createDragToTargetGesture(target, 0.3, vi.fn());
    a.drop([1, 1, 0]);
    const b = createDragToTargetGesture(target, 0.3, vi.fn());
    expect(b.done).toBe(false);
  });
});

describe("ordered-path / review-path — 진행 순서", () => {
  const waypoints: Vec3[] = [
    [0, 0, 0],
    [1, 0, 0],
    [2, 0, 0],
  ];
  const radius = 0.3;

  it("순서대로 지나가면 진행되고, 역순·건너뛰기·제자리 맴돌기는 진행되지 않는다", () => {
    let progress = orderedPathInitial();
    // 2번째 지점을 먼저 지나가도 무시된다(0번째부터 시작)
    progress = advanceOrderedPath(progress, waypoints[1], waypoints, radius);
    expect(progress.visited).toBe(0);
    progress = advanceOrderedPath(progress, waypoints[0], waypoints, radius);
    expect(progress.visited).toBe(1);
    // 0번째 자리에 머물러도 진행되지 않는다(벗어나야 함)
    progress = advanceOrderedPath(progress, waypoints[0], waypoints, radius);
    expect(progress.visited).toBe(1);
    // 1번째를 건너뛰고 바로 2번째로 가면(1번째 근처를 지나지 않음) 진행되지 않는다 — 다음
    // 기대 지점은 여전히 1번째다.
    progress = advanceOrderedPath(progress, waypoints[2], waypoints, radius);
    expect(progress.visited).toBe(1);
    // 이후 실제로 1번째를 지나가면 정상적으로 다음 단계로 진행된다.
    progress = advanceOrderedPath(progress, waypoints[1], waypoints, radius);
    expect(progress.visited).toBe(2);
  });

  it("정상 진행: 0→1→2 순서로 지나가면 완료된다", () => {
    let progress = orderedPathInitial();
    progress = advanceOrderedPath(progress, waypoints[0], waypoints, radius);
    progress = advanceOrderedPath(progress, [5, 5, 0], waypoints, radius); // 벗어남
    progress = advanceOrderedPath(progress, waypoints[1], waypoints, radius);
    expect(progress.visited).toBe(2);
    progress = advanceOrderedPath(progress, [5, 5, 0], waypoints, radius);
    progress = advanceOrderedPath(progress, waypoints[2], waypoints, radius);
    expect(isOrderedPathComplete(progress, waypoints.length)).toBe(true);
  });

  it("완료 후에는 상태가 바뀌지 않는다", () => {
    const complete = { visited: 3, left: false };
    const next = advanceOrderedPath(complete, waypoints[0], waypoints, radius);
    expect(next).toBe(complete);
  });

  it("gesture: onProgress는 단계 변화 때만, onComplete는 정확히 한 번만 호출된다", () => {
    const onProgress = vi.fn();
    const onComplete = vi.fn();
    const gesture = createOrderedPathGesture(waypoints, radius, { onProgress, onComplete });
    gesture.move(waypoints[0]);
    gesture.move(waypoints[0]); // 같은 지점 반복 — onProgress 추가 호출 없음
    expect(onProgress).toHaveBeenCalledTimes(1);
    gesture.move([5, 5, 0]);
    gesture.move(waypoints[1]);
    expect(onProgress).toHaveBeenCalledTimes(2);
    gesture.move([5, 5, 0]);
    gesture.move(waypoints[2]);
    expect(onComplete).toHaveBeenCalledTimes(1);
    // 완료 후 추가 입력에도 콜백 중복 없음
    gesture.move(waypoints[0]);
    gesture.move(waypoints[2]);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(gesture.done).toBe(true);
  });

  it("목표 영역이 겹치지 않으면(중심거리 > 2*radius) 한 좌표가 두 지점을 동시에 만족할 수 없다", () => {
    const [a, b] = waypoints;
    const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
    expect(dist).toBeGreaterThan(radius * 2);
  });
});

describe("ordered-slots — 카드 순서 배치", () => {
  it("정해진 순서(0→1→2)로만 받아들여지고, 순서가 틀리면 원위치(비수락) 처리된다", () => {
    const total = 3;
    let state = orderedSlotsInitial();
    // 1번 슬롯 카드를 먼저 놓으면 거부된다
    let result = attemptPlaceOrderedSlot(state, 1, total);
    expect(result.accepted).toBe(false);
    expect(result.state).toBe(state); // 상태 불변
    result = attemptPlaceOrderedSlot(state, 0, total);
    expect(result.accepted).toBe(true);
    state = result.state;
    expect(state.filled).toBe(1);
    // 0번 카드를 또 놓아도(이미 채움) 거부된다
    result = attemptPlaceOrderedSlot(state, 0, total);
    expect(result.accepted).toBe(false);
    result = attemptPlaceOrderedSlot(state, 1, total);
    expect(result.accepted).toBe(true);
    state = result.state;
    result = attemptPlaceOrderedSlot(state, 2, total);
    expect(result.accepted).toBe(true);
    state = result.state;
    expect(isOrderedSlotsComplete(state, total)).toBe(true);
  });

  it("완료 후 추가 시도는 항상 거부된다(완료 콜백 중복 방지 전제)", () => {
    const total = 1;
    let state = orderedSlotsInitial();
    state = attemptPlaceOrderedSlot(state, 0, total).state;
    expect(isOrderedSlotsComplete(state, total)).toBe(true);
    const result = attemptPlaceOrderedSlot(state, 0, total);
    expect(result.accepted).toBe(false);
  });

  it("취소·초기화 후 다시 시작할 수 있다(새 초기 상태)", () => {
    let state = orderedSlotsInitial();
    state = attemptPlaceOrderedSlot(state, 0, 2).state;
    const fresh = orderedSlotsInitial();
    expect(fresh.filled).toBe(0);
    expect(state.filled).toBe(1); // 기존 상태와 독립적
  });
});

describe("multi-source — 서로 다른 소스를 공통 영역으로", () => {
  it("순서와 무관하게 전부 놓이면 완료되고, 이미 놓은 소스는 멱등이다", () => {
    let state = multiSourceInitial(2);
    expect(isMultiSourceComplete(state)).toBe(false);
    state = attemptPlaceMultiSource(state, 1); // 순서 무관 — 두 번째 소스부터 놓아도 된다
    expect(state.placed).toEqual([false, true]);
    const before = state;
    state = attemptPlaceMultiSource(state, 1); // 중복 — 상태 불변(멱등)
    expect(state).toBe(before);
    state = attemptPlaceMultiSource(state, 0);
    expect(isMultiSourceComplete(state)).toBe(true);
  });

  it("하나만 놓인 상태에서는 완료되지 않는다", () => {
    const state = attemptPlaceMultiSource(multiSourceInitial(2), 0);
    expect(isMultiSourceComplete(state)).toBe(false);
  });
});

describe("match-target — 토큰별 지정된 목표", () => {
  it("맞는 목표면 받아들여지고, 틀린 목표면 원위치(비수락) 처리된다", () => {
    let state = matchTargetInitial(2);
    // 토큰0의 정답은 targetIndex 0인데 1에 놓으면 거부
    let result = attemptMatchTarget(state, 0, 1, 0);
    expect(result.accepted).toBe(false);
    expect(result.state).toBe(state);
    result = attemptMatchTarget(state, 0, 0, 0);
    expect(result.accepted).toBe(true);
    state = result.state;
    expect(state.matched).toEqual([true, false]);
    result = attemptMatchTarget(state, 1, 1, 1);
    expect(result.accepted).toBe(true);
    state = result.state;
    expect(isMatchTargetComplete(state)).toBe(true);
  });

  it("이미 매칭된 토큰은 다시 놓아도 상태가 바뀌지 않는다", () => {
    let state = matchTargetInitial(1);
    state = attemptMatchTarget(state, 0, 0, 0).state;
    const result = attemptMatchTarget(state, 0, 0, 0);
    expect(result.accepted).toBe(false);
    expect(result.state).toBe(state);
  });

  it("완료 콜백은 마지막 토큰이 매칭되는 시점에만 true가 된다", () => {
    let state = matchTargetInitial(3);
    state = attemptMatchTarget(state, 0, 0, 0).state;
    expect(isMatchTargetComplete(state)).toBe(false);
    state = attemptMatchTarget(state, 1, 1, 1).state;
    expect(isMatchTargetComplete(state)).toBe(false);
    state = attemptMatchTarget(state, 2, 2, 2).state;
    expect(isMatchTargetComplete(state)).toBe(true);
  });
});
