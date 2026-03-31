// ====================================================
// /onboarding — role 기반 redirect (미들웨어 처리)
// 미들웨어에서 /onboarding/parent 또는 /onboarding/student로 redirect함.
// ====================================================

import { redirect } from "next/navigation";

export default function OnboardingPage() {
  redirect("/");
}
