"use client";

// ====================================================
// R4ActionLayer — R4 프로토타입: Canvas 안 직접 조작 + 장면 좌우 회전 (G2.2-R4-A, 신규)
//
// Canvas(R3F) 내부에서만 렌더된다. HTML 카드가 장면 밖에서 움직이지 않고, 말풍선 카드·관찰
// 링이 3D 오브젝트로 장면 안에서 움직인다. 새 물리 엔진/드래그 라이브러리는 없다 — R3F
// pointer event(setPointerCapture)와 카메라 광선-평면 교차만 쓴다.
//
// 입력 충돌 방지:
//  - 토큰(말풍선/링)을 잡고 있는 동안 tokenActive=true → 장면 회전(orbit)은 무시된다.
//  - 장면 회전은 이동 12px 이상 + 가로 이동이 세로보다 클 때만 시작한다(6~12px는 무동작).
//  - 오브젝트 탭은 TapHitBox(release 모드)가 pointerup + 이동 6px 미만에서만 처리한다.
//  - 완료는 onComplete를 한 번만 호출한다(done ref).
// ====================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Plane, Vector3 } from "three";
import type { Group } from "three";
import {
  BUBBLE_HOME,
  BUBBLE_PLANE_Z,
  OBSERVE_HOME,
  OBSERVE_INITIAL,
  OBSERVE_PLANE_Z,
  OBSERVE_TARGET_RADIUS,
  OBSERVE_WAYPOINTS,
  ORBIT_RAD_PER_PX,
  RECORD_TARGET,
  createObserveGesture,
  classifyPointerGesture,
  clampOrbitYaw,
  isNearTarget,
  distanceXY,
  type ObserveProgress,
} from "./r4Prototype";
import {
  getR4ActionDefinition,
  type DragToTargetGeometry,
  type MatchTargetGeometry,
  type MultiSourceGeometry,
  type OrderedSlotsGeometry,
  type PathGeometry,
  type R4ActionChoiceId,
} from "./r4ActionDefinitions";
import {
  attemptMatchTarget,
  attemptPlaceMultiSource,
  attemptPlaceOrderedSlot,
  createOrderedPathGesture,
  isMatchTargetComplete,
  isMultiSourceComplete,
  isOrderedSlotsComplete,
  multiSourceInitial,
  matchTargetInitial,
  orderedSlotsInitial,
} from "./r4ActionState";
import type { Vec3 } from "./sceneLayout";

function reducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

function capture(event: ThreeEvent<PointerEvent>) {
  try {
    (event.target as unknown as Element).setPointerCapture(event.pointerId);
  } catch {
    /* 일부 환경에서는 capture가 불가 — 드래그는 계속 동작한다 */
  }
}

function release(event: ThreeEvent<PointerEvent>) {
  try {
    (event.target as unknown as Element).releasePointerCapture(event.pointerId);
  } catch {
    /* ignore */
  }
}

/** 카메라 광선이 z=planeZ 평면과 만나는 점을 XY로 돌려준다. */
function usePlaneHit(planeZ: number) {
  const plane = useMemo(() => new Plane(new Vector3(0, 0, 1), -planeZ), [planeZ]);
  const tmp = useMemo(() => new Vector3(), []);
  return (event: ThreeEvent<PointerEvent>): Vec3 | null => {
    const hit = event.ray.intersectPlane(plane, tmp);
    return hit ? [tmp.x, tmp.y, planeZ] : null;
  };
}

/** 목표 위치를 알리는 펄스 링(선택 가능 표시와 별개의 조작 안내). */
function TargetRing({ position, radius = 0.24, visible = true }: { position: Vec3; radius?: number; visible?: boolean }) {
  const group = useRef<Group | null>(null);
  const reduced = useMemo(() => reducedMotion(), []);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const s = reduced ? 1 : 1 + Math.sin(clock.elapsedTime * 3) * 0.08;
    group.current.scale.set(s, s, 1);
  });
  if (!visible) return null;
  return (
    <group ref={group} position={position} renderOrder={18}>
      <mesh renderOrder={18}>
        <ringGeometry args={[radius * 0.82, radius, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.95} depthTest={false} />
      </mesh>
      <mesh renderOrder={19}>
        <ringGeometry args={[radius * 0.68, radius * 0.82, 32]} />
        <meshBasicMaterial color="#0f766e" transparent opacity={0.95} depthTest={false} />
      </mesh>
      <mesh renderOrder={17}>
        <circleGeometry args={[radius * 0.68, 32]} />
        <meshBasicMaterial color="#5eead4" transparent opacity={0.22} depthTest={false} />
      </mesh>
    </group>
  );
}

