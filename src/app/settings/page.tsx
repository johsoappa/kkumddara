"use client";

// ====================================================
// 설정 페이지 (/settings)
// - 하단 네비게이션 "설정" 탭 진입점
// - CS 페이지 링크 모음
// ====================================================

import { useRouter } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { supabase } from "@/lib/supabase";
import { clearActiveChildId } from "@/lib/db/family";

const CS_MENUS = [
  {
    group: "구독 & 결제",
    items: [
      { emoji: "💎", label: "요금제 안내",       href: "/pricing" },
      { emoji: "💳", label: "환불정책",          href: "/refund"  },
    ],
  },
  {
    group: "도움말",
    items: [
      { emoji: "❓", label: "자주 묻는 질문",   href: "/faq"     },
      { emoji: "📖", label: "사용자 가이드",     href: "/guide"   },
      { emoji: "💬", label: "1:1 문의",          href: "/contact" },
    ],
  },
  {
    group: "약관 및 정책",
    items: [
      { emoji: "📋", label: "이용약관",           href: "/terms"   },
      { emoji: "🔒", label: "개인정보처리방침",   href: "/privacy" },
      { emoji: "💰", label: "환불정책",           href: "/refund"  },
      { emoji: "🛡️", label: "청소년 보호정책",   href: "/youth"   },
    ],
  },
];

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // localStorage 초기화 (다음 접속 시 온보딩부터 시작)
    localStorage.removeItem("kkumddara_onboarding");
    localStorage.removeItem("kkumddara_child_id");
    clearActiveChildId();
    router.push("/");
  };

  return (
    <AppShell headerTitle="설정">
      <div className="px-4 pt-4 pb-6 flex flex-col gap-5">

        {/* 앱 버전 배지 */}
        <div className="flex items-center justify-between bg-white rounded-card-lg px-5 py-4 shadow-card">
          <div className="flex items-center gap-3">
            <span className="text-2xl leading-none">🌟</span>
            <div>
              <p className="text-sm font-bold text-base-text">꿈따라</p>
              <p className="text-xs text-base-muted">v1.0.0 · OZ.K Lab</p>
            </div>
          </div>
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: "#E84B2E" }}
          >
            최신 버전
          </span>
        </div>

        {/* 구독 및 결제 관리 진입 카드 — 현재 이용 상태/결제·환불 안내 */}
        <button
          onClick={() => router.push("/settings/billing")}
          className="w-full bg-white rounded-card-lg shadow-card px-5 py-4 text-left hover:bg-base-off active:bg-base-off transition-colors flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl leading-none shrink-0">🧾</span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-base-text">구독 및 결제 관리</p>
              <p className="text-xs text-base-muted mt-0.5 leading-relaxed">
                현재 이용 상태와 결제·환불 안내를 확인할 수 있어요.
              </p>
            </div>
          </div>
          <span className="flex items-center gap-0.5 text-xs font-semibold shrink-0" style={{ color: "#E84B2E" }}>
            관리하기 <ChevronRight size={14} />
          </span>
        </button>

        {/* 자녀 프로필 관리 진입 카드 */}
        <button
          onClick={() => router.push("/settings/children")}
          className="w-full bg-white rounded-card-lg shadow-card px-5 py-4 text-left hover:bg-base-off active:bg-base-off transition-colors flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl leading-none shrink-0">👨‍👩‍👧</span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-base-text">자녀 프로필 관리</p>
              <p className="text-xs text-base-muted mt-0.5 leading-relaxed">
                등록된 자녀 정보를 확인하고 새 자녀를 추가할 수 있어요.
              </p>
            </div>
          </div>
          <span className="flex items-center gap-0.5 text-xs font-semibold shrink-0" style={{ color: "#E84B2E" }}>
            관리하기 <ChevronRight size={14} />
          </span>
        </button>

        {/* 메뉴 그룹 */}
        {CS_MENUS.map((group) => (
          <div key={group.group}>
            <p className="text-xs font-semibold text-base-muted mb-2 px-1">
              {group.group}
            </p>
            <div className="bg-white rounded-card-lg shadow-card overflow-hidden">
              {group.items.map((item, i, arr) => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`
                    w-full flex items-center justify-between px-5 py-4 text-left
                    hover:bg-base-off active:bg-base-off transition-colors
                    ${i < arr.length - 1 ? "border-b border-base-border" : ""}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base leading-none w-5 text-center">
                      {item.emoji}
                    </span>
                    <span className="text-sm text-base-text">{item.label}</span>
                  </div>
                  <ChevronRight size={16} className="text-base-muted" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* 로그아웃 버튼 */}
        <button
          onClick={handleLogout}
          className="
            w-full flex items-center justify-center gap-2
            py-4 rounded-card-lg border-2 border-red-200
            text-sm font-semibold text-red-500 bg-white
            active:opacity-70 transition-opacity
          "
        >
          <LogOut size={16} />
          로그아웃
        </button>

        {/* 하단 회사 정보 */}
        <div className="text-center pt-2">
          <p className="text-xs text-base-muted leading-relaxed">
            OZ.K Lab · 대표 OZ.Kim<br />
            contact@ozklab.com<br />
            © 2026 꿈따라. All rights reserved.
          </p>
          <p className="text-[10px] text-base-muted opacity-50 mt-1">
            Build: {process.env.NEXT_PUBLIC_COMMIT_SHA ?? "—"}
          </p>
        </div>

      </div>
    </AppShell>
  );
}
