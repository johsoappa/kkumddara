"use client";

// ====================================================
// 명따라 결과 화면 (/myeonddara/result)
//
// sessionStorage에서 읽기:
//   kkumddara_myeonddara_session → { saju, analysis, inputData }
//
// saju: ManseryeokResult (만세력 계산 결과)
// analysis: Claude API 응답 JSON
// inputData: 원본 입력값
// ====================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MYEONDDARA_SESSION_KEY } from "@/data/myeonddara";
import type { ManseryeokResult } from "@/lib/manseryeok";

// ── Claude 응답 타입 ────────────────────────────────────────────
interface CareerItem {
  rank:       number;
  emoji:      string;
  name:       string;
  reason:     string;
  fitPercent: number;
}

interface ClaudeAnalysis {
  dominantOhaeng:     string;
  ilganDescription:   string;
  personalityTags:    string[];
  personalitySummary: string;
  strengths:          string[];
  weaknesses:         string[];
  careers:            CareerItem[];
  fortuneMessage:     string;
  parentMessage:      string;
}

interface InputData {
  name:           string;
  birthDate:      string;
  birthDateLabel: string;
  birthTime:      string;
  birthTimeLabel: string;
  gender:         string;
  calendarType:   string;
}

interface Session {
  saju:      ManseryeokResult;
  analysis:  ClaudeAnalysis;
  inputData: InputData;
}

// ── 오행 메타 ──────────────────────────────────────────────────
const OHAENG_META = [
  { key: "wood",  name: "목(木)", emoji: "🌲", color: "#4CAF50" },
  { key: "fire",  name: "화(火)", emoji: "🔥", color: "#E84B2E" },
  { key: "earth", name: "토(土)", emoji: "⛰️", color: "#8D6E63" },
  { key: "metal", name: "금(金)", emoji: "⚙️", color: "#9E9E9E" },
  { key: "water", name: "수(水)", emoji: "🌊", color: "#2196F3" },
] as const;

type OhaengKey = typeof OHAENG_META[number]["key"];

