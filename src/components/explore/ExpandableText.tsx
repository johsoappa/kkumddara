"use client";

// ====================================================
// ExpandableText — 긴 본문 텍스트용 더보기/접기 공용 컴포넌트
//
// [역할] 지정한 줄 수(maxLines)로 먼저 잘라 보여주고, 실제로 잘린 경우에만
//        더보기 버튼을 노출한다. 짧아서 잘리지 않는 텍스트는 버튼 없이 전체
//        노출한다 (G1.8-A1 §4.1.7).
// ====================================================

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ExpandableTextProps {
  text: string;
  /** 접힌 상태에서 보여줄 최대 줄 수 */
  maxLines: 2 | 3;
  className?: string;
  textClassName?: string;
}

export default function ExpandableText({
  text,
  maxLines,
  className,
  textClassName,
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setClamped(el.scrollHeight > el.clientHeight + 1);
  }, [text, maxLines]);

  return (
    <div className={className}>
      <p
        ref={textRef}
        className={cn(
          textClassName,
          "whitespace-pre-line",
          !expanded && (maxLines === 2 ? "line-clamp-2" : "line-clamp-3")
        )}
      >
        {text}
      </p>
      {clamped && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="mt-1 text-xs font-semibold text-brand-red underline underline-offset-2"
        >
          {expanded ? "접기" : "더보기"}
        </button>
      )}
    </div>
  );
}
