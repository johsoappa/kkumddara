"use client";

// ====================================================
// XR 수의사 Client 래퍼 — v3 (나침반모드 + 새싹모드, G2.2-R3-B 상담 스토리 전면 구현)
//
//   - next/dynamic(ssr:false)으로 R3F 씬(VetScene)을 브라우저에서만 로드
//   - useReducer로 모드별 선택 지점 진행 상태 관리
//     · compass(나침반, 기본): 5지점 → 축 집계(C 동점 규칙) → 피드백 결과
//     · sprout(새싹): 3지점 → 성취 중심 완료 화면 (축 결과·피드백·고지 미노출)
//   - 씬 조건부 언마운트 금지 — Canvas 1회 마운트 유지
//
// G2.2-R2 — 요리사 G2.1-R1과 동일한 검증된 토글 패턴을 그대로 이식했다
// (파일은 공유하지 않고 이 컴포넌트 안에서 다시 구현):
//   - webglOk: 마운트 시 1회 isWebglSupported()로 판정(useEffect 안에서
//     track() 호출 없음 — 캡처빌리티 확인일 뿐 이벤트 아님).
//   - uiMode("scene"|"html")로 1차 상호작용 표시를 전환한다. useScene이
//     false인 동안(WebGL 미지원 · 사용자가 "글로 진행하기" 선택 · Canvas
//     런타임 오류)에는 기존 텍스트 선택지가 그대로, 완전한 형태로 노출된다.
//   - sceneUnavailable: VetScene의 onSceneError로 알려지는 Canvas 런타임
//     오류 플래그. 한번 오류가 나면 그 세션에서는 계속 HTML 흐름으로 고정한다.
//   - 씬 탭과 텍스트 버튼 클릭은 반드시 같은 handleChoice를 호출한다 —
//     잠금(choiceLockRef)·analytics는 이 함수 한 곳에만 있으므로 어느
//     경로로 선택해도 이벤트가 정확히 1회만 전송된다.
//
// G2.2-R3-B 추가 — choice가 sceneTarget(실제 씬 오브젝트)인지 actionCard
// (HTML 전용, 추상 행동)인지에 따라 버튼에 작은 배지(숫자 원/사각형 —
// 플랫폼 이모지 아님, CSS 도형)를 붙이고, 씬의 SceneTargetPins와 같은
// 순번을 쓴다. reaction 화면에는 기존 점 공통 reaction 문구 외에 방금
// 고른 choice의 개별 피드백(vetStoryboard.CHOICE_FEEDBACK)을 더 보여주고,
// Canvas 위에는 DOM HUD(VetSceneHud)를, 결과 화면에는 실제 history 순서를
// 그대로 보여주는 ChoiceTimeline을 추가했다. handleChoice/choiceLockRef/
// analytics 이벤트 이름·속성·전송 시점은 전혀 건드리지 않았다.
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
import { sceneInteractionId } from "./sceneLayout";
import { CHOICE_FEEDBACK, classifyChoice } from "./vetStoryboard";
import ChoiceTimeline from "./ChoiceTimeline";
import { getR4ActionCopy, isR4Action } from "./r4ActionDefinitions";