interface DragProps {
  onComplete: () => void;
  tokenActive: { current: boolean };
  /** 관찰 링이 지나간 지점 수(1=머리, 2=머리+몸통) — 콩이가 진행 중에도 반응하도록 알린다. */
  onObserveProgress?: (step: number) => void;
}

function BubbleAction({ onComplete, tokenActive }: DragProps) {
  const group = useRef<Group | null>(null);
  const dragging = useRef(false);
  const done = useRef(false);
  const goal = useRef<Vec3>(BUBBLE_HOME);
  const hit = usePlaneHit(BUBBLE_PLANE_Z);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g || dragging.current || done.current) return;
    // 놓친 경우 부드럽게 원래 위치로 돌아간다
    const k = 1 - Math.pow(0.5, delta / 0.08);
    g.position.x += (goal.current[0] - g.position.x) * k;
    g.position.y += (goal.current[1] - g.position.y) * k;
  });

  const move = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || done.current) return;
    const p = hit(event);
    if (!p || !group.current) return;
    group.current.position.set(p[0], p[1], BUBBLE_PLANE_Z);
    if (isNearTarget(p, RECORD_TARGET)) {
      done.current = true;
      dragging.current = false;
      tokenActive.current = false;
      group.current.position.set(RECORD_TARGET[0], RECORD_TARGET[1] - 0.02, BUBBLE_PLANE_Z);
      onComplete();
    }
  };

  const end = (event: ThreeEvent<PointerEvent>) => {
    release(event);
    dragging.current = false;
    tokenActive.current = false;
    if (!done.current) goal.current = BUBBLE_HOME;
  };

  return (
    <>
      <TargetRing position={RECORD_TARGET} radius={0.26} />
      <group ref={group} position={BUBBLE_HOME} renderOrder={20}>
        <mesh
          visible={false}
          onPointerDown={(event) => {
            event.stopPropagation();
            capture(event);
            dragging.current = true;
            tokenActive.current = true;
          }}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          <sphereGeometry args={[0.38, 12, 12]} />
        </mesh>
        {/* 말풍선 카드 — 텍스트 없이 말하는 표시(점 3개)만 그린다 */}
        {/* depthTest를 끈 채 그리므로 renderOrder로 겹침 순서를 명시한다(테두리 → 카드 → 꼬리 → 점) */}
        <mesh renderOrder={20}>
          <boxGeometry args={[0.4, 0.26, 0.01]} />
          <meshBasicMaterial color="#0f766e" depthTest={false} />
        </mesh>
        <mesh renderOrder={21}>
          <boxGeometry args={[0.36, 0.22, 0.01]} />
          <meshBasicMaterial color="#ffffff" depthTest={false} />
        </mesh>
        <mesh position={[-0.12, -0.15, 0]} rotation={[0, 0, 0.6]} renderOrder={20}>
          <boxGeometry args={[0.08, 0.08, 0.01]} />
          <meshBasicMaterial color="#0f766e" depthTest={false} />
        </mesh>
        <mesh position={[-0.12, -0.13, 0]} rotation={[0, 0, 0.6]} renderOrder={21}>
          <boxGeometry args={[0.055, 0.055, 0.01]} />
          <meshBasicMaterial color="#ffffff" depthTest={false} />
        </mesh>
        {[-0.09, 0, 0.09].map((x) => (
          <mesh key={x} position={[x, 0, 0.015]} renderOrder={22}>
            <circleGeometry args={[0.028, 12]} />
            <meshBasicMaterial color="#0f766e" depthTest={false} />
          </mesh>
        ))}
      </group>
    </>
  );
}

