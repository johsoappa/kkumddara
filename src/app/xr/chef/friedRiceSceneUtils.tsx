"use client";

// FriedRiceScene과 FriedRiceCookParts가 함께 쓰는 작은 도우미(F11).
// 포인터 캡처·커서·reduced-motion·"놓는 곳" 시각 피드백 상태. 동작은 FriedRiceScene에 있던 것과 같다.

import { useEffect, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

export function setCursor(value: string) {
  if (typeof document !== "undefined") document.body.style.cursor = value;
}

export function capturePointer(event: ThreeEvent<PointerEvent>) {
  try {
    (event.target as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture(
      event.pointerId,
    );
  } catch {
    // 캡처 실패는 치명적이지 않다 — 드래그가 덜 매끄러울 뿐이다.
  }
}

/**
 * 이 포인터가 지금 캡처돼 있는가. R3F가 넘겨주는 target(R3F 내부 캡처 표)을 먼저 보고, 없으면 DOM 캡처를 본다.
 * 다른 손가락이 움직일 때 R3F가 저장된 첫 손가락의 호버 이벤트로 leave를 부르는 경우를 걸러내는 데 쓴다.
 */
export function isPointerCaptured(event: ThreeEvent<PointerEvent>, domElement: HTMLElement): boolean {
  const target = event.target as unknown as { hasPointerCapture?: (id: number) => boolean };
  try {
    if (typeof target.hasPointerCapture === "function") return Boolean(target.hasPointerCapture(event.pointerId));
  } catch {
    // 아래 DOM 확인으로 넘어간다
  }
  try {
    return domElement.hasPointerCapture(event.pointerId);
  } catch {
    return false;
  }
}

export function releasePointer(event: ThreeEvent<PointerEvent>) {
  try {
    (
      event.target as unknown as { releasePointerCapture: (id: number) => void }
    ).releasePointerCapture(event.pointerId);
  } catch {
    // no-op
  }
}

/** 씬 안 시각 피드백 상태 — 매 프레임 읽기만 하므로 ref로 공유해 리렌더를 만들지 않는다. */
export interface TrayFeedback {
  dragging: boolean;
  hot: boolean;
  /** 마지막으로 재료가 트레이에 놓인 시각(ms) — 놓기 성공 반짝임 */
  flashAt: number;
}
