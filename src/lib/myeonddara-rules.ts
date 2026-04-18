// ====================================================
// 명따라 규칙 기반(rule-based) 가이드 생성 — lib/myeonddara-rules.ts
//
// [AI 없이 만세력 계산 결과만으로 생성하는 카드 데이터]
//   일간 한줄 해설    : 10천간 각각의 기질 설명
//   오행 균형 해설    : dominant / absent / weak 오행 조합
//   기질 키워드       : dominant 3개 + 일간 특화 1개
//   학습 스타일 가이드 : dominant 오행 기반
//   부모 가이드 팁    : dominant 오행 기반
//
// [참고 사항]
//   모든 문구는 참고용 표현 사용 ("~있어요", "~수 있어요")
//   단정적 운명 표현 금지
// ====================================================

import type { ManseryeokResult } from "./manseryeok";

// ── 일간(日干) 한줄 해설 — 10천간 ────────────────────────────────
const ILGAN_GUIDE: Record<string, { emoji: string; text: string }> = {
  "甲": {
    emoji: "🌳",
    text:  "갑목(甲木)은 큰 나무처럼 위로 뻗어가는 기질이 있어요. 리더십과 추진력이 타고난 강점이에요.",
  },
  "乙": {
    emoji: "🌿",
    text:  "을목(乙木)은 덩굴처럼 유연하게 적응하는 기질이 있어요. 변화에 잘 맞춰가는 유연함이 강점이에요.",
  },
  "丙": {
    emoji: "☀️",
    text:  "병화(丙火)는 태양처럼 밝고 활발한 기질이 있어요. 표현력과 사교성이 타고난 강점이에요.",
  },
  "丁": {
    emoji: "🕯️",
    text:  "정화(丁火)는 촛불처럼 집중력 있고 지속적인 기질이 있어요. 한 가지를 깊이 파고드는 힘이 강점이에요.",
  },
  "戊": {
    emoji: "🏔️",
    text:  "무토(戊土)는 큰 산처럼 든든하고 포용력 있는 기질이 있어요. 안정감과 신뢰감이 타고난 강점이에요.",
  },
  "己": {
    emoji: "🌾",
    text:  "기토(己土)는 비옥한 밭처럼 차분하고 현실적인 기질이 있어요. 세심한 관찰력과 성실함이 강점이에요.",
  },
  "庚": {
    emoji: "⚔️",
    text:  "경금(庚金)은 강한 쇠처럼 결단력 있고 원칙적인 기질이 있어요. 목표를 향한 추진력이 타고난 강점이에요.",
  },
  "辛": {
    emoji: "💎",
    text:  "신금(辛金)은 보석처럼 예리하고 섬세한 기질이 있어요. 완성도를 추구하는 집중력이 강점이에요.",
  },
  "壬": {
    emoji: "🌊",
    text:  "임수(壬水)는 큰 강처럼 지혜롭고 유연한 기질이 있어요. 탐구심과 깊은 사고력이 타고난 강점이에요.",
  },
  "癸": {
    emoji: "🌧️",
    text:  "계수(癸水)는 이슬처럼 섬세하고 직관적인 기질이 있어요. 감수성과 공감 능력이 타고난 강점이에요.",
  },
};

// ── 기질 키워드 — dominant 오행 기준 3개 ────────────────────────
const OHAENG_KEYWORDS: Record<string, [string, string, string]> = {
  "목": ["창의적 탐구", "독립심",    "성장 지향"],
  "화": ["표현력",     "열정적",     "사교적"],
  "토": ["안정 추구",  "신중함",     "현실적 감각"],
  "금": ["분석력",     "원칙 중심",  "완성 지향"],
  "수": ["탐구심",     "유연한 사고","깊은 몰입"],
};

// ── 일간별 특화 키워드 — 4번째 키워드로 사용 ────────────────────
const ILGAN_KEYWORD: Record<string, string> = {
  "甲": "추진력",    "乙": "적응력",   "丙": "명랑함",   "丁": "지속력",
  "戊": "포용력",    "己": "성실함",   "庚": "결단력",   "辛": "예리함",
  "壬": "지혜로움",  "癸": "공감력",
};

