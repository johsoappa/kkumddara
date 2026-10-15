"use client";

// ====================================================
// XR 요리사 — "손님의 채소 볶음밥 한 접시 만들기" 시범 체험 Client (F11, 신규)
//
// 진입: /xr/chef (기본) 또는 /xr/chef?scenario=fried-rice — 기존 NEXT_PUBLIC_XR_CHEF_ENABLED 플래그 뒤.
//       이전 체험(나침반·새싹)은 /xr/chef?scenario=classic 으로 보존한다(F13).
// 범위: 1단계 주문 확인 · 2단계 재료 준비까지. 3~5단계(조리 순서·불 조절·플레이팅·전달)는 이어서 붙인다.
//
// 구조
//  - 상태는 friedRice.ts의 reducer 하나가 소유한다. 3D 씬과 아래 DOM 패널은 같은 상태를 읽고 같은 액션을 보낸다.
//  - 3D(주문표 누르기, 재료 끌기)가 1차 조작이다. "글로 진행하기"(HTML 폴백)와 준비 현황의 버튼은
//    같은 액션을 보내는 대체 경로(접근성)이며, Canvas 입력 성공으로 세지 않는다.
//  - 말풍선·단계 표시·준비 현황은 캔버스 "밖"(DOM)에 둔다 → 3D 조작 대상을 덮지 않는다.
//  - analytics 이벤트는 보내지 않는다(실험 진입, 기존 이벤트 계약 불변). 연결은 정식 편입 때 결정한다.
// ====================================================

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { isWebglSupported } from "../webglSupport";
import FriedRiceProgressBar from "./FriedRiceProgressBar";
import {
  FRIED_RICE_DONE,
  FRIED_RICE_SERVED,
  FRIED_RICE_STEPS,
  HEAT_LEVELS,
  INGREDIENTS,
  ORDER,
  bubbleFor,
  cookOrderNote,
  cookOrderSummary,
  friedRiceReducer,
  heatLabel,
  heatNote,
  ingredientName,
  initialFriedRiceState,
  outcomeSummary,
  prepGuidance,
  prepStatus,
  stepStatus,
  trayRemaining,
  type Bubble,
  type FriedRiceState,
  type HeatLevel,
  type IngredientId,
} from "./friedRice";

const FriedRiceScene = dynamic(() => import("./FriedRiceScene"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-square max-h-[460px] min-h-[320px] w-full items-center justify-center rounded-xl bg-[#efe9dd] text-sm text-gray-600">
      주방을 준비하고 있어요...
    </div>
  ),
});

/** "밥을/당근을/양파를" — 받침에 맞는 목적격 조사 */
function eulReul(word: string): string {
  const last = word.charCodeAt(word.length - 1);
  const hasFinal = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  return `${word}${hasFinal ? "을" : "를"}`;
}

// ---------- 작은 표시 컴포넌트 ----------

function StepBar({ state }: { state: FriedRiceState }) {
  return (
    <ol className="flex items-start gap-1" aria-label="체험 단계" data-testid="fried-rice-steps">
      {FRIED_RICE_STEPS.map((step, index) => {
        const status = stepStatus(state.phase, index);
        const completed = status === "completed";
        const current = status === "current";
        return (
          <li
            key={step.id}
            aria-current={current ? "step" : undefined}
            className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center"
          >
            <span
              className={[
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                completed
                  ? "bg-teal-700 text-white"
                  : current
                    ? "bg-orange-700 text-white ring-2 ring-orange-200"
                    : "bg-gray-200 text-gray-600",
              ].join(" ")}
            >
              {completed ? "✓" : index + 1}
            </span>
            <span
              className={[
                "w-full truncate text-[11px] leading-tight",
                current ? "font-bold text-gray-900" : "text-gray-600",
              ].join(" ")}
            >
              {step.title}
            </span>
            {status === "upcoming" && <span className="text-[10px] leading-none text-gray-500">예정</span>}
          </li>
        );
      })}
    </ol>
  );
}

