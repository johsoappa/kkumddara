"use client";

// ====================================================
// WaitingPair — 나침반 3지점("기록을 마치기 전에 다음 보호자와 동물이
// 도착했어요") 전용 배경 소품 (G2.2-R3-B 신규, G2.2-R3-C 재구성)
//
// R3-C: 이전에는 선배 수의사 바로 뒤에 회색 덩어리로 겹쳐 사람으로 읽히지
// 않았다. 이제 뒷벽 오른쪽 문(VetScene의 Door) 앞에 서 있는 작은 그룹으로
// 배치한다 — 선배와 화면상 분리되고, 머리·상의(파랑)·하의·얼굴이 구분되며,
// 주황색 이동장이 인물 옆 바닥에 분명히 보인다. 주인공 보호자(코랄 상의)와
// 색·크기(0.85배)로 구분한다. 상호작용이 없다(TapHitBox 없음) — 이 지점의
// 3개 choice는 이미 병원 사인/모니터/선배 수의사로 매핑돼 있다.
// ====================================================

import { WAITING_PAIR_ANCHOR } from "./sceneLayout";

export default function WaitingPair({ visible, far = false }: { visible: boolean; far?: boolean }) {
  if (!visible) return null;
  // far(4단계): 문 쪽 더 뒤로 물러나 작아진다 — 갑자기 사라지지 않고 주목 대상에서 벗어난다.
  const position: [number, number, number] = far
    ? [WAITING_PAIR_ANCHOR[0] + 0.3, 0, WAITING_PAIR_ANCHOR[2] - 0.45]
    : WAITING_PAIR_ANCHOR;
  return (
    <group position={position} rotation={[0, -0.5, 0]} scale={far ? 0.55 : 0.85}>
      {/* 다음 보호자 */}
      <mesh position={[0, 1.15, 0]}>
        <sphereGeometry args={[0.16, 14, 14]} />
        <meshStandardMaterial color="#f2c9a0" />
      </mesh>
      <mesh position={[0, 1.26, -0.02]} scale={[1, 0.65, 1]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#2f3a56" />
      </mesh>
      <mesh position={[-0.055, 1.17, 0.145]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#2a2320" />
      </mesh>
      <mesh position={[0.055, 1.17, 0.145]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#2a2320" />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.19, 0.22, 0.62, 14]} />
        <meshStandardMaterial color="#5b8def" />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.2, 0.19, 0.5, 14]} />
        <meshStandardMaterial color="#8a6f52" />
      </mesh>
      {/* 이동장 — 인물 앞쪽 바닥 */}
      <group position={[-0.45, 0, 0.3]}>
        <mesh position={[0, 0.16, 0]}>
          <boxGeometry args={[0.42, 0.3, 0.3]} />
          <meshStandardMaterial color="#f2a65a" />
        </mesh>
        <mesh position={[0, 0.16, 0.16]}>
          <boxGeometry args={[0.32, 0.2, 0.02]} />
          <meshStandardMaterial color="#3f9c96" />
        </mesh>
        <mesh position={[0, 0.34, 0]}>
          <boxGeometry args={[0.2, 0.04, 0.05]} />
          <meshStandardMaterial color="#8a5a2a" />
        </mesh>
      </group>
    </group>
  );
}
