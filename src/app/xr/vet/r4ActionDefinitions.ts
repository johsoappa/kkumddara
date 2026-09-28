// ====================================================
// r4ActionDefinitions.ts — 수의사 XR R4-B: choice ID별 직접 조작 정의 (순수 데이터)
//
// scenario.ts의 21개 choice ID·문구·axis는 절대 바꾸지 않는다 — 이 파일은
// "선택 후 어떤 직접 조작을 붙일지"만 choiceId로 매핑한다. React/Three.js
// 인스턴스에는 의존하지 않는다(순수 데이터).
//
// - s1_a/s1_b: G2.2-R4-A에서 승인된 동작을 그대로 유지한다 — 여기서는
//   R4ActionLayer가 기존 BubbleAction/ObserveAction으로 라우팅하도록
//   kind:"legacy"만 표시하고, 화면에 보여줄 copy는 r4Prototype.ts의
//   R4_ACTION_COPY를 그대로 가져다 쓴다(문구를 복제하지 않는다).
// - 나머지 19개(새싹2·3, 나침반1~5)는 이번 라운드에 추가한다.
//
// 좌표 규칙: r4ActionState.ts의 판정 함수(isNearTarget 등)는 X/Y만 비교하고
// Z는 무시한다 — 그래서 한 action 안의 모든 좌표는 같은 planeZ를 공유해도
// (드래그 평면 1개) 실제 기존 오브젝트 근처의 X/Y만 가져다 쓰면 된다.
// 같은 action 안에서 동시에 존재하는 목표(슬롯/타깃/경유점)는 서로
// 2*radius 이상 떨어뜨려 "목표 영역 중첩 없음"을 만족한다 —
// r4ActionDefinitions.test.ts가 이 간격을 전수 검증한다.
// ====================================================

import type { Vec3 } from "./sceneLayout";
import { R4_ACTION_COPY, TARGET_RADIUS } from "./r4Prototype";

export interface R4ActionCopy {
  title: string;
  instruction: string;
  doneAnnouncement: string;
  /** 단일 단계 조작(legacy/dragToTarget)의 대체 버튼 문구. */
  altLabel?: string;
  /** 여러 단계 조작의 대체 버튼 문구 — 순서(orderedPath/orderedSlots/reviewPath)거나
   *  자유 순서(multiSource/matchTarget)거나 상관없이 버튼 개수만큼 담는다. */
  altSteps?: string[];
}

export type R4ActionKind =
  | "legacy"
  | "dragToTarget"
  | "orderedPath"
  | "reviewPath"
  | "orderedSlots"
  | "multiSource"
  | "matchTarget";

export interface LegacyGeometry {
  kind: "legacy";
}

export interface DragToTargetGeometry {
  kind: "dragToTarget";
  home: Vec3;
  target: Vec3;
  radius: number;
}

export interface PathGeometry {
  kind: "orderedPath" | "reviewPath";
  home: Vec3;
  waypoints: Vec3[];
  radius: number;
  /** 콩이가 진행 중에도 반응해야 하는 action(p1_a/p4_c) — VetScene의 observeStep과 같은 방식으로 반응한다. */
  driveDogObserve?: boolean;
}

export interface OrderedSlotsGeometry {
  kind: "orderedSlots";
  /** 인덱스 = 정답 슬롯 번호(0부터) — 카드는 반드시 이 순서로만 놓을 수 있다. */
  tokens: { home: Vec3 }[];
  slots: Vec3[];
  radius: number;
}

export interface MultiSourceGeometry {
  kind: "multiSource";
  sources: { home: Vec3 }[];
  target: Vec3;
  radius: number;
}

export interface MatchTargetGeometry {
  kind: "matchTarget";
  /** targetIndex = 이 토큰이 놓여야 하는 targets 배열의 인덱스. */
  tokens: { home: Vec3; targetIndex: number }[];
  targets: Vec3[];
  radius: number;
}

export type R4ActionGeometry =
  | LegacyGeometry
  | DragToTargetGeometry
  | PathGeometry
  | OrderedSlotsGeometry
  | MultiSourceGeometry
  | MatchTargetGeometry;

export interface R4ActionDefinition {
  id: string;
  copy: R4ActionCopy;
  geometry: R4ActionGeometry;
}

// 3~4개 목표가 한 action 안에 동시에 존재할 때 쓰는 표준 가로 배치 —
// 중심 x에서 좌우로 0.75 간격(반경 0.3 기준 2*0.3=0.6보다 넉넉하게 크다).
function rowX(count: 2 | 3, centerX: number): number[] {
  if (count === 2) return [centerX - 0.375, centerX + 0.375];
  return [centerX - 0.75, centerX, centerX + 0.75];
}