const VetScene = dynamic(() => import("./VetScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] w-full items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">
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
  /** 선택 기록 — 지점 순서 보존 (C 규칙 역순 탐색의 전제, 결과 타임라인도 이 순서를 그대로 쓴다) */
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

/** 씬 타깃 선택지 버튼 앞에 붙는 작은 원형 순번 배지 — SceneTargetPins의
 *  핀과 같은 순번(choices 배열 인덱스+1)을 쓴다. 플랫폼 이모지가 아니라
 *  CSS 도형이고, aria-hidden이라 버튼의 접근 가능한 이름에는 포함되지
 *  않는다(정확한 choice.label만 이름으로 읽힌다). */
function SceneTargetBadge({ ordinal }: { ordinal: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 border-teal-600 bg-white text-xs font-bold text-teal-700"
    >
      {ordinal}
    </span>
  );
}

/** actionCard(추상 행동, 씬에 대응 오브젝트 없음) 선택지 버튼 앞의 배지 —
 *  원이 아니라 사각형으로 "이 선택은 장면이 아니라 카드로 고른다"는 것을
 *  구분한다. 마찬가지로 aria-hidden, 이모지 아님. */
function ActionCardBadge() {
  return (
    <span
      aria-hidden="true"
      className="h-6 w-6 flex-none rounded-[6px] border-2 border-gray-400 bg-white"
    />
  );
}

export default function XrVetClient({ mode, r4 = false }: { mode: Mode; r4?: boolean }) {
  // G2.2-R4-B: ?r4=1은 새싹·나침반 양쪽에서 활성화된다(로컬 프로토타입, analytics 구조 변경 없음).
  // mode는 항상 "sprout"|"compass" 둘 중 하나이므로 별도 화이트리스트 체크가 필요 없다.
  const r4Enabled = r4;
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

  // R4: 선택 → 직접 조작(action) → 완료 시 기존 handleChoice 한 번. 조작 전에는 analytics를 보내지 않는다.
  const [pendingChoice, setPendingChoice] = useState<Choice | null>(null);
  const pendingRef = useRef<Choice | null>(null);
  const [announce, setAnnounce] = useState("");
  const r4Active = r4Enabled && useScene;
  // 여러 단계(altSteps) 대체 조작의 진행 인덱스 — 새 action이 시작되거나 취소되면 0으로 되돌린다.
  const [altStepIndex, setAltStepIndex] = useState(0);

  const points = MODE_POINTS[mode];
  const scenarioVersion = SCENARIO_VERSIONS[mode];
  const lastPoint = points.length;
  const currentPointData = points[state.currentPoint - 1];
  const currentSceneId = sceneInteractionId(mode, state.currentPoint);
  const lastRecord = state.history[state.history.length - 1] ?? null;
  const lastChoiceFeedback = lastRecord ? CHOICE_FEEDBACK[lastRecord.choiceId] : undefined;

  // 기록판: 지점3 선택 후 지점4부터 등장 (결과 화면에서도 유지 — currentPoint 보존)
  const showChart = state.phase !== "intro" && state.currentPoint >= 3;

  const hud =
    state.phase === "intro"
      ? { stepLabel: "도입", speakerLabel: "보호자", text: INTRO.guardianLine }
      : state.phase === "choosing" && currentPointData
        ? {
            stepLabel: `선택 ${state.currentPoint} / ${lastPoint}`,
            speakerLabel: "상황",
            text: currentPointData.situation ?? currentPointData.title,
          }
        : state.phase === "reaction" && currentPointData
          ? {
              stepLabel: `선택 ${state.currentPoint} / ${lastPoint}`,
              speakerLabel: "선배 수의사",
              text: currentPointData.reaction,
            }
          : undefined; // 결과 화면에서는 HUD를 그리지 않는다(완료 배지와 겹침 방지, G2.2-R3-C)

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

  const handlePick = (choice: Choice) => {
    if (r4Active && state.phase === "choosing" && isR4Action(choice.id)) {
      if (pendingRef.current || choiceLockRef.current) return; // action 중 중복 선택 차단
      pendingRef.current = choice;
      setPendingChoice(choice);
      setAltStepIndex(0);
      setAnnounce(`조작 시작: ${getR4ActionCopy(choice.id)?.title ?? ""}`);
      return;
    }
    handleChoice(choice);
  };

  const completeAction = () => {
    const choice = pendingRef.current;
    if (!choice) return; // 더블 완료 방지
    pendingRef.current = null;
    setPendingChoice(null);
    const copy = getR4ActionCopy(choice.id);
    if (copy) {
      setAnnounce(copy.doneAnnouncement);
    }
    setAltStepIndex(0);
    handleChoice(choice);
  };

  /** 여러 단계 대체 조작 — 현재 단계 버튼을 누르면 다음 단계로, 마지막 단계면 completeAction. */
  const advanceAltStep = (steps: string[]) => {
    const next = altStepIndex + 1;
    if (next >= steps.length) {
      completeAction();
      return;
    }
    setAltStepIndex(next);
    setAnnounce(`${next + 1} / ${steps.length}단계: ${steps[next]}`);
  };

  const cancelAction = () => {
    pendingRef.current = null;
    setPendingChoice(null);
    setAltStepIndex(0);
    setAnnounce("조작을 취소했어요. 다시 선택해 주세요.");
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
        choices={
          useScene && state.phase === "choosing" && currentPointData && !pendingChoice
            ? currentPointData.choices
            : []
        }
        onChoice={handlePick}
        showChart={showChart}
        lastChoiceId={lastRecord?.choiceId ?? null}
        hud={hud}
        onSceneError={() => setSceneUnavailable(true)}
        r4={
          r4Active
            ? {
                actionChoiceId: pendingChoice && isR4Action(pendingChoice.id) ? pendingChoice.id : null,
                onActionComplete: completeAction,
              }
            : undefined
        }
      />
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      {state.phase === "intro" && (
        <section className="flex flex-col gap-4">
          <p className="text-base leading-relaxed text-gray-800">{INTRO.narration}</p>
          <div className="rounded-xl bg-amber-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-amber-700">보호자</p>
            <p className="mt-2 leading-relaxed">{INTRO.guardianLine}</p>
          </div>
          <div className="rounded-xl bg-teal-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-teal-700">선배 수의사</p>
            <p className="mt-2 leading-relaxed">{INTRO.senior}</p>
          </div>
          <p className="text-base leading-relaxed text-gray-800">{INTRO.mission}</p>
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
              장면 속 강아지·보호자·선배 수의사·도구를 직접 눌러서 선택해보세요. 원형 숫자가 있는
              대상은 장면에서도 누를 수 있고, 사각형 표시는 아래 목록에서만 고를 수 있어요.
            </p>
          )}
          {/* G2.2-R3-B: sceneTarget choice에는 씬 핀과 같은 순번의 원형 배지를,
              actionCard(추상 행동) choice에는 사각형 배지를 붙인다. 배지는
              aria-hidden이라 버튼의 접근 가능한 이름은 choice.label 그대로다.
              씬을 쓸 수 없을 때(WebGL 미지원·오류·사용자 선택)는 완전한 형태로
              노출한다 — 두 경로 모두 같은 handleChoice를 호출한다. */}
          {pendingChoice && isR4Action(pendingChoice.id) && getR4ActionCopy(pendingChoice.id) && (
            <div
              role="group"
              aria-label="직접 조작"
              className="flex flex-col gap-3 rounded-xl border-2 border-teal-300 bg-teal-50 p-4"
            >
              <p className="text-base font-semibold text-teal-900">{getR4ActionCopy(pendingChoice.id)!.title}</p>
              <p className="text-sm leading-relaxed text-gray-700">{getR4ActionCopy(pendingChoice.id)!.instruction}</p>
              {getR4ActionCopy(pendingChoice.id)!.altSteps ? (
                <ol className="flex flex-col gap-2">
                  {getR4ActionCopy(pendingChoice.id)!.altSteps!.map((step, index) => (
                    <li key={step}>
                      <button
                        type="button"
                        disabled={index !== altStepIndex}
                        onClick={() => advanceAltStep(getR4ActionCopy(pendingChoice.id)!.altSteps!)}
                        aria-current={index === altStepIndex ? "step" : undefined}
                        className={
                          index === altStepIndex
                            ? "min-h-[48px] w-full rounded-lg bg-teal-600 px-4 text-left text-base font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
                            : "min-h-[48px] w-full rounded-lg bg-white px-4 text-left text-base text-gray-400"
                        }
                      >
                        {index < altStepIndex ? "완료: " : `${index + 1}. `}
                        {step}
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <button
                  type="button"
                  onClick={completeAction}
                  className="min-h-[48px] w-full rounded-lg bg-teal-600 px-4 text-base font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
                >
                  {getR4ActionCopy(pendingChoice.id)!.altLabel}
                </button>
              )}
              <button
                type="button"
                onClick={cancelAction}
                className="inline-flex min-h-[44px] items-center self-start px-1 text-sm text-gray-600 underline"
              >
                다른 선택 고르기
              </button>
            </div>
          )}
          <div
            className="flex flex-col gap-2.5"
            hidden={!!pendingChoice}
            style={pendingChoice ? { display: "none" } : undefined}
          >
            {currentPointData.choices.map((choice, index) => {
              const classification = classifyChoice(currentSceneId, choice.id);
              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => handlePick(choice)}
                  className={
                    (useScene
                      ? "flex min-h-[48px] w-full items-center gap-3 rounded-lg border-2 border-teal-300 bg-teal-50 px-4 text-base font-semibold text-teal-800 transition-colors active:bg-teal-100"
                      : "flex min-h-[52px] w-full items-center gap-3 rounded-xl bg-teal-600 px-4 text-base font-semibold text-white transition-colors active:bg-teal-700")
                  }
                >
                  {useScene &&
                    (classification === "sceneTarget" ? (
                      <SceneTargetBadge ordinal={index + 1} />
                    ) : (
                      <ActionCardBadge />
                    ))}
                  <span className="text-left">{choice.label}</span>
                </button>
              );
            })}
          </div>
          {webglOk && !sceneUnavailable && (
            <button
              type="button"
              onClick={() => {
                pendingRef.current = null; // 글로 진행하기: 진행 중이던 조작은 버리고 기존 선택형 흐름으로
                setPendingChoice(null);
                setUiMode((previous) => (previous === "scene" ? "html" : "scene"));
              }}
              className="inline-flex min-h-[44px] items-center self-start px-1 text-sm text-gray-600 underline"
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
          {lastChoiceFeedback && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-gray-700">
              <p className="font-semibold text-amber-700">지금 한 일</p>
              <p className="mt-2 leading-relaxed">{lastChoiceFeedback}</p>
            </div>
          )}
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

          <div>
            <p className="mb-2 text-sm font-semibold text-gray-800">오늘 콩이와 함께한 상담 기록</p>
            <ChoiceTimeline mode={mode} history={state.history} />
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

          <div>
            <p className="mb-2 text-sm font-semibold text-gray-800">오늘 콩이와 함께한 상담 기록</p>
            <ChoiceTimeline mode={mode} history={state.history} />
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
