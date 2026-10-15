"use client";

// ====================================================
// FriedRiceCookParts — 3~5단계(조리 순서·불 조절·플레이팅·전달)의 3D 소품 (F11-3~5)
//
// 순수 표시 컴포넌트다. 상태는 소유하지 않고 FriedRiceScene이 내려준 값만 그린다.
//  - FryingPan: 버너 + 팬 + 팬 안의 재료(넣은 순서대로) + 불꽃(불 세기 모양: 개수·높이로도 구분)
//  - HeatKnob: 불 세기 손잡이(약·중·강). 누르면 선택, 선택된 손잡이는 올라오고 테두리가 생긴다
//  - ServePlate: 접시(놓는 곳 테두리·반짝임) + 담긴 볶음밥
//  - ServeBell: 전달 벨(담은 뒤에만 누를 수 있다)
//  - FriedRiceMound: 볶은 음식 덩어리 — 끌어서 접시로 옮기는 대상
// 어떤 mesh에도 정오 평가를 암시하는 표시는 없다. 선배 요리사와 마찬가지로 조작 대상이 아닌 소품은 포인터 핸들러가 없다.
// ====================================================

import { useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { Group, MeshStandardMaterial } from "three";
import { DoubleSide } from "three";
import { LABEL_OFFSET_SMALL, type Vec3 } from "./interactions3d";
import type { HeatLevel, IngredientId } from "./friedRice";
import { KNOB_HIT_WIDTH, KNOB_LABEL_CENTER_Y, KNOB_LABEL_SCALE, PLATE, WOK, WOK_LIFT } from "./friedRiceLayout";
import { createLabelSprite } from "./labelSprite";
import { setCursor, usePrefersReducedMotion, type TrayFeedback } from "./friedRiceSceneUtils";
import type { MutableRefObject } from "react";

const SMALL_LABEL: [number, number] = [0.46, 0.24];

function Label({ text, position, scale = SMALL_LABEL }: { text: string; position: Vec3; scale?: [number, number] }) {
  const sprite = useMemo(() => createLabelSprite(text, scale, true), [text, scale]);
  return <primitive object={sprite} position={position} />;
}

// ---------- 볶은 음식 ----------

/**
 * 밥에 당근·완두콩이 섞인 볶음밥 덩어리.
 * 덩어리 표면에 황금각 간격으로 세 종류를 고르게 흩뿌려 "섞인" 모양이 한눈에 읽히게 한다:
 *  - 주황 네모 조각(당근) / 초록 동그라미(완두콩) / 흰 쌀알(밥). 크기가 서로 달라 실루엣만으로도 구분된다.
 */
const MOUND_BITS = (() => {
  const bits: { kind: "carrot" | "pea" | "rice"; p: Vec3; rot: number }[] = [];
  const count = 34;
  for (let i = 0; i < count; i += 1) {
    const angle = i * 2.39996; // 황금각
    const radius = Math.sqrt((i + 0.5) / count) * 0.17;
    // 덩어리(반지름 0.2, 세로 0.62배, 중심 y 0.1) 표면 높이
    const surface = 0.1 + 0.62 * Math.sqrt(Math.max(0, 0.04 - radius * radius));
    const kind = i % 3 === 0 ? "carrot" : i % 3 === 1 ? "pea" : "rice";
    bits.push({
      kind,
      p: [Math.cos(angle) * radius, surface + (kind === "rice" ? 0.012 : 0.02), Math.sin(angle) * radius],
      rot: (i * 0.9) % 3.1,
    });
  }
  return bits;
})();

export function FriedRiceMound({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.1, 0]} scale={[1, 0.62, 1]}>
        <sphereGeometry args={[0.2, 20, 14]} />
        <meshStandardMaterial color="#ecd29a" />
      </mesh>
      {MOUND_BITS.map((bit, index) => (
        <mesh key={index} position={bit.p} rotation={[0.4, bit.rot, 0.3]} scale={bit.kind === "rice" ? [1.6, 0.7, 0.9] : 1}>
          {bit.kind === "pea" ? (
            <sphereGeometry args={[0.034, 8, 8]} />
          ) : bit.kind === "carrot" ? (
            <boxGeometry args={[0.062, 0.04, 0.062]} />
          ) : (
            <sphereGeometry args={[0.024, 6, 6]} />
          )}
          <meshStandardMaterial
            color={bit.kind === "carrot" ? "#f08a1f" : bit.kind === "pea" ? "#4fae3f" : "#fffaf0"}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---------- 팬 ----------

/** 팬 깊이 비율(반지름 대비) — 얕게 만들어 카메라(거의 수평)에서도 안의 재료가 보이게 한다 */
const WOK_DEPTH_RATIO = 0.35;
/** 팬 안 재료 자리 간격(넣은 순서대로 왼쪽→오른쪽) — 번호 이름표(폭 0.26)가 겹치지 않는 간격 */
const WOK_SLOT_GAP = 0.3;

const FLAME_COUNT: Record<HeatLevel, number> = { low: 4, medium: 7, high: 10 };
const FLAME_HEIGHT: Record<HeatLevel, number> = { low: 0.06, medium: 0.11, high: 0.17 };

function WokContent({ id, order }: { id: IngredientId; order: number }) {
  // 넣은 순서대로 왼쪽→오른쪽 자리에 놓여, 3D에서도 순서가 보인다
  const x = (order - 1) * WOK_SLOT_GAP;
  if (id === "rice") {
    return (
      <group position={[x, 0, 0]}>
        <mesh position={[0, 0.05, 0]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.12, 14, 10]} />
          <meshStandardMaterial color="#fffaf0" />
        </mesh>
      </group>
    );
  }
  if (id === "carrot") {
    return (
      <group position={[x, 0, 0]}>
        {[
          [-0.04, 0.03, 0.04],
          [0.04, 0.03, -0.03],
          [0.02, 0.07, 0.05],
          [-0.05, 0.07, -0.04],
        ].map((p) => (
          <mesh key={p.join()} position={p as Vec3}>
            <boxGeometry args={[0.07, 0.05, 0.07]} />
            <meshStandardMaterial color="#f29a2e" />
          </mesh>
        ))}
      </group>
    );
  }
  return (
    <group position={[x, 0, 0]}>
      {[
        [-0.05, 0.03, 0.03],
        [0.05, 0.03, 0.02],
        [0, 0.03, -0.05],
        [-0.02, 0.08, 0.0],
        [0.03, 0.08, -0.02],
      ].map((p) => (
        <mesh key={p.join()} position={p as Vec3}>
          <sphereGeometry args={[0.04, 10, 10]} />
          <meshStandardMaterial color="#62b34a" />
        </mesh>
      ))}
    </group>
  );
}

export function FryingPan({
  wok,
  heat,
  showItems,
}: {
  wok: readonly IngredientId[];
  heat: HeatLevel | null;
  /**
   * 넣은 재료를 팬 안에 그릴지. 3·4단계에서는 true, 5단계에서는 false —
   * 다 볶은 볶음밥은 끌 수 있는 별도 소품(FriedRiceMound)이라 팬 안에 중복해서 그리지 않는다.
   */
  showItems: boolean;
}) {
  const [cx, cy, cz] = WOK.center;
  const bottomY = WOK.rimY - WOK.radius * WOK_DEPTH_RATIO;
  const flames = heat ? FLAME_COUNT[heat] : 0;
  const flameH = heat ? FLAME_HEIGHT[heat] : 0;
  return (
    <group position={[cx, 0, cz]}>
      {/* 화덕 받침대 + 버너 */}
      <mesh position={[0, cy + WOK_LIFT / 2, 0]}>
        <cylinderGeometry args={[0.3, 0.36, WOK_LIFT, 24]} />
        <meshStandardMaterial color="#5a6068" />
      </mesh>
      <mesh position={[0, cy + WOK_LIFT + 0.045, 0]}>
        <cylinderGeometry args={[0.34, 0.38, 0.09, 24]} />
        <meshStandardMaterial color="#3b3f45" />
      </mesh>
      {/* 불꽃: 개수와 높이로 세기를 구분한다(색에만 기대지 않는다) */}
      {Array.from({ length: flames }).map((_, i) => {
        const angle = (i / flames) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.3, cy + WOK_LIFT + 0.09 + flameH / 2, Math.sin(angle) * 0.3]}>
            <coneGeometry args={[0.035, flameH, 6]} />
            <meshStandardMaterial color="#ff9f43" emissive="#ff6b2b" emissiveIntensity={0.7} />
          </mesh>
        );
      })}
      {/* 팬 몸통(아래 반구를 납작하게) */}
      <mesh position={[0, WOK.rimY, 0]} scale={[1, WOK_DEPTH_RATIO, 1]}>
        <sphereGeometry args={[WOK.radius, 28, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#4a4f56" side={DoubleSide} />
      </mesh>
      <mesh position={[0, WOK.rimY, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[WOK.radius, 0.022, 8, 32]} />
        <meshStandardMaterial color="#2f3338" />
      </mesh>
      {/* 손잡이 */}
      <mesh position={[WOK.radius + 0.16, WOK.rimY + 0.01, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.32, 8]} />
        <meshStandardMaterial color="#2f3338" />
      </mesh>
      {/* 팬 안: 넣은 재료(순서대로) 또는 섞인 볶음밥 */}
      <group position={[0, bottomY + 0.14, 0]}>
        {showItems && wok.map((id, index) => <WokContent key={id} id={id} order={index} />)}
      </group>
      {/* 넣은 순서 번호(1·2·3) — 3단계에서 순서가 한눈에 보이게 */}
      {showItems &&
        wok.map((id, index) => (
          <Label
            key={id}
            text={`${index + 1}`}
            position={[(index - 1) * WOK_SLOT_GAP, WOK.rimY + 0.3, 0]}
            scale={[0.26, 0.13]}
          />
        ))}
    </group>
  );
}

// ---------- 불 손잡이 ----------

const KNOB_COLOR: Record<HeatLevel, string> = { low: "#6fa3c7", medium: "#e7b23c", high: "#d94f3c" };
const KNOB_LABEL: Record<HeatLevel, string> = { low: "약불", medium: "중불", high: "강불" };
const KNOB_FLAMES: Record<HeatLevel, number> = { low: 1, medium: 2, high: 3 };

export function HeatKnob({
  level,
  position,
  selected,
  interactive,
  onPress,
}: {
  level: HeatLevel;
  position: Vec3;
  selected: boolean;
  interactive: boolean;
  onPress: (level: HeatLevel) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<Group>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    if (group) {
      const target = selected ? 0.07 : hovered ? 0.03 : 0;
      group.position.y = reduced ? target : group.position.y + (target - group.position.y) * Math.min(1, delta * 12);
    }
    if (matRef.current) {
      matRef.current.emissiveIntensity = selected ? 0.55 + (reduced ? 0 : Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.15) : 0.1;
    }
  });
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
          onPress(level);
        },
      }
    : {};
  return (
    <group position={position} {...handlers}>
      {/* 넉넉한 누르는 영역 */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[KNOB_HIT_WIDTH, 0.4, 0.46]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <group ref={groupRef}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.17, 0.19, 0.1, 22]} />
          <meshStandardMaterial ref={matRef} color={KNOB_COLOR[level]} emissive={KNOB_COLOR[level]} emissiveIntensity={0.1} />
        </mesh>
        {/* 손잡이 위 불꽃 표시 — 약 1개, 중 2개, 강 3개 */}
        {Array.from({ length: KNOB_FLAMES[level] }).map((_, i) => (
          <mesh key={i} position={[(i - (KNOB_FLAMES[level] - 1) / 2) * 0.09, 0.14, 0]}>
            <coneGeometry args={[0.035, 0.09, 6]} />
            <meshStandardMaterial color="#fff6e8" />
          </mesh>
        ))}
      </group>
      {selected && (
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.25, 28]} />
          <meshBasicMaterial color="#ff9f43" side={DoubleSide} />
        </mesh>
      )}
      <Label
        text={selected ? `${KNOB_LABEL[level]} ✓` : KNOB_LABEL[level]}
        position={[0, KNOB_LABEL_CENTER_Y, 0]}
        scale={KNOB_LABEL_SCALE}
      />
    </group>
  );
}

