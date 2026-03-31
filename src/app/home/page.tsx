// ====================================================
// /home — role 기반 redirect (미들웨어 처리)
// 미들웨어에서 /parent/home 또는 /student/home으로 redirect함.
// 이 컴포넌트는 미들웨어 bypass 시 fallback용.
// ====================================================

import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/");
}
