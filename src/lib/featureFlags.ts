// ====================================================
// featureFlags.ts — 기능 플래그 중앙 관리
//
// [사용 방법]
//   import { FEATURE_FLAGS } from "@/lib/featureFlags";
//   if (!FEATURE_FLAGS.AI_CONSULT_ENABLED) { ... }
//
// [재활성화 방법]
//   AI_CONSULT_ENABLED: false → true 로 변경 후 배포
//   추가로 Vercel 환경변수 OPENAI_API_KEY 등록 확인 필요
// ====================================================

export const FEATURE_FLAGS = {
  /**
   * AI 진로 상담 기능 활성화 여부
   *
   * true  (현재): OpenAI gpt-4o-mini 기반 — Free 월 3회 제한 공개
   * false (비활성): 준비중 화면 표시, API 차단
   *
   * 비활성화 체크리스트:
   *   1. 이 값을 false 로 변경
   *   2. 배포 후 /parent/counseling → 준비중 화면 확인
   *
   * Vercel 환경변수:
   *   OPENAI_API_KEY 등록 필수
   */
  AI_CONSULT_ENABLED: true,
} as const;
