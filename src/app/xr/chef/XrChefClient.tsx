"use client";

// ====================================================
// XR Chef 기술검증 Client 래퍼 — v0.0
//
// 역할:
//   - next/dynamic(ssr:false)으로 R3F 씬(ChefScene)을 브라우저에서만 로드
//   - 선택지 버튼 1개 표시 + 클릭 시 PostHog 이벤트 1회 전송
//   - 첫 클릭 즉시 버튼 비활성화로 중복 전송 차단 (useEffect 전송 금지)
// ====================================================

import { useState } from "react";
import dynamic from "next/dynamic";
import { track } from "@/lib/analytics";

const ChefScene = dynamic(() => import("./ChefScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] w-full items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">
      주방을 준비하고 있어요...
    </div>
  ),
});

export default function XrChefClient() {
  const [selected, setSelected] = useState(false);

  // 이벤트는 반드시 클릭 핸들러에서만 전송한다 (Effect 전송 금지 — 중복 방지)
  const handleChoice = () => {
    if (selected) return;
    setSelected(true);
    track("xr_chef_choice_selected", {
      route: "/xr/chef",
      choice_id: "v0_choice_01",
      scenario_version: "v0.0",
    });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-4 py-6">
      <header>
        <h1 className="text-lg font-bold text-gray-900">요리사 체험 (기술검증)</h1>
        <p className="mt-1 text-sm text-gray-500">
          v0.0 실험 페이지입니다. 주방을 둘러보고 아래 선택지를 눌러 보세요.
        </p>
      </header>

      <ChefScene />

      <button
        type="button"
        onClick={handleChoice}
        disabled={selected}
        className="min-h-[52px] w-full rounded-xl bg-orange-500 px-4 text-base font-semibold text-white transition-colors active:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500"
      >
        {selected ? "주문을 확인했어요" : "주문을 확인한다"}
      </button>
    </main>
  );
}
