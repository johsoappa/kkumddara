"use client";

// ====================================================
// FriedRiceScene — "손님의 채소 볶음밥 한 접시 만들기" 1·2단계 R3F 씬 (F11, 신규)
//
// 기존 ChefScene(나침반·새싹 체험)과 분리된 별도 Canvas다. 기존 체험의 선택 지점·판정은 건드리지 않는다.
// 재사용: ChefMentor(선배 요리사, poseOverride로 자세만 지정), ChefTargetPins/ChefPinProjector(F9 행동 핀),
//        interactions3d의 hit area 환산·카메라 프레이밍. 끌어서 놓기는 friedRiceDrag(화면 px 기준)로 계산한다.
//
// 조작
//  1단계: 주문표(실제 3D 판)를 누른다 → 열려서 메뉴가 보인다 → 노란 요청 메모를 눌러 확인한다.
//         확인 뒤에도 메모를 다시 누르면 "요청 다시 보기"(메모가 한 번 반짝인다).
//  2단계: 선반의 재료를 끌어 준비 트레이에 놓는다. 트레이의 재료를 누르면 선반으로 되돌아간다.
//         벽의 작은 주문표를 누르면 상위(클라이언트)가 주문표를 다시 보여 준다.
//
// 이 파일은 상태를 소유하지 않는다. 모든 변화는 상위가 내려준 state(friedRice.ts)와 콜백으로만 일어난다.
// 입력(포인터)은 interactive=true일 때만 붙는다 — 글로 진행하기 모드에서는 보기만 한다.
//
// 모든 mesh에서 선배 요리사(ChefMentor)에는 포인터 핸들러가 없다 → 인물이 조작 대상을 가로채지 않는다.
// ====================================================

import { useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  DoubleSide,
  type CanvasTexture,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
  type PerspectiveCamera,
  Vector3,
} from "three";
import {
  LABEL_OFFSET_SMALL,
  PLACE_HIT_AREA_CENTER_Y,
  PLACE_HIT_AREA_SIZE,
  easeAlpha,
  easeVec3,
  fitCameraFraming,
  maxNonOverlappingHitAreaScale,
  placeHitAreaScale,
  scaledCameraPosition,
  type Vec3,
} from "./interactions3d";
import {
  beginScreenDrag,
  dragWorldPosition,
  dropZoneFromRegions,
  isDropAt,
  rebaseScreenDrag,
  type DragView,
  type ScreenDragSession,
  type ScreenPoint,
} from "./friedRiceDrag";
import {
  HEAT_LEVELS,
  INGREDIENTS,
  ingredientName,
  trayRemaining,
  type FriedRiceState,
  type HeatLevel,
  type IngredientId,
} from "./friedRice";
import {
  FRAMING_MARGIN,
  FRIED_RICE_CAMERA,
  FRIED_RICE_MENTOR,
  FRIED_RICE_MENTOR_POSES,
  BELL,
  MINI_TICKET,
  MOUND_ORIGIN,
  SHELF_ORIGINS,
  TICKET,
  TRAY,
  TRAY_ITEM_SCALE,
  TRAY_LABEL,
  dropRegionsFor,
  framingPointsFor,
  knobPosition,
  mentorPoseKeyFor,
  pinsFor,
  receivesPointer,
  stageForPhase,
  traySlotPosition,
  type DropTarget,
} from "./friedRiceLayout";
import { drawMiniTicketTexture, drawNoteTexture, drawTicketTexture } from "./friedRiceTextures";
import { createLabelSprite } from "./labelSprite";
import {
  capturePointer,
  isPointerCaptured,
  releasePointer,
  setCursor,
  usePrefersReducedMotion,
  type TrayFeedback,
} from "./friedRiceSceneUtils";
import { FriedRiceMound, FryingPan, HeatKnob, ServeBell, ServePlate } from "./FriedRiceCookParts";
import ChefMentor from "./ChefMentor";
import ChefTargetPins, { useDragActiveCounter, type PinRegistry } from "./ChefTargetPins";
import ChefPinProjector from "./ChefPinProjector";
import XrSceneGuard from "../XrSceneGuard";
import XrScenePlaceholder from "../XrScenePlaceholder";

export interface FriedRiceSceneProps {
  state: FriedRiceState;
  /** false면 눈으로만 본다(글로 진행하기 모드). 핀·포인터 핸들러도 붙지 않는다. */
  interactive: boolean;
  onOpenOrder: () => void;
  onCheckRequest: () => void;
  onReviewRequest: () => void;
  onAddIngredient: (id: IngredientId) => void;
  onRemoveIngredient: (id: IngredientId) => void;
  onPeekOrder: () => void;
  /** 3단계: 트레이의 재료를 눌러 팬에 넣는다 */
  onAddToWok: (id: IngredientId) => void;
  /** 4단계: 불 손잡이를 눌러 세기를 고른다 */
  onSetHeat: (level: HeatLevel) => void;
  /** 5단계: 볶음밥을 접시에 놓는다 */
  onPlate: () => void;
  /** 5단계: 전달 벨을 누른다 */
  onServe: () => void;
  onSceneError?: () => void;
  /** 재료·볶음밥을 끄는 중인지 알린다(상위의 진행 버튼이 끄는 중에 눌리지 않게) */
  onDraggingChange?: (dragging: boolean) => void;
  /** 캔버스 위 DOM 오버레이(주문표 다시 보기 카드 등) — 캔버스 안쪽 컨테이너에 얹는다 */
  overlay?: ReactNode;
}

