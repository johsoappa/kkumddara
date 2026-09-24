"use client";

// ====================================================
// XR 수의사 진료실 씬 — v5 (R3F Canvas 본체, G2.2-R3-B 상담 스토리 전면 구현)
//
// [G2.2-R2-L2 유산] 모든 choice는 실제 진료실 오브젝트(강아지·보호자·선배
// 수의사·기록판·약장·모니터·병원 사인)를 직접 가리킨다(일부는 이제
// actionCard로 HTML 전용 — sceneLayout.ts 참고). 오브젝트 컴포넌트 자신이
// 보이지 않는 hit box(TapHitBox)와 필요하면 발밑의 아주 작은 링
// (BaseHighlight)을 자기 group 안에 포함시킨다.
//
// [G2.2-R3-B 변경] 실제 화면 검수에서 "본체 색이 단계마다 바뀐다"는 지적을
// 받았다 — 원인은 활성 타깃일 때 본체 재질의 emissiveIntensity를 펄스시키던
// useActiveGlow였다. 이번 버전은 그 메커니즘을 완전히 제거했다: 모든
// meshStandardMaterial의 color/emissive는 phase·active 여부와 무관하게
// 고정 상수다. 선택 가능 상태는 BaseHighlight(3D, 발밑) + SceneTargetPins
// (DOM, Canvas 위 오버레이 — 핀 좌표는 mode/point/phase/FOV/Canvas 크기가
// 바뀔 때만 재계산, 매 프레임 아님)만으로 표현한다.
//
// [카메라] sceneLayout.ts의 HERO_CAMERA(position/lookAt 고정) + FOV만
//   지점별로 보정하는 구조는 그대로 유지한다.
//
// [단계 전환] vetStoryboard.ts의 resolveStage()가 mode+phase+point(+방금
//   고른 대상의 kind)로 인물 자세·강아지 행동·기록판 상태·대기 보호자
//   등장을 선언형으로 계산한다 — 매 point가 이전 point와 최소 2개 요소가
//   달라지도록 데이터 자체가 보장한다. 결과 화면은 완료 배지 + 인물이
//   서로를 향해 도는 자세 + 강아지가 엎드리는 자세로 "상담을 마친 장면"을
//   표현한다. scenario.ts의 choice ID·axis·집계 로직은 건드리지 않는다.
//
// [WebGL 가드] 요리사·수의사 공용 XrSceneGuard/XrScenePlaceholder를 그대로
//   재사용한다(이 파일에서 수정하지 않음).
// ====================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { Mesh, MeshStandardMaterial, PerspectiveCamera } from "three";
import type { Choice } from "./scenario";
import {
  CABINET_ANCHOR,
  CLIPBOARD_ANCHOR,
  DOOR_ANCHOR,
  DOG_ANCHOR,
  GUARDIAN_ANCHOR,
  MONITOR_ANCHOR,
  RESULT_BADGE_POINT,
  SCALE_ANCHOR,
  SENIOR_ANCHOR,
  TABLE_CENTER,
  WALL_SIGN_ANCHOR,
  computeChoicePinPixels,
  easeAlpha,
  easeScalar,
  fitVerticalFov,
  framingPointsForPositions,
  resolveScenePresentation,
  sceneInteractionId,
  type ChoicePinPixel,
  type NamedTargetKind,
  type Vec3,
  type VetScenePhase,
} from "./sceneLayout";
import { targetKindForChoice, resolveStage, type StagePose } from "./vetStoryboard";
import { BaseHighlight, TapHitBox, useTapHover } from "./VetSceneInteractions";
import { createVetLabelSprite } from "./vetLabelSprite";
import SceneTargetPins from "./SceneTargetPins";
import VetSceneHud from "./VetSceneHud";
import WaitingPair from "./WaitingPair";
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
  /** reaction 단계에서 "방금 고른" choice.id — 자세·기록판 반응 계산에 쓴다(선택적). */
  lastChoiceId?: string | null;
  /** Canvas 위 DOM HUD에 보여줄 현재 단계 텍스트(선택적 — 없으면 HUD를 그리지 않는다). */
  hud?: { stepLabel: string; speakerLabel: string; text: string };
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

