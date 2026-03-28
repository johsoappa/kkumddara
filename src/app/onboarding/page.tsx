"use client";

// ====================================================
// 온보딩 수정 페이지 (/onboarding)
// - 홈 화면 "수정 >" 클릭 시 진입
// - 기존 선택값 미리 채운 상태로 폼 표시
// - 저장 후 /home 으로 복귀
// ====================================================

import OnboardingForm from "@/components/onboarding/OnboardingForm";

export default function OnboardingEditPage() {
  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-white shadow-card">
        <OnboardingForm isEdit />
      </div>
    </div>
  );
}