const CAMERA_EASE_HALF_LIFE = 0.35;

// ---------- 공용 ----------

// ---------- 카메라 ----------

function CameraRig({ stage }: { stage: "order" | "prep" }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const basePos = useRef<Vec3>(FRIED_RICE_CAMERA.order.position);
  const look = useRef<Vec3>(FRIED_RICE_CAMERA.order.lookAt);
  const distanceScale = useRef(1);

  useFrame((_, delta) => {
    const target = FRIED_RICE_CAMERA[stage];
    const alpha = easeAlpha(delta, CAMERA_EASE_HALF_LIFE);
    basePos.current = easeVec3(basePos.current, target.position, alpha);
    look.current = easeVec3(look.current, target.lookAt, alpha);
    const aspect = size.height > 0 ? size.width / size.height : 1;
    const framing = fitCameraFraming({
      cameraPos: basePos.current,
      lookAt: look.current,
      points: framingPointsFor(stage),
      aspect,
      marginRatio: FRAMING_MARGIN,
    });
    camera.fov += (framing.fovDeg - camera.fov) * alpha;
    camera.updateProjectionMatrix();
    distanceScale.current += (framing.distanceScale - distanceScale.current) * alpha;
    const scaled = scaledCameraPosition(basePos.current, look.current, distanceScale.current);
    camera.position.set(scaled[0], scaled[1], scaled[2]);
    camera.lookAt(look.current[0], look.current[1], look.current[2]);
  });
  return null;
}

// ---------- 주방 배경(장식 — 포인터 핸들러 없음) ----------

function Kitchen() {
  return (
    <group>
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#d9c9a8" />
      </mesh>
      <mesh position={[0, 2, -3]}>
        <planeGeometry args={[10, 4.2]} />
        <meshStandardMaterial color="#f3ede2" />
      </mesh>
      {/* 벽 타일 띠 */}
      <mesh position={[0, 1.55, -2.97]}>
        <planeGeometry args={[10, 0.9]} />
        <meshStandardMaterial color="#e3ddd0" />
      </mesh>
      {/* 조리대 */}
      <mesh position={[0, 0.5, -1.2]}>
        <boxGeometry args={[4, 1, 1.2]} />
        <meshStandardMaterial color="#8a6f4d" />
      </mesh>
      <mesh position={[0, 1.02, -1.2]}>
        <boxGeometry args={[4.1, 0.08, 1.3]} />
        <meshStandardMaterial color="#e8e4dc" />
      </mesh>
      {/* 벽 선반(장식) */}
      <mesh position={[-0.2, 2.75, -2.85]}>
        <boxGeometry args={[3.4, 0.06, 0.3]} />
        <meshStandardMaterial color="#a68a68" />
      </mesh>
      {[-1.4, -0.9, -0.4, 0.5, 1.0].map((x, i) => (
        <mesh key={x} position={[x, 2.9, -2.85]}>
          <cylinderGeometry args={[0.1, 0.1, 0.24, 12]} />
          <meshStandardMaterial color={["#d94f3c", "#e7b23c", "#3f9c96", "#f2e4c4", "#d94f3c"][i]} />
        </mesh>
      ))}
    </group>
  );
}

// ---------- 주문표(1단계) ----------

function useTextures() {
  return useMemo(
    () => ({
      cover: drawTicketTexture("cover"),
      menu: drawTicketTexture("menu"),
      notePending: drawNoteTexture("pending"),
      noteChecked: drawNoteTexture("checked"),
      mini: drawMiniTicketTexture(),
    }),
    [],
  );
}

function TexturedPlane({
  texture,
  width,
  height,
  fallbackColor,
}: {
  texture: CanvasTexture | null;
  width: number;
  height: number;
  fallbackColor: string;
}) {
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      {texture ? (
        <meshBasicMaterial map={texture} transparent />
      ) : (
        <meshStandardMaterial color={fallbackColor} />
      )}
    </mesh>
  );
}

