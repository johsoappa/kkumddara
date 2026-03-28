// ====================================================
// 직업별 로드맵 더미 데이터 (10개)
// [Supabase 연동 후] DB fetch로 교체 예정
// ====================================================

import type { RoadmapData } from "@/types/roadmap";

export const ROADMAPS: Record<string, RoadmapData> = {
  "ux-designer": {
    id: "ux-designer-roadmap",
    occupationId: "ux-designer",
    occupationName: "UX 디자이너",
    occupationEmoji: "💻",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "m1", text: "무료 Figma 계정 만들기" },
          { id: "m2", text: "UI/UX 유튜브 채널 구독하기" },
          { id: "m3", text: "좋아하는 앱 UX 분석 일기 쓰기" },
          { id: "m4", text: "학교 미술·디자인 동아리 참여하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "m5", text: "Figma 기초 강의 완강하기" },
          { id: "m6", text: "포트폴리오 첫 작품 만들기" },
          { id: "m7", text: "UX 관련 도서 3권 읽기" },
          { id: "m8", text: "디자인 공모전 1회 참가하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "m9",  text: "UX 디자인 인턴십 도전하기" },
          { id: "m10", text: "해외 디자인 트렌드 분석하기" },
          { id: "m11", text: "개인 포트폴리오 사이트 만들기" },
          { id: "m12", text: "멘토 UX 디자이너 만나기" },
        ],
      },
    ],
  },

  "data-analyst": {
    id: "data-analyst-roadmap",
    occupationId: "data-analyst",
    occupationName: "데이터 분석가",
    occupationEmoji: "📊",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "m1", text: "Python 무료 강의 수강하기" },
          { id: "m2", text: "수학·통계 기초 공부하기" },
          { id: "m3", text: "데이터 분석 유튜브 채널 구독하기" },
          { id: "m4", text: "엑셀 함수 마스터하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "m5", text: "Python 데이터 분석 실습하기" },
          { id: "m6", text: "Kaggle 입문 대회 참가하기" },
          { id: "m7", text: "통계학 심화 학습하기" },
          { id: "m8", text: "포트폴리오 프로젝트 1개 완성하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "m9",  text: "SQL 마스터하기" },
          { id: "m10", text: "머신러닝 기초 학습하기" },
          { id: "m11", text: "데이터 분석 인턴 도전하기" },
          { id: "m12", text: "멘토 분석가 만나기" },
        ],
      },
    ],
  },

  "software-engineer": {
    id: "software-engineer-roadmap",
    occupationId: "software-engineer",
    occupationName: "소프트웨어 엔지니어",
    occupationEmoji: "🖥️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "m1", text: "코딩 기초 강의 수강하기 (Python/JS)" },
          { id: "m2", text: "알고리즘 기초 공부하기" },
          { id: "m3", text: "IT 관련 유튜브 채널 구독하기" },
          { id: "m4", text: "간단한 프로그램 만들어 보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "m5", text: "웹 개발 프로젝트 1개 완성하기" },
          { id: "m6", text: "GitHub 계정 만들고 코드 올리기" },
          { id: "m7", text: "코딩 테스트 기초 준비하기" },
          { id: "m8", text: "해커톤 참가하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "m9",  text: "개인 프로젝트 포트폴리오 만들기" },
          { id: "m10", text: "오픈소스 프로젝트 기여하기" },
          { id: "m11", text: "개발 인턴 도전하기" },
          { id: "m12", text: "멘토 개발자 만나기" },
        ],
      },
    ],
  },

  "veterinarian": {
    id: "veterinarian-roadmap",
    occupationId: "veterinarian",
    occupationName: "수의사",
    occupationEmoji: "🐾",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "m1", text: "동물 관련 유튜브 채널 구독하기" },
          { id: "m2", text: "반려동물 봉사활동 참여하기" },
          { id: "m3", text: "생물 과목 집중 공부하기" },
          { id: "m4", text: "동물병원 견학 신청하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "m5", text: "생물·화학 심화 학습하기" },
          { id: "m6", text: "동물 관련 도서 5권 읽기" },
          { id: "m7", text: "수의대 탐방하기" },
          { id: "m8", text: "과학 경시대회 참가하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "m9",  text: "수의대 입시 준비하기" },
          { id: "m10", text: "해외 수의학 트렌드 공부하기" },
          { id: "m11", text: "연구 논문 읽기" },
          { id: "m12", text: "멘토 수의사 만나기" },
        ],
      },
    ],
  },

  "elementary-teacher": {
    id: "elementary-teacher-roadmap",
    occupationId: "elementary-teacher",
    occupationName: "초등교사",
    occupationEmoji: "📚",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "m1", text: "교육 관련 유튜브 채널 구독하기" },
          { id: "m2", text: "아이들 대상 봉사활동 참여하기" },
          { id: "m3", text: "교육학 기초 도서 읽기" },
          { id: "m4", text: "교육대학교 탐방하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "m5", text: "교육봉사 꾸준히 참여하기" },
          { id: "m6", text: "독서토론 동아리 활동하기" },
          { id: "m7", text: "교육 관련 공모전 참가하기" },
          { id: "m8", text: "교대 입시 정보 수집하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "m9",  text: "교대 입시 준비하기" },
          { id: "m10", text: "교생실습 경험 쌓기" },
          { id: "m11", text: "나만의 교육 철학 정립하기" },
          { id: "m12", text: "멘토 교사 만나기" },
        ],
      },
    ],
  },

  "video-creator": {
    id: "video-creator-roadmap",
    occupationId: "video-creator",
    occupationName: "영상 크리에이터",
    occupationEmoji: "🎬",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "m1", text: "스마트폰으로 짧은 영상 찍어보기" },
          { id: "m2", text: "무료 편집 앱(CapCut)으로 편집 도전하기" },
          { id: "m3", text: "좋아하는 유튜버 콘텐츠 구성 분석하기" },
          { id: "m4", text: "학교 방송부 지원하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "m5", text: "영상 편집 심화 강의 수강하기" },
          { id: "m6", text: "유튜브 채널 개설하고 영상 3개 올리기" },
          { id: "m7", text: "촬영·조명 기초 공부하기" },
          { id: "m8", text: "영상 공모전 참가하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "m9",  text: "영상 포트폴리오 완성하기" },
          { id: "m10", text: "영상학과 진학 준비하기" },
          { id: "m11", text: "미디어 인턴십 도전하기" },
          { id: "m12", text: "멘토 크리에이터 만나기" },
        ],
      },
    ],
  },

  "marketer": {
    id: "marketer-roadmap",
    occupationId: "marketer",
    occupationName: "마케터",
    occupationEmoji: "📣",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "m1", text: "좋아하는 브랜드 SNS 마케팅 분석하기" },
          { id: "m2", text: "마케팅 유튜브 채널 구독하기" },
          { id: "m3", text: "관심 있는 상품 광고 카피 써보기" },
          { id: "m4", text: "학교 학생회·홍보부 활동하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "m5", text: "SNS 마케팅 캠페인 기획서 써보기" },
          { id: "m6", text: "소비자 심리학 기초 도서 읽기" },
          { id: "m7", text: "광고 공모전 참가하기" },
          { id: "m8", text: "경영·홍보 관련 특강 참가하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "m9",  text: "경영학·광고홍보학 진학 준비하기" },
          { id: "m10", text: "데이터 기반 마케팅 기초 공부하기" },
          { id: "m11", text: "마케팅 인턴십 도전하기" },
          { id: "m12", text: "멘토 마케터 만나기" },
        ],
      },
    ],
  },

  "nurse": {
    id: "nurse-roadmap",
    occupationId: "nurse",
    occupationName: "간호사",
    occupationEmoji: "🏥",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "m1", text: "심폐소생술(CPR) 기초 배우기" },
          { id: "m2", text: "의료 관련 유튜브 채널 구독하기" },
          { id: "m3", text: "병원 봉사활동 신청하기" },
          { id: "m4", text: "생물·보건 교과서 심화 복습하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "m5", text: "생물·화학 심화 학습하기" },
          { id: "m6", text: "간호학과 탐방하기" },
          { id: "m7", text: "의료 관련 도서 3권 읽기" },
          { id: "m8", text: "응급처치 자격증 기초 공부하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "m9",  text: "간호학과 입시 준비하기" },
          { id: "m10", text: "해외 의료 트렌드 공부하기" },
          { id: "m11", text: "의료 봉사 활동 꾸준히 이어가기" },
          { id: "m12", text: "멘토 간호사 만나기" },
        ],
      },
    ],
  },

  "architect": {
    id: "architect-roadmap",
    occupationId: "architect",
    occupationName: "건축가",
    occupationEmoji: "🏛️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "m1", text: "무료 3D 모델링 툴(SketchUp) 써보기" },
          { id: "m2", text: "좋아하는 건물 사진 찍고 구조 분석하기" },
          { id: "m3", text: "건축 관련 유튜브 채널 구독하기" },
          { id: "m4", text: "수학·미술 과목 집중하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "m5", text: "건축 도면 읽는 법 공부하기" },
          { id: "m6", text: "건축학과 탐방하기" },
          { id: "m7", text: "건축 관련 도서 3권 읽기" },
          { id: "m8", text: "건축·디자인 공모전 참가하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "m9",  text: "건축학과 입시 준비하기" },
          { id: "m10", text: "해외 건축 트렌드 공부하기" },
          { id: "m11", text: "건축 설계 포트폴리오 만들기" },
          { id: "m12", text: "멘토 건축가 만나기" },
        ],
      },
    ],
  },

  "social-worker": {
    id: "social-worker-roadmap",
    occupationId: "social-worker",
    occupationName: "사회복지사",
    occupationEmoji: "🤝",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "m1", text: "지역 봉사활동 신청하기" },
          { id: "m2", text: "사회복지 관련 유튜브 채널 구독하기" },
          { id: "m3", text: "관련 도서 읽기 (사회복지사의 하루)" },
          { id: "m4", text: "학교 봉사 동아리 참여하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "m5", text: "사회복지학 기초 공부하기" },
          { id: "m6", text: "사회복지관 견학하기" },
          { id: "m7", text: "복지 관련 공모전 참가하기" },
          { id: "m8", text: "봉사 활동 시간 100시간 채우기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "m9",  text: "사회복지학과 입시 준비하기" },
          { id: "m10", text: "사회복지사 자격증 취득 계획 세우기" },
          { id: "m11", text: "해외 복지 제도 비교 공부하기" },
          { id: "m12", text: "멘토 사회복지사 만나기" },
        ],
      },
    ],
  },
};

export function getRoadmap(occupationId: string): RoadmapData | null {
  return ROADMAPS[occupationId] ?? null;
}

// 하위 호환 (기존 import 유지)
export const UX_DESIGNER_ROADMAP = ROADMAPS["ux-designer"];
