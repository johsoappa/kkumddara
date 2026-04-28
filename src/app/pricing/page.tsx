"use client";

// ====================================================
// 요금제 페이지 (/pricing)
// [2차 개편] UI/UX — 아이의 변화 중심 구조 개편
//
// [변경 내용]
//   - 카드 순서: 베이직 → 프리미엄(추천·강조) → 패밀리
//   - 무료 플랜: 보조 카드(FreePlanBox)로 분리
//   - Plan 인터페이스: desc → subtitle, highlight 유지
//   - Feature 인터페이스: subLabel 추가 (AI 설명 보조)
//   - 상단 헤드라인: 아이의 변화 중심 문구
//   - CTA: "내 아이 진로 지도 만들기"
//   - AI 베타 안내 박스 추가
//   - FAQ 현실화 (베타·결제 준비 중 안내)
//
// [정책 준수]
//   - family_plus 미추가 (3차 작업 예정)
//   - "자녀당 월 60회" 문구 미사용 (ai_consult_usage가 parent 기준)
//   - "7일 무료 체험" / "첫 달 1,000원" / "000명 부모님" 미사용
//   - "주간 정밀 리포트" 핵심 기능 과장 미사용
//   - AI_CONSULT_ENABLED 변경 없음
//   - DB / 타입 / migration 수정 없음
// ====================================================

import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import CsPageLayout from "@/components/cs/CsPageLayout";

// ─── 공용 상수 ─────────────────────────────────────────
const ACCENT = "#E84B2E";
const ACCENT_BG = "#FFF0EB";

// ─── 타입 ────────────────────────────────────────────
interface Feature {
  label:     string;
  included:  boolean;
  badge?:    string;    // "✨" 등 인라인 강조 배지
  subLabel?: string;   // label 아래 보조 설명 (작은 글씨)
}

interface Plan {
  name:      string;
  badge?:    string;    // 카드 상단 배지 ("추천" / "다자녀")
  price:     string;
  period:    string;
  target:    string;    // 대상 태그 (예: "자녀 1명")
  subtitle:  string;    // 플랜 부제목
  features:  Feature[];
  highlight: boolean;   // 프리미엄 강조 카드 여부
}

