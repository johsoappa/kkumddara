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
// setPointerCapture, onPointerMove에서 e.point(월드 좌표)를 그대로
// 사용, onPointerUp에서 releasePointerCapture. 이는 Pointer Events
// 표준 위에서 동작하므로 마우스/터치 분기 코드가 필요 없다.
// ====================================================

import { useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { Mesh, MeshStandardMaterial } from "three";
import type { Choice, InteractionKind } from "./scenario";
import {
  SCENE_ANCHORS,
  hitTestDropZone,
  reorderOnDrag,
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

export default function SceneInteractions({
  sceneInteractionId,
  interactionKind,
  choices,
  onChoice,
}: SceneInteractionsProps) {
  const anchor = SCENE_ANCHORS[sceneInteractionId];

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
      <SelectTargets key={sceneInteractionId} targets={anchor.targets} choices={choices} onChoice={onChoice} />
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
    />
  );
}

// ---------- select: 씬 안 오브젝트를 직접 클릭/터치 ----------

function SelectTargets({
  targets,
  choices,
  onChoice,
}: {
  targets: Vec3[];
  choices: Choice[];
  onChoice: (choice: Choice) => void;
}) {
  return (
    <group>
      {choices.map((choice, index) => (
        <SelectTarget
          key={choice.id}
          position={targets[index] ?? targets[0] ?? [0, 1.2, -1.2]}
          label={choice.label}
          onSelect={() => onChoice(choice)}
        />
      ))}
    </group>
  );
}

function SelectTarget({
  position,
  label,
  onSelect,
}: {
  position: Vec3;
  label: string;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const matRef = useRef<MeshStandardMaterial>(null);
  const labelSprite = useMemo(() => createLabelSprite(label), [label]);

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
      <primitive object={labelSprite} position={[0, 0.34, 0]} />
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
}: {
  tokens: Vec3[];
  dropZone: Vec3;
  dropRadius: number;
  choices: Choice[];
  onChoice: (choice: Choice) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [zoneHot, setZoneHot] = useState(false);
  const dropMatRef = useRef<MeshStandardMaterial>(null);
  const zones = useMemo(
    () => [{ id: "drop", x: dropZone[0], z: dropZone[2], radius: dropRadius }],
    [dropZone, dropRadius],
  );

  useFrame(({ clock }) => {
    const material = dropMatRef.current;
    if (material) {
      material.emissiveIntensity = zoneHot
        ? 0.6 + Math.abs(Math.sin(clock.elapsedTime * 4)) * 0.3
        : 0.18;
    }
  });

  return (
    <group>
      <mesh position={dropZone}>
        <cylinderGeometry args={[dropRadius, dropRadius, 0.02, 24]} />
        <meshStandardMaterial
          ref={dropMatRef}
          color="#ffe9a8"
          emissive="#ffd166"
          emissiveIntensity={0.18}
          transparent
          opacity={0.85}
        />
      </mesh>
      {choices.map((choice, index) => (
        <DragToken
          key={choice.id}
          label={choice.label}
          origin={tokens[index] ?? tokens[0] ?? [0, 1.1, -2]}
          zones={zones}
          isDragging={draggingId === choice.id}
          onDragStart={() => setDraggingId(choice.id)}
          onHoverZoneChange={setZoneHot}
          onDragEnd={(committed) => {
            setDraggingId(null);
            setZoneHot(false);
            if (committed) onChoice(choice);
          }}
        />
      ))}
    </group>
  );
}

function DragToken({
  label,
  origin,
  zones,
  isDragging,
  onDragStart,
  onHoverZoneChange,
  onDragEnd,
}: {
  label: string;
  origin: Vec3;
  zones: { id: string; x: number; z: number; radius: number }[];
  isDragging: boolean;
  onDragStart: () => void;
  onHoverZoneChange: (hot: boolean) => void;
  onDragEnd: (committed: boolean) => void;
}) {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const labelSprite = useMemo(() => createLabelSprite(label, [0.58, 0.3]), [label]);
  const liveXZ = useRef({ x: origin[0], z: origin[2] });

  useFrame(({ clock }) => {
    const material = matRef.current;
    if (material) {
      material.emissiveIntensity =
        hovered || isDragging ? 0.5 + Math.abs(Math.sin(clock.elapsedTime * 4)) * 0.3 : 0.1;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={origin}
      scale={isDragging ? 1.18 : hovered ? 1.08 : 1}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        setCursor("grab");
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        if (!isDragging) setHovered(false);
        setCursor("auto");
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        capturePointer(event);
        liveXZ.current = { x: origin[0], z: origin[2] };
        onDragStart();
        setCursor("grabbing");
      }}
      onPointerMove={(event) => {
        if (!isDragging) return;
        event.stopPropagation();
        const { x, z } = event.point;
        liveXZ.current = { x, z };
        meshRef.current?.position.set(x, origin[1] + 0.07, z);
        onHoverZoneChange(hitTestDropZone({ x, z }, zones) !== null);
      }}
      onPointerUp={(event) => {
        if (!isDragging) return;
        event.stopPropagation();
        releasePointer(event);
        setCursor("auto");
        const hit = hitTestDropZone(liveXZ.current, zones) !== null;
        if (!hit) {
          meshRef.current?.position.set(origin[0], origin[1], origin[2]);
        }
        setHovered(false);
        onDragEnd(hit);
      }}
    >
      <boxGeometry args={[0.22, 0.22, 0.22]} />
      <meshStandardMaterial ref={matRef} color="#e7b23c" emissive="#ffd166" emissiveIntensity={0.1} />
      <primitive object={labelSprite} position={[0, 0.28, 0]} />
    </mesh>
  );
}

// ---------- order: x축 드래그 재정렬 + 별도 확인 오브젝트 ----------

function OrderTiles({
  slots,
  confirm,
  choices,
  onChoice,
}: {
  slots: Vec3[];
  confirm: Vec3;
  choices: Choice[];
  onChoice: (choice: Choice) => void;
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
        />
      ))}
      <ConfirmProp
        position={confirm}
        onConfirm={() => {
          const first = orderedChoices[0];
          if (first) onChoice(first);
        }}
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
}: {
  label: string;
  index: number;
  slotX: number[];
  y: number;
  z: number;
  onDragMove: (x: number) => void;
}) {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const labelSprite = useMemo(() => createLabelSprite(label, [0.58, 0.3]), [label]);
  const restX = slotX[index] ?? slotX[0] ?? 0;

  useFrame(({ clock }) => {
    if (!dragging && meshRef.current) {
      meshRef.current.position.x += (restX - meshRef.current.position.x) * 0.25;
    }
    const material = matRef.current;
    if (material) {
      material.emissiveIntensity =
        hovered || dragging ? 0.5 + Math.abs(Math.sin(clock.elapsedTime * 4)) * 0.3 : 0.1;
    }
  });

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
        setDragging(true);
        setCursor("grabbing");
      }}
      onPointerMove={(event) => {
        if (!dragging) return;
        event.stopPropagation();
        meshRef.current?.position.set(event.point.x, y + 0.06, z);
        onDragMove(event.point.x);
      }}
      onPointerUp={(event) => {
        if (!dragging) return;
        event.stopPropagation();
        releasePointer(event);
        setDragging(false);
        setHovered(false);
        setCursor("auto");
      }}
    >
      <boxGeometry args={[0.4, 0.13, 0.34]} />
      <meshStandardMaterial ref={matRef} color="#3f9c96" emissive="#3f9c96" emissiveIntensity={0.1} />
      <primitive object={labelSprite} position={[0, 0.28, 0]} />
    </mesh>
  );
}

function ConfirmProp({ position, onConfirm }: { position: Vec3; onConfirm: () => void }) {
  const [hovered, setHovered] = useState(false);
  const matRef = useRef<MeshStandardMaterial>(null);
  const labelSprite = useMemo(() => createLabelSprite("이 순서로 확정", [0.58, 0.3]), []);

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
      <primitive object={labelSprite} position={[0, 0.29, 0]} />
    </mesh>
  );
}
