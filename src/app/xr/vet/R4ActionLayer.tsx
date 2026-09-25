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
  OBSERVE_WAYPOINTS,
  ORBIT_RAD_PER_PX,
  RECORD_TARGET,
  advanceObserve,
  classifyPointerGesture,
  clampOrbitYaw,
  isNearTarget,
  isObserveComplete,
  type ObserveProgress,
  type R4ActionChoiceId,
} from "./r4Prototype";
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
  const progress = useRef<ObserveProgress>(OBSERVE_INITIAL);
  const [visited, setVisited] = useState<ObserveProgress>(OBSERVE_INITIAL);
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
    const next = advanceObserve(progress.current, p);
    if (next !== progress.current) {
      progress.current = next;
      setVisited(next);
      onObserveProgress?.(next.body ? 2 : 1);
      if (isObserveComplete(next)) {
        done.current = true;
        dragging.current = false;
        tokenActive.current = false;
        onComplete();
      }
    }
  };

  const end = (event: ThreeEvent<PointerEvent>) => {
    release(event);
    dragging.current = false;
    tokenActive.current = false;
    if (!done.current) goal.current = OBSERVE_HOME;
  };

  return (
    <>
      <TargetRing position={OBSERVE_WAYPOINTS[0]} radius={0.26} visible={!visited.head} />
      <TargetRing position={OBSERVE_WAYPOINTS[1]} radius={0.26} visible={visited.head && !visited.body} />
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
  return null;
}
