// ====================================================
// XR 직업체험 페이지 (/xr/chef) — v0.2
//
// [상태] 기능 플래그 기본 OFF — NEXT_PUBLIC_XR_CHEF_ENABLED=true 일 때만 접근 가능
//   플래그 미설정/OFF 상태에서는 notFound() 반환 (admin/sync-careers 방식과 동일)
//   기존 메뉴/랜딩에 진입 링크 없음 — 직접 URL 접근으로만 검증
//
// [구조] Server Component → Client 래퍼(XrChefClient) → R3F Scene(ChefScene) 3단
//   App Router에서 Server Component가 ssr:false dynamic을 직접 호출할 수 없어
//   플래그 판정만 여기서 하고 R3F 로드는 Client 래퍼에 위임한다.
//
// [모드] ?mode=sprout → 새싹모드, 그 외 전부 나침반(compass) 폴백.
//   searchParams를 읽으므로 이 라우트는 정적(○)→동적(ƒ) 렌더링으로 전환됨.
//   Client에서 window.location 파싱 금지 — 여기서 판정해 props로 내린다.
// ====================================================

import { notFound } from "next/navigation";
import XrChefClient from "./XrChefClient";
import type { Mode } from "./scenario";

interface XrChefPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function XrChefPage({ searchParams }: XrChefPageProps) {
  if (process.env.NEXT_PUBLIC_XR_CHEF_ENABLED !== "true") {
    notFound();
  }
  // 화이트리스트 판정 — "sprout" 정확 일치 외에는 전부 나침반 폴백 (배열 값 포함)
  const mode: Mode = searchParams?.mode === "sprout" ? "sprout" : "compass";
  return <XrChefClient mode={mode} />;
}
