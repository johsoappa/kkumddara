"use client";

// ====================================================
// 새싹 모드 홈 컴포넌트
// - 라우트: /sprout
// - 대상: 초3~4학년 (10~11세)
// - 포인트 컬러: #4CAF50
// ====================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import {
  SPROUT_INTERESTS,
  TODAY_EXPLORE,
  SPROUT_MISSION_STAGES,
  SPROUT_PREVIEW_JOBS,
} from "@/data/sprout";
import type { SproutInterest } from "@/types/sprout";

// ----------------------------------------
// 색상 상수
// ----------------------------------------
const GREEN       = "#4CAF50";
const GREEN_LIGHT = "#F1F8E9";
const GREEN_MID   = "#C8E6C9";

// 온보딩 관심분야 → 표시 레이블 (나침반 모드와 동일)
const INTEREST_LABEL: Record<string, string> = {
  it:        "IT·기술",
  art:       "예술·디자인",
  medical:   "의료·과학",
  business:  "비즈니스",
  education: "교육·사회",
};

// ----------------------------------------
// 원형 게이지 (SVG)
// ----------------------------------------
function ProgressCircle({ percent }: { percent: number }) {
  const r             = 26;
  const circumference = 2 * Math.PI * r;
  const offset        = circumference - (percent / 100) * circumference;

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="flex-shrink-0">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#E0E0E0" strokeWidth="5" />
      <circle
        cx="32" cy="32" r={r}
        fill="none"
        stroke={GREEN}
        strokeWidth="5"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      <text
        x="32" y="37"
        textAnchor="middle"
        fontSize="13"
        fontWeight="bold"
        fill={GREEN}
      >
        {percent}%
      </text>
    </svg>
  );
}

