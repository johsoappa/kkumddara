"use client";

// ====================================================
// XR 수의사 진료실 씬 — v4 (R3F Canvas 본체, G2.2-R2-L2 선택 카드 제거)
//
// [G2.2-R2-L2 배경] 대표님의 G2.2-R2-L 실제 화면 검수: 강아지·인물 배치는
// 개선됐지만, 장면 속 "번호 카드"(하이라이트 링 + 숫자 스프라이트)가 여전히
// 선택 대상·서로를 가리는 화면의 주인공이었다. 이번 버전은 그 마커 레이어
// 자체를 없앴다 — 모든 choice는 이제 실제 진료실 오브젝트(강아지·보호자·
// 선배 수의사·기록판·약장·모니터·병원 사인)를 직접 가리키고, 그 오브젝트
// 컴포넌트 자신이 보이지 않는 hit box(TapHitBox)와, 필요한 경우 발밑의
// 아주 작은 링(BaseHighlight, 얼굴보다 항상 아래)을 자기 group 안에
// 포함시킨다. 활성 타깃은 오브젝트 자신의 재질에 은은한 강조 발광을 준다
// (별도 카드를 얹지 않는다) — VetSceneInteractions.tsx 참고.
//
// [카메라] sceneLayout.ts의 HERO_CAMERA(position/lookAt 고정) + FOV만
//   지점별로 보정하는 구조는 G2.2-R2-L과 동일하게 유지한다 — 이번 라운드는
//   "카드 제거"가 목적이라 카메라 이동 로직은 건드리지 않는다.
//
// [공간] 이전보다 바닥·벽 크기를 줄이고(회색 빈 공간 축소), 진찰대 밑에
//   러그를, 벽 아래에 걸레받이 색 띠를 더해 "진료실의 일부"로 읽히게 했다.
//
// [단계 전환] 활성 타깃의 발광, 기록판 체크 표시(showChart), 결과 화면에서
//   보호자·선배 수의사가 서로를 향해 살짝 돌아서는 자세 + 완료 배지로
//   "상담을 마친 장면"을 표현한다. 시나리오 문구·choice ID·결과 판정
//   로직은 전혀 건드리지 않는다(scenario.ts 무수정).
//
// [WebGL 가드] 요리사·수의사 공용 XrSceneGuard/XrScenePlaceholder를 그대로
//   재사용한다(이 파일에서 수정하지 않음).
// ====================================================

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { Mesh, MeshStandardMaterial, PerspectiveCamera } from "three";
import type { Choice } from "./scenario";
import {
  CABINET_ANCHOR,
  CLIPBOARD_ANCHOR,
  DOG_ANCHOR,
  GUARDIAN_ANCHOR,
  MONITOR_ANCHOR,
  RESULT_BADGE_POINT,
  SCALE_ANCHOR,
  SENIOR_ANCHOR,
  TABLE_CENTER,
  WALL_SIGN_ANCHOR,
  easeAlpha,
  easeScalar,
  fitVerticalFov,
  framingPointsForPositions,
  resolveScenePresentation,
  type NamedTargetKind,
  type Vec3,
  type VetScenePhase,
} from "./sceneLayout";
import { BaseHighlight, TapHitBox, useTapHover } from "./VetSceneInteractions";
import { createVetLabelSprite } from "./vetLabelSprite";
import XrSceneGuard from "../XrSceneGuard";
import XrScenePlaceholder from "../XrScenePlaceholder";

export type { VetScenePhase };

export interface VetSceneProps {
  mode: "compass" | "sprout";
  phase: VetScenePhase;
  /** choosing/reaction 단계에서 유효한 지점 번호 (1-based) */
  point: number;
  /** phase === "choosing"일 때만 의미 있음 — 그 외에는 빈 배열 */
  choices: Choice[];
  onChoice: (choice: Choice) => void;
  /** 지점3 이후 기록판에 정리 표시(체크)를 보여준다 (기존 showChart와 동일 시점) */
  showChart: boolean;
  /** Canvas 런타임 오류 시 상위(XrVetClient)에 1회 알림 — 선택적, 하위호환 */
  onSceneError?: () => void;
}

const CAMERA_EASE_HALF_LIFE = 0.3;
const DEFAULT_FOV = 55;

