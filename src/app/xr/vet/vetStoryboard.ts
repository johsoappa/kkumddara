// ====================================================
// vetStoryboard.ts — 수의사 XR 서사·연출 데이터 (G2.2-R3-B, 신규)
//
// scenario.ts(순수 데이터, choice ID·axis·집계 로직의 원천)를 read-only로
// import만 한다 — 이 파일은 scenario.ts를 수정하지 않고, "장면 연출에만
// 필요한" 부가 데이터를 담는다:
//   - choice별 sceneTarget/actionCard 분류("구체적인 장면 대상이 없는
//     추상 행동은 HTML 선택 카드로 선택하게 합니다" — sceneLayout.ts의
//     SCENE_TARGETS와 반드시 일치해야 하고, vetStoryboard.test.ts가 둘을
//     대조 검증한다)
//   - choice별 선택 후 피드백 문구(reaction 화면에 scenario.ts의 점별
//     공통 reaction과 별도로 노출 — "선택했더니 실제로 뭔가 남는다"는
//     느낌을 준다)
//   - mode·point별 결과 타임라인 카테고리 라벨
//   - mode·phase·point(+직전 선택 kind)별 인물·강아지 포즈 델타(선언형)
//
// React/Three.js 인스턴스에는 의존하지 않는다(순수 데이터 + 순수 함수) —
// scenario.ts/sceneLayout.ts와 동일한 설계 원칙을 따른다.
// ====================================================

import { CHOICE_POINTS, SPROUT_POINTS, type Choice, type Mode } from "./scenario";
import {
  SCENE_TARGETS,
  resolveActionCardChoices,
  sceneInteractionId,
  type ChoiceClassification,
  type NamedTargetKind,
  type Vec3,
} from "./sceneLayout";

export const DOG_NAME = "콩이";

// ---------- choice별 sceneTarget/actionCard 분류 ----------
// sceneLayout.ts의 SCENE_TARGETS에 항목이 있으면 sceneTarget, 없으면
// actionCard다 — 이 표는 그 사실을 "선언"하지 않고 SCENE_TARGETS로부터
// 파생시킨다(두 파일이 서로 다른 답을 낼 수 없도록 단일 진실 공급원을
// sceneLayout.ts에 둔다). vetStoryboard.test.ts가 이 파생 결과를 검증한다.

export function classifyChoice(id: string, choiceId: string): ChoiceClassification {
  const targets = SCENE_TARGETS[id] ?? [];
  return targets.some((t) => t.choiceId === choiceId) ? "sceneTarget" : "actionCard";
}

export function targetKindForChoice(id: string, choiceId: string): NamedTargetKind | null {
  const targets = SCENE_TARGETS[id] ?? [];
  return targets.find((t) => t.choiceId === choiceId)?.kind ?? null;
}

// ---------- choice별 선택 후 피드백 문구 ----------
// scenario.ts의 point.reaction(선배 수의사 발화, 점 공통)과는 별개로,
// 실제로 "무엇을 했는지" 알려주는 관찰 노트 성격의 한 줄. choice.label이
// 바뀌어도 이 문구는 축(axis)의 의미와 무관하므로 별도로 관리한다.

export const CHOICE_FEEDBACK: Record<string, string> = {
  p1_a: `${DOG_NAME}의 움직임과 자세를 살피면 평소와 다른 점을 먼저 찾을 수 있어요.`,
  p1_b: `확인할 순서를 먼저 생각해두면 ${DOG_NAME}가 덜 불안해할 수 있어요.`,
  p1_c: `보호자 이야기와 ${DOG_NAME} 모습을 함께 보면 놓치는 부분이 줄어들어요.`,

  p2_a: "모르는 점은 선배와 함께 확인할 수 있어요.",
  p2_b: "시간 순서대로 기록하면 언제부터 달라졌는지 한눈에 보여요.",
  p2_c: "그림과 표시로 남기면 나중에도 빠르게 알아볼 수 있어요.",

  p3_a: "전체 상황을 먼저 보면 무엇을 먼저 처리할지 판단하기 쉬워요.",
  p3_b: "두 상황을 나란히 비교하면 급한 순서를 정하기 좋아요.",
  p3_c: "역할을 나누면 두 보호자 모두 기다리는 시간이 줄어들어요.",

  p4_a: "확인한 내용을 바로 정리하면 다음 설명이 더 수월해져요.",
  p4_b: "표시카드로 정리하면 중요한 부분이 한눈에 들어와요.",
  p4_c: `${DOG_NAME} 상태와 기록을 함께 다시 보면 빠뜨린 게 없는지 확인할 수 있어요.`,

  p5_a: "정리한 기록을 다시 확인하면 설명할 때 헷갈리지 않아요.",
  p5_b: "설명 순서를 미리 정리하면 보호자가 더 이해하기 쉬워요.",
  p5_c: "선배에게 확인받으면 안내 내용에 더 확신이 생겨요.",

  s1_a: "보호자의 말에서 변화가 시작된 때를 알 수 있어요.",
  s1_b: "움직임과 자세를 살피면 평소와 다른 점을 찾을 수 있어요.",

  s2_a: "모르는 점은 선배와 함께 확인할 수 있어요.",
  s2_b: "기록하면 다음 확인에서도 같은 정보를 살펴볼 수 있어요.",

  s3_a: "익숙한 방식으로도 충분히 안내할 수 있어요.",
  s3_b: "그림으로 보여주면 다음 순서를 더 쉽게 이해할 수 있어요.",
};

