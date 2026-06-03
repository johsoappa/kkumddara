"use client";

// ====================================================
// 학생 "내 활동" 전용 페이지 (/student/activity)
//
// BottomNav 의 학생용 "내 활동" 탭 목적지.
// 자녀가 본인이 완료한 미션과 이어서 할 활동을 확인하는 전용 화면이다.
// 부모 주간 리포트(/report)와 분리된 자녀 활동 기록 화면이며,
// 평가/분석이 아닌 완료 미션 중심으로 구성한다.
//
// [접근 차단] 연결 child가 삭제/비활성(profile_status≠'active')이면
//   일반 활동 기록 대신 차단 안내(BottomNav 미표시)를 보여준다.
//
// [변경하지 않은 것]
//   DB / migration / Supabase SQL / RLS / 미션 저장 로직 /
//   부모 리포트 계산 / weekly_activity_completions 구조
// ====================================================

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import StudentActivitySection from "@/components/student/StudentActivitySection";
import StudentInactiveNotice from "@/components/student/StudentInactiveNotice";
import { supabase } from "@/lib/supabase";

type ChildAccess = "loading" | "active" | "blocked";

export default function StudentActivityPage() {
  const [access, setAccess] = useState<ChildAccess>("loading");

  useEffect(() => {
    async function check() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setAccess("blocked"); return; }

        const { data: studentRow } = await supabase
          .from("student")
          .select("child_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!studentRow?.child_id) { setAccess("blocked"); return; }

        const { data: childRow } = await supabase
          .from("child")
          .select("profile_status")
          .eq("id", studentRow.child_id)
          .maybeSingle();

        setAccess(
          (childRow as { profile_status?: string } | null)?.profile_status === "active"
            ? "active"
            : "blocked"
        );
      } catch (err) {
        console.error("[student/activity] child 상태 확인 오류:", err);
        setAccess("blocked");
      }
    }
    check();
  }, []);

  // 차단(삭제/비활성 자녀 연결) — BottomNav 미표시
  if (access === "blocked") {
    return (
      <AppShell headerTitle="내 활동" showNav={false}>
        <StudentInactiveNotice />
      </AppShell>
    );
  }

  // 상태 확인 중 — nav 깜빡임 방지를 위해 로딩만 표시
  if (access === "loading") {
    return (
      <AppShell headerTitle="내 활동" showNav={false}>
        <div className="px-5 pt-10 text-center text-sm text-base-muted">불러오는 중...</div>
      </AppShell>
    );
  }

  return (
    <AppShell headerTitle="내 활동">
      <div className="px-5 pt-5 pb-10 flex flex-col gap-5">
        {/* 상단 안내 */}
        <div>
          <h1 className="text-xl font-bold text-base-text leading-snug">내 활동</h1>
          <p className="text-sm text-base-muted mt-1 leading-relaxed">
            내가 완료한 미션과 이어서 할 활동을 확인할 수 있어요.
          </p>
        </div>

        {/* 완료 미션 / 다음 활동 */}
        <StudentActivitySection />
      </div>
    </AppShell>
  );
}
