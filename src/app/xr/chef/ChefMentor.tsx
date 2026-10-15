"use client";

// ====================================================
// ChefMentor — 선배 요리사 (F10, 신규)
//
// 기존 Colleague(원통 몸+구 머리+모자)를 대체하는 절차형 사람 리그. 외부 3D 에셋·drei·새 의존성 없이
// 기본 geometry만 쓰고, 관절 계층(어깨→위팔→팔꿈치→아래팔→손, 목→머리)으로 자세를 만든다.
// 구조는 수의사 VetHumanoid의 방식(관절 refs + 매 프레임 자세 보간)을 참고했지만 그 파일을 import하거나
// 수정하지 않는다(수의사 코드와 분리).
//
// 입력 방해 금지: 이 컴포넌트의 어떤 mesh에도 포인터 핸들러를 붙이지 않는다. R3F는 핸들러가 있는
// 객체만 이벤트 대상으로 삼으므로 캐릭터는 구슬·토큰·타일의 선택/드래그를 가로채지 않는다.
// 연출은 mentorPose.ts의 순수 데이터가 정하며, 선택 내용(choice id·축)은 입력으로 받지 않는다.
// ====================================================

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import {
  MENTOR_DIMS,
  MENTOR_HOLD,
  MENTOR_PLACEMENT,
  lerpMentorPose,
  mentorEaseAlpha,
  mentorTargetPose,
  type MentorCue,
  type MentorPose,
} from "./mentorPose";

const COAT = "#f7f4ee";
const COAT_SHADE = "#e4dfd3";
const SKIN = "#e9b98f";
const SKIN_DEEP = "#d99f76";
const HAIR = "#b9b4aa";
const SCARF = "#d94f3c";
const APRON = "#3f4a52";
const PANTS = "#4a5058";
const INK = "#2a2320";

// 몸 치수(스케일 1 기준, 발바닥 y=0)
const LEG_H = MENTOR_DIMS.legH;
const TORSO_H = MENTOR_DIMS.torsoH;
const NECK_H = MENTOR_DIMS.neckH;
const UPPER_ARM = 0.24;
const FOREARM = 0.22;
const SHOULDER_X = 0.27;
const ARM_R = 0.058;