// ---------- 결과 타임라인 — point별 행동 카테고리 라벨 ----------

export const COMPASS_POINT_CATEGORY: Record<number, string> = {
  1: "관찰",
  2: "듣기·기록",
  3: "상황 비교",
  4: "기록 정리",
  5: "보호자 안내",
};

export const SPROUT_POINT_CATEGORY: Record<number, string> = {
  1: "듣기·살피기",
  2: "기록·협업",
  3: "보호자 안내",
};

export function pointCategory(mode: Mode, point: number): string {
  const table = mode === "compass" ? COMPASS_POINT_CATEGORY : SPROUT_POINT_CATEGORY;
  return table[point] ?? `${point}단계`;
}

// ---------- 인물·강아지 포즈(선언형, mode+point+phase 기반) ----------
//
// "본체 색이나 발밑 링만 바뀌는 화면은 완료로 인정하지 않습니다" — 각
// point는 이전 point와 비교해 최소 2개 요소(인물 자세, 강아지 행동,
// 소품 상태, 등장 요소, 카메라 구도 중)가 달라야 한다. 이 표가 인물
// 자세·강아지 행동·등장 요소(대기 보호자) 3가지를 구조적으로 보장한다.
// 값은 라디안 델타(기존 VetScene.tsx의 base yaw에 더해진다).

export interface StagePose {
  guardianYawDelta: number;
  seniorYawDelta: number;
  dogYawDelta: number;
  dogHeadUp: boolean;
  waitingPairVisible: boolean;
}

const NEUTRAL_POSE: StagePose = {
  guardianYawDelta: 0,
  seniorYawDelta: 0,
  dogYawDelta: 0,
  dogHeadUp: false,
  waitingPairVisible: false,
};

/** intro — 보호자·콩이가 막 진료실에 들어온 방향(문 쪽을 향해 살짝 더 돈 자세),
 *  콩이는 평소보다 조용한 자세(고개 숙임). */
export const INTRO_POSE: StagePose = {
  ...NEUTRAL_POSE,
  guardianYawDelta: -0.3,
  dogYawDelta: -0.2,
};

/** result — 보호자·선배가 서로를 향해 살짝 돌아서는 상담 마무리 자세.
 *  콩이는 엎드린 안정 자세(dogSit은 VetScene.tsx가 phase==="result"로 직접 판정). */
export const RESULT_POSE: StagePose = {
  ...NEUTRAL_POSE,
  guardianYawDelta: 0.25,
  seniorYawDelta: -0.25,
};

export const COMPASS_POINT_POSE: Record<number, StagePose> = {
  1: { ...NEUTRAL_POSE, dogYawDelta: 0.15, dogHeadUp: true },
  2: { ...NEUTRAL_POSE, seniorYawDelta: 0.3 },
  3: { ...NEUTRAL_POSE, guardianYawDelta: 0.2, seniorYawDelta: 0.35, waitingPairVisible: true },
  4: { ...NEUTRAL_POSE },
  5: { ...NEUTRAL_POSE, guardianYawDelta: 0.25, seniorYawDelta: -0.2 },
};

export const SPROUT_POINT_POSE: Record<number, StagePose> = {
  1: { ...NEUTRAL_POSE, dogYawDelta: 0.15, dogHeadUp: true },
  2: { ...NEUTRAL_POSE, seniorYawDelta: 0.3 },
  3: { ...NEUTRAL_POSE, guardianYawDelta: 0.25, seniorYawDelta: -0.2 },
};

/** reaction 단계에서 "방금 고른 대상"에 얹는 추가 포즈(가산). 실제 물리
 *  오브젝트가 없는 actionCard 선택(targetKind===null)은 오버레이 없이
 *  point 기본 포즈만 유지한다. */
