"use client";

// ====================================================
// SceneInteractions — 요리사 XR 인캔버스 직접 조작 (G2.1-R1)
//
// select/place/order 세 종류 모두 최종적으로 상위(XrChefClient)의
// onChoice(choice)를 호출할 뿐, 잠금(choiceLockRef)이나 analytics는
// 절대 이 파일에서 복제하지 않는다 — onChoice는 handleChoice를
// 그대로 관통시킨 값이라 이미 자체적으로 안전하다.
//
// sceneInteractionId로 어느 지점인지 식별한다 (카메라 stage나
// interactionKind 조합으로 추론하지 않음 — interactions3d.ts 참고).
//
// 드래그는 R3F 공식 포인터 캡처 레시피를 따른다: onPointerDown에서
// setPointerCapture, onPointerUp에서 releasePointerCapture. 이는 Pointer
// Events 표준 위에서 동작하므로 마우스/터치 분기 코드가 필요 없다.
//
// G2.1-R1-F4 — 드래그 좌표는 e.point 대신 e.ray를 조리대 높이의 고정
// 평면과 직접 교차시켜(interactions3d.ts의 intersectRayWithPlaneY) 구한다
// — e.point는 드래그 중인 mesh 자신을 다시 레이캐스트한 결과라 mesh가
// 움직일수록 다음 프레임의 교차 판정이 불안정해져 끊김의 원인이 됐다.
// onPointerMove는 그 결과를 ref에만 저장하고, 실제 mesh 위치 갱신과
// 드롭존 강조·순서 재계산은 useFrame에서 매 프레임 그 ref를 읽어
// 처리한다(React state를 거치지 않아 리렌더 없이 렌더 루프 주기로
// 갱신된다).
//
// G2.1-R1-F7 — place 드래그는 매 이동마다 수평 평면과 교차시키는 대신,
// pointer down에서 beginPlaceDrag로 "이 드래그 세션이 끝까지 쓸 평면 +
// grab offset"을 한 번 정하고 이후에는 placeDragPoint만 호출한다. 라벨
// 위쪽을 잡으면 광선이 조리대 수평 평면을 아예 만나지 못해 토큰이 멈추던
// Dead Zone과, 스치듯 만나 깊이가 2배로 튀던 원근 점프가 모두 사라진다
// (자세한 원인·수식은 interactions3d.ts의 F7 주석 참고). order 타일은
// survey 카메라(y=2.1)에서 타일(y=1.18)을 내려다보는 정상 각도라 기존
// intersectRayWithPlaneY 경로를 그대로 둔다.
// ====================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  DoubleSide,
  Vector3,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
  type PerspectiveCamera,
} from "three";
import type { Choice, InteractionKind } from "./scenario";
import {
  DROP_ZONE_LABEL_SCALE,
  DROP_ZONE_RING_MULTIPLIER,
  LABEL_OFFSET_LARGE,
  LABEL_OFFSET_SMALL,
  LABEL_SCALE_LARGE,
  LABEL_SCALE_SMALL,
  PLACE_HIT_AREA_CENTER_Y,
  PLACE_HIT_AREA_SIZE,
  SCENE_ANCHORS,
  beginPlaceDrag,
  hitTestDropZone,
  intersectRayWithPlaneY,
  isEarlyReadabilityStage,
  maxNonOverlappingHitAreaScale,
  placeDragPoint,
  placeHitAreaScale,
  reorderOnDrag,
  type PlaceDragSession,
  type Vec3,
} from "./interactions3d";
import { createLabelSprite } from "./labelSprite";

export interface SceneInteractionsProps {
  sceneInteractionId: string;
  interactionKind: InteractionKind;
  choices: Choice[];
  onChoice: (choice: Choice) => void;
}

