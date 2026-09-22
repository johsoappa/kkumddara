"use client";

// ====================================================
// XR 수의사 Client 래퍼 — v2 (나침반모드 + 새싹모드, G2.2-R2 씬 상호작용 개편)
//
//   - next/dynamic(ssr:false)으로 R3F 씬(VetScene)을 브라우저에서만 로드
//   - useReducer로 모드별 선택 지점 진행 상태 관리
//     · compass(나침반, 기본): 5지점 → 축 집계(C 동점 규칙) → 피드백 결과
//     · sprout(새싹): 3지점 → 성취 중심 완료 화면 (축 결과·피드백·고지 미노출)
//   - 씬 조건부 언마운트 금지 — Canvas 1회 마운트 유지
//
// G2.2-R2 추가 — 요리사 G2.1-R1과 동일한 검증된 토글 패턴을 그대로
// 이식했다(파일은 공유하지 않고 이 컴포넌트 안에서 다시 구현):
//   - webglOk: 마운트 시 1회 isWebglSupported()로 판정(useEffect 안에서
//     track() 호출 없음 — 캡처빌리티 확인일 뿐 이벤트 아님).
//   - uiMode("scene"|"html")로 1차 상호작용 표시를 전환한다. useScene이
//     false인 동안(WebGL 미지원 · 사용자가 "글로 진행하기" 선택 · Canvas
//     런타임 오류)에는 기존 텍스트 선택지가 그대로, 완전한 형태로 노출된다
//     — 오늘과 동일한 텍스트 완주 흐름(키보드·스크린리더 사용자 포함).
//   - sceneUnavailable: VetScene의 onSceneError로 알려지는 Canvas 런타임
//     오류 플래그. 한번 오류가 나면 그 세션에서는 계속 HTML 흐름으로 고정한다.
//   - 씬 탭과 텍스트 버튼 클릭은 반드시 같은 handleChoice를 호출한다 —
//     잠금(choiceLockRef)·analytics는 이 함수 한 곳에만 있으므로 어느
//     경로로 선택해도 이벤트가 정확히 1회만 전송된다(중복 방지는 새 코드를
//     추가한 게 아니라 기존 잠금을 씬 경로에도 그대로 통과시킨 것뿐이다).
//
// 이벤트 규칙 (chef XR과 동일 명명 규칙 — xr_chef_* 이름은 재사용하지 않고
// 수의사 전용 xr_vet_* 이벤트만 사용한다. analytics.ts 참고):
//   xr_vet_choice_selected / xr_vet_result_shown / xr_vet_cta_clicked
//   - 전송은 반드시 클릭 핸들러에서만 한다 (useEffect 전송 금지)
//   - choice 클릭은 ref 잠금 + reaction 단계로의 화면 전환으로 이중 차단
//   - result 이벤트는 마지막 choice 클릭 핸들러에서 함께 전송
// ====================================================

import { useEffect, useReducer, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { track } from "@/lib/analytics";
import { isWebglSupported } from "../webglSupport";
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
  VET_SAFETY_NOTICE,
  aggregateResult,
  type AxisId,
  type Choice,
  type ChoiceRecord,
  type Mode,
} from "./scenario";

const VetScene = dynamic(() => import("./VetScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] w-full items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">
      진료실을 준비하고 있어요...
    </div>
  ),
});

const ROUTE = "/xr/vet";

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