// ─── 메인 요금제 카드 데이터 ──────────────────────────
// [카드 순서] 베이직 → 프리미엄(추천) → 패밀리
// [무료 플랜] 별도 FreePlanBox 컴포넌트로 처리
//
// [AI 한도 기준 - 018 migration]
//   free=3 / basic=30 / premium=100 / family=60(가구 기준)
//   가격: basic=9,900 / premium=14,900 / family=19,900
//   family "자녀당" 표현 금지 — ai_consult_usage가 parent+month 기준
//   family_plus: 미구현, 이번 작업 제외
const PLANS: Plan[] = [
  // ── 베이직 ───────────────────────────────────────────
  {
    name:      "베이직",
    price:     "9,900원",
    period:    "월",
    target:    "자녀 1명",
    highlight: false,
    subtitle:  "우리 아이 진로 탐색의 가벼운 시작",
    features: [
      {
        label:    "AI 진로 코칭 솔루션 월 30회",
        included: true,
        badge:    "✨",
        subLabel: "질문 생성, 부모 대화 가이드 포함",
      },
      { label: "자녀 1명 집중 관리",                   included: true },
      { label: "진로 탐색 50개 직업 전체 열람",        included: true },
      {
        label:    "명따라 정밀 진로 성향 리포트",
        included: true,
        badge:    "✨",
        subLabel: "연 3회 제공 (1학기·2학기·연말)",
      },
      { label: "공동 양육자 초대 (1명)", included: true },
      { label: "대화 히스토리 저장",     included: true },
    ],
  },

  // ── 프리미엄 (추천·강조) ──────────────────────────────
  {
    name:      "프리미엄",
    badge:     "추천",
    price:     "14,900원",
    period:    "월",
    target:    "자녀 1명 집중",
    highlight: true,
    subtitle:  "아이의 변화를 깊이 있게 만드는 밀착 관리",
    features: [
      {
        label:    "AI 진로 코칭 솔루션 월 100회",
        included: true,
        badge:    "✨",
        subLabel: "질문 생성, 부모 대화 가이드, 관심사 기반 활동 추천 포함",
      },
      { label: "자녀 1명 집중 관리",                   included: true },
      { label: "진로 탐색 50개 직업 전체 열람",        included: true },
      {
        label:    "명따라 정밀 진로 성향 리포트",
        included: true,
        badge:    "✨",
        subLabel: "연 3회 제공 + 관심사 변화 흐름 심층 점검",
      },
      { label: "공동 양육자 초대 (1명)", included: true },
      { label: "대화 히스토리 저장",     included: true },
    ],
  },

  // ── 패밀리 ───────────────────────────────────────────
  {
    name:      "패밀리",
    badge:     "다자녀",
    price:     "19,900원",
    period:    "월",
    target:    "자녀 2명",
    highlight: false,
    subtitle:  "두 자녀의 꿈을 함께 키우는 경제적인 선택",
    features: [
      {
        label:    "AI 진로 코칭 솔루션 가구 월 60회",
        included: true,
        badge:    "✨",
        subLabel: "질문 생성, 부모 대화 가이드 포함",
      },
      { label: "자녀 2명 관리",                        included: true },
      { label: "두 자녀의 관심사와 진로 흐름 관리",    included: true },
      {
        label:    "명따라 정밀 진로 성향 리포트",
        included: true,
        badge:    "✨",
        subLabel: "각 연 3회 제공 (1학기·2학기·연말)",
      },
      { label: "공동 양육자 초대 (1명)", included: true },
      { label: "대화 히스토리 저장",     included: true },
    ],
  },
];

// ─── FAQ 데이터 ────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "지금 결제해야 하나요?",
    a: "아니요. 현재는 베타 기간으로, 정식 결제 기능은 추후 안내됩니다.\n지금은 무료로 먼저 꿈따라를 경험해볼 수 있어요.",
  },
  {
    q: "AI 코칭은 바로 사용할 수 있나요?",
    a: "AI 코칭 기능은 베타 안정화 중이며, 정식 오픈 시 순차 적용됩니다.\n안정적인 서비스 제공을 위해 준비하고 있어요.",
  },
  {
    q: "패밀리 플랜은 어떤 가정에 적합한가요?",
    a: "두 자녀의 관심사와 진로 탐색 흐름을 함께 관리하고 싶은 가정에 적합합니다.",
  },
  {
    q: "무료로 먼저 써볼 수 있나요?",
    a: "네. 베타 기간 동안 무료로 먼저 경험해볼 수 있도록 안내합니다.\n지금 바로 시작해보세요.",
  },
  {
    q: "언제든지 해지할 수 있나요?",
    a: "네. 마이페이지에서 언제든 해지 가능합니다.\n해지 후 다음 결제일부터 중단됩니다.",
  },
  {
    q: "환불이 되나요?",
    a: "결제 후 24시간 이내 무조건 전액 환불됩니다.\n자세한 내용은 환불정책을 확인해 주세요.",
  },
];

