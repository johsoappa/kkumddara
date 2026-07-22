"use client";

// ====================================================
// XR 요리사 나침반모드 Client 래퍼 — v0.1
//
// 역할:
//   - next/dynamic(ssr:false)으로 R3F 씬(ChefScene)을 브라우저에서만 로드
//   - 나침반모드 5개 선택 지점 진행 상태 관리 (useReducer — 신규 라이브러리 없음)
//   - 집계(C 동점 규칙)는 scenario.ts의 순수 함수에 위임
//
// 이벤트 규칙 (중복 방지):
//   - 전송은 반드시 클릭 핸들러에서만 한다 (useEffect 전송 금지)
//   - choice 클릭은 ref 잠금 + reaction 단계로의 화면 전환으로 이중 차단
//   - result 이벤트는 마지막(지점5) choice 클릭 핸들러에서 함께 전송
//
// 씬 유지 규칙:
//   - ChefScene은 조건부 언마운트 금지 — Canvas는 1회 마운트 후 고정,
//     지점·선택지·결과는 씬 바깥 텍스트 UI로만 전환한다
// ====================================================

import { useReducer, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { track } from "@/lib/analytics";
import {
  AXIS_FEEDBACK,
  CHOICE_POINTS,
  CTA_CLICKED_NOTICE,
  CTA_LABEL,
  INTRO,
  PARENT_GUIDE,
  RESULT_NEXT_ACTION,
  RESULT_NOTICE,
  SCENARIO_VERSION,
  aggregateResult,
  type AxisId,
  type Choice,
  type ChoiceRecord,
} from "./scenario";

const ChefScene = dynamic(() => import("./ChefScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] w-full items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">
      주방을 준비하고 있어요...
    </div>
  ),
});

// ---------- 진행 상태 (useReducer) ----------

type Phase = "intro" | "choosing" | "reaction" | "result";

interface State {
  phase: Phase;
  /** 현재 지점 번호 1~5 (choosing/reaction에서 유효) */
  currentPoint: number;
  /** 선택 기록 — 지점 순서(1→5) 보존 (C 규칙 역순 탐색의 전제) */
  history: ChoiceRecord[];
  /** 지점5 선택 시 확정되는 결과 축 (그 전에는 null) */
  resultAxis: AxisId | null;
}

type Action =
  | { type: "START" }
  | { type: "CHOOSE"; record: ChoiceRecord; resultAxis: AxisId | null }
  | { type: "CONTINUE" };

const initialState: State = {
  phase: "intro",
  currentPoint: 1,
  history: [],
  resultAxis: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START":
      return { ...state, phase: "choosing", currentPoint: 1 };
    case "CHOOSE":
      return {
        ...state,
        phase: "reaction",
        history: [...state.history, action.record],
        resultAxis: action.resultAxis,
      };
    case "CONTINUE":
      // 결과 축이 확정됐으면 결과 화면, 아니면 다음 지점으로
      if (state.resultAxis !== null) {
        return { ...state, phase: "result" };
      }
      return { ...state, phase: "choosing", currentPoint: state.currentPoint + 1 };
    default:
      return state;
  }
}

const LAST_POINT = CHOICE_POINTS.length; // 5

