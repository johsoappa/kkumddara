"use client";

// ====================================================
// VetDogR4 — 수의사 XR R4-A1: 콩이 외형·자세·관찰 반응 (신규)
//
// R4 프로토타입(?r4=1)에서만 쓰인다(기본 R3의 Dog는 그대로). 기존 콩이는 몸통·머리 구
// 덩어리라 다리·목·표정이 읽히지 않았다. 이 컴포넌트는 몸통·가슴·엉덩이, 앞뒤 네 다리와
// 발, 목줄, 머리(주둥이·코·눈·눈 반짝임), 접히는 양쪽 귀, 꼬리를 별도 관절로 만든다.
// 자세(엎드림 resting / 고개 든 alert / 관찰 중 observing)는 dogPoses(r4Prototype.ts)의
// 관절 값을 부드럽게 따라간다 — 색은 자세·선택 상태와 무관한 고정값이다.
// ====================================================

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { DOG_POSES, lerpDogPose, type DogPose, type DogPoseName } from "./r4Prototype";
import { BaseHighlight, TapHitBox, useTapHover } from "./VetSceneInteractions";

const FUR = "#e8c9a0";
const FUR_DARK = "#c9a06a";
const FUR_LIGHT = "#fbf3e6";
const PAW = "#e0bd93";

interface Props {
  position: [number, number, number];
  yaw: number;
  poseName: DogPoseName;
  active: boolean;
  onSelect?: () => void;
}

