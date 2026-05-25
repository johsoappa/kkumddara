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

  // ⚠️ key: DB slug = 'carbon-neutrality-specialist' 기준 (이전 key: carbon-neutral-specialist)
  "carbon-neutrality-specialist": {
    id: "carbon-neutrality-specialist-roadmap",
    occupationId: "carbon-neutrality-specialist",
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

  // ⚠️ key: DB slug = 'renewable-energy-specialist' 기준 (이전 key: renewable-energy-engineer)
  "renewable-energy-specialist": {
    id: "renewable-energy-specialist-roadmap",
    occupationId: "renewable-energy-specialist",
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

  // ── 신규 16개 직업 로드맵 ────────────────────────────────

  "ai-service-planner": {
    id: "ai-service-planner-roadmap",
    occupationId: "ai-service-planner",
    occupationName: "AI 서비스 기획자",
    occupationEmoji: "🧩",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "aisp-m1", text: "집에서 불편했던 일을 3가지 적어보기" },
          { id: "aisp-m2", text: "AI가 도와줄 수 있는 일을 가족과 이야기해보기" },
          { id: "aisp-m3", text: "ChatGPT 직접 써보며 불편한 점 메모하기" },
          { id: "aisp-m4", text: "IT 서비스 트렌드 뉴스 1개 읽기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "aisp-m5", text: "불편한 일 하나를 골라 해결 아이디어를 그림으로 그려보기" },
          { id: "aisp-m6", text: "내가 만든 AI 서비스 이름과 기능 3가지 정리하기" },
          { id: "aisp-m7", text: "좋아하는 앱의 기능 분석해 개선 아이디어 적기" },
          { id: "aisp-m8", text: "기획서 쓰는 법 유튜브로 입문하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "aisp-m9",  text: "가족에게 AI 서비스 아이디어를 발표해보기" },
          { id: "aisp-m10", text: "사용자가 걱정할 점과 좋은 점을 각각 2개씩 적기" },
          { id: "aisp-m11", text: "경쟁 서비스 2개 비교 분석해보기" },
          { id: "aisp-m12", text: "IT 기획 멘토 또는 관련 직업인 인터뷰 내용 찾아보기" },
        ],
      },
    ],
  },

  "robotics-engineer": {
    id: "robotics-engineer-roadmap",
    occupationId: "robotics-engineer",
    occupationName: "로봇공학자",
    occupationEmoji: "🦾",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "rbe-m1", text: "생활 속 로봇이나 자동 기계를 3가지 찾아보기" },
          { id: "rbe-m2", text: "로봇이 사람을 도와주는 장면 영상으로 찾아보기" },
          { id: "rbe-m3", text: "로봇 관련 유튜브 채널 구독하기" },
          { id: "rbe-m4", text: "물리·수학 과목 관심 갖기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "rbe-m5", text: "블록이나 종이로 나만의 로봇 모형 만들어보기" },
          { id: "rbe-m6", text: "로봇이 움직이는 순서를 1단계부터 5단계까지 적기" },
          { id: "rbe-m7", text: "아두이노 또는 레고 마인드스톰 입문 자료 탐색하기" },
          { id: "rbe-m8", text: "코딩 기초 강의 1개 완수하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "rbe-m9",  text: "내가 만든 로봇이 해결할 문제를 정해보기" },
          { id: "rbe-m10", text: "로봇을 더 안전하게 만들 방법을 가족과 이야기하기" },
          { id: "rbe-m11", text: "로봇 경진대회 참가 자격 조건 조사하기" },
          { id: "rbe-m12", text: "로봇공학자 인터뷰 영상 시청 후 감상 적기" },
        ],
      },
    ],
  },

  "clinical-laboratory-technologist": {
    id: "clinical-laboratory-technologist-roadmap",
    occupationId: "clinical-laboratory-technologist",
    occupationName: "임상병리사",
    occupationEmoji: "🔬",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "clt-m1", text: "병원에서 검사실이 하는 일을 찾아보기" },
          { id: "clt-m2", text: "혈액·소변 검사처럼 몸 상태를 확인하는 방법 알아보기" },
          { id: "clt-m3", text: "과학 실험 동아리 참여하기" },
          { id: "clt-m4", text: "생물·화학 과목 흥미 키우기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "clt-m5", text: "관찰 기록표 만들어 하루 동안 수분 섭취량 기록해보기" },
          { id: "clt-m6", text: "정확한 기록이 왜 중요한지 부모와 이야기하기" },
          { id: "clt-m7", text: "현미경으로 주변 물질 관찰해 보기" },
          { id: "clt-m8", text: "의료 검사 관련 직업 3가지 조사하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "clt-m9",  text: "검사 결과를 잘못 기록하면 어떤 문제가 생길지 생각해보기" },
          { id: "clt-m10", text: "꼼꼼함이 필요한 직업 3가지 비교해보기" },
          { id: "clt-m11", text: "병원 견학 또는 의료 직업 인터뷰 내용 찾아보기" },
          { id: "clt-m12", text: "임상병리학과 진학 경로 조사하기" },
        ],
      },
    ],
  },

  "life-science-researcher": {
    id: "life-science-researcher-roadmap",
    occupationId: "life-science-researcher",
    occupationName: "생명과학 연구원",
    occupationEmoji: "🧬",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "lsr-m1", text: "식물이나 곤충을 하나 정해 특징을 관찰해보기" },
          { id: "lsr-m2", text: "생명과학자가 연구하는 주제를 3가지 찾아보기" },
          { id: "lsr-m3", text: "생명과학 관련 다큐멘터리 시청하기" },
          { id: "lsr-m4", text: "생물 과목 흥미 갖기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "lsr-m5", text: "식물이 자라는 조건을 물·햇빛·흙으로 나눠 기록하기" },
          { id: "lsr-m6", text: "관찰한 내용을 날짜별로 표로 정리하기" },
          { id: "lsr-m7", text: "과학 실험 키트로 간단한 실험 해보기" },
          { id: "lsr-m8", text: "생물 실험 동아리 또는 과학 캠프 참여하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "lsr-m9",  text: "작은 실험 계획서 직접 만들어보기" },
          { id: "lsr-m10", text: "실험 결과가 예상과 다르면 왜 그런지 생각해보기" },
          { id: "lsr-m11", text: "생명과학 논문 요약본 1개 찾아 읽기" },
          { id: "lsr-m12", text: "생명과학 연구원 인터뷰 영상 시청하기" },
        ],
      },
    ],
  },

  "physical-therapist": {
    id: "physical-therapist-roadmap",
    occupationId: "physical-therapist",
    occupationName: "물리치료사",
    occupationEmoji: "🏃",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "pth-m1", text: "인체 근육과 뼈 구조를 교과서로 살펴보기" },
          { id: "pth-m2", text: "운동 후 몸이 어떻게 변하는지 기록해보기" },
          { id: "pth-m3", text: "복지관·노인센터 봉사활동 탐색하기" },
          { id: "pth-m4", text: "생물·체육 과목 관심 갖기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "pth-m5", text: "스트레칭 루틴을 만들어 1주일 실천하기" },
          { id: "pth-m6", text: "근육별 역할을 3가지 조사해 메모하기" },
          { id: "pth-m7", text: "부상 예방 운동 방법 찾아 부모에게 가르쳐주기" },
          { id: "pth-m8", text: "병원 물리치료실 방문 경험 또는 영상 시청하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "pth-m9",  text: "물리치료사의 하루 일과를 상상해 시간표 만들기" },
          { id: "pth-m10", text: "물리치료사 인터뷰 내용 찾아 핵심 3가지 정리하기" },
          { id: "pth-m11", text: "재활 운동이 일상에 미치는 영향 발표자료 만들기" },
          { id: "pth-m12", text: "물리치료학과 입학 조건 조사하기" },
        ],
      },
    ],
  },

  "nutritionist": {
    id: "nutritionist-roadmap",
    occupationId: "nutritionist",
    occupationName: "영양사",
    occupationEmoji: "🥗",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "nut-m1", text: "오늘 먹은 음식의 영양소 기록해보기" },
          { id: "nut-m2", text: "식품 성분표 읽는 방법 배우기" },
          { id: "nut-m3", text: "생물·가정 과목 관심 갖기" },
          { id: "nut-m4", text: "영양사가 하는 일 검색하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "nut-m5", text: "가족을 위한 하루 식단 직접 짜보기" },
          { id: "nut-m6", text: "5대 영양소가 무엇인지 조사해 정리하기" },
          { id: "nut-m7", text: "좋아하는 음식의 칼로리 비교해보기" },
          { id: "nut-m8", text: "요리·식품 관련 동아리 참여하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "nut-m9",  text: "학교 급식 메뉴를 영양 기준으로 평가해보기" },
          { id: "nut-m10", text: "영양 불균형이 생기면 어떤 문제가 생길지 정리하기" },
          { id: "nut-m11", text: "영양사 인터뷰 영상 시청 후 감상 적기" },
          { id: "nut-m12", text: "식품영양학과 진학 경로 조사하기" },
        ],
      },
    ],
  },

  "spatial-designer": {
    id: "spatial-designer-roadmap",
    occupationId: "spatial-designer",
    occupationName: "공간 디자이너",
    occupationEmoji: "🏠",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "spd-m1", text: "내 방에서 가장 편한 공간과 불편한 공간 찾아보기" },
          { id: "spd-m2", text: "카페·도서관·교실 사진을 보고 공간 차이 비교하기" },
          { id: "spd-m3", text: "인테리어·건축 유튜브 채널 구독하기" },
          { id: "spd-m4", text: "미술·디자인 동아리 활동하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "spd-m5", text: "내 책상 배치를 더 편하게 바꿔보기" },
          { id: "spd-m6", text: "바꾼 이유를 그림이나 글로 설명하기" },
          { id: "spd-m7", text: "좋아하는 카페 공간을 종이에 스케치하기" },
          { id: "spd-m8", text: "Canva나 종이로 방 평면도 그려보기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "spd-m9",  text: "가족이 쉬기 좋은 공간을 종이에 설계하기" },
          { id: "spd-m10", text: "공간을 사용하는 사람의 기분을 생각해 디자인 이유 말하기" },
          { id: "spd-m11", text: "공간 디자이너 포트폴리오 사례 찾아보기" },
          { id: "spd-m12", text: "실내건축학과 진학 경로 조사하기" },
        ],
      },
    ],
  },

  "interior-designer": {
    id: "interior-designer-roadmap",
    occupationId: "interior-designer",
    occupationName: "인테리어 디자이너",
    occupationEmoji: "🛋️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "ind-m1", text: "집 안 각 공간의 색과 가구 스타일 관찰하기" },
          { id: "ind-m2", text: "핀터레스트나 인테리어 잡지로 영감 수집하기" },
          { id: "ind-m3", text: "종이로 방 평면도 그려보기" },
          { id: "ind-m4", text: "미술 과목에서 공간 감각 키우기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "ind-m5", text: "가구 재배치 전후 사진 찍어 비교하기" },
          { id: "ind-m6", text: "색상 조합이 주는 느낌 3가지 비교하기" },
          { id: "ind-m7", text: "실내 공간 모형을 종이·상자로 만들어보기" },
          { id: "ind-m8", text: "인테리어 디자이너의 하루 찾아보기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "ind-m9",  text: "가족의 취향에 맞는 거실 디자인 제안서 만들기" },
          { id: "ind-m10", text: "소재·조명·색이 공간에 미치는 영향 정리하기" },
          { id: "ind-m11", text: "인테리어 디자이너 포트폴리오 사례 분석하기" },
          { id: "ind-m12", text: "실내디자인학과 진학 경로 조사하기" },
        ],
      },
    ],
  },

  "counselor": {
    id: "counselor-roadmap",
    occupationId: "counselor",
    occupationName: "상담사",
    occupationEmoji: "💬",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "cou-m1", text: "친구가 속상할 때 어떤 말이 도움되는지 생각해보기" },
          { id: "cou-m2", text: "잘 들어주는 사람의 특징을 3가지 적기" },
          { id: "cou-m3", text: "심리학 입문 도서 1권 읽기" },
          { id: "cou-m4", text: "학교 상담 프로그램 경험해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "cou-m5", text: "가족의 이야기를 3분 동안 끊지 않고 들어보기" },
          { id: "cou-m6", text: "들은 내용을 '네가 이렇게 느꼈구나'라고 말해보기" },
          { id: "cou-m7", text: "감정을 표현하는 단어 10개 수집하기" },
          { id: "cou-m8", text: "공감과 조언의 차이 부모와 이야기하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "cou-m9",  text: "걱정 있는 친구에게 해줄 질문 3개 만들어보기" },
          { id: "cou-m10", text: "위로가 되는 말과 부담이 되는 말을 비교하기" },
          { id: "cou-m11", text: "상담사 인터뷰 영상 시청 후 감상 적기" },
          { id: "cou-m12", text: "심리학과·상담학과 진학 경로 조사하기" },
        ],
      },
    ],
  },

  "special-education-teacher": {
    id: "special-education-teacher-roadmap",
    occupationId: "special-education-teacher",
    occupationName: "특수교사",
    occupationEmoji: "🌈",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "set-m1", text: "사람마다 배우는 속도와 방법이 다를 수 있다는 점 이야기하기" },
          { id: "set-m2", text: "도움을 받아야 더 잘할 수 있는 상황 찾아보기" },
          { id: "set-m3", text: "장애 인식 개선 교육 참여하기" },
          { id: "set-m4", text: "복지관 봉사활동 탐색하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "set-m5", text: "어려운 설명을 더 쉽게 바꿔 말해보기" },
          { id: "set-m6", text: "친구를 도와줄 때 필요한 태도 3가지 적기" },
          { id: "set-m7", text: "모두가 함께할 수 있는 놀이 규칙 만들어보기" },
          { id: "set-m8", text: "특수교사 하루 일과 찾아보기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "set-m9",  text: "도움이 필요한 친구에게 어떻게 물어보면 좋을지 연습하기" },
          { id: "set-m10", text: "특수교사 인터뷰 영상 시청 후 감상 적기" },
          { id: "set-m11", text: "특수교육학과 진학 경로 조사하기" },
          { id: "set-m12", text: "장애 이해 관련 도서 1권 읽기" },
        ],
      },
    ],
  },

  "accountant": {
    id: "accountant-roadmap",
    occupationId: "accountant",
    occupationName: "회계사",
    occupationEmoji: "🧾",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "acc-m1", text: "용돈이나 간식비를 기록하는 이유 이야기하기" },
          { id: "acc-m2", text: "돈을 관리하는 직업이 왜 필요한지 알아보기" },
          { id: "acc-m3", text: "수학·경제 과목 흥미 키우기" },
          { id: "acc-m4", text: "기업 재무제표가 무엇인지 검색해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "acc-m5", text: "일주일 용돈 사용 기록표 만들어보기" },
          { id: "acc-m6", text: "필요한 소비와 갖고 싶은 소비 나눠보기" },
          { id: "acc-m7", text: "엑셀로 간단한 수입·지출 표 만들어보기" },
          { id: "acc-m8", text: "사칙연산 속도 높이는 연습하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "acc-m9",  text: "가족 행사 예산표를 간단히 만들어보기" },
          { id: "acc-m10", text: "돈을 아끼는 방법과 잘 쓰는 방법 각각 적기" },
          { id: "acc-m11", text: "회계사 인터뷰 영상 시청 후 감상 적기" },
          { id: "acc-m12", text: "공인회계사 자격 취득 경로 조사하기" },
        ],
      },
    ],
  },

  "animation-director": {
    id: "animation-director-roadmap",
    occupationId: "animation-director",
    occupationName: "애니메이션 감독",
    occupationEmoji: "🎬",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "amd-m1", text: "좋아하는 애니메이션 장면 하나를 골라 느낌 말해보기" },
          { id: "amd-m2", text: "애니메이션이 만들어지는 과정 간단히 찾아보기" },
          { id: "amd-m3", text: "그림·만화 동아리 활동하기" },
          { id: "amd-m4", text: "스톱모션 영상 직접 찍어보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "amd-m5", text: "4칸 만화로 짧은 이야기 만들어보기" },
          { id: "amd-m6", text: "등장인물의 표정과 움직임을 다르게 그려보기" },
          { id: "amd-m7", text: "디지털 드로잉 앱으로 캐릭터 만들어보기" },
          { id: "amd-m8", text: "애니메이션 제작 단계 5가지 조사하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "amd-m9",  text: "내가 만든 이야기를 장면 순서대로 가족에게 설명하기" },
          { id: "amd-m10", text: "배경음악이나 효과음 넣을 위치 정해보기" },
          { id: "amd-m11", text: "애니메이션 감독 인터뷰 영상 시청하기" },
          { id: "amd-m12", text: "만화·애니메이션학과 진학 경로 조사하기" },
        ],
      },
    ],
  },

  "podcast-producer": {
    id: "podcast-producer-roadmap",
    occupationId: "podcast-producer",
    occupationName: "팟캐스트 기획자",
    occupationEmoji: "🎙️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "pod-m1", text: "라디오나 팟캐스트처럼 목소리로 전달하는 콘텐츠 들어보기" },
          { id: "pod-m2", text: "사람들이 듣고 싶어 할 주제 3가지 적어보기" },
          { id: "pod-m3", text: "학교 방송부 활동 탐색하기" },
          { id: "pod-m4", text: "미디어 트렌드 뉴스 1개 읽기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "pod-m5", text: "1분짜리 이야기 주제를 정해 말하기 연습하기" },
          { id: "pod-m6", text: "질문 3개와 답변 순서를 적어보기" },
          { id: "pod-m7", text: "목소리 녹음해 자신의 말투 분석하기" },
          { id: "pod-m8", text: "진행자가 갖춰야 할 능력 3가지 정리하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "pod-m9",  text: "가족을 인터뷰해 짧은 대화 녹음해보기" },
          { id: "pod-m10", text: "듣는 사람이 더 재미있게 느끼도록 제목 정해보기" },
          { id: "pod-m11", text: "팟캐스트 기획자 인터뷰 내용 찾아보기" },
          { id: "pod-m12", text: "미디어커뮤니케이션학과 진학 경로 조사하기" },
        ],
      },
    ],
  },

  "webtoon-artist": {
    id: "webtoon-artist-roadmap",
    occupationId: "webtoon-artist",
    occupationName: "웹툰 작가",
    occupationEmoji: "✏️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "wta-m1", text: "좋아하는 웹툰 캐릭터 따라 그려보기" },
          { id: "wta-m2", text: "8컷 짧은 이야기 만화 그려보기" },
          { id: "wta-m3", text: "만화 동아리 또는 그림 수업 참여하기" },
          { id: "wta-m4", text: "웹툰 연재 플랫폼(네이버·카카오) 탐색하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "wta-m5", text: "디지털 드로잉 앱(메디방·클립스튜디오) 무료 체험하기" },
          { id: "wta-m6", text: "나만의 캐릭터 3명 설정하고 외모·성격 기록하기" },
          { id: "wta-m7", text: "10컷 단편 웹툰 1화 완성하기" },
          { id: "wta-m8", text: "구도·컷 나누기 기본 원칙 조사하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "wta-m9",  text: "주변 사람에게 내 웹툰 보여주고 피드백 받기" },
          { id: "wta-m10", text: "도전만화 플랫폼에 1화 업로드해보기" },
          { id: "wta-m11", text: "웹툰 작가 인터뷰 영상 시청하기" },
          { id: "wta-m12", text: "만화학과 진학 경로 조사하기" },
        ],
      },
    ],
  },

  "actor": {
    id: "actor-roadmap",
    occupationId: "actor",
    occupationName: "배우",
    occupationEmoji: "🎭",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "act-m1", text: "학교 연극·발표 수업 적극 참여하기" },
          { id: "act-m2", text: "좋아하는 영화·드라마 대사 따라해 보기" },
          { id: "act-m3", text: "연극 공연 직접 관람하기" },
          { id: "act-m4", text: "독서로 다양한 인물 상상력 키우기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "act-m5", text: "같은 대사를 기쁨·슬픔·화남으로 각각 연기해보기" },
          { id: "act-m6", text: "1분 짧은 1인극 만들어 가족 앞에서 발표하기" },
          { id: "act-m7", text: "표정과 몸짓이 달라지면 느낌이 어떻게 바뀌는지 기록하기" },
          { id: "act-m8", text: "연극부 또는 뮤지컬 동아리 활동하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "act-m9",  text: "단막극 대본을 찾아 전체 외워 연기해보기" },
          { id: "act-m10", text: "배우 인터뷰 영상 시청 후 감상 적기" },
          { id: "act-m11", text: "연극영화학과 진학 경로 조사하기" },
          { id: "act-m12", text: "오디션 준비 방법 찾아보기" },
        ],
      },
    ],
  },

  "pilot": {
    id: "pilot-roadmap",
    occupationId: "pilot",
    occupationName: "항공기 조종사",
    occupationEmoji: "✈️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "지금 당장 시작하기",
        missions: [
          { id: "pil-m1", text: "비행 시뮬레이터 게임으로 입문하기" },
          { id: "pil-m2", text: "항공우주 관련 전시관 방문 또는 영상 탐색하기" },
          { id: "pil-m3", text: "영어 회화 꾸준히 연습하기" },
          { id: "pil-m4", text: "수학·물리 과목 기초 탄탄히 하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "pil-m5", text: "비행 원리(양력·추력·항력) 조사해 정리하기" },
          { id: "pil-m6", text: "비행 시뮬레이터로 이착륙 연습하기" },
          { id: "pil-m7", text: "조종사가 사용하는 영어 교신 문구 5개 외우기" },
          { id: "pil-m8", text: "항공사 조종사 채용 조건 조사하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "pil-m9",  text: "조종사의 하루 일과를 상상해 시간표 만들기" },
          { id: "pil-m10", text: "항공기 조종사 인터뷰 영상 시청 후 감상 적기" },
          { id: "pil-m11", text: "항공조종학과 진학 경로 조사하기" },
          { id: "pil-m12", text: "체력·시력 관리 방법 계획 세우기" },
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