const R4_ACTION_DEFINITIONS_TYPED = {
  // ---------- 새싹 1단계 — 승인된 동작 유지(R4-A) ----------
  s1_a: { id: "s1_a", copy: R4_ACTION_COPY.s1_a, geometry: { kind: "legacy" } } satisfies R4ActionDefinition,
  s1_b: { id: "s1_b", copy: R4_ACTION_COPY.s1_b, geometry: { kind: "legacy" } } satisfies R4ActionDefinition,

  // ---------- 새싹 2단계 ----------
  s2_a: {
    id: "s2_a",
    copy: {
      title: "선배 수의사에게 함께 봐 달라고 요청해요",
      instruction: "‘함께 보기’ 요청 카드를 선배 수의사 옆 확인 영역으로 끌어놓아 보세요.",
      altLabel: "선배 수의사에게 함께 봐 달라고 요청하기",
      doneAnnouncement: "선배 수의사가 콩이 쪽으로 몸을 돌려 함께 살펴봐요.",
    },
    geometry: { kind: "dragToTarget", home: [-0.1, 1.35, -0.85], target: [0.75, 1.05, -0.85], radius: TARGET_RADIUS },
  } satisfies R4ActionDefinition,
  s2_b: {
    id: "s2_b",
    copy: {
      title: "관찰한 변화를 순서대로 기록해요",
      instruction: "관찰 카드 두 장을 기록판의 1번 줄, 2번 줄에 순서대로 놓아보세요.",
      altSteps: ["첫 번째 관찰 카드를 기록판 1번 줄에 놓기", "두 번째 관찰 카드를 기록판 2번 줄에 놓기"],
      doneAnnouncement: "관찰한 변화를 기록판에 순서대로 적었어요.",
    },
    geometry: {
      kind: "orderedSlots",
      tokens: [
        { home: [rowX(2, -0.4)[0], 1.3, -0.62] },
        { home: [rowX(2, -0.4)[1], 1.3, -0.62] },
      ],
      slots: [
        [rowX(2, -0.4)[0], 0.95, -0.62],
        [rowX(2, -0.4)[1], 0.95, -0.62],
      ],
      radius: TARGET_RADIUS,
    },
  } satisfies R4ActionDefinition,

  // ---------- 새싹 3단계 ----------
  s3_a: {
    id: "s3_a",
    copy: {
      title: "쉬운 말로 안내 순서를 정리해요",
      instruction: "쉬운 표현 카드 세 장을 안내 문장 슬롯에 순서대로 놓아보세요.",
      altSteps: [
        "첫 번째 표현 카드를 안내 순서 1번에 놓기",
        "두 번째 표현 카드를 안내 순서 2번에 놓기",
        "세 번째 표현 카드를 안내 순서 3번에 놓기",
      ],
      doneAnnouncement: "쉬운 말로 안내할 순서를 정리했어요.",
    },
    geometry: {
      kind: "orderedSlots",
      tokens: rowX(3, 0).map((x) => ({ home: [x, 1.35, -0.64] as Vec3 })),
      slots: rowX(3, 0).map((x) => [x, 0.95, -0.64] as Vec3),
      radius: TARGET_RADIUS,
    },
  } satisfies R4ActionDefinition,
  s3_b: {
    id: "s3_b",
    copy: {
      title: "그림 카드로 확인 순서를 정리해요",
      instruction: "그림 안내카드 세 장을 다음 확인 순서 슬롯에 순서대로 놓아보세요.",
      altSteps: [
        "첫 번째 그림 카드를 확인 순서 1번에 놓기",
        "두 번째 그림 카드를 확인 순서 2번에 놓기",
        "세 번째 그림 카드를 확인 순서 3번에 놓기",
      ],
      doneAnnouncement: "그림 카드로 다음 확인 순서를 정리했어요.",
    },
    geometry: {
      kind: "orderedSlots",
      tokens: rowX(3, 0).map((x) => ({ home: [x, 1.55, -0.64] as Vec3 })),
      slots: rowX(3, 0).map((x) => [x, 1.15, -0.64] as Vec3),
      radius: TARGET_RADIUS,
    },
  } satisfies R4ActionDefinition,

  // ---------- 나침반 1단계 ----------
  p1_a: {
    id: "p1_a",
    copy: {
      title: "콩이를 차례로 살펴봐요",
      instruction: "관찰 링을 콩이의 머리 쪽, 그다음 몸통·다리 쪽으로 차례로 끌어보세요.",
      altSteps: ["콩이 머리 쪽 살펴보기", "콩이 몸통·다리 쪽 살펴보기"],
      doneAnnouncement: "콩이의 머리와 몸통·다리를 차례로 살펴봤어요.",
    },
    geometry: {
      kind: "orderedPath",
      home: [0.05, 1.4, -0.85],
      waypoints: [
        [0.4, 1.02, -0.85],
        [-0.22, 0.8, -0.85],
      ],
      radius: 0.29,
      driveDogObserve: true,
    },
  } satisfies R4ActionDefinition,
  p1_b: {
    id: "p1_b",
    copy: {
      title: "편안한 확인 순서를 생각해요",
      instruction: "‘보기·듣기·가까이 확인’ 카드 세 장을 편안한 순서 슬롯에 순서대로 놓아보세요.",
      altSteps: [
        "‘보기’ 카드를 첫 번째 순서에 놓기",
        "‘듣기’ 카드를 두 번째 순서에 놓기",
        "‘가까이 확인’ 카드를 세 번째 순서에 놓기",
      ],
      doneAnnouncement: "콩이가 편안할 확인 순서를 정리했어요.",
    },
    geometry: {
      kind: "orderedSlots",
      tokens: rowX(3, 0).map((x) => ({ home: [x, 1.35, -0.75] as Vec3 })),
      slots: rowX(3, 0).map((x) => [x, 0.95, -0.75] as Vec3),
      radius: TARGET_RADIUS,
    },
  } satisfies R4ActionDefinition,
  p1_c: {
    id: "p1_c",
    copy: {
      title: "보호자 이야기와 콩이 모습을 함께 살펴봐요",
      instruction: "보호자 말풍선 카드와 콩이 관찰 카드를 공통 확인판에 모두 올려보세요.",
      altSteps: ["보호자 말풍선 카드를 확인판에 올리기", "콩이 관찰 카드를 확인판에 올리기"],
      doneAnnouncement: "보호자 이야기와 콩이 모습을 함께 확인했어요.",
    },
    geometry: {
      kind: "multiSource",
      sources: [
        { home: [-0.6, 1.35, -0.8] },
        { home: [0.3, 1.2, -0.8] },
      ],
      target: [0, 0.98, -0.8],
      radius: TARGET_RADIUS,
    },
  } satisfies R4ActionDefinition,

  // ---------- 나침반 2단계 ----------
  p2_a: {
    id: "p2_a",
    copy: {
      title: "선배 수의사에게 함께 들어 달라고 요청해요",
      instruction: "보호자 말풍선 카드를 선배 수의사의 공동 듣기 영역으로 끌어놓아 보세요.",
      altLabel: "선배 수의사에게 함께 들어 달라고 요청하기",
      doneAnnouncement: "선배 수의사가 보호자의 이야기를 함께 들었어요.",
    },
    geometry: { kind: "dragToTarget", home: [-0.6, 1.35, -0.85], target: [0.75, 1.05, -0.85], radius: TARGET_RADIUS },
  } satisfies R4ActionDefinition,
  p2_b: {
    id: "p2_b",
    copy: {
      title: "중요한 내용을 시간 순서대로 기록해요",
      instruction: "기록 카드 세 장을 시간 순서 슬롯에 순서대로 놓아보세요.",
      altSteps: [
        "가장 먼저 있었던 일을 1번 줄에 기록하기",
        "그다음 있었던 일을 2번 줄에 기록하기",
        "가장 최근 있었던 일을 3번 줄에 기록하기",
      ],
      doneAnnouncement: "중요한 내용을 시간 순서대로 기록했어요.",
    },
    geometry: {
      kind: "orderedSlots",
      tokens: rowX(3, -0.15).map((x) => ({ home: [x, 1.3, -0.62] as Vec3 })),
      slots: rowX(3, -0.15).map((x) => [x, 0.95, -0.62] as Vec3),
      radius: TARGET_RADIUS,
    },
  } satisfies R4ActionDefinition,
  p2_c: {
    id: "p2_c",
    copy: {
      title: "그림과 표시로 기록해요",
      instruction: "상태 아이콘 세 개를 기록판의 맞는 행에 각각 놓아보세요.",
      altSteps: ["첫 번째 아이콘을 맞는 행에 놓기", "두 번째 아이콘을 맞는 행에 놓기", "세 번째 아이콘을 맞는 행에 놓기"],
      doneAnnouncement: "그림과 표시로 기록을 남겼어요.",
    },
    geometry: {
      kind: "matchTarget",
      tokens: rowX(3, -0.15).map((x, i) => ({ home: [x, 1.3, -0.62] as Vec3, targetIndex: i })),
      targets: rowX(3, -0.15).map((x) => [x, 0.95, -0.62] as Vec3),
      radius: TARGET_RADIUS,
    },
  } satisfies R4ActionDefinition,

  // ---------- 나침반 3단계 ----------
  p3_a: {
    id: "p3_a",
    copy: {
      title: "전체 상황을 먼저 살펴봐요",
      instruction: "관찰 링을 문 앞 대기 그룹 쪽, 그다음 진찰대 쪽으로 순서대로 끌어보세요.",
      altSteps: ["문 앞 대기 그룹 쪽 살펴보기", "진찰대 쪽 살펴보기"],
      doneAnnouncement: "대기 중인 보호자와 진찰대 상황을 순서대로 살펴봤어요.",
    },
    geometry: {
      kind: "orderedPath",
      home: [0.9, 1.4, -1.5],
      waypoints: [
        [1.7, 1.15, -1.5],
        [0, 0.9, -1.5],
      ],
      radius: TARGET_RADIUS,
    },
  } satisfies R4ActionDefinition,
  p3_b: {
    id: "p3_b",
    copy: {
      title: "두 상황의 상태와 순서를 비교해요",
      instruction: "현재 상담 카드와 대기 상담 카드를 각각 맞는 비교 영역에 놓아보세요.",
      altSteps: ["현재 상담 카드를 비교 영역에 놓기", "대기 상담 카드를 비교 영역에 놓기"],
      doneAnnouncement: "두 상황의 상태와 순서를 비교했어요.",
    },
    geometry: {
      kind: "matchTarget",
      tokens: [
        { home: [-0.3, 1.3, -1.5], targetIndex: 0 },
        { home: [1.6, 1.3, -1.5], targetIndex: 1 },
      ],
      targets: [
        [-0.35, 0.88, -1.5],
        [1.55, 0.88, -1.5],
      ],
      radius: TARGET_RADIUS,
    },
  } satisfies R4ActionDefinition,
  p3_c: {
    id: "p3_c",
    copy: {
      title: "선배 수의사와 역할을 나눠요",
      instruction: "‘현재 상담’과 ‘대기 안내’ 역할 카드를 보호자와 선배 수의사의 목표 영역에 각각 놓아보세요.",
      altSteps: ["‘현재 상담’ 역할 카드를 맞는 목표 영역에 놓기", "‘대기 안내’ 역할 카드를 맞는 목표 영역에 놓기"],
      doneAnnouncement: "선배 수의사와 역할을 나누어 맡았어요.",
    },
    geometry: {
      kind: "matchTarget",
      tokens: [
        { home: [0, 1.35, -1.5], targetIndex: 0 },
        { home: [0.4, 1.35, -1.5], targetIndex: 1 },
      ],
      targets: [
        [-0.75, 1.0, -1.5],
        [0.75, 1.0, -1.5],
      ],
      radius: TARGET_RADIUS,
    },
  } satisfies R4ActionDefinition,

  // ---------- 나침반 4단계 ----------
  p4_a: {
    id: "p4_a",
    copy: {
      title: "확인한 내용을 바로 정리해요",
      instruction: "관찰 기록 카드를 진료기록 슬롯에 순서대로 놓아보세요.",
      altSteps: ["첫 번째 관찰 기록을 진료기록 1번 줄에 놓기", "두 번째 관찰 기록을 진료기록 2번 줄에 놓기"],
      doneAnnouncement: "확인한 내용을 진료기록에 바로 정리했어요.",
    },
    geometry: {
      kind: "orderedSlots",
      tokens: [
        { home: [rowX(2, -0.4)[0], 1.25, -0.62] },
        { home: [rowX(2, -0.4)[1], 1.25, -0.62] },
      ],
      slots: [
        [rowX(2, -0.4)[0], 0.95, -0.62],
        [rowX(2, -0.4)[1], 0.95, -0.62],
      ],
      radius: TARGET_RADIUS,
    },
  } satisfies R4ActionDefinition,
  p4_b: {
    id: "p4_b",
    copy: {
      title: "표시카드로 새로운 정리 방식을 시도해요",
      instruction: "색·아이콘 표시카드를 기록판의 맞는 줄에 각각 놓아보세요.",
      altSteps: ["첫 번째 표시카드를 맞는 줄에 놓기", "두 번째 표시카드를 맞는 줄에 놓기", "세 번째 표시카드를 맞는 줄에 놓기"],
      doneAnnouncement: "표시카드로 기록을 새롭게 정리했어요.",
    },
    geometry: {
      kind: "matchTarget",
      tokens: rowX(3, -0.15).map((x, i) => ({ home: [x, 1.3, -0.62] as Vec3, targetIndex: i })),
      targets: rowX(3, -0.15).map((x) => [x, 0.95, -0.62] as Vec3),
      radius: TARGET_RADIUS,
    },
  } satisfies R4ActionDefinition,
  p4_c: {
    id: "p4_c",
    copy: {
      title: "기록과 콩이 상태를 함께 다시 살펴봐요",
      instruction: "확인 링을 기록판 쪽, 그다음 콩이 쪽으로 순서대로 끌어보세요.",
      altSteps: ["기록판 쪽 다시 확인하기", "콩이 쪽 다시 살펴보기"],
      doneAnnouncement: "기록과 콩이 상태를 함께 다시 살펴봤어요.",
    },
    geometry: {
      kind: "orderedPath",
      home: [-0.2, 1.35, -0.75],
      waypoints: [
        [-0.55, 1.05, -0.75],
        [0.15, 0.8, -0.75],
      ],
      radius: TARGET_RADIUS,
      driveDogObserve: true,
    },
  } satisfies R4ActionDefinition,

  // ---------- 나침반 5단계 ----------
  p5_a: {
    id: "p5_a",
    copy: {
      title: "정리한 기록을 다시 확인해요",
      instruction: "기록판의 체크 지점 세 곳을 위에서 아래 순서로 확인해보세요.",
      altSteps: ["첫 번째 체크 지점 확인하기", "두 번째 체크 지점 확인하기", "세 번째 체크 지점 확인하기"],
      doneAnnouncement: "정리한 기록을 위에서 아래로 다시 확인했어요.",
    },
    geometry: {
      kind: "reviewPath",
      home: [-0.9, 1.55, -0.6],
      waypoints: [
        [-0.7, 1.35, -0.6],
        [-0.2, 0.95, -0.6],
        [0.3, 0.55, -0.6],
      ],
      radius: 0.28,
    },
  } satisfies R4ActionDefinition,
  p5_b: {
    id: "p5_b",
    copy: {
      title: "보호자에게 말할 순서를 정리해요",
      instruction: "안내 카드 세 장을 설명 순서 슬롯에 순서대로 놓아보세요.",
      altSteps: [
        "첫 번째 안내 카드를 설명 순서 1번에 놓기",
        "두 번째 안내 카드를 설명 순서 2번에 놓기",
        "세 번째 안내 카드를 설명 순서 3번에 놓기",
      ],
      doneAnnouncement: "보호자에게 말할 순서를 정리했어요.",
    },
    geometry: {
      kind: "orderedSlots",
      tokens: rowX(3, 0.05).map((x) => ({ home: [x, 1.3, -0.64] as Vec3 })),
      slots: rowX(3, 0.05).map((x) => [x, 0.95, -0.64] as Vec3),
      radius: TARGET_RADIUS,
    },
  } satisfies R4ActionDefinition,
  p5_c: {
    id: "p5_c",
    copy: {
      title: "선배 수의사에게 안내 내용을 확인받아요",
      instruction: "완성된 안내 카드를 선배 수의사의 확인 영역으로, 그다음 보호자 안내 영역으로 순서대로 끌어보세요.",
      altSteps: ["선배 수의사에게 안내 카드 확인받기", "보호자에게 안내 카드 전달하기"],
      doneAnnouncement: "선배 수의사에게 확인받은 안내 내용을 보호자에게 전달했어요.",
    },
    geometry: {
      kind: "reviewPath",
      home: [0, 1.3, -0.98],
      waypoints: [
        [0.75, 1.05, -0.98],
        [-0.75, 1.0, -0.98],
      ],
      radius: TARGET_RADIUS,
    },
  } satisfies R4ActionDefinition,
} as const;

export type R4ActionChoiceId = keyof typeof R4_ACTION_DEFINITIONS_TYPED;

export const R4_ACTION_DEFINITIONS: Record<R4ActionChoiceId, R4ActionDefinition> = R4_ACTION_DEFINITIONS_TYPED;

export const R4_ACTION_ID_LIST: R4ActionChoiceId[] = Object.keys(
  R4_ACTION_DEFINITIONS_TYPED,
) as R4ActionChoiceId[];

export function isR4Action(choiceId: string): choiceId is R4ActionChoiceId {
  return Object.prototype.hasOwnProperty.call(R4_ACTION_DEFINITIONS, choiceId);
}

export function getR4ActionDefinition(choiceId: string): R4ActionDefinition | null {
  return isR4Action(choiceId) ? R4_ACTION_DEFINITIONS[choiceId] : null;
}

export function getR4ActionCopy(choiceId: string): R4ActionCopy | null {
  return getR4ActionDefinition(choiceId)?.copy ?? null;
}
