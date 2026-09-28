// ====================================================
// XR 직업체험 페이지 (/xr/vet) — 수의사 v1
//
// [상태] 기능 플래그 기본 OFF — NEXT_PUBLIC_XR_VETERINARIAN_ENABLED=true
//   일 때만 접근 가능. 플래그 미설정/OFF 상태에서는 notFound() 반환
//   (요리사 /xr/chef와 동일 패턴, 요리사 플래그와는 독립적인 별도 플래그)
//
// [구조] Server Component → Client 래퍼(XrVetClient) → R3F Scene(VetScene) 3단
//   (요리사 /xr/chef page.tsx와 동일 구조)
//
// [모드] ?mode=sprout → 새싹모드, 그 외 전부 나침반(compass) 폴백.
//   Client에서 window.location 파싱 금지 — 여기서 판정해 props로 내린다.
// ====================================================

import { notFound } from "next/navigation";
import XrVetClient from "./XrVetClient";
import type { Mode } from "./scenario";

interface XrVetPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function XrVetPage({ searchParams }: XrVetPageProps) {
  if (process.env.NEXT_PUBLIC_XR_VETERINARIAN_ENABLED !== "true") {
    notFound();
  }
  // 화이트리스트 판정 — "sprout" 정확 일치 외에는 전부 나침반 폴백 (배열 값 포함)
  const mode: Mode = searchParams?.mode === "sprout" ? "sprout" : "compass";
  // G2.2-R4-B 로컬 프로토타입: ?r4=1이면 새싹·나침반 양쪽에서 활성(기본 R3 흐름은 그대로)
  const r4 = searchParams?.r4 === "1";
  return <XrVetClient mode={mode} r4={r4} />;
}
