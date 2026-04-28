"use client";

// ====================================================
// 요금제 페이지 (/pricing)
// ====================================================

import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import CsPageLayout from "@/components/cs/CsPageLayout";

// ─── 타입 ────────────────────────────────────────────
interface Feature {
  label: string;
  included: boolean;
  badge?: string; // "✨" 등 강조 배지
}

interface Plan {
  name: string;
  badge?: string;       // "인기" 등
  price: string;
  period: string;
  target: string;
  features: Feature[];
  desc: string;
  highlight: boolean;   // 레드오렌지 보더 강조
}

// ─── 요금제 데이터 (018 최신화 기준) ──────────────────────
// max_guardians 의미: 추가 초대 가능한 공동양육자 수 (부모 미포함)
//   free=0(보호자1=부모만) / basic,family,premium=1(보호자2명)
// AI 코치 메시지: free=3, basic=30, family=60, premium=100
// 가격: basic=9,900 / family=19,900 / premium=14,900
// 명따라: 아이당 연 3회 (1학기·2학기·연말)
const PLANS: Plan[] = [
  {
    name:      "무료",
    price:     "0원",
    period:    "월",
    target:    "처음 가입한 모든 분",
    highlight: false,
    desc:      "꿈따라를 먼저 경험해보세요",
    features: [
      { label: "아이 1명 관리",                  included: true  },
      { label: "직업 탐색 50개",                 included: true  },
      { label: "로드맵 미리보기 1개",            included: true  },
      { label: "AI 코치 메시지 월 3개",          included: true  },
      { label: "보호자 1명 (부모 본인)",         included: true  },
      { label: "명따라",                         included: false },
      { label: "주간 리포트",                    included: false },
      { label: "공동 양육자 초대",               included: false },
    ],
  },
  {
    name:      "베이직",
    price:     "9,900원",
    period:    "월",
    target:    "자녀 1명",
    highlight: false,
    desc:      "진로 탐색을 제대로 시작하고 싶은 분께",
    features: [
      { label: "아이 1명 관리",                                    included: true  },
      { label: "직업 탐색 50개",                                   included: true  },
      { label: "로드맵 전체 열람",                                 included: true  },
      { label: "AI 코치 메시지 월 30개",                           included: true  },
      { label: "히스토리 저장",                                    included: true  },
      { label: "명따라 연 3회 (1학기·2학기·연말)", included: true, badge: "✨" },
      { label: "주간 리포트",                                      included: true  },
      { label: "공동 양육자 초대 (1명)",                           included: true  },
    ],
  },
  {
    name:      "패밀리",
    badge:     "인기",
    price:     "19,900원",
    period:    "월",
    target:    "자녀 2명",
    highlight: true,
    desc:      "자녀가 2명인 가정을 위한 플랜",
    features: [
      { label: "아이 2명 동시 관리",                                         included: true },
      { label: "직업 탐색 50개",                                             included: true },
      { label: "로드맵 전체 열람",                                           included: true },
      { label: "AI 코치 메시지 월 60개",                                     included: true },
      { label: "히스토리 저장",                                              included: true },
      { label: "명따라 아이당 연 3회 (총 6회)", included: true, badge: "✨" },
      { label: "주간 리포트",                                                included: true },
      { label: "공동 양육자 초대 (1명)",                                     included: true },
    ],
  },
  {
    name:      "프리미엄",
    price:     "14,900원",
    period:    "월",
    target:    "자녀 1명 집중",
    highlight: false,
    desc:      "AI 코치와 명따라를 더 깊게 활용하는 집중 플랜",
    features: [
      { label: "아이 1명 집중 관리",                                         included: true },
      { label: "직업 탐색 50개",                                             included: true },
      { label: "로드맵 전체 열람",                                           included: true },
      { label: "AI 코치 메시지 월 100개",                                    included: true },
      { label: "히스토리 저장",                                              included: true },
      { label: "명따라 연 3회 (1학기·2학기·연말)", included: true, badge: "✨" },
      { label: "주간 리포트",                                                included: true },
      { label: "공동 양육자 초대 (1명)",                                     included: true },
    ],
  },
];

