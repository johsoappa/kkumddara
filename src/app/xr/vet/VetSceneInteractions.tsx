"use client";

// ====================================================
// VetSceneInteractions — 수의사 XR 인캔버스 직접 조작 (G2.2-R2-L)
//
// 수의사 원본 시나리오는 select(선택형)만 사용한다 — 드래그(place)·순서
// 교체(order)는 요리사 전용이라 이식하지 않는다.
//
// 이 컴포넌트는 onChoice(choice)를 호출할 뿐, 잠금(choiceLockRef)이나
// analytics는 절대 여기서 복제하지 않는다 — onChoice는 XrVetClient의
// handleChoice를 그대로 관통시킨 값이라 텍스트 버튼 경로와 완전히 같은
// 계약을 공유한다(포인터 1회 = handleChoice 1회 = analytics 1회).
//
// [G2.2-R2-L] 실제 화면 검수에서 "장면 속 큰 한글 라벨 카드가 인물·소품·
// 다른 카드와 겹치고, 나침반 단계에서는 카드 자체가 잘리거나 다른 카드의
// 글씨를 가려 식별하기 어렵다"는 문제가 확인됐다. 전체 문구를 띄우던 큰
// 라벨 스프라이트(0.85x0.42)를 제거하고, 대신 선택 순서를 가리키는 작은
// 번호 배지(1/2/3, 0.24x0.24)만 그린다 — 정확한 선택 문구는 Canvas 밖
// HTML 선택지(XrVetClient.tsx)가 같은 번호로 병기해 읽을 수 있게 한다.
// MIN_TARGET_SPACING(0.9) 대비 hit area 반경을 0.32로 낮춰(이전 0.4~0.45)
// 인접 타깃과 겹치지 않는 여유를 넉넉히 남겼다(sceneLayout.test.ts가
// 이 여유를 회귀 검증한다).
//
// "이름 있는" 타깃(dog/guardian/senior/clipboard/cabinet)은 VetScene이
// 항상 그 자리에 캐릭터/소품을 렌더링하고, 이 컴포넌트는 그 위에 "지금
// 선택 가능함"을 알리는 하이라이트 링·번호 배지만 얹는다(캐릭터 자신의
// 형태는 바꾸지 않는다). "icon" 타깃(예: "다른 방법을 생각해본다")은 그
// 지점에서만 잠깐 나타나는 추상 소품이라 이 컴포넌트가 직접 지오메트리까지
// 그린다.
// ====================================================

import { useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { Group, MeshStandardMaterial } from "three";
import type { Choice } from "./scenario";
import type { ResolvedTarget, Vec3 } from "./sceneLayout";
import { createVetLabelSprite } from "./vetLabelSprite";

export interface VetSceneInteractionsProps {
  targets: ResolvedTarget[];
  onChoice: (choice: Choice) => void;
}

/** hit area 반경 — MIN_TARGET_SPACING(0.9)의 절반보다 작게 잡아 인접
 *  타깃과 겹치지 않는다(sceneLayout.test.ts가 이 관계를 회귀 검증). */
const HIT_AREA_RADIUS = 0.32;
const BADGE_SCALE: [number, number] = [0.24, 0.24];

function setCursor(value: string) {
  if (typeof document !== "undefined") {
    document.body.style.cursor = value;
  }
}

/** 선택 순서를 나타내는 작은 번호 배지 — 전체 문구 대신 숫자만 그린다. */
function NumberBadge({ number, hovered }: { number: number; hovered: boolean }) {
  const sprite = useMemo(() => createVetLabelSprite(String(number), BADGE_SCALE), [number]);
  return <primitive object={sprite} position={[0, 0.34, 0]} scale={hovered ? 1.12 : 1} />;
}

/** 항상 카메라를 향하는 얇은 링 하이라이트 — "이름 있는" 캐릭터/소품 발밑에 얹어
 *  실제 형태는 바꾸지 않으면서 "지금 탭 가능"임을 알린다. */
function HighlightRing({
  position,
  number,
  onSelect,
}: {
  position: Vec3;
  number: number;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const ringMatRef = useRef<MeshStandardMaterial>(null);

  // 항상 은은하게 펄스 — 호버 이전(=터치 기기)에도 "여기 누를 수 있다"는 신호를 준다.
  useFrame(({ clock }) => {
    const material = ringMatRef.current;
    if (material) {
      const base = hovered ? 0.75 : 0.4;
      material.emissiveIntensity = base + Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.35;
    }
  });

  return (
    <group position={position}>
      {/* 보이지 않는 hit area — 인접 타깃과 겹치지 않도록 HIT_AREA_RADIUS로 고정 */}
      <mesh
        visible={false}
        onPointerOver={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          setHovered(true);
          setCursor("pointer");
        }}
        onPointerOut={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          setHovered(false);
          setCursor("auto");
        }}
        onPointerDown={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[HIT_AREA_RADIUS, 12, 12]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]} scale={hovered ? 1.12 : 1}>
        <ringGeometry args={[0.26, 0.34, 24]} />
        <meshStandardMaterial
          ref={ringMatRef}
          color="#ff8a65"
          emissive="#ff8a65"
          emissiveIntensity={0.4}
          transparent
          opacity={0.92}
        />
      </mesh>
      <NumberBadge number={number} hovered={hovered} />
    </group>
  );
}