// G2.2-R3-B: useActiveGlow(본체 재질의 emissiveIntensity를 active 여부로
// 펄스시키던 훅)를 완전히 제거했다 — "본체 색이 단계마다 바뀐다"는 실제
// 화면 지적의 원인이었다. 이제 본체 meshStandardMaterial은 모두 고정
// 상수 props다(색이 phase·active와 무관). 선택 가능 상태는 BaseHighlight
// (발밑 링, VetSceneInteractions.tsx)와 SceneTargetPins(Canvas 위 DOM
// 핀, 이 파일 하단)만으로 표현한다.

interface InteractiveProps {
  /** 이 지점에서 선택 가능한 타깃이면 true — hit box/발밑 링을 켠다(본체 재질은 절대 바꾸지 않는다). */
  active: boolean;
  onSelect?: () => void;
}

// ---------- 상시 캐릭터/소품 ----------

interface DogProps extends InteractiveProps {
  /** vetStoryboard.ts의 resolveStage()가 계산한 절대 yaw(라디안). */
  yaw: number;
  /** 고개를 든 자세(관찰/reaction 강조) — 몸 전체를 살짝 들어 올리는 근사치다. */
  headUp: boolean;
  /** 고개를 낮춘 조용한 자세(intro·새싹1). */
  low: boolean;
  /** 결과 화면 전용 — 편안히 엎드린 자세. */
  resting: boolean;
}

