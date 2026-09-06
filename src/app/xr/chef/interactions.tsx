"use client";

// ====================================================
// XR 요리사 상호작용 컴포넌트 — G2.1 필수 행동 3종
//
// select / place / order 모두 최종적으로는 동일하게 하나의 Choice를
// 골라 상위(XrChefClient)의 handleChoice(choice)를 호출한다 — 상호작용
// 방식만 다를 뿐 이벤트 계측 계약(choice_point/choice_id/axis_tag/
// scenario_version)은 절대 바뀌지 않는다.
//
// - select: 기존 v0.2 버튼 선택 그대로 (문구·클래스 변경 없음)
// - place: 재료 카드를 탭(또는 드래그)으로 집고, 작업대를 탭해 배치한다
//   (모든 카드가 유효한 배치 대상이라 "잘못된 배치" 자체가 없다 —
//   선택지는 정답/오답이 아니라 행동 방식의 차이라는 3.3 원칙과 일치)
// - order: 카드를 "맨 앞으로" 이동시켜 우선순위를 정하고 확정한다.
//   맨 앞 카드의 축이 최종 선택으로 기록된다.
//
// 5.2 규칙(5초 이상 정지 시 힌트)은 useIdleHint로 공통 처리한다.
// ====================================================

import { useEffect, useRef, useState } from "react";
import type { Choice } from "./scenario";

const IDLE_HINT_DELAY_MS = 5000;

/** resetKey(보통 지점의 choice id 목록)가 바뀌면 타이머를 재시작한다. */
export function useIdleHint(resetKey: string) {
  const [hintVisible, setHintVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHintVisible(false);
    timerRef.current = setTimeout(() => setHintVisible(true), IDLE_HINT_DELAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetKey]);

  const markActivity = () => {
    setHintVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setHintVisible(true), IDLE_HINT_DELAY_MS);
  };

  return { hintVisible, markActivity };
}

function HintText({ visible, message }: { visible: boolean; message: string }) {
  if (!visible) return null;
  return <p className="text-xs leading-relaxed text-gray-500">{message}</p>;
}

const choiceKey = (choices: Choice[]) => choices.map((c) => c.id).join("|");

// ---------- select: 탭/클릭 선택 ----------

export function SelectChoices({
  choices,
  onSelect,
}: {
  choices: Choice[];
  onSelect: (choice: Choice) => void;
}) {
  const { hintVisible, markActivity } = useIdleHint(choiceKey(choices));

  return (
    <div className="flex flex-col gap-3">
      {choices.map((choice) => (
        <button
          key={choice.id}
          type="button"
          onClick={() => {
            markActivity();
            onSelect(choice);
          }}
          className="min-h-[52px] w-full rounded-xl bg-orange-500 px-4 text-base font-semibold text-white transition-colors active:bg-orange-600"
        >
          {choice.label}
        </button>
      ))}
      <HintText visible={hintVisible} message="마음에 드는 선택지를 눌러보세요." />
    </div>
  );
}

// ---------- place: 드래그·배치 ----------

const DROPZONE_LABEL = "작업대에 놓기";

export function PlaceInteraction({
  choices,
  onPlace,
}: {
  choices: Choice[];
  onPlace: (choice: Choice) => void;
}) {
  const [armedId, setArmedId] = useState<string | null>(null);
  const { hintVisible, markActivity } = useIdleHint(choiceKey(choices));

  const finalize = (id: string | null) => {
    if (!id) return;
    const choice = choices.find((c) => c.id === id);
    if (!choice) return;
    onPlace(choice);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium text-gray-500">
        재료를 눌러 고른 뒤, 작업대를 눌러 옮겨보세요. (직접 끌어다 놓아도 돼요)
      </p>
      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("text/plain", choice.id);
              markActivity();
            }}
            onClick={() => {
              markActivity();
              setArmedId(choice.id);
            }}
            aria-pressed={armedId === choice.id}
            className={`min-h-[52px] flex-1 rounded-xl border-2 px-3 text-sm font-semibold transition-colors ${
              armedId === choice.id
                ? "border-orange-500 bg-orange-100 text-orange-700"
                : "border-orange-200 bg-white text-gray-800"
            }`}
          >
            {choice.label}
          </button>
        ))}
      </div>
      <div
        role="button"
        tabIndex={0}
        aria-label={DROPZONE_LABEL}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          markActivity();
          finalize(event.dataTransfer.getData("text/plain"));
        }}
        onClick={() => {
          markActivity();
          finalize(armedId);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            markActivity();
            finalize(armedId);
          }
        }}
        className="flex min-h-[64px] w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 px-4 text-center text-sm font-semibold text-orange-600"
      >
        {DROPZONE_LABEL}
      </div>
      <HintText visible={hintVisible} message="재료 카드를 먼저 눌러보세요." />
    </div>
  );
}

// ---------- order: 순서 정하기 ----------

export function OrderInteraction({
  choices,
  onConfirm,
}: {
  choices: Choice[];
  onConfirm: (choice: Choice) => void;
}) {
  const [order, setOrder] = useState<string[]>(() => choices.map((c) => c.id));
  const { hintVisible, markActivity } = useIdleHint(choiceKey(choices));

  const moveToFront = (id: string) => {
    markActivity();
    setOrder((prev) => [id, ...prev.filter((existing) => existing !== id)]);
  };

  const orderedChoices = order
    .map((id) => choices.find((c) => c.id === id))
    .filter((choice): choice is Choice => Boolean(choice));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium text-gray-500">
        가장 먼저 할 일을 맨 앞으로 옮기고, 이 순서로 진행해보세요.
      </p>
      <ol className="flex flex-col gap-2">
        {orderedChoices.map((choice, index) => (
          <li
            key={choice.id}
            className="flex items-center justify-between gap-3 rounded-xl border-2 border-orange-200 bg-white px-3 py-2"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                {index + 1}
              </span>
              {choice.label}
            </span>
            {index !== 0 && (
              <button
                type="button"
                onClick={() => moveToFront(choice.id)}
                className="shrink-0 rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-700"
              >
                맨 앞으로
              </button>
            )}
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => {
          const first = orderedChoices[0];
          if (first) onConfirm(first);
        }}
        className="min-h-[52px] w-full rounded-xl bg-orange-500 px-4 text-base font-semibold text-white transition-colors active:bg-orange-600"
      >
        이 순서로 진행하기
      </button>
      <HintText visible={hintVisible} message="카드의 '맨 앞으로' 버튼을 눌러 순서를 바꿔보세요." />
    </div>
  );
}
