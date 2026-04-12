// ====================================================
// 명따라 사주 계산 엔진
//
// [계산 기준]
//   년주: (연도 - 4) % 10 / % 12
//   월주: 월건법 — 년간 그룹 × 양력 월 근사
//   일주: JDN 기반 60갑자 순환 (기준: 2000-01-01 = 甲辰, index=40)
//   시주: 일간 그룹 × 시지(時支)
//   오행: 4주 × (천간+지지) = 8요소 집계
//
// [면책]
//   - 음력 변환 미구현 (양력 기준 계산)
//   - 절기(입춘 등) 경계 미반영 — 근사값
//   - 참고용 진로 분석 서비스 (운명 판단 아님)
// ====================================================

import type { SajuInputData, SajuResult, SajuPillar, OhaengElement } from "@/types/myeonddara";

// ── 천간(天干) 10개 ───────────────────────────────────────────
const CHEONGAN_HANJA = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"] as const;
const CHEONGAN_KO    = ["갑","을","병","정","무","기","경","신","임","계"] as const;

// ── 지지(地支) 12개 ───────────────────────────────────────────
const JIJI_HANJA = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"] as const;
const JIJI_KO    = ["자","축","인","묘","진","사","오","미","신","유","술","해"] as const;

// ── 천간 → 오행 인덱스 (木=0, 火=1, 土=2, 金=3, 水=4) ────────
//    甲乙=木, 丙丁=火, 戊己=土, 庚辛=金, 壬癸=水
const STEM_OHAENG: readonly number[] = [0,0,1,1,2,2,3,3,4,4];

// ── 지지 → 오행 인덱스 ───────────────────────────────────────
//    子=水, 丑=土, 寅=木, 卯=木, 辰=土, 巳=火
//    午=火, 未=土, 申=金, 酉=金, 戌=土, 亥=水
const BRANCH_OHAENG: readonly number[] = [4,2,0,0,2,1,1,2,3,3,2,4];

// ── 오행 UI 메타 ──────────────────────────────────────────────
const OHAENG_META = [
  { name: "목(木)", emoji: "🌲", color: "#4CAF50" },
  { name: "화(火)", emoji: "🔥", color: "#E84B2E" },
  { name: "토(土)", emoji: "⛰️", color: "#8D6E63" },
  { name: "금(金)", emoji: "⚙️", color: "#9E9E9E" },
  { name: "수(水)", emoji: "🌊", color: "#2196F3" },
] as const;

// ── 년간 그룹별 인월(1월) 월건 시작 천간 ─────────────────────
//    갑기년(0,5)→丙(2), 을경년(1,6)→戊(4)
//    병신년(2,7)→庚(6), 정임년(3,8)→壬(8), 무계년(4,9)→甲(0)
const YEAR_GROUP_MONTH_START = [2, 4, 6, 8, 0] as const;

// ── 일간 그룹별 자시(子) 시주 시작 천간 ─────────────────────
//    갑기일(0,5)→甲(0), 을경일(1,6)→丙(2)
//    병신일(2,7)→戊(4), 정임일(3,8)→庚(6), 무계일(4,9)→壬(8)
const DAY_GROUP_HOUR_START = [0, 2, 4, 6, 8] as const;

// ── 양력 월 → 월지 인덱스 (1월=寅=2 ~ 12월=丑=1) ────────────
const MONTH_TO_JIJI: readonly number[] = [2,3,4,5,6,7,8,9,10,11,0,1];

// ── BirthTime → 지지 인덱스 ─────────────────────────────────
//    unknown일 때는 오시(午=6) 기본값 (낮 기준 중간값)
const BIRTH_TIME_TO_JIJI: Record<string, number> = {
  ja: 0, chuk: 1, in: 2, myo: 3, jin: 4, sa: 5,
  o: 6,  mi: 7,  sin: 8, yu: 9, sul: 10, hae: 11, unknown: 6,
};