function OrderTicket({
  state,
  interactive,
  textures,
  onOpenOrder,
  onCheckRequest,
  onReviewRequest,
}: {
  state: FriedRiceState;
  interactive: boolean;
  textures: ReturnType<typeof useTextures>;
  onOpenOrder: () => void;
  onCheckRequest: () => void;
  onReviewRequest: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const groupRef = useRef<Group>(null);
  const noteRef = useRef<Group>(null);
  const [hover, setHover] = useState<"ticket" | "note" | null>(null);
  const pulseAt = useRef<number>(-1);
  const lastViews = useRef(state.requestViews);

  const opened = state.order !== "closed";
  const checked = state.order === "requestChecked";

  // 요청을 (다시) 볼 때마다 메모가 한 번 반짝인다 — 반복 모션이 아니라 눌렀을 때의 응답이다.
  useEffect(() => {
    if (state.requestViews !== lastViews.current) {
      lastViews.current = state.requestViews;
      pulseAt.current = performance.now();
    }
  }, [state.requestViews]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (group) {
      const target = !opened ? 0.94 : 1.04;
      const next = reduced ? target : group.scale.x + (target - group.scale.x) * easeAlpha(delta, 0.12);
      group.scale.set(next, next, next);
    }
    const note = noteRef.current;
    if (note) {
      const age = (performance.now() - pulseAt.current) / 1000;
      const bump = !reduced && pulseAt.current > 0 && age < 0.45 ? Math.sin((age / 0.45) * Math.PI) * 0.12 : 0;
      const base = hover === "note" ? 1.05 : 1;
      note.scale.set(base + bump, base + bump, 1);
    }
  });

  const handlers = (kind: "ticket" | "note", press: () => void) =>
    interactive
      ? {
          onPointerOver: (event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            setHover(kind);
            setCursor("pointer");
          },
          onPointerOut: (event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            setHover(null);
            setCursor("auto");
          },
          onPointerDown: (event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            press();
          },
        }
      : {};

  return (
    <group position={TICKET.center} rotation={[TICKET.tiltX, 0, 0]}>
      {/* 받침대(조리대 위에 세워 둔 나무 거치대) */}
      <mesh position={[0, -TICKET.height / 2 - 0.02, -0.04]}>
        <boxGeometry args={[TICKET.width * 0.9, 0.06, 0.2]} />
        <meshStandardMaterial color="#6b5539" />
      </mesh>
      <group ref={groupRef}>
        {/* 판 */}
        <mesh position={[0, 0, -0.025]}>
          <boxGeometry args={[TICKET.width + 0.06, TICKET.height + 0.06, 0.04]} />
          <meshStandardMaterial color="#3f4a52" />
        </mesh>
        <group {...handlers("ticket", onOpenOrder)}>
          <TexturedPlane
            texture={opened ? textures.menu : textures.cover}
            width={TICKET.width}
            height={TICKET.height}
            fallbackColor="#fffaf0"
          />
        </group>
        {/* 요청 메모 — 열린 뒤에만 나타난다 */}
        {opened && (
          <group position={TICKET.sticky.local} ref={noteRef}>
            <group {...handlers("note", checked ? onReviewRequest : onCheckRequest)}>
              <TexturedPlane
                texture={checked ? textures.noteChecked : textures.notePending}
                width={TICKET.sticky.width}
                height={TICKET.sticky.height}
                fallbackColor={checked ? "#c8efc4" : "#ffe27a"}
              />
            </group>
          </group>
        )}
      </group>
    </group>
  );
}

// ---------- 재료 모델(이름이 없어도 알아볼 수 있는 형태) ----------

function IngredientModel({ id }: { id: IngredientId }) {
  if (id === "rice") {
    return (
      <group>
        {/* 파란 밥공기 + 소복한 흰 밥 */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.17, 0.11, 0.1, 20]} />
          <meshStandardMaterial color="#7fb0cf" />
        </mesh>
        <mesh position={[0, 0.11, 0]} scale={[1, 0.7, 1]}>
          <sphereGeometry args={[0.16, 18, 14]} />
          <meshStandardMaterial color="#fffaf0" />
        </mesh>
        {[
          [-0.06, 0.2, 0.04],
          [0.05, 0.21, -0.02],
          [0.01, 0.22, 0.07],
        ].map((p) => (
          <mesh key={p.join()} position={p as Vec3} scale={[1, 0.6, 0.7]}>
            <sphereGeometry args={[0.022, 6, 6]} />
            <meshStandardMaterial color="#ece4d2" />
          </mesh>
        ))}
      </group>
    );
  }
  if (id === "carrot") {
    return (
      <group>
        {/* 통당근(주황 원뿔 + 초록 잎) */}
        <mesh position={[0.03, 0.1, 0.02]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.06, 0.28, 14]} />
          <meshStandardMaterial color="#ee8a1f" />
        </mesh>
        {[-0.03, 0, 0.03].map((dz) => (
          <mesh key={dz} position={[-0.15, 0.11, 0.02 + dz]} rotation={[0, 0, Math.PI / 2 - dz * 6]}>
            <coneGeometry args={[0.022, 0.12, 6]} />
            <meshStandardMaterial color="#4f9e45" />
          </mesh>
        ))}
        {/* 썬 당근 조각 */}
        {[
          [-0.08, 0.04, -0.1],
          [0.04, 0.04, -0.13],
          [0.12, 0.04, -0.06],
        ].map((p) => (
          <mesh key={p.join()} position={p as Vec3}>
            <cylinderGeometry args={[0.04, 0.04, 0.025, 12]} />
            <meshStandardMaterial color="#f29a2e" />
          </mesh>
        ))}
      </group>
    );
  }
  if (id === "pea") {
    const positions: Vec3[] = [
      [-0.08, 0.05, 0.04],
      [0, 0.05, 0.06],
      [0.08, 0.05, 0.03],
      [-0.05, 0.05, -0.05],
      [0.05, 0.05, -0.05],
      [-0.03, 0.115, 0.01],
      [0.04, 0.115, 0],
      [0.0, 0.17, -0.01],
    ];
    return (
      <group>
        {positions.map((p) => (
          <mesh key={p.join()} position={p}>
            <sphereGeometry args={[0.048, 12, 12]} />
            <meshStandardMaterial color="#62b34a" />
          </mesh>
        ))}
      </group>
    );
  }
  // onion
  return (
    <group>
      <mesh position={[0, 0.13, 0]} scale={[1, 0.9, 1]}>
        <sphereGeometry args={[0.135, 18, 14]} />
        <meshStandardMaterial color="#ebcb82" />
      </mesh>
      <mesh position={[0, 0.265, 0]}>
        <coneGeometry args={[0.04, 0.1, 10]} />
        <meshStandardMaterial color="#c9a45a" />
      </mesh>
      {[0, Math.PI / 3, (2 * Math.PI) / 3].map((r) => (
        <mesh key={r} position={[0, 0.13, 0]} rotation={[0, r, 0]} scale={[1, 0.9, 1]}>
          <torusGeometry args={[0.137, 0.006, 6, 24]} />
          <meshStandardMaterial color="#c79a48" />
        </mesh>
      ))}
      <mesh position={[0, 0.005, 0.04]}>
        <cylinderGeometry args={[0.04, 0.05, 0.03, 8]} />
        <meshStandardMaterial color="#8a6a3a" />
      </mesh>
    </group>
  );
}

