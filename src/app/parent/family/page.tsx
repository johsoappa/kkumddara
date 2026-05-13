"use client";

// ====================================================
// 가족 설정 페이지 (/parent/family)
//
// [베타 상태]
//   공동 양육자 초대 기능은 베타에서 비활성화되어 있습니다.
//   초대 생성·수락 UI는 렌더링하지 않습니다.
//
// [Phase 3 예정]
//   - verify_caregiver_invite / accept_caregiver_invite RPC 구현
//   - caregiver 읽기 전용 권한 (child / liked_occupations / roadmap_progress)
//   - /caregiver/home 화면 추가
//   - 권한별 화면 분기 처리
// ====================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Child } from "@/types/family";
import { GRADE_LEVEL_LABEL, GRADE_LABEL } from "@/types/family";
import type { GradeLevel, Grade } from "@/types/family";

export default function FamilyPage() {
  const router = useRouter();

  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // ── 초기 로드 (자녀 목록만 조회) ───────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/"); return; }

      const role = user.user_metadata?.role as string | undefined;
      if (role !== "parent") { router.replace("/"); return; }

      const { data: parentRow } = await supabase
        .from("parent")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!parentRow) {
        setError("학부모 정보를 불러오지 못했어요.");
        setLoading(false);
        return;
      }

      const { data: childRows } = await supabase
        .from("child")
        .select("*")
        .eq("parent_id", parentRow.id)
        .eq("profile_status", "active")
        .order("created_at", { ascending: true });

      setChildren((childRows ?? []) as Child[]);
      setLoading(false);
    }

    init();
  }, [router]);

  // ── 학년 표시 ──────────────────────────────────────────────
  function gradeLabel(child: Child): string {
    if (child.grade_level && GRADE_LEVEL_LABEL[child.grade_level as GradeLevel]) {
      return GRADE_LEVEL_LABEL[child.grade_level as GradeLevel];
    }
    if (child.school_grade && GRADE_LABEL[child.school_grade as Grade]) {
      return GRADE_LABEL[child.school_grade as Grade];
    }
    return "";
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-off">
        <p className="text-sm text-base-muted">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-white min-h-screen flex flex-col">

        {/* 헤더 */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b border-base-border bg-white"
          style={{ paddingTop: "env(safe-area-inset-top, 12px)" }}
        >
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full hover:bg-base-off transition-colors"
            aria-label="뒤로가기"
          >
            <ChevronLeft size={20} className="text-base-text" />
          </button>
          <h1 className="text-sm font-bold text-base-text">가족 설정</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5">

          {/* 에러 */}
          {error && (
            <div className="p-3 bg-red-50 rounded-button text-sm text-red-500">
              {error}
            </div>
          )}

          {/* ── 공동 양육자 초대 — 베타 준비중 안내 ──────── */}
          <div className="bg-white border border-base-border rounded-card-lg p-4">
            <p className="text-sm font-bold text-base-text mb-1">공동 양육자 초대</p>
            <p className="text-xs text-base-muted leading-relaxed">
              공동 양육자와 함께 보는 기능은 정식 버전에서 제공될 예정입니다.
              현재 베타에서는 메인 보호자 계정으로만 이용할 수 있습니다.
            </p>
          </div>

          {/* ── 베타 자녀 추가 제한 안내 ──────────────────── */}
          <div className="px-3 py-2.5 bg-base-off rounded-button border border-base-border">
            <p className="text-[11px] text-base-muted leading-relaxed">
              현재 베타 버전에서는 자녀 1명 기준으로 진로 탐색을 이용할 수 있어요.
              자녀 추가 기능은 패밀리 플랜 오픈 시 제공될 예정입니다.
            </p>
          </div>

          {/* ── 등록된 자녀 목록 (표시 전용) ──────────────── */}
          {children.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-base-muted">등록된 자녀 프로필이 없어요.</p>
            </div>
          ) : (
            children.map((child) => (
              <div
                key={child.id}
                className="bg-white border border-base-border rounded-card-lg p-4 flex items-center gap-3"
              >
                <span className="text-2xl">{child.avatar_emoji}</span>
                <div>
                  <p className="text-sm font-bold text-base-text">{child.name}</p>
                  {gradeLabel(child) && (
                    <p className="text-xs text-base-muted">{gradeLabel(child)}</p>
                  )}
                </div>
              </div>
            ))
          )}

        </div>
      </div>
    </div>
  );
}
