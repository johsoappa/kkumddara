"use client";

// ====================================================
// FriedRiceProgressBar — 볶음밥 시나리오의 "다음 단계" 진행 버튼 (F12)
//
// 모바일(md 미만): 화면 아래에 고정된 바로 보인다 — 3D 장면 아래 패널이 길어도 진행 버튼이 항상 보인다.
// 데스크톱(md 이상): 고정하지 않고 기존처럼 패널 안 제자리에 놓인다(같은 요소가 CSS로만 위치를 바꾼다 — 버튼이 둘로 늘어나지 않는다).
//
// - 비활성일 때는 색만이 아니라 점선 테두리 + "○ 이유 · 진행도" 글자로 구분하고, 활성일 때는 "✓" 글자를 붙인다.
//   버튼 이름(접근 가능한 이름)은 라벨 그대로이고, 이유는 aria-describedby로 이어진다.
// - busy(끄는 중·단계 바뀐 직후)에는 pointer-events를 꺼서 두 번째 손가락·연타가 다음 단계 버튼을 누르지 못하게 한다.
// ====================================================

import { useId, type ReactNode } from "react";

export interface FriedRiceProgressBarProps {
  /** 버튼 글자 — 다음 행동을 구체적으로(예: "재료 준비하러 가기") */
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** 비활성일 때 보여 줄 짧은 이유(진행도 포함 가능) */
  reason?: ReactNode;
  /** 활성일 때 모바일에서 버튼 위에 보여 줄 짧은 안내(없으면 생략) */
  readyText?: ReactNode;
  variant?: "primary" | "outline";
  /** 끄는 중이거나 방금 단계가 바뀐 때 — 눌림을 막는다 */
  busy?: boolean;
  /** 데스크톱에서 한 줄에 다른 버튼과 나란히 놓일 때의 높이(기존 48px). 생략하면 기존 단독 버튼 높이 52px */
  compact?: boolean;
  /** 데스크톱 배치용 추가 클래스(예: 한 줄에 다른 버튼과 나란히 놓을 때 md:flex-[1.4]) */
  className?: string;
  testId?: string;
}

const BUTTON_BASE =
  "min-h-[52px] w-full rounded-xl border-2 px-4 text-base font-semibold transition-colors";

export default function FriedRiceProgressBar({
  label,
  onClick,
  disabled = false,
  reason,
  readyText,
  variant = "primary",
  busy = false,
  compact = false,
  className = "",
  testId = "progress-bar",
}: FriedRiceProgressBarProps) {
  const noteId = useId();
  const note = disabled ? reason : readyText;
  const buttonStyle = disabled
    ? "border-dashed border-gray-500 bg-gray-200 text-gray-700"
    : variant === "primary"
      ? "border-orange-800 bg-orange-700 text-white active:bg-orange-800"
      : "border-orange-700 bg-white text-orange-800";

  return (
    <div
      role="group"
      aria-label="다음 단계"
      data-testid={testId}
      data-busy={busy ? "true" : "false"}
      className={[
        // 모바일: 아래 고정 바(주소창·홈 표시줄 safe-area 여백 포함)
        "fixed inset-x-0 bottom-0 z-30 border-t-2 border-gray-300 bg-white px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.08)]",
        // 데스크톱: 기존 배치(패널 안, 꾸밈 없음)
        "md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:shadow-none",
        busy ? "pointer-events-none" : "",
        className,
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-xl flex-col gap-1.5">
        {note ? (
          <p
            id={noteId}
            className={[
              "text-center text-xs font-semibold leading-snug md:hidden",
              disabled ? "text-gray-800" : "text-teal-900",
            ].join(" ")}
            data-testid={`${testId}-note`}
          >
            <span aria-hidden="true">{disabled ? "○ " : "✓ "}</span>
            {note}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-describedby={note ? noteId : undefined}
          className={[BUTTON_BASE, compact ? "md:min-h-[48px]" : "", buttonStyle].join(" ")}
        >
          {label}
        </button>
      </div>
    </div>
  );
}
