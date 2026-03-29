"use client";

// ====================================================
// 새싹 직업 탐색 컴포넌트
// - 라우트: /sprout/explore
// - 직업 카드 6개 + 클릭 시 간단 팝업
// ====================================================

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { SPROUT_EXPLORE_JOBS } from "@/data/sprout";
import type { SproutJob } from "@/types/sprout";

const GREEN       = "#4CAF50";
const GREEN_LIGHT = "#F1F8E9";
const GREEN_MID   = "#C8E6C9";

// ----------------------------------------
// 직업 상세 팝업 모달
// ----------------------------------------
function JobModal({
  job,
  onClose,
}: {
  job: SproutJob;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-mobile bg-white rounded-t-2xl px-6 pt-6 pb-10 shadow-nav"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <div className="w-10 h-1 rounded-full bg-base-border mx-auto mb-5" />

        {/* 이모지 + 닫기 */}
        <div className="flex items-start justify-between mb-4">
          <span className="text-5xl leading-none">{job.emoji}</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-base-card text-base-muted text-lg active:opacity-60"
          >
            ✕
          </button>
        </div>

        {/* 직업명 */}
        <h2 className="text-xl font-bold text-base-text mb-3">{job.name}</h2>

        {/* 설명 */}
        <div
          className="rounded-card p-3 mb-4"
          style={{ backgroundColor: GREEN_LIGHT }}
        >
          <p className="text-sm text-base-text leading-relaxed">
            {job.desc1}
          </p>
          <p className="text-sm text-base-muted leading-relaxed mt-1">
            {job.desc2}
          </p>
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-button text-sm font-bold text-white active:opacity-80 transition-opacity"
          style={{ backgroundColor: GREEN }}
        >
          확인했어요! 👍
        </button>
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
    <AppShell headerTitle="직업 첫 탐색 🔍" showBack backHref="/sprout">
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