function Dog({ active, onSelect, yaw, headUp, low, resting }: DogProps) {
  const { hovered, setHovered } = useTapHover();
  const tiltX = headUp ? -0.12 : low ? 0.16 : resting ? 0.05 : 0;
  const posY = resting ? DOG_ANCHOR[1] - 0.1 : low ? DOG_ANCHOR[1] - 0.03 : DOG_ANCHOR[1];
  const bodyScaleY = resting ? 0.62 : 0.8;
  return (
    <group
      position={[DOG_ANCHOR[0], posY, DOG_ANCHOR[2]]}
      rotation={[tiltX, yaw, 0]}
      scale={hovered ? 1.05 : 1}
    >
      {active && onSelect && (
        <>
          <TapHitBox size={[0.75, 0.6, 0.75]} onSelect={onSelect} onHoverChange={setHovered} />
          <BaseHighlight y={-0.2} hovered={hovered} innerRadius={0.24} outerRadius={0.3} color="#ffb26b" />
        </>
      )}
      {/* 몸통 — 본체 색은 phase·active와 무관하게 항상 고정이다(G2.2-R3-B) */}
      <mesh scale={[1.3, bodyScaleY, 1]}>
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

/** 머리(피부·머리카락) + 얼굴(눈·코). 얼굴이 있어야 인물이 어느 쪽을 보는지(정면/테이블/서로)
 *  화면에서 구분된다(G2.2-R3-C — 이전에는 얼굴이 없어 회전이 보이지 않았다). 앞은 +z. */
function personBase(skin: string, hair: string) {
  return (
    <>
      <mesh position={[0, 1.15, 0]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0, 1.26, -0.02]} scale={[1, 0.65, 1]}>
        <sphereGeometry args={[0.15, 14, 14]} />
        <meshStandardMaterial color={hair} />
      </mesh>
      <mesh position={[-0.055, 1.17, 0.145]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#2a2320" />
      </mesh>
      <mesh position={[0.055, 1.17, 0.145]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#2a2320" />
      </mesh>
      <mesh position={[0, 1.125, 0.16]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshStandardMaterial color="#d9a273" />
      </mesh>
    </>
  );
}

/** 어깨(y=1.1)를 축으로 팔이 앞(+z)으로 들리는 제스처. reach=0이면 원래 자세. */
function Arm({ side, reach, color, radius }: { side: 1 | -1; reach: number; color: string; radius: number }) {
  return (
    <group position={[side * 0.22, 1.1, 0]} rotation={[-reach, 0, -side * 0.35]}>
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[radius, radius, 0.5, 10]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

// 이 두 캐릭터의 <group position={ANCHOR}>는 "발이 닿는 바닥" 좌표다
// (sceneLayout.ts의 GUARDIAN_ANCHOR/SENIOR_ANCHOR가 y=0). yaw·offset·arm은
// vetStoryboard.ts의 resolveStage()가 mode+phase+point(+방금 고른 대상)로
// 계산한 값이다 — 단계별로 방향·위치·팔 제스처가 실제로 달라진다.

interface PersonProps extends InteractiveProps {
  yaw: number;
  arm: number;
  offset: [number, number];
}

function Guardian({ active, onSelect, yaw, arm, offset }: PersonProps) {
  const { hovered, setHovered } = useTapHover();
  return (
    <group position={[GUARDIAN_ANCHOR[0] + offset[0], 0, GUARDIAN_ANCHOR[2] + offset[1]]} rotation={[0, yaw, 0]}>
      {active && onSelect && (
        <>
          <TapHitBox size={[0.7, 1.5, 0.7]} centerY={0.75} onSelect={onSelect} onHoverChange={setHovered} />
          <BaseHighlight y={0.015} hovered={hovered} />
        </>
      )}
      {personBase("#e8b98c", "#5a4432")}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.19, 0.22, 0.62, 14]} />
        <meshStandardMaterial color="#ff8a73" />
      </mesh>
      <Arm side={-1} reach={arm} color="#ff8a73" radius={0.045} />
      <Arm side={1} reach={arm} color="#ff8a73" radius={0.045} />
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.2, 0.19, 0.5, 14]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
    </group>
  );
}

function SeniorVet({ active, onSelect, yaw, arm, offset }: PersonProps) {
  const { hovered, setHovered } = useTapHover();
  return (
    <group position={[SENIOR_ANCHOR[0] + offset[0], 0, SENIOR_ANCHOR[2] + offset[1]]} rotation={[0, yaw, 0]}>
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
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* 가운 앞 여밈·깃(청록) — 밝은 벽 앞에서도 가운 윤곽이 읽히도록 */}
      <mesh position={[0, 0.82, 0.235]}>
        <boxGeometry args={[0.06, 0.6, 0.02]} />
        <meshStandardMaterial color="#7fb8ae" />
      </mesh>
      <mesh position={[0, 1.08, 0.18]}>
        <boxGeometry args={[0.26, 0.05, 0.05]} />
        <meshStandardMaterial color="#7fb8ae" />
      </mesh>
      <Arm side={-1} reach={arm} color="#ffffff" radius={0.048} />
      <Arm side={1} reach={arm} color="#ffffff" radius={0.048} />
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

interface ClipboardProps extends InteractiveProps {
  /** 지점3 이후 상시 표시(기존 showChart와 동일 시점 — 최소 1줄 보장). */
  showChart: boolean;
  /** 기록된 관찰 줄 수(0~4) — 선택에 따라 실제로 누적된다. */
  rows: number;
  /** 들어 올려 세운 상태(기록 중). */
  lifted: boolean;
  /** 보호자 쪽으로 돌린 각도(라디안). */
  yaw: number;
}

const ROW_COLORS = ["#3f9c96", "#ff8a73", "#e8b23c", "#7fb8ae"];

function ClipboardProp({ active, onSelect, showChart, rows, lifted, yaw }: ClipboardProps) {
  const { hovered, setHovered } = useTapHover();
  const shownRows = Math.max(rows, showChart ? 1 : 0);
  const tiltX = lifted ? -0.8 : -Math.PI / 2.6;
  return (
    <group
      position={[CLIPBOARD_ANCHOR[0], CLIPBOARD_ANCHOR[1] + (lifted ? 0.12 : 0), CLIPBOARD_ANCHOR[2] + (lifted ? 0.03 : 0)]}
      rotation={[tiltX, yaw, 0.05]}
      scale={1.4}
    >
      {active && onSelect && (
        <TapHitBox size={[0.44, 0.54, 0.15]} onSelect={onSelect} onHoverChange={setHovered} />
      )}
      <mesh scale={hovered ? 1.06 : 1}>
        <boxGeometry args={[0.34, 0.44, 0.02]} />
        <meshStandardMaterial color="#f7f3ea" />
      </mesh>
      <mesh position={[0, 0.2, 0.012]}>
        <boxGeometry args={[0.1, 0.03, 0.01]} />
        <meshStandardMaterial color="#8a8f8d" />
      </mesh>
      {/* 기록 줄 — 고른 행동에 따라 개수가 실제로 늘어난다(식욕·활동·모습·순서 기록) */}
      {Array.from({ length: shownRows }).map((_, i) => (
        <mesh key={i} position={[0, 0.11 - i * 0.075, 0.014]}>
          <boxGeometry args={[0.24, 0.035, 0.008]} />
          <meshStandardMaterial color={ROW_COLORS[i % ROW_COLORS.length]} />
        </mesh>
      ))}
      {/* 연필 */}
      <mesh position={[0.16, -0.18, 0.03]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
        <meshStandardMaterial color="#e8b23c" />
      </mesh>
    </group>
  );
}

/** 안내 카드(그림 안내카드 / 정리 표시카드) — 새싹3·나침반4·5·결과에서 진찰대 위에 놓인다. */
function AidCard({ kind }: { kind: "none" | "guide" | "tabs" }) {
  if (kind === "none") return null;
  if (kind === "tabs") {
    const tabColors = ["#7fd8c9", "#ff8a73", "#ffd166"];
    return (
      <group position={[0.3, 0.76, -0.64]} rotation={[-1.0, -0.3, 0]}>
        {tabColors.map((color, i) => (
          <mesh key={color} position={[i * 0.11, 0, i * 0.005]} rotation={[0, 0, (i - 1) * 0.12]}>
            <boxGeometry args={[0.1, 0.15, 0.015]} />
            <meshStandardMaterial color={color} />
          </mesh>
        ))}
      </group>
    );
  }
  return (
    <group position={[0.34, 0.76, -0.64]} rotation={[-1.0, -0.6, 0]}>
      <mesh>
        <boxGeometry args={[0.26, 0.19, 0.015]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, -0.02, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.006, 16]} />
        <meshStandardMaterial color="#ff8a73" />
      </mesh>
      {[-0.06, -0.02, 0.02, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.045, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.006, 12]} />
          <meshStandardMaterial color="#ff8a73" />
        </mesh>
      ))}
    </group>
  );
}

function Cabinet({ active, onSelect }: InteractiveProps) {
  const { hovered, setHovered } = useTapHover();
  const doorColors = ["#7fd8c9", "#ff8a73", "#ffd166"];
  return (
    <group position={CABINET_ANCHOR}>
      {active && onSelect && (
        <TapHitBox size={[1.0, 1.2, 0.5]} centerY={0.6} onSelect={onSelect} onHoverChange={setHovered} />
      )}
      <mesh scale={hovered ? 1.03 : 1}>
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

function Monitor({ active, onSelect }: InteractiveProps) {
  const { hovered, setHovered } = useTapHover();
  return (
    <group position={MONITOR_ANCHOR}>
      {active && onSelect && (
        <TapHitBox size={[0.6, 0.5, 0.25]} onSelect={onSelect} onHoverChange={setHovered} />
      )}
      <mesh scale={hovered ? 1.05 : 1}>
        <boxGeometry args={[0.5, 0.36, 0.03]} />
        <meshStandardMaterial color="#2b2f33" />
      </mesh>
      {/* 화면 — 참고용 모니터라는 걸 나타내는 상시 은은한 밝기(active와 무관, 고정값) */}
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

/** 진찰대 밑 러그 — "여기가 진료 공간의 중심"이라고 읽히는 옅은 민트색 패치. */
function Rug() {
  return (
    <mesh position={[0, 0.005, -1.0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.35, 32]} />
      <meshStandardMaterial color="#d8e8e3" />
    </mesh>
  );
}

/** 벽 아래 걸레받이 띠 + 밝은 민트 벽 하단 띠(웨인스코팅) — 바닥과 벽이 하나의 방으로 읽히게 한다. */
function Baseboard() {
  return (
    <>
      <mesh position={[0, 0.06, -2.98]}>
        <boxGeometry args={[9, 0.12, 0.04]} />
        <meshStandardMaterial color="#9fd6c9" />
      </mesh>
      <mesh position={[0, 0.45, -2.995]}>
        <boxGeometry args={[9, 0.7, 0.01]} />
        <meshStandardMaterial color="#d3ebe4" />
      </mesh>
    </>
  );
}

/** 뒷벽 오른쪽의 문 — 대기 보호자가 서 있는 "대기 구역"으로 읽히는 배경 요소. */
function Door() {
  return (
    <group position={DOOR_ANCHOR}>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[1.0, 2.0, 0.05]} />
        <meshStandardMaterial color="#7fc7b8" />
      </mesh>
      <mesh position={[0, 0.95, 0.03]}>
        <boxGeometry args={[0.84, 1.9, 0.03]} />
        <meshStandardMaterial color="#f1dfbb" />
      </mesh>
      <mesh position={[0, 1.45, 0.05]}>
        <boxGeometry args={[0.3, 0.42, 0.01]} />
        <meshStandardMaterial color="#cfe8f2" />
      </mesh>
      <mesh position={[-0.3, 0.95, 0.06]}>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshStandardMaterial color="#e0b14a" />
      </mesh>
    </group>
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

interface ExamRoomProps {
  showChart: boolean;
  active: ActiveTargets;
  pose: StagePose;
  dogResting: boolean;
}

function ExamRoom({ showChart, active, pose, dogResting }: ExamRoomProps) {
  return (
    <group>
      {/* 바닥 — 밝은 베이지 */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 6]} />
        <meshStandardMaterial color="#e7e0d4" />
      </mesh>
      <Rug />
      {/* 뒷벽 — 따뜻한 아이보리 */}
      <mesh position={[0, 1.8, -3]}>
        <planeGeometry args={[9, 3.7]} />
        <meshStandardMaterial color="#f4efe4" />
      </mesh>
      <Baseboard />
      <Door />
      <ExamTable />
      <AidCard kind={pose.card} />
      <Dog
        active={!!active.dog}
        onSelect={active.dog}
        yaw={pose.dogYaw}
        headUp={pose.dogHeadUp}
        low={pose.dogLow}
        resting={dogResting}
      />
      <Guardian
        active={!!active.guardian}
        onSelect={active.guardian}
        yaw={pose.guardianYaw}
        arm={pose.guardianArm}
        offset={pose.guardianOffset}
      />
      <SeniorVet
        active={!!active.senior}
        onSelect={active.senior}
        yaw={pose.seniorYaw}
        arm={pose.seniorArm}
        offset={pose.seniorOffset}
      />
      <ClipboardProp
        active={!!active.clipboard}
        onSelect={active.clipboard}
        showChart={showChart}
        rows={pose.clipboardRows}
        lifted={pose.clipboardLifted}
        yaw={pose.clipboardYaw}
      />
      <Cabinet active={!!active.cabinet} onSelect={active.cabinet} />
      <Monitor active={!!active.monitor} onSelect={active.monitor} />
      <Scale />
      <PawSign active={!!active.pawSign} onSelect={active.pawSign} />
      <WaitingPair visible={pose.waitingPairVisible} />
    </group>
  );
}

/** Canvas 래퍼 크기를 추적한다 — 핀 좌표(computeChoicePinPixels)는 매
 *  프레임이 아니라 이 크기가 실제로 바뀔 때만 다시 계산해야 하므로
 *  useFrame이 아닌 ResizeObserver를 쓴다. jsdom 등 ResizeObserver가 없는
 *  환경에서는 최초 1회 크기만 사용한다. */
function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

export default function VetScene({
  mode,
  phase,
  point,
  choices,
  onChoice,
  showChart,
  lastChoiceId,
  hud,
  onSceneError,
}: VetSceneProps) {
  const { ref: wrapperRef, size } = useElementSize<HTMLDivElement>();

  const resolvedTargets = useMemo(
    () => resolveScenePresentation(mode, phase, point, choices).targets,
    [mode, phase, point, choices],
  );
  const activeTargets = useMemo(
    () => buildActiveTargets(resolvedTargets, onChoice),
    [resolvedTargets, onChoice],
  );

  const currentSceneId = sceneInteractionId(mode, point);
  const lastChoiceKind = useMemo(
    () => (lastChoiceId ? targetKindForChoice(currentSceneId, lastChoiceId) : null),
    [currentSceneId, lastChoiceId],
  );
  const stage = useMemo(
    () => resolveStage(mode, phase, point, lastChoiceKind, lastChoiceId),
    [mode, phase, point, lastChoiceKind, lastChoiceId],
  );

  // 핀 좌표: mode/point/phase/choices/Canvas 크기가 바뀔 때만 재계산한다
  // (useFrame 아님 — sceneLayout.ts의 순수 함수를 그대로 재사용). 인물이 자세
  // 연출로 옮겨 서 있으면 핀 계산에도 같은 이동을 반영한다.
  const guardianShift = stage.pose.guardianOffset;
  const seniorShift = stage.pose.seniorOffset;
  const pins: ChoicePinPixel[] = useMemo(() => {
    if (phase !== "choosing") return [];
    return computeChoicePinPixels(currentSceneId, choices, size.width, size.height, {
      guardian: guardianShift,
      senior: seniorShift,
    });
  }, [phase, currentSceneId, choices, size.width, size.height, guardianShift, seniorShift]);

  return (
    <XrSceneGuard
      onSceneError={onSceneError}
      fallback={
        <XrScenePlaceholder message="지금 화면에서는 그림 대신 글로 동물병원 체험을 이어가요." />
      }
    >
      <div
        ref={wrapperRef}
        className="relative h-[300px] w-full touch-none overflow-hidden rounded-xl bg-[#f4efe4] sm:h-[360px] md:h-[420px]"
      >
        {/* flat: 기본 ACES 톤매핑이 벽·바닥을 회색으로 눌러 밝은 진료실 톤(G2.2-R3-C)을 해쳐서, 작성한 색이 그대로 나오도록 톤매핑만 끈다(조명/재질은 단계·active와 무관). */}
        <Canvas
          flat
          camera={{ position: [0, 1.6, 2.9], fov: DEFAULT_FOV }}
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "low-power" }}
        >
          <CameraRig mode={mode} phase={phase} point={point} />
          <ambientLight intensity={1.0} />
          <hemisphereLight args={["#ffffff", "#f2e6d0", 0.5]} />
          <directionalLight position={[2, 5, 3]} intensity={0.9} />
          <directionalLight position={[-1.5, 3, 1]} intensity={0.35} color="#ffe4c4" />
          <ExamRoom
            showChart={showChart}
            active={activeTargets}
            pose={stage.pose}
            dogResting={stage.dogResting}
          />
          {phase === "result" && <CompletionBadge />}
        </Canvas>
        {hud && phase !== "result" && (
          <VetSceneHud stepLabel={hud.stepLabel} speakerLabel={hud.speakerLabel} text={hud.text} />
        )}
        <SceneTargetPins pins={pins} />
      </div>
    </XrSceneGuard>
  );
}
