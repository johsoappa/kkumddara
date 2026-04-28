"use client";

// ====================================================
// GuideModal — 첫 방문 사용 가이드 팝업
//
// [설계]
//   - localStorage 기반 1회 노출 (hydration 안전)
//   - useEffect 안에서만 localStorage 접근 → SSR 충돌 없음
//   - storageKey, 문구, steps를 props로 주입 → 학부모·학생 공용
//
// [dismiss 동작 분리]
//   confirmGuide() — localStorage 저장 + 닫기
//     └─ CTA 버튼 / "다시 보지 않기" 버튼에서만 호출
//   closeOnly()    — 닫기만 수행 (localStorage 저장 안 함)
//     └─ 배경 dim 클릭 / ESC 키에서 호출
//     └─ 새로고침 시 팝업 재노출됨 (의도된 동작)
//
// [사용처]
//   - src/app/parent/home/page.tsx  → storageKey: "kkumddara_parent_guide_seen"
//   - src/app/student/home/page.tsx → storageKey: "kkumddara_student_guide_seen"
//
// [확장 포인트]
//   - DB 기반 per-account 저장 전환 시 localStorage 로직만 교체
//   - 설정 메뉴 "가이드 다시 보기" → localStorage.removeItem(storageKey) 후 리로드
// ====================================================

import { useEffect, useState } from "react";

// ─── 색상 상수 ────────────────────────────────────────
const ACCENT    = "#E84B2E";
const ACCENT_BG = "#FFF0EB";

// ─── 타입 ─────────────────────────────────────────────
export interface GuideStep {
  num:     number;
  heading: string;
  body?:   string;   // 단계 부제목 (없어도 됨)
}

export interface GuideModalProps {
  /** localStorage 저장 키 */
  storageKey:   string;
  /** 팝업 제목 */
  title:        string;
  /** 본문 첫 번째 단락 */
  intro:        string;
  /** 본문 두 번째 단락 (선택) */
  introSub?:    string;
  /** 단계 목록 앞 소제목 (선택, 예: "처음에는 아래 3가지만 해보세요.") */
  stepsIntro?:  string;
  /** 번호 단계 목록 */
  steps:        GuideStep[];
  /** 기본 CTA 버튼 라벨 */
  ctaLabel:     string;
}

// ─── 컴포넌트 ─────────────────────────────────────────
export default function GuideModal({
  storageKey,
  title,
  intro,
  introSub,
  stepsIntro,
  steps,
  ctaLabel,
}: GuideModalProps) {
  const [visible, setVisible] = useState(false);

  // SSR-safe: useEffect 안에서만 localStorage 읽기 → hydration 오류 없음
  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (!seen) setVisible(true);
  }, [storageKey]);

  /**
   * confirmGuide — localStorage 저장 + 닫기
   * CTA 버튼 / "다시 보지 않기" 클릭 시 호출.
   * 이후 같은 브라우저에서는 팝업 재노출 안 됨.
   */
  const confirmGuide = () => {
    localStorage.setItem(storageKey, "true");
    setVisible(false);
  };

  /**
   * closeOnly — 닫기만 수행 (localStorage 저장 안 함)
   * 배경 dim 클릭 / ESC 키에서 호출.
   * 새로고침 후 팝업이 다시 노출되는 것이 의도된 동작.
   */
  const closeOnly = () => {
    setVisible(false);
  };

  // ESC 키로 팝업 닫기 (closeOnly — localStorage 저장 안 함)
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeOnly();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    /* ── 배경 dim (반투명) ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
      onClick={closeOnly}     // dim 클릭: 닫기만, localStorage 저장 안 함
    >
      {/* ── 모달 패널 ── */}
      <div
        className="bg-white rounded-2xl w-full max-w-[360px] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}  // 배경 클릭 이벤트 차단
      >

        {/* ── 헤더 ── */}
        <div className="px-5 pt-6 pb-4">
          <h2
            id="guide-modal-title"
            className="text-base font-bold text-base-text leading-snug mb-2"
          >
            {title}
          </h2>

          <p className="text-xs text-base-muted leading-relaxed">
            {intro}
          </p>

          {introSub && (
            <p className="text-xs text-base-muted leading-relaxed mt-1.5">
              {introSub}
            </p>
          )}
        </div>

        {/* ── 구분선 ── */}
        <div className="border-t border-base-border mx-5" />

        {/* ── 단계 목록 ── */}
        <div className="px-5 py-4 flex flex-col gap-3.5">
          {stepsIntro && (
            <p className="text-[11px] font-semibold text-base-muted mb-0.5">
              {stepsIntro}
            </p>
          )}

          {steps.map((step) => (
            <div key={step.num} className="flex gap-3 items-start">
              {/* 번호 배지 */}
              <span
                className="w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: ACCENT_BG, color: ACCENT }}
              >
                {step.num}
              </span>

              {/* 내용 */}
              <div>
                <p className="text-sm font-semibold text-base-text leading-snug">
                  {step.heading}
                </p>
                {step.body && (
                  <p className="text-xs text-base-muted leading-relaxed mt-0.5">
                    {step.body}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── CTA 영역 ── */}
        <div className="px-5 pb-6 flex flex-col gap-2">
          {/* CTA: localStorage 저장 + 닫기 */}
          <button
            onClick={confirmGuide}
            className="w-full py-3 rounded-xl text-sm font-bold text-white active:opacity-80 transition-opacity focus-visible:outline focus-visible:outline-2"
            style={{ backgroundColor: ACCENT }}
            autoFocus
          >
            {ctaLabel}
          </button>
          {/* 다시 보지 않기: localStorage 저장 + 닫기 */}
          <button
            onClick={confirmGuide}
            className="w-full py-2 text-xs text-base-muted active:opacity-60 transition-opacity focus-visible:underline"
          >
            다시 보지 않기
          </button>
        </div>

      </div>
    </div>
  );
}
