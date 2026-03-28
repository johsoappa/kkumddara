// ====================================================
// 리포트 더미 데이터
// [Supabase 연동 후] API fetch로 교체 예정
// ====================================================

import type { ReportDummyData } from "@/types/report";

export const REPORT_DUMMY: ReportDummyData = {
  exploredCount: 5,
  streakDays: 3,

  topOccupations: [
    { name: "UX 디자이너",       emoji: "💻", score: 84 },
    { name: "데이터 분석가",     emoji: "📊", score: 79 },
    { name: "소프트웨어 엔지니어", emoji: "🖥️", score: 71 },
  ],

  strengths: [
    {
      emoji: "💡",
      title: "창의적 사고",
      description: "디자인 관련 활동에서 독창적인 아이디어를 보여요",
    },
    {
      emoji: "🎯",
      title: "집중력",
      description: "미션을 끝까지 완수하는 높은 집중력을 보여요",
    },
  ],

  growthData: [
    { label: "1주차", rate: 50 },
    { label: "2주차", rate: 60 },
    { label: "3주차", rate: 65 },
    { label: "4주차", rate: 75 },
  ],

  weakArea: {
    title: "수학·통계 기초",
    description: "UX 디자이너에게 필요한 데이터 분석 역량이 부족해요",
  },

  activities: [
    {
      emoji: "🎨",
      title: "아이가 좋아하는 앱 같이 분석해보기",
      duration: "30분",
    },
    {
      emoji: "📚",
      title: "UX 관련 도서 서점에서 같이 골라보기",
      duration: "1시간",
    },
  ],
};