const NAME_LABEL_SCALE: [number, number] = [0.46, 0.24];
/** 트레이 위 재료 이름표 — 카메라에 더 가까워 같은 크기면 이웃 선반 이름표를 가리므로 조금 작게 */
const TRAY_NAME_LABEL_SCALE: [number, number] = [0.38, 0.2];

function NameLabel({
  text,
  y,
  scale = NAME_LABEL_SCALE,
}: {
  text: string;
  y: number;
  scale?: [number, number];
}) {
  const sprite = useMemo(() => createLabelSprite(text, scale, true), [text, scale]);
  return <primitive object={sprite} position={[0, y, 0]} />;
}

// ---------- 선반 위 재료(끌 수 있다) ----------

const forwardScratch = new Vector3();
const pointerForwardScratch = new Vector3();

function DragProp({
  origin,
  label,
  interactive,
  anyDragging,
  maxHitAreaScale,
  feedback,
  dropTarget,
  onDrop,
  onDragActiveChange,
  children,
}: {
  /** 끌기 시작하는 자리(월드). y는 끄는 평면 높이이기도 하다 */
  origin: Vec3;
  /** 위에 붙는 이름표(없으면 생략) */
  label?: string;
  interactive: boolean;
  /** 어느 재료든 끄는 중인가 — 끄는 중에는 끄는 재료만 포인터를 받는다 */
  anyDragging: boolean;
  maxHitAreaScale: number;
  feedback: MutableRefObject<TrayFeedback>;
  /** 어느 "놓는 곳"인가 — 안내 핀과 같은 월드 점들로 놓기 영역(화면 px)을 만든다 */
  dropTarget: DropTarget;
  onDrop: () => void;
  onDragActiveChange: (active: boolean) => void;
  children: ReactNode;
}) {
  const groupRef = useRef<Group>(null);
  const hitRef = useRef<Mesh>(null);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const positionRef = useRef<Vec3>(origin);
  const cursorRef = useRef<ScreenPoint | null>(null);
  const sessionRef = useRef<ScreenDragSession | null>(null);
  const zoneRegions = useMemo(() => dropRegionsFor(dropTarget), [dropTarget]);
  const capturedId = useRef<number | null>(null);
  const domElement = useThree((s) => s.gl.domElement);
  const getState = useThree((s) => s.get);

  /** 지금 카메라·캔버스 크기로 만든 화면 계산용 view */
  const viewNow = (): DragView => {
    const { camera: cam, size } = getState();
    cam.getWorldDirection(pointerForwardScratch);
    return {
      cameraPos: [cam.position.x, cam.position.y, cam.position.z],
      forward: [pointerForwardScratch.x, pointerForwardScratch.y, pointerForwardScratch.z],
      fovDeg: (cam as PerspectiveCamera).fov,
      viewportWidthPx: size.width,
      viewportHeightPx: size.height,
    };
  };
  /** 포인터 이벤트 → 캔버스 안 화면 좌표(R3F size 기준 px) */
  const cursorOf = (event: ThreeEvent<PointerEvent>): ScreenPoint => {
    const rect = domElement.getBoundingClientRect();
    const { size } = getState();
    const kx = rect.width > 0 ? size.width / rect.width : 1;
    const ky = rect.height > 0 ? size.height / rect.height : 1;
    return { x: (event.nativeEvent.clientX - rect.left) * kx, y: (event.nativeEvent.clientY - rect.top) * ky };
  };

  // 드래그 중 핀 숨김 알림 — 시작 +1 / 끝 -1이 짝을 이룬다(언마운트 시에도 cleanup으로 짝 보장)
  useEffect(() => {
    if (!dragging) return undefined;
    onDragActiveChange(true);
    return () => onDragActiveChange(false);
  }, [dragging, onDragActiveChange]);

  useFrame(({ camera: cam, size }) => {
    const hit = hitRef.current;
    if (hit) {
      cam.getWorldDirection(forwardScratch);
      hit.scale.setScalar(
        placeHitAreaScale({
          center: [origin[0], origin[1] + PLACE_HIT_AREA_CENTER_Y, origin[2]],
          cameraPos: [cam.position.x, cam.position.y, cam.position.z],
          forward: [forwardScratch.x, forwardScratch.y, forwardScratch.z],
          fovDeg: (cam as PerspectiveCamera).fov,
          viewportWidthPx: size.width,
          viewportHeightPx: size.height,
          maxScale: maxHitAreaScale,
        }),
      );
    }
    if (dragging && groupRef.current) {
      const session = sessionRef.current;
      const cursor = cursorRef.current;
      if (session && cursor) {
        // 카메라가 움직이는 중(단계 전환)이거나 화면 크기가 바뀌어도 재료 위치·놓기 판정이 지금 화면과 맞도록
        // 매 프레임 지금 카메라 기준으로 다시 계산한다(잡은 손가락 위치와 재료 중심의 차이는 그대로).
        const view: DragView = {
          cameraPos: [cam.position.x, cam.position.y, cam.position.z],
          forward: [forwardScratch.x, forwardScratch.y, forwardScratch.z],
          fovDeg: (cam as PerspectiveCamera).fov,
          viewportWidthPx: size.width,
          viewportHeightPx: size.height,
        };
        const live = rebaseScreenDrag(session, view);
        if (live) {
          positionRef.current = dragWorldPosition(live, cursor);
          feedback.current.hot = isDropAt(live, cursor, dropZoneFromRegions(zoneRegions, view));
        }
      }
      const [x, y, z] = positionRef.current;
      groupRef.current.position.set(x, y, z);
    }
  });

  useEffect(
    () => () => {
      const pointerId = capturedId.current;
      if (pointerId !== null && domElement.hasPointerCapture(pointerId)) {
        try {
          domElement.releasePointerCapture(pointerId);
        } catch {
          // no-op
        }
      }
      feedback.current.dragging = false;
      feedback.current.hot = false;
      // 끄는 도중에 사라져도(단계가 바뀌는 등) 커서가 "잡는 중" 모양으로 남지 않게 한다
      if (capturedId.current !== null) setCursor("auto");
    },
    [domElement, feedback],
  );

  const endDrag = (dropped: boolean) => {
    capturedId.current = null;
    sessionRef.current = null;
    feedback.current.dragging = false;
    feedback.current.hot = false;
    setDragging(false);
    setHovered(false);
    setCursor("auto");
    if (dropped) {
      onDrop();
    } else {
      groupRef.current?.position.set(origin[0], origin[1], origin[2]);
    }
  };

  // 터치가 첫 이동 전에 취소돼도(pointercancel) 또는 캡처가 밖에서 끊겨도(lostpointercapture) 끄는 상태가 남지 않게
  // 정리한다. R3F 8.17은 lostpointercapture를 객체 핸들러로 전달하지 않으므로(DOM 계층에서만 처리) 캔버스 DOM
  // 이벤트로 직접 듣고, 다른 손가락의 이벤트가 이 드래그를 끊지 않도록 pointerId가 같을 때만 취소한다.
  const endDragRef = useRef(endDrag);
  endDragRef.current = endDrag;
  useEffect(() => {
    const cancel = (event: PointerEvent) => {
      if (capturedId.current !== null && event.pointerId === capturedId.current) {
        endDragRef.current(false);
      }
    };
    domElement.addEventListener("pointercancel", cancel);
    domElement.addEventListener("lostpointercapture", cancel);
    return () => {
      domElement.removeEventListener("pointercancel", cancel);
      domElement.removeEventListener("lostpointercapture", cancel);
    };
  }, [domElement]);

  // 드래그 때문에 핸들러가 꺼지면 hover 확대가 남지 않게 되돌린다(두 번째 포인터로 hover 중이던 경우)
  const pointerEnabled = receivesPointer(interactive, anyDragging, dragging);
  useEffect(() => {
    if (!pointerEnabled) setHovered(false);
  }, [pointerEnabled]);

  const handlers = pointerEnabled
    ? {
        onPointerOver: (event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          setHovered(true);
          setCursor("grab");
        },
        onPointerOut: (event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          if (!dragging) setHovered(false);
          setCursor("auto");
        },
        onPointerDown: (event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          // 이미 한 손가락이 잡고 있으면 다른 손가락은 무시한다(드래그 세션을 덮어쓰지 않는다)
          if (capturedId.current !== null) return;
          const grab = cursorOf(event);
          const session = beginScreenDrag(grab, origin, viewNow());
          if (!session) return;
          capturePointer(event);
          capturedId.current = event.pointerId;
          sessionRef.current = session;
          cursorRef.current = grab;
          // 잡는 순간에는 움직이지 않는다
          positionRef.current = origin;
          feedback.current.dragging = true;
          feedback.current.hot = false;
          setDragging(true);
          setCursor("grabbing");
        },
        onPointerMove: (event: ThreeEvent<PointerEvent>) => {
          if (capturedId.current === null || event.pointerId !== capturedId.current) return;
          event.stopPropagation();
          const session = sessionRef.current;
          if (!session) return;
          const cursor = cursorOf(event);
          cursorRef.current = cursor;
          const live = rebaseScreenDrag(session, viewNow());
          if (live) positionRef.current = dragWorldPosition(live, cursor);
        },
        onPointerUp: (event: ThreeEvent<PointerEvent>) => {
          // 잡은 손가락이 아닌 포인터가 떼어져도 드래그를 끝내지 않는다. 잡았는지는 state(dragging)가 아니라 ref로 본다 —
          // 눌렀다 떼는 사이에 다시 그리기가 끝나기 전이어도(느린 기기·아주 빠른 드래그) 놓기가 무시되지 않게 한다.
          if (capturedId.current === null || event.pointerId !== capturedId.current) return;
          event.stopPropagation();
          releasePointer(event);
          const session = sessionRef.current;
          const view = viewNow();
          const live = session ? rebaseScreenDrag(session, view) : null;
          const dropped = live ? isDropAt(live, cursorOf(event), dropZoneFromRegions(zoneRegions, view)) : false;
          endDrag(dropped);
        },
        onPointerLeave: (event: ThreeEvent<PointerEvent>) => {
          if (capturedId.current === null || event.pointerId !== capturedId.current) return;
          // 포인터 캡처가 살아 있으면 이 leave는 "다른 손가락이 다른 곳에서 움직여" R3F가 저장해 둔 첫 손가락의
          // 호버 이벤트로 불러 준 것일 수 있다 — 드래그를 끊지 않는다(실제 취소·손실은 위 DOM 리스너가 처리).
          // 캡처가 없을 때(캡처 실패)만 예전처럼 취소한다.
          if (isPointerCaptured(event, domElement)) return;
          event.stopPropagation();
          releasePointer(event);
          endDrag(false);
        },
      }
    : {};

  return (
    <group ref={groupRef} position={origin} {...handlers}>
      {/* 보이지 않는 넉넉한 터치 영역 — 화면 px 기준으로 매 프레임 크기를 보정한다(기존 place와 같은 방식) */}
      <mesh ref={hitRef} position={[0, PLACE_HIT_AREA_CENTER_Y, 0]}>
        <boxGeometry args={PLACE_HIT_AREA_SIZE} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <group scale={dragging ? 1.18 : hovered ? 1.08 : 1}>{children}</group>
      {label && <NameLabel text={label} y={LABEL_OFFSET_SMALL + 0.06} />}
    </group>
  );
}


