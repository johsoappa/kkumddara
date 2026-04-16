"use client";

// ====================================================
// 직업 상세 페이지 (/explore/[id])
// - 헤더: 뒤로가기 + 직업 상세 제목 + 하트
// - 히어로: 이모지 + 직업명 + 적합도 게이지
// - 섹션: 소개 / 역량 / 학과 / 준비 / 전망
// - 하단 고정 버튼: 로드맵 만들기
// ====================================================

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Heart, TrendingUp, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { OCCUPATIONS } from "@/data/occupations";
import OccupationQuiz from "@/components/quiz/OccupationQuiz";
import { QUIZ_DATA } from "@/data/quizData";

const LIKED_KEY = "kkumddara_liked";
const SALARY_MAX_REF = 10000; // 연봉 바 기준 (만원)

export default function OccupationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const occupation = OCCUPATIONS.find((o) => o.id === id);
  const quizData   = QUIZ_DATA.find((q) => q.occupationId === id);

  const [liked, setLiked] = useState(false);
  const [checkedPreps, setCheckedPreps] = useState<Set<number>>(new Set());

  // localStorage에서 찜 상태 복원
  useEffect(() => {
    const stored = localStorage.getItem(LIKED_KEY);
    if (stored) {
      const likedIds: string[] = JSON.parse(stored);
      setLiked(likedIds.includes(id));
    }
  }, [id]);

  // 찜 토글 + localStorage 동기화
  const toggleLike = () => {
    const stored = localStorage.getItem(LIKED_KEY);
    const likedIds: string[] = stored ? JSON.parse(stored) : [];
    const next = liked
      ? likedIds.filter((l) => l !== id)
      : [...likedIds, id];
    localStorage.setItem(LIKED_KEY, JSON.stringify(next));
    setLiked(!liked);
  };

  // 준비 항목 체크 토글
  const togglePrep = (idx: number) => {
    setCheckedPreps((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  // 직업 ID를 찾을 수 없는 경우
  if (!occupation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-off">
        <div className="text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-base font-bold text-base-text">
            직업 정보를 찾을 수 없어요
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm text-brand-red font-semibold"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-base-off pb-28">

        {/* ---- 상단 헤더 ---- */}
        <div className="sticky top-0 z-50 bg-white border-b border-base-border">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-off transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft size={20} className="text-base-text" />
            </button>
            <h1 className="text-sm font-bold text-base-text">직업 상세</h1>
            <button
              onClick={toggleLike}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-off transition-colors"
              aria-label={liked ? "찜 해제" : "찜하기"}
            >
              <Heart
                size={20}
                className={cn(
                  "transition-colors",
                  liked ? "fill-brand-red text-brand-red" : "text-base-muted"
                )}
              />
            </button>
          </div>
        </div>

        {/* ---- 히어로 섹션 ---- */}
        <div className="bg-white px-5 py-8 flex flex-col items-center text-center border-b border-base-border">
          <span className="text-6xl mb-4 leading-none">{occupation.emoji}</span>
          <h2 className="text-2xl font-bold text-base-text">
            {occupation.name}
          </h2>
          <span className="mt-1.5 text-xs font-medium text-white bg-brand-red px-3 py-1 rounded-full">
            {occupation.category}
          </span>
        </div>

        {/* ---- 카드 섹션 목록 ---- */}
        <div className="px-4 py-4 flex flex-col gap-3">

          {/* ① 직업 소개 */}
          <section className="card">
            <h3 className="text-sm font-bold text-base-text mb-2">직업 소개</h3>
            <p className="text-sm text-base-muted leading-relaxed">
              {occupation.description}
            </p>
          </section>

          {/* ② 필요 역량 */}
          <section className="card">
            <h3 className="text-sm font-bold text-base-text mb-3">필요 역량</h3>
            <div className="flex flex-wrap gap-2">
              {occupation.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 bg-brand-light text-brand-red text-xs font-semibold rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          {/* ③ 관련 학과 및 추천 대학 */}
          <section className="card">
            <h3 className="text-sm font-bold text-base-text mb-3">
              관련 학과 및 추천 대학
            </h3>
            <div className="flex flex-col gap-4">
              {occupation.relatedMajors.map((major) => (
                <div key={major.name}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red flex-shrink-0" />
                    <span className="text-sm font-semibold text-base-text">
                      {major.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-3.5">
                    {major.universities.map((univ) => (
                      <span
                        key={univ}
                        className="text-xs bg-base-card text-base-muted px-2.5 py-1 rounded-full"
                      >
                        {univ}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ④ 지금 할 수 있는 준비 */}
          <section className="card">
            <h3 className="text-sm font-bold text-base-text mb-3">
              지금 할 수 있는 준비
            </h3>
            <div className="flex flex-col gap-3">
              {occupation.preparations.map((prep, idx) => (
                <button
                  key={idx}
                  onClick={() => togglePrep(idx)}
                  className="flex items-center gap-3 text-left w-full"
                >
                  {/* 체크박스 */}
                  <span
                    className={cn(
                      "w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all",
                      checkedPreps.has(idx)
                        ? "bg-brand-red border-brand-red"
                        : "border-base-border"
                    )}
                  >
                    {checkedPreps.has(idx) && (
                      <span className="text-white text-[10px] font-bold leading-none">
                        ✓
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm transition-colors",
                      checkedPreps.has(idx)
                        ? "text-base-muted line-through"
                        : "text-base-text"
                    )}
                  >
                    {prep}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* ⑤ 직업 전망 */}
          <section className="card">
            <h3 className="text-sm font-bold text-base-text mb-4">직업 전망</h3>

            {/* 예상 연봉 바 그래프 */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-base-muted">예상 연봉 범위</span>
                <span className="text-xs font-semibold text-base-text">
                  {occupation.salaryMin.toLocaleString()}
                  <span className="text-base-muted font-normal">~</span>
                  {occupation.salaryMax.toLocaleString()}만원
                </span>
              </div>
              {/* 전체 바 */}
              <div className="relative h-2.5 bg-base-border rounded-full overflow-hidden">
                {/* 최소 연봉까지 빈 영역 */}
                <div
                  className="absolute inset-y-0 left-0 bg-transparent"
                  style={{
                    width: `${(occupation.salaryMin / SALARY_MAX_REF) * 100}%`,
                  }}
                />
                {/* 연봉 범위 바 */}
                <div
                  className="absolute inset-y-0 rounded-full"
                  style={{
                    left: `${(occupation.salaryMin / SALARY_MAX_REF) * 100}%`,
                    width: `${
                      ((occupation.salaryMax - occupation.salaryMin) /
                        SALARY_MAX_REF) *
                      100
                    }%`,
                    background:
                      "linear-gradient(90deg, #E84B2E, #FF7043)",
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-base-muted">0</span>
                <span className="text-[10px] text-base-muted">
                  1억원
                </span>
              </div>
            </div>

            {/* 연간 성장률 */}
            <div className="flex items-center justify-between py-3 border-t border-base-border">
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-brand-red" />
                <span className="text-sm text-base-text">연간 성장률</span>
              </div>
              <span className="text-sm font-bold text-brand-red">
                +{occupation.growthRate}%
              </span>
            </div>

            {/* 미래 유망도 */}
            <div className="flex items-center justify-between py-3 border-t border-base-border">
              <span className="text-sm text-base-text">미래 유망도</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < occupation.futureRating
                        ? "fill-brand-orange text-brand-orange"
                        : "text-base-border"
                    }
                  />
                ))}
              </div>
            </div>
          </section>
          {/* ⑥ 직업 연계 퀴즈 (퀴즈 데이터가 있는 직업만 표시) */}
          {quizData && (
            <section>
              <OccupationQuiz quizData={quizData} />
            </section>
          )}

        </div>

        {/* ---- 하단 고정 버튼 ---- */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile px-4 py-4 bg-white border-t border-base-border safe-bottom z-50">
          <button
            onClick={() => {
              localStorage.setItem("kkumddara_chosen_roadmap", id);
              router.push(`/roadmap/${id}`);
            }}
            className="btn-primary"
          >
            이 직업으로 로드맵 만들기
          </button>
        </div>
      </div>
    </div>
  );
}