export default function XrVetClient({ mode }: { mode: Mode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [ctaClicked, setCtaClicked] = useState(false);
  // 리렌더 전 연타로 인한 이벤트 중복 전송 방지 잠금
  const choiceLockRef = useRef(false);

  // G2.2-R2: 씬 상호작용 가용 여부. SSR 출력과 동일하게 false로 시작해
  // hydration mismatch를 피하고, 마운트 후 실제 판정으로 갱신한다.
  const [webglOk, setWebglOk] = useState(false);
  const [sceneUnavailable, setSceneUnavailable] = useState(false);
  const [uiMode, setUiMode] = useState<"scene" | "html">("scene");

  useEffect(() => {
    // 캡처빌리티 확인일 뿐 — track() 호출 없음 (이벤트 규칙 준수)
    setWebglOk(isWebglSupported());
  }, []);

  const useScene = webglOk && uiMode === "scene" && !sceneUnavailable;

  const points = MODE_POINTS[mode];
  const scenarioVersion = SCENARIO_VERSIONS[mode];
  const lastPoint = points.length;
  const currentPointData = points[state.currentPoint - 1];

  // 기록판: 지점3 선택 후 지점4부터 등장 (결과 화면에서도 유지 — currentPoint 보존)
  const showChart = state.phase !== "intro" && state.currentPoint >= 3;

  const handleChoice = (choice: Choice) => {
    if (choiceLockRef.current || state.phase !== "choosing") return;
    choiceLockRef.current = true;

    const record: ChoiceRecord = {
      point: state.currentPoint,
      choiceId: choice.id,
      axis: choice.axis,
    };

    track("xr_vet_choice_selected", {
      route: ROUTE,
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
      track("xr_vet_result_shown", {
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
    track("xr_vet_cta_clicked", {
      route: ROUTE,
      mode,
      scenario_version: scenarioVersion,
    });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-4 py-6">
      <header>
        <h1 className="text-lg font-bold text-gray-900">
          {mode === "sprout" ? "수의사 체험 — 새싹모드" : "수의사 체험 — 나침반모드"}
        </h1>
        {state.phase !== "result" && (
          <p className="mt-1 text-sm text-gray-500">
            {state.phase === "intro"
              ? "작은 동물병원에서 하루를 시작해요."
              : `선택 ${state.currentPoint} / ${lastPoint}`}
          </p>
        )}
      </header>

      {/* 씬은 조건부 언마운트 금지 — Canvas 1회 마운트 유지, props로만 연출 변경 */}
      <VetScene
        mode={mode}
        phase={state.phase}
        point={state.currentPoint}
        choices={useScene && state.phase === "choosing" && currentPointData ? currentPointData.choices : []}
        onChoice={handleChoice}
        showChart={showChart}
        onSceneError={() => setSceneUnavailable(true)}
      />

      {state.phase === "intro" && (
        <section className="flex flex-col gap-4">
          <p className="text-base leading-relaxed text-gray-800">{INTRO.narration}</p>
          <div className="rounded-xl bg-teal-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-teal-700">선배 수의사</p>
            <p className="mt-2 leading-relaxed">{INTRO.senior}</p>
          </div>
          <p className="text-base leading-relaxed text-gray-800">{INTRO.firstOrder}</p>
          <p className="text-xs leading-relaxed text-gray-500">{VET_SAFETY_NOTICE}</p>
          <button
            type="button"
            onClick={() => dispatch({ type: "START" })}
            className="min-h-[52px] w-full rounded-xl bg-teal-600 px-4 text-base font-semibold text-white transition-colors active:bg-teal-700"
          >
            첫 상담 시작하기
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
          {useScene && (
            <p className="text-sm font-medium text-gray-600">
              장면 속 번호가 붙은 대상을 눌러서 선택해보세요. 아래 목록에서도 같은 번호로 골라도 돼요.
            </p>
          )}
          {/* 씬이 1차 수단일 때는 텍스트 선택지를 보조 수단으로 유지하되, 글씨를
              지나치게 줄이지 않는다(모바일에서 읽고 누르기 어렵다는 검수 지적 반영) —
              장면 속 번호 배지와 같은 순서로 번호를 붙여 상호 대응을 알 수 있게 한다.
              씬을 쓸 수 없을 때(WebGL 미지원·오류·사용자 선택)는 지금처럼 완전한
              형태로 노출한다 — 두 경로 모두 같은 handleChoice를 호출한다. */}
          <div className="flex flex-col gap-2.5">
            {currentPointData.choices.map((choice, index) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => handleChoice(choice)}
                className={
                  useScene
                    ? "flex min-h-[48px] w-full items-center gap-3 rounded-lg border-2 border-teal-300 bg-teal-50 px-4 text-base font-semibold text-teal-800 transition-colors active:bg-teal-100"
                    : "min-h-[52px] w-full rounded-xl bg-teal-600 px-4 text-base font-semibold text-white transition-colors active:bg-teal-700"
                }
              >
                {useScene && (
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white"
                  >
                    {index + 1}
                  </span>
                )}
                <span>{useScene ? `${index + 1}. ${choice.label}` : choice.label}</span>
              </button>
            ))}
          </div>
          {webglOk && !sceneUnavailable && (
            <button
              type="button"
              onClick={() => setUiMode((previous) => (previous === "scene" ? "html" : "scene"))}
              className="self-start text-xs text-gray-500 underline"
            >
              {useScene ? "글로 진행하기" : "화면으로 진행하기"}
            </button>
          )}
        </section>
      )}

      {state.phase === "reaction" && currentPointData && (
        <section className="flex flex-col gap-4">
          <div className="rounded-xl bg-teal-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-teal-700">선배 수의사</p>
            <p className="mt-2 leading-relaxed">{currentPointData.reaction}</p>
          </div>
          <button
            type="button"
            onClick={handleContinue}
            className="min-h-[52px] w-full rounded-xl bg-teal-600 px-4 text-base font-semibold text-white transition-colors active:bg-teal-700"
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
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
            <p className="text-sm font-semibold text-teal-700">오늘의 선택 스타일</p>
            <h2 className="mt-1 text-lg font-bold text-gray-900">
              {AXIS_FEEDBACK[state.resultAxis].title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              {AXIS_FEEDBACK[state.resultAxis].body}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-gray-500">{RESULT_NOTICE}</p>
          <p className="text-xs leading-relaxed text-gray-500">{VET_SAFETY_NOTICE}</p>

          <div className="flex flex-col gap-3">
            <p className="text-base leading-relaxed text-gray-800">{RESULT_NEXT_ACTION}</p>
            <button
              type="button"
              onClick={handleCta}
              disabled={ctaClicked}
              className="min-h-[52px] w-full rounded-xl bg-teal-600 px-4 text-base font-semibold text-white transition-colors active:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500"
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
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
            <h2 className="text-lg font-bold text-gray-900">{SPROUT_COMPLETE.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              {SPROUT_COMPLETE.congrats}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              {SPROUT_COMPLETE.summary}
            </p>
          </div>

          <p className="text-xs leading-relaxed text-gray-500">{VET_SAFETY_NOTICE}</p>

          <div className="flex flex-col gap-3">
            <p className="text-base leading-relaxed text-gray-800">
              {SPROUT_COMPLETE.nextAction}
            </p>
            <button
              type="button"
              onClick={handleCta}
              disabled={ctaClicked}
              className="min-h-[52px] w-full rounded-xl bg-teal-600 px-4 text-base font-semibold text-white transition-colors active:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500"
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