function ObserveAction({ onComplete, tokenActive, onObserveProgress }: DragProps) {
  const group = useRef<Group | null>(null);
  const dragging = useRef(false);
  const done = useRef(false);
  const goal = useRef<Vec3>(OBSERVE_HOME);
  const [visited, setVisited] = useState<ObserveProgress>(OBSERVE_INITIAL);
  const onProgressRef = useRef(onObserveProgress);
  onProgressRef.current = onObserveProgress;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const gesture = useRef(
    createObserveGesture({
      onProgress: (step) => onProgressRef.current?.(step),
      onComplete: () => {
        done.current = true;
        dragging.current = false;
        tokenActive.current = false;
        onCompleteRef.current();
      },
    }),
  );
  const hit = usePlaneHit(OBSERVE_PLANE_Z);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g || dragging.current || done.current) return;
    const k = 1 - Math.pow(0.5, delta / 0.08);
    g.position.x += (goal.current[0] - g.position.x) * k;
    g.position.y += (goal.current[1] - g.position.y) * k;
  });

  const move = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || done.current) return;
    const p = hit(event);
    if (!p || !group.current) return;
    group.current.position.set(p[0], p[1], OBSERVE_PLANE_Z);
    const before = gesture.current.progress;
    const next = gesture.current.move(p);
    if (next !== before) setVisited(next);
  };

  const end = (event: ThreeEvent<PointerEvent>) => {
    release(event);
    dragging.current = false;
    tokenActive.current = false;
    if (!done.current) goal.current = OBSERVE_HOME;
  };

  return (
    <>
      <TargetRing position={OBSERVE_WAYPOINTS[0]} radius={OBSERVE_TARGET_RADIUS} visible={!visited.head} />
      <TargetRing position={OBSERVE_WAYPOINTS[1]} radius={OBSERVE_TARGET_RADIUS} visible={visited.head && !visited.body} />
      {visited.head && (
        <mesh position={[OBSERVE_WAYPOINTS[0][0], OBSERVE_WAYPOINTS[0][1], OBSERVE_PLANE_Z]} renderOrder={19}>
          <circleGeometry args={[0.07, 16]} />
          <meshBasicMaterial color="#16a34a" depthTest={false} />
        </mesh>
      )}
      <group ref={group} position={OBSERVE_HOME} renderOrder={20}>
        <mesh
          visible={false}
          onPointerDown={(event) => {
            event.stopPropagation();
            capture(event);
            dragging.current = true;
            tokenActive.current = true;
          }}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          <sphereGeometry args={[0.38, 12, 12]} />
        </mesh>
        <mesh renderOrder={21}>
          <ringGeometry args={[0.1, 0.16, 28]} />
          <meshBasicMaterial color="#f59e0b" depthTest={false} />
        </mesh>
        <mesh renderOrder={22}>
          <ringGeometry args={[0.16, 0.185, 28]} />
          <meshBasicMaterial color="#ffffff" depthTest={false} />
        </mesh>
        <mesh position={[0.14, -0.14, 0]} rotation={[0, 0, 0.8]} renderOrder={21}>
          <boxGeometry args={[0.16, 0.035, 0.01]} />
          <meshBasicMaterial color="#f59e0b" depthTest={false} />
        </mesh>
      </group>
    </>
  );
}

// ====================================================
// G2.2-R4-B — 나머지 19개 choice(새싹2·3, 나침반1~5) 공용 렌더러
//
// BubbleAction/ObserveAction(위)은 승인된 R4-A 동작이라 건드리지 않는다.
// 아래는 r4ActionDefinitions.ts의 geometry.kind에 따라 5가지 조작 유형을
// 그린다 — 판정 자체는 r4ActionState.ts의 순수 함수가 전담하고, 여기서는
// pointer 입력·위치 보간·완료 콜백 연결만 한다(WebGL 없이도 판정 로직은
// r4ActionState.test.ts가 전수 검증한다).
// ====================================================

const CARD_COLORS = ["#0f766e", "#ff8a73", "#e0b23c", "#3b6ea8"];

function CardMesh({ color }: { color: string }) {
  return (
    <>
      <mesh renderOrder={20}>
        <boxGeometry args={[0.34, 0.24, 0.01]} />
        <meshBasicMaterial color={color} depthTest={false} />
      </mesh>
      <mesh renderOrder={21}>
        <boxGeometry args={[0.28, 0.18, 0.01]} />
        <meshBasicMaterial color="#ffffff" depthTest={false} />
      </mesh>
    </>
  );
}