export const REACTION_KIND_OVERLAY: Partial<Record<NamedTargetKind, Partial<StagePose>>> = {
  dog: { dogYawDelta: 0.35, dogHeadUp: true },
  guardian: { guardianYawDelta: 0.4 },
  senior: { seniorYawDelta: 0.4 },
};

function addPose(base: StagePose, overlay: Partial<StagePose>): StagePose {
  return {
    guardianYawDelta: base.guardianYawDelta + (overlay.guardianYawDelta ?? 0),
    seniorYawDelta: base.seniorYawDelta + (overlay.seniorYawDelta ?? 0),
    dogYawDelta: base.dogYawDelta + (overlay.dogYawDelta ?? 0),
    dogHeadUp: base.dogHeadUp || !!overlay.dogHeadUp,
    waitingPairVisible: base.waitingPairVisible,
  };
}

export interface ResolvedStage {
  pose: StagePose;
  /** clipboard가 "방금 기록됨" 표시를 잠깐 보여줘야 하는가(reaction 단계 + 방금
   *  고른 대상이 기록판일 때만) — showChart(지점3 이후 상시 표시)와는 별개의
   *  일시적 신호다. */
  justRecorded: boolean;
  /** 강아지가 편안히 엎드린 자세(결과 화면 전용). */
  dogResting: boolean;
}

/**
 * mode + phase + point (+ reaction 단계에서는 방금 고른 choice의 targetKind)
 * 기반으로 이번에 보여줄 포즈/소품 상태를 계산하는 단일 진입점. VetScene.tsx가
 * 이 결과를 각 캐릭터 컴포넌트의 base yaw에 더해 적용한다.
 */
export function resolveStage(
  mode: Mode,
  phase: "intro" | "choosing" | "reaction" | "result",
  point: number,
  lastChoiceKind: NamedTargetKind | null,
): ResolvedStage {
  if (phase === "intro") {
    return { pose: INTRO_POSE, justRecorded: false, dogResting: false };
  }
  if (phase === "result") {
    return { pose: RESULT_POSE, justRecorded: false, dogResting: true };
  }
  const table = mode === "compass" ? COMPASS_POINT_POSE : SPROUT_POINT_POSE;
  const base = table[point] ?? NEUTRAL_POSE;
  if (phase === "reaction" && lastChoiceKind) {
    const overlay = REACTION_KIND_OVERLAY[lastChoiceKind] ?? {};
    return {
      pose: addPose(base, overlay),
      justRecorded: lastChoiceKind === "clipboard",
      dogResting: false,
    };
  }
  return { pose: base, justRecorded: false, dogResting: false };
}

// ---------- HTML 선택 카드 아이콘 분류 표시(플랫폼 이모지 금지) ----------
// SceneTargetPins.tsx(핀)와 XrVetClient.tsx(버튼)가 동일한 원형/사각형
// SVG 배지를 공유한다 — 실제 그리기는 컴포넌트 쪽에서 하고, 이 파일은
// "이 choice가 sceneTarget인지 actionCard인지"만 제공한다(위 classifyChoice).

// ---------- 회귀 검증용 파생 유틸 ----------
// vetStoryboard.test.ts에서 scenario.ts의 모든 choice id를 순회하며
// CHOICE_FEEDBACK 존재 여부를 확인할 때 쓴다.

export function allChoices(): Choice[] {
  return [...CHOICE_POINTS.flatMap((p) => p.choices), ...SPROUT_POINTS.flatMap((p) => p.choices)];
}

export function allChoiceIdsForMode(mode: Mode): { pointId: string; choice: Choice }[] {
  const points = mode === "compass" ? CHOICE_POINTS : SPROUT_POINTS;
  return points.flatMap((p) => p.choices.map((choice) => ({ pointId: sceneInteractionId(mode, p.point), choice })));
}

/** history(ChoiceRecord — point+choiceId만 가진다)에서 실제 choice.label을
 *  되찾는다. 결과 타임라인이 "선택했던 문구 그대로"를 보여주기 위한
 *  순수 조회 함수 — scenario.ts를 읽기만 한다. */
export function choiceLabel(mode: Mode, point: number, choiceId: string): string {
  const points = mode === "compass" ? CHOICE_POINTS : SPROUT_POINTS;
  const pointData = points.find((p) => p.point === point);
  return pointData?.choices.find((c) => c.id === choiceId)?.label ?? "";
}

export function actionCardChoiceIds(mode: Mode): string[] {
  const points = mode === "compass" ? CHOICE_POINTS : SPROUT_POINTS;
  const ids: string[] = [];
  for (const p of points) {
    const id = sceneInteractionId(mode, p.point);
    ids.push(...resolveActionCardChoices(id, p.choices).map((c) => c.id));
  }
  return ids;
}

export type { Vec3 };
