"use client";

// ====================================================
// ChefXrEntryCard — 요리사 직업 상세에서 요리사 XR 체험으로 안내하는 진입 카드.
//
// /xr/chef 라우트(src/app/xr/chef/page.tsx)와 동일한
// NEXT_PUBLIC_XR_CHEF_ENABLED 게이트를 그대로 재사용한다 — 판정 의미 변경 없음.
// occupationId가 "chef"가 아니거나 게이트가 꺼져 있으면 아무것도 렌더하지 않는다.
//
// G2.1-R1-F15 — 학년별 모드 안내 추가: 새싹(초3~4)/나침반(초5~중1) 두 모드
// 모두 계속 노출한다(하나를 숨기거나 기본값으로 강제하지 않음). 노출 조건·
// href·기존 제목/설명 문구는 변경하지 않는다.
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
      <p className="text-xs font-medium text-base-text mb-2">우리 아이 학년에 맞는 체험을 선택해 주세요.</p>

      <div className="flex flex-col gap-3">
        <Link href="/xr/chef?mode=sprout" className="btn-secondary flex flex-col items-center gap-0.5 py-3">
          <span>새싹 모드 체험하기</span>
          <span className="text-xs font-normal opacity-80">초등 3~4학년 추천</span>
        </Link>
        <Link href="/xr/chef?mode=compass" className="btn-primary flex flex-col items-center gap-0.5 py-3">
          <span>나침반 모드 체험하기</span>
          <span className="text-xs font-normal opacity-80">초등 5학년~중1 추천</span>
        </Link>
      </div>
    </section>
  );
}