export interface ChefMentorProps {
  cue: MentorCue;
  /** F11: 지정하면 cue 연출 대신 이 정적 자세로 간다(같은 보간·reduced-motion 처리). 생략 시 기존 동작 그대로 */
  poseOverride?: MentorPose;
  position?: [number, number, number];
  yaw?: number;
  scale?: number;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

interface ArmRefs {
  shoulder: Group | null;
  elbow: Group | null;
}

function Arm({
  side,
  onRefs,
}: {
  side: 1 | -1;
  onRefs: (refs: ArmRefs) => void;
}) {
  const shoulder = useRef<Group>(null);
  const elbow = useRef<Group>(null);
  useEffect(() => {
    onRefs({ shoulder: shoulder.current, elbow: elbow.current });
  }, [onRefs]);
  return (
    <group ref={shoulder} position={[side * SHOULDER_X, TORSO_H - 0.07, 0]}>
      <mesh>
        <sphereGeometry args={[ARM_R * 1.35, 12, 12]} />
        <meshStandardMaterial color={COAT} />
      </mesh>
      <mesh position={[0, -UPPER_ARM / 2, 0]}>
        <cylinderGeometry args={[ARM_R, ARM_R * 0.92, UPPER_ARM, 10]} />
        <meshStandardMaterial color={COAT} />
      </mesh>
      <group ref={elbow} position={[0, -UPPER_ARM, 0]}>
        <mesh>
          <sphereGeometry args={[ARM_R * 0.95, 10, 10]} />
          <meshStandardMaterial color={COAT} />
        </mesh>
        <mesh position={[0, -FOREARM / 2, 0]}>
          <cylinderGeometry args={[ARM_R * 0.9, ARM_R * 0.8, FOREARM, 10]} />
          <meshStandardMaterial color={COAT} />
        </mesh>
        {/* 소맷단 */}
        <mesh position={[0, -FOREARM + 0.015, 0]}>
          <cylinderGeometry args={[ARM_R * 0.88, ARM_R * 0.88, 0.04, 10]} />
          <meshStandardMaterial color={COAT_SHADE} />
        </mesh>
        {/* 손: 손바닥 + 엄지 — 맨살 색이라 흰 가운과 구분된다 */}
        <mesh position={[0, -FOREARM - 0.045, 0]} scale={[1.0, 1.1, 0.75]}>
          <sphereGeometry args={[ARM_R * 1.2, 12, 12]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>
        <mesh position={[side * -0.05, -FOREARM - 0.03, 0.025]}>
          <sphereGeometry args={[ARM_R * 0.55, 8, 8]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>
      </group>
    </group>
  );
}

export default function ChefMentor({
  cue,
  poseOverride,
  position = [MENTOR_PLACEMENT.x, MENTOR_PLACEMENT.y, MENTOR_PLACEMENT.z],
  yaw = MENTOR_PLACEMENT.yaw,
  scale = MENTOR_PLACEMENT.scale,
}: ChefMentorProps) {
  const reduced = usePrefersReducedMotion();
  const torso = useRef<Group>(null);
  const head = useRef<Group>(null);
  const arms = useRef<{ L: ArmRefs; R: ArmRefs }>({
    L: { shoulder: null, elbow: null },
    R: { shoulder: null, elbow: null },
  });
  const setArmL = useRef((refs: ArmRefs) => {
    arms.current.L = refs;
  }).current;
  const setArmR = useRef((refs: ArmRefs) => {
    arms.current.R = refs;
  }).current;

  // 단서가 바뀐 시각을 기억해 연출(손 흔들기·끄덕임)의 경과 시간을 잰다
  const cueRef = useRef<{ cue: MentorCue; startedAt: number | null }>({ cue, startedAt: null });
  const current = useRef<MentorPose>(MENTOR_HOLD[cue]);

  const apply = (p: MentorPose) => {
    if (torso.current) torso.current.rotation.set(p.torsoLean, p.torsoYaw, 0);
    if (head.current) head.current.rotation.set(p.headPitch, p.headYaw, p.headRoll);
    const { L, R } = arms.current;
    // 캐릭터의 왼쪽(+x)이 조리대 쪽이다
    if (L.shoulder) L.shoulder.rotation.set(-p.armL.fwd, 0, p.armL.abd);
    if (L.elbow) L.elbow.rotation.set(-p.armL.elbow, 0, 0);
    if (R.shoulder) R.shoulder.rotation.set(-p.armR.fwd, 0, -p.armR.abd);
    if (R.elbow) R.elbow.rotation.set(-p.armR.elbow, 0, 0);
  };

  useEffect(() => {
    apply(current.current);
  });

  useFrame(({ clock }, delta) => {
    if (cueRef.current.cue !== cue) {
      cueRef.current = { cue, startedAt: clock.elapsedTime };
    } else if (cueRef.current.startedAt === null) {
      cueRef.current.startedAt = clock.elapsedTime;
    }
    const elapsed = clock.elapsedTime - (cueRef.current.startedAt ?? clock.elapsedTime);
    const target = poseOverride ?? mentorTargetPose(cue, elapsed, reduced);
    current.current = reduced ? target : lerpMentorPose(current.current, target, mentorEaseAlpha(delta));
    apply(current.current);
  });

  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      {/* 다리·신발(대부분 조리대 뒤에 가려지지만 서 있는 사람으로 읽히게 둔다) */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.1, 0, 0]}>
          <mesh position={[0, LEG_H / 2, 0]}>
            <cylinderGeometry args={[0.075, 0.07, LEG_H, 10]} />
            <meshStandardMaterial color={PANTS} />
          </mesh>
          <mesh position={[0, 0.03, 0.04]}>
            <boxGeometry args={[0.13, 0.06, 0.22]} />
            <meshStandardMaterial color={INK} />
          </mesh>
        </group>
      ))}

      <group position={[0, LEG_H, 0]}>
        <group ref={torso}>
          {/* 조리복 몸통 */}
          <mesh position={[0, TORSO_H / 2, 0]}>
            <cylinderGeometry args={[0.2, 0.235, TORSO_H, 14]} />
            <meshStandardMaterial color={COAT} />
          </mesh>
          {/* 앞 여밈 — 두 줄 단추 */}
          {[-0.055, 0.055].map((x) =>
            [0.14, 0.27, 0.4].map((y) => (
              <mesh key={`${x}-${y}`} position={[x, y, 0.205 - Math.abs(y - 0.27) * 0.05]}>
                <sphereGeometry args={[0.014, 8, 8]} />
                <meshStandardMaterial color={COAT_SHADE} />
              </mesh>
            )),
          )}
          {/* 앞치마 */}
          <mesh position={[0, 0.17, 0.222]}>
            <boxGeometry args={[0.3, 0.3, 0.03]} />
            <meshStandardMaterial color={APRON} />
          </mesh>
          {/* 목 스카프 — 얼굴 아래에서 상체를 구분해 준다 */}
          <mesh position={[0, TORSO_H - 0.01, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.115, 0.032, 8, 18]} />
            <meshStandardMaterial color={SCARF} />
          </mesh>
          <mesh position={[0, TORSO_H - 0.065, 0.12]} rotation={[0.35, 0, Math.PI]}>
            <coneGeometry args={[0.055, 0.1, 3]} />
            <meshStandardMaterial color={SCARF} />
          </mesh>
          {/* 목 */}
          <mesh position={[0, TORSO_H + NECK_H / 2 - 0.01, 0]}>
            <cylinderGeometry args={[0.055, 0.06, NECK_H + 0.02, 10]} />
            <meshStandardMaterial color={SKIN} />
          </mesh>

          {/* 머리 — 얼굴을 크게(작은 화면에서도 사람으로 읽히도록 살짝 키운 비율) */}
          <group ref={head} position={[0, TORSO_H + NECK_H, 0]} scale={MENTOR_DIMS.headScale}>
            <mesh position={[0, 0.2, 0]} scale={[1, 0.97, 0.95]}>
              <sphereGeometry args={[0.215, 20, 20]} />
              <meshStandardMaterial color={SKIN} />
            </mesh>
            {/* 귀 */}
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * 0.205, 0.19, 0]}>
                <sphereGeometry args={[0.038, 8, 8]} />
                <meshStandardMaterial color={SKIN_DEEP} />
              </mesh>
            ))}
            {/* 눈 + 눈빛 */}
            {[-1, 1].map((side) => (
              <group key={side} position={[side * 0.075, 0.225, 0.19]}>
                <mesh>
                  <sphereGeometry args={[0.03, 10, 10]} />
                  <meshStandardMaterial color={INK} />
                </mesh>
                <mesh position={[0.009, 0.009, 0.021]}>
                  <sphereGeometry args={[0.009, 6, 6]} />
                  <meshStandardMaterial color="#ffffff" />
                </mesh>
              </group>
            ))}
            {/* 눈썹(회색 — 연륜 있는 선배) */}
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * 0.078, 0.277, 0.19]} rotation={[0, 0, side * -0.12]}>
                <boxGeometry args={[0.07, 0.016, 0.016]} />
                <meshStandardMaterial color={HAIR} />
              </mesh>
            ))}
            {/* 볼 */}
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * 0.125, 0.165, 0.165]} scale={[1, 0.7, 0.4]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial color="#f0a28a" />
              </mesh>
            ))}
            {/* 코 */}
            <mesh position={[0, 0.185, 0.21]}>
              <sphereGeometry args={[0.034, 10, 10]} />
              <meshStandardMaterial color={SKIN_DEEP} />
            </mesh>
            {/* 콧수염 */}
            <mesh position={[0, 0.145, 0.205]}>
              <boxGeometry args={[0.13, 0.026, 0.022]} />
              <meshStandardMaterial color={HAIR} />
            </mesh>
            {/* 미소 */}
            <mesh position={[0, 0.125, 0.2]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.052, 0.0095, 6, 14, Math.PI]} />
              <meshStandardMaterial color="#8c3f35" />
            </mesh>
            {/* 요리사 모자(토크) */}
            <mesh position={[0, 0.375, 0]}>
              <cylinderGeometry args={[0.2, 0.205, 0.09, 18]} />
              <meshStandardMaterial color={COAT_SHADE} />
            </mesh>
            <mesh position={[0, 0.48, 0]}>
              <cylinderGeometry args={[0.215, 0.2, 0.14, 18]} />
              <meshStandardMaterial color={COAT} />
            </mesh>
            <mesh position={[0, MENTOR_DIMS.hatTopRel - 0.15, 0]} scale={[1, 0.6, 1]}>
              <sphereGeometry args={[0.25, 18, 12]} />
              <meshStandardMaterial color={COAT} />
            </mesh>
          </group>

          <Arm side={1} onRefs={setArmL} />
          <Arm side={-1} onRefs={setArmR} />
        </group>
      </group>
    </group>
  );
}
