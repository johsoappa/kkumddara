// ====================================================
// 관리자 사용자 목록 (/admin/users)
//
// [권한] requireOperator() 통과 후에만 getAdminUsersPage() 호출.
//        activate operator 또는 admin만 접근 가능, 그 외 전부 404.
// [원칙] server component. 클라이언트 상태·form 제출·데이터 수정 없음.
//        화면에는 서버에서 마스킹을 완료한 값만 렌더한다.
//
// 참고: docs/admin-access-control-design.md §6·§7·§9
// ====================================================

import Link from "next/link";
import { requireOperator } from "@/lib/admin-auth";
import { getAdminUsersPage } from "@/lib/admin-users-query";
import type { AdminUsersPageResult } from "@/lib/admin-users-query";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const ctx = await requireOperator();

  const pageParam = searchParams.page;
  const rawPage = Number.parseInt(
    typeof pageParam === "string" ? pageParam : "1",
    10
  );

  let result: AdminUsersPageResult | null = null;
  try {
    result = await getAdminUsersPage(ctx, rawPage);
  } catch {
    result = null;
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-base-off flex items-center justify-center px-4">
        <p className="text-sm text-base-muted text-center">
          목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      </div>
    );
  }

  const { items, page, hasPrev, hasNext, summary } = result;

  return (
    <div className="min-h-screen bg-base-off">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5">
        <div>
          <h1 className="text-lg font-bold text-base-text">사용자 관리</h1>
          <p className="text-xs text-base-muted mt-1">
            운영에 필요한 최소 정보만 마스킹해 표시합니다.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <SummaryCard label="학부모" count={summary.parentCount} />
          <SummaryCard label="학생" count={summary.studentCount} />
          <SummaryCard label="설정 전" count={summary.unsetCount} />
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-base-muted">표시할 사용자가 없어요.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-base-border rounded-card-lg p-4 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-base-text truncate">
                    {item.maskedEmail}
                  </span>
                  <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-button bg-base-card text-base-muted">
                    {item.accountRole}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-base-muted">
                  <span>온보딩 {item.onboardingStatusLabel}</span>
                  <span>가입 {item.joinedMonth}</span>
                  <span>자녀 {item.childConnectionLabel}</span>
                  <span>플랜 {item.planName}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <PageLink page={page - 1} disabled={!hasPrev} label="이전" />
          <span className="text-xs text-base-muted">{page}페이지</span>
          <PageLink page={page + 1} disabled={!hasNext} label="다음" />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="bg-white border border-base-border rounded-card p-3 text-center">
      <p className="text-lg font-bold text-base-text">{count}</p>
      <p className="text-[11px] text-base-muted mt-0.5">{label}</p>
    </div>
  );
}

function PageLink({
  page,
  disabled,
  label,
}: {
  page: number;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="text-xs px-3 py-1.5 rounded-button border border-base-border text-status-disabled">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={`/admin/users?page=${page}`}
      className="text-xs px-3 py-1.5 rounded-button border border-base-border text-base-text hover:bg-base-off transition-colors"
    >
      {label}
    </Link>
  );
}
