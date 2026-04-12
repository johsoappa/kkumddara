"use client";

// ====================================================
// 명따라 결과 화면 (/myeonddara/result)
// - localStorage에서 SajuInputData 읽기
// - calculateSaju() 로 실시간 계산 → SajuResult
// - 사주 4柱 / 오행 분석 / 기질 / 추천 직업 / 운세
// ====================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import OhaengChart from "@/components/myeonddara/OhaengChart";
import PersonalityCard from "@/components/myeonddara/PersonalityCard";
import RecommendedCareers from "@/components/myeonddara/RecommendedCareers";
import { MYEONDDARA_INPUT_KEY } from "@/data/myeonddara";
import { BIRTH_TIME_LABEL } from "@/types/myeonddara";
import type { SajuInputData, SajuResult } from "@/types/myeonddara";
import { calculateSaju } from "@/lib/myeonddara/calculate";

export default function MyeonddaraResultPage() {
  const router = useRouter();

  const [input,  setInput]  = useState<SajuInputData | null>(null);
  const [result, setResult] = useState<SajuResult | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(MYEONDDARA_INPUT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SajuInputData;
        setInput(parsed);
        setResult(calculateSaju(parsed));
      } catch (e) {
        console.error("[명따라/result] 입력 파싱 실패:", e);
      }
    }
  }, []);

  // 날짜 포맷: "YYYY-MM-DD" → "YYYY년 M월 D일"
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${y}년 ${Number(m)}월 ${Number(d)}일`;
  };

  // 오늘 날짜
  const today      = new Date();
  const todayLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  const handleShare   = () => alert("카카오톡 공유 기능은 준비 중입니다. 😊");
  const handleRetry   = () => router.push("/myeonddara");
  const handleRoadmap = () => {
    if (!result) return;
    localStorage.setItem("kkumddara_chosen_roadmap", result.topOccupationId);
    router.push(`/roadmap/${result.topOccupationId}`);
  };

  // ── 로딩 상태 ──────────────────────────────────────
  if (!result || !input) {
    return (
      <div className="min-h-screen bg-base-off flex justify-center">
        <div className="w-full max-w-mobile bg-base-off">
          <div className="sticky top-0 z-50 bg-white border-b border-base-border">
            <div className="flex items-center px-4 h-14">
              <button
                onClick={() => router.back()}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-off"
                aria-label="뒤로가기"
              >
                <ArrowLeft size={20} className="text-base-text" />
              </button>
              <h1 className="ml-2 text-sm font-bold text-base-text">명따라 분석 결과</h1>
            </div>
          </div>
          <div className="px-4 pt-6 flex flex-col gap-4 animate-pulse">
            <div className="h-40 bg-white rounded-card-lg shadow-card" />
            <div className="h-32 bg-white rounded-card-lg shadow-card" />
            <div className="h-24 bg-white rounded-card-lg shadow-card" />
          </div>
        </div>
      </div>
    );
  }

  const name         = input.name         || "아이";
  const birthDate    = input.birthDate    || "";
  const birthTime    = input.birthTime    || "unknown";
  const gender       = input.gender       ?? "male";
  const calendarType = input.calendarType || "양력";
  const timeLabel    = BIRTH_TIME_LABEL[birthTime].split(" ")[0];
  const genderLabel  = gender === "male" ? "남자" : "여자";

  // 상위 2개 오행 (운세 카드 뱃지용)
  const topTwoOhaeng = [...result.ohaeng]
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 2);
  const fortuTags = [
    ...topTwoOhaeng.map((e) => ({ emoji: e.emoji, label: e.name })),
    { emoji: "✨", label: "오늘의 기운" },
  ];

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-base-off pb-8">

        {/* ── 헤더 ─────────────────────────────────── */}
        <div className="sticky top-0 z-50 bg-white border-b border-base-border">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-off transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft size={20} className="text-base-text" />
            </button>
            <h1 className="text-sm font-bold text-base-text">명따라 분석 결과</h1>
            <div className="w-9" />
          </div>
        </div>

        <div className="px-4 pt-4 flex flex-col gap-4">

          {/* ── 결과 상단 카드 (4주) ──────────────── */}
          <div
            className="rounded-card-lg p-5 text-white"
            style={{ background: "linear-gradient(135deg, #1A3A6B, #2C5F8A)" }}
          >
            <p className="text-base font-bold mb-1">{name}의 사주 분석</p>
            <p className="text-xs text-white/70 mb-4">
              {formatDate(birthDate)} ({calendarType}) · {timeLabel} · {genderLabel}
            </p>

            {/* 사주 4柱 */}
            <div className="grid grid-cols-4 gap-2">
              {result.pillars.map((p) => (
                <div
                  key={p.label}
                  className="flex flex-col items-center gap-1 rounded-card py-2.5 px-1"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                >
                  <span className="text-[10px] text-white/60">{p.label}</span>
                  <span className="text-lg font-bold leading-none">{p.hanja}</span>
                  <span className="text-[10px] text-white/70">({p.korean})</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── 오행 분석 ─────────────────────────── */}
          <OhaengChart
            elements={result.ohaeng}
            summary={result.ohaengSummary}
          />

          {/* ── 타고난 기질 ───────────────────────── */}
          <PersonalityCard
            tags={result.personalityTags}
            description={result.personalityDesc}
          />

          {/* ── 추천 직업군 ───────────────────────── */}
          <RecommendedCareers careers={result.careers} />

          {/* ── 꿈따라 연동 카드 ──────────────────── */}
          <div
            className="rounded-card-lg p-4 border border-brand-red"
            style={{ backgroundColor: "#FFF0EB" }}
          >
            <p className="text-sm font-bold text-brand-red mb-1">
              ✨ 명따라 결과를 꿈따라에 반영했어요!
            </p>
            <p className="text-xs text-base-muted mb-3 leading-snug">
              {result.careers[0]?.name} 로드맵을 지금 바로 시작해보세요
            </p>
            <button
              onClick={handleRoadmap}
              className="
                w-full py-3 rounded-button
                bg-brand-red text-white text-sm font-bold
                active:opacity-80 transition-opacity
              "
            >
              로드맵 시작하기 →
            </button>
          </div>

          {/* ── 오늘의 진로 운세 ──────────────────── */}
          <div
            className="rounded-card-lg p-5 text-center"
            style={{ background: "linear-gradient(135deg, #1A3A6B, #2C5F8A)" }}
          >
            <p className="text-xs font-semibold text-white/70 mb-1 tracking-wide">
              ✨ 오늘의 진로 운세
            </p>
            <p className="text-xs text-white/50 mb-3">{todayLabel}</p>
            <p className="text-sm font-medium text-white leading-relaxed mb-4 whitespace-pre-line">
              {result.fortune}
            </p>
            <div className="flex justify-center gap-3">
              {fortuTags.map((item) => (
                <span
                  key={item.label}
                  className="flex items-center gap-1 text-xs text-white/80 font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* ── 하단 버튼 ─────────────────────────── */}
          <div className="flex flex-col gap-3 mt-2">
            <button
              onClick={handleShare}
              className="
                w-full py-4 rounded-button
                font-semibold text-sm
                flex items-center justify-center gap-2
                active:opacity-80 transition-opacity
              "
              style={{ backgroundColor: "#FEE500", color: "#3C1E1E" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  fillRule="evenodd" clipRule="evenodd"
                  d="M9 0.5C4.029 0.5 0 3.643 0 7.5C0 10.003 1.548 12.205 3.9 13.5L3 17.5L7.2 14.877C7.789 14.959 8.39 15 9 15C13.971 15 18 11.866 18 8C18 4.134 13.971 0.5 9 0.5Z"
                  fill="#3C1E1E"
                />
              </svg>
              결과 카카오톡 공유하기
            </button>
            <button onClick={handleRetry} className="btn-secondary">
              다시 분석하기
            </button>
          </div>

          {/* ── 면책 안내 ─────────────────────────── */}
          <p className="text-[11px] text-base-muted text-center leading-relaxed px-4 pb-2">
            명따라는 동양 철학 기반의 참고용 진로 분석 서비스입니다.<br />
            아이의 가능성은 무한합니다. 💛
          </p>

        </div>
      </div>
    </div>
  );
}