/** 슬롯/타깃 표시 — 비어 있으면 옅은 사각 영역 + 테두리, 채워지면 초록 점으로 바뀐다. */
function SlotMarker({ position, filled }: { position: Vec3; filled: boolean }) {
  return (
    <group position={position} renderOrder={16}>
      {filled ? (
        <mesh renderOrder={16}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color="#16a34a" depthTest={false} />
        </mesh>
      ) : (
        <>
          <mesh renderOrder={16}>
            <planeGeometry args={[0.4, 0.28]} />
            <meshBasicMaterial color="#5eead4" transparent opacity={0.22} depthTest={false} />
          </mesh>
          <mesh position={[0, 0, 0.002]} renderOrder={17}>
            <ringGeometry args={[0.17, 0.2, 4]} />
            <meshBasicMaterial color="#0f766e" transparent opacity={0.9} depthTest={false} />
          </mesh>
        </>
      )}
    </group>
  );
}

/** 카드 한 장을 드래그해서 목표 위치에 "놓는다"(release 시점에만 accept/reject 판정) —
 *  orderedSlots·multiSource·matchTarget이 공유하는 저수준 조작 단위. accept 시 onDrop이
 *  스냅될 좌표를 돌려주고, reject면 false를 돌려줘 카드가 원래 자리로 돌아간다. */
function DraggableDropToken({
  home,
  planeZ,
  locked,
  lockedPosition,
  color,
  tokenActive,
  onDrop,
}: {
  home: Vec3;
  planeZ: number;
  locked: boolean;
  lockedPosition: Vec3 | null;
  color: string;
  tokenActive: { current: boolean };
  onDrop: (point: Vec3) => Vec3 | false;
}) {
  const group = useRef<Group | null>(null);
  const dragging = useRef(false);
  const goal = useRef<Vec3>(home);
  const hit = usePlaneHit(planeZ);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g || dragging.current || locked) return;
    const k = 1 - Math.pow(0.5, delta / 0.08);
    g.position.x += (goal.current[0] - g.position.x) * k;
    g.position.y += (goal.current[1] - g.position.y) * k;
  });

  if (locked) {
    const at = lockedPosition ?? home;
    return (
      <group position={at} renderOrder={20}>
        <CardMesh color={color} />
      </group>
    );
  }

  return (
    <group ref={group} position={home} renderOrder={20}>
      <mesh
        visible={false}
        onPointerDown={(event) => {
          event.stopPropagation();
          capture(event);
          dragging.current = true;
          tokenActive.current = true;
        }}
        onPointerMove={(event) => {
          if (!dragging.current) return;
          const p = hit(event);
          if (!p || !group.current) return;
          group.current.position.set(p[0], p[1], planeZ);
        }}
        onPointerUp={(event) => {
          release(event);
          dragging.current = false;
          tokenActive.current = false;
          const p = hit(event) ?? ([group.current?.position.x ?? home[0], group.current?.position.y ?? home[1], planeZ] as Vec3);
          const snapped = onDrop(p);
          goal.current = snapped || home;
        }}
        onPointerCancel={(event) => {
          release(event);
          dragging.current = false;
          tokenActive.current = false;
          goal.current = home;
        }}
      >
        <sphereGeometry args={[0.32, 10, 10]} />
      </mesh>
      <CardMesh color={color} />
    </group>
  );
}

interface GenericProps {
  onComplete: () => void;
  tokenActive: { current: boolean };
  onObserveProgress?: (step: number) => void;
}

