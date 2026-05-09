// ====================================================
// manifest.ts — PWA Web App Manifest
//
// Next.js App Router 방식 (MetadataRoute.Manifest)
// → 빌드 시 /manifest.webmanifest 로 자동 생성됨
//
// [아이콘]
//   public/icon-192x192.png — 192×192 ✅
//   public/icon-512x512.png — 512×512 ✅
//
// [이번 작업 범위]
//   - 홈 화면 추가 (Add to Home Screen) 지원
//   - offline 캐싱 / push notification 은 미포함
//   - service worker는 별도 작업으로 분리
// ====================================================

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             "꿈따라",
    short_name:       "꿈따라",
    description:      "부모와 자녀가 함께 진로를 탐색하는 꿈따라",
    start_url:        "/",
    scope:            "/",
    display:          "standalone",
    background_color: "#ffffff",
    theme_color:      "#E84B2E",
    orientation:      "portrait",
    icons: [
      {
        src:   "/icon-192x192.png",
        sizes: "192x192",
        type:  "image/png",
      },
      {
        src:   "/icon-512x512.png",
        sizes: "512x512",
        type:  "image/png",
      },
    ],
  };
}