function reduced(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

export default function VetDogR4({ position, yaw, poseName, active, onSelect }: Props) {
  const { hovered, setHovered } = useTapHover();
  const target = DOG_POSES[poseName];
  const current = useRef<DogPose>(target);
  const noMotion = useMemo(() => reduced(), []);

  const body = useRef<Group | null>(null);
  const head = useRef<Group | null>(null);
  const earL = useRef<Group | null>(null);
  const earR = useRef<Group | null>(null);
  const tail = useRef<Group | null>(null);
  const legFL = useRef<Group | null>(null);
  const legFR = useRef<Group | null>(null);
  const legBL = useRef<Group | null>(null);
  const legBR = useRef<Group | null>(null);

  useFrame(({ clock }, delta) => {
    const t = noMotion ? 1 : 1 - Math.pow(0.5, delta / 0.14);
    const p = (current.current = lerpDogPose(current.current, target, t));
    if (body.current) {
      body.current.position.y = p.bodyY;
      body.current.scale.set(1, p.bodyScaleY / 0.8, 1);
    }
    // 머리: 아래(+pitch)·좌우(yaw)로 돈다. 피벗은 목(어깨 앞)
    if (head.current) head.current.rotation.set(0, p.headYaw, -p.headPitch);
    // 귀: 늘어짐(0) → 쫑긋(1)
    const perk = p.earPerk;
    if (earL.current) earL.current.rotation.set(0.3 - perk * 0.35, 0, 0.5 - perk * 0.9);
    if (earR.current) earR.current.rotation.set(-0.3 + perk * 0.35, 0, 0.5 - perk * 0.9);
    // 꼬리: 기본 처짐 + 흔들기(reduced-motion이면 흔들지 않음)
    if (tail.current) {
      const wag = noMotion ? 0 : Math.sin(clock.elapsedTime * 11) * 0.55 * p.tailWag;
      tail.current.rotation.set(0, wag, -0.6 + p.tailWag * 0.25);
    }
    // 다리: legFold 0=서 있음, 1=접힘(앞발은 앞으로 뻗고 뒷다리는 몸 아래로)
    const fold = p.legFold;
    const standY = 0;
    const foldY = 0.1;
    if (legFL.current) {
      legFL.current.rotation.z = -fold * 1.45;
      legFL.current.position.y = -0.09 + fold * foldY + standY;
    }
    if (legFR.current) {
      // 오른쪽 앞발은 관찰 중 살짝 든다(pawLift)
      legFR.current.rotation.z = -fold * 1.45 - p.pawLift * 0.75;
      legFR.current.position.y = -0.09 + fold * foldY + p.pawLift * 0.03;
    }
    if (legBL.current) {
      legBL.current.rotation.z = fold * 1.2;
      legBL.current.position.y = -0.09 + fold * foldY;
    }
    if (legBR.current) {
      legBR.current.rotation.z = fold * 1.2;
      legBR.current.position.y = -0.09 + fold * foldY;
    }
  });

  return (
    <group position={position} rotation={[0, yaw, 0]} scale={hovered ? 1.05 : 1}>
      {active && onSelect && (
        <>
          <TapHitBox size={[0.9, 0.7, 0.8]} centerY={0.05} onSelect={onSelect} onHoverChange={setHovered} />
          <BaseHighlight y={-0.2} hovered={hovered} innerRadius={0.26} outerRadius={0.32} color="#ffb26b" />
        </>
      )}
      <group ref={body}>
        {/* 몸통: 가슴(앞)이 크고 엉덩이(뒤)가 작은 두 덩어리 + 배 */}
        <mesh position={[0.08, 0.02, 0]} scale={[1.15, 0.85, 0.95]}>
          <sphereGeometry args={[0.21, 18, 18]} />
          <meshStandardMaterial color={FUR} />
        </mesh>
        <mesh position={[-0.16, 0, 0]} scale={[1.0, 0.8, 0.9]}>
          <sphereGeometry args={[0.19, 18, 18]} />
          <meshStandardMaterial color={FUR} />
        </mesh>
        <mesh position={[0.02, -0.1, 0.02]} scale={[1.5, 0.5, 0.75]}>
          <sphereGeometry args={[0.18, 14, 14]} />
          <meshStandardMaterial color={FUR_LIGHT} />
        </mesh>
        {/* 가슴 무늬 */}
        <mesh position={[0.22, -0.03, 0]} scale={[0.6, 1, 0.8]}>
          <sphereGeometry args={[0.13, 12, 12]} />
          <meshStandardMaterial color={FUR_LIGHT} />
        </mesh>
        {/* 목줄(고정 색) */}
        <mesh position={[0.27, 0.04, 0]} rotation={[0, 0, 0.35]}>
          <torusGeometry args={[0.135, 0.017, 8, 20]} />
          <meshStandardMaterial color="#ef6f5e" />
        </mesh>
        {/* 머리(피벗=목) */}
        <group ref={head} position={[0.27, 0.06, 0]}>
          <mesh position={[0.07, 0.05, 0]}>
            <sphereGeometry args={[0.145, 18, 18]} />
            <meshStandardMaterial color={FUR} />
          </mesh>
          {/* 주둥이 */}
          <mesh position={[0.2, 0.0, 0]} scale={[1.25, 0.8, 0.9]}>
            <sphereGeometry args={[0.085, 14, 14]} />
            <meshStandardMaterial color="#f0d9b8" />
          </mesh>
          <mesh position={[0.29, 0.015, 0]}>
            <sphereGeometry args={[0.03, 10, 10]} />
            <meshStandardMaterial color="#2b201b" />
          </mesh>
          {/* 눈 + 반짝임 */}
          {[0.075, -0.075].map((z) => (
            <group key={z}>
              <mesh position={[0.15, 0.1, z]}>
                <sphereGeometry args={[0.028, 10, 10]} />
                <meshStandardMaterial color="#1e1612" />
              </mesh>
              <mesh position={[0.168, 0.11, z * 1.05]}>
                <sphereGeometry args={[0.009, 6, 6]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
            </group>
          ))}
          {/* 귀 */}
          <group ref={earL} position={[0.0, 0.16, 0.11]}>
            <mesh position={[0, -0.03, 0]} scale={[0.6, 1.35, 0.3]}>
              <sphereGeometry args={[0.085, 12, 12]} />
              <meshStandardMaterial color={FUR_DARK} />
            </mesh>
          </group>
          <group ref={earR} position={[0.0, 0.16, -0.11]}>
            <mesh position={[0, -0.03, 0]} scale={[0.6, 1.35, 0.3]}>
              <sphereGeometry args={[0.085, 12, 12]} />
              <meshStandardMaterial color={FUR_DARK} />
            </mesh>
          </group>
        </group>
        {/* 다리 4개(피벗=어깨/엉덩이 아래) */}
        <group ref={legFL} position={[0.18, -0.09, 0.1]}>
          <mesh position={[0, -0.085, 0]}>
            <cylinderGeometry args={[0.042, 0.036, 0.17, 10]} />
            <meshStandardMaterial color={PAW} />
          </mesh>
          <mesh position={[0.012, -0.175, 0]} scale={[1.4, 0.7, 1]}>
            <sphereGeometry args={[0.042, 10, 10]} />
            <meshStandardMaterial color={FUR_LIGHT} />
          </mesh>
        </group>
        <group ref={legFR} position={[0.18, -0.09, -0.1]}>
          <mesh position={[0, -0.085, 0]}>
            <cylinderGeometry args={[0.042, 0.036, 0.17, 10]} />
            <meshStandardMaterial color={PAW} />
          </mesh>
          <mesh position={[0.012, -0.175, 0]} scale={[1.4, 0.7, 1]}>
            <sphereGeometry args={[0.042, 10, 10]} />
            <meshStandardMaterial color={FUR_LIGHT} />
          </mesh>
        </group>
        <group ref={legBL} position={[-0.2, -0.09, 0.1]}>
          <mesh position={[0, -0.085, 0]}>
            <cylinderGeometry args={[0.046, 0.038, 0.17, 10]} />
            <meshStandardMaterial color={PAW} />
          </mesh>
          <mesh position={[0.012, -0.175, 0]} scale={[1.4, 0.7, 1]}>
            <sphereGeometry args={[0.042, 10, 10]} />
            <meshStandardMaterial color={FUR_LIGHT} />
          </mesh>
        </group>
        <group ref={legBR} position={[-0.2, -0.09, -0.1]}>
          <mesh position={[0, -0.085, 0]}>
            <cylinderGeometry args={[0.046, 0.038, 0.17, 10]} />
            <meshStandardMaterial color={PAW} />
          </mesh>
          <mesh position={[0.012, -0.175, 0]} scale={[1.4, 0.7, 1]}>
            <sphereGeometry args={[0.042, 10, 10]} />
            <meshStandardMaterial color={FUR_LIGHT} />
          </mesh>
        </group>
        {/* 꼬리 */}
        <group ref={tail} position={[-0.32, 0.05, 0]}>
          <mesh position={[-0.05, 0.04, 0]} rotation={[0, 0, 1.2]}>
            <coneGeometry args={[0.04, 0.2, 10]} />
            <meshStandardMaterial color={PAW} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