function capturePointer(event: ThreeEvent<PointerEvent>) {
  try {
    (event.target as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture(
      event.pointerId,
    );
  } catch {
    // 캡처 실패는 치명적이지 않음 — 드래그가 살짝 덜 매끄러울 뿐 선택 자체는 여전히 가능
  }
}

function releasePointer(event: ThreeEvent<PointerEvent>) {
  try {
    (
      event.target as unknown as { releasePointerCapture: (id: number) => void }
    ).releasePointerCapture(event.pointerId);
  } catch {
    // no-op
  }
}

function setCursor(value: string) {
  if (typeof document !== "undefined") {
    document.body.style.cursor = value;
  }
}

/** useFrame 안에서만 동기적으로 쓰는 임시 벡터 (프레임마다 새로 할당하지 않기 위함) */
const forwardScratch = new Vector3();
/** pointer down 핸들러 안에서만 동기적으로 쓰는 임시 벡터 (useFrame과 섞이지 않게 분리) */
const pointerForwardScratch = new Vector3();

export default function SceneInteractions({
  sceneInteractionId,
  interactionKind,
  choices,
  onChoice,
}: SceneInteractionsProps) {
  const anchor = SCENE_ANCHORS[sceneInteractionId];
  // G2.1-R1-F15: 1~3단계 전용 라벨 가독성 보정 — 라벨 박스의 world 크기/위치는
  // 그대로 두고(카메라 프레이밍·충돌 회귀 없음), 텍스처 안 글자만 더 크게 그린다.
  const emphasize = isEarlyReadabilityStage(sceneInteractionId);

  if (!anchor || anchor.kind !== interactionKind) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        `[ChefScene] sceneInteractionId "${sceneInteractionId}"에 대응하는 씬 앵커가 없습니다.`,
      );
    }
    return null;
  }

  if (anchor.kind === "select") {
    return (
      <SelectTargets
        key={sceneInteractionId}
        targets={anchor.targets}
        choices={choices}
        onChoice={onChoice}
        emphasize={emphasize}
      />
    );
  }

  if (anchor.kind === "place") {
    return (
      <PlaceZone
        key={sceneInteractionId}
        tokens={anchor.tokens}
        dropZone={anchor.dropZone}
        dropRadius={anchor.dropRadius}
        choices={choices}
        onChoice={onChoice}
        emphasize={emphasize}
      />
    );
  }

  return (
    <OrderTiles
      key={sceneInteractionId}
      slots={anchor.slots}
      confirm={anchor.confirm}
      choices={choices}
      onChoice={onChoice}
      emphasize={emphasize}
    />
  );
}

// ---------- select: 씬 안 오브젝트를 직접 클릭/터치 ----------

function SelectTargets({
  targets,
  choices,
  onChoice,
  emphasize,
}: {
  targets: Vec3[];
  choices: Choice[];
  onChoice: (choice: Choice) => void;
  emphasize: boolean;
}) {
  return (
    <group>
      {choices.map((choice, index) => (
        <SelectTarget
          key={choice.id}
          position={targets[index] ?? targets[0] ?? [0, 1.2, -1.2]}
          label={choice.label}
          onSelect={() => onChoice(choice)}
          emphasize={emphasize}
        />
      ))}
    </group>
  );
}

