"use client";

// ====================================================
// 사주 입력 폼
// - 이름 / 생년월일 / 태어난 시간 / 성별
// - 유효성 검사 후 onSubmit 콜백 호출
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

export default function SajuInput({ onSubmit, isLoading = false }: SajuInputProps) {
  const [name, setName]                   = useState("");
  const [birthDate, setBirthDate]         = useState("");
  const [birthTime, setBirthTime]         = useState<BirthTime>("unknown");
  const [gender, setGender]               = useState<Gender | null>(null);
  const [calendarType, setCalendarType]   = useState<CalendarType>("양력");

  const canSubmit = name.trim() && birthDate && gender;

  const handleSubmit = () => {
    if (!name.trim()) { alert("아이 이름을 입력해주세요."); return; }
    if (!birthDate)   { alert("생년월일을 입력해주세요."); return; }
    if (!gender)      { alert("성별을 선택해주세요."); return; }
    onSubmit({ name: name.trim(), birthDate, birthTime, gender, calendarType });
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
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="
              w-full px-4 py-3 rounded-card border-2 border-base-border
              text-sm text-base-text
              focus:outline-none focus:border-brand-red transition-colors
            "
          />
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
            시간을 모르시면 &#39;모름&#39;을 선택해주세요
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
