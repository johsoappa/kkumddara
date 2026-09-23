"use client";

// ====================================================
// SceneTargetPins — Canvas 위 DOM 선택 핀 레이어 (G2.2-R3-B, 신규)
//
// "큰 카드나 이름표를 다시 만들지 않습니다 — 구체적인 장면 타깃에는
// 28~32px의 작은 원형 핀만 표시합니다. 핀에는 선택 순서와 동일한 작은
// 숫자를 사용합니다. 플랫폼 이모지는 사용하지 않습니다." 라는 요구를
// 그대로 구현한다.
//
// 좌표는 sceneLayout.ts의 computeChoicePinPixels(순수 함수)가 미리 계산해
// 부모(VetScene.tsx)가 이 컴포넌트에 내려준다 — 이 컴포넌트 자신은
// useFrame을 쓰지 않고, Canvas 밖의 평범한 DOM이다(pointer-events: none —
// 실제 탭 입력은 3D TapHitBox 또는 아래 HTML 버튼이 담당하고, 핀은 순수
// 시각적 안내다).
// ====================================================

import type { ChoicePinPixel } from "./sceneLayout";

export default function SceneTargetPins({ pins }: { pins: ChoicePinPixel[] }) {
  if (pins.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      {pins.map((pin) => (
        <div
          key={pin.choiceId}
          className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-teal-600/85 text-sm font-bold text-white shadow-sm motion-reduce:animate-none"
          style={{ left: pin.x, top: pin.y }}
        >
          {pin.ordinal}
        </div>
      ))}
    </div>
  );
}
