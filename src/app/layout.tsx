import type { Metadata, Viewport } from "next";
import "./globals.css";

// ====================================================
// 루트 레이아웃
// 모든 페이지에 공통으로 적용되는 최상위 레이아웃
// ====================================================

export const metadata: Metadata = {
  title: "꿈따라 - 꿈을 찾고, 길을 만든다",
  description: "부모와 아이가 함께 만드는 진로 설계 앱",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/icon-192x192.png",
  },
  openGraph: {
    title: "꿈따라 - 꿈을 찾고, 길을 만든다",
    description: "부모와 아이가 함께 만드는 진로 설계 앱",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "ko_KR",
    type: "website",
  },
};

// 모바일 뷰포트 최적화
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,       // 핀치 줌 방지 (앱처럼 느끼게)
  userScalable: false,
  themeColor: "#E84B2E", // 브라우저 상단바 색상 (Android Chrome)
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      {/*
        [확인 포인트]
        - lang="ko": 한국어 설정 (스크린리더, SEO 최적화)
        - antialiased: 폰트 렌더링 부드럽게
      */}
      <body className="antialiased bg-base-off">
        {children}
      </body>
    </html>
  );
}
