// ====================================================
// src/types/goyo24.ts — 고용24 직업정보 API 타입 정의
//
// [범위]
//   - 고용24 직업정보 API (직업목록 L01, 직업상세 D01) 응답 파싱 타입
//   - occupation_goyo24_profile DB 행 타입
//   - UI 표시용 보조 타입
//
// [주의]
//   - 인증키 관련 타입 없음 — 서버/스크립트 환경변수에서만 관리
//   - D04 타입은 1차 구현 미포함 (2차 검토)
// ====================================================


// ─── 고용24 L01 목록 API 응답 ─────────────────────────────────

/** L01 목록 API 단일 직업 항목 */
export interface Goyo24JobListItem {
  /** 직업 대분류 코드 (예: "133") */
  jobClcd:   string;
  /** 직업 대분류명 (예: "소프트웨어 개발자") */
  jobClcdNM: string;
  /** 고용24 직업코드 K-prefix (예: "K000001176") */
  jobCd:     string;
  /** 직업명 (예: "응용소프트웨어개발자") */
  jobNm:     string;
}

/** L01 목록 API 파싱 결과 */
export interface Goyo24JobListResult {
  total: number;
  items: Goyo24JobListItem[];
}


// ─── 고용24 D01 상세 API 응답 ─────────────────────────────────

/** D01 응답의 관련 학과 항목 */
export interface Goyo24RelMajor {
  majorCd: string;
  majorNm: string;
}

/**
 * D01 (직업 요약 상세) API 파싱 결과
 * 루트 노드: <jobSum>
 */
export interface Goyo24D01ParsedData {
  /** 고용24 직업코드 */
  jobCd:         string;
  /** 직업 대분류명 */
  jobLrclNm?:    string;
  /** 직업 중분류명 */
  jobMdclNm?:    string;
  /** 직업 소분류명 (배치 스크립트에서 goyo24_job_name으로 저장) */
  jobSmclNm?:    string;
  /** 임금 원문 텍스트 */
  sal?:          string;
  /** 직업만족도 (0~100 실수) */
  jobSatis?:     number;
  /** 고용 전망 텍스트 (요약: "증가(44%) 현상유지(31%) 감소(24%)") */
  jobProspect?:  string;
  /** 관련 학과 목록 */
  relMajorList:  Goyo24RelMajor[];
}


// ─── sal 파싱 결과 ────────────────────────────────────────────

/** sal 텍스트 파싱 결과 */
export interface ParsedSalary {
  /** 조사년도 (예: 2023) */
  surveyYear: number | null;
  /** 하위 25% 임금 (만원) */
  lower:      number | null;
  /** 중위 50% 임금 (만원) */
  median:     number | null;
  /** 상위 25% 임금 (만원) */
  upper:      number | null;
}


// ─── 전망 레이블 ──────────────────────────────────────────────

/**
 * 전망 레이블 5단계
 * D01 jobProspect 요약 텍스트에서 추출.
 * "증가" 비율이 가장 높으면 "증가" 레이블 사용.
 */
export type ProspectLabel =
  | "증가"
  | "다소 증가"
  | "유지"
  | "다소 감소"
  | "감소";


// ─── DB 행 타입 ───────────────────────────────────────────────

/**
 * occupation_goyo24_profile DB 행 타입
 * Supabase 조회 결과와 1:1 대응
 */
export interface OccupationGoyo24Profile {
  id:                string;
  occupation_id:     string;

  goyo24_occ_code:   string | null;
  goyo24_job_name:   string | null;

  salary_raw:        string | null;
  salary_lower:      number | null;
  salary_median:     number | null;
  salary_upper:      number | null;
  salary_survey_year: number | null;

  job_satisfaction:  number | null;

  prospect_raw:      string | null;
  prospect_label:    string | null;

  related_majors:    string[];

  source:            string;
  synced_at:         string;
  created_at:        string;
  updated_at:        string;
}

/**
 * 배치 스크립트 upsert용 입력 타입
 * (id, created_at 제외)
 */
export type OccupationGoyo24ProfileUpsert = Omit<
  OccupationGoyo24Profile,
  "id" | "created_at" | "updated_at"
>;


// ─── 배치 스크립트 결과 타입 ──────────────────────────────────

/** 배치 스크립트 단일 직업 처리 결과 */
export type SyncResultStatus = "success" | "skipped" | "failed";

export interface SyncResult {
  occupationId:   string;
  nameKo:         string;
  status:         SyncResultStatus;
  goyo24JobCd?:   string;
  goyo24JobName?: string;
  reason?:        string;
  error?:         string;
}