export default function XrChefClient() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [ctaClicked, setCtaClicked] = useState(false);
  // 리렌더 전 연타로 인한 이벤트 중복 전송 방지 잠금
  const choiceLockRef = useRef(false);

  const currentPointData = CHOICE_POINTS[state.currentPoint - 1];

  const handleChoice = (choice: Choice) => {
    if (choiceLockRef.current || state.phase !== "choosing") return;
    choiceLockRef.current = true;

    const record: ChoiceRecord = {
      point: state.currentPoint,
      choiceId: choice.id,
      axis: choice.axis,
    };

    track("xr_chef_choice_selected", {
      route: "/xr/chef",
      choice_point: state.currentPoint,
      choice_id: choice.id,
      axis_tag: choice.axis,
      scenario_version: SCENARIO_VERSION,
    });

    // 마지막 지점이면 같은 클릭 핸들러에서 결과 집계 + result 이벤트까지 전송
    let resultAxis: AxisId | null = null;
    if (state.currentPoint === LAST_POINT) {
      resultAxis = aggregateResult([...state.history, record]);
      track("xr_chef_result_shown", {
        result_axis: resultAxis,
        scenario_version: SCENARIO_VERSION,
      });
    }

    dispatch({ type: "CHOOSE", record, resultAxis });
  };

  const handleContinue = () => {
    choiceLockRef.current = false;
    dispatch({ type: "CONTINUE" });
  };

  const handleCta = () => {
    if (ctaClicked) return;
    setCtaClicked(true);
    track("xr_chef_cta_clicked", {
      route: "/xr/chef",
      scenario_version: SCENARIO_VERSION,
    });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-4 py-6">
      <header>
        <h1 className="text-lg font-bold text-gray-900">요리사 체험 — 나침반모드</h1>
        {state.phase !== "result" && (
          <p className="mt-1 text-sm text-gray-500">
            {state.phase === "intro"
              ? "작은 레스토랑 주방에서 하루를 시작해요."
              : `선택 ${state.currentPoint} / ${LAST_POINT}`}
          </p>
        )}
      </header>

      {/* 씬은 조건부 언마운트 금지 — Canvas 1회 마운트 유지 */}
      <ChefScene />

      {state.phase === "intro" && (
        <section className="flex flex-col gap-3">
          <p className="text-base text-gray-800">{INTRO.narration}</p>
          <div className="rounded-xl bg-orange-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-orange-700">선배 요리사</p>
            <p className="mt-1">{INTRO.senior}</p>
          </div>
          <p className="text-base text-gray-800">{INTRO.firstOrder}</p>
          <button
            type="button"
            onClick={() => dispatch({ type: "START" })}
            className="min-h-[52px] w-full rounded-xl bg-orange-500 px-4 text-base font-semibold text-white transition-colors active:bg-orange-600"
          >
            첫 주문 시작하기
          </button>
        </section>
      )}

      {state.phase === "choosing" && currentPointData && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-gray-900">
            {currentPointData.title}
          </h2>
          <p className="text-base text-gray-800">{currentPointData.situation}</p>
          <div className="flex flex-col gap-2">
            {currentPointData.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => handleChoice(choice)}
                className="min-h-[52px] w-full rounded-xl bg-orange-500 px-4 text-base font-semibold text-white transition-colors active:bg-orange-600"
              >
                {choice.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {state.phase === "reaction" && currentPointData && (
        <section className="flex flex-col gap-3">
          <div className="rounded-xl bg-orange-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-orange-700">선배 요리사</p>
            <p className="mt-1">{currentPointData.reaction}</p>
          </div>
          <button
            type="button"
            onClick={handleContinue}
            className="min-h-[52px] w-full rounded-xl bg-orange-500 px-4 text-base font-semibold text-white transition-colors active:bg-orange-600"
          >
            {state.resultAxis !== null ? "결과 보기" : "계속하기"}
          </button>
        </section>
      )}

      {state.phase === "result" && state.resultAxis !== null && (
        <section className="flex flex-col gap-4">
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm font-semibold text-orange-700">오늘의 선택 스타일</p>
            <h2 className="mt-1 text-lg font-bold text-gray-900">
              {AXIS_FEEDBACK[state.resultAxis].title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              {AXIS_FEEDBACK[state.resultAxis].body}
            </p>
          </div>

          <p className="text-sm text-gray-500">{RESULT_NOTICE}</p>

          <div className="flex flex-col gap-2">
            <p className="text-base text-gray-800">{RESULT_NEXT_ACTION}</p>
            <button
              type="button"
              onClick={handleCta}
              disabled={ctaClicked}
              className="min-h-[52px] w-full rounded-xl bg-orange-500 px-4 text-base font-semibold text-white transition-colors active:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500"
            >
              {CTA_LABEL}
            </button>
            {ctaClicked && (
              <p className="text-center text-sm text-gray-600">{CTA_CLICKED_NOTICE}</p>
            )}
          </div>

          <details className="rounded-xl border border-gray-200 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-gray-800">
              부모님께 안내드려요
            </summary>
            <div className="mt-3 flex flex-col gap-3 text-sm text-gray-700">
              <p>{PARENT_GUIDE.intro}</p>
              <div>
                <p className="font-semibold">{PARENT_GUIDE.axesNote}</p>
                <ul className="mt-1 list-disc pl-5">
                  {PARENT_GUIDE.axes.map((axis) => (
                    <li key={axis}>{axis}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold">{PARENT_GUIDE.questionsNote}</p>
                <ul className="mt-1 list-disc pl-5">
                  {PARENT_GUIDE.questions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        </section>
      )}
    </main>
  );
}
