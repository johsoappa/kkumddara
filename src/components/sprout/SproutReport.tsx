"use client";

// ====================================================
// 새싹 부모 리포트 컴포넌트
// - 라우트: /sprout/report
// - 이번 주 요약, 발견된 흥미, 부모 코멘트, 추천 활동
// ====================================================

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { SPROUT_INTERESTS, SPROUT_MISSION_STAGES } from "@/data/sprout";
import type { SproutInterest } from "@/types/sprout";

const GREEN       = "#4CAF50";
const GREEN_LIGHT = "#F1F8E9";
const GREEN_MID   = "#C8E6C9";

// 흥미 → 추천 활동 매핑
const ACTIVITIES_MAP: Record<SproutInterest, { emoji: string; text: string }> = {
  crafting: { emoji: "🎨", text: "미술관 또는 공방 체험하기"          },
  reading:  { emoji: "📚", text: "동네 도서관에서 책 함께 고르기"     },
  science:  { emoji: "🔬", text: "과학관 견학 가보기"                  },
  music:    { emoji: "🎵", text: "악기 체험 프로그램 참여하기"         },
  sports:   { emoji: "🏃", text: "스포츠 클럽 하루 체험해보기"        },
  social:   { emoji: "🤝", text: "지역 봉사활동 함께 참여해보기"      },
};

const DEFAULT_ACTIVITIES = [
  { emoji: "🎨", text: "미술관 또는 공방 체험하기" },
  { emoji: "🔬", text: "과학관 견학 가보기"         },
];

export default function SproutReport() {
  const [interests, setInterests]               = useState<SproutInterest[]>([]);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const streakDays = 3; // 더미 데이터

  useEffect(() => {
    const storedInterests = localStorage.getItem("kkumddara_sprout_interests");
    if (storedInterests) {
      setInterests(JSON.parse(storedInterests) as SproutInterest[]);
    }
    const storedMissions = localStorage.getItem("kkumddara_sprout_missions");
    if (storedMissions) {
      setCompletedMissions(JSON.parse(storedMissions) as string[]);
    }
  }, []);

  const exploredCount = interests.length;
  const doneCount     = completedMissions.length;

  const getOption = (val: SproutInterest) =>
    SPROUT_INTERESTS.find((i) => i.value === val);

  // 부모 코멘트용 흥미 라벨
  const topLabels = interests
    .slice(0, 2)
    .map((i) => getOption(i)?.label ?? "")
    .filter(Boolean);
  const commentText =
    topLabels.length > 0 ? topLabels.join("와 ") : "다양한 분야";

  // 추천 활동 (흥미 기반, 최대 2개)
  const recommendedActivities =
    interests.length > 0
      ? interests.slice(0, 2).map((i) => ACTIVITIES_MAP[i])
      : DEFAULT_ACTIVITIES;

  // 통계 카드 데이터
  const stats = [
    { label: "탐색한 분야", value: exploredCount, unit: "개" },
    { label: "완료한 미션", value: doneCount,     unit: "개" },
    { label: "연속 탐색일", value: streakDays,    unit: "일" },
  ];

  return (
    <AppShell headerTitle="새싹 리포트 🌿" showBack backHref="/sprout">
      <div className="px-5 py-5 pb-8 flex flex-col gap-5">

        {/* ── 이번 주 요약 카드 ── */}
        <div
          className="rounded-card-lg p-4 bg-white shadow-card border"
          style={{ borderColor: GREEN_MID }}
        >
          <h2 className="text-base font-bold text-base-text mb-3">
            이번 주 요약 📊
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center py-3 px-2 rounded-card"
                style={{ backgroundColor: GREEN_LIGHT }}
              >
                <span
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: GREEN }}
                >
                  {s.value}
                </span>
                <span className="text-xs text-base-muted mt-0.5">{s.unit}</span>
                <span className="text-[11px] text-base-muted text-center leading-tight mt-1">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 발견된 흥미 섹션 ── */}
        <div>
          <h2 className="text-base font-bold text-base-text mb-2">
            발견된 흥미 💚
          </h2>
          <div
            className="rounded-card-lg p-4 bg-white shadow-card border"
            style={{ borderColor: GREEN_MID }}
          >
            <p className="text-xs text-base-muted mb-3">관심을 보인 분야</p>
            {interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {interests.map((val) => {
                  const opt = getOption(val);
                  return opt ? (
                    <span
                      key={val}
                      className="text-sm font-semibold px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: GREEN_LIGHT, color: GREEN }}
                    >
                      {opt.emoji} {opt.label}
                    </span>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="text-sm text-base-muted">
                아직 선택한 관심 분야가 없어요.<br />
                홈 화면에서 관심 분야를 선택해봐요 💚
              </p>
            )}
          </div>
        </div>

        {/* ── 부모 코멘트 카드 ── */}
        <div className="rounded-card-lg p-4" style={{ backgroundColor: GREEN_LIGHT }}>
          <p className="text-[11px] font-bold uppercase tracking-wide text-base-muted mb-2">
            부모님께 드리는 한마디
          </p>
          <p className="text-sm text-base-text leading-relaxed">
            이번 주 아이는{" "}
            <span className="font-bold" style={{ color: GREEN }}>
              {commentText}
            </span>
            에 높은 관심을 보였어요.
            <br />
            관련 체험 활동을 함께 해보세요 💚
          </p>
        </div>

        {/* ── 추천 활동 카드 ── */}
        <div>
          <h2 className="text-base font-bold text-base-text mb-2">
            함께 해보세요 👨‍👩‍👧
          </h2>
          <div className="flex flex-col gap-2">
            {recommendedActivities.map((act, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 rounded-card bg-white shadow-card border"
                style={{ borderColor: GREEN_MID }}
              >
                <span className="text-2xl leading-none">{act.emoji}</span>
                <span className="text-sm font-medium text-base-text">
                  {act.text}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