/** 특정 지점에서만 등장하는 추상 아이콘 소품(예: 아이디어·비교·전체 살피기) — 형태는 단순한
 *  둥근 도형 조합으로 의미를 표현하고, 항상 위아래로 살짝 떠다녀 "임시로 나타난 선택지"임을 알린다. */
function IconTarget({
  position,
  variant,
  number,
  onSelect,
}: {
  position: Vec3;
  variant: "idea" | "together" | "overview" | "compare";
  number: number;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<Group>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  const baseY = position[1];

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = baseY + Math.sin(clock.elapsedTime * 1.6) * 0.05;
    }
    const material = matRef.current;
    if (material) {
      const base = hovered ? 0.75 : 0.4;
      material.emissiveIntensity = base + Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.3;
    }
  });

  const color = variant === "idea" ? "#ffd166" : variant === "together" ? "#ff8a73" : variant === "overview" ? "#7fd8c9" : "#8ec6ff";

  return (
    <group ref={groupRef} position={position}>
      <mesh
        visible={false}
        onPointerOver={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          setHovered(true);
          setCursor("pointer");
        }}
        onPointerOut={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          setHovered(false);
          setCursor("auto");
        }}
        onPointerDown={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[HIT_AREA_RADIUS, 12, 12]} />
      </mesh>
      {variant === "idea" && (
        <>
          <mesh scale={hovered ? 1.15 : 1}>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshStandardMaterial ref={matRef} color="#fff3c4" emissive={color} emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0, -0.16, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
            <meshStandardMaterial color="#c9a86a" />
          </mesh>
        </>
      )}
      {variant === "together" && (
        <mesh scale={hovered ? 1.15 : 1}>
          <torusGeometry args={[0.14, 0.06, 12, 24]} />
          <meshStandardMaterial ref={matRef} color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
      )}
      {variant === "overview" && (
        <mesh scale={hovered ? 1.15 : 1}>
          <octahedronGeometry args={[0.18, 0]} />
          <meshStandardMaterial ref={matRef} color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
      )}
      {variant === "compare" && (
        <group scale={hovered ? 1.15 : 1}>
          <mesh position={[-0.09, 0, 0]}>
            <sphereGeometry args={[0.11, 14, 14]} />
            <meshStandardMaterial ref={matRef} color={color} emissive={color} emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0.09, 0, 0]}>
            <sphereGeometry args={[0.11, 14, 14]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
          </mesh>
        </group>
      )}
      <NumberBadge number={number} hovered={hovered} />
    </group>
  );
}

export default function VetSceneInteractions({ targets, onChoice }: VetSceneInteractionsProps) {
  return (
    <group>
      {targets.map(({ target, choice }, index) => {
        const number = index + 1;
        if (target.kind === "icon") {
          return (
            <IconTarget
              key={choice.id}
              position={target.position}
              variant={target.variant}
              number={number}
              onSelect={() => onChoice(choice)}
            />
          );
        }
        return (
          <HighlightRing
            key={choice.id}
            position={target.position}
            number={number}
            onSelect={() => onChoice(choice)}
          />
        );
      })}
    </group>
  );
}