function SelectTarget({
  position,
  label,
  onSelect,
  emphasize,
}: {
  position: Vec3;
  label: string;
  onSelect: () => void;
  emphasize: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const matRef = useRef<MeshStandardMaterial>(null);
  const labelSprite = useMemo(
    () => createLabelSprite(label, LABEL_SCALE_LARGE, emphasize),
    [label, emphasize],
  );

  useFrame(({ clock }) => {
    const material = matRef.current;
    if (material) {
      material.emissiveIntensity = hovered
        ? 0.5 + Math.abs(Math.sin(clock.elapsedTime * 4)) * 0.35
        : 0.12;
    }
  });

  return (
    <mesh
      position={position}
      scale={hovered ? 1.15 : 1}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        setCursor("pointer");
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        setHovered(false);
        setCursor("auto");
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <sphereGeometry args={[0.17, 16, 16]} />
      <meshStandardMaterial ref={matRef} color="#ff9f43" emissive="#ffd166" emissiveIntensity={0.12} />
      <primitive object={labelSprite} position={[0, LABEL_OFFSET_LARGE, 0]} />
    </mesh>
  );
}

// ---------- place: 포인터 캡처 기반 드래그 → 단일 드롭존 ----------

function PlaceZone({
  tokens,
  dropZone,
  dropRadius,
  choices,
  onChoice,
  emphasize,
}: {
  tokens: Vec3[];
  dropZone: Vec3;
  dropRadius: number;
  choices: Choice[];
  onChoice: (choice: Choice) => void;
  emphasize: boolean;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [zoneHot, setZoneHot] = useState(false);
  const dropMatRef = useRef<MeshStandardMaterial>(null);
  const ringMatRef = useRef<MeshStandardMaterial>(null);
  const ringMeshRef = useRef<Mesh>(null);
  // G2.1-R1-F3: "여기에 놓기" 라벨 — 이전에는 드롭존에 라벨이 전혀 없어
  // 어디에 내려놓아야 하는지 알 수 없었다(Gate C 실브라우저 QA 발견).
  // G2.1-R1-F15: DROP_ZONE_LABEL_SCALE(LABEL_SCALE_SMALL보다 축소) 사용 —
  // 드롭존이 토큰 줄보다 카메라에 가까워 같은 크기면 토큰 라벨과 겹쳤다.
  const dropLabelSprite = useMemo(
    () => createLabelSprite("여기에 놓기", DROP_ZONE_LABEL_SCALE, emphasize),
    [emphasize],
  );
  const zones = useMemo(
    () => [{ id: "drop", x: dropZone[0], z: dropZone[2], radius: dropRadius }],
    [dropZone, dropRadius],
  );
  // hit area를 화면 기준으로 키울 때 넘어서면 안 되는 상한 — 이 값 이하이면
  // 어떤 두 토큰의 hit area도 겹치지 않는다(잘못된 choice 선택 방지).
  const maxHitAreaScale = useMemo(() => maxNonOverlappingHitAreaScale(tokens), [tokens]);
  const isDraggingAny = draggingId !== null;

  // G2.1-R1-F3: 드롭존 강조를 3단계로 — 평소에도 은은하게 pulse(완전히 정적이던
  // 이전과 달리 항상 "여기 뭔가 있다"는 신호를 준다), 드래그 중이면 더 강해지고,
  // 드래그 중인 토큰이 실제로 드롭존 위에 있으면(zoneHot) 가장 강해진다. 드롭
  // 판정 자체(dropRadius, hitTestDropZone)는 손대지 않는다 — 시각 강조만 바꾼다.
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    let intensity: number;
    let ringScale: number;
    if (zoneHot) {
      intensity = 0.85 + Math.abs(Math.sin(t * 5)) * 0.3;
      ringScale = 1.08;
    } else if (isDraggingAny) {
      intensity = 0.55 + Math.abs(Math.sin(t * 3)) * 0.2;
      ringScale = 1.03;
    } else {
      intensity = 0.35 + Math.abs(Math.sin(t * 2)) * 0.15;
      ringScale = 1;
    }
    if (dropMatRef.current) dropMatRef.current.emissiveIntensity = intensity;
    if (ringMatRef.current) ringMatRef.current.emissiveIntensity = intensity;
    if (ringMeshRef.current) ringMeshRef.current.scale.set(ringScale, ringScale, ringScale);
  });

  return (
    <group>
      <mesh position={dropZone}>
        <cylinderGeometry args={[dropRadius, dropRadius, 0.02, 24]} />
        <meshStandardMaterial
          ref={dropMatRef}
          color="#ffe9a8"
          emissive="#ffd166"
          emissiveIntensity={0.35}
          transparent
          opacity={0.92}
        />
      </mesh>
      {/* G2.1-R1-F3: 큰 외곽선 링 — dropRadius(드롭 판정 반경)는 그대로 두고
          시각적으로만 더 크고 눈에 띄게 만든다. */}
      <mesh
        ref={ringMeshRef}
        position={[dropZone[0], dropZone[1] + 0.006, dropZone[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[dropRadius * 1.08, dropRadius * DROP_ZONE_RING_MULTIPLIER, 32]} />
        <meshStandardMaterial
          ref={ringMatRef}
          color="#ff9f43"
          emissive="#ff9f43"
          emissiveIntensity={0.35}
          transparent
          opacity={0.9}
          side={DoubleSide}
        />
      </mesh>
      <primitive
        object={dropLabelSprite}
        position={[dropZone[0], dropZone[1] + LABEL_OFFSET_SMALL, dropZone[2]]}
      />
      {choices.map((choice, index) => (
        <DragToken
          key={choice.id}
          label={choice.label}
          origin={tokens[index] ?? tokens[0] ?? [0, 1.1, -2]}
          zones={zones}
          maxHitAreaScale={maxHitAreaScale}
          isDragging={draggingId === choice.id}
          onDragStart={() => setDraggingId(choice.id)}
          onHoverZoneChange={setZoneHot}
          onDragEnd={(committed) => {
            setDraggingId(null);
            setZoneHot(false);
            if (committed) onChoice(choice);
          }}
          emphasize={emphasize}
        />
      ))}
    </group>
  );
}

function DragToken({
  label,
  origin,
  zones,
  maxHitAreaScale,
  isDragging,
  onDragStart,
  onHoverZoneChange,
  onDragEnd,
  emphasize,
}: {
  label: string;
  origin: Vec3;
  zones: { id: string; x: number; z: number; radius: number }[];
  maxHitAreaScale: number;
  isDragging: boolean;
  onDragStart: () => void;
  onHoverZoneChange: (hot: boolean) => void;
  onDragEnd: (committed: boolean) => void;
  emphasize: boolean;
}) {
  // G2.1-R1-F5: 재료 mesh·라벨·보이지 않는 hit area를 하나의 group으로 묶어
  // 함께 움직이고, 셋 모두에 "완전히 같은" 핸들러 객체(dragHandlers)를 단다.
  // 즉 라벨 sprite가 먼저 교차되든, 재료 mesh가 교차되든, 넉넉한 투명
  // hit area가 교차되든 실행되는 함수는 물리적으로 동일하다 — 라벨이 뒤의
  // 작은 토큰을 가리는 구조가 원천적으로 성립할 수 없다.
  const groupRef = useRef<Group>(null);
  const hitRef = useRef<Mesh>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const labelSprite = useMemo(
    () => createLabelSprite(label, LABEL_SCALE_SMALL, emphasize),
    [label, emphasize],
  );
  // onPointerMove는 여기 최신 목표 좌표만 써두고, useFrame이 매 프레임 읽어 처리한다.
  const targetRef = useRef({ x: origin[0], z: origin[2] });
  const hotRef = useRef(false);
  const capturedPointerId = useRef<number | null>(null);
  const domElement = useThree((state) => state.gl.domElement);
  const camera = useThree((state) => state.camera);
  // G2.1-R1-F7: pointer down에서 한 번 정하고 pointer up까지 바꾸지 않는 드래그 평면.
  // 드래그 도중 평면이 바뀌면 그 프레임에 토큰이 튀므로 절대 갱신하지 않는다.
  const dragSessionRef = useRef<PlaceDragSession | null>(null);

  useFrame(({ clock, camera, size }) => {
    // G2.1-R1-F5(보강): hit area 크기를 고정 world 값으로 두지 않는다.
    // 매 프레임 실제 canvas CSS 크기(size)와 현재 카메라(FOV·거리 — CameraRig가
    // 화면 폭에 맞춰 계속 보정한다)로 이 토큰이 화면에서 몇 px인지 측정해,
    // 375px에서도 PLACE_HIT_AREA_MIN_PX(48 CSS px) 이상이 되도록 배율을 정한다.
    // 기준점은 드래그로 움직이는 현재 위치가 아니라 원위치(origin) — 잡기 전
    // 크기가 중요하고, 드래그 중에는 pointer capture로 이미 이 토큰에 고정된다.
    const hitMesh = hitRef.current;
    if (hitMesh) {
      camera.getWorldDirection(forwardScratch);
      const scale = placeHitAreaScale({
        center: [origin[0], origin[1] + PLACE_HIT_AREA_CENTER_Y, origin[2]],
        cameraPos: [camera.position.x, camera.position.y, camera.position.z],
        forward: [forwardScratch.x, forwardScratch.y, forwardScratch.z],
        fovDeg: (camera as PerspectiveCamera).fov,
        viewportWidthPx: size.width,
        viewportHeightPx: size.height,
        maxScale: maxHitAreaScale,
      });
      hitMesh.scale.setScalar(scale);
    }

    if (isDragging && groupRef.current) {
      const { x, z } = targetRef.current;
      groupRef.current.position.set(x, origin[1] + 0.07, z);
      const hot = hitTestDropZone({ x, z }, zones) !== null;
      if (hot !== hotRef.current) {
        hotRef.current = hot;
        onHoverZoneChange(hot);
      }
    }
    const material = matRef.current;
    if (material) {
      material.emissiveIntensity =
        hovered || isDragging ? 0.5 + Math.abs(Math.sin(clock.elapsedTime * 4)) * 0.3 : 0.1;
    }
  });

  // 드래그 도중 언마운트되면(다른 지점으로 전환 등) 캔버스에 남아있는 포인터
  // 캡처를 정리한다 — DOM 레벨 캡처는 React 생명주기와 별개로 남을 수 있다.
  // G2.1-R1-F5: hasPointerCapture로 실제 캡처가 남아있을 때만 해제를
  // 시도한다 — 이미 해제된(또는 R3F가 자체적으로 정리한) 포인터에 다시
  // releasePointerCapture를 호출하면 NotFoundError가 난다는 것을 실브라우저
  // QA에서 확인했다(원인 조사 결과는 완료 보고 참고).
  useEffect(() => {
    return () => {
      const id = capturedPointerId.current;
      if (id !== null && domElement.hasPointerCapture(id)) {
        try {
          domElement.releasePointerCapture(id);
        } catch {
          // no-op
        }
      }
    };
  }, [domElement]);

  const abortDrag = () => {
    hotRef.current = false;
    capturedPointerId.current = null;
    dragSessionRef.current = null;
    groupRef.current?.position.set(origin[0], origin[1], origin[2]);
    setHovered(false);
    onDragEnd(false);
  };

  // 라벨·재료·hit area가 공유하는 단 하나의 핸들러 묶음. 세 오브젝트에 같은
  // 객체를 그대로 펼쳐 넣으므로 "어느 것이 먼저 교차되든 동일한 드래그"가
  // 코드 수준에서 보장된다(어느 쪽이 eventObject가 되든 pointer capture·
  // event.ray 계산·드롭 판정 경로가 모두 같다).
  const dragHandlers = {
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      setHovered(true);
      setCursor("grab");
    },
    onPointerOut: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      if (!isDragging) setHovered(false);
      setCursor("auto");
    },
    onPointerDown: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      capturePointer(event);
      capturedPointerId.current = event.pointerId;
      camera.getWorldDirection(pointerForwardScratch);
      dragSessionRef.current = beginPlaceDrag({
        rayOrigin: [event.ray.origin.x, event.ray.origin.y, event.ray.origin.z],
        rayDirection: [event.ray.direction.x, event.ray.direction.y, event.ray.direction.z],
        cameraForward: [pointerForwardScratch.x, pointerForwardScratch.y, pointerForwardScratch.z],
        tokenOrigin: origin,
      });
      // 잡는 순간에는 토큰이 절대 움직이지 않는다 (grab offset이 라벨 어디를
      // 눌렀든 이동량 0에서 원위치를 돌려주므로 이 초기값과 정확히 일치한다).
      targetRef.current = { x: origin[0], z: origin[2] };
      hotRef.current = false;
      onDragStart();
      setCursor("grabbing");
    },
    onPointerMove: (event: ThreeEvent<PointerEvent>) => {
      if (!isDragging) return;
      event.stopPropagation();
      const session = dragSessionRef.current;
      if (!session) return;
      const hit = placeDragPoint(
        session,
        [event.ray.origin.x, event.ray.origin.y, event.ray.origin.z],
        [event.ray.direction.x, event.ray.direction.y, event.ray.direction.z],
      );
      if (hit) targetRef.current = hit;
    },
    onPointerUp: (event: ThreeEvent<PointerEvent>) => {
      if (!isDragging) return;
      event.stopPropagation();
      releasePointer(event);
      capturedPointerId.current = null;
      dragSessionRef.current = null;
      setCursor("auto");
      const hit = hitTestDropZone(targetRef.current, zones) !== null;
      if (!hit) {
        groupRef.current?.position.set(origin[0], origin[1], origin[2]);
      }
      hotRef.current = false;
      setHovered(false);
      onDragEnd(hit);
    },
    onPointerLeave: (event: ThreeEvent<PointerEvent>) => {
      if (!isDragging) return;
      event.stopPropagation();
      releasePointer(event);
      setCursor("auto");
      abortDrag();
    },
  };

  return (
    <group ref={groupRef} position={origin}>
      {/* 보이지 않는 통합 hit area — 재료 mesh보다 크고 라벨 세로 범위까지
          덮는다. 크기는 useFrame에서 화면 px 기준으로 매 프레임 보정한다. */}
      <mesh ref={hitRef} position={[0, PLACE_HIT_AREA_CENTER_Y, 0]} {...dragHandlers}>
        <boxGeometry args={PLACE_HIT_AREA_SIZE} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <mesh scale={isDragging ? 1.18 : hovered ? 1.08 : 1} {...dragHandlers}>
        <boxGeometry args={[0.22, 0.22, 0.22]} />
        <meshStandardMaterial ref={matRef} color="#e7b23c" emissive="#ffd166" emissiveIntensity={0.1} />
      </mesh>
      <primitive object={labelSprite} position={[0, LABEL_OFFSET_SMALL, 0]} {...dragHandlers} />
    </group>
  );
}

