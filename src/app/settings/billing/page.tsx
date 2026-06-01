"use client";

// ====================================================
// 구독 및 결제 관리 안내 (/settings/billing)
//
// 현재 꿈따라는 베타 운영 단계로 정식 유료 결제 기능이 오픈 전이다.
// 이 화면은 실제 결제/구독 해지/환불 기능을 제공하지 않고,
// 현재 이용 상태(베타 무료)와 정식 오픈 후 예정 안내만 제공한다.
//
// [구현하지 않는 것]
//   실제 구독 해지 / 환불 신청 / 결제 수단 등록 / 결제 내역 /
//   PG 연동 / subscription 상태 변경 / 결제 webhook / 환불 API
//
// CTA: 요금제(/pricing) · 환불정책(/refund) · 문의(/contact) 이동만 제공
// "구독 해지" 버튼은 표시하지 않는다 (해지 대상 결제 없음).
// ====================================================

import { useRouter } from "next/navigation";
import { ChevronRight, CheckCircle2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";

const STATUS_ITEMS = [
  "베타 무료 이용 중",
  "정식 유료 결제 기능 오픈 전",
  "등록된 결제 수단 없음",
  "현재 환불 또는 구독 해지 대상 결제 없음",
];

const CTA_ITEMS = [
  { label: "요금제 보기",   href: "/pricing" },
  { label: "환불 정책 보기", href: "/refund"  },
  { label: "문의하기",      href: "/contact" },
];

export default function BillingPage() {
  const router = useRouter();

  return (
    <AppShell headerTitle="구독 및 결제 관리" showBack backHref="/settings">
      <div className="px-4 pt-4 pb-8 flex flex-col gap-4">

        {/* 상단 설명 */}
        <div className="bg-white rounded-card-lg shadow-card px-5 py-4">
          <h1 className="text-base font-bold text-base-text mb-1">구독 및 결제 관리</h1>
          <p className="text-xs text-base-muted leading-relaxed">
            현재 꿈따라는 베타 운영 단계이며, 정식 유료 결제 기능은 아직 오픈 전입니다.
          </p>
        </div>

        {/* 현재 이용 상태 카드 */}
        <div className="bg-white rounded-card-lg shadow-card px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm font-bold text-base-text">현재 이용 상태</p>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: "#E84B2E" }}
            >
              베타 무료
            </span>
          </div>
          <ul className="flex flex-col gap-2.5">
            {STATUS_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" style={{ color: "#E84B2E" }} />
                <span className="text-sm text-base-text leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 안내 문구 */}
        <div
          className="rounded-card-lg p-4"
          style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}
        >
          <p className="text-xs leading-relaxed" style={{ color: "#92400E" }}>
            현재는 실제 결제가 발생하지 않으므로 구독 해지나 환불 신청 절차가 필요하지 않습니다.
            <br />
            정식 결제 기능이 오픈되면 이 화면에서 구독 상태, 결제 내역, 구독 해지, 환불 안내를
            확인할 수 있도록 제공할 예정입니다.
          </p>
        </div>

        {/* CTA — 요금제 / 환불정책 / 문의 */}
        <div className="bg-white rounded-card-lg shadow-card overflow-hidden">
          {CTA_ITEMS.map((item, i, arr) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`
                w-full flex items-center justify-between px-5 py-4 text-left
                hover:bg-base-off active:bg-base-off transition-colors
                ${i < arr.length - 1 ? "border-b border-base-border" : ""}
              `}
            >
              <span className="text-sm text-base-text">{item.label}</span>
              <ChevronRight size={16} className="text-base-muted" />
            </button>
          ))}
        </div>

        <p className="text-[11px] text-base-muted text-center leading-relaxed px-2">
          베타 기간 무료 이용 · 자동결제 없음
        </p>

      </div>
    </AppShell>
  );
}
