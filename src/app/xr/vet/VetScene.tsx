"use client";

// ====================================================
// XR 수의사 진료실 씬 — v3 (R3F Canvas 본체, G2.2-R2-L 화면 구성 수정)
//
// [G2.2-R2-L 배경] 대표님의 실제 화면 캡처에서 확인된 문제:
//   1) 강아지가 진찰대 뒤에 가려 거의 보이지 않고, 보호자·선배 수의사가
//      화면 양옆에서 잘림 — 원인은 캐릭터/진찰대 앵커가 "바닥(y=0)"이
//      아니라 임의의 y값에 떠 있었고, 지점별 카메라가 그 지점의 타깃 +
//      강아지만 프레이밍해 보호자·선배 수의사가 계산에서 빠지곤 했기 때문
//      (sceneLayout.ts 상단 주석 참고).
//   2) 선택 단계마다 카메라가 타깃을 따라 크게 이동 — 지점마다 카메라
//      position 자체를 타깃 무게중심으로 재계산했기 때문.
//   3) 장면 속 큰 한글 라벨 카드가 서로/인물과 겹침.
//
// [이번 수정]
//   - 캐릭터(보호자·선배 수의사)·진찰대·약장 앵커를 "바닥에 닿는" 좌표로
//     바로잡았다(sceneLayout.ts의 GUARDIAN_ANCHOR/SENIOR_ANCHOR/
//     CABINET_ANCHOR/TABLE_CENTER가 이제 floor-root). 강아지는 진찰대
//     상판 바로 위·앞쪽에 배치해 상판에 가리지 않는다.
//   - 카메라 position/lookAt을 HERO_CAMERA로 고정하고(sceneLayout.ts),
//     오직 FOV만 "이번에 반드시 보여야 하는 점"(핵심 3인의 발~정수리 +
//     현재 지점 타깃)에 맞춰 완만하게 보정한다 — 더 이상 카메라가 좌우로
//     옮겨가거나 특정 타깃에 과도하게 확대되지 않는다.
//   - 장면 속 선택 표시는 큰 문구 카드 대신 작은 번호 배지 + 하이라이트
//     링으로 바꿨다(VetSceneInteractions.tsx). 정확한 선택 문구는 Canvas
//     밖 HTML 선택지(XrVetClient.tsx)에서 그대로 읽을 수 있다.
//
// [공간] "작은 동물병원 첫 상담실" 하나로 통일 — 중앙 진찰대 위 강아지
//   환자, 한쪽에 보호자, 반대쪽에 흰 가운을 입은 선배 수의사, 주변에
//   진료기록판·약장·체중계·모니터·병원 정체성 소품(발바닥 사인)을 배치한다.
//   드래그·순서교체는 수의사 원본 시나리오에 없으므로 만들지 않는다 —
//   모든 상호작용은 select(장면 속 대상 탭)뿐이다.
//
// [WebGL 가드] 요리사·수의사 공용 XrSceneGuard/XrScenePlaceholder를 그대로
//   재사용한다(이 파일에서 수정하지 않음) — 미지원/런타임 오류 시 이
//   영역만 정적 텍스트 패널로 대체되고 선택/결과 로직은 XrVetClient에
//   그대로 있어 영향이 없다.
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
  type Vec3,
  type VetScenePhase,
} from "./sceneLayout";
import VetSceneInteractions from "./VetSceneInteractions";
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

// G2.2-R2-L — position/lookAt은 sceneLayout의 HERO_CAMERA로 고정이라 더 이상
// 지점마다 바뀌지 않는다. 이 Rig가 매 프레임 하는 일은 오직 "이번에 반드시
// 보여야 하는 점" 목록이 바뀔 때 FOV를 완만하게 재조정하는 것뿐이다.
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

// ---------- 상시 캐릭터/소품 ----------

