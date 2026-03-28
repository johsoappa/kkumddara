"use client";

// ====================================================
// 로드맵 인덱스 페이지 (/roadmap)
// - 마지막 선택 직업 로드맵으로 리다이렉트
// - 선택한 직업 없으면 직업 탐색 화면으로 이동
// ====================================================

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const LAST_ROADMAP_KEY = "kkumddara_last_roadmap";

export default function RoadmapIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // 명시적 선택한 직업 우선, 없으면 마지막 방문 직업, 없으면 탐색으로
    const chosen = localStorage.getItem("kkumddara_chosen_roadmap");
    const last   = localStorage.getItem(LAST_ROADMAP_KEY);
    const target = chosen ?? last;
    if (target) {
      router.replace(`/roadmap/${target}`);
    } else {
      router.replace("/explore");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-off">
      <div className="text-center">
        <p className="text-3xl mb-2">🗺️</p>
        <p className="text-sm text-base-muted">로드맵 불러오는 중...</p>
      </div>
    </div>
  );
}
