/**
 * 관심 운동 기반 진로 확장 정적 데이터
 *
 * 아이가 좋아하는 운동을 출발점으로 관련 직업군을 탐색할 수 있도록 연결 데이터를 제공한다.
 *
 * 원칙:
 * - 운동 종목(축구, 야구 등)은 직업이 아니라 관심 분야(진로 출발점)로 관리한다.
 * - 운동선수 직업군(축구선수 등)은 representativeDream에만 표현하고, occupation slug로 연결하지 않는다.
 * - 연결 직업(careerLinks)은 실제 occupation_master에 존재하는 slug만 사용한다.
 * - 부정적 표현("선수가 못 되면" 등)을 사용하지 않는다.
 *
 * 관련 설계 문서: docs/sports-interest-career-expansion-design.md
 * 작성일: 2026-05-26
 */

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export type SportsInterestSlug =
  | "soccer"
  | "baseball"
  | "basketball"
  | "volleyball"
  | "swimming"
  | "taekwondo-martial-arts"
  | "jump-rope"
  | "golf"
  | "esports"
  | "outdoor";

export type SportCareerRelationType =
  | "coaching"
  | "analysis"
  | "technology"
  | "health"
  | "content"
  | "business"
  | "safety"
  | "leisure"
  | "education";

export interface SportsInterestCareerLink {
  /** 연결 직업의 occupation_master slug */
  occupationSlug: string;
  /** 연결 방향 분류 */
  relationType: SportCareerRelationType;
  /** 화면 표시용 짧은 레이블 */
  label: string;
  /** 이 직업과 관심 운동이 연결되는 이유 */
  reason: string;
}

/**
 * 종목별 "선수의 길" 안내 데이터.
 * - occupation_master에 추가하지 않고, 관심 운동 화면의 안내 카드로만 표시한다.
 * - /explore/[id] 상세로 연결하지 않는다(정보 카드).
 * - 부정적 표현("선수가 못 되면" 등) 금지, 확장형 메시지 유지.
 */
export interface SportsAthletePath {
  /** 선수 직업명 (예: "축구선수") */
  title: string;
  /** 짧은 설명 */
  description: string;
  /** 필요한 힘 태그 */
  strengths: string[];
  /** 지금 해볼 수 있는 작은 활동 2~3개 */
  starterActions: string[];
  /** 안전/균형 안내 문구 */
  safetyNote?: string;
}

