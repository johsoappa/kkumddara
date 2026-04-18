"use client";

// ====================================================
// 학생 데모 홈 (/demo/student)
// - 로그인 없이 접근 가능
// - 샘플 데이터로 UI 체험
// - 저장 액션 시 GuestLoginPrompt 표시
// ====================================================

import Image from "next/image";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Zap, Compass, ChevronRight, Circle } from "lucide-react";
import GuestLoginPrompt from "@/components/ui/GuestLoginPrompt";
import { OCCUPATIONS } from "@/data/occupations";
import type { Grade, InterestField } from "@/types/family";
import { GRADE_LABEL, INTEREST_LABEL } from "@/types/family";

// ── 데모용 샘플 학생 데이터 ──────────────────────────
const DEMO_GRADE:     Grade          = "middle1";
const DEMO_INTERESTS: InterestField[] = ["it", "art"];
const DEMO_NAME = "지우";

const DEMO_MISSIONS = [
  { id: "d1", text: "관심 있는 IT 직업 3개 찾아보기",    stageTitle: "1단계: 탐색" },
  { id: "d2", text: "좋아하는 앱이나 게임을 만든 회사 조사", stageTitle: "1단계: 탐색" },
  { id: "d3", text: "코딩 체험 영상 10분 시청하기",        stageTitle: "1단계: 탐색" },
];

// 카테고리 → InterestField 역매핑
const CATEGORY_TO_INTEREST: Record<string, InterestField> = {
  "IT·기술":    "it",
  "예술·디자인": "art",
  "의료·과학":  "medical",
  "비즈니스·경영": "business",
  "교육·사회":  "education",
};

// 탐색 제안형 추천 이유 (수치/확정 표현 금지)
const CATEGORY_REASON: Record<string, string> = {
  "IT·기술":       "IT 관심사와 연결되는 직업이에요",
  "예술·디자인":   "예술·창작 관심사와 이어지는 직업이에요",
  "의료·과학":     "의료·과학을 좋아한다면 살펴볼 만해요",
  "비즈니스·경영": "비즈니스 관심사와 맞닿아 있는 직업이에요",
  "교육·사회":     "사람·사회에 관심 있다면 탐색해볼 만해요",
  "콘텐츠·미디어": "미디어·콘텐츠를 좋아한다면 어울릴 수 있어요",
  "공공·안전":     "정의·봉사에 관심 있다면 탐색해볼 만해요",
  "환경·미래산업": "미래 산업에 관심 있다면 주목할 직업이에요",
};

function getOccupationReason(category: string, interests: InterestField[]): string {
  const mapped = CATEGORY_TO_INTEREST[category];
  if (mapped && interests.includes(mapped)) {
    return CATEGORY_REASON[category] ?? "관심 분야와 연결되는 직업이에요";
  }
  return CATEGORY_REASON[category] ?? "탐색해보면 의외로 잘 맞을 수 있어요";
}

