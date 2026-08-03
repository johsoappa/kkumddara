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

  "creator": {
    id: "creator-roadmap",
    occupationId: "creator",
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

  "chef": {
    id: "chef-roadmap",
    occupationId: "chef",
    occupationName: "요리사",
    occupationEmoji: "👨‍🍳",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "chf-m5", text: "보호자가 칼·불 다루는 모습 관찰 후 조절법 기초 배우기" },
          { id: "chf-m6", text: "한 달 동안 매주 다른 요리 1가지씩 도전하며 요리 노트 쓰기" },
          { id: "chf-m7", text: "요리 유튜브 강의로 기본 조리법(볶기·끓이기·굽기) 공부하기" },
          { id: "chf-m8", text: "가족·친구에게 내가 만든 요리 대접하고 반응 기록하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "chf-m9",  text: "식품조리·외식조리학과 및 조리기능사 자격증 알아보기" },
          { id: "chf-m10", text: "청소년 요리 대회나 쿠킹 클래스 참가해보기" },
          { id: "chf-m11", text: "요식업계 종사자 인터뷰하거나 레스토랑 견학해보기" },
          { id: "chf-m12", text: "나만의 시그니처 메뉴 완성해 포트폴리오 만들기" },
        ],
      },
    ],
  },

  "zookeeper": {
    id: "zookeeper-roadmap",
    occupationId: "zookeeper",
    occupationName: "사육사",
    occupationEmoji: "🐾",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "zoo-m5", text: "동물원·수족관 봉사나 체험 프로그램 참여해보기" },
          { id: "zoo-m6", text: "한 달 동안 관심 동물 1종을 정기적으로 관찰하며 관찰 일지 쓰기" },
          { id: "zoo-m7", text: "동물 영양·행동학 관련 책이나 다큐멘터리로 기초 지식 쌓기" },
          { id: "zoo-m8", text: "반려동물이나 동네 동물을 안전하게 돌보는 방법 배우고 실천해보기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "zoo-m9",  text: "동물자원학과·축산학과 등 관련 학과와 필요한 자격증 알아보기" },
          { id: "zoo-m10", text: "동물원·수족관 사육사 인터뷰하거나 직업 체험 프로그램 참가해보기" },
          { id: "zoo-m11", text: "동물 보호·복지 관련 캠페인이나 활동에 참여해보기" },
          { id: "zoo-m12", text: "내가 돌보고 싶은 동물 종의 서식 환경을 조사해 미니 사육 계획 만들기" },
        ],
      },
    ],
  },

  "hair-designer": {
    id: "hair-designer-roadmap",
    occupationId: "hair-designer",
    occupationName: "헤어디자이너",
    occupationEmoji: "✂️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "hrd-m5", text: "보호자와 함께 인형 머리나 마네킹으로 간단한 스타일링 연습해보기" },
          { id: "hrd-m6", text: "헤어 트렌드 잡지·SNS 채널 팔로우하며 매달 스타일 변화 기록하기" },
          { id: "hrd-m7", text: "미용 기초 이론(모발 구조, 커트·컬러 기본 원리) 강의로 공부하기" },
          { id: "hrd-m8", text: "가족·친구 머리를 빗질·정돈해주고 어울리는 이유 설명해보기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "hrd-m9",  text: "미용학과·뷰티디자인학과 및 미용사 국가자격증 취득 절차 알아보기" },
          { id: "hrd-m10", text: "미용 학원 체험 수업이나 청소년 대상 뷰티 클래스 참가해보기" },
          { id: "hrd-m11", text: "실제 헤어디자이너를 인터뷰하거나 미용실 견학해보기" },
          { id: "hrd-m12", text: "나만의 헤어스타일 룩북(사진+설명) 만들어보기" },
        ],
      },
    ],
  },

  "singer": {
    id: "singer-roadmap",
    occupationId: "singer",
    occupationName: "가수",
    occupationEmoji: "🎤",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [],
      },
      {
        id: "stage-next",
        status: "next",
        title: "실력 키우기",
        missions: [
          { id: "sgr-m5", text: "발성·호흡 기초 연습법을 찾아 매일 10분씩 연습해보기" },
          { id: "sgr-m6", text: "한 달 동안 매주 다른 노래 1곡씩 연습하며 녹음 기록 남기기" },
          { id: "sgr-m7", text: "보컬 트레이닝 유튜브 강의로 기본 발성·음정 훈련하기" },
          { id: "sgr-m8", text: "가족·친구 앞에서 노래 불러보고 피드백 받아 기록하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "전문가 되기",
        missions: [
          { id: "sgr-m9",  text: "실용음악과·보컬 전공 및 오디션 준비 과정 알아보기" },
          { id: "sgr-m10", text: "학교 축제나 지역 청소년 가요제 등 무대에 서볼 기회 찾아보기" },
          { id: "sgr-m11", text: "실제 가수나 보컬 트레이너를 인터뷰하거나 공연 관람해보기" },
          { id: "sgr-m12", text: "나만의 커버곡 영상이나 자작곡 데모 1개 완성해보기" },
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


  // ── 스포츠 생태계 P1 직접 로드맵 ─────────────────────────────────────
  "sports-data-analyst": {
    id: "sports-data-analyst-roadmap",
    occupationId: "sports-data-analyst",
    occupationName: "스포츠 데이터 분석가",
    occupationEmoji: "📊",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "직업 이해하기",
        missions: [
          { id: "sda-m1", text: "스포츠 데이터 분석가가 하는 일을 인터넷·책에서 조사해 정리하기" },
          { id: "sda-m2", text: "좋아하는 경기 하나를 보며 점수·슛·패스 횟수 메모해보기" },
          { id: "sda-m3", text: "야구·축구·농구 중 하나를 골라 간단한 기록표 양식 만들기" },
          { id: "sda-m4", text: "스포츠 데이터 분석 관련 유튜브 영상 1편 시청하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "관찰하고 기록하기",
        missions: [
          { id: "sda-m5", text: "관심 경기를 2회 이상 관찰하며 기록표 채우기" },
          { id: "sda-m6", text: "기록한 수치를 보고 잘된 점·보완점 3가지 정리하기" },
          { id: "sda-m7", text: "같은 선수나 팀의 두 경기 기록을 비교해 메모하기" },
          { id: "sda-m8", text: "데이터 분석가가 실제로 사용하는 도구(엑셀·Python 등) 종류 조사하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "확장하고 연결하기",
        missions: [
          { id: "sda-m9",  text: "스포츠 콘텐츠 기획자·스포츠 테크 개발자 직업과 어떻게 협력하는지 알아보기" },
          { id: "sda-m10", text: "엑셀이나 표 프로그램으로 기록한 데이터를 간단한 그래프로 만들어보기" },
          { id: "sda-m11", text: "스포츠 데이터 분석가 진학 경로(관련 학과·자격증) 조사하기" },
          { id: "sda-m12", text: "가족이나 선생님께 내가 기록한 데이터를 보여주며 설명해보기" },
        ],
      },
    ],
  },

  "youth-sports-coach": {
    id: "youth-sports-coach-roadmap",
    occupationId: "youth-sports-coach",
    occupationName: "유소년 스포츠 지도자",
    occupationEmoji: "🏃",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "직업 이해하기",
        missions: [
          { id: "ysc-m1", text: "유소년 스포츠 지도자가 하는 일을 조사해 정리하기" },
          { id: "ysc-m2", text: "좋아하는 운동 수업에서 지도자가 어떤 말을 하는지 관찰하기" },
          { id: "ysc-m3", text: "훌륭한 지도자가 갖춰야 할 태도·능력 5가지 메모하기" },
          { id: "ysc-m4", text: "유소년 스포츠 지도자 관련 영상이나 기사 1편 읽기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "배우고 실천하기",
        missions: [
          { id: "ysc-m5", text: "가족이나 친구에게 좋아하는 운동 규칙을 친절하게 설명해보기" },
          { id: "ysc-m6", text: "안전하고 즐거운 운동 수업을 위한 약속 5가지 직접 만들기" },
          { id: "ysc-m7", text: "어린이에게 운동을 가르칠 때 사용하기 좋은 긍정적 표현 10개 모아보기" },
          { id: "ysc-m8", text: "생활체육지도사 자격증이 무엇인지 조사하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "확장하고 연결하기",
        missions: [
          { id: "ysc-m9",  text: "방과후 교사·운동처방사·스포츠 안전관리자 직업과 어떻게 연결되는지 알아보기" },
          { id: "ysc-m10", text: "내가 가르치고 싶은 운동 종목을 정하고 이유 3가지 적기" },
          { id: "ysc-m11", text: "체육교육학·스포츠과학 관련 학과 진학 경로 조사하기" },
          { id: "ysc-m12", text: "가족이나 선생님께 유소년 스포츠 지도자의 하루를 설명해보기" },
        ],
      },
    ],
  },

  "sports-content-planner": {
    id: "sports-content-planner-roadmap",
    occupationId: "sports-content-planner",
    occupationName: "스포츠 콘텐츠 기획자",
    occupationEmoji: "🎬",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "직업 이해하기",
        missions: [
          { id: "scp-m1", text: "스포츠 콘텐츠 기획자가 하는 일을 조사해 정리하기" },
          { id: "scp-m2", text: "좋아하는 스포츠 콘텐츠(영상·기사·카드뉴스)의 제목·구성·장점 분석하기" },
          { id: "scp-m3", text: "어떤 스포츠 이야기를 콘텐츠로 만들고 싶은지 주제 3가지 메모하기" },
          { id: "scp-m4", text: "스포츠 방송·유튜브 채널이 콘텐츠를 만드는 과정 알아보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "기획하고 표현하기",
        missions: [
          { id: "scp-m5", text: "좋아하는 운동을 소개하는 1분 콘텐츠 기획안(주제·구성·핵심 장면) 작성하기" },
          { id: "scp-m6", text: "썸네일 문구 3가지와 설명 순서를 메모로 정리하기" },
          { id: "scp-m7", text: "기획안을 가족이나 친구에게 설명하고 피드백 받아보기" },
          { id: "scp-m8", text: "콘텐츠 제작 시 저작권·초상권을 지키는 방법 조사하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "확장하고 연결하기",
        missions: [
          { id: "scp-m9",  text: "스포츠 마케터·스포츠 데이터 분석가와 어떻게 협력하는지 알아보기" },
          { id: "scp-m10", text: "미디어·영상·커뮤니케이션 관련 학과 진학 경로 조사하기" },
          { id: "scp-m11", text: "실제 촬영이 필요하다면 가족이나 선생님과 상의하고 안전하게 계획 세우기" },
          { id: "scp-m12", text: "내가 만든 기획안을 포트폴리오 형식으로 정리해 보관하기" },
        ],
      },
    ],
  },

  "exercise-prescription-specialist": {
    id: "exercise-prescription-specialist-roadmap",
    occupationId: "exercise-prescription-specialist",
    occupationName: "운동처방사",
    occupationEmoji: "💪",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "직업 이해하기",
        missions: [
          { id: "eps-m1", text: "운동처방사가 하는 일을 조사해 정리하기" },
          { id: "eps-m2", text: "운동처방사는 어떤 전문 지식을 공부하는지 알아보기" },
          { id: "eps-m3", text: "건강한 운동 습관에 대한 책이나 기사 1편 읽기" },
          { id: "eps-m4", text: "몸이 건강할 때와 피곤할 때 운동 느낌이 어떻게 다른지 일기로 기록하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "관찰하고 계획하기",
        missions: [
          { id: "eps-m5", text: "무리하지 않는 스트레칭·걷기 1주일 계획표 만들기" },
          { id: "eps-m6", text: "운동 전후에 몸이 어떻게 느껴지는지 안전하게 기록하기" },
          { id: "eps-m7", text: "운동할 때 지켜야 할 안전 수칙 5가지 정리하기" },
          { id: "eps-m8", text: "운동처방사 국가자격증 응시 조건 조사하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "확장하고 연결하기",
        missions: [
          { id: "eps-m9",  text: "스포츠 안전관리자·유소년 스포츠 지도자 직업과 어떻게 연결되는지 알아보기" },
          { id: "eps-m10", text: "체육학·스포츠과학·운동재활학 관련 학과 진학 경로 조사하기" },
          { id: "eps-m11", text: "가족이나 선생님께 운동처방사의 하루를 설명해보기" },
          { id: "eps-m12", text: "건강한 운동 습관에 대해 내가 배운 내용을 간단히 정리해 보관하기" },
        ],
      },
    ],
  },

  "sports-safety-manager": {
    id: "sports-safety-manager-roadmap",
    occupationId: "sports-safety-manager",
    occupationName: "스포츠 안전관리자",
    occupationEmoji: "🦺",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "직업 이해하기",
        missions: [
          { id: "ssm-m1", text: "스포츠 안전관리자가 하는 일을 조사해 정리하기" },
          { id: "ssm-m2", text: "경기장·학교 체육관에서 안전을 담당하는 사람이 어떤 역할을 하는지 알아보기" },
          { id: "ssm-m3", text: "스포츠 안전사고 사례를 찾아보고 무엇이 부족했는지 메모하기" },
          { id: "ssm-m4", text: "스포츠 안전 관련 기사나 영상 1편 읽거나 시청하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "관찰하고 실천하기",
        missions: [
          { id: "ssm-m5", text: "운동장·체육관에서 위험할 수 있는 요소를 관찰해 목록으로 정리하기" },
          { id: "ssm-m6", text: "안전한 체육 활동을 위한 체크리스트(준비운동·장비·규칙) 직접 만들기" },
          { id: "ssm-m7", text: "위험 요소를 발견하면 직접 해결하지 말고 선생님이나 보호자에게 알리는 연습하기" },
          { id: "ssm-m8", text: "스포츠 안전관리사 자격증이 무엇인지 조사하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "확장하고 연결하기",
        missions: [
          { id: "ssm-m9",  text: "수상안전요원·운동처방사·유소년 스포츠 지도자와 어떻게 협력하는지 알아보기" },
          { id: "ssm-m10", text: "스포츠·체육 행정·안전관리 관련 학과 진학 경로 조사하기" },
          { id: "ssm-m11", text: "가족이나 선생님께 스포츠 안전관리자의 하루를 설명해보기" },
          { id: "ssm-m12", text: "내가 만든 안전 체크리스트를 포트폴리오 형식으로 정리해 보관하기" },
        ],
      },
    ],
  },

  // ── 역사학자 ─────────────────────────────────────────
  "historian": {
    id: "historian-roadmap",
    occupationId: "historian",
    occupationName: "역사학자",
    occupationEmoji: "📜",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "hist-m1", text: "관심 있는 역사 사건 1가지를 골라 10분 조사해보기" },
          { id: "hist-m2", text: "역사 다큐멘터리 1편 보고 새롭게 알게 된 점 적기" },
          { id: "hist-m3", text: "역사학자가 하는 일을 3가지 찾아보기" },
          { id: "hist-m4", text: "가족에게 좋아하는 역사 이야기 들려주기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "hist-m5", text: "역사 관련 책이나 잡지 1권 읽기" },
          { id: "hist-m6", text: "박물관이나 역사 유적지 방문하거나 온라인 투어 해보기" },
          { id: "hist-m7", text: "내가 사는 지역의 역사 자료 조사하기" },
          { id: "hist-m8", text: "역사학자에게 필요한 능력 3가지 적어보기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "hist-m9",  text: "관심 있는 역사 주제로 간단한 보고서 만들기" },
          { id: "hist-m10", text: "역사학 관련 학과 진학 경로 조사해보기" },
          { id: "hist-m11", text: "역사 퀴즈나 역사 동아리 활동 탐색하기" },
          { id: "hist-m12", text: "부모님과 역사학자의 일상에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 철도 기관사 ────────────────────────────────────────
  "train-driver": {
    id: "train-driver-roadmap",
    occupationId: "train-driver",
    occupationName: "철도 기관사",
    occupationEmoji: "🚆",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "td-m1", text: "철도 기관사가 하는 일을 3가지 찾아보기" },
          { id: "td-m2", text: "열차 관련 영상을 1편 보고 흥미로운 점 적기" },
          { id: "td-m3", text: "기차나 지하철을 타며 기관사의 역할 생각해보기" },
          { id: "td-m4", text: "철도 관련 직업을 3가지 조사해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "td-m5", text: "철도 기관사가 되려면 어떤 절차가 필요한지 조사하기" },
          { id: "td-m6", text: "기계·전자 과목 중 흥미 있는 것 탐색하기" },
          { id: "td-m7", text: "철도 박물관이나 교통 체험 시설 방문 계획 세우기" },
          { id: "td-m8", text: "안전 운행이 중요한 이유를 가족에게 설명해보기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "td-m9",  text: "철도 관련 학과나 진학 경로 찾아보기" },
          { id: "td-m10", text: "열차 안전 수칙을 스스로 정리해보기" },
          { id: "td-m11", text: "나와 철도 기관사가 연결되는 점 적어보기" },
          { id: "td-m12", text: "부모님과 철도 기관사의 일에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 기후데이터 분석가 ──────────────────────────────────
  "climate-data-analyst": {
    id: "climate-data-analyst-roadmap",
    occupationId: "climate-data-analyst",
    occupationName: "기후데이터 분석가",
    occupationEmoji: "🌡️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "cda-m1", text: "기후데이터 분석가가 하는 일을 3가지 찾아보기" },
          { id: "cda-m2", text: "기후 변화 관련 뉴스 1개를 읽고 요약하기" },
          { id: "cda-m3", text: "날씨 앱에서 기온·강수량 데이터를 1주일 기록하기" },
          { id: "cda-m4", text: "기후 관련 유튜브 채널 1개 구독하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "cda-m5", text: "엑셀이나 스프레드시트로 기온 변화 그래프 만들어보기" },
          { id: "cda-m6", text: "기후 데이터를 분석하는 데 필요한 능력 3가지 적기" },
          { id: "cda-m7", text: "기후 관련 책이나 자료 1권 읽기" },
          { id: "cda-m8", text: "환경·과학 동아리 활동 탐색하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "cda-m9",  text: "지역 기후 데이터를 찾아 간단한 보고서 작성하기" },
          { id: "cda-m10", text: "기후데이터 분석가 관련 학과 진학 경로 조사하기" },
          { id: "cda-m11", text: "기후 데이터를 다루는 직업 3가지 비교해보기" },
          { id: "cda-m12", text: "부모님과 기후 변화와 직업의 연결에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 자원순환 전문가 ────────────────────────────────────
  "resource-recycling-specialist": {
    id: "resource-recycling-specialist-roadmap",
    occupationId: "resource-recycling-specialist",
    occupationName: "자원순환 전문가",
    occupationEmoji: "♻️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "rrs-m1", text: "자원순환 전문가가 하는 일을 3가지 찾아보기" },
          { id: "rrs-m2", text: "집에서 1주일 동안 분리수거 항목 기록하기" },
          { id: "rrs-m3", text: "재활용 관련 영상 1편 보고 새롭게 알게 된 점 적기" },
          { id: "rrs-m4", text: "환경 관련 뉴스 기사 1개 읽고 요약하기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "rrs-m5", text: "내가 사는 지역 자원순환 센터가 어디 있는지 알아보기" },
          { id: "rrs-m6", text: "업사이클링 아이디어 1가지 직접 실천해보기" },
          { id: "rrs-m7", text: "자원순환 전문가에게 필요한 능력 3가지 적기" },
          { id: "rrs-m8", text: "환경 관련 동아리나 봉사 활동 탐색하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "rrs-m9",  text: "학교나 집에서 쓰레기를 줄이는 실천 방안 5가지 만들기" },
          { id: "rrs-m10", text: "자원순환 관련 학과나 진학 경로 찾아보기" },
          { id: "rrs-m11", text: "자원순환 관련 직업을 3가지 비교해보기" },
          { id: "rrs-m12", text: "부모님과 함께 자원순환 실천 아이디어 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 녹색건축 전문가 ────────────────────────────────────
  "green-building-specialist": {
    id: "green-building-specialist-roadmap",
    occupationId: "green-building-specialist",
    occupationName: "녹색건축 전문가",
    occupationEmoji: "🏗️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "gbs-m1", text: "녹색건축 전문가가 하는 일을 3가지 찾아보기" },
          { id: "gbs-m2", text: "친환경 건물 사례를 인터넷에서 1가지 찾아보기" },
          { id: "gbs-m3", text: "건물이 환경에 미치는 영향에 대해 조사하기" },
          { id: "gbs-m4", text: "가족에게 녹색건축이 무엇인지 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "gbs-m5", text: "태양열·단열 등 친환경 건축 기술 3가지 조사하기" },
          { id: "gbs-m6", text: "건축·환경 관련 도서 1권 읽기" },
          { id: "gbs-m7", text: "녹색건축 전문가에게 필요한 능력 3가지 적기" },
          { id: "gbs-m8", text: "과학·수학·미술 중 이 직업과 연결되는 과목 찾기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "gbs-m9",  text: "친환경 집 설계 아이디어를 그림이나 글로 표현하기" },
          { id: "gbs-m10", text: "녹색건축 관련 학과 진학 경로 조사하기" },
          { id: "gbs-m11", text: "건축·환경 관련 직업 3가지 비교해보기" },
          { id: "gbs-m12", text: "부모님과 친환경 건물의 필요성에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 환경 컨설턴트 ──────────────────────────────────────
  "environmental-consultant": {
    id: "environmental-consultant-roadmap",
    occupationId: "environmental-consultant",
    occupationName: "환경 컨설턴트",
    occupationEmoji: "🌿",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "ec-m1", text: "환경 컨설턴트가 하는 일을 3가지 찾아보기" },
          { id: "ec-m2", text: "환경 문제 뉴스 1개 읽고 느낀 점 적기" },
          { id: "ec-m3", text: "환경 관련 유튜브 채널 1개 구독하기" },
          { id: "ec-m4", text: "컨설턴트의 역할을 쉬운 말로 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "ec-m5", text: "학교나 집 주변에서 환경 문제를 1가지 찾고 해결 아이디어 적기" },
          { id: "ec-m6", text: "환경 컨설턴트가 활용하는 분야 3가지 조사하기" },
          { id: "ec-m7", text: "환경·생태 봉사활동 탐색하기" },
          { id: "ec-m8", text: "환경 컨설턴트에게 필요한 능력 3가지 적기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "ec-m9",  text: "학교 환경 개선 아이디어를 보고서 형식으로 만들기" },
          { id: "ec-m10", text: "환경 컨설팅 관련 학과나 진학 경로 조사하기" },
          { id: "ec-m11", text: "환경 관련 직업 3가지를 비교해 표로 정리하기" },
          { id: "ec-m12", text: "부모님과 환경 컨설턴트가 하는 일에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 재난안전관리자 ─────────────────────────────────────
  "disaster-safety-manager": {
    id: "disaster-safety-manager-roadmap",
    occupationId: "disaster-safety-manager",
    occupationName: "재난안전관리자",
    occupationEmoji: "🦺",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "dsm-m1", text: "재난안전관리자가 하는 일을 3가지 찾아보기" },
          { id: "dsm-m2", text: "우리 학교나 집의 대피 경로를 확인해보기" },
          { id: "dsm-m3", text: "재난 관련 뉴스 1개 읽고 느낀 점 적기" },
          { id: "dsm-m4", text: "가족에게 재난안전관리자 역할을 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "dsm-m5", text: "재난 유형 3가지(지진·화재·홍수)와 대응 방법 조사하기" },
          { id: "dsm-m6", text: "안전 수칙을 정리해 가족과 공유하기" },
          { id: "dsm-m7", text: "재난안전관리자에게 필요한 능력 3가지 적기" },
          { id: "dsm-m8", text: "안전 관련 동아리나 캠프 탐색하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "dsm-m9",  text: "학교 안전 점검 체크리스트를 직접 만들어보기" },
          { id: "dsm-m10", text: "재난안전 관련 학과나 진학 경로 조사하기" },
          { id: "dsm-m11", text: "소방관·경찰관·재난안전관리자의 역할 차이 정리하기" },
          { id: "dsm-m12", text: "부모님과 가정 재난 대비 계획 함께 세워보기" },
        ],
      },
    ],
  },

  // ── 보호관찰관 ─────────────────────────────────────────
  "probation-officer": {
    id: "probation-officer-roadmap",
    occupationId: "probation-officer",
    occupationName: "보호관찰관",
    occupationEmoji: "⚖️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "po-m1", text: "보호관찰관이 하는 일을 3가지 찾아보기" },
          { id: "po-m2", text: "사회 복귀 지원이 왜 중요한지 뉴스로 알아보기" },
          { id: "po-m3", text: "법무부 또는 보호관찰 관련 직업을 조사하기" },
          { id: "po-m4", text: "가족에게 보호관찰관 역할을 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "po-m5", text: "사회복지·심리·법학 중 흥미 있는 분야 탐색하기" },
          { id: "po-m6", text: "보호관찰관에게 필요한 능력 3가지 적기" },
          { id: "po-m7", text: "사회 정의·공공 서비스에 관심 있는 이유 적어보기" },
          { id: "po-m8", text: "지역 사회 봉사활동 1가지 탐색하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "po-m9",  text: "법무부·보호관찰 관련 공공 직업 진학 경로 조사하기" },
          { id: "po-m10", text: "사회복지사·경찰관·보호관찰관 역할 차이 표로 정리하기" },
          { id: "po-m11", text: "나와 이 직업이 연결되는 점을 적어보기" },
          { id: "po-m12", text: "부모님과 보호관찰관의 역할에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 교정직 공무원 ──────────────────────────────────────
  "correctional-officer": {
    id: "correctional-officer-roadmap",
    occupationId: "correctional-officer",
    occupationName: "교정직 공무원",
    occupationEmoji: "🏛️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "cor-m1", text: "교정직 공무원이 하는 일을 3가지 찾아보기" },
          { id: "cor-m2", text: "교도소와 교정 행정의 역할에 대해 조사하기" },
          { id: "cor-m3", text: "공공 안전 관련 직업을 3가지 알아보기" },
          { id: "cor-m4", text: "가족에게 교정직 공무원의 역할 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "cor-m5", text: "교정직 공무원이 되기 위한 시험·절차 조사하기" },
          { id: "cor-m6", text: "법학·사회복지·심리학 중 관심 있는 분야 탐색하기" },
          { id: "cor-m7", text: "교정직 공무원에게 필요한 능력 3가지 적기" },
          { id: "cor-m8", text: "나와 이 직업이 연결되는 이유 적어보기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "cor-m9",  text: "교정직 공무원 관련 학과나 진학 경로 조사하기" },
          { id: "cor-m10", text: "교정직·보호관찰관·사회복지사 역할 차이 표로 정리하기" },
          { id: "cor-m11", text: "공공 봉사직 직업 탐색 보고서 간단히 만들기" },
          { id: "cor-m12", text: "부모님과 공공 안전 직업의 중요성에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 일반행정 공무원 ────────────────────────────────────
  "public-administration-officer": {
    id: "public-administration-officer-roadmap",
    occupationId: "public-administration-officer",
    occupationName: "일반행정 공무원",
    occupationEmoji: "🏢",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "pao-m1", text: "일반행정 공무원이 하는 일을 3가지 찾아보기" },
          { id: "pao-m2", text: "주민센터나 구청이 어떤 서비스를 제공하는지 알아보기" },
          { id: "pao-m3", text: "행정직 공무원과 관련 직업을 3가지 비교하기" },
          { id: "pao-m4", text: "가족에게 공무원의 역할 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "pao-m5", text: "공무원 시험 준비 과정과 필요한 과목 조사하기" },
          { id: "pao-m6", text: "행정학·사회학·법학 중 흥미 있는 분야 탐색하기" },
          { id: "pao-m7", text: "일반행정 공무원에게 필요한 능력 3가지 적기" },
          { id: "pao-m8", text: "지역 사회를 위해 내가 할 수 있는 작은 실천 적어보기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "pao-m9",  text: "일반행정 공무원 관련 학과나 진학 경로 조사하기" },
          { id: "pao-m10", text: "행정직·경찰·교정직 공무원 역할 차이 표로 정리하기" },
          { id: "pao-m11", text: "내가 공공서비스를 개선한다면 어떤 것을 고치고 싶은지 적기" },
          { id: "pao-m12", text: "부모님과 공무원 직업의 특성과 장단점에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 항공정비사 ─────────────────────────────────────────
  "aircraft-maintenance-technician": {
    id: "aircraft-maintenance-technician-roadmap",
    occupationId: "aircraft-maintenance-technician",
    occupationName: "항공정비사",
    occupationEmoji: "✈️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "amt-m1", text: "항공정비사가 하는 일을 3가지 찾아보기" },
          { id: "amt-m2", text: "비행기 구조에 대한 영상을 1편 보고 흥미로운 점 적기" },
          { id: "amt-m3", text: "항공기 관련 직업을 3가지 알아보기" },
          { id: "amt-m4", text: "가족에게 항공정비사의 역할 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "amt-m5", text: "항공정비사 자격증 취득 과정 조사하기" },
          { id: "amt-m6", text: "기계·전자·물리 과목 중 흥미 있는 것 탐색하기" },
          { id: "amt-m7", text: "항공정비사에게 필요한 능력 3가지 적기" },
          { id: "amt-m8", text: "항공 관련 체험 프로그램이나 박물관 탐색하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "amt-m9",  text: "항공정비 관련 학과나 진학 경로 조사하기" },
          { id: "amt-m10", text: "항공정비사·조종사·항공관제사 역할 차이 표로 정리하기" },
          { id: "amt-m11", text: "간단한 기계 모형 또는 드론 키트를 탐색해보기" },
          { id: "amt-m12", text: "부모님과 항공 산업과 정비사의 중요성에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 물류관리사 ─────────────────────────────────────────
  "logistics-manager": {
    id: "logistics-manager-roadmap",
    occupationId: "logistics-manager",
    occupationName: "물류관리사",
    occupationEmoji: "📦",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "lm-m1", text: "물류관리사가 하는 일을 3가지 찾아보기" },
          { id: "lm-m2", text: "인터넷 쇼핑몰에서 상품이 배달되는 과정 조사하기" },
          { id: "lm-m3", text: "물류 관련 직업을 3가지 알아보기" },
          { id: "lm-m4", text: "가족에게 물류관리사의 역할 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "lm-m5", text: "물류 관련 용어 5가지 찾아서 정리하기" },
          { id: "lm-m6", text: "경영·경제·수학 과목 중 이 직업과 연결되는 과목 탐색하기" },
          { id: "lm-m7", text: "물류관리사에게 필요한 능력 3가지 적기" },
          { id: "lm-m8", text: "공급망이 무엇인지 쉽게 설명해보기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "lm-m9",  text: "물류관리사 관련 학과나 진학 경로 조사하기" },
          { id: "lm-m10", text: "물류·유통·경영 관련 직업 3가지 비교 표 만들기" },
          { id: "lm-m11", text: "물건이 공장에서 집까지 오는 여정을 그림이나 글로 표현하기" },
          { id: "lm-m12", text: "부모님과 물류 직업의 일상과 중요성에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 영상 감독 ──────────────────────────────────────────
  "video-director": {
    id: "video-director-roadmap",
    occupationId: "video-director",
    occupationName: "영상 감독",
    occupationEmoji: "🎬",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "vd-m1", text: "영상 감독이 하는 일을 3가지 찾아보기" },
          { id: "vd-m2", text: "좋아하는 영화·드라마를 보며 연출 기법 1가지 관찰하기" },
          { id: "vd-m3", text: "영상 관련 직업(감독·편집·촬영)을 3가지 비교하기" },
          { id: "vd-m4", text: "스마트폰으로 짧은 영상 1편 촬영해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "vd-m5", text: "영상 편집 기초 튜토리얼 1개 따라해보기" },
          { id: "vd-m6", text: "좋아하는 영상 작품의 감독·제작 방식 조사하기" },
          { id: "vd-m7", text: "영상 감독에게 필요한 능력 3가지 적기" },
          { id: "vd-m8", text: "영상·미디어 동아리나 활동 탐색하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "vd-m9",  text: "가족이나 친구를 위한 1분짜리 영상 제작하기" },
          { id: "vd-m10", text: "영상·미디어·영화 관련 학과 진학 경로 조사하기" },
          { id: "vd-m11", text: "내가 만들고 싶은 영상의 주제와 내용 기획해보기" },
          { id: "vd-m12", text: "부모님과 좋아하는 영상 작품과 감독 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 게임 기획자 ────────────────────────────────────────
  "game-planner": {
    id: "game-planner-roadmap",
    occupationId: "game-planner",
    occupationName: "게임 기획자",
    occupationEmoji: "🎮",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "gp-m1", text: "게임 기획자가 하는 일을 3가지 찾아보기" },
          { id: "gp-m2", text: "좋아하는 게임을 플레이하며 재밌는 요소 3가지 적기" },
          { id: "gp-m3", text: "게임 개발 팀에는 어떤 직업들이 있는지 알아보기" },
          { id: "gp-m4", text: "가족에게 게임 기획자의 역할 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "gp-m5", text: "좋아하는 게임의 규칙과 시스템을 분석해 적기" },
          { id: "gp-m6", text: "게임 기획자에게 필요한 능력 3가지 적기" },
          { id: "gp-m7", text: "간단한 보드게임 아이디어를 기획해보기" },
          { id: "gp-m8", text: "게임·IT 관련 동아리나 활동 탐색하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "gp-m9",  text: "짧은 게임 기획서(배경·규칙·목표)를 글로 작성해보기" },
          { id: "gp-m10", text: "게임 기획·개발 관련 학과 진학 경로 조사하기" },
          { id: "gp-m11", text: "게임 기획자·개발자·디자이너 역할 차이 표로 정리하기" },
          { id: "gp-m12", text: "부모님과 게임 기획자의 하루 일과에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 스포츠 해설가 ──────────────────────────────────────
  "sports-commentator": {
    id: "sports-commentator-roadmap",
    occupationId: "sports-commentator",
    occupationName: "스포츠 해설가",
    occupationEmoji: "🎙️",
    grade: "중1",
    stages: [
      {
        id: "sc-m-stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "sc-m1", text: "스포츠 해설가가 하는 일을 3가지 찾아보기" },
          { id: "sc-m2", text: "좋아하는 스포츠 중계를 보며 해설가의 표현 방식 관찰하기" },
          { id: "sc-m3", text: "해설가와 캐스터의 차이를 조사해보기" },
          { id: "sc-m4", text: "가족에게 좋아하는 스포츠 경기를 간단히 해설해보기" },
        ],
      },
      {
        id: "sc-m-stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "sc-m5", text: "좋아하는 스포츠의 규칙과 용어 10개 정리하기" },
          { id: "sc-m6", text: "스포츠 해설가에게 필요한 능력 3가지 적기" },
          { id: "sc-m7", text: "스포츠 중계 유튜브 채널 1개 구독하고 표현 방식 메모하기" },
          { id: "sc-m8", text: "체육·국어·미디어 과목 중 이 직업과 연결되는 것 찾기" },
        ],
      },
      {
        id: "sc-m-stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "sc-m9",  text: "좋아하는 경기 장면을 직접 해설해보고 녹음하기" },
          { id: "sc-m10", text: "스포츠 미디어·방송 관련 학과 진학 경로 조사하기" },
          { id: "sc-m11", text: "해설가·기자·PD 역할 차이 표로 정리하기" },
          { id: "sc-m12", text: "부모님과 스포츠 해설가의 일에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 인사담당자 ─────────────────────────────────────────
  "human-resources-specialist": {
    id: "human-resources-specialist-roadmap",
    occupationId: "human-resources-specialist",
    occupationName: "인사담당자",
    occupationEmoji: "🤝",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "hrs-m1", text: "인사담당자가 하는 일을 3가지 찾아보기" },
          { id: "hrs-m2", text: "회사에서 채용·교육을 담당하는 사람의 역할 조사하기" },
          { id: "hrs-m3", text: "경영·인사 관련 직업을 3가지 알아보기" },
          { id: "hrs-m4", text: "가족에게 인사담당자의 역할 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "hrs-m5", text: "인사담당자에게 필요한 능력 3가지 적기" },
          { id: "hrs-m6", text: "학교에서 친구들의 의견을 모아본 경험 정리하기" },
          { id: "hrs-m7", text: "경영학·심리학·사회학 중 흥미 있는 과목 탐색하기" },
          { id: "hrs-m8", text: "좋은 팀을 만드는 데 중요한 요소 3가지 적기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "hrs-m9",  text: "인사담당자 관련 학과나 진학 경로 조사하기" },
          { id: "hrs-m10", text: "인사담당자·경영컨설턴트·사회복지사 역할 차이 정리하기" },
          { id: "hrs-m11", text: "내가 팀장이라면 어떤 사람을 뽑고 싶은지 기준 적어보기" },
          { id: "hrs-m12", text: "부모님과 인사담당자의 역할에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 재무설계사 ─────────────────────────────────────────
  "financial-planner": {
    id: "financial-planner-roadmap",
    occupationId: "financial-planner",
    occupationName: "재무설계사",
    occupationEmoji: "💰",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "fp-m1", text: "재무설계사가 하는 일을 3가지 찾아보기" },
          { id: "fp-m2", text: "용돈을 1주일 동안 기록하며 수입·지출 파악하기" },
          { id: "fp-m3", text: "금융·재무 관련 직업을 3가지 알아보기" },
          { id: "fp-m4", text: "가족에게 재무설계사의 역할 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "fp-m5", text: "저축·소비·투자의 차이를 쉬운 말로 설명해보기" },
          { id: "fp-m6", text: "수학·경제 과목 중 이 직업과 연결되는 것 탐색하기" },
          { id: "fp-m7", text: "재무설계사에게 필요한 능력 3가지 적기" },
          { id: "fp-m8", text: "경제·금융 관련 책이나 유튜브 채널 탐색하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "fp-m9",  text: "1개월 용돈 계획표를 직접 만들어 실천해보기" },
          { id: "fp-m10", text: "재무설계사 관련 학과나 진학 경로 조사하기" },
          { id: "fp-m11", text: "재무설계사·회계사·세무사 역할 차이 표로 정리하기" },
          { id: "fp-m12", text: "부모님과 돈 관리와 재무설계의 중요성에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 프로덕트 매니저 ────────────────────────────────────
  "product-manager": {
    id: "product-manager-roadmap",
    occupationId: "product-manager",
    occupationName: "프로덕트 매니저",
    occupationEmoji: "🗂️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "pm-m1", text: "프로덕트 매니저(PM)가 하는 일을 3가지 찾아보기" },
          { id: "pm-m2", text: "평소에 자주 쓰는 앱을 분석하며 개선하고 싶은 점 적기" },
          { id: "pm-m3", text: "IT·경영 관련 직업을 3가지 알아보기" },
          { id: "pm-m4", text: "가족에게 PM의 역할을 쉽게 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "pm-m5", text: "좋아하는 앱이나 서비스의 장점·단점 5가지 적기" },
          { id: "pm-m6", text: "PM에게 필요한 능력 3가지 적기" },
          { id: "pm-m7", text: "IT·경영 관련 유튜브 채널 1개 구독하기" },
          { id: "pm-m8", text: "팀 프로젝트에서 조율과 기획 역할을 해본 경험 적기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "pm-m9",  text: "내가 만들고 싶은 앱·서비스 아이디어를 기획서로 적어보기" },
          { id: "pm-m10", text: "PM 관련 학과나 진학 경로 조사하기" },
          { id: "pm-m11", text: "PM·UX 디자이너·개발자 역할 차이 표로 정리하기" },
          { id: "pm-m12", text: "부모님과 PM이 하는 일에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 평생교육사 ─────────────────────────────────────────
  "lifelong-education-specialist": {
    id: "lifelong-education-specialist-roadmap",
    occupationId: "lifelong-education-specialist",
    occupationName: "평생교육사",
    occupationEmoji: "📚",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "les-m1", text: "평생교육사가 하는 일을 3가지 찾아보기" },
          { id: "les-m2", text: "주민센터·도서관에서 운영하는 교육 프로그램 조사하기" },
          { id: "les-m3", text: "교육 관련 직업을 3가지 비교하기" },
          { id: "les-m4", text: "가족에게 평생교육사의 역할 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "les-m5", text: "나 또는 가족이 배우고 싶은 것을 위한 교육 프로그램 찾아보기" },
          { id: "les-m6", text: "평생교육사에게 필요한 능력 3가지 적기" },
          { id: "les-m7", text: "교육학·사회학·상담학 중 흥미 있는 분야 탐색하기" },
          { id: "les-m8", text: "교육 관련 봉사활동 1가지 탐색하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "les-m9",  text: "내가 친구나 가족에게 가르쳐줄 수 있는 것 1가지 실천하기" },
          { id: "les-m10", text: "평생교육사 관련 학과나 진학 경로 조사하기" },
          { id: "les-m11", text: "교사·사서·평생교육사 역할 차이 표로 정리하기" },
          { id: "les-m12", text: "부모님과 배움이 평생 이어지는 이유에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 청소년지도사 ────────────────────────────────────────
  "youth-worker": {
    id: "youth-worker-roadmap",
    occupationId: "youth-worker",
    occupationName: "청소년지도사",
    occupationEmoji: "🌱",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "yw-m1", text: "청소년지도사가 하는 일을 3가지 찾아보기" },
          { id: "yw-m2", text: "청소년 센터나 방과후 프로그램이 어디에 있는지 알아보기" },
          { id: "yw-m3", text: "교육·사회복지 관련 직업을 3가지 비교하기" },
          { id: "yw-m4", text: "가족에게 청소년지도사의 역할 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "yw-m5", text: "청소년지도사에게 필요한 능력 3가지 적기" },
          { id: "yw-m6", text: "학교나 지역에서 또래를 돕는 활동을 탐색하기" },
          { id: "yw-m7", text: "심리학·상담학·교육학 중 흥미 있는 분야 탐색하기" },
          { id: "yw-m8", text: "내가 청소년 프로그램을 만든다면 어떤 내용인지 적기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "yw-m9",  text: "친구나 후배를 위한 작은 활동 1가지 기획하고 실천하기" },
          { id: "yw-m10", text: "청소년지도사 관련 학과나 진학 경로 조사하기" },
          { id: "yw-m11", text: "청소년지도사·사회복지사·교사 역할 차이 표로 정리하기" },
          { id: "yw-m12", text: "부모님과 청소년 지원이 왜 중요한지 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 방과후교사 ─────────────────────────────────────────
  "after-school-teacher": {
    id: "after-school-teacher-roadmap",
    occupationId: "after-school-teacher",
    occupationName: "방과후교사",
    occupationEmoji: "🖊️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "ast-m1", text: "방과후교사가 하는 일을 3가지 찾아보기" },
          { id: "ast-m2", text: "학교 방과후 수업이나 돌봄 프로그램이 어떻게 운영되는지 알아보기" },
          { id: "ast-m3", text: "교육·돌봄 관련 직업을 3가지 비교하기" },
          { id: "ast-m4", text: "가족에게 방과후교사의 역할 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "ast-m5", text: "방과후교사에게 필요한 능력 3가지 적기" },
          { id: "ast-m6", text: "내가 잘 가르칠 수 있는 분야 1가지 적어보기" },
          { id: "ast-m7", text: "교육학·아동학·체육 중 흥미 있는 분야 탐색하기" },
          { id: "ast-m8", text: "또래 친구에게 무언가를 가르쳐본 경험 적기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "ast-m9",  text: "친구나 동생을 위한 10분짜리 미니 수업 기획해보기" },
          { id: "ast-m10", text: "방과후교사 관련 학과나 진학 경로 조사하기" },
          { id: "ast-m11", text: "방과후교사·초등교사·청소년지도사 역할 차이 표로 정리하기" },
          { id: "ast-m12", text: "부모님과 방과후 교육의 중요성에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 네트워크 엔지니어 ──────────────────────────────────
  "network-engineer": {
    id: "network-engineer-roadmap",
    occupationId: "network-engineer",
    occupationName: "네트워크 엔지니어",
    occupationEmoji: "🌐",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "ne-m1", text: "네트워크 엔지니어가 하는 일을 3가지 찾아보기" },
          { id: "ne-m2", text: "인터넷이 어떻게 작동하는지 영상으로 알아보기" },
          { id: "ne-m3", text: "IT 인프라 관련 직업을 3가지 알아보기" },
          { id: "ne-m4", text: "가족에게 네트워크가 무엇인지 쉽게 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "ne-m5", text: "IP 주소·라우터·서버 등 네트워크 용어 5가지 정리하기" },
          { id: "ne-m6", text: "네트워크 엔지니어에게 필요한 능력 3가지 적기" },
          { id: "ne-m7", text: "수학·정보·물리 과목 중 이 직업과 연결되는 것 탐색하기" },
          { id: "ne-m8", text: "IT 관련 동아리나 코딩 활동 탐색하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "ne-m9",  text: "집 와이파이 구조를 그림으로 그려 설명해보기" },
          { id: "ne-m10", text: "네트워크 엔지니어 관련 학과나 진학 경로 조사하기" },
          { id: "ne-m11", text: "네트워크 엔지니어·보안전문가·클라우드 엔지니어 차이 정리하기" },
          { id: "ne-m12", text: "부모님과 인터넷이 없으면 어떤 일이 생길지 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 모바일 앱 개발자 ───────────────────────────────────
  "mobile-app-developer": {
    id: "mobile-app-developer-roadmap",
    occupationId: "mobile-app-developer",
    occupationName: "모바일 앱 개발자",
    occupationEmoji: "📱",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "mad-m1", text: "모바일 앱 개발자가 하는 일을 3가지 찾아보기" },
          { id: "mad-m2", text: "평소에 자주 쓰는 앱을 고르고 좋은 점과 불편한 점 적기" },
          { id: "mad-m3", text: "앱 개발 관련 직업(개발·기획·디자인)을 3가지 비교하기" },
          { id: "mad-m4", text: "가족에게 앱 개발자의 역할 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "mad-m5", text: "MIT 앱인벤터로 간단한 앱 체험해보기" },
          { id: "mad-m6", text: "모바일 앱 개발자에게 필요한 능력 3가지 적기" },
          { id: "mad-m7", text: "코딩 기초 강의(스크래치·파이썬) 1강 수강하기" },
          { id: "mad-m8", text: "IT 관련 동아리나 코딩 캠프 탐색하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "mad-m9",  text: "내가 만들고 싶은 앱 아이디어를 기획서로 적어보기" },
          { id: "mad-m10", text: "모바일 앱 개발 관련 학과나 진학 경로 조사하기" },
          { id: "mad-m11", text: "소프트웨어 엔지니어·앱 개발자·게임 개발자 차이 정리하기" },
          { id: "mad-m12", text: "부모님과 내가 만들고 싶은 앱에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 방사선사 ───────────────────────────────────────────
  "radiologic-technologist": {
    id: "radiologic-technologist-roadmap",
    occupationId: "radiologic-technologist",
    occupationName: "방사선사",
    occupationEmoji: "🩻",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "rt-m1", text: "방사선사가 하는 일을 3가지 찾아보기" },
          { id: "rt-m2", text: "X선·CT·MRI 검사의 차이를 조사해보기" },
          { id: "rt-m3", text: "의료 기사 관련 직업을 3가지 비교하기" },
          { id: "rt-m4", text: "가족에게 방사선사의 역할 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "rt-m5", text: "방사선사가 되려면 어떤 학과와 국가면허가 필요한지 조사하기" },
          { id: "rt-m6", text: "생물·물리·화학 중 이 직업과 연결되는 과목 탐색하기" },
          { id: "rt-m7", text: "방사선사에게 필요한 능력 3가지 적기" },
          { id: "rt-m8", text: "의료 분야 직업 체험 프로그램이나 영상 탐색하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "rt-m9",  text: "방사선사 관련 학과나 진학 경로 조사하기" },
          { id: "rt-m10", text: "방사선사·임상병리사·간호사 역할 차이 표로 정리하기" },
          { id: "rt-m11", text: "의료 영상 기술이 발전하면 어떤 점이 좋아질지 적어보기" },
          { id: "rt-m12", text: "부모님과 방사선사의 하루와 역할에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 스포츠 테크 개발자 ─────────────────────────────────
  "sports-tech-developer": {
    id: "sports-tech-developer-roadmap",
    occupationId: "sports-tech-developer",
    occupationName: "스포츠 테크 개발자",
    occupationEmoji: "⚡",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "std-m1", text: "스포츠 테크 개발자가 하는 일을 3가지 찾아보기" },
          { id: "std-m2", text: "웨어러블 기기·스마트 운동 앱 사례를 1가지 찾아보기" },
          { id: "std-m3", text: "스포츠와 IT가 만나는 분야를 3가지 조사하기" },
          { id: "std-m4", text: "가족에게 스포츠 테크가 무엇인지 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "std-m5", text: "코딩 기초 강의 1강 수강하기" },
          { id: "std-m6", text: "스포츠 테크 개발자에게 필요한 능력 3가지 적기" },
          { id: "std-m7", text: "좋아하는 운동에서 기술로 개선할 수 있는 것 1가지 적기" },
          { id: "std-m8", text: "IT·체육 중 이 직업과 연결되는 과목 탐색하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "std-m9",  text: "내가 만들고 싶은 스포츠 앱 아이디어를 적어보기" },
          { id: "std-m10", text: "스포츠 테크 관련 학과나 진학 경로 조사하기" },
          { id: "std-m11", text: "스포츠 데이터 분석가·스포츠 테크 개발자·앱 개발자 차이 정리하기" },
          { id: "std-m12", text: "부모님과 스포츠와 기술의 결합에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 스포츠 마케터 ──────────────────────────────────────
  "sports-marketer": {
    id: "sports-marketer-roadmap",
    occupationId: "sports-marketer",
    occupationName: "스포츠 마케터",
    occupationEmoji: "📣",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "sm-m1", text: "스포츠 마케터가 하는 일을 3가지 찾아보기" },
          { id: "sm-m2", text: "좋아하는 스포츠 팀의 광고·SNS 마케팅 사례 1가지 찾아보기" },
          { id: "sm-m3", text: "마케팅 관련 직업을 3가지 알아보기" },
          { id: "sm-m4", text: "가족에게 스포츠 마케터의 역할 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "sm-m5", text: "좋아하는 스포츠 이벤트 홍보 아이디어 1가지 적기" },
          { id: "sm-m6", text: "스포츠 마케터에게 필요한 능력 3가지 적기" },
          { id: "sm-m7", text: "경영·국어·미디어 과목 중 이 직업과 연결되는 것 탐색하기" },
          { id: "sm-m8", text: "마케팅 관련 유튜브 채널 1개 구독하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "sm-m9",  text: "좋아하는 스포츠 팀을 위한 간단한 홍보 포스터 만들기" },
          { id: "sm-m10", text: "스포츠 마케팅 관련 학과나 진학 경로 조사하기" },
          { id: "sm-m11", text: "스포츠 마케터·콘텐츠 기획자·브랜드 매니저 차이 표로 정리하기" },
          { id: "sm-m12", text: "부모님과 좋아하는 스포츠 브랜드 마케팅에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 아웃도어 레저 기획자 ───────────────────────────────
  "outdoor-leisure-planner": {
    id: "outdoor-leisure-planner-roadmap",
    occupationId: "outdoor-leisure-planner",
    occupationName: "아웃도어 레저 기획자",
    occupationEmoji: "🏕️",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "olp-m1", text: "아웃도어 레저 기획자가 하는 일을 3가지 찾아보기" },
          { id: "olp-m2", text: "등산·캠핑·자전거 등 야외 활동 1가지 체험하거나 관찰하기" },
          { id: "olp-m3", text: "레저·관광 관련 직업을 3가지 알아보기" },
          { id: "olp-m4", text: "가족에게 아웃도어 레저 기획자의 역할 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "olp-m5", text: "지역 아웃도어 프로그램이나 자연 체험 행사 탐색하기" },
          { id: "olp-m6", text: "아웃도어 레저 기획자에게 필요한 능력 3가지 적기" },
          { id: "olp-m7", text: "야외 활동 안전 수칙 5가지 정리하기" },
          { id: "olp-m8", text: "환경·체육·사회 과목 중 이 직업과 연결되는 것 탐색하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "olp-m9",  text: "가족을 위한 1일 아웃도어 프로그램을 기획해보기" },
          { id: "olp-m10", text: "아웃도어 레저·관광 관련 학과나 진학 경로 조사하기" },
          { id: "olp-m11", text: "아웃도어 기획자·스포츠 지도사·해양레저 전문가 차이 정리하기" },
          { id: "olp-m12", text: "부모님과 좋아하는 야외 활동과 그 직업에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 해양레저 전문가 ────────────────────────────────────
  "marine-leisure-specialist": {
    id: "marine-leisure-specialist-roadmap",
    occupationId: "marine-leisure-specialist",
    occupationName: "해양레저 전문가",
    occupationEmoji: "🌊",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "mls-m1", text: "해양레저 전문가가 하는 일을 3가지 찾아보기" },
          { id: "mls-m2", text: "서핑·다이빙·카약 등 해양 스포츠 종류를 5가지 조사하기" },
          { id: "mls-m3", text: "해양 관련 직업을 3가지 알아보기" },
          { id: "mls-m4", text: "가족에게 해양레저 전문가의 역할 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "mls-m5", text: "수상 안전 수칙 5가지를 찾아 정리하기" },
          { id: "mls-m6", text: "해양레저 전문가에게 필요한 능력 3가지 적기" },
          { id: "mls-m7", text: "해양 관련 체험 프로그램이나 해양 교육 탐색하기" },
          { id: "mls-m8", text: "체육·환경·지구과학 과목 중 이 직업과 연결되는 것 탐색하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "mls-m9",  text: "해양 레저 안전 가이드를 글이나 그림으로 만들어보기" },
          { id: "mls-m10", text: "해양레저·해양과학 관련 학과나 진학 경로 조사하기" },
          { id: "mls-m11", text: "해양레저 전문가·수상안전요원·해양환경 연구원 차이 정리하기" },
          { id: "mls-m12", text: "부모님과 바다와 레저 직업에 대해 이야기 나눠보기" },
        ],
      },
    ],
  },

  // ── 수상안전요원 ────────────────────────────────────────
  "water-safety-lifeguard": {
    id: "water-safety-lifeguard-roadmap",
    occupationId: "water-safety-lifeguard",
    occupationName: "수상안전요원",
    occupationEmoji: "🏊",
    grade: "중1",
    stages: [
      {
        id: "stage-current",
        status: "current",
        title: "탐색하기",
        missions: [
          { id: "wsl-m1", text: "수상안전요원이 하는 일을 3가지 찾아보기" },
          { id: "wsl-m2", text: "수상안전요원이 사용하는 장비와 기술을 조사하기" },
          { id: "wsl-m3", text: "물 속 안전 수칙 5가지를 찾아 정리하기" },
          { id: "wsl-m4", text: "가족에게 수상안전요원의 역할 설명해보기" },
        ],
      },
      {
        id: "stage-next",
        status: "next",
        title: "나와 연결해보기",
        missions: [
          { id: "wsl-m5", text: "수상구조사 자격증 취득 과정을 조사하기" },
          { id: "wsl-m6", text: "수상안전요원에게 필요한 능력 3가지 적기" },
          { id: "wsl-m7", text: "수영 관련 활동이나 교육 프로그램 탐색하기" },
          { id: "wsl-m8", text: "체육·안전·보건 과목 중 이 직업과 연결되는 것 탐색하기" },
        ],
      },
      {
        id: "stage-future",
        status: "future",
        title: "작은 프로젝트 해보기",
        missions: [
          { id: "wsl-m9",  text: "수상 안전 체크리스트를 직접 만들어 가족과 공유하기" },
          { id: "wsl-m10", text: "수상안전·체육·해양 관련 학과나 진학 경로 조사하기" },
          { id: "wsl-m11", text: "수상안전요원·해양레저 전문가·스포츠 안전관리자 차이 정리하기" },
          { id: "wsl-m12", text: "부모님과 안전 직업의 중요성과 나의 관심사에 대해 이야기 나눠보기" },
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