function GenericDragToTargetAction({ geometry, onComplete, tokenActive }: GenericProps & { geometry: DragToTargetGeometry }) {
  const { home, target, radius } = geometry;
  const group = useRef<Group | null>(null);
  const dragging = useRef(false);
  const done = useRef(false);
  const goal = useRef<Vec3>(home);
  const hit = usePlaneHit(home[2]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g || dragging.current || done.current) return;
    const k = 1 - Math.pow(0.5, delta / 0.08);
    g.position.x += (goal.current[0] - g.position.x) * k;
    g.position.y += (goal.current[1] - g.position.y) * k;
  });

  const move = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || done.current) return;
    const p = hit(event);
    if (!p || !group.current) return;
    group.current.position.set(p[0], p[1], home[2]);
    if (isNearTarget(p, target, radius)) {
      done.current = true;
      dragging.current = false;
      tokenActive.current = false;
      group.current.position.set(target[0], target[1] - 0.02, home[2]);
      onComplete();
    }
  };

  const end = (event: ThreeEvent<PointerEvent>) => {
    release(event);
    dragging.current = false;
    tokenActive.current = false;
    if (!done.current) goal.current = home;
  };

  return (
    <>
      <TargetRing position={target} radius={radius + 0.02} />
      <group ref={group} position={home} renderOrder={20}>
        <mesh
          visible={false}
          onPointerDown={(event) => {
            event.stopPropagation();
            capture(event);
            dragging.current = true;
            tokenActive.current = true;
          }}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          <sphereGeometry args={[0.34, 10, 10]} />
        </mesh>
        <CardMesh color={CARD_COLORS[0]} />
      </group>
    </>
  );
}

function GenericPathAction({ geometry, onComplete, tokenActive, onObserveProgress }: GenericProps & { geometry: PathGeometry }) {
  const { home, waypoints, radius, driveDogObserve } = geometry;
  const planeZ = home[2];
  const group = useRef<Group | null>(null);
  const dragging = useRef(false);
  const done = useRef(false);
  const goal = useRef<Vec3>(home);
  const [visited, setVisited] = useState(0);
  const hit = usePlaneHit(planeZ);
  const onProgressRef = useRef(onObserveProgress);
  onProgressRef.current = onObserveProgress;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const gesture = useRef(
    createOrderedPathGesture(waypoints, radius, {
      onProgress: (step) => {
        if (driveDogObserve) onProgressRef.current?.(step);
      },
      onComplete: () => {
        done.current = true;
        dragging.current = false;
        tokenActive.current = false;
        onCompleteRef.current();
      },
    }),
  );

  useFrame((_, delta) => {
    const g = group.current;
    if (!g || dragging.current || done.current) return;
    const k = 1 - Math.pow(0.5, delta / 0.08);
    g.position.x += (goal.current[0] - g.position.x) * k;
    g.position.y += (goal.current[1] - g.position.y) * k;
  });

  const move = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || done.current) return;
    const p = hit(event);
    if (!p || !group.current) return;
    group.current.position.set(p[0], p[1], planeZ);
    const before = gesture.current.progress.visited;
    gesture.current.move(p);
    const after = gesture.current.progress.visited;
    if (after !== before) setVisited(after);
  };

  const end = (event: ThreeEvent<PointerEvent>) => {
    release(event);
    dragging.current = false;
    tokenActive.current = false;
    if (!done.current) goal.current = home;
  };

  return (
    <>
      {waypoints.map((wp, i) => (
        <TargetRing key={i} position={wp} radius={radius} visible={i === visited} />
      ))}
      {waypoints.slice(0, visited).map((wp, i) => (
        <mesh key={i} position={wp} renderOrder={19}>
          <circleGeometry args={[0.07, 16]} />
          <meshBasicMaterial color="#16a34a" depthTest={false} />
        </mesh>
      ))}
      <group ref={group} position={home} renderOrder={20}>
        <mesh
          visible={false}
          onPointerDown={(event) => {
            event.stopPropagation();
            capture(event);
            dragging.current = true;
            tokenActive.current = true;
          }}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          <sphereGeometry args={[0.34, 10, 10]} />
        </mesh>
        <mesh renderOrder={21}>
          <ringGeometry args={[0.1, 0.16, 24]} />
          <meshBasicMaterial color="#f59e0b" depthTest={false} />
        </mesh>
        <mesh renderOrder={22}>
          <ringGeometry args={[0.16, 0.185, 24]} />
          <meshBasicMaterial color="#ffffff" depthTest={false} />
        </mesh>
      </group>
    </>
  );
}