function Avatar({ speaker }: { speaker: Bubble["speaker"] }) {
  const customer = speaker === "손님";
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-12 w-12 shrink-0 rounded-full"
      aria-hidden="true"
      style={{ background: customer ? "#dcecf7" : "#f4e8d4" }}
    >
      {customer ? (
        <>
          <path d="M6 48c2-10 10-14 18-14s16 4 18 14z" fill="#4f86b5" />
          <circle cx="24" cy="23" r="11" fill="#f6c9a0" />
          <path d="M12.5 22c0-9 6-13 11.5-13s11.5 4 11.5 13c-3-5-7-6-11.5-6s-8.500 1-11.500 6z" fill="#5a3a2a" />
          <circle cx="20" cy="24" r="1.4" fill="#2a2320" />
          <circle cx="28" cy="24" r="1.4" fill="#2a2320" />
          <path d="M20 29c2 2 6 2 8 0" stroke="#8c3f35" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M6 48c2-10 10-14 18-14s16 4 18 14z" fill="#f7f4ee" />
          <path d="M18 36l6 6 6-6" stroke="#d94f3c" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="24" cy="25" r="10" fill="#e9b98f" />
          <path d="M13 17c-1-7 4-10 6-10 1-3 9-3 10 0 2 0 7 3 6 10z" fill="#f7f4ee" />
          <rect x="14" y="15" width="20" height="4" rx="1" fill="#e4dfd3" />
          <circle cx="20" cy="25" r="1.4" fill="#2a2320" />
          <circle cx="28" cy="25" r="1.4" fill="#2a2320" />
          <path d="M19 30c2.500 2 7.500 2 10 0" stroke="#8c3f35" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M18.500 28.500c2-1 9-1 11 0" stroke="#b9b4aa" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function SpeechBubble({ bubble }: { bubble: Bubble }) {
  const customer = bubble.speaker === "손님";
  return (
    <div className="flex min-h-[100px] items-start gap-3" data-testid="fried-rice-bubble">
      <Avatar speaker={bubble.speaker} />
      <div
        className={[
          "relative min-w-0 flex-1 rounded-2xl rounded-tl-sm px-3.5 py-2.5",
          customer ? "bg-sky-50 text-sky-950" : "bg-orange-50 text-gray-800",
        ].join(" ")}
      >
        <p className={["text-xs font-bold", customer ? "text-sky-800" : "text-orange-800"].join(" ")}>
          {bubble.speaker}
        </p>
        <p className="mt-0.5 text-[15px] leading-snug">{bubble.text}</p>
      </div>
    </div>
  );
}

/** DOM 주문표 — 글로 진행하기 모드의 1차 조작 대상이자, 재료 준비 중 "주문표 다시 보기" 카드. */
function OrderSlip({
  state,
  onOpen,
  onCheck,
  onReview,
  compact = false,
}: {
  state: FriedRiceState;
  onOpen?: () => void;
  onCheck?: () => void;
  onReview?: () => void;
  compact?: boolean;
}) {
  const opened = state.order !== "closed" || state.phase !== "order";
  const checked = state.order === "requestChecked" || state.phase !== "order";
  return (
    <div
      className="overflow-hidden rounded-xl border-2 border-slate-600 bg-[#fffaf0] text-gray-900 shadow-sm"
      data-testid="order-slip"
    >
      <p className="bg-slate-600 px-3 py-1.5 text-sm font-bold text-white">주문표</p>
      <div className={compact ? "space-y-2 p-3" : "space-y-3 p-4"}>
        {opened ? (
          <>
            <div>
              <p className="text-xs font-semibold text-gray-600">메뉴</p>
              <p className="text-lg font-extrabold">
                {ORDER.menu} <span className="text-red-700">{ORDER.quantity}개</span>
              </p>
            </div>
            <div
              className={[
                "rounded-lg border-2 px-3 py-2",
                checked ? "border-green-700 bg-green-100" : "border-yellow-600 bg-yellow-200",
              ].join(" ")}
            >
              <p className="text-xs font-semibold text-gray-700">
                {checked ? "요청 · 확인했어요" : "요청"}
              </p>
              <p className="text-base font-extrabold">{ORDER.request}</p>
            </div>
            {onCheck && !checked && (
              <button
                type="button"
                onClick={onCheck}
                className="min-h-[44px] w-full rounded-lg bg-orange-700 px-3 text-sm font-semibold text-white"
              >
                요청 메모 확인하기
              </button>
            )}
            {onReview && checked && (
              <button
                type="button"
                onClick={onReview}
                className="min-h-[44px] w-full rounded-lg border border-orange-700 bg-white px-3 text-sm font-semibold text-orange-800"
              >
                요청 다시 보기
              </button>
            )}
          </>
        ) : (
          <>
            <p className="text-base font-bold text-red-700">새 주문이 도착했어요</p>
            {onOpen && (
              <button
                type="button"
                onClick={onOpen}
                className="min-h-[44px] w-full rounded-lg bg-orange-700 px-3 text-sm font-semibold text-white"
              >
                주문표 열기
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------- 본체 ----------

export default function XrChefFriedRiceClient() {
  const [state, dispatch] = useReducer(friedRiceReducer, initialFriedRiceState);
  const [webglOk, setWebglOk] = useState(false);
  const [sceneUnavailable, setSceneUnavailable] = useState(false);
  const [uiMode, setUiMode] = useState<"scene" | "html">("scene");
  const [peek, setPeek] = useState(false);
  const [live, setLive] = useState("");
  // F12: 진행 버튼(모바일 하단 고정 바)이 끄는 중·단계가 바뀐 직후에 잘못 눌리지 않게 한다
  const [sceneDragging, setSceneDragging] = useState(false);
  const [settling, setSettling] = useState(false);
  const dragEndedAt = useRef(0);
  const wasDragging = useRef(false);
  const lastProgressAt = useRef(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [],
  );

  // 모바일 하단 바가 포커스된 요소를 가리지 않도록 스크롤 여백을 둔다(데스크톱에서는 바가 고정이 아니므로 건드리지 않는다)
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    if (!window.matchMedia("(max-width: 767px)").matches) return undefined;
    const root = document.documentElement;
    const previous = root.style.scrollPaddingBottom;
    root.style.scrollPaddingBottom = "9rem";
    return () => {
      root.style.scrollPaddingBottom = previous;
    };
  }, []);

  const handleDraggingChange = useCallback((dragging: boolean) => {
    setSceneDragging(dragging);
    // 씬이 처음 올라오며 보내는 "끄는 중 아님"은 드래그 끝이 아니다 — 실제로 끌다가 놓은 때(true → false)만 기록한다
    if (dragging) {
      wasDragging.current = true;
    } else if (wasDragging.current) {
      wasDragging.current = false;
      dragEndedAt.current = Date.now();
    }
  }, []);

  /**
   * 진행 버튼 동작을 감싼다: 끄는 중이거나 막 끝났으면 무시하고, 실행한 뒤 잠깐(600ms)은 다시 실행하지 않는다 —
   * 같은 자리에서 다음 단계 버튼으로 바뀌므로 더블탭·연타(키보드 Enter 두 번 포함)로 두 단계가 한꺼번에 넘어가지 않게 한다.
   * 포인터는 `pointer-events-none`으로도 막지만 키보드는 막지 못하므로 시간 기준으로 한 번 더 확인한다.
   */
  const progress = (action: () => void) => () => {
    const now = Date.now();
    if (sceneDragging || now - dragEndedAt.current < 300 || now - lastProgressAt.current < 600) return;
    lastProgressAt.current = now;
    action();
    setSettling(true);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setSettling(false), 600);
  };
  const barBusy = sceneDragging || settling;

  useEffect(() => {
    // 캡처빌리티 확인일 뿐이다(SSR과 같은 false로 시작해 hydration 불일치를 피한다).
    setWebglOk(isWebglSupported());
  }, []);

  const useScene = webglOk && uiMode === "scene" && !sceneUnavailable;
  const bubble = bubbleFor(state);
  const status = prepStatus(state.tray);
  const guidance = prepGuidance(state.tray);

  const openOrder = useCallback(() => {
    dispatch({ type: "OPEN_ORDER" });
    setLive("주문표를 열었어요. 채소 볶음밥 1개예요. 요청 메모도 확인해 주세요.");
  }, []);
  const checkRequest = useCallback(() => {
    dispatch({ type: "CHECK_REQUEST" });
    setLive(`요청을 확인했어요. ${ORDER.request}.`);
  }, []);
  const reviewRequest = useCallback(() => {
    dispatch({ type: "REVIEW_REQUEST" });
    setLive(`요청을 다시 봤어요. ${ORDER.request}.`);
  }, []);
  const startPrep = useCallback(() => {
    dispatch({ type: "START_PREP" });
    setLive("재료 준비를 시작해요. 필요한 재료만 준비 트레이에 올려 주세요.");
  }, []);
  const addIngredient = useCallback(
    (id: IngredientId) => {
      if (state.phase !== "prep" || state.tray.includes(id)) return;
      dispatch({ type: "ADD_INGREDIENT", id });
      setLive(
        id === "onion"
          ? `양파를 트레이에 올렸어요. 주문표에는 ${ORDER.request}라고 적혀 있어요. 양파를 되돌려 주세요.`
          : `${eulReul(ingredientName(id))} 트레이에 올렸어요.`,
      );
    },
    [state.phase, state.tray],
  );
  const removeIngredient = useCallback(
    (id: IngredientId) => {
      if (state.phase !== "prep" || !state.tray.includes(id)) return;
      dispatch({ type: "REMOVE_INGREDIENT", id });
      setLive(`${eulReul(ingredientName(id))} 선반으로 되돌렸어요.`);
    },
    [state.phase, state.tray],
  );
  const finishPrep = useCallback(() => {
    if (!prepStatus(state.tray).ready) return;
    dispatch({ type: "FINISH_PREP" });
    setPeek(false);
    setLive("재료 준비 완료. 주문에 맞게 재료를 준비했어요.");
  }, [state.tray]);
  const startCook = useCallback(() => {
    dispatch({ type: "START_COOK" });
    setPeek(false);
    setLive("3단계 조리 순서예요. 트레이의 재료를 눌러 팬에 넣어요.");
  }, []);
  const addToWok = useCallback(
    (id: IngredientId) => {
      if (state.phase !== "cook" || !state.tray.includes(id) || state.wok.includes(id)) return;
      dispatch({ type: "ADD_TO_WOK", id });
      setLive(`${eulReul(ingredientName(id))} 팬에 ${state.wok.length + 1}번째로 넣었어요.`);
    },
    [state.phase, state.tray, state.wok],
  );
  const undoWok = useCallback(() => {
    if (state.phase !== "cook" || state.wok.length === 0) return;
    const last = state.wok[state.wok.length - 1];
    dispatch({ type: "UNDO_WOK" });
    setLive(`${eulReul(ingredientName(last))} 팬에서 뺐어요.`);
  }, [state.phase, state.wok]);
  const confirmCook = useCallback(() => {
    if (state.phase !== "cook" || state.wok.length !== state.tray.length) return;
    dispatch({ type: "CONFIRM_COOK_ORDER" });
    setPeek(false);
    setLive("순서를 정했어요. 4단계 불 조절이에요. 불 세기를 골라요.");
  }, [state.phase, state.wok, state.tray]);
  const setHeat = useCallback(
    (level: HeatLevel) => {
      if (state.phase !== "heat") return;
      dispatch({ type: "SET_HEAT", level });
      setLive(`${eulReul(heatLabel(level))} 골랐어요.`);
    },
    [state.phase],
  );
  const confirmHeat = useCallback(() => {
    if (state.phase !== "heat" || state.heat === null) return;
    dispatch({ type: "CONFIRM_HEAT" });
    setPeek(false);
    setLive("다 볶았어요. 5단계예요. 볶음밥을 접시에 담아요.");
  }, [state.phase, state.heat]);
  const redoCook = useCallback(() => {
    dispatch({ type: "REDO_COOK" });
    setLive("조리 순서를 다시 정해요. 팬이 비었어요.");
  }, []);
  const redoHeat = useCallback(() => {
    dispatch({ type: "REDO_HEAT" });
    setLive("불 세기를 다시 골라요.");
  }, []);
  const plateIt = useCallback(() => {
    if (state.phase !== "plate" || state.plated) return;
    dispatch({ type: "PLATE" });
    setLive("볶음밥을 접시에 담았어요. 전달 벨을 눌러요.");
  }, [state.phase, state.plated]);
  const serve = useCallback(() => {
    if (state.phase !== "plate" || !state.plated) return;
    dispatch({ type: "SERVE" });
    setPeek(false);
    setLive("손님께 전달했어요. 한 접시 완성.");
  }, [state.phase, state.plated]);
  const peekOrder = useCallback(() => {
    // 주문표를 다시 열 때만 "요청 다시 보기"로 센다(닫을 때는 세지 않는다)
    if (!peek) dispatch({ type: "REVIEW_REQUEST" });
    setPeek(!peek);
  }, [peek]);

  // 다시 보기 카드는 캔버스 "맨 위" 얇은 띠로만 보여 준다(재료·트레이·핀이 있는 아래쪽을 덮지 않는다).
  const peekOverlay =
    peek && ["prep", "cook", "heat", "plate"].includes(state.phase) ? (
      <div
        className="absolute inset-x-2 top-2 z-20 flex items-stretch gap-2 rounded-xl border-2 border-slate-600 bg-[#fffaf0] p-1.5 shadow-md"
        data-testid="order-peek"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-gray-900">
            주문표 · {ORDER.menu} <span className="text-red-700">{ORDER.quantity}개</span>
          </p>
          <p className="mt-0.5 rounded-md border border-green-700 bg-green-100 px-2 py-0.5 text-sm font-extrabold text-gray-900">
            요청 · {ORDER.request}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPeek(false)}
          aria-label="주문표 닫기"
          className="min-h-[44px] shrink-0 rounded-lg bg-slate-700 px-3 text-sm font-semibold text-white"
        >
          닫기
        </button>
      </div>
    ) : null;

  return (
    <main
      className={[
        "mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-4 pt-6",
        // 모바일 하단 진행 바 높이만큼 아래 여백(안전 영역 포함) — 콘텐츠·대체 입력이 바에 가려지지 않게. 데스크톱은 기존 여백
        state.phase === "served" ? "pb-6" : "pb-[calc(10rem+env(safe-area-inset-bottom))] md:pb-6",
      ].join(" ")}
    >
      <header>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-900">요리사 체험 — 볶음밥 주문</h1>
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-800">
            시범
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          손님의 주문을 확인하고, 재료 준비부터 전달까지 해 봐요.{" "}
          <a href="/xr/chef?scenario=classic" className="underline">
            기존 체험으로 가기
          </a>
        </p>
      </header>

      <StepBar state={state} />
      <SpeechBubble bubble={bubble} />

      {/* 씬은 조건부 언마운트하지 않는다 — Canvas 1회 마운트, props로만 연출을 바꾼다 */}
      <FriedRiceScene
        state={state}
        interactive={useScene}
        onOpenOrder={openOrder}
        onCheckRequest={checkRequest}
        onReviewRequest={reviewRequest}
        onAddIngredient={addIngredient}
        onRemoveIngredient={removeIngredient}
        onPeekOrder={peekOrder}
        onAddToWok={addToWok}
        onSetHeat={setHeat}
        onPlate={plateIt}
        onServe={serve}
        onSceneError={() => setSceneUnavailable(true)}
        onDraggingChange={handleDraggingChange}
        overlay={peekOverlay}
      />
      <p className="sr-only" aria-live="polite" data-testid="fried-rice-live">
        {live}
      </p>

      {state.phase === "order" && (
        <section className="flex flex-col gap-3" aria-label="1단계 주문 확인">
          <h2 className="text-base font-semibold text-gray-900">1단계 · 주문 확인</h2>
          {useScene ? (
            <p className="text-sm text-gray-700" data-testid="order-hint">
              {state.order === "closed"
                ? "‘누르기’ 표시가 있는 주문표를 눌러 열어 보세요."
                : state.order === "opened"
                  ? "노란 요청 메모를 눌러 손님의 요청을 확인해요."
                  : "요청을 확인했어요. 메모를 다시 누르면 요청을 다시 볼 수 있어요."}
            </p>
          ) : (
            <OrderSlip
              state={state}
              onOpen={state.order === "closed" ? openOrder : undefined}
              onCheck={state.order === "opened" ? checkRequest : undefined}
              onReview={state.order === "requestChecked" ? reviewRequest : undefined}
            />
          )}
          <FriedRiceProgressBar
            label="재료 준비하러 가기"
            onClick={progress(startPrep)}
            disabled={state.order !== "requestChecked"}
            reason={state.order === "closed" ? "주문표를 열어 주세요 · 0/2" : "요청 메모를 확인해 주세요 · 1/2"}
            readyText="주문을 확인했어요 · 2/2"
            busy={barBusy}
          />
          {state.order !== "requestChecked" && (
            <p className="hidden text-center text-xs text-gray-600 md:block">
              주문표와 요청 메모를 모두 확인하면 다음 단계로 갈 수 있어요.
            </p>
          )}
          {webglOk && !sceneUnavailable && (
            <button
              type="button"
              onClick={() => setUiMode((previous) => (previous === "scene" ? "html" : "scene"))}
              className="self-start text-xs text-gray-600 underline"
            >
              {useScene ? "글로 진행하기" : "화면으로 진행하기"}
            </button>
          )}
        </section>
      )}

      {state.phase === "prep" && (
        <section className="flex flex-col gap-3" aria-label="2단계 재료 준비">
          <h2 className="text-base font-semibold text-gray-900">2단계 · 재료 준비</h2>
          {useScene && (
            <p className="text-sm text-gray-700">
              ‘끌기’ 표시가 있는 재료를 끌어 ‘놓는 곳’(준비 트레이)에 놓아요. 트레이의 재료를 누르면 선반으로 돌아가요.
            </p>
          )}

          <div
            className={[
              "rounded-xl border-2 px-3.5 py-2.5 text-sm font-medium",
              guidance.tone === "warn"
                ? "border-red-700 bg-red-50 text-red-900"
                : guidance.tone === "ready"
                  ? "border-teal-700 bg-teal-50 text-teal-900"
                  : "border-gray-300 bg-gray-50 text-gray-800",
            ].join(" ")}
            data-testid="prep-guidance"
            data-tone={guidance.tone}
          >
            {guidance.tone === "warn" && <span aria-hidden="true">⚠ </span>}
            {guidance.text}
          </div>

          <div className="rounded-xl border border-gray-200 p-3" data-testid="prep-status">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900">
                준비 현황 {status.have.length}/{3}
              </p>
              <button
                type="button"
                onClick={peekOrder}
                aria-expanded={peek}
                className="min-h-[40px] rounded-lg border border-orange-700 px-3 text-sm font-semibold text-orange-800"
              >
                {peek ? "주문표 닫기" : "주문표 다시 보기"}
              </button>
            </div>
            <ul className="mt-2 divide-y divide-gray-100">
              {INGREDIENTS.map((item) => {
                const onTray = state.tray.includes(item.id);
                const label = item.required
                  ? onTray
                    ? "트레이에 있어요"
                    : "아직이에요"
                  : onTray
                    ? "트레이에 있어요 · 빼야 해요"
                    : "제외 (양파 빼기)";
                const bad = !item.required && onTray;
                const good = item.required ? onTray : !onTray;
                return (
                  <li
                    key={item.id}
                    className="flex min-h-[48px] items-center justify-between gap-2 py-1"
                    data-ingredient={item.id}
                    data-on-tray={onTray}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                      <p
                        className={[
                          "text-xs",
                          bad ? "font-bold text-red-800" : good ? "text-teal-800" : "text-gray-600",
                        ].join(" ")}
                      >
                        <span aria-hidden="true">{bad ? "✕ " : good ? "✓ " : "○ "}</span>
                        {label}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => (onTray ? removeIngredient(item.id) : addIngredient(item.id))}
                      aria-label={`${item.name} ${onTray ? "선반으로 되돌리기" : "트레이에 올리기"}`}
                      className="min-h-[44px] shrink-0 rounded-lg border border-gray-400 bg-white px-3 text-sm font-semibold text-gray-800"
                    >
                      {onTray ? "되돌리기" : "올리기"}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-1 text-[11px] text-gray-600">끌기가 어려우면 ‘올리기’ 버튼으로도 옮길 수 있어요.</p>
          </div>

          <FriedRiceProgressBar
            label="재료 준비 완료"
            onClick={progress(finishPrep)}
            disabled={!status.ready}
            reason={
              status.hasOnion
                ? `양파는 빼야 해요 · 재료 ${status.have.length}/3`
                : `필요한 재료를 준비해 주세요 · ${status.have.length}/3`
            }
            readyText="필요한 재료가 모두 준비됐어요 · 3/3"
            busy={barBusy}
          />
          {webglOk && !sceneUnavailable && (
            <button
              type="button"
              onClick={() => setUiMode((previous) => (previous === "scene" ? "html" : "scene"))}
              className="self-start text-xs text-gray-600 underline"
            >
              {useScene ? "글로 진행하기" : "화면으로 진행하기"}
            </button>
          )}
        </section>
      )}

      {state.phase === "cook" && (
        <section className="flex flex-col gap-3" aria-label="3단계 조리 순서">
          <h2 className="text-base font-semibold text-gray-900">3단계 · 조리 순서</h2>
          {useScene && (
            <p className="text-sm text-gray-700">
              ‘누르기’ 표시가 있는 재료를 눌러 팬에 넣어요. 넣은 순서가 팬 위에 1·2·3으로 보여요.
            </p>
          )}
          <div
            className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800"
            data-testid="cook-note"
          >
            {state.wok.length === 0
              ? "아직 팬에 넣은 재료가 없어요. 어떤 순서가 좋을지는 직접 정해 보세요."
              : state.wok.length === state.tray.length
                ? cookOrderSummary(state.wok)
                : cookOrderNote(state.wok)}
          </div>
          <div className="rounded-xl border border-gray-200 p-3" data-testid="cook-status">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900">
                넣은 순서 {state.wok.length}/{state.tray.length}
              </p>
              <button
                type="button"
                onClick={peekOrder}
                aria-expanded={peek}
                className="min-h-[40px] rounded-lg border border-orange-700 px-3 text-sm font-semibold text-orange-800"
              >
                {peek ? "주문표 닫기" : "주문표 다시 보기"}
              </button>
            </div>
            <ol className="mt-2 flex flex-wrap gap-1.5" aria-label="팬에 넣은 순서">
              {state.wok.map((id, index) => (
                <li key={id} className="rounded-full bg-teal-50 px-2.5 py-1 text-sm font-bold text-teal-900">
                  {index + 1}. {ingredientName(id)}
                </li>
              ))}
              {state.wok.length === 0 && <li className="text-xs text-gray-600">비어 있어요</li>}
            </ol>
            <ul className="mt-2 divide-y divide-gray-100">
              {trayRemaining(state).map((id) => (
                <li key={id} className="flex min-h-[48px] items-center justify-between gap-2 py-1" data-tray-item={id}>
                  <p className="text-sm font-semibold text-gray-900">{ingredientName(id)}</p>
                  <button
                    type="button"
                    onClick={() => addToWok(id)}
                    aria-label={`${ingredientName(id)} 팬에 넣기`}
                    className="min-h-[44px] shrink-0 rounded-lg border border-gray-400 bg-white px-3 text-sm font-semibold text-gray-800"
                  >
                    팬에 넣기
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-[11px] text-gray-600">
              재료를 누르기 어려우면 ‘팬에 넣기’ 버튼으로도 넣을 수 있어요.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={undoWok}
              disabled={state.wok.length === 0}
              className="min-h-[48px] flex-1 rounded-xl border border-gray-400 bg-white px-3 text-sm font-semibold text-gray-800 disabled:border-gray-300 disabled:text-gray-500"
            >
              마지막 재료 빼기
            </button>
            <FriedRiceProgressBar
              label="이 순서로 정하기"
              onClick={progress(confirmCook)}
              disabled={state.wok.length !== state.tray.length}
              reason={`재료를 모두 팬에 넣어 주세요 · ${state.wok.length}/${state.tray.length}`}
              readyText={`순서를 모두 정했어요 · ${state.wok.length}/${state.tray.length}`}
              busy={barBusy}
              compact
              className="md:flex-[1.4]"
            />
          </div>
        </section>
      )}

      {state.phase === "heat" && (
        <section className="flex flex-col gap-3" aria-label="4단계 불 조절">
          <h2 className="text-base font-semibold text-gray-900">4단계 · 불 조절</h2>
          {useScene && (
            <p className="text-sm text-gray-700">
              ‘누르기’ 표시가 있는 손잡이를 눌러 불 세기를 골라요. 어떤 불이든 다음 단계로 갈 수 있어요.
            </p>
          )}
          <div
            className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800"
            data-testid="heat-note"
          >
            {state.heat === null
              ? "불 세기에 따라 볶이는 모습이 달라져요. 골라 보면 설명이 나와요."
              : heatNote(state.heat, state.wok)}
          </div>
          <div role="radiogroup" aria-label="불 세기" className="grid grid-cols-3 gap-2" data-testid="heat-options">
            {HEAT_LEVELS.map((option, index) => {
              const selected = state.heat === option.id;
              // 라디오 그룹 키보드 규칙: Tab은 그룹에 한 번만 멈추고(선택된 항목, 없으면 첫 항목), 화살표로 옮기며 선택한다
              const tabStop = state.heat === null ? index === 0 : selected;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={tabStop ? 0 : -1}
                  onKeyDown={(event) => {
                    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
                    const backward = event.key === "ArrowLeft" || event.key === "ArrowUp";
                    if (!forward && !backward) return;
                    event.preventDefault();
                    const nextIndex = (index + (forward ? 1 : -1) + HEAT_LEVELS.length) % HEAT_LEVELS.length;
                    setHeat(HEAT_LEVELS[nextIndex].id);
                    const group = event.currentTarget.parentElement;
                    group?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[nextIndex]?.focus();
                  }}
                  onClick={() => setHeat(option.id)}
                  className={[
                    "flex min-h-[64px] flex-col items-center justify-center rounded-xl border-2 px-2 py-1.5 text-center",
                    selected ? "border-orange-700 bg-orange-50 text-orange-900" : "border-gray-300 bg-white text-gray-800",
                  ].join(" ")}
                >
                  <span className="text-base font-bold">
                    {selected && <span aria-hidden="true">✓ </span>}
                    {option.label}
                  </span>
                  <span className="text-[11px] text-gray-600">{option.hint}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-600" data-testid="heat-order-recap">
            {state.wok.length > 0 && `팬에 넣은 순서: ${state.wok.map(ingredientName).join(" → ")}`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={peekOrder}
              aria-expanded={peek}
              className="min-h-[48px] flex-1 rounded-xl border border-orange-700 bg-white px-3 text-sm font-semibold text-orange-800"
            >
              {peek ? "주문표 닫기" : "주문표 다시 보기"}
            </button>
            <button
              type="button"
              onClick={redoCook}
              className="min-h-[48px] flex-1 rounded-xl border border-gray-400 bg-white px-3 text-sm font-semibold text-gray-800"
            >
              순서 다시 정하기
            </button>
          </div>
          <FriedRiceProgressBar
            label="이 불로 볶기"
            onClick={progress(confirmHeat)}
            disabled={state.heat === null}
            reason="불 세기를 골라 주세요"
            readyText={state.heat ? `${eulReul(heatLabel(state.heat))} 골랐어요` : undefined}
            busy={barBusy}
          />
        </section>
      )}

      {state.phase === "plate" && (
        <section className="flex flex-col gap-3" aria-label="5단계 플레이팅·전달">
          <h2 className="text-base font-semibold text-gray-900">5단계 · 플레이팅·전달</h2>
          {useScene && (
            <p className="text-sm text-gray-700">
              {state.plated
                ? "‘누르기’ 표시가 있는 전달 벨을 눌러 손님께 내어 드려요."
                : "‘끌기’ 표시가 있는 볶음밥을 끌어서 ‘놓는 곳’(접시)에 놓아요."}
            </p>
          )}
          <p
            className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800"
            data-testid="plate-note"
          >
            {outcomeSummary(state.wok, state.heat)}
            {state.heat && ` ${heatNote(state.heat, state.wok)}`}
          </p>
          {!state.plated && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={peekOrder}
                aria-expanded={peek}
                className="min-h-[48px] flex-1 rounded-xl border border-orange-700 bg-white px-3 text-sm font-semibold text-orange-800"
              >
                {peek ? "주문표 닫기" : "주문표 다시 보기"}
              </button>
              <button
                type="button"
                onClick={redoHeat}
                className="min-h-[48px] flex-1 rounded-xl border border-gray-400 bg-white px-3 text-sm font-semibold text-gray-800"
              >
                불 세기 다시 고르기
              </button>
            </div>
          )}
          {!state.plated ? (
            <FriedRiceProgressBar
              label="볶음밥 접시에 담기"
              onClick={progress(plateIt)}
              variant="outline"
              busy={barBusy}
            />
          ) : (
            <FriedRiceProgressBar label="손님에게 전달하기" onClick={progress(serve)} busy={barBusy} />
          )}
          <p className="text-[11px] text-gray-600">
            {state.plated
              ? "벨을 누르기 어려우면 위 버튼으로도 전달할 수 있어요."
              : "끌기가 어려우면 ‘볶음밥 접시에 담기’ 버튼으로도 담을 수 있어요."}
          </p>
        </section>
      )}

      {state.phase === "served" && (
        <section className="flex flex-col gap-4" aria-label="전달 결과">
          <div className="rounded-xl bg-teal-50 p-4">
            <h2 className="text-lg font-bold text-teal-900" data-testid="fried-rice-served-title">
              {FRIED_RICE_SERVED.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-teal-900">{FRIED_RICE_SERVED.body}</p>
            <p className="mt-2 text-sm leading-relaxed text-teal-900" data-testid="served-outcome">
              {outcomeSummary(state.wok, state.heat)}
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="만든 과정">
              <li className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-teal-900">✓ 주문 확인</li>
              <li className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-teal-900">✓ 재료 준비</li>
              <li className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-teal-900">✓ 조리 순서</li>
              <li className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-teal-900">
                ✓ 불 조절{state.heat ? ` (${heatLabel(state.heat)})` : ""}
              </li>
              <li className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-teal-900">✓ 플레이팅·전달</li>
              <li className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-gray-700">양파 제외</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => {
              dispatch({ type: "RESET" });
              setPeek(false);
              setLive("처음부터 다시 시작해요.");
            }}
            className="min-h-[52px] w-full rounded-xl border border-orange-700 bg-white px-4 text-base font-semibold text-orange-800"
          >
            처음부터 다시 해보기
          </button>
        </section>
      )}

      {state.phase === "done" && (
        <section className="flex flex-col gap-4" aria-label="재료 준비 결과">
          <div className="rounded-xl bg-teal-50 p-4">
            <h2 className="text-lg font-bold text-teal-900" data-testid="fried-rice-done-title">
              {FRIED_RICE_DONE.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-teal-900">{FRIED_RICE_DONE.body}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="준비한 재료">
              {state.tray.map((id) => (
                <li key={id} className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-teal-900">
                  ✓ {ingredientName(id)}
                </li>
              ))}
              <li className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-gray-700">
                양파 제외
              </li>
            </ul>
          </div>
          <p className="text-sm leading-relaxed text-gray-700">{FRIED_RICE_DONE.next}</p>
          <FriedRiceProgressBar label="조리 순서 정하기" onClick={progress(startCook)} busy={barBusy} />
          <button
            type="button"
            onClick={() => {
              dispatch({ type: "RESET" });
              setPeek(false);
              setLive("처음부터 다시 시작해요.");
            }}
            className="min-h-[48px] w-full rounded-xl border border-orange-700 bg-white px-4 text-base font-semibold text-orange-800"
          >
            처음부터 다시 해보기
          </button>
        </section>
      )}
    </main>
  );
}
