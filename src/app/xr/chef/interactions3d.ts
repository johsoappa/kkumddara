// ====================================================
// XR 요리사 인캔버스 상호작용 — 순수 로직 (G2.1-R1)
//
// React/Three.js에 의존하지 않는 순수 데이터·함수만 담는다
// (scenario.ts가 순수 데이터/집계 로직만 담는 것과 동일한 원칙).
// SceneInteractions.tsx는 이 파일의 함수/상수를 그대로 호출하는
// 얇은 R3F 래퍼로만 작성한다.
//
// sceneInteractionId: 카메라 stage나 interactionKind 조합으로 지점을
//   추론하지 않는다 — compass point 3(order/survey)과 sprout에는 order가
//   없어 문제가 없지만, compass point 4·5와 sprout point 3이 모두
//   select+plating이라 (kind, stage)만으로는 지점을 구분할 수 없다.
//   따라서 XrChefClient가 mode+point로 만든 안정적인 문자열 id를
//   그대로 씬까지 전달한다.
// ====================================================

import type { InteractionKind, Mode } from "./scenario";

export type Vec3 = [number, number, number];

/** XrChefClient가 현재 선택 지점을 가리키는 안정적인 id를 만든다. */
export function sceneInteractionId(mode: Mode, point: number): string {
  return `${mode}_p${point}`;
}

// ---------- 지점별 씬 앵커 좌표 (프레젠테이션 데이터) ----------

export interface SelectAnchor {
  kind: "select";
  /** choices[i]에 1:1 대응하는 클릭 타겟 좌표 */
  targets: Vec3[];
}

export interface PlaceAnchor {
  kind: "place";
  /** choices[i]에 1:1 대응하는 드래그 시작 토큰 좌표 (보관대 쪽) */
  tokens: Vec3[];
  /** 단일 드롭존 — 기존 PlaceInteraction과 동일하게 목표 지점은 하나 */
  dropZone: Vec3;
  dropRadius: number;
}

export interface OrderAnchor {
  kind: "order";
  /** 순서 타일 슬롯 좌표 (index = 슬롯 위치) */
  slots: Vec3[];
  /** 순서 확정 전용 오브젝트 좌표 */
  confirm: Vec3;
}

export type SceneAnchor = SelectAnchor | PlaceAnchor | OrderAnchor;

export const SCENE_ANCHORS: Record<string, SceneAnchor> = {
  // 나침반 지점1 — 조리대 개관(select): 냄비 쪽/도마 쪽/주문표 쪽 3타겟
  // (라벨 스프라이트 폭 0.85 기준 서로 1.0 이상 떨어뜨려 겹침 방지)
  compass_p1: {
    kind: "select",
    targets: [
      [-0.9, 1.32, -1.15],
      [0.8, 1.32, -1.0],
      [-1.55, 1.75, -1.55],
    ],
  },
  // 나침반 지점2 — 보관대 재료 3개(높이·앞뒤로 지그재그 배치) → 도마 옆 드롭존 1개
  compass_p2: {
    kind: "place",
    tokens: [
      [1.3, 1.12, -1.75],
      [2.1, 1.12, -1.75],
      [1.7, 1.55, -2.15],
    ],
    dropZone: [0.4, 1.1, -1.05],
    dropRadius: 0.36,
  },
  // 나침반 지점3 — 조리대 위 순서 타일 3개(작은 라벨) + 확인 프롭
  compass_p3: {
    kind: "order",
    slots: [
      [-0.55, 1.18, -1.2],
      [0, 1.18, -1.2],
      [0.55, 1.18, -1.2],
    ],
    confirm: [1.05, 1.18, -1.05],
  },
  // 나침반 지점4 — 동료/협업 관련 타겟 3개 (지점1과 비슷한 스케일로 넓게 배치)
  compass_p4: {
    kind: "select",
    targets: [
      [-0.9, 1.2, -1.0],
      [0.5, 1.15, -0.8],
      [-0.15, 1.55, -1.35],
    ],
  },
  // 나침반 지점5 — 전달대/안내 관련 타겟 3개 (지점4와 다른 위치, 넓게 배치)
  compass_p5: {
    kind: "select",
    targets: [
      [0.3, 1.0, 0.65],
      [1.3, 1.0, 0.5],
      [0.75, 1.45, 1.15],
    ],
  },
  // 새싹 지점1 — compass_p1의 2타겟 버전
  sprout_p1: {
    kind: "select",
    targets: [
      [-0.9, 1.32, -1.15],
      [-1.55, 1.75, -1.55],
    ],
  },
  // 새싹 지점2 — compass_p2의 2토큰 버전
  sprout_p2: {
    kind: "place",
    tokens: [
      [1.35, 1.12, -1.75],
      [2.05, 1.12, -1.75],
    ],
    dropZone: [0.4, 1.1, -1.05],
    dropRadius: 0.36,
  },
  // 새싹 지점3 — compass_p4의 2타겟 버전
  sprout_p3: {
    kind: "select",
    targets: [
      [-0.9, 1.2, -1.0],
      [0.5, 1.15, -0.8],
    ],
  },
};

