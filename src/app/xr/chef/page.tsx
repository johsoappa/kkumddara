// ====================================================
// XR 직업체험 페이지 (/xr/chef) — v0.3 (F13: 기본 = 볶음밥 체험)
//
// [상태] 기능 플래그 기본 OFF — NEXT_PUBLIC_XR_CHEF_ENABLED=true 일 때만 접근 가능
//   플래그 미설정/OFF 상태에서는 notFound() 반환 (admin/sync-careers 방식과 동일)
//   진입 링크: 요리사 직업 상세의 ChefXrEntryCard(→ ?scenario=fried-rice)
//
// [구조] Server Component → Client 래퍼(XrChefClient) → R3F Scene(ChefScene) 3단
//   App Router에서 Server Component가 ssr:false dynamic을 직접 호출할 수 없어
//   플래그 판정만 여기서 하고 R3F 로드는 Client 래퍼에 위임한다.
//
// [진입 규칙 — F13] 기본 체험은 "손님의 채소 볶음밥"(XrChefFriedRiceClient)이다.
//   - ?scenario=fried-rice, 또는 scenario·mode가 없거나 알 수 없는 값 → 볶음밥 체험(모드 개념이 없다).
//   - ?scenario=classic → 이전 체험(나침반/새싹)을 명시적으로 보존한 별도 경로. 그 안에서 ?mode=sprout만 새싹,
//     그 외는 나침반(기존 화이트리스트 폴백 그대로).
//   - ?mode=sprout / ?mode=compass(scenario 없이)는 기존 공유 링크·북마크가 가리키던 이전 체험을 그대로 연다 —
//     새 체험이 지원하지 않는 모드를 조용히 다른 의미로 바꾸지 않는다. 그 밖의 mode 값은 모드가 아니므로 기본(볶음밥).
//   searchParams를 읽으므로 이 라우트는 동적(ƒ) 렌더링이다. Client에서 window.location 파싱 금지 — 여기서 판정해 props로 내린다.
//   기능 플래그(NEXT_PUBLIC_XR_CHEF_ENABLED) 판정은 모든 경로에 동일하게 먼저 적용된다.
// ====================================================

import { notFound } from "next/navigation";
import XrChefClient from "./XrChefClient";
import XrChefFriedRiceClient from "./XrChefFriedRiceClient";
import type { Mode } from "./scenario";

interface XrChefPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

/** 이전 체험(나침반·새싹)으로 가는 명시적 scenario 값 */
const CLASSIC_SCENARIO = "classic";

export default function XrChefPage({ searchParams }: XrChefPageProps) {
  if (process.env.NEXT_PUBLIC_XR_CHEF_ENABLED !== "true") {
    notFound();
  }
  const scenario = searchParams?.scenario;
  const modeParam = searchParams?.mode;

  // 화이트리스트 판정 — "sprout" 정확 일치 외에는 전부 나침반 폴백 (배열 값 포함)
  const legacyMode: Mode = modeParam === "sprout" ? "sprout" : "compass";

  if (scenario === CLASSIC_SCENARIO) {
    return <XrChefClient mode={legacyMode} />;
  }
  if (scenario === "fried-rice") {
    return <XrChefFriedRiceClient />;
  }
  // scenario 없이 온 기존 모드 링크는 이전 체험 그대로(의미 보존)
  if (modeParam === "sprout" || modeParam === "compass") {
    return <XrChefClient mode={legacyMode} />;
  }
  return <XrChefFriedRiceClient />;
}