// position/lookAt은 sceneLayout의 HERO_CAMERA로 고정이라 지점마다 바뀌지
// 않는다. 이 Rig가 매 프레임 하는 일은 오직 "이번에 반드시 보여야 하는 점"
// 목록이 바뀔 때 FOV를 완만하게 재조정하는 것뿐이다(G2.2-R2-L에서 확정).
function CameraRig({
  mode,
  phase,
  point,
}: {
  mode: "compass" | "sprout";
  phase: VetScenePhase;
  point: number;
}) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);
  const fovRef = useRef(DEFAULT_FOV);

  useFrame((_, delta) => {
    const target = resolveScenePresentation(mode, phase, point, []).camera;
    const alpha = easeAlpha(delta, CAMERA_EASE_HALF_LIFE);

    const aspect = size.height > 0 ? size.width / size.height : 1;
    const framingPoints = framingPointsForPositions(target.points);
    const neededFov = fitVerticalFov({
      cameraPos: target.position,
      lookAt: target.lookAt,
      points: framingPoints,
      aspect,
    });
    fovRef.current = easeScalar(fovRef.current, neededFov, alpha);

    camera.position.set(target.position[0], target.position[1], target.position[2]);
    camera.lookAt(target.lookAt[0], target.lookAt[1], target.lookAt[2]);
    camera.fov = fovRef.current;
    camera.updateProjectionMatrix();
  });

  return null;
}

/** 활성 타깃일 때 오브젝트 "자기 자신"의 재질에 주는 은은한 강조 발광 —
 *  별도 카드를 얹지 않고, 이미 그 오브젝트가 갖고 있는 표면 하나를
 *  살짝 빛나게 하는 방식이다. hovered면 더 밝아진다. */
function useActiveGlow(active: boolean, hovered: boolean) {
  const ref = useRef<MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    const material = ref.current;
    if (!material) return;
    if (!active) {
      material.emissiveIntensity = 0;
      return;
    }
    const base = hovered ? 0.55 : 0.3;
    material.emissiveIntensity = base + Math.abs(Math.sin(clock.elapsedTime * 2.4)) * 0.25;
  });
  return ref;
}

interface InteractiveProps {
  /** 이 지점에서 선택 가능한 타깃이면 true — hit box/발광/베이스 링을 켠다. */
  active: boolean;
  onSelect?: () => void;
}

// ---------- 상시 캐릭터/소품 ----------

