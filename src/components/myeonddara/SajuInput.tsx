"use client";

// ====================================================
// 사주 입력 폼
// - 이름 / 생년월일 / 태어난 시간 / 성별
// - 생년월일: type="text" + inputMode="numeric"
//   숫자 입력 → YYYY.MM.DD 자동 포맷
//   4자리 → "2015."  / 6자리 → "2015.03."  / 8자리 → "2015.03.12"
//   백스페이스: 점 바로 뒤에서 누르면 점 + 앞 숫자 함께 삭제
// ====================================================

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SajuInputData, BirthTime, Gender, CalendarType } from "@/types/myeonddara";

const CALENDAR_TYPES: CalendarType[] = ["양력", "음력", "윤달"];

const BIRTH_TIME_OPTIONS: { value: BirthTime; label: string }[] = [
  { value: "ja",      label: "자시 (23~01시)" },
  { value: "chuk",    label: "축시 (01~03시)" },
  { value: "in",      label: "인시 (03~05시)" },
  { value: "myo",     label: "묘시 (05~07시)" },
  { value: "jin",     label: "진시 (07~09시)" },
  { value: "sa",      label: "사시 (09~11시)" },
  { value: "o",       label: "오시 (11~13시)" },
  { value: "mi",      label: "미시 (13~15시)" },
  { value: "sin",     label: "신시 (15~17시)" },
  { value: "yu",      label: "유시 (17~19시)" },
  { value: "sul",     label: "술시 (19~21시)" },
  { value: "hae",     label: "해시 (21~23시)" },
  { value: "unknown", label: "모름" },
];

interface SajuInputProps {
  onSubmit: (data: SajuInputData) => void;
  isLoading?: boolean;
}

