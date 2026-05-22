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

  /**
   * 명따라 Phase 2 사용량 차감 활성화 여부
   *
   * true  : OpenAI 분석 성공 시 myeonddara_usage 차감 (정식 오픈 시 전환)
   * false (현재): 베타 기간 차감 유예 — 테스트 중 연간 횟수 소모 없음
   *
   * ⚠️ Phase 2 자체 활성화(NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED)와 독립적인 플래그
   *    Phase 2 비활성 상태에서는 이 플래그가 실행되지 않음
   *
   * 재활성화 체크리스트 (정식 오픈 전):
   *   1. 이 값을 true 로 변경
   *   2. NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED=true 확인
   *   3. docs/myeonddara-phase2-smoke-test.md 체크리스트 전항목 통과
   *   4. 배포 후 myeonddara_usage UPDATE/INSERT 정상 동작 확인
   *
   * 유예 범위:
   *   - 차감 유예만 해당 (myeonddara_usage 미증가)
   *   - free 차단 정책 (myeonddara_yearly_limit=0)은 유예 대상이 아님
   *   - 베이직 이상 플랜 접근 제한은 유예 대상이 아님
   */
  MYEONDDARA_PHASE2_DEDUCT_USAGE: false,
} as const;
