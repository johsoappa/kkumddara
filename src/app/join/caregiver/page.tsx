"use client";

// ====================================================
// 보호자 초대 수락 페이지 (/join/caregiver)
//
// [베타 상태]
//   공동 양육자 초대 기능은 베타에서 비활성화되어 있습니다.
//   초대 코드 입력·수락 흐름은 렌더링하지 않습니다.
//
// [Phase 3 예정]
//   - verify_caregiver_invite RPC 기반 코드 검증
//   - accept_caregiver_invite RPC 기반 수락 처리
//   - /caregiver/home 화면 추가
// ====================================================

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function JoinCaregiverPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-white min-h-screen flex flex-col">

        {/* 헤더 */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b border-base-border"
          style={{ paddingTop: "env(safe-area-inset-top, 12px)" }}
        >
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full hover:bg-base-off transition-colors"
            aria-label="뒤로가기"
          >
            <ChevronLeft size={20} className="text-base-text" />
          </button>
          <h1 className="text-sm font-bold text-base-text">보호자 연결</h1>
        </div>

        {/* 준비중 안내 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
            style={{ background: "#FFF0EB" }}
            aria-hidden="true"
          >
            🔧
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-base font-bold text-base-text leading-snug">
              공동 양육자 초대 기능은 준비 중입니다
            </p>
            <p className="text-sm text-base-muted leading-relaxed">
              현재 베타에서는 공동 양육자 초대 기능을 제공하지 않습니다.
              <br />
              정식 지원 전까지는 메인 보호자 계정으로 이용해주세요.
            </p>
          </div>

          <button
            onClick={() => router.replace("/")}
            className="
              mt-2 px-6 py-3 rounded-button
              text-sm font-semibold text-white
              transition-opacity active:opacity-80
            "
            style={{ backgroundColor: "#E84B2E" }}
          >
            홈으로 돌아가기
          </button>
        </div>

      </div>
    </div>
  );
}
