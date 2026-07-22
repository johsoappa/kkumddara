// ====================================================
// XR 직업체험 기술검증 페이지 (/xr/chef) — v0.0
//
// [상태] 기능 플래그 기본 OFF — NEXT_PUBLIC_XR_CHEF_ENABLED=true 일 때만 접근 가능
//   플래그 미설정/OFF 상태에서는 notFound() 반환 (admin/sync-careers 방식과 동일)
//   기존 메뉴/랜딩에 진입 링크 없음 — 직접 URL 접근으로만 검증
//
// [구조] Server Component → Client 래퍼(XrChefClient) → R3F Scene(ChefScene) 3단
//   App Router에서 Server Component가 ssr:false dynamic을 직접 호출할 수 없어
//   플래그 판정만 여기서 하고 R3F 로드는 Client 래퍼에 위임한다.
// ====================================================

import { notFound } from "next/navigation";
import XrChefClient from "./XrChefClient";

export default function XrChefPage() {
  if (process.env.NEXT_PUBLIC_XR_CHEF_ENABLED !== "true") {
    notFound();
  }
  return <XrChefClient />;
}
