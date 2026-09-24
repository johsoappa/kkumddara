"use client";

// ====================================================
// VetHumanoid — 수의사 XR R4 프로토타입용 절차형 사람 리그 (G2.2-R4-A, 신규)
//
// 보호자·선배 수의사를 하나의 관절 계층으로 만든다(외부 3D 모델·새 dependency 없음):
//   root(yaw) → pelvis → torso(비틀기·숙임) → neck → head(시선) + 어깨 → 위팔 → 팔꿈치 →
//   아래팔 → 손, 골반 → 허벅지 → 무릎 → 종아리 → 발.
// 포즈는 humanoidPose.ts의 관절 각도를 매 프레임 부드럽게 따라간다(reduced-motion이면 즉시).
// 색은 단계·선택 상태와 무관한 고정값이다(선택 가능 표시는 발밑 링/핀만 사용).
// 캐릭터 앞은 +z. 전체 높이는 scale로 기존 캐릭터(약 1.4)에 맞춘다.
// ====================================================

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { HUMANOID_POSES, lerpPose, type HumanoidPose, type HumanoidPoseName } from "./humanoidPose";
import { BaseHighlight, TapHitBox, useTapHover } from "./VetSceneInteractions";

export type HumanoidRole = "guardian" | "senior";

interface Look {
  skin: string;
  hair: string;
  top: string;
  pants: string;
  shoe: string;
}

const LOOKS: Record<HumanoidRole, Look> = {
  guardian: { skin: "#e8b98c", hair: "#5a4432", top: "#ff8a73", pants: "#4a5568", shoe: "#3b2f2a" },
  senior: { skin: "#f0cf9e", hair: "#8a8a8a", top: "#ffffff", pants: "#3f4a52", shoe: "#2b2f33" },
};

const SCALE = 0.85;
const PELVIS_Y = 0.62;
const THIGH = 0.3;
const SHIN = 0.29;
const TORSO_H = 0.5;
const NECK_H = 0.13;
const UPPER_ARM = 0.27;
const FOREARM = 0.25;
const SHOULDER_X = 0.235;
const HIP_X = 0.09;

