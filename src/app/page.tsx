"use client";

// ====================================================
// 온보딩 페이지 (루트 경로: /)
// - 온보딩 완료 데이터가 있으면 /home으로 리다이렉트
// - 없으면 온보딩 폼 표시
// ====================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingForm from "@/components/onboarding/OnboardingForm";

export default function OnboardingPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("kkumddara_onboarding");
    if (stored) {
      router.replace("/home");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-off">
        <p className="text-sm text-base-muted">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-white shadow-card">
        <OnboardingForm />
      </div>
    </div>
  );
}