/** 30초 내 "무엇을 만져야 하는지" 이해를 돕는 1줄 힌트 (기존 문구 대체 아님, 보조) */
export const SCENE_HINTS: Record<InteractionKind, string> = {
  select: "반짝이는 오브젝트를 눌러보세요.",
  place: "재료를 눌러서 표시된 자리로 끌어다 놓아보세요.",
  order: "타일을 끌어서 순서를 바꾸고, 확인을 눌러보세요.",
};

// ---------- place: 드롭 판정 ----------

export interface DropZoneTarget {
  id: string;
  x: number;
  z: number;
  radius: number;
}

/** 주어진 xz 좌표가 어느 드롭존 반경 안에 있는지 판정한다 (없으면 null). */
export function hitTestDropZone(
  point: { x: number; z: number },
  zones: DropZoneTarget[],
): string | null {
  for (const zone of zones) {
    const dx = point.x - zone.x;
    const dz = point.z - zone.z;
    if (Math.sqrt(dx * dx + dz * dz) <= zone.radius) {
      return zone.id;
    }
  }
  return null;
}

// ---------- order: 드래그 중 재정렬 ----------

/**
 * 드래그 중인 타일의 현재 x좌표를 슬롯 x좌표 배열과 비교해, 가장 가까운
 * 슬롯 위치로 order 배열을 재배치한다. 이미 그 위치라면 그대로 반환한다
 * (참조 동일성 유지 — 불필요한 리렌더 방지).
 */
export function reorderOnDrag(
  order: string[],
  draggedId: string,
  draggedX: number,
  slotX: number[],
): string[] {
  const currentIndex = order.indexOf(draggedId);
  if (currentIndex === -1) return order;

  let nearestIndex = 0;
  let nearestDist = Infinity;
  slotX.forEach((x, i) => {
    const dist = Math.abs(x - draggedX);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestIndex = i;
    }
  });

  if (nearestIndex === currentIndex) return order;

  const next = order.slice();
  next.splice(currentIndex, 1);
  next.splice(nearestIndex, 0, draggedId);
  return next;
}

// ---------- 카메라: 프레임레이트 독립적 지수 감쇠 보간 ----------

/** half-life(초) 기반 감쇠: dt가 커도(프레임 드랍) 오버슈트하지 않는다. */
export function easeAlpha(dt: number, halfLifeSeconds: number): number {
  if (halfLifeSeconds <= 0) return 1;
  return 1 - Math.pow(0.5, dt / halfLifeSeconds);
}

export function easeVec3(current: Vec3, target: Vec3, alpha: number): Vec3 {
  return [
    current[0] + (target[0] - current[0]) * alpha,
    current[1] + (target[1] - current[1]) * alpha,
    current[2] + (target[2] - current[2]) * alpha,
  ];
}