// ─── FAQ 아이템 (아코디언) ────────────────────────────
function FaqItem({ item }: { item: { q: string; a: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-base-border last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-1 py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-base-text flex items-center gap-2">
          <span style={{ color: ACCENT }}>Q.</span>
          {item.q}
        </span>
        {open
          ? <ChevronUp size={15} className="text-base-muted shrink-0" />
          : <ChevronDown size={15} className="text-base-muted shrink-0" />
        }
      </button>
      {open && (
        <p className="text-sm text-base-text leading-relaxed px-1 pb-4 whitespace-pre-line">
          <span className="font-semibold" style={{ color: ACCENT }}>A. </span>
          {item.a}
        </p>
      )}
    </div>
  );
}

// ─── 메인 요금제 카드 ──────────────────────────────────
function PlanCard({ plan, onStart }: { plan: Plan; onStart: () => void }) {
  return (
    <div
      className="bg-white rounded-card-lg overflow-hidden"
      style={
        plan.highlight
          ? {
              border: `2px solid ${ACCENT}`,
              boxShadow: "0 4px 20px rgba(232,75,46,0.15)",
            }
          : {
              border: "2px solid transparent",
              boxShadow: "0 1px 8px rgba(0,0,0,0.07)",
            }
      }
    >
      {/* 상단 배지 */}
      {plan.badge && (
        <div
          className="text-center py-1.5 text-xs font-bold text-white tracking-wide"
          style={{
            backgroundColor: plan.highlight ? ACCENT : "#9CA3AF",
          }}
        >
          {plan.highlight ? "⭐ " : ""}
          {plan.badge} 플랜
        </div>
      )}

      <div className="p-5">
        {/* 플랜명 + 대상 태그 */}
        <div className="flex items-center justify-between mb-1">
          <h2
            className="text-base font-bold"
            style={{ color: plan.highlight ? ACCENT : "#1A1A1A" }}
          >
            {plan.name}
          </h2>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: ACCENT_BG, color: ACCENT }}
          >
            {plan.target}
          </span>
        </div>

        {/* 부제목 */}
        <p className="text-xs text-base-muted leading-relaxed mb-3">
          {plan.subtitle}
        </p>

        {/* 가격 */}
        <div className="flex items-baseline gap-1 mb-4">
          <span
            className="text-2xl font-bold"
            style={{ color: plan.highlight ? ACCENT : "#1A1A1A" }}
          >
            {plan.price}
          </span>
          <span className="text-xs text-base-muted">/ {plan.period}</span>
        </div>

        {/* 구분선 */}
        <div className="border-t border-base-border mb-4" />

        {/* 혜택 목록 */}
        <ul className="flex flex-col gap-3 mb-5">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              {f.included ? (
                <span
                  className="text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5"
                  style={{ backgroundColor: ACCENT }}
                >
                  ✓
                </span>
              ) : (
                <span className="text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center bg-base-border text-base-muted shrink-0 mt-0.5">
                  ✗
                </span>
              )}
              <div className="flex flex-col">
                <span
                  className={`text-sm leading-snug ${
                    f.included ? "font-medium text-base-text" : "text-base-muted line-through"
                  }`}
                >
                  {f.label}
                  {f.badge && (
                    <span className="ml-1 text-xs">{f.badge}</span>
                  )}
                </span>
                {f.subLabel && f.included && (
                  <span className="text-[11px] text-base-muted leading-relaxed mt-0.5">
                    {f.subLabel}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* CTA 버튼 */}
        <button
          onClick={onStart}
          className="w-full py-3 rounded-button text-sm font-bold active:opacity-80 transition-opacity"
          style={
            plan.highlight
              ? { backgroundColor: ACCENT, color: "#fff" }
              : { backgroundColor: ACCENT_BG, color: ACCENT }
          }
        >
          내 아이 진로 지도 만들기
        </button>
      </div>
    </div>
  );
}