/** 선반 위 재료 — 끌어서 준비 트레이에 놓는다(2단계) */
function ShelfIngredient({
  id,
  onDrop,
  ...rest
}: {
  id: IngredientId;
  interactive: boolean;
  anyDragging: boolean;
  maxHitAreaScale: number;
  feedback: MutableRefObject<TrayFeedback>;
  onDrop: (id: IngredientId) => void;
  onDragActiveChange: (active: boolean) => void;
}) {
  return (
    <DragProp
      {...rest}
      origin={SHELF_ORIGINS[id]}
      label={ingredientName(id)}
      dropTarget="tray"
      onDrop={() => onDrop(id)}
    >
      <IngredientModel id={id} />
    </DragProp>
  );
}

/** 선반 접시 — 재료가 트레이로 가도 접시는 남아 "여기서 가져왔다/여기로 되돌아온다"가 보인다. */
function ShelfPlates() {
  return (
    <group>
      {INGREDIENTS.map((item) => {
        const o = SHELF_ORIGINS[item.id];
        return (
          <mesh key={item.id} position={[o[0], o[1] + 0.012, o[2]]}>
            <cylinderGeometry args={[0.215, 0.215, 0.024, 24]} />
            <meshStandardMaterial color="#efe8d8" />
          </mesh>
        );
      })}
    </group>
  );
}