// ----------------------------------------
// 메인 컴포넌트
// ----------------------------------------
export default function SproutHome() {
  const router = useRouter();

  const [childName, setChildName]             = useState("친구");
  const [gradeLabel, setGradeLabel]           = useState("초3");
  const [interestTexts, setInterestTexts]     = useState(""); // "IT·기술, 의료·과학"
  const [selectedInterests, setSelectedInterests] = useState<SproutInterest[]>([]);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);

  useEffect(() => {
    // 온보딩 데이터 읽기 (학년 + 관심분야)
    const stored = localStorage.getItem("kkumddara_onboarding");
    if (stored) {
      const data = JSON.parse(stored) as { grade?: string; interests?: string[] };
      const gradeMap: Record<string, string> = {
        elementary3: "초3",
        elementary4: "초4",
      };
      setGradeLabel(gradeMap[data.grade ?? ""] ?? "초3");

      // 관심분야 텍스트 (나침반 모드와 동일 형식)
      const texts = (data.interests ?? [])
        .map((i) => INTEREST_LABEL[i] ?? i)
        .join(", ");
      setInterestTexts(texts);
    }

    // 새싹 모드 흥미 데이터
    const storedInterests = localStorage.getItem("kkumddara_sprout_interests");
    if (storedInterests) {
      setSelectedInterests(JSON.parse(storedInterests) as SproutInterest[]);
    }

    // 완료된 미션 데이터
    const storedMissions = localStorage.getItem("kkumddara_sprout_missions");
    if (storedMissions) {
      setCompletedMissions(JSON.parse(storedMissions) as string[]);
    }
  }, []);

  // 흥미 토글
  const toggleInterest = (val: SproutInterest) => {
    const next = selectedInterests.includes(val)
      ? selectedInterests.filter((i) => i !== val)
      : [...selectedInterests, val];
    setSelectedInterests(next);
    localStorage.setItem("kkumddara_sprout_interests", JSON.stringify(next));
  };

  // 미션 토글
  const toggleMission = (id: string) => {
    const next = completedMissions.includes(id)
      ? completedMissions.filter((m) => m !== id)
      : [...completedMissions, id];
    setCompletedMissions(next);
    localStorage.setItem("kkumddara_sprout_missions", JSON.stringify(next));
  };

  // 진행률 계산 (1단계 기준)
  const stage1      = SPROUT_MISSION_STAGES[0];
  const totalMissions = stage1.missions.length;
  const doneMissions  = stage1.missions.filter((m) =>
    completedMissions.includes(m.id)
  ).length;
  const progress = totalMissions > 0
    ? Math.round((doneMissions / totalMissions) * 100)
    : 0;

  // 홈에서 보여줄 주간 미션 3개
  const weekMissions = stage1.missions.slice(0, 3);

  return (
    <AppShell headerTitle="새싹 모드 🌿" showBack backHref="/home" backLabel="홈으로">
      <div className="px-5 py-5 pb-8 flex flex-col gap-6">

        {/* 서브타이틀 */}
        <p className="text-sm text-center font-medium" style={{ color: GREEN }}>
          나의 재능과 가능성을 찾아봐요 ✨
        </p>

        {/* 학년 + 관심분야 수정 버튼 (나침반 모드와 동일 스타일) */}
        <button
          onClick={() => router.push("/onboarding")}
          className="
            flex items-center gap-1.5 -mt-3
            self-start
            bg-base-card border border-base-border
            rounded-full px-3 py-1.5
            text-xs text-base-muted
            active:opacity-70 transition-opacity
          "
        >
          {gradeLabel && (
            <span className="font-semibold text-base-text">{gradeLabel}</span>
          )}
          {gradeLabel && interestTexts && (
            <span className="text-base-border">|</span>
          )}
          {interestTexts
            ? <span>{interestTexts}</span>
            : <span className="text-base-muted">관심분야 선택</span>
          }
          <span className="text-brand-red font-semibold ml-0.5">수정 ›</span>
        </button>

        {/* ② 프로필 카드 */}
        <div
          className="rounded-card-lg p-4 flex items-center gap-4"
          style={{ backgroundColor: GREEN_LIGHT }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-base font-bold text-base-text">{childName}</span>
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: GREEN }}
              >
                {gradeLabel}
              </span>
            </div>
            {selectedInterests.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedInterests.slice(0, 3).map((si) => {
                  const opt = SPROUT_INTERESTS.find((i) => i.value === si);
                  return opt ? (
                    <span
                      key={si}
                      className="text-xs px-2 py-0.5 rounded-full bg-white border"
                      style={{ borderColor: GREEN, color: GREEN }}
                    >
                      {opt.emoji} {opt.label}
                    </span>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="text-xs text-base-muted">
                아래에서 관심 분야를 선택해봐요 💚
              </p>
            )}
          </div>
          <ProgressCircle percent={progress} />
        </div>

        {/* ③ 오늘의 탐색 카드 */}
        <div>
          <h2 className="text-base font-bold text-base-text mb-2">오늘의 탐색 🔍</h2>
          <div
            className="rounded-card-lg p-4 bg-white shadow-card border"
            style={{ borderColor: GREEN_MID }}
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl leading-none">{TODAY_EXPLORE.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-base-text">{TODAY_EXPLORE.topic}</p>
                <p className="text-xs text-base-muted mt-0.5">{TODAY_EXPLORE.desc}</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/sprout/mission")}
              className="w-full py-2.5 rounded-button text-sm font-bold text-white active:opacity-80 transition-opacity"
              style={{ backgroundColor: GREEN }}
            >
              탐색 시작하기
            </button>
          </div>
        </div>

        {/* ④ 흥미 탐색 섹션 */}
        <div>
          <h2 className="text-base font-bold text-base-text mb-2">
            내가 좋아하는 것들 💚
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {SPROUT_INTERESTS.map((opt) => {
              const selected = selectedInterests.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleInterest(opt.value)}
                  className="flex items-center gap-3 py-3 px-4 rounded-card border-2 transition-all text-left active:scale-95"
                  style={{
                    backgroundColor: selected ? GREEN_LIGHT : "#ffffff",
                    borderColor:     selected ? GREEN      : "#E0E0E0",
                  }}
                >
                  <span className="text-2xl leading-none">{opt.emoji}</span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: selected ? GREEN : "#212121" }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ⑤ 이번 주 미션 섹션 */}
        <div>
          <h2 className="text-base font-bold text-base-text mb-2">이번 주 미션 🌱</h2>
          <div className="flex flex-col gap-2">
            {weekMissions.map((mission) => {
              const done = completedMissions.includes(mission.id);
              return (
                <button
                  key={mission.id}
                  onClick={() => toggleMission(mission.id)}
                  className="flex items-start gap-3 p-3 rounded-card bg-white shadow-card border border-base-border text-left w-full active:opacity-80 transition-opacity"
                >
                  {/* 체크박스 */}
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5"
                    style={{
                      borderColor:     done ? GREEN : "#BDBDBD",
                      backgroundColor: done ? GREEN : "#ffffff",
                    }}
                  >
                    {done && (
                      <span className="text-white text-[10px] font-bold leading-none">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        done ? "line-through text-base-muted" : "text-base-text"
                      }`}
                    >
                      {mission.text}
                    </p>
                    <p className="text-xs text-base-muted mt-0.5">
                      예상 시간: {mission.duration} · {mission.difficulty}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => router.push("/sprout/mission")}
            className="mt-2 w-full text-sm font-semibold flex items-center justify-end gap-0.5 active:opacity-70"
            style={{ color: GREEN }}
          >
            전체 미션 보기
            <ChevronRight size={15} />
          </button>
        </div>

        {/* ⑥ 직업 첫 만남 섹션 */}
        <div>
          <h2 className="text-base font-bold text-base-text mb-2">
            이런 직업도 있어요 👀
          </h2>
          {/* 가로 스크롤 */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
            {SPROUT_PREVIEW_JOBS.map((job) => (
              <div
                key={job.id}
                className="flex-shrink-0 w-36 rounded-card-lg p-3 bg-white shadow-card border"
                style={{ borderColor: GREEN_MID }}
              >
                <span className="text-3xl leading-none">{job.emoji}</span>
                <p className="text-sm font-bold text-base-text mt-1">{job.name}</p>
                <p className="text-xs text-base-muted mt-1 leading-relaxed">
                  {job.desc1}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push("/sprout/explore")}
            className="mt-1 w-full text-sm font-semibold flex items-center justify-end gap-0.5 active:opacity-70"
            style={{ color: GREEN }}
          >
            더 보기
            <ChevronRight size={15} />
          </button>
        </div>

        {/* ⑦ 부모 확인 카드 */}
        <div
          className="rounded-card-lg p-4"
          style={{ backgroundColor: GREEN_LIGHT }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none">👨‍👩‍👧</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-base-text mb-1">부모님께</p>
              <p className="text-xs text-base-muted leading-relaxed">
                오늘 {childName}이가 탐색한 내용을
                <br />
                함께 확인해보세요
              </p>
              <button
                onClick={() => router.push("/sprout/report")}
                className="mt-3 w-full py-2.5 rounded-button text-sm font-bold text-white active:opacity-80 transition-opacity"
                style={{ backgroundColor: GREEN }}
              >
                부모 리포트 보기 →
              </button>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
