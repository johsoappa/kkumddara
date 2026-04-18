"use client";

// ====================================================
// 명따라 결과 화면 (/myeonddara/result)
//
// [세션 키 우선순위]
//   myeonddara_result (Phase 2) → 전체 Claude 분석 표시
//   myeonddara_saju  (Phase 1) → 4주 + 오행 + AI준비중 표시
//
// [Phase 2 재활성화]
//   NEXT_PUBLIC_MYEONDDARA_PHASE2_ENABLED=true 설정 후 재배포
// ====================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MYEONDDARA_SAJU_KEY, MYEONDDARA_RESULT_KEY } from "@/data/myeonddara";
import type { ManseryeokResult } from "@/lib/manseryeok";
import { buildRuleBasedGuide } from "@/lib/myeonddara-rules";

// ── Claude 분석 타입 ────────────────────────────────────────────
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
  saju:        ManseryeokResult;
  inputData:   InputData;
  hasAnalysis: boolean;
  analysis?:   ClaudeAnalysis;
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

function getStrengthLabel(count: number): string {
  if (count >= 3) return "강함";
  if (count === 2) return "보통";
  if (count === 1) return "약함";
  return "없음";
}

export default function MyeonddaraResultPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loadErr, setLoadErr]  = useState(false);

  useEffect(() => {
    try {
      // Phase 2 결과 우선, 없으면 Phase 1 결과 사용
      const resultRaw = sessionStorage.getItem(MYEONDDARA_RESULT_KEY);
      const sajuRaw   = sessionStorage.getItem(MYEONDDARA_SAJU_KEY);

      if (resultRaw) {
        const parsed = JSON.parse(resultRaw) as { saju: ManseryeokResult; analysis: ClaudeAnalysis; inputData: InputData };
        console.log("[명따라/result] Phase 2 세션 로드:", parsed.saju.summary);
        setSession({ ...parsed, hasAnalysis: true });
      } else if (sajuRaw) {
        const parsed = JSON.parse(sajuRaw) as { saju: ManseryeokResult; inputData: InputData };
        console.log("[명따라/result] Phase 1 세션 로드:", parsed.saju.summary);
        setSession({ ...parsed, hasAnalysis: false });
      } else {
        setLoadErr(true);
      }
    } catch (e) {
      console.error("[명따라/result] 세션 파싱 실패:", e);
      setLoadErr(true);
    }
  }, []);

  // ── 공통 헤더 ───────────────────────────────────────────────
  const Header = () => (
    <div className="sticky top-0 z-50 bg-white border-b border-base-border">
      <div className="flex items-center justify-between px-4 h-14">
        <button onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-off transition-colors"
          aria-label="뒤로가기">
          <ArrowLeft size={20} className="text-base-text" />
        </button>
        <h1 className="text-sm font-bold text-base-text">명따라 사주 분석</h1>
        <div className="w-9" />
      </div>
    </div>
  );

  // ── 에러 ────────────────────────────────────────────────────
  if (loadErr) {
    return (
      <div className="min-h-screen bg-base-off flex justify-center">
        <div className="w-full max-w-mobile bg-base-off">
          <Header />
          <div className="px-4 pt-12 text-center">
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

  // ── 로딩 스켈레톤 ───────────────────────────────────────────
  if (!session) {
    return (
      <div className="min-h-screen bg-base-off flex justify-center">
        <div className="w-full max-w-mobile bg-base-off pb-8">
          <Header />
          <div className="px-4 pt-4 flex flex-col gap-4 animate-pulse">
            <div className="h-44 bg-white rounded-card-lg shadow-card" />
            <div className="h-40 bg-white rounded-card-lg shadow-card" />
            <div className="h-32 bg-white rounded-card-lg shadow-card" />
          </div>
        </div>
      </div>
    );
  }

  const { saju, inputData, hasAnalysis, analysis } = session;
  const { yearPillar, monthPillar, dayPillar, hourPillar, ohaeng } = saju;
  const ruleGuide = buildRuleBasedGuide(saju);

  const ohaengBars = OHAENG_META.map((m) => ({
    ...m,
    count:   ohaeng[m.key as OhaengKey],
    percent: ohaeng[`${m.key}Percent` as keyof typeof ohaeng] as number,
  }));
  const maxCount = Math.max(...ohaengBars.map((b) => b.count), 1);

  const today = new Date();
  const todayLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-base-off pb-8">

        <Header />

        <div className="px-4 pt-4 flex flex-col gap-4">

          {/* ── 베타 안내 배너 ───────────────────────── */}
          <div className="rounded-card px-4 py-2.5 text-xs leading-relaxed text-center"
            style={{ backgroundColor: "#FFF9C4", color: "#7A5900" }}>
            📌 만세력 기반 계산 결과입니다. 절기 오차(±1일)가 있을 수 있어요.
          </div>

          {/* ── ① 4주 카드 ───────────────────────────── */}
          <div className="rounded-card-lg p-5 text-white"
            style={{ background: "linear-gradient(135deg, #1A3A6B, #2C5F8A)" }}>
            <p className="text-base font-bold mb-1">{inputData.name}의 사주</p>
            <p className="text-xs text-white/70 mb-4">
              {inputData.birthDateLabel} · {inputData.birthTimeLabel} · {inputData.gender}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "年", pillar: yearPillar },
                { label: "月", pillar: monthPillar },
                { label: "日", pillar: dayPillar },
                { label: "時", pillar: hourPillar },
              ].map(({ label, pillar }) => (
                <div key={label}
                  className="flex flex-col items-center gap-1 rounded-card py-3 px-1"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                  <span className="text-[10px] text-white/60">{label}柱</span>
                  {pillar ? (
                    <>
                      <span className="text-2xl font-bold leading-tight">{pillar.ganHanja}</span>
                      <span className="text-2xl font-bold leading-tight">{pillar.jiHanja}</span>
                      <span className="text-[10px] text-white/60 mt-0.5">
                        {pillar.ganKr}{pillar.jiKr}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl font-bold leading-tight text-white/30">—</span>
                      <span className="text-2xl font-bold leading-tight text-white/30">—</span>
                      <span className="text-[10px] text-white/40 mt-0.5">모름</span>
                    </>
                  )}
                </div>
              ))}
            </div>
            {/* Phase 2: 일간 설명 */}
            {hasAnalysis && analysis?.ilganDescription && (
              <p className="text-xs text-white/70 mt-4 leading-relaxed">
                {analysis.ilganDescription}
              </p>
            )}
          </div>

          {/* ── ② 오행 분포 카드 ─────────────────────── */}
          <div className="bg-white rounded-card-lg shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-base-text">오행 분포</h3>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: "#E84B2E" }}>
                주기운: {ohaeng.dominant}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {ohaengBars.map((bar) => {
                const isDominant = bar.count === maxCount;
                return (
                  <div key={bar.key} className="flex items-center gap-2">
                    <span className="text-base w-5 text-center">{bar.emoji}</span>
                    <span className="text-xs font-semibold text-base-text w-11">{bar.name}</span>
                    <div className="flex-1 bg-base-off rounded-full h-2.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width:           `${bar.count === 0 ? 0 : Math.max((bar.count / maxCount) * 100, 10)}%`,
                          backgroundColor: bar.color,
                          opacity:         isDominant ? 1 : 0.5,
                        }} />
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

          {/* ── Phase 1: 규칙 기반 정보 카드 + AI 준비중 안내 ── */}
          {!hasAnalysis && (
            <>
              {/* ① 일간 한줄 해설 */}
              <div className="bg-white rounded-card-lg shadow-card p-5">
                <p className="text-[11px] font-bold text-base-muted mb-3 tracking-wide uppercase">
                  일간(日干) · {saju.ilgan}
                </p>
                <div className="flex items-start gap-3">
                  <span className="text-3xl leading-none shrink-0">
                    {ruleGuide.ilganGuide.emoji}
                  </span>
                  <p className="text-sm text-base-text leading-relaxed">
                    {ruleGuide.ilganGuide.text}
                  </p>
                </div>
              </div>

              {/* ② 기질 키워드 */}
              <div className="bg-white rounded-card-lg shadow-card p-5">
                <h3 className="text-sm font-bold text-base-text mb-3">기질 키워드</h3>
                <div className="flex flex-wrap gap-2">
                  {ruleGuide.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: "#FFF0EB", color: "#C83A20" }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* ③ 부모 관찰 포인트 — 일상 체크리스트 */}
              <div className="bg-white rounded-card-lg shadow-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-base-text">부모 관찰 포인트</h3>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "#FFF0EB", color: "#C83A20" }}
                  >
                    체크해보세요
                  </span>
                </div>
                <p className="text-xs text-base-muted mb-3 leading-relaxed">
                  일상에서 아이를 관찰할 때 아래 질문을 떠올려 보세요.
                </p>
                <div className="flex flex-col gap-3">
                  {ruleGuide.observationPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span
                        className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: "#FFF0EB", color: "#C83A20" }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm text-base-text leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ⑤ 오행 균형 해설 */}
              <div className="bg-white rounded-card-lg shadow-card p-5">
                <h3 className="text-sm font-bold text-base-text mb-2">오행 균형</h3>
                <p className="text-sm text-base-text leading-relaxed">
                  {ruleGuide.ohaengBalance}
                </p>
              </div>

              {/* ⑥ 학습 스타일 가이드 */}
              <div className="bg-white rounded-card-lg shadow-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-bold text-base-text">학습 스타일</h3>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full text-white shrink-0"
                    style={{ backgroundColor: "#E84B2E" }}
                  >
                    {ruleGuide.learningStyle.style}
                  </span>
                </div>
                <p className="text-sm text-base-text leading-relaxed">
                  {ruleGuide.learningStyle.detail}
                </p>
              </div>

              {/* ⑦ 부모 가이드 팁 */}
              <div
                className="rounded-card-lg p-5 border border-orange-200"
                style={{ backgroundColor: "#FFF8F4" }}
              >
                <p className="text-xs font-bold mb-2" style={{ color: "#E84B2E" }}>
                  💌 부모님께
                </p>
                <p className="text-sm text-base-text leading-relaxed">
                  {ruleGuide.parentTip}
                </p>
              </div>

              {/* AI 준비중 안내 */}
              <div className="bg-white rounded-card-lg shadow-card p-6 text-center flex flex-col items-center gap-3">
                <span className="text-4xl">🔮</span>
                <h3 className="text-sm font-bold text-base-text">명따라 AI 기질 분석</h3>
                <p className="text-xs text-base-muted leading-relaxed">
                  현재는 기본 만세력 결과만 제공됩니다.<br />
                  타고난 기질 · 강점 · 추천 직업군 등<br />
                  심화 AI 해석은 준비 중입니다.
                </p>
                <span
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: "#FFF0EB", color: "#E84B2E" }}
                >
                  Coming Soon
                </span>
              </div>
            </>
          )}

          {/* ── Phase 2: Claude 분석 카드들 ──────────── */}
          {hasAnalysis && analysis && (
            <>
              {/* 타고난 기질 */}
              <div className="bg-white rounded-card-lg shadow-card p-5">
                <h3 className="text-sm font-bold text-base-text mb-3">타고난 기질</h3>
                {analysis.personalityTags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {analysis.personalityTags.map((tag) => (
                      <span key={tag}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: "#FFF0EB", color: "#C83A20" }}>
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

              {/* 강점 / 주의점 */}
              <div className="bg-white rounded-card-lg shadow-card p-5">
                <div className="flex flex-col gap-4">
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

              {/* 추천 직업군 */}
              {analysis.careers?.length > 0 && (
                <div className="bg-white rounded-card-lg shadow-card p-5">
                  <h3 className="text-sm font-bold text-base-text mb-3">추천 직업군</h3>
                  <div className="flex flex-col gap-3">
                    {analysis.careers.slice(0, 3).map((career) => (
                      <div key={career.rank}
                        className="rounded-card border border-base-border p-4 flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <span className="text-[10px] font-bold text-brand-red">{career.rank}위</span>
                          <span className="text-2xl leading-none">{career.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-base-text">{career.name}</p>
                            <span className="text-xs font-bold shrink-0 ml-2"
                              style={{ color: "#E84B2E" }}>
                              {career.fitPercent}%
                            </span>
                          </div>
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

              {/* 부모님께 드리는 말씀 */}
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

              {/* 오늘의 진로 운세 */}
              <div className="rounded-card-lg p-5 text-center"
                style={{ background: "linear-gradient(135deg, #1A3A6B, #2C5F8A)" }}>
                <p className="text-xs font-semibold text-white/70 mb-1 tracking-wide">✨ 오늘의 진로 운세</p>
                <p className="text-xs text-white/50 mb-3">{todayLabel}</p>
                <p className="text-sm font-medium text-white leading-relaxed mb-4">
                  {analysis.fortuneMessage}
                </p>
              </div>
            </>
          )}

          {/* ── 하단 버튼 ────────────────────────────── */}
          <div className="flex flex-col gap-3 mt-2">
            <button onClick={() => router.push("/myeonddara")} className="btn-secondary">
              다시 분석하기
            </button>
          </div>

          {/* ── 면책 ─────────────────────────────────── */}
          <p className="text-[11px] text-base-muted text-center leading-relaxed px-4 pb-2">
            명따라는 만세력 기반 참고용 진로 분석 서비스입니다. (베타)<br />
            아이의 가능성은 무한합니다. 💛
          </p>

        </div>
      </div>
    </div>
  );
}
