"use client";

// ====================================================
// CS 페이지 공유 레이아웃
// - 상단 뒤로가기 헤더
// - 하단 BottomNav (설정 탭 활성화)
// - 하단 푸터 (약관 링크 + 회사 정보)
// ====================================================

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";

interface CsPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

const FOOTER_LINKS = [
  { label: "이용약관",        href: "/terms"   },
  { label: "개인정보처리방침", href: "/privacy" },
  { label: "환불정책",        href: "/refund"  },
  { label: "청소년 보호정책",  href: "/youth"   },
];

export default function CsPageLayout({ title, children }: CsPageLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="relative w-full max-w-mobile bg-base-off">

        {/* ── 상단 헤더 (sticky) ── */}
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

        {/* ── 본문 (BottomNav 높이만큼 pb 확보) ── */}
        <main className="px-4 py-5 pb-6">
          {children}

          {/* ── 하단 푸터 ── */}
          {/*
            [PG심사 준비 — 사업자정보]
            아래 정보는 OZ.Kim 대표 제공 기준값(2026-06-08).
            최종 제출 전 사업자등록증·통신판매업 신고증 표기와 1:1 일치 여부를 확인한다.
          */}
          <footer className="mt-8 border-t border-base-border pt-5">
            <p className="text-center text-xs font-semibold text-base-text mb-2">
              오즈케이랩 | 꿈따라
            </p>
            {/* 약관 링크 행 */}
            <div className="flex flex-wrap justify-center gap-x-1 gap-y-1 mb-3">
              {FOOTER_LINKS.map((link, i) => (
                <span key={link.href} className="flex items-center gap-1">
                  <Link
                    href={link.href}
                    className="text-xs text-base-muted hover:text-brand-red transition-colors"
                  >
                    {link.label}
                  </Link>
                  {i < FOOTER_LINKS.length - 1 && (
                    <span className="text-xs text-base-border">·</span>
                  )}
                </span>
              ))}
            </div>
            {/* 사업자정보 */}
            <div className="text-center text-[10px] text-base-muted leading-relaxed space-y-0.5 mb-2 px-2">
              <p>상호: 오즈케이랩 &nbsp;|&nbsp; 대표: 김문수</p>
              <p>사업자등록번호: 337-23-02160 &nbsp;|&nbsp; 통신판매업 신고번호: 2026-화성병점-0513</p>
              <p>주소: 경기도 화성시 병점구 태안로85, 102-701</p>
              <p>대표 전화: 010-4796-8013 &nbsp;|&nbsp; 대표 이메일: contact@ozklab.com</p>
              <p>꿈따라 문의: kkumddara@ozklab.com</p>
            </div>
            <p className="text-center text-[11px] text-base-muted">
              ⓒ 2026 오즈케이랩. All rights reserved.
            </p>
          </footer>
        </main>

        {/* ── 하단 네비게이션 ── */}
        <BottomNav />

      </div>
    </div>
  );
}