// ----------------------------------------
// 숫자 → "YYYY.MM.DD" 포맷
// 4자리 완성: "2015"  → "2015."   (점 자동 추가)
// 6자리 완성: "201503"→ "2015.03." (점 자동 추가)
// 7~8자리:    "2015031" → "2015.03.1"
// ----------------------------------------
function formatBirthDate(digits: string): string {
  if (digits.length === 0) return "";
  if (digits.length < 4)  return digits;
  if (digits.length === 4) return `${digits}.`;                        // 연도 완성 → 점 자동
  if (digits.length < 6)  return `${digits.slice(0, 4)}.${digits.slice(4)}`;
  if (digits.length === 6) return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.`; // 월 완성 → 점 자동
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
}

// ----------------------------------------
// 유효성 검사 (8자리 완성 시)
// ----------------------------------------
function validateDate(digits: string): { valid: boolean; error: string } {
  if (digits.length !== 8) return { valid: false, error: "" };

  const y = parseInt(digits.slice(0, 4));
  const m = parseInt(digits.slice(4, 6));
  const d = parseInt(digits.slice(6, 8));
  const thisYear = new Date().getFullYear();

  if (y < 1900 || y > thisYear) return { valid: false, error: `연도는 1900 ~ ${thisYear} 사이여야 합니다` };
  if (m < 1 || m > 12)          return { valid: false, error: "월은 01 ~ 12 사이여야 합니다" };
  if (d < 1 || d > 31)          return { valid: false, error: "일은 01 ~ 31 사이여야 합니다" };
  return { valid: true, error: "" };
}

// ----------------------------------------
// 메인 컴포넌트
// ----------------------------------------
export default function SajuInput({ onSubmit, isLoading = false }: SajuInputProps) {
  const [name, setName]                 = useState("");
  const [digits, setDigits]             = useState("");  // 숫자만, 최대 8자리
  const [displayValue, setDisplayValue] = useState("");  // "YYYY.MM.DD" 표시용
  const [birthTime, setBirthTime]       = useState<BirthTime>("unknown");
  const [gender, setGender]             = useState<Gender | null>(null);
  const [calendarType, setCalendarType] = useState<CalendarType>("양력");

  // ── 유효성 검사 결과
  const { valid: isValidDate, error: dateError } = validateDate(digits);

  // ── 제출용 ISO 값: "YYYY-MM-DD"
  const birthDateISO = isValidDate
    ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
    : "";

  // ── 입력 변경 핸들러
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    setDigits(raw);
    setDisplayValue(formatBirthDate(raw));
  };

  // ── 백스페이스: 점(.) 뒤에서 누르면 점 + 앞 숫자 함께 삭제
  const handleDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && displayValue.endsWith(".")) {
      e.preventDefault();
      const newDigits = digits.slice(0, -1); // 마지막 숫자 제거
      setDigits(newDigits);
      setDisplayValue(formatBirthDate(newDigits));
    }
  };

  // ── 테두리 색상
  const borderClass = (() => {
    if (digits.length === 0)  return "border-base-border";
    if (digits.length < 8)    return "border-base-border focus:border-brand-red";
    if (isValidDate)          return "border-green-500";   // 완성 + 유효
    return "border-red-400";                                // 완성 + 오류
  })();

  // ── 하단 힌트 메시지
  const hintContent = (() => {
    if (digits.length === 0)  return { msg: "YYYYMMDD 형식으로 입력하세요 (예: 20150312)", color: "text-base-muted" };
    if (digits.length < 8)    return { msg: `${8 - digits.length}자리 더 입력해주세요`, color: "text-base-muted" };
    if (isValidDate)          return { msg: `${displayValue} ✓`, color: "text-green-600" };
    return { msg: dateError || "올바른 날짜를 입력해주세요", color: "text-red-500" };
  })();

  const canSubmit = name.trim() && isValidDate && gender;

  const handleSubmit = () => {
    if (!name.trim())  { alert("아이 이름을 입력해주세요."); return; }
    if (!isValidDate)  { alert("생년월일 8자리를 정확히 입력해주세요.\n예) 2015.03.12"); return; }
    if (!gender)       { alert("성별을 선택해주세요."); return; }
    onSubmit({ name: name.trim(), birthDate: birthDateISO, birthTime, gender, calendarType });
  };

  return (
    <div className="bg-white rounded-card-lg shadow-card p-5">
      <h2 className="text-sm font-bold text-base-text mb-4">아이 정보 입력</h2>

      <div className="flex flex-col gap-4">

        {/* ① 이름 */}
        <div>
          <label className="block text-xs font-semibold text-base-muted mb-1.5">
            아이 이름
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력해주세요"
            className="
              w-full px-4 py-3 rounded-card border-2 border-base-border
              text-sm text-base-text placeholder:text-base-muted
              focus:outline-none focus:border-brand-red transition-colors
            "
          />
        </div>

        {/* ② 생년월일 */}
        <div>
          <label className="block text-xs font-semibold text-base-muted mb-1.5">
            생년월일
          </label>

          {/* 달력 유형 토글 */}
          <div className="flex gap-2 mb-2">
            {CALENDAR_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setCalendarType(type)}
                className={cn(
                  "flex-1 py-2 rounded-lg border text-sm font-semibold transition-all",
                  calendarType === type
                    ? "bg-brand-red border-brand-red text-white"
                    : "bg-white border-base-border text-base-muted"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          {calendarType === "음력" && (
            <p className="text-xs text-base-muted mb-2">음력 날짜를 입력해주세요</p>
          )}
          {calendarType === "윤달" && (
            <p className="text-xs mb-2" style={{ color: "#E84B2E" }}>
              윤달에 태어난 경우 선택해주세요
            </p>
          )}

          {/* 숫자 직접 입력 필드 */}
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={displayValue}
              onChange={handleDateChange}
              onKeyDown={handleDateKeyDown}
              placeholder="YYYYMMDD (예: 20150312)"
              maxLength={10}
              className={cn(
                "w-full px-4 py-3 pr-10 rounded-card border-2",
                "text-sm text-base-text placeholder:text-base-muted",
                "focus:outline-none transition-colors",
                borderClass
              )}
            />

            {/* 상태 아이콘 */}
            {digits.length === 8 && (
              <span
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                )}
                style={{ color: isValidDate ? "#16a34a" : "#ef4444" }}
              >
                {isValidDate ? "✓" : "✕"}
              </span>
            )}
          </div>

          {/* 힌트 / 에러 메시지 */}
          <p className={cn("text-xs mt-1.5", hintContent.color)}>
            {hintContent.msg}
          </p>
        </div>

        {/* ③ 태어난 시간 */}
        <div>
          <label className="block text-xs font-semibold text-base-muted mb-1.5">
            태어난 시간{" "}
            <span className="font-normal text-base-muted">(선택)</span>
          </label>
          <select
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value as BirthTime)}
            className="
              w-full px-4 py-3 rounded-card border-2 border-base-border
              text-sm text-base-text bg-white
              focus:outline-none focus:border-brand-red transition-colors
            "
          >
            {BIRTH_TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-base-muted mt-1.5">
            시간을 모르시면 &apos;모름&apos;을 선택해주세요
          </p>
        </div>

        {/* ④ 성별 */}
        <div>
          <label className="block text-xs font-semibold text-base-muted mb-1.5">
            성별
          </label>
          <div className="flex gap-3">
            {(["male", "female"] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={cn(
                  "flex-1 py-3 rounded-card border-2 text-sm font-semibold transition-all",
                  gender === g
                    ? "bg-brand-red border-brand-red text-white"
                    : "bg-white border-base-border text-base-text"
                )}
              >
                {g === "male" ? "남자" : "여자"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 분석 시작 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || isLoading}
        className="
          btn-primary mt-6
          flex items-center justify-center gap-2
        "
      >
        {isLoading ? (
          <span>분석 중...</span>
        ) : (
          <span>명따라 분석 시작하기 ✨</span>
        )}
      </button>
    </div>
  );
}
