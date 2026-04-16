"use client";

// ====================================================
// OccupationQuiz — 나침반 모드 직업 연계 퀴즈
//
// [흐름]
//   시작 버튼 → 문제 1/3 → 2/3 → 3/3 → 결과 카드 → 미션 완료(MissionSuccessModal)
//
// [상태]
//   DB 저장 없이 local state만 사용 (MVP)
//   DB 확장 포인트: 파일 하단 주석 참조
// ====================================================

import { useState } from "react";
import MissionSuccessModal from "@/components/mission/MissionSuccessModal";
import type { OccupationQuizData } from "@/data/quizData";

// ── Props ──────────────────────────────────────────────────────
interface OccupationQuizProps {
  quizData: OccupationQuizData;
}

// ── 내부 타입 ──────────────────────────────────────────────────
type QuizPhase = "entry" | "quiz" | "result";

interface QuizState {
  currentIndex: number;
  answers:      (number | null)[];  // 각 문제의 선택 인덱스 (null = 미응답)
}

// ── 컴포넌트 ──────────────────────────────────────────────────
export default function OccupationQuiz({ quizData }: OccupationQuizProps) {
  const { questions, occupationName } = quizData;

  const [phase, setPhase]     = useState<QuizPhase>("entry");
  const [quizState, setQuizState] = useState<QuizState>({
    currentIndex: 0,
    answers:      new Array(questions.length).fill(null) as (number | null)[],
  });
  const [answered, setAnswered]       = useState(false);
  const [showModal, setShowModal]     = useState(false);

  // ── 파생 값 ────────────────────────────────────────────────
  const currentQ      = questions[quizState.currentIndex];
  const selectedOption = quizState.answers[quizState.currentIndex];
  const isLastQ       = quizState.currentIndex === questions.length - 1;
  const progressPct   = ((quizState.currentIndex + 1) / questions.length) * 100;

  const correctCount = quizState.answers.reduce<number>((acc, ans, i) => {
    const q = questions[i];
    return ans !== null && q !== undefined && ans === q.correctIndex ? acc + 1 : acc;
  }, 0);

  // ── 핸들러 ─────────────────────────────────────────────────
  const handleStart = () => setPhase("quiz");

  const handleSelect = (idx: number) => {
    if (answered) return;
    const newAnswers = [...quizState.answers];
    newAnswers[quizState.currentIndex] = idx;
    setQuizState((s) => ({ ...s, answers: newAnswers }));
    setAnswered(true);
  };

  const handleNext = () => {
    if (isLastQ) {
      setPhase("result");
    } else {
      setQuizState((s) => ({ ...s, currentIndex: s.currentIndex + 1 }));
      setAnswered(false);
    }
  };

  const handleRetry = () => {
    setPhase("quiz");
    setQuizState({
      currentIndex: 0,
      answers:      new Array(questions.length).fill(null) as (number | null)[],
    });
    setAnswered(false);
  };

  // ── 1. 시작 전 진입 버튼 ──────────────────────────────────
  if (phase === "entry") {
    return (
      <div className="mt-6">
        <button
          onClick={handleStart}
          className="w-full rounded-button py-4 text-sm font-bold text-white transition-opacity hover:opacity-90 active:opacity-80"
          style={{ backgroundColor: "#E84B2E" }}
        >
          이 직업 더 알아보기 — 퀴즈 도전! 🎯
        </button>
      </div>
    );
  }

  // ── 2. 결과 카드 ─────────────────────────────────────────
  if (phase === "result") {
    const allCorrect = correctCount === questions.length;
    const resultEmoji = allCorrect ? "🎉" : correctCount >= 2 ? "👍" : "🔄";
    const resultMsg   = allCorrect
      ? "완벽해요! 모두 맞혔어요 🌟"
      : `${Math.round((correctCount / questions.length) * 100)}% 정확도예요. 다시 도전해볼 수도 있어요!`;

    return (
      <>
        <div className="mt-6 rounded-card-lg bg-white p-6 shadow-card text-center">
          {/* 결과 이모지 */}
          <p className="mb-3 text-5xl leading-none">{resultEmoji}</p>

          {/* 타이틀 */}
          <h3 className="mb-1 text-sm font-bold" style={{ color: "#212121" }}>
            {occupationName} 퀴즈 완료!
          </h3>

          {/* 점수 */}
          <p className="mb-1 text-4xl font-bold" style={{ color: "#E84B2E" }}>
            {correctCount} <span className="text-2xl text-base-muted">/ {questions.length}</span>
          </p>

          {/* 메시지 */}
          <p className="mb-6 text-sm leading-relaxed" style={{ color: "#9E9E9E" }}>
            {resultMsg}
          </p>

          {/* 문제별 정오 요약 */}
          <div className="mb-6 flex justify-center gap-2">
            {questions.map((q, i) => {
              const ans = quizState.answers[i];
              const isCorrect = ans !== null && ans === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: isCorrect ? "#4CAF50" : "#E84B2E" }}
                >
                  {isCorrect ? "✓" : "✗"}
                </div>
              );
            })}
          </div>

          {/* 버튼 */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="w-full rounded-button py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#E84B2E" }}
            >
              미션 완료 🧭
            </button>
            <button
              onClick={handleRetry}
              className="w-full rounded-button py-3 text-sm font-semibold"
              style={{ backgroundColor: "#F2F2F2", color: "#9E9E9E" }}
            >
              다시 도전하기
            </button>
          </div>
        </div>

        {/* 미션 완료 모달 */}
        <MissionSuccessModal
          mode="compass"
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          missionTitle={`${occupationName} 퀴즈 완료`}
        />
      </>
    );
  }

  // ── 3. 퀴즈 진행 ────────────────────────────────────────────
  if (currentQ === undefined) return null;

  const isCorrect = selectedOption !== null && selectedOption === currentQ.correctIndex;

  return (
    <div className="mt-6">

      {/* 진행 헤더 */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: "#9E9E9E" }}>
            {occupationName} 퀴즈
          </span>
          <span className="text-xs font-bold" style={{ color: "#E84B2E" }}>
            {quizState.currentIndex + 1} / {questions.length}
          </span>
        </div>
        {/* 진행 바 */}
        <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "#F2F2F2" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, backgroundColor: "#E84B2E" }}
          />
        </div>
      </div>

      {/* 문제 카드 */}
      <div className="rounded-card-lg bg-white p-5 shadow-card">

        {/* 문제 */}
        <p className="mb-5 text-sm font-semibold leading-relaxed" style={{ color: "#212121" }}>
          Q{quizState.currentIndex + 1}. {currentQ.question}
        </p>

        {/* 선택지 */}
        <div className="flex flex-col gap-2.5">
          {currentQ.options.map((opt, idx) => {
            // 색상 상태 계산
            let borderColor = "#E5E5E5";
            let bgColor     = "#FFFFFF";
            let textColor   = "#212121";
            let fontWeight  = "500";

            if (answered) {
              if (idx === currentQ.correctIndex) {
                // 정답 강조
                borderColor = "#4CAF50";
                bgColor     = "#F1F8E9";
                textColor   = "#2E7D32";
                fontWeight  = "700";
              } else if (idx === selectedOption) {
                // 선택한 오답 강조
                borderColor = "#E84B2E";
                bgColor     = "#FFF0EB";
                textColor   = "#E84B2E";
              }
            } else if (selectedOption === idx) {
              // 선택 중 (아직 confirm 전 — 여기선 즉시 확정이므로 사용 안 됨)
              borderColor = "#E84B2E";
              bgColor     = "#FFF0EB";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={answered}
                className="w-full rounded-card border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default"
                style={{ borderColor, backgroundColor: bgColor, color: textColor, fontWeight }}
              >
                <span className="mr-2 text-xs" style={{ color: "#9E9E9E" }}>
                  {String.fromCharCode(65 + idx)}.
                </span>
                {opt}
                {answered && idx === currentQ.correctIndex && (
                  <span className="ml-1.5 text-xs font-bold" style={{ color: "#4CAF50" }}>✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 정오 피드백 + 해설 */}
        {answered && (
          <div
            className="mt-4 rounded-card px-4 py-3"
            style={{
              backgroundColor: isCorrect ? "#F1F8E9" : "#FFF0EB",
              border:          `1px solid ${isCorrect ? "#C8E6C9" : "#FFCCBC"}`,
            }}
          >
            <p
              className="mb-1 text-xs font-bold"
              style={{ color: isCorrect ? "#2E7D32" : "#E84B2E" }}
            >
              {isCorrect ? "정답이에요! ✓" : "아쉽지만 다시 생각해봐요 💪"}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#555" }}>
              {currentQ.explanation}
            </p>
          </div>
        )}

        {/* 다음 버튼 */}
        {answered && (
          <button
            onClick={handleNext}
            className="mt-4 w-full rounded-button py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#E84B2E" }}
          >
            {isLastQ ? "결과 보기" : "다음 문제"}
          </button>
        )}
      </div>
    </div>
  );
}

/*
 * ── 직업 상세 페이지 연결 방법 ────────────────────────────────────────
 *
 * // src/app/explore/[id]/page.tsx
 *
 * import OccupationQuiz from "@/components/quiz/OccupationQuiz";
 * import { QUIZ_DATA }  from "@/data/quizData";
 *
 * // occupationId는 URL params.id 와 quizData.occupationId 를 일치시킬 것
 * // 현재 샘플: 'historian' (역사학자), 'veterinarian' (수의사)
 *
 * export default function OccupationDetailPage({ params }: { params: { id: string } }) {
 *   const quizData = QUIZ_DATA.find((q) => q.occupationId === params.id);
 *
 *   return (
 *     <div className="px-4 pb-10">
 *       // ... 직업 상세 카드 ...
 *
 *       {quizData && (
 *         <section className="mt-6">
 *           <OccupationQuiz quizData={quizData} />
 *         </section>
 *       )}
 *     </div>
 *   );
 * }
 *
 * ── DB 저장 확장 포인트 ────────────────────────────────────────────────
 *
 * // OccupationQuiz.tsx handleNext — isLastQ 분기에서:
 * // 1. 미션 완료 기록
 * //    await supabase.from("mission_completions").insert({
 * //      user_id:        userId,
 * //      occupation_id:  quizData.occupationId,
 * //      correct_count:  correctCount,
 * //      total:          questions.length,
 * //      completed_at:   new Date().toISOString(),
 * //    });
 * //
 * // 2. 포인트/배지 지급
 * //    await supabase.rpc("award_quiz_points", { user_id: userId, points: correctCount * 10 });
 * //
 * // 3. 로드맵 미션 체크 연동
 * //    await supabase.from("roadmap_missions")
 * //      .update({ is_completed: true })
 * //      .eq("mission_type", "quiz")
 * //      .eq("occupation_id", quizData.occupationId)
 * //      .eq("user_id", userId);
 */