// ── 오행별 결과 데이터 (인덱스: 0=木, 1=火, 2=土, 3=金, 4=水) ─
const OHAENG_RESULT_DATA = [
  {
    // 0 — 목(木)
    summary: "목(木) 기운이 강한 아이예요. 창의적이고 성장 지향적이며 새로운 것에 도전하는 것을 좋아합니다.",
    tags: ["🌱 성장 지향", "💡 창의력", "🎯 목표 의식", "📚 학습 능력"],
    desc: "새로운 것에 도전하고 끊임없이 성장하려는 의지가 강합니다. 창의적인 사고로 문제를 해결하고 사람들에게 긍정적인 영향을 주는 것을 즐깁니다.",
    careers: [
      { rank: 1, emoji: "👩‍⚕️", name: "의사·의료인",       occupationId: "doctor",                 reason: "목(木)의 성장력 + 사람을 돕는 소명",     fitScore: 91 },
      { rank: 2, emoji: "🎨",    name: "크리에이터·작가",   occupationId: "content-creator",        reason: "창의력과 표현력이 빛나는 직업",           fitScore: 87 },
      { rank: 3, emoji: "🌿",    name: "환경·생명과학자",   occupationId: "environmental-scientist", reason: "목(木) 기질의 자연 친화력과 탐구심",     fitScore: 83 },
    ],
    fortune: "나무처럼 하늘을 향해. 오늘은 새로운 배움을 시작하기 좋은 날이에요. 관심 있는 분야의 책이나 강의를 찾아보세요 🌱",
    topOccupationId: "doctor",
  },
  {
    // 1 — 화(火)
    summary: "화(火) 기운이 강한 아이예요. 열정적이고 표현력이 뛰어나며 사람들과 소통하고 자신을 드러내는 것을 즐깁니다.",
    tags: ["🔥 열정적", "🎤 표현력", "💃 카리스마", "🤝 소통 능력"],
    desc: "열정과 에너지가 넘쳐 주변을 밝게 만듭니다. 무대 위에서 빛나고 사람들에게 영감을 주는 능력이 뛰어납니다.",
    careers: [
      { rank: 1, emoji: "🎭",    name: "배우·공연예술가",     occupationId: "actor",           reason: "화(火)의 표현력과 카리스마",            fitScore: 92 },
      { rank: 2, emoji: "📢",    name: "마케터·브랜드기획자", occupationId: "marketer",         reason: "열정과 소통력이 빛나는 직업",           fitScore: 88 },
      { rank: 3, emoji: "🎨",    name: "디자이너",             occupationId: "designer",         reason: "창의적 표현의 화(火) 기운",             fitScore: 84 },
    ],
    fortune: "불꽃처럼 빛나게. 오늘은 자신을 표현하기 좋은 날이에요. 좋아하는 것을 그리거나 만들어보세요 🎨",
    topOccupationId: "actor",
  },
  {
    // 2 — 토(土)
    summary: "토(土) 기운이 강한 아이예요. 신뢰롭고 안정적이며 사람을 배려하고 공동체를 중요시합니다.",
    tags: ["🤝 신뢰감", "💚 배려심", "🏠 안정감", "👥 공동체 의식"],
    desc: "주변 사람에 대한 깊은 배려와 신뢰를 바탕으로 공동체를 이끄는 능력이 있습니다. 꾸준하고 성실한 노력으로 목표를 이룹니다.",
    careers: [
      { rank: 1, emoji: "🧑‍🏫", name: "교사·교육자",         occupationId: "teacher",        reason: "토(土)의 신뢰와 배려가 빛나는 직업",  fitScore: 90 },
      { rank: 2, emoji: "💙",    name: "상담사·사회복지사",   occupationId: "counselor",      reason: "사람을 돕는 토(土) 기질",              fitScore: 87 },
      { rank: 3, emoji: "🏛️",   name: "공무원·공공서비스",   occupationId: "public-servant", reason: "안정과 신뢰의 토(土) 성향",            fitScore: 83 },
    ],
    fortune: "흙처럼 든든하게. 오늘은 소중한 사람에게 마음을 전하기 좋은 날이에요. 감사 인사를 전해보세요 💚",
    topOccupationId: "teacher",
  },
  {
    // 3 — 금(金)
    summary: "금(金) 기운이 강한 아이예요. 정밀하고 분석적인 사고력이 뛰어나며 원칙을 중요시하고 완성도를 추구합니다.",
    tags: ["⚙️ 분석력", "📐 정밀성", "⚖️ 원칙주의", "🏆 완성도"],
    desc: "논리적이고 체계적인 사고로 복잡한 문제를 정확하게 분석합니다. 높은 기준으로 완성도를 추구하며 원칙을 중요시합니다.",
    careers: [
      { rank: 1, emoji: "⚖️",  name: "법조인·변호사",        occupationId: "lawyer",            reason: "금(金)의 원칙과 분석력",          fitScore: 91 },
      { rank: 2, emoji: "💻",  name: "소프트웨어 엔지니어",  occupationId: "software-engineer", reason: "정밀한 금(金) 기질에 최적",        fitScore: 89 },
      { rank: 3, emoji: "🔬",  name: "연구원·과학자",        occupationId: "researcher",        reason: "체계적 탐구의 금(金) 성향",        fitScore: 85 },
    ],
    fortune: "쇠처럼 단단하게. 오늘은 계획을 세우고 정리하기 좋은 날이에요. 할 일 목록을 작성해보세요 📋",
    topOccupationId: "software-engineer",
  },
  {
    // 4 — 수(水)
    summary: "수(水) 기운이 강한 아이예요. 논리적이고 분석적인 사고력이 뛰어나며 깊이 탐구하는 것을 좋아합니다.",
    tags: ["🧠 분석적 사고", "💧 유연성", "🌊 깊은 통찰", "🔍 탐구심"],
    desc: "유연하게 상황에 적응하면서도 깊이 있는 사고로 본질을 꿰뚫습니다. 지식을 탐구하고 새로운 이론을 발견하는 것을 즐깁니다.",
    careers: [
      { rank: 1, emoji: "💻", name: "소프트웨어 엔지니어", occupationId: "software-engineer", reason: "수(水)의 논리력 + 분석력",                fitScore: 92 },
      { rank: 2, emoji: "📊", name: "데이터 분석가",       occupationId: "data-analyst",      reason: "수(Water)의 분석력이 빛나는 직업",       fitScore: 88 },
      { rank: 3, emoji: "🔬", name: "연구원·과학자",       occupationId: "researcher",        reason: "깊이 탐구하는 수(Water) 기질에 최적",    fitScore: 85 },
    ],
    fortune: "물처럼 유연하게, 바다처럼 깊게. 오늘은 새로운 것을 배우기 좋은 날이에요. 관심 있는 분야의 영상이나 책을 찾아보세요 📚",
    topOccupationId: "software-engineer",
  },
] as const;

