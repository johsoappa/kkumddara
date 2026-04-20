// ====================================================
// 꿈따라 인메모리 Rate Limiter (베타 전용)
//
// 전략: 모듈 레벨 Map으로 IP별 슬라이딩 윈도우 추적
//
// [베타 허용 한계]
//   - Vercel 서버리스 함수의 인스턴스마다 독립된 Map 유지
//   - 콜드 스타트 시 Map 초기화됨 (카운트 리셋)
//   - 트래픽이 적은 베타 단계에서는 충분한 보호막
//
// [프로덕션 전환 시]
//   - Upstash Redis (@upstash/ratelimit) 또는 Vercel KV로 교체
//   - 교체 시 checkRateLimit 함수 시그니처만 유지하면 됨
//
// 적용 대상:
//   /api/ai-consult  — 5회/분 (Claude API 비용 보호)
//   /api/myeonddara  — 3회/분 (Claude API 비용 보호)
// ====================================================

interface RateLimitEntry {
  count:       number;
  windowStart: number;
}

// 모듈 레벨 저장소 (인스턴스 수명 동안 유지)
const _store = new Map<string, RateLimitEntry>();

// 5분마다 만료된 엔트리 정리 (메모리 누수 방지)
// setInterval은 서버리스 환경에서 보장되지 않으나, 정리 못 해도 무해함
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    _store.forEach((entry, key) => {
      if (now - entry.windowStart > 300_000) _store.delete(key); // 5분 초과 엔트리 삭제
    });
  }, 300_000);
}

export interface RateLimitResult {
  allowed:    boolean;
  remaining:  number;    // 이번 윈도우에서 남은 허용 횟수
  resetAfterMs: number;  // 다음 윈도우까지 남은 ms
}

/**
 * IP 기반 슬라이딩 윈도우 Rate Limit 확인
 *
 * @param key       - 추적 키 (예: "ai-consult:1.2.3.4")
 * @param maxRequests - 윈도우 내 최대 허용 횟수
 * @param windowMs  - 윈도우 크기 (ms 단위, 예: 60_000 = 1분)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now   = Date.now();
  const entry = _store.get(key);

  // 엔트리 없음 or 윈도우 만료 → 새 윈도우 시작
  if (!entry || now - entry.windowStart > windowMs) {
    _store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1, resetAfterMs: windowMs };
  }

  // 한도 초과
  if (entry.count >= maxRequests) {
    return {
      allowed:      false,
      remaining:    0,
      resetAfterMs: windowMs - (now - entry.windowStart),
    };
  }

  // 카운트 증가
  entry.count++;
  return {
    allowed:      true,
    remaining:    maxRequests - entry.count,
    resetAfterMs: windowMs - (now - entry.windowStart),
  };
}

/**
 * NextRequest에서 클라이언트 IP 추출
 * Vercel/프록시 환경에서는 X-Forwarded-For 헤더 사용
 */
export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

/**
 * 429 Rate Limit 초과 응답 생성
 */
export function rateLimitResponse(resetAfterMs: number): Response {
  const retryAfterSec = Math.ceil(resetAfterMs / 1000);
  return new Response(
    JSON.stringify({
      error: `요청이 너무 많아요. ${retryAfterSec}초 후 다시 시도해 주세요.`,
      code: "RATE_LIMITED",
      status: 429,
    }),
    {
      status: 429,
      headers: {
        "Content-Type":  "application/json",
        "Retry-After":   String(retryAfterSec),
        "X-RateLimit-Reset": String(Date.now() + resetAfterMs),
      },
    }
  );
}
