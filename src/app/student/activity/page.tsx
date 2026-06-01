"use client";

// ====================================================
// 학생 "내 활동" 전용 페이지 (/student/activity)
//
// BottomNav 의 학생용 "내 활동" 탭 목적지.
// 자녀가 본인이 완료한 미션과 이어서 할 활동을 확인하는 전용 화면이다.
// 부모 주간 리포트(/report)와 분리된 자녀 활동 기록 화면이며,
// 평가/분석이 아닌 완료 미션 중심으로 구성한다.
//
// 데이터/UI 구현은 StudentActivitySection 으로 위임하여
// student/home 요약 카드와 로직 중복을 방지한다.
//
// [변경하지 않은 것]
//   DB / migration / Supabase SQL / RLS / 미션 저장 로직 /
//   부모 리포트 계산 / weekly_activity_completions 구조
// ====================================================

import AppShell from "@/components/layout/AppShell";
import StudentActivitySection from "@/components/student/StudentActivitySection";

export default function StudentActivityPage() {
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
