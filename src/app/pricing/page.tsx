"use client";

// ====================================================
// 요금제 페이지 (/pricing)
// [v2.5] 가격·B2C 부가상품 문서 v2.5 기준 UI/카피 반영
//
// [이번 작업 범위]
//   - UI/카피/문서 정리만. 결제 구현 없음.
//   - PG 연동 금지, 실제 결제 버튼 동작 금지
//   - DB / migration / RLS / Auth 변경 없음
//
// [티어 구조] Seed(무료) / Sprout(베이직) / Compass(프리미엄)
// [단건 상품] PDF 리포트(₩3,900) / 명따라 단건(₩6,900)
// ====================================================

import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import CsPageLayout from "@/components/cs/CsPageLayout";

const ACCENT    = "#E84B2E";
const ACCENT_BG = "#FFF0EB";

// ─── 요금제 데이터 ────────────────────────────────────
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
    subtitle:  "검사는 무료로도 할 수 있습니다",
    highlight: false,
    features:  [
      "기본 직업 탐색",
      "진로 검사 1종",
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
      "진로 검사 3종 + 결과 저장",
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

// ─── FAQ 데이터 ────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "지금 결제해야 하나요?",
    a: "아니요. 현재는 베타 기간으로, 정식 결제 기능은 추후 안내됩니다.\n지금은 무료로 먼저 꿈따라를 경험해볼 수 있어요.",
  },
  {
    q: "AI 상담 20회는 무엇을 기준으로 1회인가요?",
    a: "AI 상담은 \"보낸 메시지 1건 = 1회\" 기준으로 계산됩니다.\n부모님이 AI에게 질문을 보내는 순간 1회가 차감되며, AI의 답변은 별도로 차감하지 않습니다.\n예를 들어 \"아이가 축구를 좋아하는데 어떤 직업을 함께 볼 수 있나요?\"라고 질문하면 1회가 사용됩니다.",
  },
  {
    q: "구매한 단건 리포트는 언제까지 볼 수 있나요?",
    a: "PDF 리포트는 구매 후 다운로드해 보관할 수 있습니다.\n다운로드한 PDF 파일은 사용자 기기에 저장되므로, 직접 보관할 수 있습니다.\n명따라 리포트는 계정이 유지되는 동안 서비스 안에서 다시 볼 수 있도록 운영하는 방향을 제안합니다.\n단, 계정 삭제 또는 서비스 종료 시에는 다시 보기 기능이 제한될 수 있습니다.\n구체적인 보관 기간과 다운로드 가능 기간은 저장 비용과 운영 정책 검토 후 최종 확정됩니다.",
  },
  {
    q: "연간 요금제는 어떻게 할인되나요?",
    a: "연간 요금제는 월 요금 대비 약 2개월 무료 혜택이 적용됩니다.\nSprout 베이직의 경우 월 ₩5,900 × 12 = ₩70,800이지만, 연간 결제 시 ₩59,000으로 이용할 수 있습니다.",
  },
  {
    q: "무료로 먼저 써볼 수 있나요?",
    a: "네. 베타 기간 동안 무료로 먼저 경험해볼 수 있도록 안내합니다.\n지금 바로 시작해보세요.",
  },
  {
    q: "언제든지 해지할 수 있나요?",
    a: "현재 꿈따라는 베타 운영 단계로 정식 유료 결제 기능은 아직 제공하지 않습니다.\n따라서 지금은 구독 해지 대상 결제가 없습니다. 정식 결제 기능 오픈 시 구독 해지 방법을 별도로 안내하겠습니다.",
  },
  {
    q: "환불이 되나요?",
    a: "현재는 베타 무료 이용 단계로 실제 결제가 발생하지 않아 환불 대상 결제가 없습니다.\n정식 결제 기능 오픈 시 환불 가능 조건과 처리 기준은 환불정책에서 안내하겠습니다.",
  },
];

// ─── 가격 표기 헬퍼 ───────────────────────────────────
function formatPrice(n: number) {
  return "₩" + n.toLocaleString("ko-KR");
}

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

// ─── 요금제 카드 ──────────────────────────────────────
function PlanCard({
  plan,
  annual,
  onStart,
}: {
  plan:    PlanDef;
  annual:  boolean;
  onStart: () => void;
}) {
  const isFree    = plan.priceM === 0;
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

        {/* 가격 */}
        {isFree ? (
          <div className="mb-4">
            <span className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>₩0</span>
            <span className="text-xs text-base-muted ml-1">/ 월</span>
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex items-baseline gap-1">
              <span
                className="text-2xl font-bold"
                style={{ color: plan.highlight ? ACCENT : "#1A1A1A" }}
              >
                {formatPrice(plan.priceM)}
              </span>
              <span className="text-xs text-base-muted">/ 월</span>
            </div>
            {annual && (
              <div className="mt-0.5 flex flex-col gap-0.5">
                <span className="text-xs text-base-muted">
                  연 {formatPrice(plan.priceY)}
                </span>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: ACCENT }}
                >
                  약 2개월 무료
                </span>
              </div>
            )}
          </div>
        )}

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