// ---------- 준비 트레이 ----------

function PrepTray({ feedback, active }: { feedback: MutableRefObject<TrayFeedback>; active: boolean }) {
  const reduced = usePrefersReducedMotion();
  const baseRef = useRef<MeshStandardMaterial>(null);
  const edgeMats = useRef<(MeshStandardMaterial | null)[]>([]);
  const [w, d] = [TRAY.width, TRAY.depth];

  useFrame(({ clock }) => {
    const fb = feedback.current;
    const flashAge = (performance.now() - fb.flashAt) / 1000;
    const flash = fb.flashAt > 0 && flashAge < 0.6 ? 1 - flashAge / 0.6 : 0;
    const idlePulse = reduced ? 0 : Math.abs(Math.sin(clock.elapsedTime * 2)) * 0.12;
    const edge = fb.hot ? 1.0 : fb.dragging ? 0.65 + (reduced ? 0 : Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.15) : 0.35 + idlePulse;
    if (baseRef.current) baseRef.current.emissiveIntensity = fb.hot ? 0.38 : fb.dragging ? 0.22 : 0.08 + flash * 0.5;
    for (const mat of edgeMats.current) {
      if (mat) mat.emissiveIntensity = Math.max(edge, flash);
    }
  });

  const edge = (x: number, z: number, sx: number, sz: number, index: number) => (
    <mesh position={[x, 0.034, z]}>
      <boxGeometry args={[sx, 0.02, sz]} />
      <meshStandardMaterial
        ref={(m) => {
          edgeMats.current[index] = m;
        }}
        color="#ff9f43"
        emissive="#ff9f43"
        emissiveIntensity={0.35}
      />
    </mesh>
  );

  return (
    <group position={TRAY.center}>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[w, 0.04, d]} />
        <meshStandardMaterial ref={baseRef} color="#a9b4bc" emissive="#ffd166" emissiveIntensity={0.08} />
      </mesh>
      {/* 눈에 띄는 주황 테두리 — 놓는 곳임을 모양으로도 알린다 */}
      {active && (
        <>
          {edge(0, d / 2 - 0.015, w, 0.03, 0)}
          {edge(0, -d / 2 + 0.015, w, 0.03, 1)}
          {edge(-w / 2 + 0.015, 0, 0.03, d, 2)}
          {edge(w / 2 - 0.015, 0, 0.03, d, 3)}
        </>
      )}
    </group>
  );
}

