"use client";

// ====================================================
// 명따라 메인 입력 화면 (/myeonddara)
// - 소개 카드 (딥블루 그라디언트)
// - 사주 입력 폼
// - 분석 시작 → /myeonddara/result 이동
// ====================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import SajuInput from "@/components/myeonddara/SajuInput";
import { MYEONDDARA_INPUT_KEY } from "@/data/myeonddara";
import type { SajuInputData } from "@/types/myeonddara";

const OHAENG_BADGES = [
  { emoji: "🔥", label: "화(火)" },
  { emoji: "🌊", label: "수(水)" },
  { emoji: "🌲", label: "목(木)" },
  { emoji: "⚙️", label: "금(金)" },
  { emoji: "⛰️", label: "토(土)" },
];

export default function MyeonddaraPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (data: SajuInputData) => {
    setIsLoading(true);
    localStorage.setItem(MYEONDDARA_INPUT_KEY, JSON.stringify(data));

    // 분석 시뮬레이션 (실제 연동 시 API 호출로 교체)
    setTimeout(() => {
      router.push("/myeonddara/result");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-base-off">

        {/* ---- 헤더 ---- */}
        <div className="sticky top-0 z-50 bg-white border-b border-base-border">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-off transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft size={20} className="text-base-text" />
            </button>
            <h1 className="text-sm font-bold text-base-text">명따라</h1>
            <div className="w-9" />
          </div>
        </div>

        {/* ---- 컨텐츠 ---- */}
        <div className="px-4 pt-4 pb-10 flex flex-col gap-4">

          {/* 🧪 테스트 버전 안내 배너 */}
          <div
            className="rounded-card p-3 border text-sm leading-relaxed"
            style={{ backgroundColor: "#FFF9C4", borderColor: "#F9A825" }}
          >
            <p className="font-semibold text-yellow-900 mb-0.5">🧪 현재 테스트 버전입니다.</p>
            <p className="text-yellow-800 text-xs leading-relaxed">
              분석 결과는 실제 사주 데이터가 아닌 예시 데이터로 제공됩니다.<br />
              정식 버전에서는 정확한 분석을 제공할 예정입니다.
            </p>
          </div>

          {/* ① 소개 카드 */}
          <div
            className="rounded-card-lg px-4 py-6 text-center"
            style={{
              background: "linear-gradient(135deg, #1A3A6B, #2C5F8A)",
            }}
          >
            <span className="text-5xl leading-none block mb-3">✨</span>
            <h2 className="text-2xl font-bold text-white mb-2">명따라</h2>
            <p className="text-sm text-white/80 leading-relaxed mb-5">
              아이의 생년월일시로<br />
              타고난 기질과 적성을 분석해드려요.<br />
              동양 철학의 지혜로<br />
              진로의 방향을 찾아보세요.
            </p>
            {/* 오행 뱃지 - 한 줄 */}
            <div className="flex justify-center gap-1 flex-nowrap">
              {OHAENG_BADGES.map((b) => (
                <span
                  key={b.label}
                  className="flex items-center gap-0.5 text-xs font-semibold text-white px-2 py-1 rounded-full whitespace-nowrap"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  <span>{b.emoji}</span>
                  <span>{b.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* ② 입력 폼 */}
          <SajuInput onSubmit={handleSubmit} isLoading={isLoading} />

          {/* ③ 하단 안내 문구 */}
          <p className="text-xs text-base-muted text-center leading-relaxed px-4">
            명따라는 동양 철학 기반의 참고용 진로 분석 서비스입니다.<br />
            아이의 가능성은 무한합니다. 💛
          </p>
        </div>
      </div>
    </div>
  );
}