export default function MyeonddaraResultPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(MYEONDDARA_SESSION_KEY);
      if (!raw) { setLoadErr(true); return; }
      const parsed = JSON.parse(raw) as Session;
      console.log("[명따라/result] 세션 로드:", parsed.saju.summary);
      console.log("[명따라/result] 분석 결과:", parsed.analysis);
      setSession(parsed);
    } catch (e) {
      console.error("[명따라/result] 세션 파싱 실패:", e);
      setLoadErr(true);
    }
  }, []);

  // ── 로딩 / 에러 ─────────────────────────────────────────────
  if (loadErr) {
    return (
      <div className="min-h-screen bg-base-off flex justify-center">
        <div className="w-full max-w-mobile bg-base-off">
          <div className="sticky top-0 z-50 bg-white border-b border-base-border">
            <div className="flex items-center px-4 h-14">
              <button onClick={() => router.back()}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-off">
                <ArrowLeft size={20} className="text-base-text" />
              </button>
              <h1 className="ml-2 text-sm font-bold text-base-text">명따라 분석 결과</h1>
            </div>
          </div>
          <div className="px-4 pt-10 text-center">
            <p className="text-4xl mb-4">😢</p>
            <p className="text-sm font-semibold text-base-text mb-2">결과를 불러올 수 없어요</p>
            <p className="text-xs text-base-muted mb-6">분석을 다시 시작해주세요.</p>
            <button onClick={() => router.push("/myeonddara")}
              className="px-6 py-3 rounded-button text-sm font-bold text-white"
              style={{ backgroundColor: "#E84B2E" }}>
              명따라 다시 시작하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-base-off flex justify-center">
        <div className="w-full max-w-mobile bg-base-off pb-8">
          <div className="sticky top-0 z-50 bg-white border-b border-base-border">
            <div className="flex items-center px-4 h-14">
              <button onClick={() => router.back()}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-off">
                <ArrowLeft size={20} className="text-base-text" />
              </button>
              <h1 className="ml-2 text-sm font-bold text-base-text">명따라 분석 결과</h1>
            </div>
          </div>
          <div className="px-4 pt-4 flex flex-col gap-4 animate-pulse">
            <div className="h-44 bg-white rounded-card-lg shadow-card" />
            <div className="h-40 bg-white rounded-card-lg shadow-card" />
            <div className="h-32 bg-white rounded-card-lg shadow-card" />
            <div className="h-48 bg-white rounded-card-lg shadow-card" />
          </div>
        </div>
      </div>
    );
  }

  const { saju, analysis, inputData } = session;
  const { yearPillar, monthPillar, dayPillar, hourPillar, ohaeng } = saju;

  // 오행 바 차트 데이터
  const ohaengBars = OHAENG_META.map((m) => ({
    ...m,
    count:   ohaeng[m.key as OhaengKey],
    percent: ohaeng[`${m.key}Percent` as keyof typeof ohaeng] as number,
  }));
  const maxCount = Math.max(...ohaengBars.map((b) => b.count), 1);

  // 강도 라벨
  const getStrengthLabel = (count: number): string => {
    if (count >= 3) return "강함";
    if (count === 2) return "보통";
    if (count === 1) return "약함";
    return "없음";
  };

  // 오늘 날짜
  const today = new Date();
  const todayLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  // 1위 직업 로드맵 연동
  const topCareer  = analysis.careers?.[0];
  const handleRoadmap = () => {
    if (topCareer) {
      const id = topCareer.name.replace(/\s+/g, "-").toLowerCase();
      router.push(`/roadmap/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-base-off pb-8">

        {/* ── 헤더 ────────────────────────────────────── */}
        <div className="sticky top-0 z-50 bg-white border-b border-base-border">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-off transition-colors"
              aria-label="뒤로가기">
              <ArrowLeft size={20} className="text-base-text" />
            </button>
            <h1 className="text-sm font-bold text-base-text">명따라 분석 결과</h1>
            <div className="w-9" />
          </div>
        </div>

        <div className="px-4 pt-4 flex flex-col gap-4">

          {/* ── 베타 안내 배너 ───────────────────────── */}
          <div className="rounded-card px-4 py-2.5 text-xs leading-relaxed text-center"
            style={{ backgroundColor: "#FFF9C4", color: "#7A5900" }}>
            📌 실제 만세력 기반으로 분석되나, 절기 오차가 있을 수 있습니다
          </div>

          {/* ── ① 4주 상단 카드 ──────────────────────── */}
          <div className="rounded-card-lg p-5 text-white"
            style={{ background: "linear-gradient(135deg, #1A3A6B, #2C5F8A)" }}>
            <p className="text-base font-bold mb-1">{inputData.name}의 사주 분석</p>
            <p className="text-xs text-white/70 mb-4">
              {inputData.birthDateLabel} · {inputData.birthTimeLabel} · {inputData.gender}
            </p>

            {/* 4柱 그리드 */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "年", pillar: yearPillar },
                { label: "月", pillar: monthPillar },
                { label: "日", pillar: dayPillar },
                { label: "時", pillar: hourPillar },
              ].map(({ label, pillar }) => (
                <div key={label}
                  className="flex flex-col items-center gap-1 rounded-card py-2.5 px-1"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                  <span className="text-[10px] text-white/60">{label}柱</span>
                  {pillar ? (
                    <>
                      <span className="text-xl font-bold leading-tight">{pillar.ganHanja}</span>
                      <span className="text-xl font-bold leading-tight">{pillar.jiHanja}</span>
                      <span className="text-[10px] text-white/60 mt-0.5">
                        {pillar.ganKr}{pillar.jiKr}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl font-bold leading-tight text-white/40">—</span>
                      <span className="text-xl font-bold leading-tight text-white/40">—</span>
                      <span className="text-[10px] text-white/40 mt-0.5">모름</span>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* 일간 설명 */}
            {analysis.ilganDescription && (
              <p className="text-xs text-white/70 mt-4 leading-relaxed">
                {analysis.ilganDescription}
              </p>
            )}
          </div>

          {/* ── ② 오행 분포 카드 ─────────────────────── */}
          <div className="bg-white rounded-card-lg shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-base-text">오행 분포</h3>
              {analysis.dominantOhaeng && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                  style={{ backgroundColor: "#E84B2E" }}>
                  주기운: {analysis.dominantOhaeng}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2.5">
              {ohaengBars.map((bar) => {
                const isDominant = analysis.dominantOhaeng?.includes(bar.name.replace(/[()]/g, "")) ||
                  bar.count === maxCount;
                return (
                  <div key={bar.key} className="flex items-center gap-2">
                    <span className="text-base w-5 text-center">{bar.emoji}</span>
                    <span className="text-xs font-semibold text-base-text w-11">{bar.name}</span>
                    <div className="flex-1 bg-base-off rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width:           `${bar.count === 0 ? 0 : Math.max((bar.count / maxCount) * 100, 10)}%`,
                          backgroundColor: bar.color,
                          opacity:         isDominant ? 1 : 0.5,
                        }}
                      />
                    </div>
                    <span className="text-xs text-base-muted w-12 text-right">
                      {bar.count}개 ({bar.percent}%)
                    </span>
                    <span className="text-[10px] font-semibold w-7 text-right"
                      style={{ color: bar.color }}>
                      {getStrengthLabel(bar.count)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── ③ 타고난 기질 카드 ───────────────────── */}
          <div className="bg-white rounded-card-lg shadow-card p-5">
            <h3 className="text-sm font-bold text-base-text mb-3">타고난 기질</h3>
            {analysis.personalityTags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {analysis.personalityTags.map((tag) => (
                  <span key={tag}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: "#FFF0EB", color: "#E84B2E" }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {analysis.personalitySummary && (
              <p className="text-sm text-base-text leading-relaxed">
                {analysis.personalitySummary}
              </p>
            )}
          </div>

          {/* ── ④ 강점 / 주의점 카드 ─────────────────── */}
          <div className="bg-white rounded-card-lg shadow-card p-5">
            <div className="flex flex-col gap-4">
              {/* 강점 */}
              {analysis.strengths?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-base-muted mb-2 flex items-center gap-1">
                    <span>💪</span> 강점
                  </h4>
                  <ul className="flex flex-col gap-1.5">
                    {analysis.strengths.map((s) => (
                      <li key={s} className="flex items-start gap-2 text-sm text-base-text">
                        <span className="text-brand-red mt-0.5 text-xs">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* 주의점 */}
              {analysis.weaknesses?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-base-muted mb-2 flex items-center gap-1">
                    <span>⚠️</span> 주의점
                  </h4>
                  <ul className="flex flex-col gap-1.5">
                    {analysis.weaknesses.map((w) => (
                      <li key={w} className="flex items-start gap-2 text-sm text-base-text">
                        <span className="text-orange-400 mt-0.5 text-xs">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* ── ⑤ 추천 직업군 (3개) ──────────────────── */}
          {analysis.careers?.length > 0 && (
            <div className="bg-white rounded-card-lg shadow-card p-5">
              <h3 className="text-sm font-bold text-base-text mb-3">추천 직업군</h3>
              <div className="flex flex-col gap-3">
                {analysis.careers.slice(0, 3).map((career) => (
                  <div key={career.rank}
                    className="rounded-card border border-base-border p-4 flex items-start gap-3">
                    {/* 순위 + 이모지 */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <span className="text-[10px] font-bold text-brand-red">{career.rank}위</span>
                      <span className="text-2xl leading-none">{career.emoji}</span>
                    </div>
                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-base-text">{career.name}</p>
                        <span className="text-xs font-bold shrink-0 ml-2"
                          style={{ color: "#E84B2E" }}>
                          {career.fitPercent}%
                        </span>
                      </div>
                      {/* 적합도 바 */}
                      <div className="w-full bg-base-off rounded-full h-1.5 mb-1.5 overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: `${career.fitPercent}%`, backgroundColor: "#E84B2E" }} />
                      </div>
                      <p className="text-xs text-base-muted">{career.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ⑥ 부모에게 드리는 메시지 ────────────── */}
          {analysis.parentMessage && (
            <div className="rounded-card-lg p-5 border border-orange-200"
              style={{ backgroundColor: "#FFF8F4" }}>
              <p className="text-xs font-bold mb-2" style={{ color: "#E84B2E" }}>
                💌 부모님께 드리는 말씀
              </p>
              <p className="text-sm text-base-text leading-relaxed">
                {analysis.parentMessage}
              </p>
            </div>
          )}

          {/* ── ⑦ 오늘의 진로 운세 ──────────────────── */}
          <div className="rounded-card-lg p-5 text-center"
            style={{ background: "linear-gradient(135deg, #1A3A6B, #2C5F8A)" }}>
            <p className="text-xs font-semibold text-white/70 mb-1 tracking-wide">✨ 오늘의 진로 운세</p>
            <p className="text-xs text-white/50 mb-3">{todayLabel}</p>
            <p className="text-sm font-medium text-white leading-relaxed mb-4">
              {analysis.fortuneMessage}
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              {ohaengBars
                .filter((b) => b.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 2)
                .map((b) => (
                  <span key={b.key}
                    className="flex items-center gap-1 text-xs text-white/80 font-medium px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                    <span>{b.emoji}</span><span>{b.name}</span>
                  </span>
                ))}
              <span className="flex items-center gap-1 text-xs text-white/80 font-medium px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <span>✨</span><span>오늘의 기운</span>
              </span>
            </div>
          </div>

          {/* ── ⑧ 하단 버튼 ────────────────────────────── */}
          <div className="flex flex-col gap-3 mt-2">
            {topCareer && (
              <button onClick={handleRoadmap}
                className="w-full py-4 rounded-button text-white text-sm font-bold active:opacity-80 transition-opacity"
                style={{ backgroundColor: "#E84B2E" }}>
                {topCareer.emoji} {topCareer.name} 로드맵 시작하기 →
              </button>
            )}
            <button onClick={() => router.push("/myeonddara")} className="btn-secondary">
              다시 분석하기
            </button>
            <button
              onClick={() => alert("카카오톡 공유 기능은 준비 중입니다. 😊")}
              className="w-full py-4 rounded-button font-semibold text-sm flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
              style={{ backgroundColor: "#FEE500", color: "#3C1E1E" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M9 0.5C4.029 0.5 0 3.643 0 7.5C0 10.003 1.548 12.205 3.9 13.5L3 17.5L7.2 14.877C7.789 14.959 8.39 15 9 15C13.971 15 18 11.866 18 8C18 4.134 13.971 0.5 9 0.5Z"
                  fill="#3C1E1E" />
              </svg>
              카카오톡 공유하기
            </button>
          </div>

          {/* ── 면책 안내 ─────────────────────────────── */}
          <p className="text-[11px] text-base-muted text-center leading-relaxed px-4 pb-2">
            명따라는 만세력 기반 참고용 진로 분석 서비스입니다. (베타)<br />
            절기 기준 근사 계산이 적용되며, 아이의 가능성은 무한합니다. 💛
          </p>

        </div>
      </div>
    </div>
  );
}
