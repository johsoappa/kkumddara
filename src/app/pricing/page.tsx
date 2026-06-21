"use client";

// ====================================================
// 이용 안내 페이지 (/pricing) — 무료 베타 톤
// [v2.5] 가격·B2C 부가 항목 문서 v2.5 기준 UI/카피 반영 (무료 베타로 노출 OFF)
//
// [이번 작업 범위]
//   - UI/카피/문서 정리만. 결제 구현 없음.
//   - PG 연동 금지, 실제 결제 버튼 동작 금지
//   - DB / migration / RLS / Auth 변경 없음
//
// [티어 구조] Seed(무료) / Sprout(베이직) / Compass(프리미엄)
// [단건 항목] PDF 리포트 / 명따라 단건 — 가격 데이터는 보존, 무료 베타로 노출 OFF
// ====================================================

import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import CsPageLayout from "@/components/cs/CsPageLayout";

const ACCENT    = "#E84B2E";
const ACCENT_BG = "#FFF0EB";

// ─── 플랜 데이터 (보존 — 무료 베타로 화면 노출 OFF) ─────
interface PlanDef {
  id:          string;
  name:        string;
  nameSub:     string;
  badge:       string | null;
  priceM:      number;   // 월 요금 (0=무료)
  priceY:      number;   // 연 요금
  status:      "free" | "beta" | "coming";
  subtitle:    string;
  highlight:   boolean;
  features:    string[];
  cta:         string;
  ctaAction:   "start" | "disabled";
}

const PLANS: PlanDef[] = [
  {
    id:        "seed",
    name:      "Seed",
    nameSub:   "무료",
    badge:     null,
    priceM:    0,
    priceY:    0,
    status:    "free",
    subtitle:  "아이의 관심 탐색은 무료로 시작할 수 있습니다",
    highlight: false,
    features:  [
      "기본 직업 탐색",
      "기본 흥미 탐색 1종",
      "AI 진로 상담 월 3회",
      "자녀 1명 등록",
    ],
    cta:       "무료로 시작하기",
    ctaAction: "start",
  },
  {
    id:        "sprout",
    name:      "Sprout",
    nameSub:   "베이직",
    badge:     "베타 추천",
    priceM:    5900,
    priceY:    59000,
    status:    "beta",
    subtitle:  "한 아이의 진로 탐색을 꾸준히 기록합니다",
    highlight: true,
    features:  [
      "1개 모드 풀 이용",
      "73개 직업 로드맵 이용",
      "관심 탐색 3종 + 결과 저장",
      "단계형 미션 + 주간 미션",
      "학부모 리포트 월 1회",
      "명따라 1회 체험",
      "AI 진로 상담 월 20회\n(메시지 1건당 1회 차감)",
      "자녀 1명 등록",
    ],
    cta:       "베이직 준비 중",
    ctaAction: "disabled",
  },
  {
    id:        "compass",
    name:      "Compass",
    nameSub:   "프리미엄",
    badge:     "오픈 예정",
    priceM:    11900,
    priceY:    119000,
    status:    "coming",
    subtitle:  "형제자매와 함께 더 깊게 살펴봅니다",
    highlight: false,
    features:  [
      "Sprout 모든 기능 포함",
      "자녀 추가 등록",
      "AI 진로 상담 월 100회\n(메시지 1건당 1회 차감)",
      "명따라 심층 제공 예정",
      "학부모 리포트 월 2회",
    ],
    cta:       "프리미엄 오픈 예정",
    ctaAction: "disabled",
  },
];

// ─── 비교표 데이터 ────────────────────────────────────
const COMPARISON_ROWS = [
  { col: "핵심 역할",   free: "검사 결과와 직업 정보 확인",   paid: "관심사 → 직업 → 미션 → 기록 연결" },
  { col: "사용 방식",   free: "한 번 검사하고 결과 확인",      paid: "매주 작은 활동을 이어가며 관찰" },
  { col: "부모 참여",   free: "결과 확인 중심",                paid: "부모 리포트와 대화 질문 제공" },
  { col: "아이 경험",   free: "검사·정보 열람",                paid: "미션·발견·성취 기록" },
  { col: "지속성",      free: "결과 확인 후 끊기기 쉬움",      paid: "월간·분기 단위로 변화 확인" },
  {
    col:  "명따라",
    free: "없음",
    paid: "베이직 1회 체험, 프리미엄 심층 제공 예정",
  },
  {
    col:  "유료 가치",
    free: "해당 없음",
    paid: "기록, 리포트, AI 상담, 미션 운영, 명따라 성향 참고",
  },
];