// ─── 가격 FAQ ─────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "자동결제가 되나요?",
    a: "아니요. 무료 체험 후 자동결제 없음\n유료 전환은 직접 선택하셔야 합니다.",
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
          <span style={{ color: "#E84B2E" }}>Q.</span>
          {item.q}
        </span>
        {open
          ? <ChevronUp size={15} className="text-base-muted shrink-0" />
          : <ChevronDown size={15} className="text-base-muted shrink-0" />
        }
      </button>
      {open && (
        <p className="text-sm text-base-text leading-relaxed px-1 pb-4 whitespace-pre-line">
          <span className="font-semibold" style={{ color: "#E84B2E" }}>A. </span>
          {item.a}
        </p>
      )}
    </div>
  );
}

// ─── 요금제 카드 ──────────────────────────────────────
function PlanCard({ plan, onStart }: { plan: Plan; onStart: () => void }) {
  return (
    <div
      className="bg-white rounded-card-lg shadow-card overflow-hidden"
      style={
        plan.highlight
          ? { border: "2px solid #E84B2E" }
          : { border: "2px solid transparent" }
      }
    >
      {/* 인기 배지 */}
      {plan.badge && (
        <div
          className="text-center py-1.5 text-xs font-bold text-white tracking-wide"
          style={{ backgroundColor: "#E84B2E" }}
        >
          🔥 {plan.badge} 플랜
        </div>
      )}

      <div className="p-5">
        {/* 플랜명 + 대상 */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-base-text">{plan.name}</h2>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#FFF0EB", color: "#E84B2E" }}
          >
            {plan.target}
          </span>
        </div>

        {/* 가격 */}
        <div className="flex items-baseline gap-1 mb-1">
          <span
            className="text-2xl font-bold"
            style={{ color: plan.highlight ? "#E84B2E" : "#1A1A1A" }}
          >
            {plan.price}
          </span>
          <span className="text-xs text-base-muted">/ {plan.period}</span>
        </div>

        {/* 설명 */}
        <p className="text-xs text-base-muted leading-relaxed mb-4">{plan.desc}</p>

        {/* 구분선 */}
        <div className="border-t border-base-border mb-4" />

        {/* 기능 목록 */}
        <ul className="flex flex-col gap-2 mb-5">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              {f.included ? (
                <span
                  className="text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: "#E84B2E" }}
                >
                  ✓
                </span>
              ) : (
                <span className="text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center bg-base-border text-base-muted shrink-0">
                  ✗
                </span>
              )}
              <span
                className={`text-sm leading-snug ${
                  f.included ? "text-base-text" : "text-base-muted line-through"
                }`}
              >
                {f.label}
                {f.badge && (
                  <span className="ml-1 text-xs not-line-through">{f.badge}</span>
                )}
              </span>
            </li>
          ))}
        </ul>

        {/* 시작하기 버튼 */}
        <button
          onClick={onStart}
          className="
            w-full py-3 rounded-button text-sm font-bold
            active:opacity-80 transition-opacity
          "
          style={
            plan.highlight
              ? { backgroundColor: "#E84B2E", color: "#fff" }
              : { backgroundColor: "#FFF0EB", color: "#E84B2E" }
          }
        >
          {plan.price === "0원" ? "무료로 시작하기" : "시작하기"}
        </button>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────
export default function PricingPage() {
  const router = useRouter();

  const handleStart = (plan: Plan) => {
    if (plan.price === "0원") {
      router.push("/");
    } else {
      // 추후 포트원 결제 연동
      alert(`${plan.name} 결제 기능은 준비 중입니다. 😊`);
    }
  };

  return (
    <CsPageLayout title="요금제 안내">
      <div className="flex flex-col gap-5">

        {/* 상단 헤더 */}
        <div className="text-center py-2">
          <h1 className="text-lg font-bold text-base-text mb-1">꿈따라 요금제</h1>
          <p className="text-xs text-base-muted leading-relaxed">
            아이의 꿈을 함께 설계하는<br />가장 현명한 선택
          </p>
        </div>

        {/* 요금제 카드 목록 */}
        {PLANS.map((plan) => (
          <PlanCard key={plan.name} plan={plan} onStart={() => handleStart(plan)} />
        ))}

        {/* 가격 FAQ */}
        <div className="bg-white rounded-card-lg shadow-card p-5">
          <h2 className="text-sm font-bold text-base-text mb-1">
            💬 자주 묻는 질문
          </h2>
          <p className="text-xs text-base-muted mb-4">요금제 관련 궁금증을 해결해 드려요</p>
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} item={item} />
          ))}
        </div>

        {/* 환불정책 링크 */}
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
