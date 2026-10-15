"use client";

// ====================================================
// ChefXrEntryCard — 요리사 직업 상세에서 요리사 XR 체험으로 안내하는 진입 카드.
//
// F13: 진입 대상을 "손님의 채소 볶음밥" 체험으로 바꿨다(→ /xr/chef?scenario=fried-rice).
//   새 체험에는 새싹/나침반 모드가 없으므로 모드 버튼과 학년별 모드 안내를 두지 않는다 — 지원하지 않는 모드를
//   지원하는 것처럼 보이게 하지 않는다. 이전 체험은 /xr/chef?scenario=classic 으로만 열린다(이 카드에서는 노출하지 않음).
// /xr/chef 라우트(src/app/xr/chef/page.tsx)와 동일한 NEXT_PUBLIC_XR_CHEF_ENABLED 게이트를 그대로 재사용한다 —
// 판정 의미 변경 없음. occupationId가 "chef"가 아니거나 게이트가 꺼져 있으면 아무것도 렌더하지 않는다.
// ====================================================

import Link from "next/link";

interface ChefXrEntryCardProps {
  occupationId: string;
}

export default function ChefXrEntryCard({ occupationId }: ChefXrEntryCardProps) {
  if (occupationId !== "chef") return null;
  if (process.env.NEXT_PUBLIC_XR_CHEF_ENABLED !== "true") return null;

  return (
    <section className="card" aria-label="요리사 XR 체험">
      <h3 className="text-sm font-bold text-base-text mb-2">요리사 XR 체험</h3>
      <p className="text-sm text-base-muted leading-relaxed">
        손님의 주문을 확인하고, 재료를 준비해 채소 볶음밥 한 접시를 직접 만들어 보세요.
      </p>
      <p className="text-xs text-base-muted mt-1 mb-4">약 3~5분 · 브라우저에서 바로 체험</p>

      <Link href="/xr/chef?scenario=fried-rice" className="btn-primary flex flex-col items-center gap-0.5 py-3">
        <span>요리사 XR 체험하기</span>
      </Link>
    </section>
  );
}