// ---------- order: x축 드래그 재정렬 + 별도 확인 오브젝트 ----------

function OrderTiles({
  slots,
  confirm,
  choices,
  onChoice,
  emphasize,
}: {
  slots: Vec3[];
  confirm: Vec3;
  choices: Choice[];
  onChoice: (choice: Choice) => void;
  emphasize: boolean;
}) {
  const [order, setOrder] = useState<string[]>(() => choices.map((choice) => choice.id));
  const slotX = useMemo(() => slots.map((slot) => slot[0]), [slots]);
  const y = slots[0]?.[1] ?? 1.18;
  const z = slots[0]?.[2] ?? -1.2;

  const orderedChoices = order
    .map((id) => choices.find((choice) => choice.id === id))
    .filter((choice): choice is Choice => Boolean(choice));

  return (
    <group>
      {orderedChoices.map((choice, index) => (
        <OrderTile
          key={choice.id}
          label={choice.label}
          index={index}
          slotX={slotX}
          y={y}
          z={z}
          onDragMove={(x) =>
            setOrder((previous) => reorderOnDrag(previous, choice.id, x, slotX))
          }
          emphasize={emphasize}
        />
      ))}
      <ConfirmProp
        position={confirm}
        onConfirm={() => {
          const first = orderedChoices[0];
          if (first) onChoice(first);
        }}
        emphasize={emphasize}
      />
    </group>
  );
}