// ─── 단건 상품 카드 (서브 크기) ──────────────────────
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
  const [annual, setAnnual] = useState(false);

  const handleFreeStart = () => {
    router.push("/");
  };

  return (
    <CsPageLayout title="요금제 안내">
      <div className="flex flex-col gap-5">

        {/* ── 헤드라인 ── */}
        <div className="text-center py-3 px-1">
          <h1 className="text-lg font-bold text-base-text mb-2 leading-snug">
            아이의 관심이 진로 대화로 이어지도록
          </h1>
          <p className="text-xs text-base-muted leading-relaxed mb-2">
            검사는 무료로도 할 수 있습니다.
          </p>
          <p className="text-xs text-base-muted leading-relaxed">
            꿈따라는 부모와 아이가 함께 직업을 살펴보고,<br />
            작은 미션을 실천하며, 변화를 기록하는 진로 탐색 서비스입니다.
          </p>
          <p
            className="text-xs font-semibold mt-3 px-3 py-1.5 rounded-full inline-block"
            style={{ backgroundColor: ACCENT_BG, color: ACCENT }}
          >
            베타 기간 동안 무료로 먼저 경험해볼 수 있어요
          </p>
        </div>

        {/* ── 월간/연간 토글 ── */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setAnnual(false)}
            className="text-xs font-semibold px-4 py-1.5 rounded-full transition-colors"
            style={
              !annual
                ? { backgroundColor: ACCENT, color: "#fff" }
                : { backgroundColor: "#F3F4F6", color: "#6B7280" }
            }
          >
            월간
          </button>
          <button
            onClick={() => setAnnual(true)}
            className="text-xs font-semibold px-4 py-1.5 rounded-full transition-colors"
            style={
              annual
                ? { backgroundColor: ACCENT, color: "#fff" }
                : { backgroundColor: "#F3F4F6", color: "#6B7280" }
            }
          >
            연간 <span className="ml-1" style={{ color: annual ? "#FFD6CC" : "#9CA3AF" }}>약 2개월 무료</span>
          </button>
        </div>

        {/* ── 3개 티어 카드 ── */}
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            annual={annual}
            onStart={handleFreeStart}
          />
        ))}

        {/* ── 단건 상품 섹션 ── */}
        <div
          className="rounded-card-lg p-4"
          style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
        >
          {/* eyebrow */}
          <p className="text-[11px] font-semibold uppercase tracking-widest text-base-muted mb-1">
            구독 전 입문 상품
          </p>
          {/* 섹션 제목 */}
          <h2 className="text-sm font-bold text-base-text mb-1 leading-snug">
            구독 전, 필요한 리포트만 먼저 경험해보세요
          </h2>
          <p className="text-xs text-base-muted leading-relaxed mb-4">
            꿈따라는 구독 전에도 일부 리포트를 단건으로 이용할 수 있습니다.
            아이의 관심 기록을 PDF로 정리하거나, 명따라 성향 리포트로 진로 대화의
            첫 질문을 만들어보세요.<br />
            꿈따라에 가입만 하면 무료 회원도 단건 리포트를 구매할 수 있습니다.<br />
            <span className="font-medium text-base-text">
              단건은 한 번의 스냅샷, 구독은 매달의 변화 기록입니다.
            </span>
          </p>

          {/* 단건 카드 2열 */}
          <div className="grid grid-cols-2 gap-3">
            <SingleItemCard
              name="꿈따라 진로 리포트 PDF"
              price="₩3,900"
              copy="아이의 관심 직업과 미션 기록을 PDF로 정리합니다."
              sub="구독 없이 무료 회원도 구매 가능합니다."
              cta="PDF 리포트 준비 중"
            />
            <SingleItemCard
              name="명따라 진로 성향 리포트"
              price="₩6,900"
              copy="생년월일시를 바탕으로 아이의 성향을 재미·참고용으로 살펴봅니다."
              sub="구독 없이 무료 회원도 구매 가능합니다. 단, 명따라는 재미·참고용 콘텐츠입니다."
              cta="명따라 단건 준비 중"
            />
          </div>
        </div>

        {/* ── 왜 유료인가 ── */}
        <div className="bg-white rounded-card-lg shadow-card p-5">
          <h2 className="text-sm font-bold text-base-text mb-1">
            꿈따라 유료 구독, 무엇이 다른가요?
          </h2>
          <p className="text-xs text-base-muted mb-4 leading-relaxed">
            무료 진로 검사·직업정보 서비스와 꿈따라의 차이입니다.
          </p>
          <ComparisonTable />
          <div className="mt-4 p-3 rounded-card" style={{ backgroundColor: ACCENT_BG }}>
            <p className="text-xs leading-relaxed" style={{ color: "#7C2D12" }}>
              꿈따라의 유료 가치는 "정보"가 아니라 "이어가는 구조"에 있습니다.<br />
              명따라는 진로를 결정하는 도구가 아니라, 부모와 아이가 대화를 시작할 때
              도움이 되는 또 다른 관점입니다.
            </p>
          </div>
        </div>

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
