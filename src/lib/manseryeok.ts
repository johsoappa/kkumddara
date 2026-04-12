// ====================================================
// 만세력 계산 엔진 — lib/manseryeok.ts
//
// [계산 근거]
//   년주: 1984년 = 甲子 기준, 입춘(2/4) 경계 적용
//   월주: 절기 기반 월지 + 년간 기준 월간
//   일주: 1900-01-01 = 甲戌(index=10) 기준 JDN 60갑자
//   시주: 12지시 선택값 + 일간 기준 시간
//   오행: 8글자(천간4+지지4) 집계
//   음력: korean-lunar-calendar 라이브러리로 양력 변환
//
// [면책]
//   절기는 고정일(2/4, 3/6...) 근사값 적용
//   입춘 경계일 ±1일 오차 가능
//   참고용 진로 분석 서비스 (운명 판단 아님)
// ====================================================

import KoreanLunarCalendar from "korean-lunar-calendar";

// ── 천간(天干) ─────────────────────────────────────────────────
const GAN_HANJA = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"] as const;
const GAN_KR    = ["갑","을","병","정","무","기","경","신","임","계"] as const;

// ── 지지(地支) ─────────────────────────────────────────────────
const JI_HANJA  = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"] as const;
const JI_KR     = ["자","축","인","묘","진","사","오","미","신","유","술","해"] as const;

// ── 천간 → 오행 인덱스 (0=木 1=火 2=土 3=金 4=水) ─────────────
// 甲乙=木 丙丁=火 戊己=土 庚辛=金 壬癸=水
const GAN_OHAENG = [0,0,1,1,2,2,3,3,4,4] as const;

// ── 지지 → 오행 인덱스 ─────────────────────────────────────────
// 子=水(4) 丑=土(2) 寅=木(0) 卯=木(0) 辰=土(2) 巳=火(1)
// 午=火(1) 未=土(2) 申=金(3) 酉=金(3) 戌=土(2) 亥=水(4)
const JI_OHAENG  = [4,2,0,0,2,1,1,2,3,3,2,4] as const;

// ── 월간 기준: 년간%5 → 寅월(index=2) 시작 천간 ────────────────
// 甲己→丙(2) 乙庚→戊(4) 丙辛→庚(6) 丁壬→壬(8) 戊癸→甲(0)
const MONTH_GAN_BASE = [2,4,6,8,0] as const;

// ── 시간 기준: 일간%5 → 子시(index=0) 시작 천간 ────────────────
// 甲己→甲(0) 乙庚→丙(2) 丙辛→戊(4) 丁壬→庚(6) 戊癸→壬(8)
const HOUR_GAN_BASE = [0,2,4,6,8] as const;

// ── 출생 시간 코드 → 지지 인덱스 ──────────────────────────────
const BIRTH_TIME_JI: Record<string, number> = {
  ja:0, chuk:1, in:2, myo:3, jin:4, sa:5,
  o:6, mi:7, sin:8, yu:9, sul:10, hae:11,
};

// ────────────────────────────────────────────────────────────────
// 타입 정의
// ────────────────────────────────────────────────────────────────
export interface PillarInfo {
  ganIndex:  number;   // 0-9
  jiIndex:   number;   // 0-11
  ganHanja:  string;   // "甲"
  jiHanja:   string;   // "午"
  ganKr:     string;   // "갑"
  jiKr:      string;   // "오"
  gan:       string;   // ganKr alias
  ji:        string;   // jiKr alias
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
  };
  ilgan:   string;  // 일간 한자 (예: "壬")
  summary: string;  // "甲午 癸丑 壬子 壬午"
  /** 실제 계산에 사용된 양력 날짜 (음력 입력 시 변환 결과) */
  solarDate: { year: number; month: number; day: number };
}

export interface ManseryeokInput {
  year:        number;
  month:       number;
  day:         number;
  isLunar:     boolean;
  isLeapMonth: boolean;
  birthTime:   string; // 'ja'|'chuk'|...|'unknown'
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
    ganIndex: g, jiIndex: j,
    ganHanja: GAN_HANJA[g], jiHanja: JI_HANJA[j],
    ganKr:    GAN_KR[g],    jiKr:    JI_KR[j],
    gan:      GAN_KR[g],    ji:      JI_KR[j],
  };
}

