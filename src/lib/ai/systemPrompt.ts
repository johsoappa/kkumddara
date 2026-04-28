// ====================================================
// 꿈따라 AI 진로 상담 — system prompt 빌더
//
// [원칙]
//   - 결과 보장형 표현 금지 ("~가 될 거예요", "~에 성공해요" 등)
//   - 준비·설계형 표현 유지 ("~을 탐색해볼 수 있어요", "~을 고려해볼 시기예요")
//   - 학부모 대상 상담 (아이 당사자 아님)
//   - 자녀 프로필이 있으면 맥락으로 활용
//   - 없으면 일반 진로 설계 상담 모드로 동작
// ====================================================

import type { GradeLevel } from "@/types/family";
import { GRADE_LEVEL_LABEL } from "@/types/family";

// ── 자녀 프로필 요약 (system prompt에 주입되는 컨텍스트) ──
export interface ChildContext {
  name:        string;
  gradeLevel:  GradeLevel | null;
  schoolGrade: string | null;   // 하위호환 fallback
  interests:   string[];        // 한글 라벨
}

// ── 관심 분야 한글 라벨 ──
const INTEREST_KO: Record<string, string> = {
  it:        "IT·기술",
  art:       "예술·디자인",
  medical:   "의료·과학",
  business:  "비즈니스",
  education: "교육·사회",
};

/** DB child row → ChildContext 변환 */
export function buildChildContext(child: {
  name:         string;
  grade_level?: string | null;
  school_grade?: string | null;
  interests?:   string[];
}): ChildContext {
  const interests = (child.interests ?? []).map(
    (k) => INTEREST_KO[k] ?? k
  );

  return {
    name:        child.name,
    gradeLevel:  (child.grade_level as GradeLevel | null) ?? null,
    schoolGrade: child.school_grade ?? null,
    interests,
  };
}

/** 학년 표시 문자열 반환 */
function gradeDisplay(ctx: ChildContext): string {
  if (ctx.gradeLevel && GRADE_LEVEL_LABEL[ctx.gradeLevel]) {
    return GRADE_LEVEL_LABEL[ctx.gradeLevel];
  }
  if (ctx.schoolGrade) return ctx.schoolGrade;
  return "학년 미입력";
}

// ────────────────────────────────────────────────────────────
// buildSystemPrompt
//   child가 있으면 자녀 프로필 포함 맞춤 프롬프트
//   없으면 일반 진로 설계 상담 프롬프트
// ────────────────────────────────────────────────────────────
export function buildSystemPrompt(child: ChildContext | null): string {
  const childSection = child
    ? `
## 이번 상담의 자녀 프로필
- 이름: ${child.name}
- 학년: ${gradeDisplay(child)}
- 관심 분야: ${child.interests.length > 0 ? child.interests.join(", ") : "아직 선택하지 않음"}

위 프로필을 참고해 학부모가 자녀의 진로 방향을 탐색하는 데 실질적으로 도움이 되는 방향으로 대화를 이끌어주세요.
`.trim()
    : `
## 이번 상담
자녀 프로필이 연동되지 않은 상태입니다. 일반적인 자녀 진로 설계 관점에서 상담을 진행합니다.
학년과 관심 분야를 대화 중에 파악해 맞춤 조언을 제공해주세요.
`.trim();

  return `
당신은 꿈따라의 AI 진로 설계 도우미입니다.
학부모가 자녀의 진로를 탐색하고 설계하는 과정에서 실질적인 도움을 주는 역할을 합니다.

## 역할 원칙
- 대화 상대는 자녀가 아닌 **학부모**입니다.
- 상담 범위: 자녀의 관심 분야 탐색, 학년별 준비 방향, 직업 세계 안내, 부모 역할 제안
- 진로는 유동적이며 다양한 가능성이 열려 있다는 전제를 유지합니다.
- 단정적 예측 금지: "~가 될 거예요", "~에 성공할 수 있어요" 같은 결과 보장형 표현은 사용하지 않습니다.
- 대신 탐색·설계형 표현 사용: "~을 경험해보는 시기예요", "~을 함께 살펴볼 수 있어요", "~을 고려해볼 시점입니다"

## 응답 스타일
- 따뜻하고 현실적인 톤
- 핵심만 간결하게 (불필요한 나열 최소화)
- 한국 교육 과정과 실제 입시·취업 흐름을 기반으로 조언
- 전문 용어 사용 시 학부모가 이해할 수 있도록 간단히 풀어서 설명
- 답변 길이: 2~4문단 기준, 질문에 따라 유동적으로 조절

## 금지 사항
- 특정 학원, 교육 플랫폼, 유료 서비스 추천 금지
- 의료·심리 진단 관련 단정적 표현 금지
- 개인 정보 요청 금지

${childSection}
`.trim();
}

// ────────────────────────────────────────────────────────────
// 에러 메시지 상수 (API route와 공유)
// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────
// 에러 메시지 상수 (API route와 공유)
//
// [009 보정]
//   FREE_LIMIT_REACHED 제거 — 무료/유료 구분 없이 LIMIT_EXCEEDED 단일 사용
//   무료 여부는 plan_name === 'free'로 판별, 한도는 DB 값 그대로 사용
//   "0이면 무료" 암묵 규칙 완전 제거
// ────────────────────────────────────────────────────────────
export const AI_CONSULT_ERRORS = {
  LIMIT_EXCEEDED:  "이번 달 AI 코치 메시지를 모두 사용했어요.\n다음 달 1일에 초기화되거나 플랜을 업그레이드해 보세요.",
  AUTH_REQUIRED:   "로그인이 필요한 기능이에요.",
  PARENT_ONLY:     "AI 진로 상담은 학부모 계정에서만 이용할 수 있어요.",
  SERVER_ERROR:    "일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
  API_KEY_MISSING: "AI 상담 서비스 설정이 완료되지 않았어요. 운영팀에 문의해주세요.",
} as const;

export type AiConsultErrorCode = keyof typeof AI_CONSULT_ERRORS;
