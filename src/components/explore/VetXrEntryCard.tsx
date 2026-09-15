"use client";

// ====================================================
// VetXrEntryCard — 수의사 직업 상세에서 수의사 XR 체험으로 안내하는 진입 카드.
//
// ChefXrEntryCard(요리사 전용)와 동일한 목적·학년별 안내 구조·버튼 UX를
// 그대로 따르되, /xr/vet 라우트(src/app/xr/vet/page.tsx)와 동일한
// NEXT_PUBLIC_XR_VETERINARIAN_ENABLED 게이트를 사용한다 — 요리사 게이트와는
// 완전히 독립적이며, ChefXrEntryCard 파일은 이 작업에서 수정하지 않았다.
// occupationId가 "veterinarian"이 아니거나 게이트가 꺼져 있으면 아무것도
// 렌더하지 않는다 — 다른 직업 상세에는 노출되지 않는다.
// ====================================================

import Link from "next/link";

interface VetXrEntryCardProps {
  occupationId: string;
}

export default function VetXrEntryCard({ occupationId }: VetXrEntryCardProps) {
  if (occupationId !== "veterinarian") return null;
  if (process.env.NEXT_PUBLIC_XR_VETERINARIAN_ENABLED !== "true") return null;

  return (
    <section className="card" aria-label="수의사 XR 체험">
      <h3 className="text-sm font-bold text-base-text mb-2">수의사 XR 체험</h3>
      <p className="text-sm text-base-muted leading-relaxed">
        동물병원에서 보호자 이야기를 듣고 기록하며 수의사의 하루를 직접 체험해 보세요.
      </p>
      <p className="text-xs text-base-muted mt-1 mb-4">약 3~5분 · 브라우저에서 바로 체험</p>
      <p className="text-xs font-medium text-base-text mb-2">우리 아이 학년에 맞는 체험을 선택해 주세요.</p>

      <div className="flex flex-col gap-3">
        <Link href="/xr/vet?mode=sprout" className="btn-secondary flex flex-col items-center gap-0.5 py-3">
          <span>새싹 모드 체험하기</span>
          <span className="text-xs font-normal opacity-80">초등 3~4학년 추천</span>
        </Link>
        <Link href="/xr/vet?mode=compass" className="btn-primary flex flex-col items-center gap-0.5 py-3">
          <span>나침반 모드 체험하기</span>
          <span className="text-xs font-normal opacity-80">초등 5학년~중1 추천</span>
        </Link>
      </div>
    </section>
  );
}
