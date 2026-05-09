"use client";

// ====================================================
// PwaInstallBanner — 홈 화면 추가 안내 배너
//
// [설계]
//   - 모바일 기기에서만 표시 (userAgent 기준)
//   - 이미 standalone 모드 (홈 화면에서 실행 중) → 숨김
//   - localStorage 기반 1회 닫기
//   - iOS Safari: 공유 버튼 → 홈 화면에 추가 안내
//   - Android/기타:  브라우저 메뉴 → 홈 화면에 추가 안내
//
// [사용처]
//   - src/app/page.tsx (랜딩 역할 선택 화면 하단)
//
// [금지]
//   - 자동 설치 강제 없음 (beforeinstallprompt 자동 트리거 없음)
//   - push notification 없음
//   - service worker 직접 구현 없음
// ====================================================

import { useEffect, useState } from "react";
import { X } from "lucide-react";

// ─── 상수 ────────────────────────────────────────────
const STORAGE_KEY = "kkumddara_pwa_banner_dismissed";
const ACCENT      = "#E84B2E";
const ACCENT_BG   = "#FFF0EB";

// ─── 컴포넌트 ─────────────────────────────────────────
export default function PwaInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [isIos,   setIsIos]   = useState(false);

  useEffect(() => {
    // ① 이미 standalone 모드 (홈 화면 앱으로 실행 중) → 표시 안 함
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // ② 이전에 닫은 경우 → 표시 안 함
    if (localStorage.getItem(STORAGE_KEY)) return;

    // ③ 모바일 기기만 표시 (tablet 포함)
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;

    const iosDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsIos(iosDevice);
    setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="mt-6 rounded-card-lg p-4 flex gap-3 items-start"
      style={{ backgroundColor: ACCENT_BG, border: `1px solid ${ACCENT}22` }}
      role="complementary"
      aria-label="앱 설치 안내"
    >
      {/* 아이콘 */}
      <span className="text-lg shrink-0 mt-0.5" aria-hidden="true">📱</span>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold mb-0.5" style={{ color: ACCENT }}>
          꿈따라를 홈 화면에 추가하면 앱처럼 바로 사용할 수 있어요.
        </p>
        <p className="text-[11px] text-base-muted leading-relaxed">
          {isIos
            ? "Safari 하단의 공유 버튼(□↑)을 눌러 \"홈 화면에 추가\"를 선택하세요."
            : "브라우저 메뉴(⋮)에서 \"홈 화면에 추가\"를 선택하면 바로 실행할 수 있어요."}
        </p>
      </div>

      {/* 닫기 버튼 */}
      <button
        onClick={dismiss}
        className="shrink-0 p-0.5 rounded-full text-base-muted active:opacity-60 transition-opacity"
        aria-label="닫기"
      >
        <X size={14} />
      </button>
    </div>
  );
}
