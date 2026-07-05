// ====================================================
// 분석 계측 래퍼 (PostHog)
//
// 사용 규칙
// - 컴포넌트에서 posthog를 직접 import하지 않고 반드시 이 래퍼를 거친다.
// - NEXT_PUBLIC_POSTHOG_KEY가 없으면 모든 함수가 no-op → 로컬/키 미설정 환경에서 안전.
// - 이벤트는 아래 5개 핵심 지표만 유지한다. 추가 시 OZ.대표 승인 필요.
//   ① signup_completed  ② child_connected  ③ occupation_viewed
//   ④ quiz_completed    ⑤ 재방문(자동 $pageview 기반 리텐션 — 별도 코드 없음)
// ====================================================

import posthog from "posthog-js";

const POSTHOG_KEY  = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

let initialized = false;

/** 클라이언트에서 1회만 호출 (AnalyticsProvider 담당) */
export function initAnalytics(): void {
  if (initialized || typeof window === "undefined" || !POSTHOG_KEY) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // SPA 라우팅 포함 페이지뷰 자동 수집 (재방문 리텐션 측정용)
    defaults: "2025-05-24",
    // 개인정보 최소 수집: 입력값 자동 캡처 비활성화
    autocapture: false,
    // 세션 녹화 미사용 (미성년자 대상 서비스 — 화면 녹화 금지)
    disable_session_recording: true,
  });
  initialized = true;
}

export type AnalyticsEvent =
  | "signup_completed"   // 온보딩 최종 완료 (role: parent | student)
  | "child_connected"    // 학생이 초대 코드로 자녀 프로필 연결 완료
  | "occupation_viewed"  // 직업 상세 페이지 조회
  | "quiz_completed";    // 직업 퀴즈 결과 화면 도달

// 계측 실패가 가입·연결 등 서비스 흐름을 절대 막지 않도록 예외를 삼킨다.
export function track(event: AnalyticsEvent, properties?: Record<string, string | number | boolean>): void {
  if (!initialized) return;
  try {
    posthog.capture(event, properties);
  } catch {
    // no-op: 계측 오류는 서비스 동작에 영향 주지 않음
  }
}

/** 가입 완료 시점에 DB uuid로 사용자 식별 (PII 아님 — 이름/이메일 전송 금지) */
export function identifyUser(userId: string, role: "parent" | "student"): void {
  if (!initialized) return;
  try {
    posthog.identify(userId, { role });
  } catch {
    // no-op: 계측 오류는 서비스 동작에 영향 주지 않음
  }
}