function TrayNameLabel() {
  const sprite = useMemo(() => createLabelSprite("준비 트레이", TRAY_LABEL.scale, true), []);
  return <primitive object={sprite} position={TRAY_LABEL.position} />;
}

/** 트레이에 올라간 재료 — 누르면 선반으로 되돌아간다. */
function TrayIngredient({
  id,
  interactive,
  onPress,
}: {
  id: IngredientId;
  interactive: boolean;
  /** 2단계: 눌러서 선반으로 되돌리기, 3단계: 눌러서 팬에 넣기 */
  onPress: (id: IngredientId) => void;
}) {
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    if (!interactive) setHovered(false);
  }, [interactive]);
  const position = traySlotPosition(id);
  const isOnion = id === "onion";
  const labelText = isOnion ? "양파 빼기" : ingredientName(id);
  const handlers = interactive
    ? {
        onPointerOver: (event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          setHovered(true);
          setCursor("pointer");
        },
        onPointerOut: (event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          setHovered(false);
          setCursor("auto");
        },
        onPointerDown: (event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          setHovered(false);
          setCursor("auto");
          onPress(id);
        },
      }
    : {};
  return (
    <group position={position} {...handlers}>
      {/* 누르는 영역: 재료보다 넉넉하게(트레이 슬롯 간격 0.38 안) */}
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.36, 0.34, 0.36]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <group scale={TRAY_ITEM_SCALE * (hovered ? 1.08 : 1)}>
        <IngredientModel id={id} />
      </group>
      {/* 양파는 빨간 고리 + "양파 빼기" 글자로 주문 요청과 어긋남을 알린다(색에만 기대지 않는다) */}
      {isOnion && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.18, 0.215, 28]} />
          <meshBasicMaterial color="#c83a20" side={DoubleSide} />
        </mesh>
      )}
      <NameLabel text={labelText} y={0.27} scale={TRAY_NAME_LABEL_SCALE} />
    </group>
  );
}

// ---------- 벽의 작은 주문표(2단계, 눌러서 다시 보기) ----------

function MiniTicket({
  texture,
  interactive,
  onPeek,
}: {
  texture: CanvasTexture | null;
  interactive: boolean;
  onPeek: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    if (!interactive) setHovered(false);
  }, [interactive]);
  const handlers = interactive
    ? {
        onPointerOver: (event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          setHovered(true);
          setCursor("pointer");
        },
        onPointerOut: (event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          setHovered(false);
          setCursor("auto");
        },
        onPointerDown: (event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          onPeek();
        },
      }
    : {};
  return (
    <group position={MINI_TICKET.center} scale={hovered ? 1.06 : 1}>
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[MINI_TICKET.width + 0.05, MINI_TICKET.height + 0.05, 0.03]} />
        <meshStandardMaterial color="#3f4a52" />
      </mesh>
      <group {...handlers}>
        <TexturedPlane
          texture={texture}
          width={MINI_TICKET.width}
          height={MINI_TICKET.height}
          fallbackColor="#fffaf0"
        />
      </group>
    </group>
  );
}

// ---------- 씬 ----------

