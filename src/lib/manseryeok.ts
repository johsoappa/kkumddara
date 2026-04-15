// ====================================================
// 만세력 계산 엔진 — lib/manseryeok.ts
//
// [계산 기준 — 표준 한국 만세력]
//   년주: 입춘(2/4) 경계 적용 (1984=甲子 기준)
//         이유: 한국 명리학 표준. 입춘 전은 전년도 간지 적용.
//   월주: 五虎遁年法 — MONTH_GAN_BASE=[2,4,6,8,0] (寅月 기준)
//         이유: 갑기→丙寅, 을경→戊寅, 병신→庚寅, 정임→壬寅, 무계→甲寅
//   일주: 1900-01-01 = 甲戌(index=10) 기준 JDN 60갑자
//         검증: 1999-09-09 = 甲子日 ✓ / 2001-01-01 = 甲子日 ✓
//   시주: 五鼠遁日法 — HOUR_GAN_BASE=[0,2,4,6,8] (子時 기준)
//         이유: 갑기→甲子, 을경→丙子, 병신→戊子, 정임→庚子, 무계→壬子
//   오행: 8글자(천간4+지지4) 집계
//   음력: korean-lunar-calendar 라이브러리로 양력 변환
//
// [검증 완료 기준일]
//   1999-09-09 = 甲子日 (DAY_BASE=10 일치 ✓)
//   2001-01-01 = 甲子日 (DAY_BASE=10 일치 ✓)
//
// [면책]
//   절기는 고정일(2/4, 3/6...) 근사값 적용 — 경계일 ±1일 오차 가능
//   참고용 진로 분석 서비스 (운명 판단 아님)
// ====================================================

import KoreanLunarCalendar from "korean-lunar-calendar";

// ── 천간(天干) ─────────────────────────────────────────────────
const GAN_HANJA = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"] as const;
const GAN_KR    = ["갑","을","병","정","무","기","경","신","임","계"] as const;

// ── 지지(地支) ─────────────────────────────────────────────────
const JI_HANJA  = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"] as const;
const JI_KR     = ["자","축","인","묘","진","사","오","미","신","유","술","해"] as const;

// ── 오행(五行) 한글 이름 ────────────────────────────────────────
const OHAENG_KR = ["목","화","토","금","수"] as const;

// ── 천간 → 오행 인덱스 (0=木 1=火 2=土 3=金 4=水) ─────────────
// 甲乙=木 丙丁=火 戊己=土 庚辛=金 壬癸=水
const GAN_OHAENG = [0,0,1,1,2,2,3,3,4,4] as const;

// ── 지지 → 오행 인덱스 ─────────────────────────────────────────
// 子=水(4) 丑=土(2) 寅=木(0) 卯=木(0) 辰=土(2) 巳=火(1)
// 午=火(1) 未=土(2) 申=金(3) 酉=金(3) 戌=土(2) 亥=水(4)
const JI_OHAENG  = [4,2,0,0,2,1,1,2,3,3,2,4] as const;

// ── 월간 기준 — 五虎遁年法 (寅月 기준) ─────────────────────────
// 甲己→丙(2) 乙庚→戊(4) 丙辛→庚(6) 丁壬→壬(8) 戊癸→甲(0)
const MONTH_GAN_BASE = [2,4,6,8,0] as const;

// ── 시간 기준 — 五鼠遁日法 (子時 기준) ─────────────────────────
// 甲己→甲(0) 乙庚→丙(2) 丙辛→戊(4) 丁壬→庚(6) 戊癸→壬(8)
const HOUR_GAN_BASE  = [0,2,4,6,8] as const;

// ── 일주 기준 인덱스 ────────────────────────────────────────────
// 1900-01-01 = 甲戌(index=10)
// 검증: 1999-09-09=甲子 ✓ / 2001-01-01=甲子 ✓
const DAY_BASE = 10;

// ── 출생 시간 코드 → 지지 인덱스 ──────────────────────────────
const BIRTH_TIME_JI: Record<string, number> = {
  ja:0, chuk:1, in:2, myo:3, jin:4, sa:5,
  o:6, mi:7, sin:8, yu:9, sul:10, hae:11,
};

// ────────────────────────────────────────────────────────────────
// 타입 정의
// ────────────────────────────────────────────────────────────────
export interface PillarInfo {
  ganIndex:   number;   // 0-9
  jiIndex:    number;   // 0-11
  ganHanja:   string;   // "甲"
  jiHanja:    string;   // "午"
  ganKr:      string;   // "갑"
  jiKr:       string;   // "오"
  gan:        string;   // ganKr alias
  ji:         string;   // jiKr alias
  ganOhaeng:  string;   // "목"|"화"|"토"|"금"|"수"
  jiOhaeng:   string;   // "목"|"화"|"토"|"금"|"수"
}