// ── 오행 약함 영역 설명 ──────────────────────────────────────────
const OHAENG_WEAK_DESC: Record<string, string> = {
  "목(木)": "새로운 시도나 창의적 활동",
  "화(火)": "감정 표현이나 적극적인 도전",
  "토(土)": "꾸준함과 안정적인 지속력",
  "금(金)": "원칙 세우기나 빠른 결단",
  "수(水)": "깊은 사고나 유연한 적응",
};

// ── 오행 전체 이름 ────────────────────────────────────────────────
const OHAENG_FULL: Record<string, string> = {
  "목": "목(木)", "화": "화(火)", "토": "토(土)", "금": "금(金)", "수": "수(水)",
};

// ── 학습 스타일 ───────────────────────────────────────────────────
const OHAENG_LEARNING: Record<string, { style: string; detail: string }> = {
  "목": {
    style:  "탐색형",
    detail: "직접 해보고 스스로 발견하는 방식을 선호해요. 자율적인 탐구 시간을 주면 집중력이 높아질 수 있어요.",
  },
  "화": {
    style:  "관계형",
    detail: "함께 배우고 발표하거나 토론하는 방식에서 강점을 보여요. 공감과 칭찬이 학습 동기를 높이는 데 도움이 돼요.",
  },
  "토": {
    style:  "반복형",
    detail: "기초부터 차근차근 쌓아가는 방식이 잘 맞아요. 예측 가능한 학습 루틴이 안정감을 줄 수 있어요.",
  },
  "금": {
    style:  "분석형",
    detail: "원리를 파악하고 구조화하는 방식을 선호해요. 명확한 목표와 체계적인 계획이 도움이 될 수 있어요.",
  },
  "수": {
    style:  "사색형",
    detail: "혼자 충분히 생각하고 정리하는 방식에서 강점을 보여요. 깊이 이해한 후 적용하는 스타일이에요.",
  },
};

// ── 부모 관찰 포인트 — 일상에서 체크할 행동 단서 3개 ─────────────
const OHAENG_OBSERVATION_POINTS: Record<string, string[]> = {
  "목": [
    "혼자 뭔가를 만들거나 탐색할 때 얼마나 집중하나요?",
    "새로운 경험이나 환경에 기대감을 보이나요, 불안해하나요?",
    "남의 시선보다 스스로의 판단을 따르려는 경향이 있나요?",
  ],
  "화": [
    "친구와 함께할 때 에너지가 더 높아지는 편인가요?",
    "감정이 표정·말로 잘 드러나는 편인가요?",
    "낯선 상황에서도 먼저 말을 걸거나 주도하려 하나요?",
  ],
  "토": [
    "익숙한 루틴과 환경을 더 편안해하는 편인가요?",
    "결정 전에 충분히 생각하고 신중하게 행동하나요?",
    "약속이나 규칙을 지키는 것을 중요하게 여기나요?",
  ],
  "금": [
    "옳고 그름에 민감하거나 정리정돈을 중요시하나요?",
    "목표가 생기면 끝까지 해내려는 고집이 있나요?",
    "칭찬보다 '왜 잘했는지 이유'를 궁금해하는 편인가요?",
  ],
  "수": [
    "혼자만의 생각 시간이 필요한 편인가요?",
    "'왜?'라는 질문을 자주 던지는 편인가요?",
    "충분히 이해하기 전에는 쉽게 넘어가지 않는 편인가요?",
  ],
};

// ── 부모 가이드 팁 ────────────────────────────────────────────────
const OHAENG_PARENT_TIP: Record<string, string> = {
  "목": "새로운 도전을 격려해 주세요. 규칙보다 자율적인 탐색이 잘 맞아요.",
  "화": "감정을 자유롭게 표현할 수 있는 환경이 도움이 돼요. 충분히 들어주는 것이 중요해요.",
  "토": "안정적인 루틴과 예측 가능한 환경이 아이의 자신감을 키워요.",
  "금": "세운 목표를 끝까지 완수할 수 있도록 응원해 주세요. 중간에 방향을 바꾸는 것을 어려워할 수 있어요.",
  "수": "혼자 생각할 시간을 충분히 주세요. 답을 재촉하면 위축될 수 있어요.",
};

// ────────────────────────────────────────────────────────────────
// 타입
// ────────────────────────────────────────────────────────────────
export interface RuleBasedGuide {
  ilganGuide:        { emoji: string; text: string };
  ohaengBalance:     string;
  keywords:          string[];
  learningStyle:     { style: string; detail: string };
  parentTip:         string;
  observationPoints: string[]; // 부모가 일상에서 체크할 행동 단서 3개
}