export interface SportsInterestItem {
  /** 관심 운동 식별 slug */
  slug: SportsInterestSlug;
  /** 관심 운동 한글명 */
  nameKo: string;
  /** 대표 꿈 예시 — occupation_master에 없는 직업명(향후 별도 검토) */
  representativeDream: string;
  /** 관심 운동 설명 문구 */
  description: string;
  /** 검색·추천 확장을 위한 키워드 */
  keywords: string[];
  /** 연결 직업 목록 */
  careerLinks: SportsInterestCareerLink[];
  /** 종목별 "선수의 길" 안내 (occupation_master 미추가, 정보 카드 전용) */
  athletePath?: SportsAthletePath;
  /** 화면 노출 순서 */
  displayOrder: number;
  /** 활성 여부 */
  isActive: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
// Data
// ──────────────────────────────────────────────────────────────────────────────

export const sportsInterestData: SportsInterestItem[] = [
  // ① 축구
  {
    slug: "soccer",
    nameKo: "축구",
    representativeDream: "축구선수",
    description:
      "축구를 좋아하는 아이는 경기를 직접 뛰는 길뿐 아니라 분석, 지도, 건강 관리, 콘텐츠, 마케팅, 안전 관리 등 다양한 스포츠 직업을 함께 탐색해볼 수 있습니다.",
    keywords: ["축구", "팀워크", "경기", "전략", "체력", "스포츠", "드리블", "골"],
    careerLinks: [
      {
        occupationSlug: "youth-sports-coach",
        relationType: "coaching",
        label: "운동 기본기와 협동심을 가르쳐요",
        reason:
          "축구를 좋아하는 아이가 지도와 교육 방향으로 확장해볼 수 있는 직업입니다.",
      },
      {
        occupationSlug: "sports-data-analyst",
        relationType: "analysis",
        label: "경기를 기록과 숫자로 분석해요",
        reason: "축구 경기 흐름과 선수 움직임을 데이터로 살펴보는 직업입니다.",
      },
      {
        occupationSlug: "sports-tech-developer",
        relationType: "technology",
        label: "스포츠 기술을 만들어요",
        reason:
          "훈련 앱, 경기 분석 시스템 등 축구와 기술을 연결해볼 수 있습니다.",
      },
      {
        occupationSlug: "exercise-prescription-specialist",
        relationType: "health",
        label: "몸 상태에 맞는 운동을 설계해요",
        reason:
          "체력과 건강 관리를 통해 운동을 더 안전하게 이어갈 수 있도록 돕습니다.",
      },
      {
        occupationSlug: "sports-content-planner",
        relationType: "content",
        label: "축구 이야기를 콘텐츠로 전해요",
        reason:
          "경기, 선수, 팀 이야기를 영상이나 글로 기획하는 직업과 연결됩니다.",
      },
      {
        occupationSlug: "sports-marketer",
        relationType: "business",
        label: "팀과 팬을 연결해요",
        reason:
          "구단, 선수, 브랜드, 팬 경험을 기획하는 스포츠 산업 직업입니다.",
      },
      {
        occupationSlug: "sports-safety-manager",
        relationType: "safety",
        label: "안전한 경기 환경을 만들어요",
        reason:
          "학교 체육이나 경기장에서 사고를 예방하고 안전한 활동을 돕습니다.",
      },
    ],
    athletePath: {
      title: "축구선수",
      description:
        "팀원들과 함께 경기를 뛰며 골을 만들고, 전술과 체력을 바탕으로 경기장에서 실력을 보여주는 직업이에요.",
      strengths: ["협동심", "빠른 판단력", "체력", "공간 이해력"],
      starterActions: [
        "하루 10분 드리블 연습하기",
        "좋아하는 선수의 움직임 관찰하기",
        "친구와 패스 연습하기",
      ],
      safetyNote: "무리한 훈련보다 즐겁고 안전한 연습부터 시작해요.",
    },
    displayOrder: 1,
    isActive: true,
  },

  // ② 야구
  {
    slug: "baseball",
    nameKo: "야구",
    representativeDream: "야구선수",
    description:
      "야구를 좋아하는 아이는 경기를 직접 뛰는 꿈 외에도 기록과 분석, 팀 전략, 선수 건강 관리, 팬 콘텐츠, 구단 마케팅 등 다양한 방향으로 야구와 연결된 직업을 탐색해볼 수 있습니다.",
    keywords: ["야구", "기록", "분석", "팀", "투수", "타자", "구단", "스포츠"],
    careerLinks: [
      {
        occupationSlug: "sports-data-analyst",
        relationType: "analysis",
        label: "경기 기록을 분석해요",
        reason:
          "야구는 타율, 방어율, 출루율 등 데이터 분석이 특히 발달한 스포츠입니다.",
      },
      {
        occupationSlug: "sports-tech-developer",
        relationType: "technology",
        label: "스포츠 기술을 개발해요",
        reason:
          "투구 분석 장비, 타격 훈련 앱 등 야구와 기술 개발을 연결해볼 수 있습니다.",
      },
      {
        occupationSlug: "exercise-prescription-specialist",
        relationType: "health",
        label: "선수의 몸 상태를 관리해요",
        reason:
          "선수와 일반인 모두의 체력과 건강 유지를 위한 운동 프로그램을 설계합니다.",
      },
      {
        occupationSlug: "sports-content-planner",
        relationType: "content",
        label: "야구 이야기를 콘텐츠로 전해요",
        reason:
          "경기 하이라이트, 선수 스토리, 구단 소식을 콘텐츠로 기획합니다.",
      },
      {
        occupationSlug: "sports-marketer",
        relationType: "business",
        label: "팬과 구단을 연결해요",
        reason:
          "야구 구단·브랜드 마케팅, 팬 이벤트 기획 등 스포츠 비즈니스와 연결됩니다.",
      },
      {
        occupationSlug: "youth-sports-coach",
        relationType: "coaching",
        label: "야구 기본기를 가르쳐요",
        reason:
          "어린이·청소년에게 야구의 기초와 팀 협동심을 가르치는 지도자 직업입니다.",
      },
      {
        occupationSlug: "sports-safety-manager",
        relationType: "safety",
        label: "경기장 안전을 책임져요",
        reason:
          "경기장 시설 점검과 사고 예방을 통해 안전한 야구 환경을 만듭니다.",
      },
    ],
    athletePath: {
      title: "야구선수",
      description:
        "타격, 수비, 주루, 투구처럼 역할을 나누어 팀 경기에서 실력을 발휘하는 직업이에요.",
      strengths: ["집중력", "순발력", "반복 연습", "팀워크"],
      starterActions: [
        "캐치볼 연습하기",
        "경기 규칙 하나씩 알아보기",
        "타격 자세 영상 관찰하기",
      ],
      safetyNote: "무리한 훈련보다 즐겁고 안전한 연습부터 시작해요.",
    },
    displayOrder: 2,
    isActive: true,
  },

  // ③ 농구
  {
    slug: "basketball",
    nameKo: "농구",
    representativeDream: "농구선수",
    description:
      "농구를 좋아하는 아이는 경기를 직접 뛰는 꿈 외에도 팀워크, 순발력, 경기 흐름 분석, 콘텐츠, 안전한 학교 체육 등 다양한 방향으로 농구와 연결된 직업을 탐색해볼 수 있습니다.",
    keywords: ["농구", "팀워크", "순발력", "경기", "전략", "스포츠", "드리블", "슛"],
    careerLinks: [
      {
        occupationSlug: "youth-sports-coach",
        relationType: "coaching",
        label: "농구 기본기를 가르쳐요",
        reason:
          "어린이·청소년에게 농구의 기초 기술과 팀 협동심을 지도하는 직업입니다.",
      },
      {
        occupationSlug: "sports-data-analyst",
        relationType: "analysis",
        label: "경기 흐름을 데이터로 분석해요",
        reason:
          "선수 움직임, 득점 패턴, 팀 전술을 데이터로 분석하는 직업입니다.",
      },
      {
        occupationSlug: "exercise-prescription-specialist",
        relationType: "health",
        label: "건강한 몸 관리를 도와요",
        reason:
          "농구에 필요한 체력, 순발력, 관절 건강을 관리하는 운동 프로그램을 설계합니다.",
      },
      {
        occupationSlug: "sports-content-planner",
        relationType: "content",
        label: "농구 콘텐츠를 기획해요",
        reason:
          "경기 하이라이트, 선수 스토리, 농구 문화를 콘텐츠로 만드는 직업입니다.",
      },
      {
        occupationSlug: "sports-marketer",
        relationType: "business",
        label: "팀과 팬을 이어줘요",
        reason:
          "농구단·브랜드 마케팅, 팬 이벤트 기획 등 스포츠 비즈니스와 연결됩니다.",
      },
      {
        occupationSlug: "sports-safety-manager",
        relationType: "safety",
        label: "경기장과 체육관 안전을 책임져요",
        reason:
          "체육관 시설 점검, 부상 예방 관리 등 안전한 농구 환경을 만듭니다.",
      },
      {
        occupationSlug: "sports-tech-developer",
        relationType: "technology",
        label: "스포츠 기술을 개발해요",
        reason:
          "농구 훈련 분석 앱, 슈팅 측정 장비 등 기술 개발과 연결해볼 수 있습니다.",
      },
    ],
    athletePath: {
      title: "농구선수",
      description:
        "빠른 움직임과 패스, 슛, 수비를 통해 팀의 득점을 만들어가는 직업이에요.",
      strengths: ["민첩성", "판단력", "협동심", "균형감각"],
      starterActions: [
        "드리블 30번 연속 도전하기",
        "자유투 자세 연습하기",
        "경기에서 패스 장면 찾아보기",
      ],
      safetyNote: "무리한 훈련보다 즐겁고 안전한 연습부터 시작해요.",
    },
    displayOrder: 3,
    isActive: true,
  },

  // ④ 배구
  {
    slug: "volleyball",
    nameKo: "배구",
    representativeDream: "배구선수",
    description:
      "배구를 좋아하는 아이는 경기를 직접 뛰는 꿈 외에도 팀 협동심, 기본기 지도, 경기 분석, 콘텐츠, 안전 관리 등 다양한 방향으로 배구와 연결된 직업을 탐색해볼 수 있습니다.",
    keywords: ["배구", "협동심", "팀", "스파이크", "리시브", "경기", "스포츠"],
    careerLinks: [
      {
        occupationSlug: "youth-sports-coach",
        relationType: "coaching",
        label: "배구 기본기를 가르쳐요",
        reason:
          "어린이·청소년에게 배구의 기초 동작과 팀 협동 방법을 지도하는 직업입니다.",
      },
      {
        occupationSlug: "sports-data-analyst",
        relationType: "analysis",
        label: "경기 기록을 분석해요",
        reason:
          "서브 효율, 공격 성공률 등 경기 데이터를 분석해 팀 전술에 활용합니다.",
      },
      {
        occupationSlug: "exercise-prescription-specialist",
        relationType: "health",
        label: "관절과 체력 관리를 도와요",
        reason:
          "배구에 필요한 순발력·체력 향상과 부상 예방 운동 프로그램을 설계합니다.",
      },
      {
        occupationSlug: "sports-content-planner",
        relationType: "content",
        label: "배구 이야기를 콘텐츠로 전해요",
        reason:
          "경기 하이라이트, 선수 스토리, 배구 문화를 콘텐츠로 기획하는 직업입니다.",
      },
      {
        occupationSlug: "sports-safety-manager",
        relationType: "safety",
        label: "경기장 안전을 책임져요",
        reason:
          "경기장 시설 점검, 부상 예방 관리로 안전한 배구 환경을 만듭니다.",
      },
      {
        occupationSlug: "sports-marketer",
        relationType: "business",
        label: "팀과 팬을 이어줘요",
        reason:
          "배구 구단·브랜드 마케팅, 팬 이벤트 기획 등 스포츠 비즈니스와 연결됩니다.",
      },
    ],
    athletePath: {
      title: "배구선수",
      description:
        "서브, 리시브, 토스, 공격처럼 역할을 나누어 공을 연결하고 득점을 만드는 직업이에요.",
      strengths: ["반응속도", "팀워크", "집중력", "점프력"],
      starterActions: [
        "공을 떨어뜨리지 않고 받아보기",
        "배구 포지션 알아보기",
        "서브 동작 따라 해보기",
      ],
      safetyNote: "무리한 훈련보다 즐겁고 안전한 연습부터 시작해요.",
    },
    displayOrder: 4,
    isActive: true,
  },

  // ⑤ 수영
  {
    slug: "swimming",
    nameKo: "수영",
    representativeDream: "수영선수",
    description:
      "수영을 좋아하는 아이는 경기를 직접 뛰는 꿈 외에도 수상 안전, 건강 관리, 해양 레저, 지도자, 콘텐츠 등 다양한 방향으로 수영과 연결된 직업을 탐색해볼 수 있습니다.",
    keywords: ["수영", "수상안전", "건강", "해양", "체력", "스포츠", "물", "레저"],
    careerLinks: [
      {
        occupationSlug: "exercise-prescription-specialist",
        relationType: "health",
        label: "건강한 몸 관리를 도와요",
        reason:
          "수영을 활용한 재활, 체력 향상, 건강 유지 운동 프로그램을 설계하는 직업입니다.",
      },
      {
        occupationSlug: "water-safety-lifeguard",
        relationType: "safety",
        label: "수상 안전을 책임져요",
        reason:
          "수영장·해수욕장에서 이용객 안전을 지키고 위급 상황에 대응하는 직업입니다.",
      },
      {
        occupationSlug: "marine-leisure-specialist",
        relationType: "leisure",
        label: "바다와 강에서 레저 스포츠를 가르쳐요",
        reason:
          "스킨스쿠버, 카약, 서핑 등 수상 레저 스포츠를 운영·지도하는 직업입니다.",
      },
      {
        occupationSlug: "youth-sports-coach",
        relationType: "coaching",
        label: "어린이·청소년에게 수영을 가르쳐요",
        reason:
          "수영 기초부터 안전 수칙까지 눈높이에 맞게 지도하는 직업입니다.",
      },
      {
        occupationSlug: "sports-content-planner",
        relationType: "content",
        label: "수영 콘텐츠를 기획해요",
        reason:
          "경기 영상, 수영 기술 소개, 수상 레저 이야기를 콘텐츠로 만드는 직업입니다.",
      },
      {
        occupationSlug: "sports-safety-manager",
        relationType: "safety",
        label: "수영장·경기장 안전 환경을 만들어요",
        reason:
          "수영 시설과 경기장의 안전을 점검하고 사고를 예방하는 직업입니다.",
      },
    ],
    athletePath: {
      title: "수영선수",
      description:
        "물속에서 자유형, 배영, 평영, 접영 같은 영법을 훈련하고 기록을 겨루는 직업이에요.",
      strengths: ["지구력", "호흡 조절", "자기관리", "꾸준함"],
      starterActions: [
        "안전한 환경에서 기본 발차기 연습하기",
        "수영 영법 이름 알아보기",
        "수영 경기 영상 보고 기록 방식 알아보기",
      ],
      safetyNote: "반드시 보호자와 함께 안전한 환경에서 시작해요.",
    },
    displayOrder: 5,
    isActive: true,
  },

  // ⑥ 태권도·무도
  {
    slug: "taekwondo-martial-arts",
    nameKo: "태권도·무도",
    representativeDream: "태권도 선수",
    description:
      "태권도나 무도를 좋아하는 아이는 선수 외에도 지도자, 건강 관리 전문가, 콘텐츠 기획자, 스포츠 마케터 등 다양한 직업과 연결해볼 수 있습니다.",
    keywords: ["태권도", "무도", "무술", "기본기", "예절", "체력", "스포츠", "경기"],
    careerLinks: [
      {
        occupationSlug: "youth-sports-coach",
        relationType: "coaching",
        label: "기본기와 예절을 가르쳐요",
        reason:
          "어린이·청소년에게 태권도 기초 동작, 예절, 정신력을 지도하는 직업입니다.",
      },
      {
        occupationSlug: "exercise-prescription-specialist",
        relationType: "health",
        label: "체력과 건강 관리를 설계해요",
        reason:
          "태권도 훈련에 맞는 체력 강화 및 부상 예방 운동 프로그램을 설계합니다.",
      },
      {
        occupationSlug: "sports-safety-manager",
        relationType: "safety",
        label: "훈련장·경기장 안전을 책임져요",
        reason:
          "도장·경기장 환경을 점검하고 선수와 수련생이 안전하게 활동할 수 있도록 합니다.",
      },
      {
        occupationSlug: "sports-content-planner",
        relationType: "content",
        label: "태권도 이야기를 콘텐츠로 전해요",
        reason:
          "경기 영상, 기술 소개, 태권도 문화를 콘텐츠로 기획하는 직업입니다.",
      },
      {
        occupationSlug: "sports-marketer",
        relationType: "business",
        label: "스포츠 브랜드와 대회를 알려요",
        reason:
          "태권도 대회, 도장 홍보, 스포츠 브랜드 마케팅 등 비즈니스 방향과 연결됩니다.",
      },
      {
        occupationSlug: "sports-data-analyst",
        relationType: "analysis",
        label: "경기 기록을 분석해요",
        reason:
          "경기 영상과 기록 데이터를 분석해 전술 개선에 활용하는 직업입니다.",
      },
    ],
    athletePath: {
      title: "태권도 선수",
      description:
        "품새, 겨루기, 기본 동작을 꾸준히 훈련하며 몸과 마음의 균형을 키우는 직업이에요.",
      strengths: ["예의", "집중력", "순발력", "절제력"],
      starterActions: [
        "기본 자세 바르게 서기",
        "품새 동작 하나 연습하기",
        "태권도 경기 규칙 알아보기",
      ],
      safetyNote: "무리한 훈련보다 즐겁고 안전한 연습부터 시작해요.",
    },
    displayOrder: 6,
    isActive: true,
  },

  // ⑦ 줄넘기
  {
    slug: "jump-rope",
    nameKo: "줄넘기",
    representativeDream: "줄넘기 선수",
    description:
      "줄넘기는 아이들이 학교와 일상에서 쉽게 접할 수 있는 운동입니다. 단순한 놀이처럼 보일 수 있지만 체력, 리듬감, 순발력, 꾸준함을 기르는 활동이기도 합니다. 줄넘기를 좋아하는 아이는 줄넘기 선수나 음악줄넘기 퍼포머뿐 아니라 유소년 스포츠 지도자, 방과후교사, 운동처방사, 스포츠 콘텐츠 기획자 같은 직업도 함께 탐색해볼 수 있습니다.",
    keywords: [
      "줄넘기",
      "음악줄넘기",
      "리듬줄넘기",
      "체력",
      "리듬감",
      "순발력",
      "방과후",
      "학교체육",
      "꾸준함",
    ],
    careerLinks: [
      {
        occupationSlug: "youth-sports-coach",
        relationType: "coaching",
        label: "줄넘기와 체력 운동을 가르쳐요",
        reason:
          "어린이·청소년에게 줄넘기 기초와 체력 운동을 즐겁게 지도하는 직업입니다.",
      },
      {
        occupationSlug: "after-school-teacher",
        relationType: "education",
        label: "방과후 줄넘기 수업을 운영해요",
        reason:
          "학교 방과후 프로그램에서 줄넘기·체력 수업을 기획하고 가르치는 직업입니다.",
      },
      {
        occupationSlug: "exercise-prescription-specialist",
        relationType: "health",
        label: "체력 향상 프로그램을 설계해요",
        reason:
          "줄넘기를 활용한 체력 강화, 리듬 운동, 건강 관리 프로그램을 설계하는 직업입니다.",
      },
      {
        occupationSlug: "sports-content-planner",
        relationType: "content",
        label: "음악줄넘기·줄넘기 콘텐츠를 기획해요",
        reason:
          "음악줄넘기 퍼포먼스, 줄넘기 챌린지 등 다양한 콘텐츠를 기획하는 직업입니다.",
      },
      {
        occupationSlug: "sports-safety-manager",
        relationType: "safety",
        label: "학교 체육 환경을 안전하게 만들어요",
        reason:
          "체육 활동 중 발생할 수 있는 사고를 예방하고 안전한 환경을 만드는 직업입니다.",
      },
      {
        occupationSlug: "sports-data-analyst",
        relationType: "analysis",
        label: "운동 기록과 데이터를 분석해요",
        reason:
          "줄넘기 횟수, 리듬, 체력 변화 같은 데이터를 기록하고 분석하는 방향으로 연결됩니다.",
      },
    ],
    athletePath: {
      title: "줄넘기 선수",
      description:
        "빠른 발놀림과 리듬감, 체력을 바탕으로 다양한 기술과 기록에 도전하는 직업이에요.",
      strengths: ["리듬감", "지구력", "순발력", "꾸준함"],
      starterActions: [
        "1분 동안 줄넘기 횟수 기록하기",
        "새로운 줄넘기 기술 하나 연습하기",
        "친구와 기록 비교해보기",
      ],
      safetyNote: "무리한 훈련보다 즐겁고 안전한 연습부터 시작해요.",
    },
    displayOrder: 7,
    isActive: true,
  },

  // ⑧ 골프
  {
    slug: "golf",
    nameKo: "골프",
    representativeDream: "골프선수",
    description:
      "골프를 좋아하는 아이는 선수 외에도 집중력과 기록 분석, 코칭, 스포츠 브랜드, 콘텐츠 기획 등 다양한 방향으로 골프와 연결된 직업을 탐색해볼 수 있습니다.",
    keywords: ["골프", "집중력", "분석", "코스", "자세", "체력", "스포츠", "브랜드"],
    careerLinks: [
      {
        occupationSlug: "youth-sports-coach",
        relationType: "coaching",
        label: "올바른 자세와 기본기를 가르쳐요",
        reason:
          "어린이·청소년에게 골프 기초 자세와 집중력 훈련을 지도하는 직업입니다.",
      },
      {
        occupationSlug: "sports-data-analyst",
        relationType: "analysis",
        label: "스윙과 경기 기록을 분석해요",
        reason:
          "스윙 궤도, 클럽별 거리, 라운드 기록 데이터를 분석해 실력 향상에 활용합니다.",
      },
      {
        occupationSlug: "sports-tech-developer",
        relationType: "technology",
        label: "골프 기술 기기를 만들어요",
        reason:
          "스윙 분석 앱, 스마트 골프 장갑, 가상 코스 시뮬레이터 같은 기술 제품을 개발합니다.",
      },
      {
        occupationSlug: "sports-content-planner",
        relationType: "content",
        label: "골프 이야기를 콘텐츠로 전해요",
        reason:
          "선수 스토리, 코스 소개, 골프 기술 영상 등 다양한 콘텐츠를 기획하는 직업입니다.",
      },
      {
        occupationSlug: "sports-marketer",
        relationType: "business",
        label: "골프 브랜드와 대회를 알려요",
        reason:
          "골프 용품 브랜드, 대회 스폰서십, 팬 마케팅 등 스포츠 비즈니스와 연결됩니다.",
      },
      {
        occupationSlug: "exercise-prescription-specialist",
        relationType: "health",
        label: "자세와 체력 관리를 설계해요",
        reason:
          "골프에 필요한 코어 근력, 유연성, 부상 예방 운동 프로그램을 설계하는 직업입니다.",
      },
      {
        occupationSlug: "sports-safety-manager",
        relationType: "safety",
        label: "골프장 안전 환경을 만들어요",
        reason:
          "골프 코스·클럽하우스 안전 관리로 이용객이 안전하게 즐길 수 있도록 합니다.",
      },
    ],
    athletePath: {
      title: "골프선수",
      description:
        "정확한 스윙과 집중력을 바탕으로 코스 전략을 세우고 경기를 운영하는 직업이에요.",
      strengths: ["집중력", "침착함", "균형감각", "전략적 사고"],
      starterActions: [
        "퍼팅 자세 연습하기",
        "골프 경기 규칙 알아보기",
        "선수들이 코스를 읽는 방법 관찰하기",
      ],
      safetyNote: "무리한 훈련보다 즐겁고 안전한 연습부터 시작해요.",
    },
    displayOrder: 8,
    isActive: true,
  },

  // ⑨ e스포츠
  {
    slug: "esports",
    nameKo: "e스포츠",
    representativeDream: "e스포츠 선수",
    description:
      "e스포츠를 좋아하는 아이는 선수 외에도 게임 전략 분석, 기술 개발, 콘텐츠 기획, 건강한 생활 관리, 스포츠 마케팅 등 다양한 방향으로 e스포츠와 연결된 직업을 탐색해볼 수 있습니다. 집중력, 팀워크, 전략적 사고력은 e스포츠뿐 아니라 다양한 분야에서 활용되는 능력입니다.",
    keywords: [
      "e스포츠",
      "게임",
      "전략",
      "팀워크",
      "집중력",
      "콘텐츠",
      "기술",
      "분석",
      "스트리밍",
    ],
    careerLinks: [
      {
        occupationSlug: "sports-data-analyst",
        relationType: "analysis",
        label: "경기 데이터와 전략을 분석해요",
        reason:
          "팀 전략, 선수 퍼포먼스, 경기 흐름 데이터를 분석하는 직업입니다.",
      },
      {
        occupationSlug: "sports-tech-developer",
        relationType: "technology",
        label: "e스포츠 기술과 플랫폼을 만들어요",
        reason:
          "경기 분석 도구, 관람 플랫폼, 훈련 시뮬레이터 등 기술 제품을 개발합니다.",
      },
      {
        occupationSlug: "sports-content-planner",
        relationType: "content",
        label: "e스포츠 콘텐츠를 기획해요",
        reason:
          "경기 하이라이트, 선수 인터뷰, 전략 분석 영상 등 콘텐츠를 기획하는 직업입니다.",
      },
      {
        occupationSlug: "sports-marketer",
        relationType: "business",
        label: "팀과 브랜드를 알려요",
        reason:
          "e스포츠 구단·대회 마케팅, 스폰서십 유치, 팬 커뮤니티 운영과 연결됩니다.",
      },
      {
        occupationSlug: "exercise-prescription-specialist",
        relationType: "health",
        label: "건강한 생활 관리를 설계해요",
        reason:
          "장시간 활동에 필요한 바른 자세, 눈 건강, 스트레칭 등 건강 관리 방법을 설계합니다.",
      },
      {
        occupationSlug: "sports-safety-manager",
        relationType: "safety",
        label: "경기장·훈련 환경 안전을 관리해요",
        reason:
          "e스포츠 경기장과 훈련 시설의 안전 환경을 점검하고 관리하는 직업입니다.",
      },
    ],
    athletePath: {
      title: "e스포츠 선수",
      description:
        "게임 이해도, 빠른 판단, 팀 전략을 바탕으로 대회에서 실력을 겨루는 직업이에요.",
      strengths: ["빠른 판단력", "전략적 사고", "손과 눈의 협응", "팀워크"],
      starterActions: [
        "게임 시간을 정해두고 연습하기",
        "경기 리플레이를 보며 전략 찾기",
        "팀원과 역할을 나누어 플레이해보기",
      ],
      safetyNote: "정해진 시간을 지키고 바른 자세·눈 건강을 함께 챙기는 습관이 중요해요.",
    },
    displayOrder: 9,
    isActive: true,
  },

  // ⑩ 캠핑·등산·아웃도어
  {
    slug: "outdoor",
    nameKo: "캠핑·등산·아웃도어",
    representativeDream: "아웃도어 활동가",
    description:
      "캠핑, 등산, 트레킹, 자연 체험을 좋아하는 아이는 자연 속에서 활동하고 싶은 마음을 다양한 직업으로 연결해볼 수 있습니다. 야외 레저 프로그램 기획, 수상 안전, 콘텐츠 제작 등 자연과 사람을 함께 생각하는 직업들이 연결됩니다.",
    keywords: [
      "캠핑",
      "등산",
      "아웃도어",
      "트레킹",
      "자연",
      "레저",
      "안전",
      "체험",
      "해양",
    ],
    careerLinks: [
      {
        occupationSlug: "outdoor-leisure-planner",
        relationType: "leisure",
        label: "야외 레저 프로그램을 기획해요",
        reason:
          "캠핑, 등산, 트레킹 등 야외 활동 프로그램을 기획하고 운영하는 직업입니다.",
      },
      {
        occupationSlug: "marine-leisure-specialist",
        relationType: "leisure",
        label: "바다와 강에서 레저 활동을 운영해요",
        reason:
          "수상 스포츠, 해양 체험 등 아웃도어 활동을 지도하고 운영하는 직업입니다.",
      },
      {
        occupationSlug: "water-safety-lifeguard",
        relationType: "safety",
        label: "수상 안전을 책임져요",
        reason:
          "강, 바다, 수상 레저 공간에서 이용객의 안전을 지키는 직업입니다.",
      },
      {
        occupationSlug: "sports-safety-manager",
        relationType: "safety",
        label: "야외 활동 안전 환경을 만들어요",
        reason:
          "야외 레저 공간의 위험 요소를 점검하고 사고를 예방하는 직업입니다.",
      },
      {
        occupationSlug: "sports-content-planner",
        relationType: "content",
        label: "자연과 아웃도어 이야기를 콘텐츠로 전해요",
        reason:
          "캠핑 영상, 등산 기록, 자연 체험 콘텐츠를 기획하고 만드는 직업입니다.",
      },
      {
        occupationSlug: "sports-tech-developer",
        relationType: "technology",
        label: "아웃도어 기술 제품을 만들어요",
        reason:
          "등산 경로 앱, 안전 웨어러블, 날씨 연동 레저 서비스 등 기술 제품을 개발합니다.",
      },
      {
        occupationSlug: "exercise-prescription-specialist",
        relationType: "health",
        label: "야외 활동에 맞는 체력 관리를 도와요",
        reason:
          "등산·트레킹에 필요한 근력, 지구력 강화 운동 프로그램을 설계하는 직업입니다.",
      },
    ],
    athletePath: {
      title: "아웃도어 활동 전문가",
      description:
        "자연 속에서 안전하게 활동하고, 장비와 날씨를 이해하며 다양한 야외 활동을 돕는 전문가예요.",
      strengths: ["안전 판단력", "체력", "관찰력", "장비 이해력"],
      starterActions: [
        "안전한 산책 코스 기록하기",
        "캠핑 장비 이름 알아보기",
        "날씨와 지형을 확인하는 습관 만들기",
      ],
      safetyNote: "반드시 보호자와 함께, 장비를 점검하고 무리하지 않는 것이 가장 중요해요.",
    },
    displayOrder: 10,
    isActive: true,
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 관심 운동 slug로 단일 항목을 조회한다.
 */
export function getSportsInterestBySlug(
  slug: string
): SportsInterestItem | undefined {
  return sportsInterestData.find((item) => item.slug === slug);
}

/**
 * 직업 slug와 연결된 관심 운동 목록을 반환한다.
 * 예: "sports-data-analyst"를 넣으면 해당 직업과 연결된 관심 운동 목록을 반환.
 */
export function getSportsInterestsByOccupationSlug(
  occupationSlug: string
): SportsInterestItem[] {
  return sportsInterestData.filter((item) =>
    item.careerLinks.some((link) => link.occupationSlug === occupationSlug)
  );
}

/**
 * 관심 운동 slug의 연결 직업 목록(careerLinks)을 반환한다.
 */
export function getRelatedOccupationsBySportSlug(
  slug: string
): SportsInterestCareerLink[] {
  return getSportsInterestBySlug(slug)?.careerLinks ?? [];
}