function Dog() {
  return (
    <group position={DOG_ANCHOR} rotation={[0, 0.3, 0]}>
      {/* 몸통 */}
      <mesh scale={[1.3, 0.8, 1]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#e8c9a0" />
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

// G2.2-R2-L: 이 두 캐릭터의 <group position={ANCHOR}>는 이제 "발이 닿는 바닥"
// 좌표다(sceneLayout.ts의 GUARDIAN_ANCHOR/SENIOR_ANCHOR가 y=0으로 수정됨).
// 아래 로컬 좌표(다리 0.4~0.42, 몸통 0.82~0.85, 머리 1.15~1.26)는 그대로 —
// 이전에도 "발이 y=0에 있다"고 가정하고 쌓아올린 구조였고, 버그는 오직
// ANCHOR 상수의 y값이었다.

function Guardian() {
  return (
    <group position={GUARDIAN_ANCHOR} rotation={[0, -0.5, 0]}>
      {personBase("#e8b98c", "#5a4432")}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.19, 0.22, 0.62, 14]} />
        <meshStandardMaterial color="#ff8a73" />
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

function SeniorVet() {
  return (
    <group position={SENIOR_ANCHOR} rotation={[0, -2.3, 0]}>
      {personBase("#f0cf9e", "#8a8a8a")}
      {/* 흰 가운 */}
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.21, 0.25, 0.68, 14]} />
        <meshStandardMaterial color="#ffffff" />
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

function ClipboardProp({ showChart }: { showChart: boolean }) {
  const checkRef = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const mat = checkRef.current?.material as MeshStandardMaterial | undefined;
    if (mat) mat.emissiveIntensity = 0.4 + Math.abs(Math.sin(clock.elapsedTime * 2)) * 0.4;
  });
  return (
    <group position={CLIPBOARD_ANCHOR} rotation={[-Math.PI / 2.6, 0, 0.05]}>
      <mesh>
        <boxGeometry args={[0.34, 0.44, 0.02]} />
        <meshStandardMaterial color="#f7f3ea" />
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

// G2.2-R2-L: CABINET_ANCHOR도 이제 바닥 좌표다(기존에도 이 로컬 구조는
// "y=0이 바닥"이라고 가정했었다 — 버그는 앵커 상수의 y값 하나였다).
function Cabinet() {
  const doorColors = ["#7fd8c9", "#ff8a73", "#ffd166"];
  return (
    <group position={CABINET_ANCHOR}>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.9, 1.1, 0.4]} />
        <meshStandardMaterial color="#ffffff" />
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

function Monitor() {
  return (
    <group position={MONITOR_ANCHOR}>
      <mesh>
        <boxGeometry args={[0.5, 0.36, 0.03]} />
        <meshStandardMaterial color="#2b2f33" />
      </mesh>
      <mesh position={[0, 0, 0.018]}>
        <boxGeometry args={[0.44, 0.3, 0.005]} />
        <meshStandardMaterial color="#7fd8c9" emissive="#3f9c96" emissiveIntensity={0.3} />
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

// G2.2-R2-L: TABLE_CENTER도 이제 바닥 좌표다(y=0). 다리 상자 높이를 0.65로
// 낮추고 상판 두께를 얇게 잡아 상판이 0.71~0.72 높이에 오도록 했다 —
// DOG_ANCHOR(몸통 중심 y=0.92, 반높이 약 0.18)가 상판 위(0.71~0.72)에
// 자연스럽게 걸치도록 맞춘 값이다(강아지가 상판 속에 파묻히던 문제 수정).
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

/** 병원 정체성 소품 — 발바닥 사인 (텍스트 없이도 동물병원임을 알 수 있게) */
function PawSign() {
  const toeOffsets: Vec3[] = [
    [-0.09, 0.09, 0],
    [-0.03, 0.13, 0],
    [0.03, 0.13, 0],
    [0.09, 0.09, 0],
  ];
  return (
    <group position={WALL_SIGN_ANCHOR}>
      <mesh>
        <boxGeometry args={[0.7, 0.5, 0.03]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, -0.03, 0.02]} scale={[1, 0.8, 1]}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial color="#ff8a73" />
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

function ExamRoom({ showChart }: { showChart: boolean }) {
  return (
    <group>
      {/* 바닥 — 밝은 아이보리 */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#f5ede0" />
      </mesh>
      {/* 뒷벽 — 화이트 */}
      <mesh position={[0, 2, -3]}>
        <planeGeometry args={[10, 4.2]} />
        <meshStandardMaterial color="#f7f3ea" />
      </mesh>
      <ExamTable />
      <Dog />
      <Guardian />
      <SeniorVet />
      <ClipboardProp showChart={showChart} />
      <Cabinet />
      <Monitor />
      <Scale />
      <PawSign />
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
          <ExamRoom showChart={showChart} />
          {resolvedTargets.length > 0 && (
            <VetSceneInteractions targets={resolvedTargets} onChoice={onChoice} />
          )}
          {phase === "result" && <CompletionBadge />}
        </Canvas>
      </div>
    </XrSceneGuard>
  );
}
