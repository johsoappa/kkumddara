"use client";

// ====================================================
// 새싹 직업 탐색 컴포넌트
// - 라우트: /sprout/explore
// - 직업 카드 6개 + 클릭 시 바텀시트 상세 모달
// ====================================================

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { SPROUT_EXPLORE_JOBS, SPROUT_INTERESTS } from "@/data/sprout";
import type { SproutJob } from "@/types/sprout";

const GREEN       = "#4CAF50";
const GREEN_LIGHT = "#F1F8E9";
const GREEN_MID   = "#C8E6C9";
const GREEN_DARK  = "#388E3C";

// ----------------------------------------
// 직업 상세 바텀시트 모달
// - 높이: 화면의 82%
// - 상단 헤더 고정 / 콘텐츠 스크롤 / 하단 버튼 고정
// ----------------------------------------
function JobModal({
  job,
  onClose,
}: {
  job: SproutJob;
  onClose: () => void;
}) {
  // 관련 흥미 label 조회
  const interestLabels = job.relatedInterests.map((ri) => {
    const found = SPROUT_INTERESTS.find((i) => i.value === ri);
    return found ? `${found.emoji} ${found.label}` : ri;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      {/* 바텀시트 컨테이너 — 높이 82vh, flex 세로 레이아웃 */}
      <div
        className="w-full max-w-mobile bg-white rounded-t-2xl shadow-nav flex flex-col"
        style={{ height: "82vh" }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── 상단 고정 헤더 ── */}
        <div className="flex-shrink-0 px-6 pt-4 pb-3">
          {/* 핸들 바 */}
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />

          {/* 이모지 + 닫기 버튼 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-5xl leading-none">{job.emoji}</span>
              <div>
                <h2 className="text-xl font-bold text-base-text leading-tight">
                  {job.name}
                </h2>
                <p className="text-xs text-base-muted mt-0.5">{job.desc2}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-base-card text-base-muted text-base active:opacity-60 transition-opacity"
            >
              ✕
            </button>
          </div>

          {/* 구분선 */}
          <div className="h-px bg-base-border" />
        </div>

        {/* ── 중간 스크롤 콘텐츠 ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5">

          {/* 📝 어떤 일을 해요? */}
          <section>
            <h3 className="text-sm font-bold text-base-text mb-2">
              📝 어떤 일을 해요?
            </h3>
            <div
              className="rounded-card p-4"
              style={{ backgroundColor: GREEN_LIGHT }}
            >
              <p className="text-sm text-base-text leading-relaxed">
                {job.desc1}
              </p>
            </div>
          </section>

          {/* ✨ 이런 능력이 필요해요 */}
          {job.skills && job.skills.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-base-text mb-2">
                ✨ 이런 능력이 필요해요
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: GREEN }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 💚 어떤 관심사랑 맞아요? */}
          {interestLabels.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-base-text mb-2">
                💚 어떤 관심사랑 잘 맞아요?
              </h3>
              <div className="flex flex-wrap gap-2">
                {interestLabels.map((label) => (
                  <span
                    key={label}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border-2"
                    style={{ borderColor: GREEN, color: GREEN, backgroundColor: GREEN_LIGHT }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 🎯 이런 활동 해봐요 */}
          {job.activities && job.activities.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-base-text mb-2">
                🎯 이런 활동 해봐요
              </h3>
              <div className="flex flex-col gap-2">
                {job.activities.map((act, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-card border"
                    style={{ borderColor: GREEN_MID, backgroundColor: "#fff" }}
                  >
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: GREEN_DARK }}
                    >
                      {idx + 1}
                    </span>
                    <p className="text-sm text-base-text">{act}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 하단 여백 (버튼에 가려지지 않도록) */}
          <div className="h-2" />
        </div>

        {/* ── 하단 고정 버튼 ── */}
        <div className="flex-shrink-0 px-6 pb-8 pt-3 border-t border-base-border bg-white">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-button text-sm font-bold text-white active:opacity-80 transition-opacity"
            style={{ backgroundColor: GREEN }}
          >
            확인했어요! 👍
          </button>
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------
// 메인 컴포넌트
// ----------------------------------------
export default function SproutExplore() {
  const [selectedJob, setSelectedJob] = useState<SproutJob | null>(null);

  return (
    <AppShell headerTitle="직업 첫 탐색 🔍" showBack backHref="/sprout" backLabel="돌아가기">
      <div className="px-5 py-5 pb-8">

        {/* 서브타이틀 */}
        <p className="text-sm text-base-muted mb-5">
          어떤 직업이 있는지 구경해봐요 👀
        </p>

        {/* 직업 카드 목록 */}
        <div className="flex flex-col gap-3">
          {SPROUT_EXPLORE_JOBS.map((job) => (
            <button
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className="flex items-center gap-4 p-4 rounded-card-lg bg-white shadow-card border text-left w-full active:opacity-80 transition-opacity"
              style={{ borderColor: GREEN_MID }}
            >
              {/* 이모지 크게 */}
              <span className="text-4xl leading-none flex-shrink-0">
                {job.emoji}
              </span>

              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-base-text">{job.name}</p>
                <p className="text-sm text-base-muted mt-0.5 leading-snug">
                  {job.desc1}
                </p>
                <p className="text-xs text-base-muted mt-0.5 leading-snug">
                  {job.desc2}
                </p>
              </div>

              {/* 탐색 버튼 힌트 */}
              <div
                className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: GREEN }}
              >
                탐색
              </div>
            </button>
          ))}
        </div>

      </div>

      {/* 팝업 */}
      {selectedJob && (
        <JobModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </AppShell>
  );
}
