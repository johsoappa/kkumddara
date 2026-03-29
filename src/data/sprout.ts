// ====================================================
// 새싹 모드 더미 데이터
// 대상: 초3~4학년 (10~11세)
// ====================================================

import type {
  SproutInterestOption,
  SproutMissionStage,
  SproutJob,
  SproutTodayExplore,
} from "@/types/sprout";

// ----------------------------------------
// 흥미 분야 선택지
// ----------------------------------------
export const SPROUT_INTERESTS: SproutInterestOption[] = [
  { value: "crafting", emoji: "🎨", label: "만들기/그리기" },
  { value: "reading",  emoji: "📚", label: "읽기/쓰기"    },
  { value: "science",  emoji: "🔬", label: "실험/탐구"    },
  { value: "music",    emoji: "🎵", label: "음악/공연"    },
  { value: "sports",   emoji: "🏃", label: "운동/활동"    },
  { value: "social",   emoji: "🤝", label: "친구/돕기"    },
];

// ----------------------------------------
// 오늘의 탐색 카드
// ----------------------------------------
export const TODAY_EXPLORE: SproutTodayExplore = {
  emoji: "🎨",
  topic: "나는 그림 그리기가 좋아요",
  desc: "좋아하는 활동을 찾아봐요",
};

// ----------------------------------------
// 미션 단계
// ----------------------------------------
export const SPROUT_MISSION_STAGES: SproutMissionStage[] = [
  {
    id: "stage1",
    status: "current",
    title: "나를 알아가기",
    missions: [
      {
        id: "m1",
        text: "내가 좋아하는 활동 3가지 적어보기",
        duration: "5분",
        difficulty: "🌱 쉬움",
      },
      {
        id: "m2",
        text: "좋아하는 유튜브 채널 부모님께 소개하기",
        duration: "10분",
        difficulty: "🌱 쉬움",
      },
      {
        id: "m3",
        text: "학교에서 가장 재미있는 과목 생각해보기",
        duration: "5분",
        difficulty: "🌱 쉬움",
      },
      {
        id: "m4",
        text: "잘 할 수 있는 것 찾아보기",
        duration: "5분",
        difficulty: "🌱 쉬움",
      },
    ],
  },
  {
    id: "stage2",
    status: "next",
    title: "세상 탐색하기",
    missions: [
      {
        id: "m5",
        text: "신기한 직업 3가지 찾아보기",
        duration: "10분",
        difficulty: "🌱 쉬움",
      },
      {
        id: "m6",
        text: "관심 있는 직업 부모님과 이야기하기",
        duration: "10분",
        difficulty: "🌿 보통",
      },
      {
        id: "m7",
        text: "나와 어울리는 직업 1가지 골라보기",
        duration: "5분",
        difficulty: "🌱 쉬움",
      },
    ],
  },
];

// ----------------------------------------
// 홈 화면 직업 미리보기 (가로 스크롤 3개)
// ----------------------------------------
export const SPROUT_PREVIEW_JOBS: SproutJob[] = [
  {
    id: "webtoon",
    emoji: "🎨",
    name: "웹툰 작가",
    desc1: "그림으로 이야기를 만들어요",
    desc2: "상상력과 그림 실력이 필요해요",
    relatedInterests: ["crafting"],
  },
  {
    id: "scientist",
    emoji: "🔬",
    name: "과학자",
    desc1: "궁금한 것을 실험으로 알아내요",
    desc2: "호기심이 많으면 잘 맞아요",
    relatedInterests: ["science"],
  },
  {
    id: "music_teacher",
    emoji: "🎵",
    name: "음악 선생님",
    desc1: "음악으로 사람들과 함께해요",
    desc2: "음악을 좋아하면 즐거운 일이에요",
    relatedInterests: ["music"],
  },
];

// ----------------------------------------
// 직업 탐색 전체 6개 (/sprout/explore)
// ----------------------------------------
export const SPROUT_EXPLORE_JOBS: SproutJob[] = [
  {
    id: "programmer",
    emoji: "👨‍💻",
    name: "프로그래머",
    desc1: "컴퓨터로 게임이나 앱을 만들어요",
    desc2: "수학이랑 논리적 사고가 필요해요",
    relatedInterests: ["science"],
  },
  {
    id: "designer",
    emoji: "🎨",
    name: "디자이너",
    desc1: "예쁜 그림과 색깔로 무언가를 만들어요",
    desc2: "그림 그리기를 좋아하면 잘 맞아요",
    relatedInterests: ["crafting"],
  },
  {
    id: "doctor",
    emoji: "🏥",
    name: "의사/간호사",
    desc1: "아픈 사람들을 고쳐주는 일을 해요",
    desc2: "사람을 돕고 싶은 마음이 필요해요",
    relatedInterests: ["social"],
  },
  {
    id: "teacher",
    emoji: "📚",
    name: "선생님",
    desc1: "학생들에게 새로운 것을 가르쳐요",
    desc2: "설명하고 함께하는 걸 좋아하면 좋아요",
    relatedInterests: ["reading", "social"],
  },
  {
    id: "scientist2",
    emoji: "🔬",
    name: "과학자",
    desc1: "새로운 것을 발견하고 실험해요",
    desc2: "궁금한 게 많으면 잘 맞아요",
    relatedInterests: ["science"],
  },
  {
    id: "musician",
    emoji: "🎵",
    name: "음악가",
    desc1: "노래나 악기로 음악을 만들어요",
    desc2: "음악 듣는 걸 좋아하면 시작해봐요",
    relatedInterests: ["music"],
  },
];