function OrderTile({
  label,
  index,
  slotX,
  y,
  z,
  onDragMove,
  emphasize,
}: {
  label: string;
  index: number;
  slotX: number[];
  y: number;
  z: number;
  onDragMove: (x: number) => void;
  emphasize: boolean;
}) {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const labelSprite = useMemo(
    () => createLabelSprite(label, LABEL_SCALE_SMALL, emphasize),
    [label, emphasize],
  );
  const restX = slotX[index] ?? slotX[0] ?? 0;
  // onPointerMove는 여기 최신 목표 x만 써두고, useFrame이 매 프레임 읽어 처리한다
  // (재정렬 계산도 포인터 이벤트 빈도가 아니라 렌더 루프 주기로 이뤄져 튀지 않는다).
  const targetXRef = useRef(restX);
  const capturedPointerId = useRef<number | null>(null);
  const domElement = useThree((state) => state.gl.domElement);

  useFrame(({ clock }) => {
    if (dragging && meshRef.current) {
      const x = targetXRef.current;
      meshRef.current.position.set(x, y + 0.06, z);
      onDragMove(x);
    } else if (meshRef.current) {
      meshRef.current.position.x += (restX - meshRef.current.position.x) * 0.25;
    }
    const material = matRef.current;
    if (material) {
      material.emissiveIntensity =
        hovered || dragging ? 0.5 + Math.abs(Math.sin(clock.elapsedTime * 4)) * 0.3 : 0.1;
    }
  });

  // DragToken과 동일한 이유(언마운트 시 남은 포인터 캡처 정리) + 동일한
  // hasPointerCapture 가드 — G2.1-R1-F5 참고.
  useEffect(() => {
    return () => {
      const id = capturedPointerId.current;
      if (id !== null && domElement.hasPointerCapture(id)) {
        try {
          domElement.releasePointerCapture(id);
        } catch {
          // no-op
        }
      }
    };
  }, [domElement]);

  const endDrag = () => {
    capturedPointerId.current = null;
    setDragging(false);
    setHovered(false);
    setCursor("auto");
  };

  return (
    <mesh
      ref={meshRef}
      position={[restX, y, z]}
      scale={dragging ? 1.18 : hovered ? 1.08 : 1}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        setCursor("grab");
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        if (!dragging) setHovered(false);
        setCursor("auto");
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        capturePointer(event);
        capturedPointerId.current = event.pointerId;
        targetXRef.current = meshRef.current?.position.x ?? restX;
        setDragging(true);
        setCursor("grabbing");
      }}
      onPointerMove={(event) => {
        if (!dragging) return;
        event.stopPropagation();
        const hit = intersectRayWithPlaneY(
          [event.ray.origin.x, event.ray.origin.y, event.ray.origin.z],
          [event.ray.direction.x, event.ray.direction.y, event.ray.direction.z],
          y,
        );
        if (hit) targetXRef.current = hit.x;
      }}
      onPointerUp={(event) => {
        if (!dragging) return;
        event.stopPropagation();
        releasePointer(event);
        endDrag();
      }}
      onPointerLeave={(event) => {
        if (!dragging) return;
        event.stopPropagation();
        releasePointer(event);
        endDrag();
      }}
    >
      <boxGeometry args={[0.4, 0.13, 0.34]} />
      <meshStandardMaterial ref={matRef} color="#3f9c96" emissive="#3f9c96" emissiveIntensity={0.1} />
      <primitive object={labelSprite} position={[0, LABEL_OFFSET_SMALL, 0]} />
    </mesh>
  );
}

function ConfirmProp({
  position,
  onConfirm,
  emphasize,
}: {
  position: Vec3;
  onConfirm: () => void;
  emphasize: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const matRef = useRef<MeshStandardMaterial>(null);
  const labelSprite = useMemo(
    () => createLabelSprite("이 순서로 확정", LABEL_SCALE_SMALL, emphasize),
    [emphasize],
  );

  useFrame(({ clock }) => {
    const material = matRef.current;
    if (material) {
      material.emissiveIntensity = hovered
        ? 0.6 + Math.abs(Math.sin(clock.elapsedTime * 4)) * 0.3
        : 0.25;
    }
  });

  return (
    <mesh
      position={position}
      scale={hovered ? 1.12 : 1}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        setCursor("pointer");
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        setHovered(false);
        setCursor("auto");
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onConfirm();
      }}
    >
      <cylinderGeometry args={[0.17, 0.17, 0.11, 20]} />
      <meshStandardMaterial ref={matRef} color="#4caf7d" emissive="#4caf7d" emissiveIntensity={0.25} />
      <primitive object={labelSprite} position={[0, LABEL_OFFSET_SMALL, 0]} />
    </mesh>
  );
}
