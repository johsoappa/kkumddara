"use client";

// ====================================================
// VetSceneHud — Canvas 위 DOM 기반 미션·대화 HUD (G2.2-R3-B, 신규)
//
// "Canvas 안에 현재 상황, 미션, 대화, 선택 결과 피드백이 없습니다"라는
// 지적에 대한 대응. 긴 한글 문장을 3D sprite/texture로 그리지 않는다 —
// 이 컴포넌트는 순수 DOM이고, Canvas 래퍼(VetScene.tsx) 안에서 Canvas의
// "위"에 얹는 절대 위치 오버레이다. 최대 2줄(line-clamp)로 제한하고,
// 인물 얼굴·강아지 몸통을 가리지 않도록 Canvas 상단 예약 영역에만 둔다
// (HERO_CAMERA_LOOKAT이 y=0.95를 보고 있어 인물 머리~씬 상단 사이에는
// 원래도 여유 공간이 있다 — 회색 빈 공간을 HUD로 활용하는 셈이다).
// prefers-reduced-motion에서는 페이드 트랜지션을 생략한다.
// ====================================================

export interface VetSceneHudProps {
  stepLabel: string;
  speakerLabel: string;
  text: string;
}

export default function VetSceneHud({ stepLabel, speakerLabel, text }: VetSceneHudProps) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 px-3 pt-2"
      aria-hidden="true"
    >
      <div className="rounded-lg bg-black/55 px-3 py-2 backdrop-blur-[1px] motion-reduce:transition-none">
        <p className="text-[11px] font-semibold tracking-wide text-teal-200">
          {stepLabel} · {speakerLabel}
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-white">{text}</p>
      </div>
    </div>
  );
}