export default function DemoStudentPage() {
  const router = useRouter();
  const [showPrompt, setShowPrompt] = useState(false);

  const gradeLabel = GRADE_LABEL[DEMO_GRADE];

  const recommendedOccupations = useMemo(() => {
    const interestCategories = DEMO_INTERESTS.map((i) => {
      const found = Object.entries(CATEGORY_TO_INTEREST).find(([, v]) => v === i);
      return found ? found[0] : null;
    }).filter(Boolean) as string[];

    const matched = OCCUPATIONS.filter((o) => interestCategories.includes(o.category));
    return (matched.length > 0 ? matched : OCCUPATIONS).slice(0, 3);
  }, []);

  return (
    <>
      {showPrompt && <GuestLoginPrompt onClose={() => setShowPrompt(false)} />}

      <div className="min-h-screen bg-base-off flex justify-center">
        <div className="w-full max-w-mobile bg-base-off">

          {/* ── 헤더 ──────────────────────────────── */}
          <header className="sticky top-0 z-10 bg-white border-b border-base-border px-5 h-14 flex items-center justify-between">
            <Image
              src="/logo.png"
              alt="꿈따라"
              width={66}
              height={28}
              priority
              style={{ objectFit: "contain", objectPosition: "left center" }}
            />
            <button
              onClick={() => router.push("/")}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-base-border text-base-muted active:opacity-70"
            >
              로그인 / 가입
            </button>
          </header>

          {/* ── 데모 배너 ─────────────────────────── */}
          <div
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold"
            style={{ backgroundColor: "#FFF0EB", color: "#E84B2E" }}
          >
            <span>체험 모드</span>
            <span className="opacity-50">·</span>
            <span className="font-normal" style={{ color: "#E84B2E", opacity: 0.8 }}>샘플 데이터로 UI를 체험 중이에요</span>
          </div>

          {/* ── 체험 모드 제한 안내 ───────────────── */}
          <div className="mx-5 mt-3 rounded-card-lg border border-base-border bg-white px-4 py-3">
            <p className="text-xs text-base-muted leading-relaxed">
              체험 모드에서는 일부 기능이 제한됩니다.<br />
              <span className="text-base-text font-medium">학년 수정, 정보 저장, 개인화 기능</span>은 로그인 후 사용할 수 있습니다.
            </p>
          </div>

          <div className="px-5 py-6 flex flex-col gap-5">

            {/* ── 인사말 ────────────────────────────── */}
            <div>
              <p className="text-xs text-base-muted">
                {DEMO_NAME} · {gradeLabel}
              </p>
              <h1 className="mt-0.5 text-xl font-bold text-base-text leading-snug">
                오늘도 한 걸음씩,
                <br />
                <span style={{ color: "#E84B2E" }}>꿈따라</span> 나아가요
              </h1>
              {/* 수정 칩 → 게스트는 로그인 유도 */}
              <button
                onClick={() => setShowPrompt(true)}
                className="
                  mt-2.5 inline-flex items-center gap-1.5
                  bg-base-card border border-base-border
                  rounded-full px-3 py-1.5 text-xs text-base-muted
                  active:opacity-70 transition-opacity
                "
              >
                <span className="font-semibold text-base-text">{gradeLabel}</span>
                <span className="text-base-border">|</span>
                <span>
                  {DEMO_INTERESTS.map((f) => INTEREST_LABEL[f]).join(", ")}
                </span>
                <span style={{ color: "#E84B2E" }} className="font-semibold ml-0.5">
                  수정 ›
                </span>
              </button>
            </div>

            {/* ══════════════════════════════════════════
                섹션 1 — 오늘의 미션 (샘플)
            ══════════════════════════════════════════ */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Zap size={15} strokeWidth={2} style={{ color: "#E84B2E" }} />
                  <h2 className="text-sm font-bold text-base-text">오늘의 미션</h2>
                </div>
              </div>

              <div className="bg-white rounded-card-lg shadow-card overflow-hidden">
                {/* 진행 바 */}
                <div className="px-4 pt-4 pb-3 border-b border-base-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg leading-none">💻</span>
                      <span className="text-sm font-bold text-base-text">소프트웨어 개발자</span>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: "#E84B2E" }}>
                      20%
                    </span>
                  </div>
                  <div className="h-1.5 bg-base-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: "20%", backgroundColor: "#E84B2E" }}
                    />
                  </div>
                  <p className="text-xs text-base-muted mt-1">1/5개 완료 (샘플)</p>
                </div>

                {/* 미션 목록 */}
                {DEMO_MISSIONS.map((mission, idx) => (
                  <button
                    key={mission.id}
                    onClick={() => setShowPrompt(true)}
                    className={`
                      w-full px-4 py-3.5 flex items-start gap-3 text-left
                      hover:bg-base-off transition-colors
                      ${idx < DEMO_MISSIONS.length - 1 ? "border-b border-base-border" : ""}
                    `}
                  >
                    <Circle size={18} className="text-base-border mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-base-muted mb-0.5">{mission.stageTitle}</p>
                      <p className="text-sm font-medium text-base-text leading-snug">
                        {mission.text}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-base-muted shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            </section>

            {/* ══════════════════════════════════════════
                섹션 2 — 추천 직업 (실제 데이터)
            ══════════════════════════════════════════ */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Compass size={15} strokeWidth={2} style={{ color: "#E84B2E" }} />
                  <h2 className="text-sm font-bold text-base-text">관심 분야 추천 직업</h2>
                </div>
                <button
                  onClick={() => router.push("/explore")}
                  className="text-xs text-base-muted flex items-center gap-0.5"
                >
                  더 보기 <ChevronRight size={12} />
                </button>
              </div>

              {/* 관심 분야 뱃지 */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {DEMO_INTERESTS.map((f) => (
                  <span
                    key={f}
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "#FFF0EB", color: "#E84B2E" }}
                  >
                    {INTEREST_LABEL[f]}
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-2.5">
                {recommendedOccupations.map((occ) => (
                  <button
                    key={occ.id}
                    onClick={() => router.push(`/roadmap/${occ.id}`)}
                    className="
                      bg-white rounded-card-lg shadow-card px-4 py-3.5
                      flex items-start gap-3 text-left
                      hover:shadow-card-hover active:scale-[0.99] transition-all
                    "
                  >
                    <span className="text-2xl leading-none shrink-0 mt-0.5">{occ.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-base-text">{occ.name}</p>
                      <p className="text-xs text-base-muted mt-0.5 leading-relaxed">
                        {getOccupationReason(occ.category, DEMO_INTERESTS)}
                      </p>
                      {occ.preparations?.[0] && (
                        <p className="text-[11px] mt-1.5 leading-relaxed truncate"
                          style={{ color: "#E84B2E" }}>
                          → {occ.preparations[0]}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={15} className="text-base-muted shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </section>

            {/* ── 로그인 CTA ─────────────────────────── */}
            <button
              onClick={() => router.push("/")}
              className="w-full py-4 rounded-button text-sm font-bold text-white flex items-center justify-center gap-1.5"
              style={{ backgroundColor: "#E84B2E" }}
            >
              로그인하고 내 진로 기록 시작하기
              <ChevronRight size={16} />
            </button>
            <p className="text-center text-xs text-base-muted -mt-2">
              14일 무료 체험 · 자동결제 없음
            </p>

          </div>
        </div>
      </div>
    </>
  );
}