export interface ManseryeokResult {
  yearPillar:   PillarInfo;
  monthPillar:  PillarInfo;
  dayPillar:    PillarInfo;
  hourPillar:   PillarInfo | null;
  ohaeng: {
    wood:         number;
    fire:         number;
    earth:        number;
    metal:        number;
    water:        number;
    woodPercent:  number;
    firePercent:  number;
    earthPercent: number;
    metalPercent: number;
    waterPercent: number;
    dominant:     string;  // 가장 강한 오행 한글명
  };
  ilgan:     string;  // 일간 한자 (예: "壬")
  summary:   string;  // "甲午 癸丑 壬子 壬午"
  solarDate: { year: number; month: number; day: number };
}

export interface ManseryeokInput {
  year:        number;
  month:       number;
  day:         number;
  isLunar:     boolean;
  isLeapMonth: boolean;
  birthTime:   string; // 'ja'|'chuk'|...|'o'|...|'unknown'
}

// ────────────────────────────────────────────────────────────────
// 내부 헬퍼
// ────────────────────────────────────────────────────────────────

/** 그레고리력 → 율리우스 절일수 */
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

/** 천간+지지 인덱스 → PillarInfo */
function makePillar(ganIdx: number, jiIdx: number): PillarInfo {
  const g = ((ganIdx % 10) + 10) % 10;
  const j = ((jiIdx  % 12) + 12) % 12;
  return {
    ganIndex:  g,
    jiIndex:   j,
    ganHanja:  GAN_HANJA[g],
    jiHanja:   JI_HANJA[j],
    ganKr:     GAN_KR[g],
    jiKr:      JI_KR[j],
    gan:       GAN_KR[g],
    ji:        JI_KR[j],
    ganOhaeng: OHAENG_KR[GAN_OHAENG[g]],
    jiOhaeng:  OHAENG_KR[JI_OHAENG[j]],
  };
}

/**
 * 월지 계산 — 절기 기준 근사 (±1일 오차)
 * 자월(子)=0, 축월(丑)=1, 인월(寅)=2, ... 해월(亥)=11
 */
function getMonthJi(month: number, day: number): number {
  if (month ===  1) return day <=  5 ?  0 : 1;   // 子→丑
  if (month ===  2) return day <=  3 ?  1 : 2;   // 丑→寅 (입춘 2/4)
  if (month ===  3) return day <=  5 ?  2 : 3;   // 寅→卯
  if (month ===  4) return day <=  4 ?  3 : 4;   // 卯→辰
  if (month ===  5) return day <=  5 ?  4 : 5;   // 辰→巳
  if (month ===  6) return day <=  5 ?  5 : 6;   // 巳→午
  if (month ===  7) return day <=  6 ?  6 : 7;   // 午→未
  if (month ===  8) return day <=  6 ?  7 : 8;   // 未→申
  if (month ===  9) return day <=  7 ?  8 : 9;   // 申→酉
  if (month === 10) return day <=  7 ?  9 : 10;  // 酉→戌
  if (month === 11) return day <=  6 ? 10 : 11;  // 戌→亥
  /* month === 12 */ return day <=  6 ? 11 :  0; // 亥→子
}

