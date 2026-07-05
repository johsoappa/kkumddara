"use client";

// ====================================================
// 분석 초기화 전용 컴포넌트
// 루트 레이아웃(서버 컴포넌트)에서 클라이언트 초기화를 분리하기 위한 래퍼.
// 렌더링 출력 없음. NEXT_PUBLIC_POSTHOG_KEY 미설정 시 아무 동작 안 함.
// ====================================================

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";

export default function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return null;
}