function GenericOrderedSlotsAction({ geometry, onComplete, tokenActive }: GenericProps & { geometry: OrderedSlotsGeometry }) {
  const { tokens, slots, radius } = geometry;
  const total = tokens.length;
  const planeZ = tokens[0].home[2];
  const [state, setState] = useState(orderedSlotsInitial);
  const [lockedAt, setLockedAt] = useState<(Vec3 | null)[]>(() => tokens.map(() => null));
  const doneRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const makeOnDrop = (index: number) => (point: Vec3): Vec3 | false => {
    if (doneRef.current || lockedAt[index]) return false;
    const slot = slots[index];
    if (!isNearTarget(point, slot, radius)) return false;
    const result = attemptPlaceOrderedSlot(stateRef.current, index, total);
    if (!result.accepted) return false;
    setState(result.state);
    setLockedAt((prev) => {
      const next = [...prev];
      next[index] = slot;
      return next;
    });
    if (isOrderedSlotsComplete(result.state, total)) {
      doneRef.current = true;
      onComplete();
    }
    return slot;
  };

  return (
    <>
      {slots.map((slot, i) => (
        <SlotMarker key={i} position={slot} filled={!!lockedAt[i]} />
      ))}
      {tokens.map((token, i) => (
        <DraggableDropToken
          key={i}
          home={token.home}
          planeZ={planeZ}
          locked={!!lockedAt[i]}
          lockedPosition={lockedAt[i]}
          color={CARD_COLORS[i % CARD_COLORS.length]}
          tokenActive={tokenActive}
          onDrop={makeOnDrop(i)}
        />
      ))}
    </>
  );
}

function GenericMultiSourceAction({ geometry, onComplete, tokenActive }: GenericProps & { geometry: MultiSourceGeometry }) {
  const { sources, target, radius } = geometry;
  const total = sources.length;
  const planeZ = sources[0].home[2];
  const [state, setState] = useState(() => multiSourceInitial(total));
  const [locked, setLocked] = useState<boolean[]>(() => sources.map(() => false));
  const doneRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const makeOnDrop = (index: number) => (point: Vec3): Vec3 | false => {
    if (doneRef.current || locked[index]) return false;
    if (!isNearTarget(point, target, radius)) return false;
    const next = attemptPlaceMultiSource(stateRef.current, index);
    if (next === stateRef.current) return false;
    setState(next);
    setLocked((prev) => {
      const copy = [...prev];
      copy[index] = true;
      return copy;
    });
    if (isMultiSourceComplete(next)) {
      doneRef.current = true;
      onComplete();
    }
    return target;
  };

  return (
    <>
      <TargetRing position={target} radius={radius + 0.05} visible={!isMultiSourceComplete(state)} />
      {sources.map((source, i) => (
        <DraggableDropToken
          key={i}
          home={source.home}
          planeZ={planeZ}
          locked={locked[i]}
          lockedPosition={locked[i] ? target : null}
          color={CARD_COLORS[i % CARD_COLORS.length]}
          tokenActive={tokenActive}
          onDrop={makeOnDrop(i)}
        />
      ))}
    </>
  );
}

function GenericMatchTargetAction({ geometry, onComplete, tokenActive }: GenericProps & { geometry: MatchTargetGeometry }) {
  const { tokens, targets, radius } = geometry;
  const planeZ = tokens[0].home[2];
  const [state, setState] = useState(() => matchTargetInitial(tokens.length));
  const [lockedAt, setLockedAt] = useState<(Vec3 | null)[]>(() => tokens.map(() => null));
  const doneRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const makeOnDrop = (index: number) => (point: Vec3): Vec3 | false => {
    if (doneRef.current || lockedAt[index]) return false;
    let nearestIndex = -1;
    let nearestDist = Infinity;
    targets.forEach((t, ti) => {
      const d = distanceXY(point, t);
      if (d <= radius && d < nearestDist) {
        nearestDist = d;
        nearestIndex = ti;
      }
    });
    if (nearestIndex === -1) return false;
    const result = attemptMatchTarget(stateRef.current, index, nearestIndex, tokens[index].targetIndex);
    if (!result.accepted) return false;
    setState(result.state);
    const snapped = targets[tokens[index].targetIndex];
    setLockedAt((prev) => {
      const next = [...prev];
      next[index] = snapped;
      return next;
    });
    if (isMatchTargetComplete(result.state)) {
      doneRef.current = true;
      onComplete();
    }
    return snapped;
  };

  return (
    <>
      {targets.map((t, i) => (
        <SlotMarker key={i} position={t} filled={tokens.some((tok, ti) => tok.targetIndex === i && !!lockedAt[ti])} />
      ))}
      {tokens.map((token, i) => (
        <DraggableDropToken
          key={i}
          home={token.home}
          planeZ={planeZ}
          locked={!!lockedAt[i]}
          lockedPosition={lockedAt[i]}
          color={CARD_COLORS[i % CARD_COLORS.length]}
          tokenActive={tokenActive}
          onDrop={makeOnDrop(i)}
        />
      ))}
    </>
  );
}