// ────────────────────────────────────────────────────────────────
// 메인 함수
// ────────────────────────────────────────────────────────────────
export function calculateManseryeok(input: ManseryeokInput): ManseryeokResult {
  let { year, month, day } = input;
  const { isLunar, isLeapMonth, birthTime } = input;

  // ── 음력 → 양력 변환 ────────────────────────────────
  if (isLunar) {
    try {
      const cal = new KoreanLunarCalendar();
      cal.setLunarDate(year, month, day, isLeapMonth);
      const solar = cal.getSolarCalendar();
      console.log(`[만세력] 음력 ${year}.${month}.${day}(${isLeapMonth?"윤":""}) → 양력 ${solar.year}.${solar.month}.${solar.day}`);
      year  = solar.year;
      month = solar.month;
      day   = solar.day;
    } catch (e) {
      console.warn("[만세력] 음력 변환 실패, 양력 기준으로 계속:", e);
    }
  }

  const solarDate = { year, month, day };

  // ── 년주(年柱) — 입춘(2/4) 경계 적용 ────────────────
  // 입춘 전은 전년도 간지 사용 (한국 명리학 표준)
  const isBeforeIpchun = month < 2 || (month === 2 && day < 4);
  const yearForCalc    = isBeforeIpchun ? year - 1 : year;
  const yearGan  = ((yearForCalc - 1984) % 10 + 1000) % 10;
  const yearJi   = ((yearForCalc - 1984) % 12 + 1200) % 12;
  const yearPillar = makePillar(yearGan, yearJi);
  console.log(`[만세력] 년주: ${yearPillar.ganHanja}${yearPillar.jiHanja} (yearForCalc=${yearForCalc})`);

  // ── 월주(月柱) — 五虎遁年法, 寅月 기준 ──────────────
  const monthJi     = getMonthJi(month, day);
  const monthOffset = (monthJi - 2 + 12) % 12;  // 寅月(2)=0, 卯月(3)=1, ...
  const monthStem   = (MONTH_GAN_BASE[yearGan % 5] + monthOffset) % 10;
  const monthPillar = makePillar(monthStem, monthJi);
  console.log(`[만세력] 월주: ${monthPillar.ganHanja}${monthPillar.jiHanja}`);

  // ── 일주(日柱) — 1900-01-01=甲戌(10) 기준 ──────────
  const BASE_JDN = toJDN(1900, 1, 1);
  const inputJDN = toJDN(year, month, day);
  const dayIdx   = ((inputJDN - BASE_JDN + DAY_BASE) % 60 + 60) % 60;
  const dayStem  = dayIdx % 10;
  const dayBranch= dayIdx % 12;
  const dayPillar = makePillar(dayStem, dayBranch);
  console.log(`[만세력] 일주: ${dayPillar.ganHanja}${dayPillar.jiHanja} (dayIdx=${dayIdx})`);

  // ── 시주(時柱) — 五鼠遁日法, 子時 기준 ──────────────
  let hourPillar: PillarInfo | null = null;
  if (birthTime !== "unknown" && birthTime in BIRTH_TIME_JI) {
    const hourJi   = BIRTH_TIME_JI[birthTime];
    const hourStem = (HOUR_GAN_BASE[dayStem % 5] + hourJi) % 10;
    hourPillar = makePillar(hourStem, hourJi);
    console.log(`[만세력] 시주: ${hourPillar.ganHanja}${hourPillar.jiHanja}`);
  } else {
    console.log("[만세력] 시주: 모름 (생략)");
  }

  // ── 오행 집계 ─────────────────────────────────────────
  const pillars = [yearPillar, monthPillar, dayPillar, ...(hourPillar ? [hourPillar] : [])];
  const total   = pillars.length * 2;
  const counts  = [0, 0, 0, 0, 0];

  for (const p of pillars) {
    counts[GAN_OHAENG[p.ganIndex]]++;
    counts[JI_OHAENG[p.jiIndex]]++;
  }

  const [wood, fire, earth, metal, water] = counts;
  const maxCount = Math.max(...counts);
  const maxIdx   = counts.indexOf(maxCount);
  const dominant = OHAENG_KR[maxIdx];

  const ohaeng = {
    wood,  fire,  earth,  metal,  water,
    woodPercent:  Math.round((wood  / total) * 100),
    firePercent:  Math.round((fire  / total) * 100),
    earthPercent: Math.round((earth / total) * 100),
    metalPercent: Math.round((metal / total) * 100),
    waterPercent: Math.round((water / total) * 100),
    dominant,
  };

  // ── 일간 + 요약 ───────────────────────────────────────
  const ilgan = dayPillar.ganHanja;
  const summary = [
    yearPillar.ganHanja + yearPillar.jiHanja,
    monthPillar.ganHanja + monthPillar.jiHanja,
    dayPillar.ganHanja + dayPillar.jiHanja,
    hourPillar ? hourPillar.ganHanja + hourPillar.jiHanja : "(시주미상)",
  ].join(" ");

  return {
    yearPillar, monthPillar, dayPillar, hourPillar,
    ohaeng, ilgan, summary, solarDate,
  };
}

// ────────────────────────────────────────────────────────────────
// 검증 함수 (개발용)
// ────────────────────────────────────────────────────────────────
export function runManseryeokTest(): void {
  const cases = [
    { y:1999, m:9,  d:9,  bt:"unknown", label:"1999-09-09      ", expect:"甲子일" },
    { y:2001, m:1,  d:1,  bt:"unknown", label:"2001-01-01      ", expect:"甲子일" },
    { y:2014, m:2,  d:3,  bt:"unknown", label:"2014-02-03(입춘前)", expect:"癸巳년" },
    { y:2014, m:2,  d:4,  bt:"unknown", label:"2014-02-04(입춘日)", expect:"甲午년" },
    { y:2014, m:1,  d:17, bt:"o",       label:"2014-01-17 오시  ", expect:"癸巳/乙丑/戊子/戊午" },
  ];
  console.log("[만세력 검증]");
  for (const c of cases) {
    const r = calculateManseryeok({
      year:c.y, month:c.m, day:c.d,
      isLunar:false, isLeapMonth:false, birthTime:c.bt,
    });
    console.log(`  ${c.label}: ${r.summary}  (기대: ${c.expect})`);
  }
}
