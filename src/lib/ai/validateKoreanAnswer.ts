// 한국어 진로 상담 응답 품질 검증
// pmqdmq, ㅅ사 같은 이상 문자열 감지용

// 한국어 문맥에서 일반적으로 허용되는 로마자 단어 (대문자 기준)
const ALLOWED_LATIN = new Set([
  "AI", "IT", "PD", "SNS", "TV", "PC",
  "YOUTUBE", "INSTAGRAM", "TIKTOK", "NAVER", "KAKAO",
  "CONTENT", "CONTENTS", "SMART", "STEM", "CODING",
  "APP", "UX", "UI",
]);

/**
 * 한국어 상담 답변에 이상 문자열이 포함되면 true 반환.
 * - 허용되지 않은 로마자 4자 이상 단어
 * - 한글 자모 단독 2자 이상 연속 (ㄱ~ㅎ, ㅏ~ㅣ)
 * - 유니코드 대체 문자 U+FFFD
 * - 빈 응답 또는 너무 짧은 응답
 */
export function hasSuspiciousText(answer: string): boolean {
  if (!answer || answer.trim().length < 10) return true;

  // 4자 이상 로마자 단어 중 허용 목록에 없는 것
  const latinWords = answer.match(/\b[a-zA-Z]{4,}\b/g) ?? [];
  for (const word of latinWords) {
    if (!ALLOWED_LATIN.has(word.toUpperCase())) return true;
  }

  // 한글 자모 단독 2자 이상 연속 (깨진 조합형)
  if (/[ㄱ-ㅎㅏ-ㅣ]{2,}/.test(answer)) return true;

  // 유니코드 대체 문자 (깨진 인코딩)
  if (answer.includes("�")) return true;

  return false;
}
