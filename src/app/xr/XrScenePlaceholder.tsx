// ====================================================
// XrScenePlaceholder — WebGL 미지원/Canvas 오류 시 3D 영역을 대체하는
// 공용 정적 텍스트 패널. 요리사·수의사가 동일 컴포넌트를 사용한다.
//
// 이 패널이 보여도 선택/결과/CTA 흐름은 각 XrClient의 상태머신이
// 그대로 진행한다 — 이 컴포넌트는 3D 시각 영역만 대체할 뿐 진행
// 로직과는 무관하다.
// ====================================================

export interface XrScenePlaceholderProps {
  message: string;
}

export default function XrScenePlaceholder({ message }: XrScenePlaceholderProps) {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-2 rounded-xl bg-gray-100 px-6 text-center">
      <p className="text-2xl" aria-hidden="true">
        📋
      </p>
      <p className="text-sm leading-relaxed text-gray-600">{message}</p>
    </div>
  );
}