/**
 * 월지 계산 — 절기 기준 근사 (±1일 오차)
 * 자월(子)=0, 축월(丑)=1, ... 해월(亥)=11
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
      console.log(`[manseryeok] 음력 ${year}.${month}.${day}(${isLeapMonth?"윤":""}) → 양력 ${solar.year}.${solar.month}.${solar.day}`);
      year  = solar.year;
      month = solar.month;
      day   = solar.day;
    } catch (e) {
      console.warn("[manseryeok] 음력 변환 실패, 양력 기준으로 계속:", e);
    }
  }

  const solarDate = { year, month, day };

  // ── 년주(年柱) ────────────────────────────────────────
  // 입춘(2월 4일) 이전이면 전년도 간지 적용
  const isBeforeIpchun = month < 2 || (month === 2 && day < 4);
  const yearForCalc    = isBeforeIpchun ? year - 1 : year;
  const yearGan  = ((yearForCalc - 1984) % 10 + 1000) % 10;
  const yearJi   = ((yearForCalc - 1984) % 12 + 1200) % 12;
  const yearPillar = makePillar(yearGan, yearJi);
  console.log(`[manseryeok] 년주: ${yearPillar.ganHanja}${yearPillar.jiHanja} (yearForCalc=${yearForCalc})`);

  // ── 월주(月柱) ────────────────────────────────────────
  // 寅월(ji=2)부터 시작 → 월 오프셋
  const monthJi     = getMonthJi(month, day);
  const monthOffset = (monthJi - 2 + 12) % 12;   // 寅=0, 卯=1, ...
  const monthStem   = (MONTH_GAN_BASE[yearGan % 5] + monthOffset) % 10;
  const monthPillar = makePillar(monthStem, monthJi);
  console.log(`[manseryeok] 월주: ${monthPillar.ganHanja}${monthPillar.jiHanja}`);

  // ── 일주(日柱) ────────────────────────────────────────
  // 기준: 1900-01-01 = 甲戌 → 60갑자 순번 10
  const BASE_JDN = toJDN(1900, 1, 1);
  const inputJDN = toJDN(year, month, day);
  const dayIdx   = ((inputJDN - BASE_JDN + 10) % 60 + 60) % 60;
  const dayStem  = dayIdx % 10;
  const dayBranch= dayIdx % 12;
  const dayPillar = makePillar(dayStem, dayBranch);
  console.log(`[manseryeok] 일주: ${dayPillar.ganHanja}${dayPillar.jiHanja} (dayIdx=${dayIdx})`);

  // ── 시주(時柱) ────────────────────────────────────────
  let hourPillar: PillarInfo | null = null;
  if (birthTime !== "unknown" && birthTime in BIRTH_TIME_JI) {
    const hourJi   = BIRTH_TIME_JI[birthTime];
    const hourStem = (HOUR_GAN_BASE[dayStem % 5] + hourJi) % 10;
    hourPillar = makePillar(hourStem, hourJi);
    console.log(`[manseryeok] 시주: ${hourPillar.ganHanja}${hourPillar.jiHanja}`);
  } else {
    console.log("[manseryeok] 시주: 모름 (생략)");
  }

  // ── 오행 집계 ─────────────────────────────────────────
  const pillars  = [yearPillar, monthPillar, dayPillar, ...(hourPillar ? [hourPillar] : [])];
  const total    = pillars.length * 2; // 천간 + 지지
  const counts   = [0, 0, 0, 0, 0];   // 木 火 土 金 水

  for (const p of pillars) {
    counts[GAN_OHAENG[p.ganIndex]]++;
    counts[JI_OHAENG[p.jiIndex]]++;
  }

  const [wood, fire, earth, metal, water] = counts;
  const ohaeng = {
    wood,  fire,  earth,  metal,  water,
    woodPercent:  Math.round((wood  / total) * 100),
    firePercent:  Math.round((fire  / total) * 100),
    earthPercent: Math.round((earth / total) * 100),
    metalPercent: Math.round((metal / total) * 100),
    waterPercent: Math.round((water / total) * 100),
  };
  console.log("[manseryeok] 오행:", ohaeng);

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