// ────────────────────────────────────────────────────────────────
// 메인 빌더 함수
// ────────────────────────────────────────────────────────────────
export function buildRuleBasedGuide(saju: ManseryeokResult): RuleBasedGuide {
  const { ilgan, ohaeng } = saju;
  const dominant     = ohaeng.dominant; // "목"|"화"|"토"|"금"|"수"
  const dominantFull = OHAENG_FULL[dominant] ?? dominant;

  // ── 1. 일간 해설 ────────────────────────────────────────
  const ilganGuide = ILGAN_GUIDE[ilgan] ?? {
    emoji: "✨",
    text:  `${ilgan}은(는) 독특한 기질을 가진 일간이에요. 만세력 분석을 참고해 보세요.`,
  };

  // ── 2. 오행 균형 해설 ────────────────────────────────────
  const allOhaeng = [
    { name: "목(木)", count: ohaeng.wood,  desc: OHAENG_WEAK_DESC["목(木)"] },
    { name: "화(火)", count: ohaeng.fire,  desc: OHAENG_WEAK_DESC["화(火)"] },
    { name: "토(土)", count: ohaeng.earth, desc: OHAENG_WEAK_DESC["토(土)"] },
    { name: "금(金)", count: ohaeng.metal, desc: OHAENG_WEAK_DESC["금(金)"] },
    { name: "수(水)", count: ohaeng.water, desc: OHAENG_WEAK_DESC["수(水)"] },
  ];
  // 완전히 없는 오행 (개수 0)
  const absentItems = allOhaeng.filter((x) => x.count === 0).slice(0, 2);
  // 약한 오행 (개수 1, dominant 제외)
  const weakItems   = allOhaeng.filter((x) => x.count === 1 && x.name !== dominantFull).slice(0, 2);

  let ohaengBalance: string;
  if (absentItems.length === 0 && weakItems.length === 0) {
    ohaengBalance = `오행이 전반적으로 고르게 분포되어 있어요. ${dominantFull}의 기운이 가장 강하지만, 균형 잡힌 기질이 돋보여요.`;
  } else if (absentItems.length > 0) {
    const nameStr = absentItems.length >= 2
      ? `${absentItems[0].name}과 ${absentItems[1].name}`
      : absentItems[0].name;
    ohaengBalance = `${dominantFull}의 기운이 강하게 나타나요. ${nameStr}이 없어 해당 영역을 보완하는 활동이 도움이 될 수 있어요.`;
  } else {
    const nameStr = weakItems.length >= 2
      ? `${weakItems[0].name}과 ${weakItems[1].name}`
      : weakItems[0].name;
    ohaengBalance = `${dominantFull}의 기운이 강하게 나타나요. ${nameStr}이 약한 편이라 ${weakItems[0].desc}에는 시간이 더 필요할 수 있어요.`;
  }

  // ── 3. 기질 키워드 (dominant 3 + 일간 1) ────────────────
  const baseKws  = OHAENG_KEYWORDS[dominant] ?? ["창의적", "탐구적", "성장 지향"];
  const ilganKw  = ILGAN_KEYWORD[ilgan] ?? "집중력";
  const keywords = [...baseKws, ilganKw];

  // ── 4. 학습 스타일 ───────────────────────────────────────
  const learningStyle = OHAENG_LEARNING[dominant] ?? {
    style:  "자기주도형",
    detail: "스스로 탐구하고 정리하는 방식이 잘 맞아요.",
  };

  // ── 5. 부모 가이드 팁 ────────────────────────────────────
  const parentTip = OHAENG_PARENT_TIP[dominant] ?? "아이의 기질을 먼저 인정하고 강점을 발견해 주세요.";

  // ── 6. 관찰 포인트 ───────────────────────────────────────
  const observationPoints = OHAENG_OBSERVATION_POINTS[dominant] ?? [
    "아이가 가장 몰입하는 활동이 무엇인가요?",
    "어떤 상황에서 가장 편안해하나요?",
    "혼자 있는 시간과 함께하는 시간 중 어느 쪽을 더 즐기나요?",
  ];

  return { ilganGuide, ohaengBalance, keywords, learningStyle, parentTip, observationPoints };
}
