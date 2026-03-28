"use client";

// ====================================================
// CS 페이지 공유 레이아웃
// - 상단 뒤로가기 헤더
// - 하단 푸터 (이용약관 | 개인정보처리방침 | 환불정책 | 청소년보호정책)
// ====================================================

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface CsPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

const FOOTER_LINKS = [
  { label: "이용약관",          href: "/terms"   },
  { label: "개인정보처리방침",  href: "/privacy" },
  { label: "환불정책",          href: "/refund"  },
  { label: "청소년 보호정책",   href: "/youth"   },
];

export default function CsPageLayout({ title, children }: CsPageLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-base-off flex flex-col">

        {/* 헤더 */}
        <div className="sticky top-0 z-50 bg-white border-b border-base-border">
          <div className="flex items-center px-4 h-14 gap-2">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-off transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft size={20} className="text-base-text" />
            </button>
            <h1 className="text-sm font-bold text-base-text">{title}</h1>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 px-4 py-5 pb-6">
          {children}
        </div>

        {/* 하단 푸터 */}
        <footer className="border-t border-base-border bg-white px-4 py-5">
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-3">
            {FOOTER_LINKS.map((link, i) => (
              <span key={link.href} className="flex items-center gap-3">
                <Link
                  href={link.href}
                  className="text-xs text-base-muted hover:text-brand-red transition-colors"
                >
                  {link.label}
                </Link>
                {i < FOOTER_LINKS.length - 1 && (
                  <span className="text-xs text-base-border">|</span>
                )}
              </span>
            ))}
          </div>
          <p className="text-center text-[10px] text-base-muted leading-relaxed">
            좋소아빠 · 대표 OZ.Kim · johsoappa@gmail.com<br />
            © 2026 꿈따라. All rights reserved.
          </p>
        </footer>

      </div>
    </div>
  );
}