interface Props {
  role: HumanoidRole;
  poseName: HumanoidPoseName;
  position: [number, number, number];
  yaw: number;
  active: boolean;
  onSelect?: () => void;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

function Arm({
  side,
  color,
  skin,
  radius,
  setRefs,
}: {
  side: 1 | -1;
  color: string;
  skin: string;
  radius: number;
  setRefs: (shoulder: Group | null, elbow: Group | null) => void;
}) {
  const shoulder = useRef<Group | null>(null);
  const elbow = useRef<Group | null>(null);
  useEffect(() => {
    setRefs(shoulder.current, elbow.current);
  }, [setRefs]);
  return (
    <group ref={shoulder} position={[side * SHOULDER_X, TORSO_H - 0.06, 0]}>
      <mesh>
        <sphereGeometry args={[radius * 1.25, 12, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -UPPER_ARM / 2, 0]}>
        <cylinderGeometry args={[radius, radius * 0.92, UPPER_ARM, 10]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <group ref={elbow} position={[0, -UPPER_ARM, 0]}>
        <mesh>
          <sphereGeometry args={[radius * 0.95, 10, 10]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, -FOREARM / 2, 0]}>
          <cylinderGeometry args={[radius * 0.9, radius * 0.8, FOREARM, 10]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, -FOREARM - 0.03, 0]}>
          <sphereGeometry args={[radius * 1.1, 10, 10]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      </group>
    </group>
  );
}

function Leg({
  side,
  pants,
  shoe,
  setRefs,
}: {
  side: 1 | -1;
  pants: string;
  shoe: string;
  setRefs: (hip: Group | null, knee: Group | null) => void;
}) {
  const hip = useRef<Group | null>(null);
  const knee = useRef<Group | null>(null);
  useEffect(() => {
    setRefs(hip.current, knee.current);
  }, [setRefs]);
  return (
    <group ref={hip} position={[side * HIP_X, 0, 0]}>
      <mesh position={[0, -THIGH / 2, 0]}>
        <cylinderGeometry args={[0.075, 0.062, THIGH, 10]} />
        <meshStandardMaterial color={pants} />
      </mesh>
      <group ref={knee} position={[0, -THIGH, 0]}>
        <mesh>
          <sphereGeometry args={[0.06, 10, 10]} />
          <meshStandardMaterial color={pants} />
        </mesh>
        <mesh position={[0, -SHIN / 2, 0]}>
          <cylinderGeometry args={[0.058, 0.048, SHIN, 10]} />
          <meshStandardMaterial color={pants} />
        </mesh>
        <mesh position={[0, -SHIN, 0.045]}>
          <boxGeometry args={[0.1, 0.06, 0.2]} />
          <meshStandardMaterial color={shoe} />
        </mesh>
      </group>
    </group>
  );
}

export default function VetHumanoid({ role, poseName, position, yaw, active, onSelect }: Props) {
  const look = LOOKS[role];
  const { hovered, setHovered } = useTapHover();
  const target = HUMANOID_POSES[poseName];
  const current = useRef<HumanoidPose>(target);
  const reduced = useMemo(() => prefersReducedMotion(), []);

  const torso = useRef<Group | null>(null);
  const head = useRef<Group | null>(null);
  const joints = useRef<{
    shoulderL: Group | null;
    elbowL: Group | null;
    shoulderR: Group | null;
    elbowR: Group | null;
    hipL: Group | null;
    kneeL: Group | null;
    hipR: Group | null;
    kneeR: Group | null;
  }>({ shoulderL: null, elbowL: null, shoulderR: null, elbowR: null, hipL: null, kneeL: null, hipR: null, kneeR: null });

  const setArmL = (s: Group | null, e: Group | null) => {
    joints.current.shoulderL = s;
    joints.current.elbowL = e;
  };
  const setArmR = (s: Group | null, e: Group | null) => {
    joints.current.shoulderR = s;
    joints.current.elbowR = e;
  };
  const setLegL = (h: Group | null, k: Group | null) => {
    joints.current.hipL = h;
    joints.current.kneeL = k;
  };
  const setLegR = (h: Group | null, k: Group | null) => {
    joints.current.hipR = h;
    joints.current.kneeR = k;
  };

  const apply = (p: HumanoidPose) => {
    const j = joints.current;
    if (torso.current) torso.current.rotation.set(p.torsoLean, p.torsoYaw, 0);
    if (head.current) head.current.rotation.set(p.headPitch, p.headYaw, 0);
    // armL은 +x(캐릭터의 왼쪽), armR은 -x
    if (j.shoulderL) j.shoulderL.rotation.set(-p.armL.fwd, 0, p.armL.abd);
    if (j.elbowL) j.elbowL.rotation.set(-p.armL.elbow, 0, 0);
    if (j.shoulderR) j.shoulderR.rotation.set(-p.armR.fwd, 0, -p.armR.abd);
    if (j.elbowR) j.elbowR.rotation.set(-p.armR.elbow, 0, 0);
    if (j.hipL) j.hipL.rotation.set(-p.legL.fwd, 0, p.legL.abd);
    if (j.kneeL) j.kneeL.rotation.set(p.legL.knee, 0, 0);
    if (j.hipR) j.hipR.rotation.set(-p.legR.fwd, 0, -p.legR.abd);
    if (j.kneeR) j.kneeR.rotation.set(p.legR.knee, 0, 0);
  };

  useEffect(() => {
    apply(current.current);
  });

  useFrame((_, delta) => {
    const t = reduced ? 1 : 1 - Math.pow(0.5, delta / 0.12);
    current.current = lerpPose(current.current, target, t);
    apply(current.current);
  });

  const isSenior = role === "senior";
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={SCALE}>
      {active && onSelect && (
        <>
          <TapHitBox size={[0.8, 1.8, 0.8]} centerY={0.9} onSelect={onSelect} onHoverChange={setHovered} />
          <BaseHighlight y={0.015} hovered={hovered} innerRadius={0.22} outerRadius={0.28} />
        </>
      )}
      <group position={[0, PELVIS_Y, 0]}>
        {/* 골반 */}
        <mesh position={[0, 0.0, 0]}>
          <cylinderGeometry args={[0.17, 0.176, 0.16, 14]} />
          <meshStandardMaterial color={look.pants} />
        </mesh>
        <Leg side={1} pants={look.pants} shoe={look.shoe} setRefs={setLegL} />
        <Leg side={-1} pants={look.pants} shoe={look.shoe} setRefs={setLegR} />
        {isSenior && (
          <mesh position={[0, -0.13, 0]}>
            <cylinderGeometry args={[0.215, 0.245, 0.3, 14]} />
            <meshStandardMaterial color={look.top} />
          </mesh>
        )}
        {/* 몸통(상체) */}
        <group ref={torso} position={[0, 0.06, 0]}>
          <mesh position={[0, TORSO_H / 2, 0]}>
            <cylinderGeometry args={[0.205, 0.185, TORSO_H, 14]} />
            <meshStandardMaterial color={look.top} />
          </mesh>
          {isSenior && (
            <>
              {/* 가운 안쪽 민트 셔츠 — 가슴 아래쪽 V (얼굴·목을 가리지 않는 위치) */}
              <mesh position={[0, 0.26, 0.19]}>
                <boxGeometry args={[0.1, 0.3, 0.02]} />
                <meshStandardMaterial color="#8fd8c9" />
              </mesh>
              {/* 가운 옷깃 */}
              <mesh position={[-0.075, 0.42, 0.165]} rotation={[0, 0, 0.35]}>
                <boxGeometry args={[0.07, 0.15, 0.025]} />
                <meshStandardMaterial color="#e8f1ee" />
              </mesh>
              <mesh position={[0.075, 0.42, 0.165]} rotation={[0, 0, -0.35]}>
                <boxGeometry args={[0.07, 0.15, 0.025]} />
                <meshStandardMaterial color="#e8f1ee" />
              </mesh>
              {/* 청진기(가슴 옆으로 늘어뜨림 — 얼굴 앞을 가로지르지 않는다) */}
              <mesh position={[0.17, 0.3, 0.12]}>
                <torusGeometry args={[0.07, 0.014, 8, 16]} />
                <meshStandardMaterial color="#2f6f66" />
              </mesh>
            </>
          )}
          {/* 목 */}
          <mesh position={[0, TORSO_H + NECK_H / 2 - 0.02, 0]}>
            <cylinderGeometry args={[0.058, 0.066, NECK_H + 0.04, 12]} />
            <meshStandardMaterial color={look.skin} />
          </mesh>
          {/* 머리 */}
          <group ref={head} position={[0, TORSO_H + NECK_H, 0]}>
            <mesh position={[0, 0.17, 0]}>
              <sphereGeometry args={[0.19, 18, 18]} />
              <meshStandardMaterial color={look.skin} />
            </mesh>
            {/* 머리카락: 윗면·뒷면만 덮고 이마·얼굴 앞은 비운다 */}
            <mesh position={[0, 0.25, -0.035]} scale={[1.02, 0.78, 1.0]}>
              <sphereGeometry args={[0.19, 16, 16]} />
              <meshStandardMaterial color={look.hair} />
            </mesh>
            {/* 눈·코·입 */}
            <mesh position={[-0.065, 0.19, 0.172]}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshStandardMaterial color="#2a2320" />
            </mesh>
            <mesh position={[0.065, 0.19, 0.172]}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshStandardMaterial color="#2a2320" />
            </mesh>
            <mesh position={[0, 0.145, 0.19]}>
              <sphereGeometry args={[0.026, 8, 8]} />
              <meshStandardMaterial color="#d9a273" />
            </mesh>
            <mesh position={[0, 0.085, 0.178]}>
              <boxGeometry args={[0.07, 0.014, 0.012]} />
              <meshStandardMaterial color="#9c4a3f" />
            </mesh>
            {isSenior && (
              <>
                {/* 얇은 안경테 */}
                <mesh position={[-0.065, 0.19, 0.186]}>
                  <torusGeometry args={[0.048, 0.006, 6, 20]} />
                  <meshStandardMaterial color="#3a3f45" />
                </mesh>
                <mesh position={[0.065, 0.19, 0.186]}>
                  <torusGeometry args={[0.048, 0.006, 6, 20]} />
                  <meshStandardMaterial color="#3a3f45" />
                </mesh>
                <mesh position={[0, 0.195, 0.188]}>
                  <boxGeometry args={[0.03, 0.006, 0.006]} />
                  <meshStandardMaterial color="#3a3f45" />
                </mesh>
              </>
            )}
          </group>
          <Arm side={1} color={look.top} skin={look.skin} radius={0.05} setRefs={setArmL} />
          <Arm side={-1} color={look.top} skin={look.skin} radius={0.05} setRefs={setArmR} />
        </group>
      </group>
    </group>
  );
}
