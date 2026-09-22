"use client";

// ====================================================
// VetSceneInteractions — 수의사 XR 인캔버스 직접 조작 (G2.2-R2-L2)
//
// [배경] G2.2-R2-L에서는 "카드가 화면의 주인공이 된다"는 검수 지적이
// 있었다 — 번호로 문구를 줄여도, 별도의 떠 있는 카드(번호 배지 + 하이라이트
// 링)가 여전히 인물·강아지·서로를 가리는 시각적 주인공이었다. 이번(L2)에는
// "선택 대상마다 별도의 마커 오브젝트를 그린다"는 접근 자체를 버렸다.
//
// 이 파일은 더 이상 SCENE_TARGETS를 순회하며 마커를 그리지 않는다. 대신
// VetScene.tsx가 강아지·보호자·선배 수의사·기록판·약장·모니터·병원 사인
// 같은 "실제 진료실 오브젝트" 컴포넌트 각각에게 이 파일이 내보내는 두
// 조각(TapHitBox/BaseHighlight)을 자기 group 안에 직접 끼워 넣게 한다 —
// 즉 상호작용이 오브젝트 자신의 일부가 된다(오브젝트 위에 카드를 얹지 않는다).
//
//   - TapHitBox: 보이지 않는 hit area. 크기를 오브젝트별로 다르게 줄 수 있어
//     "그 오브젝트를 직접 눌렀을 때"만 반응한다(화면 빈 곳 전체가 아님).
//   - BaseHighlight: 오브젝트 발밑/받침대 높이에 얹는 아주 작은 링(지름
//     0.32~0.44) — 얼굴·몸통보다 항상 아래에 위치해 가리지 않는다. 항상
//     은은하게 펄스해 "여기 누를 수 있다"를 알리고, 활성(active)일 때만
//     렌더된다(비활성 지점에서는 아예 나타나지 않는다).
//
// onSelect는 XrVetClient의 handleChoice를 그대로 관통시킨 값이라 잠금·
// analytics는 이 파일에 전혀 없다(포인터 1회 = handleChoice 1회).
// ====================================================

import { useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { MeshStandardMaterial } from "three";

function setCursor(value: string) {
  if (typeof document !== "undefined") {
    document.body.style.cursor = value;
  }
}

export interface TapHitBoxProps {
  /** 로컬 좌표 기준 hit box 크기 [width, height, depth] — 오브젝트 실루엣을 감싸는 정도면 충분하다. */
  size: [number, number, number];
  /** hit box 중심의 로컬 y 오프셋(오브젝트 group 원점 기준) — 기본 0. */
  centerY?: number;
  onSelect: () => void;
  onHoverChange?: (hovered: boolean) => void;
}

/** 오브젝트 자신의 group 안에 넣는 보이지 않는 클릭 영역. 오브젝트 형태를 전혀
 *  바꾸지 않는다 — 그 위에 덧그리는 카드가 없다. */
export function TapHitBox({ size, centerY = 0, onSelect, onHoverChange }: TapHitBoxProps) {
  return (
    <mesh
      visible={false}
      position={[0, centerY, 0]}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        onHoverChange?.(true);
        setCursor("pointer");
      }}
      onPointerOut={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        onHoverChange?.(false);
        setCursor("auto");
      }}
      onPointerDown={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <boxGeometry args={size} />
    </mesh>
  );
}

export interface BaseHighlightProps {
  /** 링이 놓일 로컬 y(발밑·받침대 높이) — 오브젝트 group 원점 기준. */
  y: number;
  hovered: boolean;
  /** 기본 0.17/0.22 — 필요하면 좁은 소품(기록판 등)에서 더 작게 줄일 수 있다. */
  innerRadius?: number;
  outerRadius?: number;
  color?: string;
}

/** 오브젝트 발밑/받침대 높이에만 놓는 아주 작은 링 — 얼굴·몸통보다 항상
 *  아래에 있어 가리지 않는다. 활성 타깃일 때만 부모가 이 컴포넌트를 렌더한다. */
export function BaseHighlight({
  y,
  hovered,
  innerRadius = 0.17,
  outerRadius = 0.22,
  color = "#ff8a65",
}: BaseHighlightProps) {
  const matRef = useRef<MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const material = matRef.current;
    if (material) {
      const base = hovered ? 0.7 : 0.35;
      material.emissiveIntensity = base + Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.3;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} scale={hovered ? 1.15 : 1}>
      <ringGeometry args={[innerRadius, outerRadius, 24]} />
      <meshStandardMaterial
        ref={matRef}
        color={color}
        emissive={color}
        emissiveIntensity={0.35}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

/** hover 상태만 들고 있는 작은 훅 — 각 오브젝트 컴포넌트가 반복 작성하지 않게 한다. */
export function useTapHover() {
  const [hovered, setHovered] = useState(false);
  return { hovered, setHovered };
}