// ─── FAQ 데이터 (무료 베타 톤) ──────────────────────────
const FAQ_ITEMS = [
  {
    q: "지금 정말 무료인가요?",
    a: "네. 현재 꿈따라는 무료 베타로 운영 중입니다.\n아이의 관심사 탐색, 직업 탐색, 로드맵과 미션 기능을 비용 없이 이용할 수 있습니다.",
  },
  {
    q: "나중에 유료 기능이 생기나요?",
    a: "정식 서비스 과정에서 일부 유료 기능이 도입될 수 있습니다.\n다만 유료 기능이 생길 경우, 이용자가 혼동하지 않도록 사전에 명확히 안내하겠습니다.",
  },
  {
    q: "베타 기간에는 무엇을 하면 좋나요?",
    a: "아이와 함께 관심사를 선택해보고, 끌리는 직업을 살펴본 뒤,\n로드맵과 미션을 보며 대화를 나눠보시면 좋습니다.",
  },
  {
    q: "학원이나 기관에서도 사용할 수 있나요?",
    a: "학원·기관 도입은 별도 안내 페이지에서 확인할 수 있습니다.\n파일럿 도입이나 제휴 문의가 필요한 경우 학원용 안내를 참고해주세요.",
  },
];

// ─── 성장단계 소개 (가격 무관 서비스 소개) ──────────────
const GROWTH_STAGES = [
  {
    emoji: "🌱",
    name:  "씨앗",
    step:  "좋아하는 것을 발견하는 단계",
    body:  "아직 꿈이 뚜렷하지 않아도 괜찮아요.\n아이가 좋아하는 것부터 천천히 찾아봅니다.",
  },
  {
    emoji: "🌿",
    name:  "새싹",
    step:  "관심을 직업으로 연결하는 단계",
    body:  "좋아하는 활동이 어떤 직업과 이어지는지 살펴봅니다.\n아이의 관심이 더 넓어질 수 있도록 도와줍니다.",
  },
  {
    emoji: "🧭",
    name:  "나침반",
    step:  "진로 방향을 구체화하는 단계",
    body:  "관심 있는 직업을 더 자세히 보고,\n로드맵과 미션으로 다음 행동을 정리합니다.",
  },
];

// ─── 가격 표기 헬퍼 ───────────────────────────────────
// [무료 베타 전환] 가격 숫자/통화 표기 노출 OFF.
//   PLANS의 priceM/priceY 데이터 구조는 보존하며, 화면 렌더링에서만 숨긴다.
//   정식 결제 오픈 시 가격 표기를 다시 켜면 된다.

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

