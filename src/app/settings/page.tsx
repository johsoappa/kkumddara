"use client";

// ====================================================
// 설정 페이지 (/settings)
// - 하단 네비게이션 "설정" 탭 진입점
// - CS 페이지 링크 모음
// ====================================================

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import AppShell from "@/components/layout/AppShell";

const CS_MENUS = [
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

  return (
    <AppShell headerTitle="설정">
      <div className="px-4 pt-4 pb-6 flex flex-col gap-5">

        {/* 앱 버전 배지 */}
        <div className="flex items-center justify-between bg-white rounded-card-lg px-5 py-4 shadow-card">
          <div className="flex items-center gap-3">
            <span className="text-2xl leading-none">🌟</span>
            <div>
              <p className="text-sm font-bold text-base-text">꿈따라</p>
              <p className="text-xs text-base-muted">v1.0.0 · 좋소아빠</p>
            </div>
          </div>
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: "#E84B2E" }}
          >
            최신 버전
          </span>
        </div>

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

        {/* 하단 회사 정보 */}
        <div className="text-center pt-2">
          <p className="text-xs text-base-muted leading-relaxed">
            좋소아빠 · 대표 OZ.Kim<br />
            johsoappa@gmail.com<br />
            © 2026 꿈따라. All rights reserved.
          </p>
        </div>

      </div>
    </AppShell>
  );
}
