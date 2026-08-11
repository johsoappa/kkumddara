"use client";

// ====================================================
// DreamMapExtraInfo — "추가 직업 정보 영역" 접힘 래퍼
//
// 꿈 지도 4탭에 대응하지 않는 기존 직업 상세 문장을 삭제하지 않고
// 그대로 보존하는 영역. 기본 접힘 상태이며, 펼치면 계측 이벤트를 남긴다.
// position: fixed/sticky 사용 금지 — 항상 일반 문서 흐름.
// ====================================================

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { track } from "@/lib/analytics";
import { childModeToGradeRange } from "@/lib/child-mode";

interface DreamMapExtraInfoProps {
  occupationId: string;
  children: ReactNode;
}

export default function DreamMapExtraInfo({ occupationId, children }: DreamMapExtraInfoProps) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      track("dream_map_extra_content_opened", {
        occupation_id: occupationId,
        content_section: "additional_info",
        source_page: "explore_detail",
        // G1.3: 이 컴포넌트는 isDreamMapActive(나침반모드 확정) 시에만 렌더되므로 mode는 항상 compass
        mode: "compass",
        grade_range: childModeToGradeRange("compass"),
      });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl bg-base-off px-4 py-3 text-sm font-semibold text-base-text"
      >
        <span>추가 직업 정보 더 알아보기</span>
        <ChevronDown
          size={18}
          className={`text-base-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="flex flex-col gap-3">{children}</div>}
    </div>
  );
}
