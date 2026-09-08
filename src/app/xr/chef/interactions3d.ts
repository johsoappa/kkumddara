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

import type { CameraStage, InteractionKind, Mode } from "./scenario";

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
  // G2.1-R1-F1 보정: 이전 좌표(z가 +0.5~1.15)는 plating 카메라(lookAt z=-1.1,
  // 카메라 z=0.6 — 즉 -z 방향을 바라봄)의 시야 반대쪽(카메라 뒤/옆)에 있어
  // 렌더링 자체가 되지 않는 버그였다. p4와 같은 -z 시야 안에서, 위치·높이만
  // 다르게 잡아 "지점4와 다른 위치"라는 요구를 지킨다.
  compass_p5: {
    kind: "select",
    targets: [
      [0.35, 1.05, -0.9],
      [-0.35, 1.0, -0.75],
      [0.05, 1.42, -1.3],
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

// ====================================================
// G2.1-R1-F1 — 카메라 프레이밍(FOV) 자동 계산
//
// 라벨/선택 대상이 Canvas 경계 밖으로 잘리는 문제를, stage별 카메라
// position/lookAt은 그대로 둔 채(재배치는 벽·오브젝트 관통 위험이 있어
// 보수적으로 피한다) 매 프레임 "이 stage에서 반드시 보여야 하는 실제
// 월드 좌표들"을 기준으로 수직 FOV를 계산해 보정하는 방식으로 해결한다.
//
// SceneInteractions.tsx가 라벨을 배치할 때 쓰는 오프셋/스프라이트 크기와
// 반드시 같은 상수를 공유해야 "라벨까지 포함해 안 잘리는" 계산이 성립한다.
// ====================================================

/** select 타겟 라벨: 메시 중심 기준 위쪽 오프셋 + 스프라이트 크기 */
export const LABEL_SCALE_LARGE: [number, number] = [0.85, 0.42];
export const LABEL_OFFSET_LARGE = 0.34;
export const LABEL_HALF_WIDTH_LARGE = LABEL_SCALE_LARGE[0] / 2;
export const LABEL_HALF_HEIGHT_LARGE = LABEL_SCALE_LARGE[1] / 2;
/** place 토큰 / order 타일·확인 프롭 라벨(좁은 간격용 축소 스프라이트) */
export const LABEL_SCALE_SMALL: [number, number] = [0.58, 0.3];
export const LABEL_OFFSET_SMALL = 0.29;
export const LABEL_HALF_WIDTH_SMALL = LABEL_SCALE_SMALL[0] / 2;
export const LABEL_HALF_HEIGHT_SMALL = LABEL_SCALE_SMALL[1] / 2;

function vSub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function vDot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function vCross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function vLen(a: Vec3): number {
  return Math.sqrt(vDot(a, a));
}
function vNormalize(a: Vec3): Vec3 {
  const len = vLen(a);
  if (len < 1e-6) return [0, 0, -1];
  return [a[0] / len, a[1] / len, a[2] / len];
}

/**
 * 라벨(billboard sprite)의 네 모서리를 월드 좌표로 근사한다. 라벨은 항상 카메라를
 * 향하므로 정확한 모서리는 카메라의 실제 right/up 축에 좌우되지만, 이 씬의 모든
 * 카메라는 피치·요가 완만해(옆에서 보거나 위아래로 크게 꺾이지 않음) world
 * X(가로)/Y(세로) 축으로 근사해도 안전하다 — fitVerticalFov가 이 점들을 다시
 * 실제 카메라 축으로 투영해 최종 각도를 계산하므로, 여기서는 라벨의 "너비·높이가
 * 어디까지 뻗는지"만 world 좌표로 표현하면 된다.
 */
function labelCorners(mesh: Vec3, offset: number, halfWidth: number, halfHeight: number): Vec3[] {
  const centerY = mesh[1] + offset;
  return [
    [mesh[0] - halfWidth, centerY - halfHeight, mesh[2]],
    [mesh[0] + halfWidth, centerY - halfHeight, mesh[2]],
    [mesh[0] - halfWidth, centerY + halfHeight, mesh[2]],
    [mesh[0] + halfWidth, centerY + halfHeight, mesh[2]],
  ];
}

/** 앵커 하나(메시 위치 + 라벨 네 모서리)를 "반드시 프레임에 들어와야 하는 점" 목록으로 펼친다. */
export function framingPointsForAnchor(anchor: SceneAnchor): Vec3[] {
  if (anchor.kind === "select") {
    return anchor.targets.flatMap((t) => [
      t,
      ...labelCorners(t, LABEL_OFFSET_LARGE, LABEL_HALF_WIDTH_LARGE, LABEL_HALF_HEIGHT_LARGE),
    ]);
  }
  if (anchor.kind === "place") {
    const tokenPoints = anchor.tokens.flatMap((t) => [
      t,
      ...labelCorners(t, LABEL_OFFSET_SMALL, LABEL_HALF_WIDTH_SMALL, LABEL_HALF_HEIGHT_SMALL),
    ]);
    return [...tokenPoints, anchor.dropZone];
  }
  const slotPoints = anchor.slots.flatMap((s) => [
    s,
    ...labelCorners(s, LABEL_OFFSET_SMALL, LABEL_HALF_WIDTH_SMALL, LABEL_HALF_HEIGHT_SMALL),
  ]);
  const confirmPoints: Vec3[] = [
    anchor.confirm,
    ...labelCorners(anchor.confirm, LABEL_OFFSET_SMALL, LABEL_HALF_WIDTH_SMALL, LABEL_HALF_HEIGHT_SMALL),
  ];
  return [...slotPoints, ...confirmPoints];
}

/** intro/overview에서 반드시 보여야 하는 주방 랜드마크(후드·조리대 양끝·전달대·주문표·보관대) */
export const OVERVIEW_LANDMARKS: Vec3[] = [
  [-2.05, 1.02, -1.2],
  [2.05, 1.02, -1.2],
  [0.7, 2.45, -1.2],
  [-0.7, 2.45, -1.2],
  [1.4, 0.92, 1.1],
  [-2.35, 1.95, -1.6],
  [2.3, 1.4, -2.2],
];

/** 결과 화면(celebrate)에서 반드시 보여야 하는 완성 접시·전달대·동료 */
export const CELEBRATE_LANDMARKS: Vec3[] = [
  [0.1, 1.2, -1.0],
  [1.4, 0.92, 1.1],
  [-1.5, 1.85, -1.6],
];

/**
 * 주어진 stage/현재 씬 상호작용 지점에서 "반드시 프레임에 들어와야 하는" 점 목록을 고른다.
 * null을 반환하면(=인터랙션 없는 HTML 모드 등) 기본 FOV를 그대로 사용한다.
 */
export function framingPointsForStage(
  stage: CameraStage,
  sceneInteractionId: string | null,
): Vec3[] | null {
  if (stage === "overview") return OVERVIEW_LANDMARKS;
  if (stage === "celebrate") return CELEBRATE_LANDMARKS;
  if (!sceneInteractionId) return null;
  const anchor = SCENE_ANCHORS[sceneInteractionId];
  return anchor ? framingPointsForAnchor(anchor) : null;
}

export interface FitVerticalFovInput {
  cameraPos: Vec3;
  lookAt: Vec3;
  points: Vec3[];
  aspect: number;
  /** 점들이 화면 가장자리에서 얼마나 안쪽(0~1)에 들어오게 할지 — 클수록 여백이 줄어든다 */
  marginRatio?: number;
  minFovDeg?: number;
  maxFovDeg?: number;
}

/**
 * 카메라 position/lookAt(자세)는 그대로 두고, 주어진 월드 좌표들이 현재 aspect ratio에서
 * 모두 프레임 안(margin 포함)에 들어오도록 필요한 "수직" FOV(THREE.PerspectiveCamera.fov 단위,
 * degree)를 계산한다. 순수 함수 — Three.js 인스턴스 없이 벡터 3-튜플만으로 계산한다.
 */
export function fitVerticalFov({
  cameraPos,
  lookAt,
  points,
  aspect,
  marginRatio = 0.82,
  minFovDeg = 40,
  maxFovDeg = 85,
}: FitVerticalFovInput): number {
  const forward = vNormalize(vSub(lookAt, cameraPos));
  const worldUp: Vec3 = [0, 1, 0];
  let right = vNormalize(vCross(forward, worldUp));
  if (vLen(right) < 1e-6) right = [1, 0, 0]; // forward가 world up과 거의 평행한 축퇴 상황 방어
  const up = vNormalize(vCross(right, forward));

  let maxTanHalfH = 0;
  let maxTanHalfV = 0;
  for (const point of points) {
    const rel = vSub(point, cameraPos);
    const depth = vDot(rel, forward);
    if (depth <= 0.05) continue; // 카메라 뒤/극단적으로 가까운 점은 계산에서 제외
    maxTanHalfH = Math.max(maxTanHalfH, Math.abs(vDot(rel, right)) / depth);
    maxTanHalfV = Math.max(maxTanHalfV, Math.abs(vDot(rel, up)) / depth);
  }

  if (maxTanHalfH === 0 && maxTanHalfV === 0) {
    return Math.min(maxFovDeg, Math.max(minFovDeg, 55));
  }

  const clampedMargin = Math.min(0.95, Math.max(0.4, marginRatio));
  const tanHalfH = maxTanHalfH / clampedMargin;
  const tanHalfV = maxTanHalfV / clampedMargin;

  const halfVFovFromV = Math.atan(tanHalfV);
  // 수평으로 필요한 반각을, 현재 aspect(width/height)에서 그에 대응하는 수직 반각으로 환산
  const halfVFovFromH = Math.atan(tanHalfH / Math.max(0.01, aspect));

  const neededHalfVFov = Math.max(halfVFovFromV, halfVFovFromH);
  const vFovDeg = (neededHalfVFov * 2 * 180) / Math.PI;
  return Math.min(maxFovDeg, Math.max(minFovDeg, vFovDeg));
}

export interface CameraFraming {
  fovDeg: number;
  /** lookAt→cameraPos 축 방향으로 카메라를 얼마나 더 밀어야 하는지의 배율(>=1, 1이면 원래 위치 유지) */
  distanceScale: number;
}

/**
 * fitVerticalFov만으로 필요한 FOV가 maxFovDeg를 넘어서면(카메라가 대상에 비해 너무
 * 가까워 FOV만으로는 담을 수 없는 경우), FOV는 maxFovDeg로 고정하고 대신 카메라를
 * lookAt 반대 방향(원래 시선축)으로 필요한 만큼 더 미는 배율을 함께 계산한다.
 * 이렇게 하면 fov 하나만 무한정 키워 어안렌즈처럼 왜곡되는 대신, 거리 보정으로
 * 자연스럽게 프레이밍을 맞춘다("카메라 거리 또는 FOV를 조정").
 */
export function fitCameraFraming({
  cameraPos,
  lookAt,
  points,
  aspect,
  marginRatio = 0.82,
  minFovDeg = 40,
  maxFovDeg = 85,
}: FitVerticalFovInput): CameraFraming {
  if (points.length === 0) {
    return { fovDeg: Math.min(maxFovDeg, Math.max(minFovDeg, 55)), distanceScale: 1 };
  }

  // 우선 카메라를 밀지 않는다고 가정하고 필요한 "실제" FOV를 구한다(상한 없이).
  const rawFovDeg = fitVerticalFov({
    cameraPos,
    lookAt,
    points,
    aspect,
    marginRatio,
    minFovDeg,
    maxFovDeg: 1000,
  });

  if (rawFovDeg <= maxFovDeg) {
    return { fovDeg: Math.max(minFovDeg, rawFovDeg), distanceScale: 1 };
  }

  const forward = vNormalize(vSub(lookAt, cameraPos));
  const worldUp: Vec3 = [0, 1, 0];
  let right = vNormalize(vCross(forward, worldUp));
  if (vLen(right) < 1e-6) right = [1, 0, 0];
  const up = vNormalize(vCross(right, forward));

  const distanceFromLookAt = vLen(vSub(cameraPos, lookAt));
  if (distanceFromLookAt < 1e-6) {
    return { fovDeg: maxFovDeg, distanceScale: 1 };
  }

  const clampedMargin = Math.min(0.95, Math.max(0.4, marginRatio));
  const maxHalfRad = (maxFovDeg * Math.PI) / 180 / 2;
  const allowedTanV = Math.tan(maxHalfRad) * clampedMargin;
  const allowedTanH = allowedTanV * Math.max(0.01, aspect);

  let requiredScale = 1;
  for (const point of points) {
    const rel = vSub(point, lookAt);
    // depthFromLookAt: lookAt 지점을 기준으로 이 점이 카메라 쪽(+forward)으로 얼마나
    // 더 붙어 있는지 — 카메라를 s배 밀면 이 점까지의 실제 depth는
    // depthFromLookAt + s*distanceFromLookAt이 된다(각도 성분 H/V는 s와 무관 — right/up이
    // forward와 직교하므로 lookAt→cameraPos 방향 이동은 H/V에 영향을 주지 않는다).
    const depthFromLookAt = vDot(rel, forward);
    const h = Math.abs(vDot(rel, right));
    const v = Math.abs(vDot(rel, up));

    if (allowedTanH > 1e-6) {
      const neededDepth = h / allowedTanH;
      requiredScale = Math.max(requiredScale, (neededDepth - depthFromLookAt) / distanceFromLookAt);
    }
    if (allowedTanV > 1e-6) {
      const neededDepth = v / allowedTanV;
      requiredScale = Math.max(requiredScale, (neededDepth - depthFromLookAt) / distanceFromLookAt);
    }
  }

  return { fovDeg: maxFovDeg, distanceScale: Math.max(1, requiredScale) };
}

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
