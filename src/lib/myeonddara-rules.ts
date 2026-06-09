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

// ── 성향 한 줄 요약 — dominant 오행 기준 (참고용, 단정 금지) ──────
const OHAENG_SUMMARY_LINE: Record<string, string> = {
  "목": "호기심을 따라 스스로 탐색하며 성장해가는 모습이 보여요.",
  "화": "감정과 생각을 밝게 표현하며 사람들과 잘 어울리는 모습이 보여요.",
  "토": "차분하고 꾸준하게 자기 속도로 쌓아가는 모습이 보여요.",
  "금": "원칙을 세우고 목표를 향해 또렷하게 나아가는 모습이 보여요.",
  "수": "깊이 생각하고 충분히 이해한 뒤 움직이는 사색형 모습이 보여요.",
};

// ── 강점으로 볼 수 있는 부분 — dominant 오행 기준 3개 ────────────
const OHAENG_STRENGTHS: Record<string, string[]> = {
  "목": ["스스로 탐색하고 시도하는 자기주도성", "새로운 것에 대한 호기심", "성장하려는 의지"],
  "화": ["밝은 표현력과 사교성", "주변을 활기차게 하는 에너지", "감정에 솔직한 소통력"],
  "토": ["꾸준함과 성실함", "안정감 있는 책임감", "신중하게 판단하는 침착함"],
  "금": ["분석력과 원칙 감각", "목표를 끝까지 해내는 집중력", "옳고 그름에 대한 또렷한 기준"],
  "수": ["깊이 사고하는 탐구심", "상황을 유연하게 이해하는 힘", "한 가지에 몰입하는 집중력"],
};

// ── 조심해서 대화할 부분 — dominant 오행 기준 2개 (부드러운 권유) ──
const OHAENG_CAUTIONS: Record<string, string[]> = {
  "목": ["하고 싶은 것을 막기보다, 방향을 함께 정해 보세요.", "결과를 재촉하면 흥미를 잃을 수 있어요."],
  "화": ["감정을 먼저 충분히 들어준 뒤 이야기해 보세요.", "다른 아이와 비교하는 말은 의욕을 꺾을 수 있어요."],
  "토": ["갑작스러운 변화나 재촉은 부담이 될 수 있어요.", "느린 속도를 다그치기보다 기다려 주세요."],
  "금": ["옳고 그름을 단정 짓기 전에 이유를 먼저 물어봐 주세요.", "방향을 자주 바꾸게 하면 혼란스러워할 수 있어요."],
  "수": ["답을 재촉하면 위축될 수 있어요.", "생각을 정리할 시간을 충분히 준 뒤 이야기해 주세요."],
};

// ── 부모 대화 질문 — dominant 오행 기준 3개 ──────────────────────
const OHAENG_PARENT_QUESTIONS: Record<string, string[]> = {
  "목": ["요즘 가장 해보고 싶은 게 뭐야?", "혼자 해보고 싶은 일이 있어?", "새로 알게 된 것 중에 제일 재밌었던 건 뭐야?"],
  "화": ["오늘 누구랑 뭐 하고 놀았어?", "요즘 제일 신나는 일이 뭐야?", "친구들한테 자랑하고 싶은 게 있어?"],
  "토": ["요즘 꾸준히 하고 있는 게 있어?", "어떤 걸 할 때 마음이 가장 편해?", "더 잘해보고 싶은 게 있어?"],
  "금": ["요즘 가장 궁금한 게 뭐야?", "끝까지 해보고 싶은 일이 있어?", "어떤 게 제일 멋있다고 생각해?"],
  "수": ["요즘 어떤 생각을 자주 해?", "더 깊이 알아보고 싶은 게 있어?", "혼자 있을 때는 주로 뭘 해?"],
};

// ── 이번 주 작은 미션 — dominant 오행 기준 2개 ───────────────────
const OHAENG_WEEKLY_MISSIONS: Record<string, string[]> = {
  "목": ["아이가 관심 보인 분야를 하나 골라 함께 찾아보기", "아이가 스스로 정한 작은 목표 하나 응원해주기"],
  "화": ["아이가 좋아하는 활동을 가족 앞에서 발표해보기", "오늘 느낀 감정을 함께 이야기하는 시간 갖기"],
  "토": ["매일 같은 시간에 하는 작은 루틴 하나 함께 정해보기", "아이가 완성한 것을 함께 칭찬하며 돌아보기"],
  "금": ["아이가 정한 목표 하나를 끝까지 함께 지켜보기", "‘왜 그렇게 생각했어?’ 하고 이유를 물어봐 주기"],
  "수": ["아이가 궁금해한 질문 하나를 함께 깊이 알아보기", "생각을 정리할 혼자만의 시간 만들어주기"],
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
  // ── 결과 화면 7섹션용 (Phase 1 규칙 기반, 비AI) ──
  summaryLine:       string;   // ① 우리 아이 성향 한 줄 요약
  strengths:         string[]; // ② 강점으로 볼 수 있는 부분 (3)
  cautions:          string[]; // ④ 조심해서 대화할 부분 (2)
  parentQuestions:   string[]; // ⑥ 부모 대화 질문 (3)
  weeklyMissions:    string[]; // ⑦ 이번 주 작은 미션 (2)
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

  // ── 7. 결과 화면 7섹션용 (참고용 표현, 단정 금지) ────────
  const summaryLine = OHAENG_SUMMARY_LINE[dominant]
    ?? "아이만의 고유한 기질이 보여요. 관심을 따라 함께 살펴보세요.";
  const strengths = OHAENG_STRENGTHS[dominant]
    ?? ["자기만의 방식으로 몰입하는 힘", "관심 있는 것에 대한 집중력", "꾸준히 시도하는 태도"];
  const cautions = OHAENG_CAUTIONS[dominant]
    ?? ["아이의 속도를 존중하며 기다려 주세요.", "결과보다 과정을 함께 이야기해 주세요."];
  const parentQuestions = OHAENG_PARENT_QUESTIONS[dominant]
    ?? ["요즘 가장 재밌는 게 뭐야?", "더 해보고 싶은 일이 있어?", "오늘 어떤 게 기억에 남아?"];
  const weeklyMissions = OHAENG_WEEKLY_MISSIONS[dominant]
    ?? ["아이가 좋아하는 활동을 함께 하나 해보기", "아이의 이야기를 끝까지 들어주는 시간 갖기"];

  return {
    ilganGuide, ohaengBalance, keywords, learningStyle, parentTip, observationPoints,
    summaryLine, strengths, cautions, parentQuestions, weeklyMissions,
  };
}
