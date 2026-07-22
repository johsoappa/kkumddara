"use client";

// ====================================================
// XR Chef 주방 씬 — v0.0 (R3F Canvas 본체)
//
// 방식 A: 기본 geometry 저폴리곤 주방 (외부 에셋/텍스처 없음)
//   - 대용량 GLB·고해상도 텍스처·애니메이션 사용 금지 (성능 검증 목적)
//   - 씬은 고정 카메라 정적 렌더링 — 컨트롤/물리 없음
//   - Canvas는 고정 높이 박스 안에만 렌더링 → 페이지 스크롤/버튼 터치 방해 없음
// ====================================================

import { Canvas } from "@react-three/fiber";

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

export default function ChefScene() {
  return (
    <div className="h-[60vh] w-full overflow-hidden rounded-xl bg-[#efe9dd]">
      <Canvas
        camera={{ position: [0, 1.8, 3.2], fov: 55 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "low-power" }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 4]} intensity={1.1} />
        <Kitchen />
      </Canvas>
    </div>
  );
}
