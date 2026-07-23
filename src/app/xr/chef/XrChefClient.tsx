"use client";

// ====================================================
// XR 요리사 Client 래퍼 — v0.2 (나침반모드 + 새싹모드)
//
// 역할:
//   - next/dynamic(ssr:false)으로 R3F 씬(ChefScene)을 브라우저에서만 로드
//   - 모드별 선택 지점 진행 상태 관리 (useReducer — 신규 라이브러리 없음)
//     · compass(나침반, 기본): 5지점 → 축 집계(C 동점 규칙) → 피드백 결과
//     · sprout(새싹): 3지점 → 성취 중심 완료 화면 (축 결과·피드백·고지 미노출,
//       aggregateResult 미호출 — 결과 화면은 모드로 명시 분기해 구조적으로 차단)
//   - 단계에 맞는 카메라 stage/접시 표시를 ChefScene에 props로 전달
//     (씬 조건부 언마운트 금지 — Canvas 1회 마운트 유지)
//
// 이벤트 규칙 (중복 방지):
//   - 전송은 반드시 클릭 핸들러에서만 한다 (useEffect 전송 금지)
//   - choice 클릭은 ref 잠금 + reaction 단계로의 화면 전환으로 이중 차단
//   - result 이벤트는 마지막 choice 클릭 핸들러에서 함께 전송
//     (새싹은 result_axis: "none" — analytics 공용 property 타입 유지 결정)
// ====================================================

import { useReducer, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { track } from "@/lib/analytics";
import {
  AXIS_FEEDBACK,
  CTA_CLICKED_NOTICE,
  CTA_LABEL,
  INTRO,
  MODE_POINTS,
  PARENT_GUIDE,
  RESULT_NEXT_ACTION,
  RESULT_NOTICE,
  SCENARIO_VERSIONS,
  SPROUT_COMPLETE,
  aggregateResult,
  type AxisId,
  type CameraStage,
  type Choice,
  type ChoiceRecord,
  type Mode,
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
  /** 현재 지점 번호 (choosing/reaction에서 유효) */
  currentPoint: number;
  /** 선택 기록 — 지점 순서 보존 (C 규칙 역순 탐색의 전제) */
  history: ChoiceRecord[];
  /** 마지막 지점 선택 완료 여부 — CONTINUE 시 결과/완료 화면으로 전환 */
  finished: boolean;
  /** 나침반모드 결과 축 (새싹모드는 항상 null — 집계하지 않음) */
  resultAxis: AxisId | null;
}

type Action =
  | { type: "START" }
  | { type: "CHOOSE"; record: ChoiceRecord; isLast: boolean; resultAxis: AxisId | null }
  | { type: "CONTINUE" };

const initialState: State = {
  phase: "intro",
  currentPoint: 1,
  history: [],
  finished: false,
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
        finished: action.isLast,
        resultAxis: action.resultAxis,
      };
    case "CONTINUE":
      if (state.finished) {
        return { ...state, phase: "result" };
      }
      return { ...state, phase: "choosing", currentPoint: state.currentPoint + 1 };
    default:
      return state;
  }
}

