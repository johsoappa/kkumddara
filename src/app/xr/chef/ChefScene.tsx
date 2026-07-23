"use client";

// ====================================================
// XR Chef 주방 씬 — v0.2 (R3F Canvas 본체)
//
// 방식 A: 기본 geometry 저폴리곤 주방 (외부 에셋/텍스처 없음)
//   - 대용량 GLB·고해상도 텍스처·애니메이션 사용 금지 (성능 검증 목적)
//   - Canvas는 고정 높이 박스 안에만 렌더링 → 페이지 스크롤/버튼 터치 방해 없음
//
// v0.2 추가:
//   - stage props에 따라 CameraRig가 카메라를 즉시(스냅) 이동 — 보간 금지
//     Canvas camera prop은 초기값 전용이라 마운트 후 변경이 반영되지 않으므로,
//     useThree()로 camera를 얻어 useLayoutEffect에서 직접 좌표를 바꾼다
//   - showPlate props로 조리대 위 접시 1개 표시 (mesh 단위 조건부 —
//     Canvas 재마운트 아님)
// ====================================================

import { useLayoutEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import type { CameraStage } from "./scenario";

export interface ChefSceneProps {
  stage: CameraStage;
  showPlate: boolean;
}

// 단계별 카메라 좌표 테이블 (position + lookAt 쌍)
// 조리대(중심 [0, 1, -1.2])가 항상 프레임에 들어오도록 이동 폭은 보수적으로 유지
const CAMERA_STAGES: Record<
  CameraStage,
  { position: [number, number, number]; lookAt: [number, number, number] }
> = {
  // 주방 전체 기본 시점 (intro/result) — v0.1 초기 시점과 동일한 위치
  overview: { position: [0, 1.8, 3.2], lookAt: [0, 1.1, -1.2] },
  // 지점1: 조리대 쪽으로 약간 접근 — 작업 시작 느낌
  approach: { position: [0, 1.6, 2.3], lookAt: [0, 1.0, -1.2] },
  // 지점2: 조리대 아래·측면 쪽 — 무언가 찾는 느낌
  search: { position: [-1.3, 1.1, 1.5], lookAt: [-0.4, 0.6, -1.2] },
  // 지점3: 살짝 뒤로 물러나 조리대 전체 — 상황을 살피는 느낌
  survey: { position: [0, 2.1, 3.6], lookAt: [0, 1.0, -1.2] },
  // 지점4·5: 조리대 위 접시 쪽으로 근접 — 마무리 작업 느낌
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

// 접시 — 지점3 이후 조리대 위에 등장하는 소품 (v0.2 유일한 추가 소품)
function Plate() {
  return (
    <mesh position={[0.1, 1.09, -1.0]}>
      <cylinderGeometry args={[0.3, 0.25, 0.05, 20]} />
      <meshStandardMaterial color="#f5f2ea" />
    </mesh>
  );
}

function Kitchen() {
  return (
    <group>
      {/* 바닥 */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#d9c9a8" />
      </mesh>

      {/* 뒷벽 */}
      <mesh position={[0, 2, -3]}>
        <planeGeometry args={[10, 4.2]} />
        <meshStandardMaterial color="#f3ede2" />
      </mesh>

      {/* 조리대 */}
      <mesh position={[0, 0.5, -1.2]}>
        <boxGeometry args={[4, 1, 1.2]} />
        <meshStandardMaterial color="#8a6f4d" />
      </mesh>
      {/* 조리대 상판 */}
      <mesh position={[0, 1.02, -1.2]}>
        <boxGeometry args={[4.1, 0.08, 1.3]} />
        <meshStandardMaterial color="#e8e4dc" />
      </mesh>

      {/* 냄비 (몸통 + 손잡이) */}
      <mesh position={[-0.9, 1.25, -1.2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.35, 16]} />
        <meshStandardMaterial color="#5a5f66" />
      </mesh>
      <mesh position={[-0.45, 1.3, -1.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
        <meshStandardMaterial color="#3b3f45" />
      </mesh>

      {/* 도마 */}
      <mesh position={[0.8, 1.09, -1.1]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.9, 0.05, 0.5]} />
        <meshStandardMaterial color="#c79a63" />
      </mesh>

      {/* 상부장 */}
      <mesh position={[0, 3, -2.6]}>
        <boxGeometry args={[4, 0.9, 0.7]} />
        <meshStandardMaterial color="#a68a68" />
      </mesh>

      {/* 후드 */}
      <mesh position={[0, 2.2, -1.2]}>
        <boxGeometry args={[1.4, 0.5, 0.8]} />
        <meshStandardMaterial color="#9aa0a6" />
      </mesh>
    </group>
  );
}

export default function ChefScene({ stage, showPlate }: ChefSceneProps) {
  return (
    <div className="h-[60vh] w-full overflow-hidden rounded-xl bg-[#efe9dd]">
      <Canvas
        camera={{ position: [0, 1.8, 3.2], fov: 55 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "low-power" }}
      >
        <CameraRig stage={stage} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 4]} intensity={1.1} />
        <Kitchen />
        {showPlate && <Plate />}
      </Canvas>
    </div>
  );
}
