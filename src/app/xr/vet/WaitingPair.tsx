"use client";

// ====================================================
// WaitingPair — 나침반 3지점("기록을 마치기 전에 다음 보호자와 동물이
// 도착했어요") 전용 배경 소품 (G2.2-R3-B, 신규)
//
// 문 옆에서 기다리는 다음 보호자 실루엣 + 이동장. 상호작용이 전혀 없다
// (TapHitBox 없음, onSelect 없음) — 이 지점의 3개 choice는 이미 병원
// 사인/모니터/선배 수의사로 매핑돼 있어 새 선택 대상을 만들 필요가 없다.
// "단순 안내 문구만 추가하면 안 된다"는 요구를 실제 등장 요소로 충족한다.
// 저채도 색으로 배경임을 분명히 한다(본체 색 고정 원칙과 무관 — 이 소품은
// 애초에 선택 가능 상태가 없다).
// ====================================================

import { WAITING_PAIR_ANCHOR } from "./sceneLayout";

export default function WaitingPair({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <group position={WAITING_PAIR_ANCHOR} rotation={[0, -0.6, 0]}>
      {/* 대기 중인 보호자 실루엣 — 저채도, 상세 묘사 없음(배경 요소임을 분명히) */}
      <mesh position={[0, 0.98, 0]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial color="#b7bcc4" />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.17, 0.2, 0.62, 12]} />
        <meshStandardMaterial color="#c7ccd1" />
      </mesh>
      {/* 이동장 */}
      <mesh position={[0.32, 0.16, 0.05]}>
        <boxGeometry args={[0.32, 0.28, 0.24]} />
        <meshStandardMaterial color="#d8c9a8" />
      </mesh>
      <mesh position={[0.32, 0.05, 0.18]}>
        <boxGeometry args={[0.26, 0.02, 0.02]} />
        <meshStandardMaterial color="#8a7355" />
      </mesh>
    </group>
  );
}