function Dog({ active, onSelect }: InteractiveProps) {
  const { hovered, setHovered } = useTapHover();
  const glowRef = useActiveGlow(active, hovered);
  return (
    <group position={DOG_ANCHOR} rotation={[0, 0.3, 0]} scale={hovered ? 1.05 : 1}>
      {active && onSelect && (
        <>
          <TapHitBox size={[0.75, 0.6, 0.75]} onSelect={onSelect} onHoverChange={setHovered} />
          <BaseHighlight y={-0.2} hovered={hovered} innerRadius={0.24} outerRadius={0.3} color="#ffb26b" />
        </>
      )}
      {/* 몸통 — 활성 타깃일 때 이 표면 자체가 은은하게 빛난다(별도 카드 없음) */}
      <mesh scale={[1.3, 0.8, 1]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial ref={glowRef} color="#e8c9a0" emissive="#ffb26b" emissiveIntensity={0} />
      </mesh>
      {/* 배(밝은 무늬) */}
      <mesh position={[0, -0.12, 0.05]} scale={[1, 0.55, 0.75]}>
        <sphereGeometry args={[0.2, 14, 14]} />
        <meshStandardMaterial color="#fbf3e6" />
      </mesh>
      {/* 머리 */}
      <mesh position={[0.28, 0.08, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#e8c9a0" />
      </mesh>
      {/* 주둥이 */}
      <mesh position={[0.42, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.08, 0.14, 12]} />
        <meshStandardMaterial color="#f0d9b8" />
      </mesh>
      <mesh position={[0.49, 0.02, 0]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#3a2a20" />
      </mesh>
      {/* 눈 */}
      <mesh position={[0.34, 0.13, 0.09]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#241a14" />
      </mesh>
      <mesh position={[0.34, 0.13, -0.09]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#241a14" />
      </mesh>
      {/* 귀(늘어진 형태) */}
      <mesh position={[0.2, 0.18, 0.14]} rotation={[0.3, 0, 0.5]} scale={[0.7, 1.3, 0.35]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#c9a06a" />
      </mesh>
      <mesh position={[0.2, 0.18, -0.14]} rotation={[-0.3, 0, 0.5]} scale={[0.7, 1.3, 0.35]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#c9a06a" />
      </mesh>
      {/* 앞다리 */}
      <mesh position={[0.15, -0.2, 0.12]}>
        <cylinderGeometry args={[0.035, 0.035, 0.16, 8]} />
        <meshStandardMaterial color="#e0bd93" />
      </mesh>
      <mesh position={[0.15, -0.2, -0.12]}>
        <cylinderGeometry args={[0.035, 0.035, 0.16, 8]} />
        <meshStandardMaterial color="#e0bd93" />
      </mesh>
      {/* 꼬리 */}
      <mesh position={[-0.28, 0.1, 0]} rotation={[0, 0, -0.6]}>
        <coneGeometry args={[0.05, 0.22, 10]} />
        <meshStandardMaterial color="#e0bd93" />
      </mesh>
    </group>
  );
}

function personBase(skin: string, hair: string) {
  return (
    <>
      <mesh position={[0, 1.15, 0]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0, 1.26, 0]} scale={[1, 0.65, 1]}>
        <sphereGeometry args={[0.15, 14, 14]} />
        <meshStandardMaterial color={hair} />
      </mesh>
    </>
  );
}

// 이 두 캐릭터의 <group position={ANCHOR}>는 "발이 닿는 바닥" 좌표다
// (sceneLayout.ts의 GUARDIAN_ANCHOR/SENIOR_ANCHOR가 y=0). resultPose가
// true면(결과 화면) 서로를 향해 살짝 더 돌아서 "상담을 마무리하는" 자세를
// 준다 — 회전 값만 살짝 바꿀 뿐 위치는 그대로다.

function Guardian({ active, onSelect, resultPose }: InteractiveProps & { resultPose: boolean }) {
  const { hovered, setHovered } = useTapHover();
  const glowRef = useActiveGlow(active, hovered);
  const yaw = -0.5 + (resultPose ? 0.25 : 0);
  return (
    <group position={GUARDIAN_ANCHOR} rotation={[0, yaw, 0]}>
      {active && onSelect && (
        <>
          <TapHitBox size={[0.7, 1.5, 0.7]} centerY={0.75} onSelect={onSelect} onHoverChange={setHovered} />
          <BaseHighlight y={0.015} hovered={hovered} />
        </>
      )}
      {personBase("#e8b98c", "#5a4432")}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.19, 0.22, 0.62, 14]} />
        <meshStandardMaterial ref={glowRef} color="#ff8a73" emissive="#ffd9a0" emissiveIntensity={0} />
      </mesh>
      <mesh position={[-0.22, 0.85, 0]} rotation={[0, 0, 0.35]}>
        <cylinderGeometry args={[0.045, 0.045, 0.5, 10]} />
        <meshStandardMaterial color="#ff8a73" />
      </mesh>
      <mesh position={[0.22, 0.85, 0]} rotation={[0, 0, -0.35]}>
        <cylinderGeometry args={[0.045, 0.045, 0.5, 10]} />
        <meshStandardMaterial color="#ff8a73" />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.2, 0.19, 0.5, 14]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
    </group>
  );
}

function SeniorVet({ active, onSelect, resultPose }: InteractiveProps & { resultPose: boolean }) {
  const { hovered, setHovered } = useTapHover();
  const glowRef = useActiveGlow(active, hovered);
  const yaw = -2.3 + (resultPose ? -0.25 : 0);
  return (
    <group position={SENIOR_ANCHOR} rotation={[0, yaw, 0]}>
      {active && onSelect && (
        <>
          <TapHitBox size={[0.7, 1.5, 0.7]} centerY={0.75} onSelect={onSelect} onHoverChange={setHovered} />
          <BaseHighlight y={0.015} hovered={hovered} />
        </>
      )}
      {personBase("#f0cf9e", "#8a8a8a")}
      {/* 흰 가운 */}
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.21, 0.25, 0.68, 14]} />
        <meshStandardMaterial ref={glowRef} color="#ffffff" emissive="#7fd8c9" emissiveIntensity={0} />
      </mesh>
      <mesh position={[0, 0.82, 0.19]}>
        <boxGeometry args={[0.06, 0.6, 0.02]} />
        <meshStandardMaterial color="#cfe3df" />
      </mesh>
      <mesh position={[-0.24, 0.85, 0]} rotation={[0, 0, 0.35]}>
        <cylinderGeometry args={[0.048, 0.048, 0.52, 10]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.24, 0.85, 0]} rotation={[0, 0, -0.35]}>
        <cylinderGeometry args={[0.048, 0.048, 0.52, 10]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.21, 0.2, 0.48, 14]} />
        <meshStandardMaterial color="#3f4a52" />
      </mesh>
      {/* 청진기 */}
      <mesh position={[0, 1.02, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.11, 0.018, 8, 20, Math.PI]} />
        <meshStandardMaterial color="#2f6f66" />
      </mesh>
      <mesh position={[0, 0.85, 0.22]}>
        <cylinderGeometry args={[0.018, 0.018, 0.3, 8]} />
        <meshStandardMaterial color="#2f6f66" />
      </mesh>
      <mesh position={[0, 0.68, 0.22]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshStandardMaterial color="#c7ccd1" />
      </mesh>
    </group>
  );
}

function ClipboardProp({ active, onSelect, showChart }: InteractiveProps & { showChart: boolean }) {
  const { hovered, setHovered } = useTapHover();
  const glowRef = useActiveGlow(active, hovered);
  const checkRef = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const mat = checkRef.current?.material as MeshStandardMaterial | undefined;
    if (mat) mat.emissiveIntensity = 0.4 + Math.abs(Math.sin(clock.elapsedTime * 2)) * 0.4;
  });
  return (
    <group position={CLIPBOARD_ANCHOR} rotation={[-Math.PI / 2.6, 0, 0.05]}>
      {active && onSelect && (
        <TapHitBox size={[0.44, 0.54, 0.15]} onSelect={onSelect} onHoverChange={setHovered} />
      )}
      <mesh scale={hovered ? 1.06 : 1}>
        <boxGeometry args={[0.34, 0.44, 0.02]} />
        <meshStandardMaterial ref={glowRef} color="#f7f3ea" emissive="#3f9c96" emissiveIntensity={0} />
      </mesh>
      <mesh position={[0, 0.2, 0.012]}>
        <boxGeometry args={[0.1, 0.03, 0.01]} />
        <meshStandardMaterial color="#8a8f8d" />
      </mesh>
      {showChart && (
        <mesh ref={checkRef} position={[0, -0.02, 0.012]}>
          <boxGeometry args={[0.22, 0.24, 0.005]} />
          <meshStandardMaterial color="#3f9c96" emissive="#3f9c96" emissiveIntensity={0.4} transparent opacity={0.55} />
        </mesh>
      )}
      {/* 연필 */}
      <mesh position={[0.16, -0.18, 0.03]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
        <meshStandardMaterial color="#e8b23c" />
      </mesh>
    </group>
  );
}