// ── 오행 강도 라벨 ─────────────────────────────────────────────
function getStrength(count: number, total: number): string {
  const pct = (count / total) * 100;
  if (pct >= 37.5) return "강함";
  if (pct >= 25)   return "보통";
  if (pct >= 12.5) return "약함";
  if (pct > 0)     return "부족";
  return "없음";
}

// ── 율리우스 절일수(JDN) — 그레고리력 ─────────────────────────
function toJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

// ────────────────────────────────────────────────────────────────
// 메인 함수: SajuInputData → SajuResult
// ────────────────────────────────────────────────────────────────
export function calculateSaju(input: SajuInputData): SajuResult {
  const [yearStr, monthStr, dayStr] = input.birthDate.split("-");
  const year  = parseInt(yearStr,  10);
  const month = parseInt(monthStr, 10);
  const day   = parseInt(dayStr,   10);

  // ── 년주(年柱) ────────────────────────────────────
  const yearStem   = ((year - 4) % 10 + 10) % 10;
  const yearBranch = ((year - 4) % 12 + 12) % 12;

  // ── 월주(月柱) ────────────────────────────────────
  const monthBranch = MONTH_TO_JIJI[month - 1];
  const monthStem   = (YEAR_GROUP_MONTH_START[yearStem % 5] + (month - 1)) % 10;

  // ── 일주(日柱) — JDN 기반 60갑자 순환 ───────────
  // 기준: 2000-01-01 = 甲辰 → 60갑자 index=40
  const BASE_JDN   = toJDN(2000, 1, 1); // 2451545
  const BASE_GAPJA = 40;               // 甲辰
  const inputJDN   = toJDN(year, month, day);
  const dayGapja   = ((inputJDN - BASE_JDN + BASE_GAPJA) % 60 + 60) % 60;
  const dayStem    = dayGapja % 10;
  const dayBranch  = dayGapja % 12;

  // ── 시주(時柱) ────────────────────────────────────
  const timeBranch = BIRTH_TIME_TO_JIJI[input.birthTime] ?? 6;
  const timeStem   = (DAY_GROUP_HOUR_START[dayStem % 5] + timeBranch) % 10;

  // ── 4주 구성 ──────────────────────────────────────
  const pillars: SajuPillar[] = [
    { label: "年柱", hanja: CHEONGAN_HANJA[yearStem]  + JIJI_HANJA[yearBranch],  korean: CHEONGAN_KO[yearStem]  + JIJI_KO[yearBranch]  },
    { label: "月柱", hanja: CHEONGAN_HANJA[monthStem] + JIJI_HANJA[monthBranch], korean: CHEONGAN_KO[monthStem] + JIJI_KO[monthBranch] },
    { label: "日柱", hanja: CHEONGAN_HANJA[dayStem]   + JIJI_HANJA[dayBranch],   korean: CHEONGAN_KO[dayStem]   + JIJI_KO[dayBranch]   },
    { label: "時柱", hanja: CHEONGAN_HANJA[timeStem]  + JIJI_HANJA[timeBranch],  korean: CHEONGAN_KO[timeStem]  + JIJI_KO[timeBranch]  },
  ];

  // ── 오행 집계 (8요소: 천간 4 + 지지 4) ─────────
  const counts = [0, 0, 0, 0, 0]; // 木 火 土 金 水
  [yearStem, monthStem, dayStem, timeStem].forEach((s) => counts[STEM_OHAENG[s]]++);
  [yearBranch, monthBranch, dayBranch, timeBranch].forEach((b) => counts[BRANCH_OHAENG[b]]++);

  const ohaeng: OhaengElement[] = OHAENG_META.map((meta, i) => ({
    ...meta,
    percent:  Math.round((counts[i] / 8) * 100),
    strength: getStrength(counts[i], 8),
  }));

  // ── 주오행 결정 (최다 오행, 동률이면 낮은 인덱스 우선) ──
  const mainIdx = counts.indexOf(Math.max(...counts));
  const data    = OHAENG_RESULT_DATA[mainIdx];

  return {
    pillars,
    ohaeng,
    ohaengSummary:   data.summary,
    personalityTags: [...data.tags],
    personalityDesc: data.desc,
    careers:         data.careers.map((c) => ({ ...c })),
    fortune:         data.fortune,
    topOccupationId: data.topOccupationId,
  };
}
