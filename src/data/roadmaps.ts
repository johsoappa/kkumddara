// ====================================================
// 직업별 로드맵 더미 데이터 (50개)
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

  // ── 키 수정: 기존 elementary-teacher → teacher, video-creator → youtuber-creator ─────
  "teacher": {
    id: "teacher-roadmap",
    occupationId: "teacher",
    occupationName: "교사",
    occupationEmoji: "📚",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "tch-m1", text: "동생·친구에게 무언가 가르쳐 보기" },
          { id: "tch-m2", text: "방과후 또래 멘토링 프로그램 참여하기" },
          { id: "tch-m3", text: "수업에서 발표·토론 적극 참여하기" },
          { id: "tch-m4", text: "교육 관련 다큐멘터리 시청하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "tch-m5", text: "교육봉사 프로그램 참가하기" },
          { id: "tch-m6", text: "교육학 입문서 1권 읽기" },
          { id: "tch-m7", text: "임용고사 준비 로드맵 파악하기" },
          { id: "tch-m8", text: "수업 설계 연습 (10분짜리 미니 수업 만들기)" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "tch-m9",  text: "사범계열 학과 탐색 및 진학 준비하기" },
          { id: "tch-m10", text: "교생실습 경험 쌓기" },
          { id: "tch-m11", text: "나만의 수업 철학 정리하기" },
          { id: "tch-m12", text: "멘토 교사 만나 현장 이야기 듣기" },
        ],
      },
    ],
  },

  "youtuber-creator": {
    id: "youtuber-creator-roadmap",
    occupationId: "youtuber-creator",
    occupationName: "크리에이터",
    occupationEmoji: "🎥",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "ytb-m1", text: "스마트폰으로 짧은 영상 직접 찍어 올려보기" },
          { id: "ytb-m2", text: "자신만의 관심사 채널 컨셉 기획해 보기" },
          { id: "ytb-m3", text: "편집 앱(CapCut 등) 무료 체험해 보기" },
          { id: "ytb-m4", text: "좋아하는 유튜버 영상 구조 분석하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "ytb-m5", text: "채널 개설 후 10개 영상 꾸준히 올리기" },
          { id: "ytb-m6", text: "썸네일·제목 최적화 공부하기" },
          { id: "ytb-m7", text: "영상 편집 기초 강의 완강하기" },
          { id: "ytb-m8", text: "댓글 소통으로 구독자 반응 파악하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "ytb-m9",  text: "구독자 1,000명 달성 도전하기" },
          { id: "ytb-m10", text: "브랜드 협찬·광고 수익 구조 공부하기" },
          { id: "ytb-m11", text: "멀티 플랫폼(인스타·틱톡) 동시 운영해 보기" },
          { id: "ytb-m12", text: "멘토 크리에이터 만나기" },
        ],
      },
    ],
  },

  // ── IT·기술 추가 로드맵 ──────────────────────────────────────────
  "ai-engineer": {
    id: "ai-engineer-roadmap",
    occupationId: "ai-engineer",
    occupationName: "AI 엔지니어",
    occupationEmoji: "🤖",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "aie-m1", text: "ChatGPT·Gemini 직접 써보며 원리 궁금증 키우기" },
          { id: "aie-m2", text: "Python 입문 무료 강의 수강하기" },
          { id: "aie-m3", text: "AI 체험 사이트(teachablemachine.withgoogle.com) 사용해 보기" },
          { id: "aie-m4", text: "수학·통계 기초 공부하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "aie-m5", text: "머신러닝 기초 강의 완강하기" },
          { id: "aie-m6", text: "Kaggle 입문 대회 참가하기" },
          { id: "aie-m7", text: "간단한 AI 프로젝트 1개 완성하기" },
          { id: "aie-m8", text: "AI 관련 도서 1권 읽기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "aie-m9",  text: "AI 연구소 또는 기업 인턴십 도전하기" },
          { id: "aie-m10", text: "개인 AI 프로젝트 포트폴리오 만들기" },
          { id: "aie-m11", text: "AI 관련 학회·컨퍼런스 참가하기" },
          { id: "aie-m12", text: "멘토 AI 엔지니어 만나기" },
        ],
      },
    ],
  },

  "cloud-engineer": {
    id: "cloud-engineer-roadmap",
    occupationId: "cloud-engineer",
    occupationName: "클라우드 엔지니어",
    occupationEmoji: "☁️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "cle-m1", text: "리눅스 기초 명령어 배우기" },
          { id: "cle-m2", text: "AWS 무료 티어 계정 만들어 보기" },
          { id: "cle-m3", text: "컴퓨터 네트워크 개념 유튜브로 공부하기" },
          { id: "cle-m4", text: "클라우드 관련 유튜브 채널 구독하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "cle-m5", text: "AWS·Azure 입문 강의 완강하기" },
          { id: "cle-m6", text: "간단한 웹 서버 클라우드에 배포해 보기" },
          { id: "cle-m7", text: "Docker 기초 개념 학습하기" },
          { id: "cle-m8", text: "클라우드 자격증 준비 계획 세우기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "cle-m9",  text: "AWS Solutions Architect 자격증 취득하기" },
          { id: "cle-m10", text: "클라우드 아키텍처 포트폴리오 만들기" },
          { id: "cle-m11", text: "IT 기업 인턴십 도전하기" },
          { id: "cle-m12", text: "멘토 클라우드 엔지니어 만나기" },
        ],
      },
    ],
  },

  "cybersecurity-expert": {
    id: "cybersecurity-expert-roadmap",
    occupationId: "cybersecurity-expert",
    occupationName: "사이버보안 전문가",
    occupationEmoji: "🔒",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "cse-m1", text: "리눅스 기초 명령어 배우기" },
          { id: "cse-m2", text: "보안 관련 유튜브 채널 구독하기" },
          { id: "cse-m3", text: "CTF(해킹 방어 퀴즈) 입문 문제 도전하기" },
          { id: "cse-m4", text: "정보보안 관련 도서 1권 읽기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "cse-m5", text: "네트워크 기초 자격증 준비하기" },
          { id: "cse-m6", text: "웹 해킹 기초 강의 수강하기" },
          { id: "cse-m7", text: "보안 포럼·커뮤니티 가입하기" },
          { id: "cse-m8", text: "보안 취약점 분석 연습하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "cse-m9",  text: "정보보안기사 자격증 취득하기" },
          { id: "cse-m10", text: "보안 프로젝트 포트폴리오 구축하기" },
          { id: "cse-m11", text: "보안 기업 인턴십 도전하기" },
          { id: "cse-m12", text: "멘토 보안 전문가 만나기" },
        ],
      },
    ],
  },

  "game-developer": {
    id: "game-developer-roadmap",
    occupationId: "game-developer",
    occupationName: "게임 개발자",
    occupationEmoji: "🎮",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "gmd-m1", text: "스크래치로 간단한 게임 만들어 보기" },
          { id: "gmd-m2", text: "Unity 무료 버전 설치해 보기" },
          { id: "gmd-m3", text: "좋아하는 게임의 구조 분석하기" },
          { id: "gmd-m4", text: "게임 개발 유튜브 채널 구독하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "gmd-m5", text: "Unity 기초 강의 완강하기" },
          { id: "gmd-m6", text: "간단한 2D 게임 1개 완성하기" },
          { id: "gmd-m7", text: "C# 프로그래밍 기초 공부하기" },
          { id: "gmd-m8", text: "게임 개발 동아리 활동하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "gmd-m9",  text: "게임 잼(Game Jam) 대회 참가하기" },
          { id: "gmd-m10", text: "포트폴리오 게임 3개 이상 완성하기" },
          { id: "gmd-m11", text: "게임 회사 인턴십 도전하기" },
          { id: "gmd-m12", text: "멘토 게임 개발자 만나기" },
        ],
      },
    ],
  },

  "info-security-specialist": {
    id: "info-security-specialist-roadmap",
    occupationId: "info-security-specialist",
    occupationName: "정보보안전문가",
    occupationEmoji: "🛡️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "iss-m1", text: "개인정보 보호 관련 뉴스 꾸준히 읽기" },
          { id: "iss-m2", text: "리눅스 기초 명령어 배우기" },
          { id: "iss-m3", text: "CTF 입문 문제 도전하기" },
          { id: "iss-m4", text: "정보보안 관련 유튜브 채널 구독하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "iss-m5", text: "네트워크 기초 자격증 취득하기" },
          { id: "iss-m6", text: "개인정보보호법 기초 공부하기" },
          { id: "iss-m7", text: "보안 감사 체크리스트 만들어 보기" },
          { id: "iss-m8", text: "정보보안 관련 동아리 활동하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "iss-m9",  text: "정보보안기사 자격증 취득하기" },
          { id: "iss-m10", text: "보안 컨설팅 포트폴리오 구축하기" },
          { id: "iss-m11", text: "보안 전문 기업 인턴십 도전하기" },
          { id: "iss-m12", text: "멘토 정보보안 전문가 만나기" },
        ],
      },
    ],
  },

  // ── 의료·과학 추가 로드맵 ──────────────────────────────────────────
  "biotech-researcher": {
    id: "biotech-researcher-roadmap",
    occupationId: "biotech-researcher",
    occupationName: "생명과학 연구원",
    occupationEmoji: "🔬",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "btr-m1", text: "생물·화학 실험 동아리 참여하기" },
          { id: "btr-m2", text: "과학 올림피아드 준비해 보기" },
          { id: "btr-m3", text: "생명과학 관련 도서·다큐 탐색하기" },
          { id: "btr-m4", text: "현미경으로 주변 물체 관찰하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "btr-m5", text: "생물·화학 심화 과목 집중 학습하기" },
          { id: "btr-m6", text: "대학 오픈 랩 행사 참가해 보기" },
          { id: "btr-m7", text: "생명과학 탐구 보고서 1편 작성하기" },
          { id: "btr-m8", text: "과학 탐구 대회 참가하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "btr-m9",  text: "생명공학 관련 대학 학과 탐색하기" },
          { id: "btr-m10", text: "연구실 인턴십 또는 봉사 경험 쌓기" },
          { id: "btr-m11", text: "영어 논문 읽기 연습하기" },
          { id: "btr-m12", text: "멘토 연구원 만나기" },
        ],
      },
    ],
  },

  "bio-researcher": {
    id: "bio-researcher-roadmap",
    occupationId: "bio-researcher",
    occupationName: "바이오연구원",
    occupationEmoji: "🧬",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "bior-m1", text: "생물·화학 과목 집중 공부하기" },
          { id: "bior-m2", text: "바이오·생명과학 다큐멘터리 시청하기" },
          { id: "bior-m3", text: "과학 탐구 대회 참가해 보기" },
          { id: "bior-m4", text: "학교 과학 동아리 활동하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "bior-m5", text: "생명공학 관련 책 2권 읽기" },
          { id: "bior-m6", text: "바이오 기업 탐방 또는 견학 참가하기" },
          { id: "bior-m7", text: "영어 과학 기사 요약 연습하기" },
          { id: "bior-m8", text: "탐구 실험 보고서 1편 작성하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "bior-m9",  text: "생명공학 또는 바이오의약학과 진학 준비하기" },
          { id: "bior-m10", text: "연구실 인턴십 경험 쌓기" },
          { id: "bior-m11", text: "바이오 스타트업 관련 뉴스 팔로우하기" },
          { id: "bior-m12", text: "멘토 바이오 연구원 만나기" },
        ],
      },
    ],
  },

  "doctor": {
    id: "doctor-roadmap",
    occupationId: "doctor",
    occupationName: "의사",
    occupationEmoji: "🩺",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "doc-m1", text: "생물·화학 과목 집중 공부하기" },
          { id: "doc-m2", text: "병원 봉사활동 또는 견학 경험 쌓기" },
          { id: "doc-m3", text: "의학 관련 다큐멘터리 시청하기" },
          { id: "doc-m4", text: "응급처치 기초 교육 받기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "doc-m5", text: "과학 올림피아드 참가하기" },
          { id: "doc-m6", text: "의학 입문 서적 1권 읽기" },
          { id: "doc-m7", text: "생명과학 심화 과목 준비하기" },
          { id: "doc-m8", text: "의대 진학 커리큘럼 파악하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "doc-m9",  text: "의학 계열 학과 탐색 및 수능 준비하기" },
          { id: "doc-m10", text: "의료 봉사 캠프 참가하기" },
          { id: "doc-m11", text: "관심 의학 분야(소아과·정형외과 등) 정해보기" },
          { id: "doc-m12", text: "멘토 의사 선생님 만나기" },
        ],
      },
    ],
  },

  "environmental-scientist": {
    id: "environmental-scientist-roadmap",
    occupationId: "environmental-scientist",
    occupationName: "환경과학자",
    occupationEmoji: "🌿",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "evs-m1", text: "환경부 어린이 환경 캠프 참여하기" },
          { id: "evs-m2", text: "학교 환경·생태 동아리 가입하기" },
          { id: "evs-m3", text: "탄소발자국 줄이는 생활 실천하며 기록하기" },
          { id: "evs-m4", text: "환경 관련 다큐멘터리 시청하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "evs-m5", text: "생물·화학·지구과학 심화 학습하기" },
          { id: "evs-m6", text: "환경 탐구 보고서 1편 작성하기" },
          { id: "evs-m7", text: "환경 관련 공모전 참가하기" },
          { id: "evs-m8", text: "지역 생태 보전 봉사활동 참가하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "evs-m9",  text: "환경학과 또는 지구환경과학과 진학 준비하기" },
          { id: "evs-m10", text: "환경부·연구기관 인턴십 도전하기" },
          { id: "evs-m11", text: "영어 환경 논문 읽기 연습하기" },
          { id: "evs-m12", text: "멘토 환경과학자 만나기" },
        ],
      },
    ],
  },

  "pharmacist": {
    id: "pharmacist-roadmap",
    occupationId: "pharmacist",
    occupationName: "약사",
    occupationEmoji: "💊",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "pha-m1", text: "화학·생물 과목 집중 공부하기" },
          { id: "pha-m2", text: "약국 방문 시 약사 선생님께 질문해 보기" },
          { id: "pha-m3", text: "의약품 관련 다큐멘터리 시청하기" },
          { id: "pha-m4", text: "약학 관련 책 1권 읽기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "pha-m5", text: "화학·생물 올림피아드 준비하기" },
          { id: "pha-m6", text: "약대 입시 커리큘럼 파악하기" },
          { id: "pha-m7", text: "병원 또는 약국 봉사활동 경험 쌓기" },
          { id: "pha-m8", text: "약리학 기초 개념 공부하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "pha-m9",  text: "약학대학 진학 준비하기" },
          { id: "pha-m10", text: "제약회사·병원 인턴십 탐색하기" },
          { id: "pha-m11", text: "약사 국가시험 준비 계획 세우기" },
          { id: "pha-m12", text: "멘토 약사 만나기" },
        ],
      },
    ],
  },

  // ── 예술·디자인 추가 로드맵 ──────────────────────────────────────────
  "fashion-designer": {
    id: "fashion-designer-roadmap",
    occupationId: "fashion-designer",
    occupationName: "패션 디자이너",
    occupationEmoji: "👗",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "fsd-m1", text: "스케치북에 의상 디자인 매일 그려보기" },
          { id: "fsd-m2", text: "패션 잡지·인스타그램 트렌드 분석하기" },
          { id: "fsd-m3", text: "학교 미술·디자인 동아리 활동하기" },
          { id: "fsd-m4", text: "좋아하는 패션 브랜드 역사 공부하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "fsd-m5", text: "기초 봉제·재봉 기술 배우기" },
          { id: "fsd-m6", text: "Illustrator·Procreate로 디자인 시작하기" },
          { id: "fsd-m7", text: "패션쇼 또는 패션 행사 견학하기" },
          { id: "fsd-m8", text: "미니 컬렉션 기획 노트 만들기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "fsd-m9",  text: "패션디자인학과 포트폴리오 준비하기" },
          { id: "fsd-m10", text: "패션 브랜드 인턴십 도전하기" },
          { id: "fsd-m11", text: "첫 개인 의상 작품 완성하기" },
          { id: "fsd-m12", text: "멘토 패션 디자이너 만나기" },
        ],
      },
    ],
  },

  "graphic-designer": {
    id: "graphic-designer-roadmap",
    occupationId: "graphic-designer",
    occupationName: "그래픽 디자이너",
    occupationEmoji: "🖌️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "grd-m1", text: "Canva 무료 계정으로 포스터 만들어 보기" },
          { id: "grd-m2", text: "그림·드로잉 꾸준히 연습하기" },
          { id: "grd-m3", text: "좋아하는 디자인 작품 스크랩하기" },
          { id: "grd-m4", text: "색상·타이포그래피 기초 공부하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "grd-m5", text: "Illustrator·Photoshop 기초 강의 완강하기" },
          { id: "grd-m6", text: "포스터·로고 디자인 포트폴리오 3개 만들기" },
          { id: "grd-m7", text: "디자인 공모전 1회 참가하기" },
          { id: "grd-m8", text: "미술·디자인 동아리 활동하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "grd-m9",  text: "시각디자인학과 포트폴리오 준비하기" },
          { id: "grd-m10", text: "디자인 에이전시 인턴십 도전하기" },
          { id: "grd-m11", text: "개인 브랜딩 아이덴티티 프로젝트 완성하기" },
          { id: "grd-m12", text: "멘토 그래픽 디자이너 만나기" },
        ],
      },
    ],
  },

  "illustrator": {
    id: "illustrator-roadmap",
    occupationId: "illustrator",
    occupationName: "일러스트레이터",
    occupationEmoji: "✏️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "ill-m1", text: "매일 30분 드로잉 연습하기" },
          { id: "ill-m2", text: "좋아하는 캐릭터 모작부터 시작하기" },
          { id: "ill-m3", text: "Procreate·Clip Studio 무료 체험하기" },
          { id: "ill-m4", text: "일러스트 작가 작품집 탐색하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "ill-m5", text: "나만의 캐릭터 3종 디자인하기" },
          { id: "ill-m6", text: "인스타그램에 작품 정기 업로드하기" },
          { id: "ill-m7", text: "일러스트 공모전 1회 참가하기" },
          { id: "ill-m8", text: "포트폴리오 웹사이트 만들기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "ill-m9",  text: "만화·시각디자인 학과 포트폴리오 준비하기" },
          { id: "ill-m10", text: "출판사·게임회사 일러스트 인턴십 도전하기" },
          { id: "ill-m11", text: "개인 굿즈 제작 경험해 보기" },
          { id: "ill-m12", text: "멘토 일러스트레이터 만나기" },
        ],
      },
    ],
  },

  "ux-ui-designer": {
    id: "ux-ui-designer-roadmap",
    occupationId: "ux-ui-designer",
    occupationName: "UX/UI 디자이너",
    occupationEmoji: "🎨",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "uxd-m1", text: "Figma 무료 계정으로 앱 화면 직접 만들어 보기" },
          { id: "uxd-m2", text: "좋아하는 앱의 버튼·색상 배치 분석해 보기" },
          { id: "uxd-m3", text: "UI 트렌드 Pinterest·Dribbble로 탐색하기" },
          { id: "uxd-m4", text: "미술·디자인 동아리 활동하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "uxd-m5", text: "Figma 기초 강의 완강하기" },
          { id: "uxd-m6", text: "앱 UI 리디자인 프로젝트 1개 완성하기" },
          { id: "uxd-m7", text: "사용자 인터뷰 기초 공부하기" },
          { id: "uxd-m8", text: "UX 관련 도서 1권 읽기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "uxd-m9",  text: "디지털미디어디자인 학과 포트폴리오 준비하기" },
          { id: "uxd-m10", text: "IT 기업 UX 인턴십 도전하기" },
          { id: "uxd-m11", text: "케이스 스터디 포트폴리오 3개 완성하기" },
          { id: "uxd-m12", text: "멘토 UX/UI 디자이너 만나기" },
        ],
      },
    ],
  },

  "video-editor": {
    id: "video-editor-roadmap",
    occupationId: "video-editor",
    occupationName: "영상 편집자",
    occupationEmoji: "🎬",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "ved-m1", text: "스마트폰으로 직접 찍고 편집해 보기" },
          { id: "ved-m2", text: "CapCut 무료 앱으로 영상 편집 시작하기" },
          { id: "ved-m3", text: "좋아하는 유튜버의 편집 스타일 분석하기" },
          { id: "ved-m4", text: "학교 방송반 또는 영상 동아리 활동하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "ved-m5", text: "다빈치 리졸브·프리미어 기초 강의 완강하기" },
          { id: "ved-m6", text: "단편 영상 1편 처음부터 끝까지 편집하기" },
          { id: "ved-m7", text: "색보정·사운드 편집 기초 배우기" },
          { id: "ved-m8", text: "영상 포트폴리오 3편 완성하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "ved-m9",  text: "영상학과 포트폴리오 준비하기" },
          { id: "ved-m10", text: "유튜브 채널 편집 외주 경험해 보기" },
          { id: "ved-m11", text: "영상 제작사 인턴십 도전하기" },
          { id: "ved-m12", text: "멘토 영상 편집자 만나기" },
        ],
      },
    ],
  },

  // ── 교육·사회 추가 로드맵 ──────────────────────────────────────────
  "career-counselor": {
    id: "career-counselor-roadmap",
    occupationId: "career-counselor",
    occupationName: "진로 상담 전문가",
    occupationEmoji: "🧭",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "cco-m1", text: "학교 진로 프로그램 적극 참여하기" },
          { id: "cco-m2", text: "직업 체험 박람회 방문하기" },
          { id: "cco-m3", text: "다양한 직업인 인터뷰 영상 시청하기" },
          { id: "cco-m4", text: "또래 고민 들어주는 연습하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "cco-m5", text: "심리학·상담 입문 도서 1권 읽기" },
          { id: "cco-m6", text: "학교 또래 상담 동아리 활동하기" },
          { id: "cco-m7", text: "진로 지도 관련 강의 수강하기" },
          { id: "cco-m8", text: "나만의 진로 포트폴리오 만들기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "cco-m9",  text: "교육학·상담심리학과 진학 준비하기" },
          { id: "cco-m10", text: "진로상담 자격증 취득 계획 세우기" },
          { id: "cco-m11", text: "교육 기관 봉사 경험 쌓기" },
          { id: "cco-m12", text: "멘토 진로 상담 전문가 만나기" },
        ],
      },
    ],
  },

  "career-guidance-counselor": {
    id: "career-guidance-counselor-roadmap",
    occupationId: "career-guidance-counselor",
    occupationName: "진로상담사",
    occupationEmoji: "🧭",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "cgc-m1", text: "학교 진로 프로그램 적극 참여하기" },
          { id: "cgc-m2", text: "친구의 고민을 들어주고 조언하는 연습하기" },
          { id: "cgc-m3", text: "직업 체험 박람회 방문하기" },
          { id: "cgc-m4", text: "심리학·상담 관련 입문 도서 읽기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "cgc-m5", text: "또래 상담 동아리 활동하기" },
          { id: "cgc-m6", text: "진로 검사 도구(MBTI·홀랜드 검사) 공부하기" },
          { id: "cgc-m7", text: "상담 기록 노트 작성 연습하기" },
          { id: "cgc-m8", text: "나만의 진로 설계 워크북 만들기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "cgc-m9",  text: "교육학·상담심리학과 진학 준비하기" },
          { id: "cgc-m10", text: "청소년 상담 봉사 경험 쌓기" },
          { id: "cgc-m11", text: "진로상담사 자격증 취득 계획 세우기" },
          { id: "cgc-m12", text: "멘토 진로상담사 만나기" },
        ],
      },
    ],
  },

  "edu-content-developer": {
    id: "edu-content-developer-roadmap",
    occupationId: "edu-content-developer",
    occupationName: "교육 콘텐츠 개발자",
    occupationEmoji: "📝",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "ecd-m1", text: "직접 공부 노트·요약집 만들어 보기" },
          { id: "ecd-m2", text: "친구에게 내가 배운 내용 설명해 보기" },
          { id: "ecd-m3", text: "Khan Academy·EBSi 구조 분석해 보기" },
          { id: "ecd-m4", text: "교육 유튜브 채널 기획 아이디어 메모하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "ecd-m5", text: "간단한 교육 자료(PPT·PDF) 1개 직접 만들기" },
          { id: "ecd-m6", text: "교육공학 기초 개념 공부하기" },
          { id: "ecd-m7", text: "학습 콘텐츠 기획안 작성 연습하기" },
          { id: "ecd-m8", text: "교육 관련 공모전 참가하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "ecd-m9",  text: "교육공학·교육학과 진학 준비하기" },
          { id: "ecd-m10", text: "에듀테크 기업 인턴십 도전하기" },
          { id: "ecd-m11", text: "온라인 강의 1편 직접 기획·제작하기" },
          { id: "ecd-m12", text: "멘토 교육 콘텐츠 개발자 만나기" },
        ],
      },
    ],
  },

  "psychologist": {
    id: "psychologist-roadmap",
    occupationId: "psychologist",
    occupationName: "심리상담사",
    occupationEmoji: "💬",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "psy-m1", text: "심리학 입문 도서 1권 읽기" },
          { id: "psy-m2", text: "나 자신의 감정 일기 꾸준히 쓰기" },
          { id: "psy-m3", text: "또래 상담 동아리 활동하기" },
          { id: "psy-m4", text: "심리 관련 유튜브·팟캐스트 탐색하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "psy-m5", text: "MBTI·에니어그램 등 심리 검사 공부하기" },
          { id: "psy-m6", text: "경청·공감 연습 일지 작성하기" },
          { id: "psy-m7", text: "청소년 상담 봉사활동 참가하기" },
          { id: "psy-m8", text: "심리학 심화 도서 2권 읽기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "psy-m9",  text: "심리학·상담심리학과 진학 준비하기" },
          { id: "psy-m10", text: "심리 상담 기관 봉사 경험 쌓기" },
          { id: "psy-m11", text: "임상심리사 자격증 준비 계획 세우기" },
          { id: "psy-m12", text: "멘토 심리상담사 만나기" },
        ],
      },
    ],
  },

  // ── 비즈니스·경영 추가 로드맵 ──────────────────────────────────────────
  "brand-manager": {
    id: "brand-manager-roadmap",
    occupationId: "brand-manager",
    occupationName: "브랜드매니저",
    occupationEmoji: "🏷️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "brm-m1", text: "좋아하는 브랜드의 광고·패키지 분석해 보기" },
          { id: "brm-m2", text: "SNS 채널 직접 운영하며 반응 관찰하기" },
          { id: "brm-m3", text: "학교 축제·행사 홍보물 직접 기획해 보기" },
          { id: "brm-m4", text: "마케팅 관련 유튜브 채널 구독하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "brm-m5", text: "브랜드 아이덴티티 기획서 작성해 보기" },
          { id: "brm-m6", text: "마케팅·브랜딩 입문서 1권 읽기" },
          { id: "brm-m7", text: "소비자 조사 기초 방법 공부하기" },
          { id: "brm-m8", text: "교내 창업 동아리 또는 마케팅 대회 참가하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "brm-m9",  text: "경영·광고홍보학과 진학 준비하기" },
          { id: "brm-m10", text: "마케팅 대행사 또는 기업 인턴십 도전하기" },
          { id: "brm-m11", text: "실제 브랜드 캠페인 기획안 작성하기" },
          { id: "brm-m12", text: "멘토 브랜드매니저 만나기" },
        ],
      },
    ],
  },

  "entrepreneur": {
    id: "entrepreneur-roadmap",
    occupationId: "entrepreneur",
    occupationName: "스타트업 창업가",
    occupationEmoji: "🚀",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "ent-m1", text: "주변 문제를 해결하는 아이디어 노트 쓰기" },
          { id: "ent-m2", text: "성공한 창업가 자서전 1권 읽기" },
          { id: "ent-m3", text: "학교 창업 동아리 또는 비즈니스 대회 참여하기" },
          { id: "ent-m4", text: "창업 관련 유튜브·팟캐스트 듣기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "ent-m5", text: "간단한 사업계획서 1장 작성해 보기" },
          { id: "ent-m6", text: "청소년 창업 경진대회 참가하기" },
          { id: "ent-m7", text: "실제로 소규모 물건·서비스 판매 경험해 보기" },
          { id: "ent-m8", text: "린 스타트업 방법론 기초 공부하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "ent-m9",  text: "대학 창업 지원 프로그램 탐색하기" },
          { id: "ent-m10", text: "스타트업 인턴십 경험 쌓기" },
          { id: "ent-m11", text: "나만의 MVP(최소 기능 제품) 만들어 보기" },
          { id: "ent-m12", text: "멘토 창업가 만나기" },
        ],
      },
    ],
  },

  "financial-analyst": {
    id: "financial-analyst-roadmap",
    occupationId: "financial-analyst",
    occupationName: "재무 분석가",
    occupationEmoji: "💹",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "fna-m1", text: "용돈 기입장으로 가계부 쓰기" },
          { id: "fna-m2", text: "주식·경제 뉴스 쉬운 콘텐츠로 접하기" },
          { id: "fna-m3", text: "수학 과목 집중 공부하기" },
          { id: "fna-m4", text: "경제·금융 입문 도서 1권 읽기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "fna-m5", text: "재무제표 읽는 법 기초 공부하기" },
          { id: "fna-m6", text: "모의 투자 앱으로 주식 투자 연습하기" },
          { id: "fna-m7", text: "엑셀 기초 함수 마스터하기" },
          { id: "fna-m8", text: "경제·투자 관련 유튜브 채널 정기 시청하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "fna-m9",  text: "경제·경영학과 진학 준비하기" },
          { id: "fna-m10", text: "증권사·금융기관 인턴십 탐색하기" },
          { id: "fna-m11", text: "CFA·펀드투자권유자문인력 자격증 계획 세우기" },
          { id: "fna-m12", text: "멘토 재무 분석가 만나기" },
        ],
      },
    ],
  },

  "hr-specialist": {
    id: "hr-specialist-roadmap",
    occupationId: "hr-specialist",
    occupationName: "HR 전문가",
    occupationEmoji: "👥",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "hrm-m1", text: "리더십 캠프·학급 임원 경험 쌓기" },
          { id: "hrm-m2", text: "심리학·인간관계 관련 책 읽기" },
          { id: "hrm-m3", text: "다양한 사람과 대화하며 소통 능력 키우기" },
          { id: "hrm-m4", text: "조직 심리학 유튜브 채널 구독하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "hrm-m5", text: "팀 프로젝트에서 리더 역할 맡아 보기" },
          { id: "hrm-m6", text: "인사 관리 기초 개념 공부하기" },
          { id: "hrm-m7", text: "자원봉사 단체 운영 경험해 보기" },
          { id: "hrm-m8", text: "HR 관련 케이스 스터디 읽기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "hrm-m9",  text: "경영·심리학과 진학 준비하기" },
          { id: "hrm-m10", text: "기업 HR 부서 인턴십 도전하기" },
          { id: "hrm-m11", text: "공인노무사 자격증 정보 파악하기" },
          { id: "hrm-m12", text: "멘토 HR 전문가 만나기" },
        ],
      },
    ],
  },

  "management-consultant": {
    id: "management-consultant-roadmap",
    occupationId: "management-consultant",
    occupationName: "경영 컨설턴트",
    occupationEmoji: "💼",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "mco-m1", text: "학교 경제·사회 과목 관심 갖기" },
          { id: "mco-m2", text: "비즈니스 케이스 스터디 입문서 읽기" },
          { id: "mco-m3", text: "토론 동아리에서 논증 능력 키우기" },
          { id: "mco-m4", text: "경영 관련 유튜브 채널 구독하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "mco-m5", text: "경영 분석 보고서 1장 작성해 보기" },
          { id: "mco-m6", text: "경영·창업 경진대회 참가하기" },
          { id: "mco-m7", text: "논리적 사고 훈련 도서 읽기" },
          { id: "mco-m8", text: "주변 가게·학교 문제 개선 아이디어 제안하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "mco-m9",  text: "경영·산업공학과 진학 준비하기" },
          { id: "mco-m10", text: "컨설팅 기업 인턴십 도전하기" },
          { id: "mco-m11", text: "실제 기업 문제 분석 케이스 포트폴리오 만들기" },
          { id: "mco-m12", text: "멘토 경영 컨설턴트 만나기" },
        ],
      },
    ],
  },

  // ── 콘텐츠·미디어 추가 로드맵 ──────────────────────────────────────────
  "journalist": {
    id: "journalist-roadmap",
    occupationId: "journalist",
    occupationName: "기자",
    occupationEmoji: "📰",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "jrn-m1", text: "학교 신문부 또는 교지 편집부 활동하기" },
          { id: "jrn-m2", text: "매일 뉴스 읽고 요약하는 습관 들이기" },
          { id: "jrn-m3", text: "사회·역사 과목 관심 갖기" },
          { id: "jrn-m4", text: "관심 주제로 짧은 기사 1편 직접 써보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "jrn-m5", text: "인터뷰 기사 작성법 공부하기" },
          { id: "jrn-m6", text: "블로그·인스타에 칼럼 정기 업로드하기" },
          { id: "jrn-m7", text: "청소년 기자단 활동 참가하기" },
          { id: "jrn-m8", text: "취재 노트 작성 연습하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "jrn-m9",  text: "신문방송학·정치외교학과 진학 준비하기" },
          { id: "jrn-m10", text: "언론사 대학생 인턴십 탐색하기" },
          { id: "jrn-m11", text: "영어 기사 번역·분석 연습하기" },
          { id: "jrn-m12", text: "멘토 기자 만나기" },
        ],
      },
    ],
  },

  "pd-director": {
    id: "pd-director-roadmap",
    occupationId: "pd-director",
    occupationName: "방송 PD",
    occupationEmoji: "📺",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "pdd-m1", text: "학교 방송반 또는 미디어 동아리 활동하기" },
          { id: "pdd-m2", text: "좋아하는 프로그램 구성·연출 분석하기" },
          { id: "pdd-m3", text: "단편 영상 직접 기획·연출해 보기" },
          { id: "pdd-m4", text: "방송 제작 관련 유튜브 채널 구독하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "pdd-m5", text: "영상 기획안·큐시트 작성 연습하기" },
          { id: "pdd-m6", text: "영상 편집 기초 강의 완강하기" },
          { id: "pdd-m7", text: "소규모 팀 영상 프로젝트 리드해 보기" },
          { id: "pdd-m8", text: "방송국 견학 프로그램 참가하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "pdd-m9",  text: "신문방송학·영상학과 진학 준비하기" },
          { id: "pdd-m10", text: "방송사 인턴십 도전하기" },
          { id: "pdd-m11", text: "단편 다큐멘터리 1편 완성하기" },
          { id: "pdd-m12", text: "멘토 PD 만나기" },
        ],
      },
    ],
  },

  "photographer": {
    id: "photographer-roadmap",
    occupationId: "photographer",
    occupationName: "포토그래퍼",
    occupationEmoji: "📷",
    grade: "중1",
    stages: [
      {
        id: "pht-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "pht-m1", text: "스마트폰으로 매일 사진 찍어 SNS에 올리기" },
          { id: "pht-m2", text: "구도·빛 관련 기초 사진 이론 배우기" },
          { id: "pht-m3", text: "좋아하는 사진작가의 작품 분석하기" },
          { id: "pht-m4", text: "사진 관련 유튜브 채널 구독하기" },
        ],
      },
      {
        id: "pht-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "pht-m5", text: "라이트룸·스냅씨드로 사진 보정 시작하기" },
          { id: "pht-m6", text: "포트폴리오 주제 1개 정해 시리즈 촬영하기" },
          { id: "pht-m7", text: "사진 공모전 1회 참가하기" },
          { id: "pht-m8", text: "사진 동아리 활동하기" },
        ],
      },
      {
        id: "pht-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "pht-m9",  text: "사진학과 포트폴리오 준비하기" },
          { id: "pht-m10", text: "스튜디오·잡지사 인턴십 도전하기" },
          { id: "pht-m11", text: "개인 사진 전시회 기획해 보기" },
          { id: "pht-m12", text: "멘토 포토그래퍼 만나기" },
        ],
      },
    ],
  },

  "video-content-editor": {
    id: "video-content-editor-roadmap",
    occupationId: "video-content-editor",
    occupationName: "영상편집자",
    occupationEmoji: "🎬",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "vce-m1", text: "스마트폰으로 직접 찍고 CapCut으로 편집해 보기" },
          { id: "vce-m2", text: "좋아하는 유튜버의 편집 스타일 분석하기" },
          { id: "vce-m3", text: "학교 방송반 또는 미디어 동아리 참여하기" },
          { id: "vce-m4", text: "영상 편집 관련 유튜브 채널 구독하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "vce-m5", text: "다빈치 리졸브·프리미어 기초 강의 완강하기" },
          { id: "vce-m6", text: "단편 영상 1편 처음부터 끝까지 완성하기" },
          { id: "vce-m7", text: "색보정·사운드 편집 기초 배우기" },
          { id: "vce-m8", text: "영상 포트폴리오 3편 완성하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "vce-m9",  text: "미디어커뮤니케이션·영상학과 진학 준비하기" },
          { id: "vce-m10", text: "유튜브 채널 편집 외주 경험해 보기" },
          { id: "vce-m11", text: "영상 제작사 인턴십 도전하기" },
          { id: "vce-m12", text: "멘토 영상편집자 만나기" },
        ],
      },
    ],
  },

  "writer": {
    id: "writer-roadmap",
    occupationId: "writer",
    occupationName: "작가",
    occupationEmoji: "✍️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "wrt-m1", text: "매일 일기·단편 글쓰기 연습하기" },
          { id: "wrt-m2", text: "다양한 장르 책 많이 읽기" },
          { id: "wrt-m3", text: "학교 교지·문예 동아리 활동하기" },
          { id: "wrt-m4", text: "좋아하는 작가의 글쓰기 습관 공부하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "wrt-m5", text: "단편 소설 또는 에세이 1편 완성하기" },
          { id: "wrt-m6", text: "글쓰기 공모전 1회 참가하기" },
          { id: "wrt-m7", text: "블로그에 정기적으로 글 올리기" },
          { id: "wrt-m8", text: "글쓰기 워크숍 또는 강좌 수강하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "wrt-m9",  text: "국어국문학·문예창작학과 진학 준비하기" },
          { id: "wrt-m10", text: "출판사 편집 인턴십 경험 쌓기" },
          { id: "wrt-m11", text: "첫 책 기획안 작성해 보기" },
          { id: "wrt-m12", text: "멘토 작가 만나기" },
        ],
      },
    ],
  },

  // ── 공공·안전 추가 로드맵 ──────────────────────────────────────────
  "diplomat": {
    id: "diplomat-roadmap",
    occupationId: "diplomat",
    occupationName: "외교관",
    occupationEmoji: "🌐",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "dpl-m1", text: "영어 외 제2외국어(중국어·스페인어) 시작하기" },
          { id: "dpl-m2", text: "국제 뉴스·세계사 관심 갖기" },
          { id: "dpl-m3", text: "모의 UN·MUN 프로그램 탐색하기" },
          { id: "dpl-m4", text: "다른 나라 문화 책·영화로 접하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "dpl-m5", text: "MUN 실제 참가하기" },
          { id: "dpl-m6", text: "국제 관계 입문서 1권 읽기" },
          { id: "dpl-m7", text: "영어 토론·스피치 동아리 활동하기" },
          { id: "dpl-m8", text: "외교부 청소년 프로그램 참가하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "dpl-m9",  text: "정치외교학·국제학과 진학 준비하기" },
          { id: "dpl-m10", text: "외교 관련 공기업·NGO 인턴십 탐색하기" },
          { id: "dpl-m11", text: "외무고시 준비 커리큘럼 파악하기" },
          { id: "dpl-m12", text: "멘토 외교관 만나기" },
        ],
      },
    ],
  },

  "firefighter": {
    id: "firefighter-roadmap",
    occupationId: "firefighter",
    occupationName: "소방관",
    occupationEmoji: "🚒",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "fft-m1", text: "체력 훈련 꾸준히 하기 (달리기·수영)" },
          { id: "fft-m2", text: "응급처치 기초 교육 받기" },
          { id: "fft-m3", text: "소방서 견학 프로그램 참여하기" },
          { id: "fft-m4", text: "소방관 관련 다큐멘터리 시청하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "fft-m5", text: "소방안전 관련 자격증 정보 파악하기" },
          { id: "fft-m6", text: "심폐소생술 자격 취득하기" },
          { id: "fft-m7", text: "소방 공무원 시험 과목 파악하기" },
          { id: "fft-m8", text: "체력 검정 기준 파악하고 준비하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "fft-m9",  text: "소방행정·소방안전학과 진학 준비하기" },
          { id: "fft-m10", text: "소방 공무원 시험 준비 시작하기" },
          { id: "fft-m11", text: "소방 봉사단 또는 의용소방대 활동하기" },
          { id: "fft-m12", text: "멘토 소방관 만나기" },
        ],
      },
    ],
  },

  "forensic-scientist": {
    id: "forensic-scientist-roadmap",
    occupationId: "forensic-scientist",
    occupationName: "과학수사관",
    occupationEmoji: "🔬",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "fsc-m1", text: "화학·생물 과목 집중 공부하기" },
          { id: "fsc-m2", text: "CSI·과학 수사 다큐멘터리 시청하기" },
          { id: "fsc-m3", text: "과학 실험 동아리 또는 탐구 대회 참가하기" },
          { id: "fsc-m4", text: "법과 정의에 관심 갖기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "fsc-m5", text: "법과학 기초 개념 공부하기" },
          { id: "fsc-m6", text: "과학 수사 관련 서적 1권 읽기" },
          { id: "fsc-m7", text: "화학·생물 심화 실험 연습하기" },
          { id: "fsc-m8", text: "경찰·법무 관련 기관 견학 참가하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "fsc-m9",  text: "법과학·화학·생물학과 진학 준비하기" },
          { id: "fsc-m10", text: "국립과학수사연구원 탐색하기" },
          { id: "fsc-m11", text: "관련 자격증(화학분석기사 등) 정보 파악하기" },
          { id: "fsc-m12", text: "멘토 과학수사관 만나기" },
        ],
      },
    ],
  },

  "police-officer": {
    id: "police-officer-roadmap",
    occupationId: "police-officer",
    occupationName: "경찰관",
    occupationEmoji: "👮",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "pol-m1", text: "체력 관리 꾸준히 하기 (달리기·수영 등)" },
          { id: "pol-m2", text: "법과 사회 과목 관심 갖기" },
          { id: "pol-m3", text: "사회 이슈·범죄 예방 관련 뉴스 읽기" },
          { id: "pol-m4", text: "경찰 관련 다큐멘터리 시청하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "pol-m5", text: "경찰 공무원 시험 과목 파악하기" },
          { id: "pol-m6", text: "체력 검정 기준 확인하고 맞춰 훈련하기" },
          { id: "pol-m7", text: "형법·형사소송법 기초 입문하기" },
          { id: "pol-m8", text: "경찰 청소년 참여 프로그램 참가하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "pol-m9",  text: "경찰행정학과 또는 경찰대 진학 준비하기" },
          { id: "pol-m10", text: "경찰 공무원 시험 준비 시작하기" },
          { id: "pol-m11", text: "자원봉사 및 지역사회 활동 경험 쌓기" },
          { id: "pol-m12", text: "멘토 경찰관 만나기" },
        ],
      },
    ],
  },

  "public-administrator": {
    id: "public-administrator-roadmap",
    occupationId: "public-administrator",
    occupationName: "행정 공무원",
    occupationEmoji: "🏛️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "pba-m1", text: "사회·법 과목 관심 갖기" },
          { id: "pba-m2", text: "시사·정치 뉴스 꾸준히 읽기" },
          { id: "pba-m3", text: "공공기관 견학·체험 활동 참여하기" },
          { id: "pba-m4", text: "학생회·학급 대표 역할 경험해 보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "pba-m5", text: "공무원 시험 과목·체계 파악하기" },
          { id: "pba-m6", text: "행정학 입문서 1권 읽기" },
          { id: "pba-m7", text: "공공 정책 관련 뉴스 분석하기" },
          { id: "pba-m8", text: "지자체 청소년 참여 위원회 활동하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "pba-m9",  text: "행정학·법학과 진학 준비하기" },
          { id: "pba-m10", text: "공무원 시험 준비 시작하기" },
          { id: "pba-m11", text: "정부 부처 인턴십 탐색하기" },
          { id: "pba-m12", text: "멘토 공무원 만나기" },
        ],
      },
    ],
  },

  // ── 환경·미래산업 추가 로드맵 ──────────────────────────────────────────
  "aerospace-engineer": {
    id: "aerospace-engineer-roadmap",
    occupationId: "aerospace-engineer",
    occupationName: "우주항공 엔지니어",
    occupationEmoji: "🚀",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "aer-m1", text: "NASA·스페이스X 관련 다큐 시청하기" },
          { id: "aer-m2", text: "수학·물리 과목 집중 공부하기" },
          { id: "aer-m3", text: "로켓 키트 조립 또는 드론 비행 체험하기" },
          { id: "aer-m4", text: "우주·항공 관련 유튜브 채널 구독하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "aer-m5", text: "물리·수학 올림피아드 준비하기" },
          { id: "aer-m6", text: "항공우주 관련 도서 1권 읽기" },
          { id: "aer-m7", text: "과학 탐구 대회 참가하기" },
          { id: "aer-m8", text: "항공과학고 또는 과학영재 프로그램 탐색하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "aer-m9",  text: "항공우주공학과 진학 준비하기" },
          { id: "aer-m10", text: "한국항공우주연구원 인턴십 탐색하기" },
          { id: "aer-m11", text: "영어 항공 논문 읽기 연습하기" },
          { id: "aer-m12", text: "멘토 항공우주 엔지니어 만나기" },
        ],
      },
    ],
  },

  "carbon-neutral-specialist": {
    id: "carbon-neutral-specialist-roadmap",
    occupationId: "carbon-neutral-specialist",
    occupationName: "탄소중립전문가",
    occupationEmoji: "🌿",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "cns-m1", text: "기후 변화·탄소 중립 관련 뉴스 꾸준히 읽기" },
          { id: "cns-m2", text: "일상에서 탄소발자국 줄이는 실천 기록해 보기" },
          { id: "cns-m3", text: "환경부 청소년 기후 프로그램 참여하기" },
          { id: "cns-m4", text: "화학·지구과학 과목 관심 갖기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "cns-m5", text: "탄소 배출량 계산 방법 공부하기" },
          { id: "cns-m6", text: "환경 관련 공모전 참가하기" },
          { id: "cns-m7", text: "기후 변화 관련 보고서 1편 작성하기" },
          { id: "cns-m8", text: "환경 단체 봉사활동 참가하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "cns-m9",  text: "환경공학·기후변화학과 진학 준비하기" },
          { id: "cns-m10", text: "환경부·에너지 기관 인턴십 탐색하기" },
          { id: "cns-m11", text: "탄소중립 관련 자격증 정보 파악하기" },
          { id: "cns-m12", text: "멘토 탄소중립 전문가 만나기" },
        ],
      },
    ],
  },

  "environmental-engineer": {
    id: "environmental-engineer-roadmap",
    occupationId: "environmental-engineer",
    occupationName: "환경 엔지니어",
    occupationEmoji: "♻️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "eve-m1", text: "탄소 중립 관련 뉴스·다큐 시청하기" },
          { id: "eve-m2", text: "화학·생물 과목 기초 다지기" },
          { id: "eve-m3", text: "환경 봉사활동 참여하기" },
          { id: "eve-m4", text: "학교 환경 동아리 활동하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "eve-m5", text: "환경공학 기초 개념 공부하기" },
          { id: "eve-m6", text: "환경 오염 해결 아이디어 보고서 작성하기" },
          { id: "eve-m7", text: "과학 탐구 대회 참가하기" },
          { id: "eve-m8", text: "환경 관련 공모전 참가하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "eve-m9",  text: "환경공학과 진학 준비하기" },
          { id: "eve-m10", text: "환경부·환경 기업 인턴십 탐색하기" },
          { id: "eve-m11", text: "환경기사 자격증 준비 계획 세우기" },
          { id: "eve-m12", text: "멘토 환경 엔지니어 만나기" },
        ],
      },
    ],
  },

  "renewable-energy-engineer": {
    id: "renewable-energy-engineer-roadmap",
    occupationId: "renewable-energy-engineer",
    occupationName: "신재생에너지 전문가",
    occupationEmoji: "⚡",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "ree-m1", text: "태양광 패널 원리 유튜브로 공부하기" },
          { id: "ree-m2", text: "물리·화학 과목 기초 다지기" },
          { id: "ree-m3", text: "환경부 청소년 기후 프로그램 참여하기" },
          { id: "ree-m4", text: "신재생에너지 관련 뉴스 꾸준히 읽기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "ree-m5", text: "에너지 관련 과학 탐구 보고서 작성하기" },
          { id: "ree-m6", text: "태양광 미니 키트 조립 실험해 보기" },
          { id: "ree-m7", text: "에너지 공학 입문서 1권 읽기" },
          { id: "ree-m8", text: "환경·에너지 공모전 참가하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "ree-m9",  text: "에너지공학·환경공학과 진학 준비하기" },
          { id: "ree-m10", text: "에너지 기업·공공기관 인턴십 탐색하기" },
          { id: "ree-m11", text: "에너지관리기사 자격증 정보 파악하기" },
          { id: "ree-m12", text: "멘토 에너지 전문가 만나기" },
        ],
      },
    ],
  },

  "smart-farm-specialist": {
    id: "smart-farm-specialist-roadmap",
    occupationId: "smart-farm-specialist",
    occupationName: "스마트팜 전문가",
    occupationEmoji: "🌱",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "sfs-m1", text: "식물 키우기로 농업에 관심 갖기" },
          { id: "sfs-m2", text: "수경재배·스마트팜 관련 영상 시청하기" },
          { id: "sfs-m3", text: "생물·환경 과목 집중하기" },
          { id: "sfs-m4", text: "스마트팜 견학 프로그램 참가하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "sfs-m5", text: "아두이노로 간단한 식물 모니터링 만들어 보기" },
          { id: "sfs-m6", text: "농업·바이오 관련 탐구 보고서 작성하기" },
          { id: "sfs-m7", text: "스마트팜 관련 공모전 참가하기" },
          { id: "sfs-m8", text: "농업 기술 입문서 1권 읽기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "sfs-m9",  text: "농업생명과학·생명공학과 진학 준비하기" },
          { id: "sfs-m10", text: "스마트팜 기업 또는 농촌진흥청 인턴십 탐색하기" },
          { id: "sfs-m11", text: "농업 관련 자격증 정보 파악하기" },
          { id: "sfs-m12", text: "멘토 스마트팜 전문가 만나기" },
        ],
      },
    ],
  },

  "vr-ar-developer": {
    id: "vr-ar-developer-roadmap",
    occupationId: "vr-ar-developer",
    occupationName: "VR·AR 개발자",
    occupationEmoji: "🥽",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "vrd-m1", text: "Unity 3D 무료 강의로 기초 배우기" },
          { id: "vrd-m2", text: "VR 체험 기기 사용해 보기" },
          { id: "vrd-m3", text: "게임·코딩 동아리 활동하기" },
          { id: "vrd-m4", text: "VR·AR 관련 최신 뉴스 탐색하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "vrd-m5", text: "Unity로 간단한 3D 씬 만들어 보기" },
          { id: "vrd-m6", text: "C# 프로그래밍 기초 공부하기" },
          { id: "vrd-m7", text: "블렌더로 3D 모델링 입문하기" },
          { id: "vrd-m8", text: "AR 필터 직접 만들어 인스타에 올리기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "vrd-m9",  text: "컴퓨터공학·디지털미디어학과 진학 준비하기" },
          { id: "vrd-m10", text: "VR·AR 스타트업 인턴십 탐색하기" },
          { id: "vrd-m11", text: "VR 포트폴리오 데모 1개 완성하기" },
          { id: "vrd-m12", text: "멘토 VR·AR 개발자 만나기" },
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