// ─── 무료 플랜 보조 카드 ──────────────────────────────
function FreePlanBox({ onStart }: { onStart: () => void }) {
  return (
    <div
      className="bg-white rounded-card-lg p-5"
      style={{ border: "1.5px dashed #D1D5DB" }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-base-text">무료 플랜</span>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
          >
            베타 기간 무료
          </span>
        </div>
        <span className="text-lg font-bold text-base-text">0원</span>
      </div>

      {/* 부제목 */}
      <p className="text-xs text-base-muted leading-relaxed mb-3">
        부담 없이 먼저 경험하는 진로 탐색 시작점
      </p>

      {/* 혜택 */}
      <ul className="flex flex-col gap-1.5 mb-4">
        {[
          "AI 진로 코칭 맛보기 월 3회",
          "자녀 1명 등록",
          "기본 진로 탐색 흐름 체험",
          "베타 기간 무료 이용",
        ].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="text-xs text-base-muted">•</span>
            <span className="text-xs text-base-muted">{item}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onStart}
        className="w-full py-2.5 rounded-button text-sm font-semibold active:opacity-80 transition-opacity"
        style={{ backgroundColor: "#F3F4F6", color: "#374151" }}
      >
        무료로 먼저 시작하기
      </button>
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────
export default function PricingPage() {
  const router = useRouter();

  // 유료 플랜 CTA — 결제 연동 전 안내 alert
  const handlePaidStart = () => {
    alert(
      "정식 결제 기능은 준비 중입니다.\n지금은 무료로 먼저 꿈따라를 경험해볼 수 있어요."
    );
  };

  // 무료 플랜 CTA — 홈(/)으로 이동
  const handleFreeStart = () => {
    router.push("/");
  };

  return (
    <CsPageLayout title="요금제 안내">
      <div className="flex flex-col gap-5">

        {/* ── 상단 헤드라인 ── */}
        <div className="text-center py-3 px-1">
          <h1 className="text-lg font-bold text-base-text mb-2 leading-snug">
            아이의 관심사가<br />진로 방향으로 이어지도록
          </h1>
          <p className="text-xs text-base-muted leading-relaxed">
            꿈따라는 단순한 직업 추천이 아니라,<br />
            아이의 관심사와 부모의 대화를 바탕으로<br />
            진로 탐색 흐름을 만들어갑니다.
          </p>
          <p
            className="text-xs font-semibold mt-3 px-3 py-1.5 rounded-full inline-block"
            style={{ backgroundColor: ACCENT_BG, color: ACCENT }}
          >
            베타 기간 동안 무료로 먼저 경험해볼 수 있어요
          </p>
        </div>

        {/* ── 메인 요금제 카드 (베이직 → 프리미엄 → 패밀리) ── */}
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.name}
            plan={plan}
            onStart={handlePaidStart}
          />
        ))}

        {/* ── 무료 플랜 보조 카드 ── */}
        <FreePlanBox onStart={handleFreeStart} />

        {/* ── AI 베타 안내 박스 ── */}
        <div
          className="rounded-card-lg p-4"
          style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: "#92400E" }}>
            📢 AI 코칭 기능 안내
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "#92400E" }}>
            AI 코칭 기능은 베타 안정화 중이며, 정식 오픈 시 순차 적용됩니다.
            <br />정식 결제 기능도 추후 안내될 예정입니다.
          </p>
        </div>

        {/* ── 신뢰 안내 문구 ── */}
        <div
          className="rounded-card-lg p-4 text-center"
          style={{ backgroundColor: "#F9FAFB" }}
        >
          <p className="text-xs text-base-muted leading-relaxed">
            언제든 부담 없이 시작할 수 있도록<br />
            결제 전 체험 흐름을 먼저 제공합니다.
          </p>
        </div>

        {/* ── FAQ ── */}
        <div className="bg-white rounded-card-lg shadow-card p-5">
          <h2 className="text-sm font-bold text-base-text mb-1">
            💬 자주 묻는 질문
          </h2>
          <p className="text-xs text-base-muted mb-4">
            요금제 관련 궁금증을 해결해 드려요
          </p>
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} item={item} />
          ))}
        </div>

        {/* ── 환불정책 링크 ── */}
        <button
          onClick={() => router.push("/refund")}
          className="text-xs text-base-muted underline text-center py-1 active:opacity-60"
        >
          환불정책 전문 보기 →
        </button>

      </div>
    </CsPageLayout>
  );
}
