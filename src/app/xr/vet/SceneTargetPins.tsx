"use client";

// ====================================================
// SceneTargetPins — Canvas 위 DOM 선택 핀 레이어 (G2.2-R3-B 신규, R3-C 개편)
//
// 32px 원형 번호 핀을 대상 "위"가 아니라 대상 "옆·아래"에 두고, 핀에서
// 대상 가장자리까지 짧은 연결선을 긋는다(R3-C: 핀이 강아지 몸통·인물 상체·
// HUD를 가리던 문제 해결). 좌표(핀 위치·선 끝점)는 sceneLayout.ts의
// computeChoicePinPixels(순수 함수)가 미리 계산해 부모(VetScene.tsx)가
// 내려준다 — 이 컴포넌트는 useFrame을 쓰지 않는 평범한 DOM이고,
// pointer-events: none이라 실제 탭은 3D TapHitBox 또는 HTML 버튼이 담당한다.
// ====================================================

import type { ChoicePinPixel } from "./sceneLayout";

export default function SceneTargetPins({ pins }: { pins: ChoicePinPixel[] }) {
  if (pins.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        {pins.map((pin) => (
          <g key={pin.choiceId}>
            <line
              x1={pin.x}
              y1={pin.y}
              x2={pin.lineX}
              y2={pin.lineY}
              stroke="#ffffff"
              strokeWidth={5}
              strokeLinecap="round"
            />
            <line
              x1={pin.x}
              y1={pin.y}
              x2={pin.lineX}
              y2={pin.lineY}
              stroke="#0f766e"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </g>
        ))}
      </svg>
      {pins.map((pin) => (
        <div
          key={pin.choiceId}
          className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-teal-700 text-sm font-bold text-white shadow-sm"
          style={{ left: pin.x, top: pin.y }}
        >
          {pin.ordinal}
        </div>
      ))}
    </div>
  );
}
