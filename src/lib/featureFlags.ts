// ====================================================
// featureFlags.ts — 기능 플래그 중앙 관리
//
// [사용 방법]
//   import { FEATURE_FLAGS } from "@/lib/featureFlags";
//   if (!FEATURE_FLAGS.AI_CONSULT_ENABLED) { ... }
//
// [재활성화 방법]
//   AI_CONSULT_ENABLED: false → true 로 변경 후 배포
//   추가로 Vercel 환경변수 ANTHROPIC_API_KEY 등록 확인 필요
// ====================================================

export const FEATURE_FLAGS = {
  /**
   * AI 진로 상담 기능 활성화 여부
   *
   * false (현재): Anthropic 결제 전 — 준비중 화면 표시, API 차단
   * true  (이후): Anthropic 결제 완료 후 실사용 오픈
   *
   * 재활성화 체크리스트:
   *   1. 이 값을 true 로 변경
   *   2. Vercel 환경변수 ANTHROPIC_API_KEY 등록 확인
   *   3. parent/home 카드에서 badge 제거 (또는 이 플래그로 자동 반영)
   *   4. 배포 후 /parent/counseling 흐름 실 동작 확인
   */
  AI_CONSULT_ENABLED: false,
} as const;
