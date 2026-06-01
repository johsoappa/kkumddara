"use client";

// ====================================================
// 학생 체험(데모) "내 활동" 페이지 (/demo/student/activity)
//
// 비로그인 학생 체험 사용자가 BottomNav "내 활동" 탭을 눌렀을 때
// 보호 라우트 /student/activity 로 이동해 홈/랜딩으로 튕기던 문제를 해소하기 위한
// 데모 전용 안내 화면.
//
// 실제 저장 데이터(roadmap_progress 등)는 조회하지 않으며,
// 가짜 완료 미션을 보여주지 않는다. 체험 모드임을 자연스럽게 안내한다.
//
// BottomNav 는 navRoleOverride="student" 로 항상 학생용으로 표시한다.
// (실제 로그인 학생은 /student/activity 를 사용 — BottomNav 가 href를 분기)
// ====================================================

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Zap } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { DEMO_ROLE_KEY } from "@/components/layout/BottomNav";

export default function DemoStudentActivityPage() {
  const router = useRouter();

  // 학생 체험 흐름 표식 유지 (공용 화면 이동 시에도 학생용 BottomNav 유지)
  useEffect(() => {
    try { sessionStorage.setItem(DEMO_ROLE_KEY, "student"); } catch { /* noop */ }
  }, []);

  return (
    <AppShell headerTitle="내 활동" navRoleOverride="student">
      <div className="px-5 pt-5 pb-10 flex flex-col gap-5">

        {/* 체험 모드 배너 */}
        <div
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-button text-xs font-semibold"
          style={{ backgroundColor: "#FFF0EB", color: "#E84B2E" }}
        >
          <span>체험 모드</span>
          <span className="opacity-50">·</span>
          <span className="font-normal" style={{ opacity: 0.8 }}>샘플 화면을 둘러보는 중이에요</span>
        </div>

        {/* 상단 안내 */}
        <div>
          <h1 className="text-xl font-bold text-base-text leading-snug">내 활동</h1>
          <p className="text-sm text-base-muted mt-1 leading-relaxed">
            미션을 완료하면 내가 해낸 활동을 여기에서 다시 확인할 수 있어요.
          </p>
        </div>

        {/* 빈 상태 카드 */}
        <div className="bg-white rounded-card-lg shadow-card px-4 py-6">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap size={16} strokeWidth={2} style={{ color: "#E84B2E" }} />
            <p className="text-sm font-bold text-base-text">내가 해낸 미션</p>
          </div>
          <p className="text-sm font-bold text-base-text mb-1">
            아직 체험 모드에서는 저장된 미션 기록이 없어요.
          </p>
          <p className="text-xs text-base-muted leading-relaxed">
            로그인하고 미션을 완료하면 내가 해낸 활동을 모아볼 수 있어요.
          </p>
        </div>

        {/* CTA 버튼 */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => router.push("/explore")}
            className="flex items-center justify-between w-full px-3.5 py-3 rounded-button text-left active:opacity-70 transition-opacity"
            style={{ backgroundColor: "#FFF0EB" }}
          >
            <span className="text-sm font-semibold" style={{ color: "#E84B2E" }}>
              직업 탐색하러 가기
            </span>
            <ChevronRight size={15} style={{ color: "#E84B2E" }} />
          </button>

          <button
            onClick={() => router.push("/?role=student&step=auth")}
            className="flex items-center justify-center gap-1.5 w-full py-3.5 rounded-button text-sm font-bold text-white"
            style={{ backgroundColor: "#E84B2E" }}
          >
            로그인하고 내 활동 저장하기
            <ChevronRight size={16} />
          </button>
        </div>

        <p className="text-center text-xs text-base-muted">
          베타 기간 무료 이용 · 자동결제 없음
        </p>

      </div>
    </AppShell>
  );
}