function GenericR4Action({
  choiceId,
  onComplete,
  tokenActive,
  onObserveProgress,
}: {
  choiceId: R4ActionChoiceId;
  onComplete: () => void;
  tokenActive: { current: boolean };
  onObserveProgress?: (step: number) => void;
}) {
  const def = getR4ActionDefinition(choiceId);
  if (!def) return null;
  const { geometry } = def;
  switch (geometry.kind) {
    case "dragToTarget":
      return <GenericDragToTargetAction geometry={geometry} onComplete={onComplete} tokenActive={tokenActive} />;
    case "orderedPath":
    case "reviewPath":
      return (
        <GenericPathAction
          geometry={geometry}
          onComplete={onComplete}
          tokenActive={tokenActive}
          onObserveProgress={onObserveProgress}
        />
      );
    case "orderedSlots":
      return <GenericOrderedSlotsAction geometry={geometry} onComplete={onComplete} tokenActive={tokenActive} />;
    case "multiSource":
      return <GenericMultiSourceAction geometry={geometry} onComplete={onComplete} tokenActive={tokenActive} />;
    case "matchTarget":
      return <GenericMatchTargetAction geometry={geometry} onComplete={onComplete} tokenActive={tokenActive} />;
    default:
      return null;
  }
}

export interface R4ActionLayerProps {
  actionChoiceId: R4ActionChoiceId | null;
  onActionComplete: () => void;
  /** 장면 회전 목표 yaw(rad) — CameraRig가 이 값을 향해 부드럽게 따라간다. */
  orbitTargetRef: { current: number };
  /** 회전이 끝났을 때 처음 시점과 다른지 알린다(핀 숨김·'처음 시점' 버튼 표시용). */
  onOrbited: (orbited: boolean) => void;
  onObserveProgress?: (step: number) => void;
}

export default function R4ActionLayer({
  actionChoiceId,
  onActionComplete,
  orbitTargetRef,
  onOrbited,
  onObserveProgress,
}: R4ActionLayerProps) {
  const gl = useThree((state) => state.gl);
  const tokenActive = useRef(false);

  useEffect(() => {
    const el = gl.domElement;
    let start: { x: number; y: number; yaw: number } | null = null;
    let orbiting = false;

    const down = (e: PointerEvent) => {
      start = { x: e.clientX, y: e.clientY, yaw: orbitTargetRef.current };
      orbiting = false;
    };
    const move = (e: PointerEvent) => {
      if (!start || tokenActive.current) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!orbiting) {
        if (classifyPointerGesture(Math.hypot(dx, dy)) !== "drag") return;
        if (Math.abs(dx) < Math.abs(dy)) {
          start = null; // 세로 이동은 페이지 스크롤에 맡긴다
          return;
        }
        orbiting = true;
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      orbitTargetRef.current = clampOrbitYaw(start.yaw + dx * ORBIT_RAD_PER_PX);
    };
    const up = () => {
      if (orbiting) onOrbited(Math.abs(orbitTargetRef.current) > 0.01);
      start = null;
      orbiting = false;
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [gl, orbitTargetRef, onOrbited]);

  if (actionChoiceId === "s1_a") return <BubbleAction onComplete={onActionComplete} tokenActive={tokenActive} />;
  if (actionChoiceId === "s1_b") return <ObserveAction onComplete={onActionComplete} tokenActive={tokenActive} onObserveProgress={onObserveProgress} />;
  if (!actionChoiceId) return null;
  return (
    <GenericR4Action
      choiceId={actionChoiceId}
      onComplete={onActionComplete}
      tokenActive={tokenActive}
      onObserveProgress={onObserveProgress}
    />
  );
}