export default function FriedRiceScene({
  state,
  interactive,
  onOpenOrder,
  onCheckRequest,
  onReviewRequest,
  onAddIngredient,
  onRemoveIngredient,
  onPeekOrder,
  onAddToWok,
  onSetHeat,
  onPlate,
  onServe,
  onSceneError,
  onDraggingChange,
  overlay,
}: FriedRiceSceneProps) {
  const textures = useTextures();
  const stage = stageForPhase(state.phase);
  const inPrep = state.phase !== "order";
  const pins = useMemo(() => pinsFor(state, interactive), [state, interactive]);
  const registry: PinRegistry = useRef(new Map<string, HTMLElement>());
  const [dragging, onDragActiveChange] = useDragActiveCounter();
  const feedback = useRef<TrayFeedback>({ dragging: false, hot: false, flashAt: 0 });
  useEffect(() => {
    onDraggingChange?.(dragging);
  }, [dragging, onDraggingChange]);
  const shelfOrigins = useMemo(() => INGREDIENTS.map((item) => SHELF_ORIGINS[item.id]), []);
  const maxHitAreaScale = useMemo(() => maxNonOverlappingHitAreaScale(shelfOrigins), [shelfOrigins]);
  const poseKey = mentorPoseKeyFor(state);

  const handleDrop = (id: IngredientId) => {
    feedback.current.flashAt = performance.now();
    onAddIngredient(id);
  };
  const handlePlateDrop = () => {
    feedback.current.flashAt = performance.now();
    onPlate();
  };
  // 작은 주문표는 재료 준비~담기 단계에서 눌러 다시 볼 수 있다(2단계 마무리·전달 후에는 끈다)
  const peekable = ["prep", "cook", "heat", "plate"].includes(state.phase);

  return (
    <XrSceneGuard
      onSceneError={onSceneError}
      fallback={<XrScenePlaceholder message="지금 화면에서는 그림 대신 글로 주문을 이어가요." />}
    >
      <div
        className="relative aspect-square max-h-[460px] min-h-[320px] w-full touch-none overflow-hidden rounded-xl bg-[#efe9dd]"
        data-testid="fried-rice-scene"
        role="group"
        aria-label="주방 장면. 같은 조작을 화면 아래의 버튼으로도 할 수 있어요."
      >
        <Canvas
          flat
          camera={{ position: FRIED_RICE_CAMERA.order.position, fov: 55 }}
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "low-power" }}
        >
          <CameraRig stage={stage} />
          <ChefPinProjector pins={pins} registry={registry} />
          <ambientLight intensity={0.9} />
          <hemisphereLight args={["#ffffff", "#efe3cc", 0.5]} />
          <directionalLight position={[3, 5, 4]} intensity={1.1} />
          <Kitchen />
          <ChefMentor
            cue="watch"
            poseOverride={FRIED_RICE_MENTOR_POSES[poseKey]}
            position={[FRIED_RICE_MENTOR.x, FRIED_RICE_MENTOR.y, FRIED_RICE_MENTOR.z]}
            yaw={FRIED_RICE_MENTOR.yaw}
            scale={FRIED_RICE_MENTOR.scale}
          />

          {!inPrep && (
            <OrderTicket
              state={state}
              interactive={interactive}
              textures={textures}
              onOpenOrder={onOpenOrder}
              onCheckRequest={onCheckRequest}
              onReviewRequest={onReviewRequest}
            />
          )}

          {inPrep && (
            <group>
              <MiniTicket
                texture={textures.mini}
                interactive={receivesPointer(interactive && peekable, dragging, false)}
                onPeek={onPeekOrder}
              />

              {/* 2단계(와 그 마무리): 선반 재료를 끌어 트레이에 놓는다 */}
              {(state.phase === "prep" || state.phase === "done") && (
                <group>
                  <ShelfPlates />
                  <PrepTray feedback={feedback} active={state.phase === "prep"} />
                  <TrayNameLabel />
                  {INGREDIENTS.filter((item) => !state.tray.includes(item.id)).map((item) => (
                    <ShelfIngredient
                      key={item.id}
                      id={item.id}
                      interactive={interactive && state.phase === "prep"}
                      anyDragging={dragging}
                      maxHitAreaScale={maxHitAreaScale}
                      feedback={feedback}
                      onDrop={handleDrop}
                      onDragActiveChange={onDragActiveChange}
                    />
                  ))}
                  {state.tray.map((id) => (
                    <TrayIngredient
                      key={id}
                      id={id}
                      interactive={receivesPointer(interactive && state.phase === "prep", dragging, false)}
                      onPress={onRemoveIngredient}
                    />
                  ))}
                </group>
              )}

              {/* 3단계: 트레이에 남은 재료를 눌러 팬에 넣는다(넣은 순서가 팬 안에 1·2·3으로 보인다) */}
              {state.phase === "cook" && (
                <group>
                  <PrepTray feedback={feedback} active={false} />
                  <TrayNameLabel />
                  {trayRemaining(state).map((id) => (
                    <TrayIngredient
                      key={id}
                      id={id}
                      interactive={receivesPointer(interactive, dragging, false)}
                      onPress={onAddToWok}
                    />
                  ))}
                </group>
              )}

              {(state.phase === "cook" || state.phase === "heat" || state.phase === "plate" || state.phase === "served") && (
                <FryingPan
                  wok={state.wok}
                  heat={state.phase === "cook" ? null : state.heat}
                  showItems={state.phase === "cook" || state.phase === "heat"}
                />
              )}

              {/* 4단계: 불 손잡이 3개 */}
              {state.phase === "heat" &&
                HEAT_LEVELS.map((option, index) => (
                  <HeatKnob
                    key={option.id}
                    level={option.id}
                    position={knobPosition(index)}
                    selected={state.heat === option.id}
                    interactive={receivesPointer(interactive, dragging, false)}
                    onPress={onSetHeat}
                  />
                ))}

              {/* 5단계: 볶음밥을 끌어 접시에 담고, 전달 벨을 눌러 손님께 낸다 */}
              {(state.phase === "plate" || state.phase === "served") && (
                <group>
                  <ServePlate feedback={feedback} active={state.phase === "plate" && !state.plated} plated={state.plated} />
                  {state.phase === "plate" && !state.plated && (
                    <DragProp
                      origin={MOUND_ORIGIN}
                      label="볶음밥"
                      interactive={interactive}
                      anyDragging={dragging}
                      maxHitAreaScale={Infinity}
                      feedback={feedback}
                      dropTarget="plate"
                      onDrop={handlePlateDrop}
                      onDragActiveChange={onDragActiveChange}
                    >
                      <FriedRiceMound scale={1.15} />
                    </DragProp>
                  )}
                  {state.plated && (
                    <ServeBell
                      position={BELL.center}
                      interactive={receivesPointer(interactive && state.phase === "plate", dragging, false)}
                      onPress={onServe}
                      rung={state.phase === "served"}
                    />
                  )}
                </group>
              )}
            </group>
          )}
        </Canvas>
        <ChefTargetPins pins={pins} registry={registry} dragging={dragging} />
        {overlay}
      </div>
    </XrSceneGuard>
  );
}
