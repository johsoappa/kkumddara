"use client";

// ====================================================
// XR 수의사 진료실 씬 — v1 (R3F Canvas 본체)
//
// 참고 브랜치(goal/dream-map-qa-20260830, cf277c8)의 VetScene v0.3을
// 그대로 이식했다 — 요리사 G2.1-R1의 인캔버스 직접 조작(드래그/카메라
// 감쇠 보간/씬 라벨)은 수의사 원본 시나리오에 없는 상호작용이라
// 이식하지 않는다(작업지시서 3-1). 카메라는 원본과 동일하게 stage가
// 바뀔 때 useLayoutEffect로 즉시 스냅 이동한다.
//
// 공용 XrSceneGuard/XrScenePlaceholder는 요리사·수의사가 그대로 공유한다
// (이 파일에서 수정하지 않음 — WebGL 미지원/Canvas 오류 시 이 영역만
// 정적 텍스트 패널로 대체되고, 선택/결과 로직은 XrVetClient에 그대로 있다).
// ====================================================

import { useLayoutEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import type { CameraStage } from "./scenario";
import XrSceneGuard from "../XrSceneGuard";
import XrScenePlaceholder from "../XrScenePlaceholder";

export interface VetSceneProps {
  stage: CameraStage;
  /** 지점4 이후 진찰대 위 진료기록판 표시 (ChefScene의 showPlate와 동일 패턴) */
  showChart: boolean;
}

// 단계별 카메라 좌표 테이블 (position + lookAt 쌍)
// 진찰대(중심 [0, 1, -1.2])가 항상 프레임에 들어오도록 이동 폭은 보수적으로 유지
const CAMERA_STAGES: Record<
  CameraStage,
  { position: [number, number, number]; lookAt: [number, number, number] }
> = {
  // 진료실 전체 기본 시점 (intro/result)
  overview: { position: [0, 1.8, 3.2], lookAt: [0, 1.1, -1.2] },
  // 지점1: 진찰대 쪽으로 약간 접근 — 상담 시작 느낌
  approach: { position: [0, 1.6, 2.3], lookAt: [0, 1.0, -1.2] },
  // 지점2: 보호자 쪽 측면 시점 — 이야기를 듣는 느낌
  search: { position: [-1.0, 1.4, 2.1], lookAt: [0.2, 0.8, -1.2] },
  // 지점3: 살짝 뒤로 물러나 진료실 전체 — 상황을 살피는 느낌
  survey: { position: [0, 2.1, 3.6], lookAt: [0, 1.0, -1.2] },
  // 지점4·5: 진찰대 위 기록판 쪽으로 근접 — 기록·안내 마무리 느낌
  plating: { position: [0.4, 1.6, 0.6], lookAt: [0.1, 1.05, -1.1] },
};

// 카메라 스냅 이동 담당 — Canvas 내부에서만 사용 (재마운트 없이 좌표만 변경)
function CameraRig({ stage }: { stage: CameraStage }) {
  const camera = useThree((state) => state.camera);
  useLayoutEffect(() => {
    const { position, lookAt } = CAMERA_STAGES[stage];
    camera.position.set(position[0], position[1], position[2]);
    camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
  }, [camera, stage]);
  return null;
}

// 진료기록판 — 지점4 이후 진찰대 위에 등장하는 소품
function Chart() {
  return (
    <mesh position={[0.1, 1.09, -1.0]} rotation={[-Math.PI / 2.6, 0, 0.05]}>
      <boxGeometry args={[0.32, 0.42, 0.02]} />
      <meshStandardMaterial color="#f5f2ea" />
    </mesh>
  );
}

function Clinic() {
  return (
    <group>
      {/* 바닥 */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#cfe3df" />
      </mesh>

      {/* 뒷벽 */}
      <mesh position={[0, 2, -3]}>
        <planeGeometry args={[10, 4.2]} />
        <meshStandardMaterial color="#f3f6f4" />
      </mesh>

      {/* 진찰대 */}
      <mesh position={[0, 0.5, -1.2]}>
        <boxGeometry args={[4, 1, 1.2]} />
        <meshStandardMaterial color="#7f9a95" />
      </mesh>
      {/* 진찰대 상판 */}
      <mesh position={[0, 1.02, -1.2]}>
        <boxGeometry args={[4.1, 0.08, 1.3]} />
        <meshStandardMaterial color="#e8ece9" />
      </mesh>

      {/* 이동장(보호자가 데려온 반려동물) */}
      <mesh position={[-0.9, 1.25, -1.2]}>
        <boxGeometry args={[0.55, 0.4, 0.4]} />
        <meshStandardMaterial color="#c9a06a" />
      </mesh>

      {/* 청진기 트레이 */}
      <mesh position={[0.8, 1.09, -1.1]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.5, 0.03, 0.35]} />
        <meshStandardMaterial color="#d7dad8" />
      </mesh>

      {/* 상부 수납장 */}
      <mesh position={[0, 3, -2.6]}>
        <boxGeometry args={[4, 0.9, 0.7]} />
        <meshStandardMaterial color="#8fa89e" />
      </mesh>

      {/* 진료실 조명등 */}
      <mesh position={[0, 2.2, -1.2]}>
        <boxGeometry args={[1.4, 0.5, 0.8]} />
        <meshStandardMaterial color="#dfe3e1" />
      </mesh>
    </group>
  );
}

export default function VetScene({ stage, showChart }: VetSceneProps) {
  return (
    <XrSceneGuard
      fallback={
        <XrScenePlaceholder message="지금 화면에서는 그림 대신 글로 동물병원 체험을 이어가요." />
      }
    >
      <div className="h-[60vh] w-full overflow-hidden rounded-xl bg-[#eaf1ef]">
        <Canvas
          camera={{ position: [0, 1.8, 3.2], fov: 55 }}
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "low-power" }}
        >
          <CameraRig stage={stage} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[3, 5, 4]} intensity={1.1} />
          <Clinic />
          {showChart && <Chart />}
        </Canvas>
      </div>
    </XrSceneGuard>
  );
}
