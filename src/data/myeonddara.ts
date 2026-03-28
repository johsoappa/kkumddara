// ====================================================
// 명따라 더미 결과 데이터
// [Supabase 연동 후] 실제 사주 계산 API로 교체 예정
// 기준: 이름 김꿈따 / 2014.01.17 / 오시 / 남자
// ====================================================

import type { SajuResult } from "@/types/myeonddara";

export const DUMMY_SAJU_RESULT: SajuResult = {
  pillars: [
    { label: "年柱", hanja: "甲午", korean: "갑오" },
    { label: "月柱", hanja: "癸丑", korean: "계축" },
    { label: "日柱", hanja: "壬子", korean: "임자" },
    { label: "時柱", hanja: "壬午", korean: "임오" },
  ],

  ohaeng: [
    { name: "수(水)", emoji: "🌊", percent: 40, strength: "강함", color: "#2196F3" },
    { name: "토(土)", emoji: "⛰️", percent: 30, strength: "보통", color: "#8D6E63" },
    { name: "목(木)", emoji: "🌲", percent: 20, strength: "약함", color: "#4CAF50" },
    { name: "화(火)", emoji: "🔥", percent: 10, strength: "부족", color: "#E84B2E" },
    { name: "금(金)", emoji: "⚙️", percent:  0, strength: "없음", color: "#9E9E9E" },
  ],

  ohaengSummary:
    "수(水) 기운이 강한 아이예요. 논리적이고 분석적인 사고력이 뛰어나며 깊이 생각하는 것을 좋아합니다.",

  personalityTags: ["🧠 분석적 사고", "🎯 목표 지향", "💡 창의력", "🤝 협력적"],

  personalityDesc:
    "논리적으로 문제를 분석하고 창의적인 해결책을 찾는 능력이 탁월합니다. 팀워크를 중요시하며 목표를 향해 꾸준히 나아갑니다.",

  careers: [
    {
      rank: 1,
      emoji: "💻",
      name: "소프트웨어 엔지니어",
      occupationId: "software-engineer",
      reason: "수(水)의 논리력 + 목(木)의 창의력",
      fitScore: 92,
    },
    {
      rank: 2,
      emoji: "📊",
      name: "데이터 분석가",
      occupationId: "data-analyst",
      reason: "수(水)의 분석력이 빛나는 직업",
      fitScore: 88,
    },
    {
      rank: 3,
      emoji: "🔬",
      name: "연구원/과학자",
      occupationId: "software-engineer",
      reason: "깊이 탐구하는 수(水) 기질에 최적",
      fitScore: 85,
    },
  ],

  fortune:
    "물처럼 유연하게, 바다처럼 깊게. 오늘은 새로운 것을 배우기 좋은 날이에요.",

  topOccupationId: "software-engineer",
};

export const MYEONDDARA_INPUT_KEY = "kkumddara_myeonddara_input";
