"use client";

// ====================================================
// ChefXrEntryCard — 요리사 직업 상세에서 요리사 XR 체험으로 안내하는 진입 카드.
//
// /xr/chef 라우트(src/app/xr/chef/page.tsx)와 동일한
// NEXT_PUBLIC_XR_CHEF_ENABLED 게이트를 그대로 재사용한다 — 판정 의미 변경 없음.
// occupationId가 "chef"가 아니거나 게이트가 꺼져 있으면 아무것도 렌더하지 않는다.
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
        주방에서 선택하고 움직이며 요리사의 하루를 직접 체험해 보세요.
      </p>
      <p className="text-xs text-base-muted mt-1 mb-4">약 3~5분 · 브라우저에서 바로 체험</p>

      <div className="flex flex-col gap-3">
        <Link href="/xr/chef?mode=sprout" className="btn-secondary">
          새싹 모드 체험하기
        </Link>
        <Link href="/xr/chef?mode=compass" className="btn-primary">
          나침반 모드 체험하기
        </Link>
      </div>
    </section>
  );
}