// ---------- 접시·벨 ----------

export function ServePlate({
  feedback,
  active,
  plated,
}: {
  feedback: MutableRefObject<TrayFeedback>;
  /** 담기 전(놓는 곳 테두리 표시) */
  active: boolean;
  plated: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const ringRef = useRef<MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    const fb = feedback.current;
    const flashAge = (performance.now() - fb.flashAt) / 1000;
    const flash = fb.flashAt > 0 && flashAge < 0.6 ? 1 - flashAge / 0.6 : 0;
    const idle = reduced ? 0.35 : 0.35 + Math.abs(Math.sin(clock.elapsedTime * 2)) * 0.12;
    const level = fb.hot ? 1 : fb.dragging ? 0.65 : idle;
    if (ringRef.current) ringRef.current.emissiveIntensity = Math.max(level, flash);
  });
  const [px, py, pz] = PLATE.center;
  return (
    <group position={[px, py, pz]}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[PLATE.radius, PLATE.radius * 0.8, 0.04, 32]} />
        <meshStandardMaterial color="#f5f2ea" />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[PLATE.radius * 0.7, PLATE.radius * 0.7, 0.01, 32]} />
        <meshStandardMaterial color="#e9e4d6" />
      </mesh>
      {active && (
        <mesh position={[0, 0.052, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[PLATE.radius * 0.88, PLATE.radius * 1.02, 40]} />
          <meshStandardMaterial ref={ringRef} color="#ff9f43" emissive="#ff9f43" emissiveIntensity={0.35} side={DoubleSide} />
        </mesh>
      )}
      {plated && (
        <group position={[0, 0.045, 0]}>
          <FriedRiceMound scale={1.05} />
        </group>
      )}
    </group>
  );
}

export function ServeBell({
  position,
  interactive,
  onPress,
  rung,
}: {
  position: Vec3;
  interactive: boolean;
  onPress: () => void;
  /** 이미 눌러 전달했는가 — 눌린 모양으로 낮춘다 */
  rung: boolean;
}) {
  const [hovered, setHovered] = useState(false);
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
          onPress();
        },
      }
    : {};
  return (
    <group position={position} scale={hovered ? 1.08 : 1} {...handlers}>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.4, 0.34, 0.4]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.17, 0.19, 0.04, 22]} />
        <meshStandardMaterial color="#8a6f4d" />
      </mesh>
      <mesh position={[0, rung ? 0.05 : 0.07, 0]} scale={[1, 0.8, 1]}>
        <sphereGeometry args={[0.15, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#d9c25a" />
      </mesh>
      <mesh position={[0, rung ? 0.15 : 0.2, 0]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#b9a13a" />
      </mesh>
      <Label text="전달 벨" position={[0, LABEL_OFFSET_SMALL + 0.04, 0]} />
    </group>
  );
}