function Cabinet({ active, onSelect }: InteractiveProps) {
  const { hovered, setHovered } = useTapHover();
  const glowRef = useActiveGlow(active, hovered);
  const doorColors = ["#7fd8c9", "#ff8a73", "#ffd166"];
  return (
    <group position={CABINET_ANCHOR}>
      {active && onSelect && (
        <TapHitBox size={[1.0, 1.2, 0.5]} centerY={0.6} onSelect={onSelect} onHoverChange={setHovered} />
      )}
      <mesh scale={hovered ? 1.03 : 1}>
        <boxGeometry args={[0.9, 1.1, 0.4]} />
        <meshStandardMaterial ref={glowRef} color="#ffffff" emissive="#ffd166" emissiveIntensity={0} />
      </mesh>
      {doorColors.map((color, index) => (
        <mesh key={color} position={[-0.28 + index * 0.28, 0.55, 0.21]}>
          <boxGeometry args={[0.22, 0.9, 0.02]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      <mesh position={[0, 1.14, 0]}>
        <boxGeometry args={[0.95, 0.05, 0.42]} />
        <meshStandardMaterial color="#e8ece9" />
      </mesh>
    </group>
  );
}

function Monitor({ active, onSelect }: InteractiveProps) {
  const { hovered, setHovered } = useTapHover();
  const glowRef = useActiveGlow(active, hovered);
  return (
    <group position={MONITOR_ANCHOR}>
      {active && onSelect && (
        <TapHitBox size={[0.6, 0.5, 0.25]} onSelect={onSelect} onHoverChange={setHovered} />
      )}
      <mesh scale={hovered ? 1.05 : 1}>
        <boxGeometry args={[0.5, 0.36, 0.03]} />
        <meshStandardMaterial color="#2b2f33" />
      </mesh>
      <mesh position={[0, 0, 0.018]}>
        <boxGeometry args={[0.44, 0.3, 0.005]} />
        <meshStandardMaterial ref={glowRef} color="#7fd8c9" emissive="#3f9c96" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, -0.24, 0]}>
        <boxGeometry args={[0.06, 0.14, 0.06]} />
        <meshStandardMaterial color="#c7ccd1" />
      </mesh>
    </group>
  );
}

function Scale() {
  return (
    <group position={SCALE_ANCHOR}>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.6, 0.06, 0.42]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.09, -0.16]}>
        <boxGeometry args={[0.16, 0.08, 0.03]} />
        <meshStandardMaterial color="#3f9c96" emissive="#3f9c96" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

// TABLE_CENTER는 바닥 좌표다(y=0). 다리 상자 높이 0.65 + 얇은 상판으로
// 상판이 0.71~0.72 높이에 오도록 했다 — DOG_ANCHOR(몸통 중심 y=0.92)가
// 상판 위에 자연스럽게 걸치도록 맞춘 값이다.
function ExamTable() {
  return (
    <group position={TABLE_CENTER}>
      <mesh position={[0, 0.325, 0]}>
        <boxGeometry args={[1.1, 0.65, 0.7]} />
        <meshStandardMaterial color="#bfe3da" />
      </mesh>
      <mesh position={[0, 0.68, 0]}>
        <boxGeometry args={[1.15, 0.06, 0.75]} />
        <meshStandardMaterial color="#eef7f4" />
      </mesh>
      {/* 매트 */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[0.8, 0.02, 0.5]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

/** 병원 정체성 소품 — 발바닥 사인. 지점3(전체 상황 먼저 살핀다)에서는
 *  실제 선택 대상도 겸한다(공간 전체를 상징하는 기존 소품 재사용). */
function PawSign({ active, onSelect }: InteractiveProps) {
  const { hovered, setHovered } = useTapHover();
  const glowRef = useActiveGlow(active, hovered);
  const toeOffsets: Vec3[] = [
    [-0.09, 0.09, 0],
    [-0.03, 0.13, 0],
    [0.03, 0.13, 0],
    [0.09, 0.09, 0],
  ];
  return (
    <group position={WALL_SIGN_ANCHOR}>
      {active && onSelect && (
        <TapHitBox size={[0.8, 0.6, 0.25]} onSelect={onSelect} onHoverChange={setHovered} />
      )}
      <mesh scale={hovered ? 1.05 : 1}>
        <boxGeometry args={[0.7, 0.5, 0.03]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, -0.03, 0.02]} scale={[1, 0.8, 1]}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial ref={glowRef} color="#ff8a73" emissive="#ffd166" emissiveIntensity={0} />
      </mesh>
      {toeOffsets.map((offset, index) => (
        <mesh key={index} position={[offset[0], offset[1] - 0.03, 0.02]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color="#ff8a73" />
        </mesh>
      ))}
    </group>
  );
}

/** 결과 화면 전용 — 완료 배지(리본) + "체험 완료!" 라벨. sceneLayout의
 *  RESULT_BADGE_POINT와 같은 좌표를 써야 카메라 프레이밍 계산과 실제
 *  렌더 위치가 어긋나지 않는다. */
function CompletionBadge() {
  const labelSprite = useMemo(() => createVetLabelSprite("체험 완료!"), []);
  const ringRef = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const mat = ringRef.current?.material as MeshStandardMaterial | undefined;
    if (mat) mat.emissiveIntensity = 0.5 + Math.abs(Math.sin(clock.elapsedTime * 2)) * 0.35;
  });
  return (
    <group position={RESULT_BADGE_POINT}>
      <mesh ref={ringRef}>
        <torusGeometry args={[0.16, 0.045, 12, 24]} />
        <meshStandardMaterial color="#ffd166" emissive="#ffd166" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <octahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial color="#7fd8c9" emissive="#3f9c96" emissiveIntensity={0.4} />
      </mesh>
      <primitive object={labelSprite} position={[0, 0.36, 0]} scale={[0.75, 0.37, 1]} />
    </group>
  );
}

/** 진찰대 밑 러그 — 바닥이 그대로 이어지지 않고 "여기가 진료 공간의
 *  중심"이라고 읽히도록 하는 넓고 옅은 색 패치(회색 빈 공간 완화). */
function Rug() {
  return (
    <mesh position={[0, 0.005, -1.0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.35, 32]} />
      <meshStandardMaterial color="#e3d9c4" />
    </mesh>
  );
}

/** 벽 아래 걸레받이 띠 — 바닥과 벽이 각지게 만나는 대신 하나의 방으로 읽히게 한다. */
function Baseboard() {
  return (
    <mesh position={[0, 0.06, -2.98]}>
      <boxGeometry args={[7, 0.12, 0.04]} />
      <meshStandardMaterial color="#cfe3df" />
    </mesh>
  );
}

interface ActiveTargets {
  dog?: () => void;
  guardian?: () => void;
  senior?: () => void;
  clipboard?: () => void;
  cabinet?: () => void;
  monitor?: () => void;
  pawSign?: () => void;
}

function buildActiveTargets(
  resolvedTargets: { target: { kind: NamedTargetKind }; choice: Choice }[],
  onChoice: (choice: Choice) => void,
): ActiveTargets {
  const map: ActiveTargets = {};
  for (const { target, choice } of resolvedTargets) {
    map[target.kind] = () => onChoice(choice);
  }
  return map;
}

function ExamRoom({
  showChart,
  active,
  resultPose,
}: {
  showChart: boolean;
  active: ActiveTargets;
  resultPose: boolean;
}) {
  return (
    <group>
      {/* 바닥 — 밝은 아이보리(이전보다 축소해 빈 공간을 줄였다) */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 6]} />
        <meshStandardMaterial color="#f5ede0" />
      </mesh>
      <Rug />
      {/* 뒷벽 — 화이트(이전보다 축소) */}
      <mesh position={[0, 1.8, -3]}>
        <planeGeometry args={[7, 3.7]} />
        <meshStandardMaterial color="#f7f3ea" />
      </mesh>
      <Baseboard />
      <ExamTable />
      <Dog active={!!active.dog} onSelect={active.dog} />
      <Guardian active={!!active.guardian} onSelect={active.guardian} resultPose={resultPose} />
      <SeniorVet active={!!active.senior} onSelect={active.senior} resultPose={resultPose} />
      <ClipboardProp active={!!active.clipboard} onSelect={active.clipboard} showChart={showChart} />
      <Cabinet active={!!active.cabinet} onSelect={active.cabinet} />
      <Monitor active={!!active.monitor} onSelect={active.monitor} />
      <Scale />
      <PawSign active={!!active.pawSign} onSelect={active.pawSign} />
    </group>
  );
}

export default function VetScene({
  mode,
  phase,
  point,
  choices,
  onChoice,
  showChart,
  onSceneError,
}: VetSceneProps) {
  const resolvedTargets = useMemo(
    () => resolveScenePresentation(mode, phase, point, choices).targets,
    [mode, phase, point, choices],
  );
  const activeTargets = useMemo(
    () => buildActiveTargets(resolvedTargets, onChoice),
    [resolvedTargets, onChoice],
  );

  return (
    <XrSceneGuard
      onSceneError={onSceneError}
      fallback={
        <XrScenePlaceholder message="지금 화면에서는 그림 대신 글로 동물병원 체험을 이어가요." />
      }
    >
      <div className="h-[62vh] w-full touch-none overflow-hidden rounded-xl bg-[#f5ede0]">
        <Canvas
          camera={{ position: [0, 1.6, 2.9], fov: DEFAULT_FOV }}
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "low-power" }}
        >
          <CameraRig mode={mode} phase={phase} point={point} />
          <ambientLight intensity={1.0} />
          <directionalLight position={[2, 5, 3]} intensity={1.1} />
          <directionalLight position={[-1.5, 3, 1]} intensity={0.35} color="#ffe4c4" />
          <ExamRoom showChart={showChart} active={activeTargets} resultPose={phase === "result"} />
          {phase === "result" && <CompletionBadge />}
        </Canvas>
      </div>
    </XrSceneGuard>
  );
}