// ─── 플랜 카드 (보존 — 현재 화면 비노출) ──────────────
function PlanCard({
  plan,
  onStart,
}: {
  plan:    PlanDef;
  onStart: () => void;
}) {
  const isComing  = plan.status === "coming";
  const isBeta    = plan.status === "beta";

  const badgeBg =
    isBeta   ? ACCENT     :
    isComing ? "#6B7280"  :
               "#9CA3AF";

  return (
    <div
      className="bg-white rounded-card-lg overflow-hidden"
      style={
        plan.highlight
          ? { border: `2px solid ${ACCENT}`, boxShadow: "0 4px 20px rgba(232,75,46,0.15)" }
          : { border: "2px solid transparent", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }
      }
    >
      {/* 배지 */}
      {plan.badge && (
        <div
          className="text-center py-1.5 text-xs font-bold text-white tracking-wide"
          style={{ backgroundColor: badgeBg }}
        >
          {plan.badge}
        </div>
      )}

      <div className="p-5">
        {/* 플랜명 */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <span
              className="text-base font-bold"
              style={{ color: plan.highlight ? ACCENT : "#1A1A1A" }}
            >
              {plan.name}
            </span>
            <span className="text-xs text-base-muted ml-1.5">{plan.nameSub}</span>
          </div>
          {isComing && (
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
            >
              오픈 예정
            </span>
          )}
        </div>

        {/* 부제목 */}
        <p className="text-xs text-base-muted leading-relaxed mb-3">{plan.subtitle}</p>

        {/* 가격 자리 — 무료 베타 안내 (가격 숫자 노출 OFF) */}
        <div className="mb-4">
          <span
            className="text-base font-bold"
            style={{ color: plan.highlight ? ACCENT : "#1A1A1A" }}
          >
            베타 기간 무료
          </span>
        </div>

        <div className="border-t border-base-border mb-4" />

        {/* 기능 목록 */}
        <ul className="flex flex-col gap-2.5 mb-5">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                className="text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5"
                style={{ backgroundColor: plan.highlight ? ACCENT : "#9CA3AF" }}
              >
                ✓
              </span>
              <span className="text-sm leading-snug font-medium text-base-text whitespace-pre-line">
                {f}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={plan.ctaAction === "start" ? onStart : undefined}
          disabled={plan.ctaAction === "disabled"}
          className="w-full py-3 rounded-button text-sm font-bold transition-opacity"
          style={
            plan.ctaAction === "disabled"
              ? { backgroundColor: "#F3F4F6", color: "#9CA3AF", cursor: "default" }
              : plan.highlight
                ? { backgroundColor: ACCENT, color: "#fff" }
                : { backgroundColor: ACCENT_BG, color: ACCENT }
          }
        >
          {plan.cta}
        </button>
      </div>
    </div>
  );
}

// ─── 단건 항목 카드 (보존 — 현재 화면 비노출) ─────────
function SingleItemCard({
  name,
  price,
  copy,
  sub,
  cta,
}: {
  name:  string;
  price: string;
  copy:  string;
  sub:   string;
  cta:   string;
}) {
  return (
    <div
      className="bg-white rounded-card p-4"
      style={{ border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-sm font-bold text-base-text leading-snug">{name}</span>
        <span className="text-sm font-bold shrink-0" style={{ color: ACCENT }}>{price}</span>
      </div>
      <p className="text-xs text-base-text leading-relaxed mb-1">{copy}</p>
      <p className="text-[11px] text-base-muted leading-relaxed mb-3">{sub}</p>
      <button
        disabled
        className="w-full py-2 rounded-button text-xs font-semibold"
        style={{ backgroundColor: "#F3F4F6", color: "#9CA3AF", cursor: "default" }}
      >
        {cta}
      </button>
    </div>
  );
}

// ─── 비교표 ──────────────────────────────────────────
function ComparisonTable() {
  return (
    <div className="overflow-hidden rounded-card-lg" style={{ border: "1px solid #E5E7EB" }}>
      {/* 헤더 */}
      <div className="grid grid-cols-3 text-center text-xs font-bold py-2.5 bg-gray-50">
        <span className="text-base-muted">구분</span>
        <span className="text-base-muted">무료 진로검사·<br />직업정보 서비스</span>
        <span style={{ color: ACCENT }}>꿈따라</span>
      </div>
      {/* 행 */}
      {COMPARISON_ROWS.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-3 text-center text-xs py-3 border-t border-base-border"
        >
          <span className="font-semibold text-base-muted px-1">{row.col}</span>
          <span className="text-base-muted px-1 leading-relaxed">{row.free}</span>
          <span className="font-medium px-1 leading-relaxed" style={{ color: "#1A1A1A" }}>{row.paid}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────
export default function PricingPage() {
  const router      = useRouter();

  const handleFreeStart = () => {
    router.push("/");
  };

  return (
    <CsPageLayout title="무료 베타 안내">
      <div className="flex flex-col gap-5">

        {/* ── 헤드라인 (무료 베타 안내) ── */}
        <div className="py-3 px-1">
          <h1 className="text-lg font-bold text-base-text mb-3 leading-snug text-center">
            꿈따라는 현재 무료 베타로 운영 중입니다.
          </h1>
          <p className="text-sm text-base-text leading-relaxed mb-2 text-center">
            아이의 관심사 탐색, 직업 탐색, 로드맵과 미션 기능을<br />
            비용 없이 이용할 수 있습니다.
          </p>
          <p className="text-xs text-base-muted leading-relaxed mb-4 text-center">
            지금은 더 많은 아이와 학부모가 부담 없이 사용해보고,<br />
            실제 피드백을 바탕으로 서비스를 다듬는 기간입니다.
          </p>

          {/* 안심 문구 */}
          <div className="rounded-card-lg p-3.5 mb-4" style={{ backgroundColor: ACCENT_BG }}>
            <p className="text-xs leading-relaxed" style={{ color: "#7C2D12" }}>
              베타 기간에는 화면에 표시된 진로 탐색 기능을 무료로 이용할 수 있습니다.
              정식 유료 기능이 도입될 경우, 사전에 명확히 안내하겠습니다.
            </p>
          </div>

          {/* 메인 CTA */}
          <button
            onClick={handleFreeStart}
            className="w-full py-3.5 rounded-button text-sm font-bold text-white active:opacity-80 transition-opacity"
            style={{ backgroundColor: ACCENT }}
          >
            무료로 진로 탐색 시작하기
          </button>
        </div>

        {/* ── 성장단계 서비스 소개 (가격과 무관) ── */}
        <div className="bg-white rounded-card-lg shadow-card p-5">
          <h2 className="text-base font-bold text-base-text mb-1">
            꿈따라는 이렇게 함께 자라요
          </h2>
          <p className="text-xs text-base-muted leading-relaxed mb-4">
            아이의 나이와 탐색 단계에 맞춰 관심을 발견하고, 직업으로 연결하고,
            진로 방향을 구체화합니다.
          </p>
          <div className="flex flex-col gap-3">
            {GROWTH_STAGES.map((stage) => (
              <div
                key={stage.name}
                className="flex items-start gap-3 rounded-card p-3.5"
                style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
              >
                <span className="text-2xl leading-none shrink-0">{stage.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-base-text">{stage.name}</span>
                    <span className="text-xs font-medium" style={{ color: ACCENT }}>
                      {stage.step}
                    </span>
                  </div>
                  <p className="text-xs text-base-muted leading-relaxed mt-1 whitespace-pre-line">
                    {stage.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── [무료 베타 전환] 플랜 비교(3카드) 숨김 — 코드·데이터 보존 ── */}
        {false && PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onStart={handleFreeStart}
          />
        ))}

        {/* ── [무료 베타 전환] 단건 항목 + 비교 섹션 숨김 — 코드·데이터 보존 ── */}
        {false && (
        <>
        <div
          className="rounded-card-lg p-4"
          style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
        >
          {/* eyebrow */}
          <p className="text-[11px] font-semibold uppercase tracking-widest text-base-muted mb-1">
            단건 리포트 미리보기
          </p>
          {/* 섹션 제목 */}
          <h2 className="text-sm font-bold text-base-text mb-1 leading-snug">
            필요한 리포트만 먼저 살펴보세요
          </h2>
          <p className="text-xs text-base-muted leading-relaxed mb-4">
            베타 기간에는 일부 리포트를 단건으로 미리 살펴볼 수 있습니다.
            아이의 관심 기록을 PDF로 정리하거나, 명따라 성향 리포트로 진로 대화의
            첫 질문을 만들어보세요.<br />
            꿈따라에 가입하면 무료 회원도 단건 리포트를 받아볼 수 있습니다.<br />
            <span className="font-medium text-base-text">
              단건은 한 번의 스냅샷, 꾸준한 기록은 매달의 변화입니다.
            </span>
          </p>

          {/* 단건 카드 2열 */}
          <div className="grid grid-cols-2 gap-3">
            <SingleItemCard
              name="꿈따라 진로 리포트 PDF"
              price="베타 무료"
              copy="아이의 관심 직업과 미션 기록을 PDF로 정리합니다."
              sub="베타 기간 동안 무료로 제공됩니다."
              cta="PDF 리포트 준비 중"
            />
            <SingleItemCard
              name="명따라 진로 성향 리포트"
              price="베타 무료"
              copy="생년월일시를 바탕으로 아이의 성향을 재미·참고용으로 살펴봅니다."
              sub="베타 기간 동안 무료로 제공됩니다. 단, 명따라는 재미·참고용 콘텐츠입니다."
              cta="명따라 단건 준비 중"
            />
          </div>
        </div>

        {/* ── 무엇이 다른가 (서비스 차별점) ── */}
        <div className="bg-white rounded-card-lg shadow-card p-5">
          <h2 className="text-sm font-bold text-base-text mb-1">
            꿈따라는 무엇이 다른가요?
          </h2>
          <p className="text-xs text-base-muted mb-4 leading-relaxed">
            일반 진로 검사·직업정보 서비스와 꿈따라의 차이입니다.
          </p>
          <ComparisonTable />
          <div className="mt-4 p-3 rounded-card" style={{ backgroundColor: ACCENT_BG }}>
            <p className="text-xs leading-relaxed" style={{ color: "#7C2D12" }}>
              꿈따라의 핵심 가치는 "정보"가 아니라 "이어가는 구조"에 있습니다.<br />
              명따라는 진로를 결정하는 도구가 아니라, 부모와 아이가 대화를 시작할 때
              도움이 되는 또 다른 관점입니다.
            </p>
          </div>
        </div>
        </>
        )}

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

        {/* ── FAQ ── */}
        <div className="bg-white rounded-card-lg shadow-card p-5">
          <h2 className="text-sm font-bold text-base-text mb-1">
            💬 자주 묻는 질문
          </h2>
          <p className="text-xs text-base-muted mb-4">
            무료 베타 이용에 대한 궁금증을 해결해 드려요
          </p>
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} item={item} />
          ))}
        </div>

        {/* ── 학원·기관 도입 안내 (B2B /academy) ── */}
        <button
          onClick={() => router.push("/academy")}
          className="rounded-card-lg p-4 text-left active:opacity-80 transition-opacity"
          style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
        >
          <p className="text-sm font-bold text-base-text">
            학원·기관 도입을 찾으신다면
          </p>
          <p className="text-xs mt-0.5 font-semibold" style={{ color: ACCENT }}>
            학원용 안내 보기 →
          </p>
        </button>

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