export default function XrChefClient({ mode }: { mode: Mode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [ctaClicked, setCtaClicked] = useState(false);
  // 리렌더 전 연타로 인한 이벤트 중복 전송 방지 잠금
  const choiceLockRef = useRef(false);

  const points = MODE_POINTS[mode];
  const scenarioVersion = SCENARIO_VERSIONS[mode];
  const lastPoint = points.length;
  const currentPointData = points[state.currentPoint - 1];

  // 카메라 단계: intro/result는 주방 전체(overview), 진행 중엔 지점별 태그
  const cameraStage: CameraStage =
    state.phase === "intro" || state.phase === "result"
      ? "overview"
      : currentPointData?.cameraStage ?? "overview";

  // 접시: 지점2 선택 후 지점3부터 등장 (결과 화면에서도 유지 — currentPoint 보존)
  const showPlate = state.phase !== "intro" && state.currentPoint >= 3;

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
      mode,
      choice_point: state.currentPoint,
      choice_id: choice.id,
      axis_tag: choice.axis,
      scenario_version: scenarioVersion,
    });

    // 마지막 지점이면 같은 클릭 핸들러에서 result 이벤트까지 전송.
    // 집계는 나침반모드만 수행 — 새싹은 결과 미노출이므로 "none"으로 완주만 기록.
    const isLast = state.currentPoint === lastPoint;
    let resultAxis: AxisId | null = null;
    if (isLast) {
      if (mode === "compass") {
        resultAxis = aggregateResult([...state.history, record]);
      }
      track("xr_chef_result_shown", {
        mode,
        result_axis: resultAxis ?? "none",
        scenario_version: scenarioVersion,
      });
    }

    dispatch({ type: "CHOOSE", record, isLast, resultAxis });
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
      mode,
      scenario_version: scenarioVersion,
    });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-4 py-6">
      <header>
        <h1 className="text-lg font-bold text-gray-900">
          {mode === "sprout" ? "요리사 체험 — 새싹모드" : "요리사 체험 — 나침반모드"}
        </h1>
        {state.phase !== "result" && (
          <p className="mt-1 text-sm text-gray-500">
            {state.phase === "intro"
              ? "작은 레스토랑 주방에서 하루를 시작해요."
              : `선택 ${state.currentPoint} / ${lastPoint}`}
          </p>
        )}
      </header>

      {/* 씬은 조건부 언마운트 금지 — Canvas 1회 마운트 유지, props로만 연출 변경 */}
      <ChefScene stage={cameraStage} showPlate={showPlate} />

      {state.phase === "intro" && (
        <section className="flex flex-col gap-4">
          <p className="text-base leading-relaxed text-gray-800">{INTRO.narration}</p>
          <div className="rounded-xl bg-orange-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-orange-700">선배 요리사</p>
            <p className="mt-2 leading-relaxed">{INTRO.senior}</p>
          </div>
          <p className="text-base leading-relaxed text-gray-800">{INTRO.firstOrder}</p>
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
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-gray-900">
            {currentPointData.title}
          </h2>
          {currentPointData.situation && (
            <p className="text-base leading-relaxed text-gray-800">
              {currentPointData.situation}
            </p>
          )}
          <div className="flex flex-col gap-3">
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
        <section className="flex flex-col gap-4">
          <div className="rounded-xl bg-orange-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-orange-700">선배 요리사</p>
            <p className="mt-2 leading-relaxed">{currentPointData.reaction}</p>
          </div>
          <button
            type="button"
            onClick={handleContinue}
            className="min-h-[52px] w-full rounded-xl bg-orange-500 px-4 text-base font-semibold text-white transition-colors active:bg-orange-600"
          >
            {state.finished
              ? mode === "sprout"
                ? "완료 화면 보기"
                : "결과 보기"
              : "계속하기"}
          </button>
        </section>
      )}

      {/* 결과 화면은 모드로 명시 분기 — 새싹에는 축 결과·피드백·고지가 구조적으로 없음 */}

      {state.phase === "result" && mode === "compass" && state.resultAxis !== null && (
        <section className="flex flex-col gap-5">
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm font-semibold text-orange-700">오늘의 선택 스타일</p>
            <h2 className="mt-1 text-lg font-bold text-gray-900">
              {AXIS_FEEDBACK[state.resultAxis].title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              {AXIS_FEEDBACK[state.resultAxis].body}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-gray-500">{RESULT_NOTICE}</p>

          <div className="flex flex-col gap-3">
            <p className="text-base leading-relaxed text-gray-800">{RESULT_NEXT_ACTION}</p>
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
            <div className="mt-3 flex flex-col gap-4 text-sm text-gray-700">
              <p className="leading-relaxed">{PARENT_GUIDE.intro}</p>
              <div>
                <p className="font-semibold">{PARENT_GUIDE.axesNote}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
                  {PARENT_GUIDE.axes.map((axis) => (
                    <li key={axis}>{axis}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold">{PARENT_GUIDE.questionsNote}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
                  {PARENT_GUIDE.questions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        </section>
      )}

      {state.phase === "result" && mode === "sprout" && (
        <section className="flex flex-col gap-5">
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <h2 className="text-lg font-bold text-gray-900">{SPROUT_COMPLETE.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              {SPROUT_COMPLETE.congrats}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              {SPROUT_COMPLETE.summary}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-base leading-relaxed text-gray-800">
              {SPROUT_COMPLETE.nextAction}
            </p>
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
        </section>
      )}
    </main>
  );
}
