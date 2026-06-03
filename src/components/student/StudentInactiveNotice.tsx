"use client";

// ====================================================
// StudentInactiveNotice — 비활성(삭제)된 자녀 프로필 학생 안내
//
// 보호자가 자녀 프로필을 삭제(soft delete: child.profile_status='inactive')하면,
// 그 자녀와 연결된 학생 계정은 일반 학생 홈/활동/로드맵 데이터를 볼 수 없다.
// 이 화면은 차단 안내 + 로그아웃만 제공한다(개인화 데이터 미표시).
// ====================================================

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

export default function StudentInactiveNotice() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <div className="px-6 py-16 flex flex-col items-center text-center gap-3">
      <span className="text-4xl" aria-hidden="true">🔒</span>
      <h1 className="text-lg font-bold text-base-text leading-snug">
        이 자녀 프로필은 현재 사용할 수 없어요
      </h1>
      <p className="text-sm text-base-muted leading-relaxed">
        보호자가 자녀 프로필을 삭제했거나 비활성화했기 때문에 꿈따라 활동 기록을 불러올 수 없습니다.
      </p>
      <p className="text-xs text-base-muted leading-relaxed">
        다시 이용하려면 보호자에게 문의해 주세요.
      </p>
      <button
        onClick={handleLogout}
        className="mt-4 px-6 py-3 rounded-button text-sm font-bold text-white active:opacity-70 transition-opacity"
        style={{ backgroundColor: "#E84B2E" }}
      >
        로그아웃
      </button>
    </div>
  );
}
