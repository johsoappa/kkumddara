// ====================================================
// XR 수의사 씬 레이아웃 — 순수 데이터 + 순수 함수 (G2.2-R2)
//
// React/Three.js 인스턴스에 의존하지 않는 순수 데이터·함수만 담는다
// (scenario.ts가 순수 데이터/집계 로직만 담는 것과 동일한 원칙 — 요리사
// interactions3d.ts와 같은 위치의 파일이지만, 요리사 파일을 import하지
// 않고 이 파일 안에서 자체 완결형으로 재구현했다. 드래그/평면교차 등
// 요리사 전용 로직은 필요 없다 — 수의사 시나리오는 select만 사용한다).
//
// 이 파일은 scenario.ts를 읽기만 한다(타입·CHOICE_POINTS/SPROUT_POINTS
// import) — scenario.ts 자체는 수정하지 않는다.
// ====================================================

import type { AxisId, Choice, CameraStage, Mode } from "./scenario";
import { CHOICE_POINTS, SPROUT_POINTS } from "./scenario";

export type Vec3 = [number, number, number];

/** XrVetClient가 현재 선택 지점을 가리키는 안정적인 id를 만든다 (요리사와 동일 패턴, 파일은 독립). */
export function sceneInteractionId(mode: Mode, point: number): string {
  return `${mode}_p${point}`;
}

// ---------- 장면 속 대상 종류 ----------

/** 항상 씬에 존재하는(상시 렌더) "이름 있는" 캐릭터/소품 — 현재 지점의 타깃일 때만 상호작용 가능해진다. */
export type NamedTargetKind = "dog" | "guardian" | "senior" | "clipboard" | "cabinet";
/** 특정 지점에서만 잠깐 나타나는 추상 개념 아이콘(예: "다른 방법을 생각해본다") — 상시 소품이 아니다. */
export type IconVariant = "idea" | "together" | "overview" | "compare";

export type SceneTarget =
  | { kind: NamedTargetKind; position: Vec3 }
  | { kind: "icon"; position: Vec3; variant: IconVariant };

export interface ResolvedTarget {
  target: SceneTarget;
  choice: Choice;
}

// ---------- 상시 캐릭터/소품 앵커 좌표 ----------
// "작은 동물병원 첫 상담실" 하나로 통일한 공간 안의 고정 위치.
// dog/guardian/senior/clipboard/cabinet은 VetScene이 항상 이 위치에
// 렌더링하는 상시 캐릭터/소품이며, 지점별로 상호작용 가능 여부만 바뀐다.

export const DOG_ANCHOR: Vec3 = [0.1, 1.35, -1.35];
export const GUARDIAN_ANCHOR: Vec3 = [-1.4, 1.35, -0.6];
export const SENIOR_ANCHOR: Vec3 = [1.4, 1.5, -1.6];
export const CLIPBOARD_ANCHOR: Vec3 = [0.65, 1.1, -0.75];
export const CABINET_ANCHOR: Vec3 = [-1.6, 1.0, -2.2];

/** 지점에 따라서만 잠깐 등장하는 추상 아이콘 슬롯 — 상시 소품이 아니므로 캐릭터 앵커와는 별도로 둔다. */
const ICON_IDEA_ANCHOR: Vec3 = [-0.15, 1.75, -0.3];
const ICON_TOGETHER_ANCHOR: Vec3 = [-0.75, 1.3, -1.95];
const ICON_OVERVIEW_ANCHOR: Vec3 = [0.0, 2.1, -2.3];
const ICON_COMPARE_ANCHOR: Vec3 = [1.5, 1.3, -0.4];

/** 씬을 구성하는 상시 배경 소품(비상호작용) 좌표 — VetScene이 참조한다. */
export const TABLE_CENTER: Vec3 = [0.1, 0.5, -1.3];
export const MONITOR_ANCHOR: Vec3 = [-1.3, 1.55, -2.5];
export const SCALE_ANCHOR: Vec3 = [-0.5, 0, -0.15];
export const WALL_SIGN_ANCHOR: Vec3 = [0, 2.35, -2.55];

// ---------- 지점별 씬 타깃 (choices[i] ↔ SCENE_TARGETS[id][i] 1:1) ----------
//
// 실제 매핑은 scenario.ts의 각 지점 choice 문구·순서를 그대로 따른다
// (문구는 여기서 복제하지 않고 choices 배열 인덱스로만 대응시킨다 —
// resolveTargets가 choices[i]와 짝지어 반환한다).

export const SCENE_TARGETS: Record<string, SceneTarget[]> = {
  // p1_a 관찰부터 시작 / p1_b 다른 확인 순서를 생각 / p1_c 동물+보호자 함께
  compass_p1: [
    { kind: "dog", position: DOG_ANCHOR },
    { kind: "icon", position: ICON_IDEA_ANCHOR, variant: "idea" },
    { kind: "icon", position: ICON_TOGETHER_ANCHOR, variant: "together" },
  ],
  // p2_a 선배에게 함께 들어달라 / p2_b 순서대로 적어둔다 / p2_c 다른 기록 방법 생각
  compass_p2: [
    { kind: "senior", position: SENIOR_ANCHOR },
    { kind: "clipboard", position: CLIPBOARD_ANCHOR },
    { kind: "icon", position: ICON_IDEA_ANCHOR, variant: "idea" },
  ],
  // p3_a 전체 상황 먼저 살핀다 / p3_b 두 상황 비교 / p3_c 선배와 역할 나눈다
  compass_p3: [
    { kind: "icon", position: ICON_OVERVIEW_ANCHOR, variant: "overview" },
    { kind: "icon", position: ICON_COMPARE_ANCHOR, variant: "compare" },
    { kind: "senior", position: SENIOR_ANCHOR },
  ],
  // p4_a 바로 정리 시작 / p4_b 새로운 정리 방법 시도 / p4_c 기록 전체 다시 살펴본다
  compass_p4: [
    { kind: "clipboard", position: CLIPBOARD_ANCHOR },
    { kind: "icon", position: ICON_IDEA_ANCHOR, variant: "idea" },
    { kind: "cabinet", position: CABINET_ANCHOR },
  ],
  // p5_a 정리한 기록 다시 확인 / p5_b 안내 순서 다시 정리 / p5_c 선배에게 확인받는다
  compass_p5: [
    { kind: "clipboard", position: CLIPBOARD_ANCHOR },
    { kind: "icon", position: ICON_IDEA_ANCHOR, variant: "idea" },
    { kind: "senior", position: SENIOR_ANCHOR },
  ],
  // s1_a 보호자 이야기 먼저 듣는다 / s1_b 동물 먼저 살펴본다
  sprout_p1: [
    { kind: "guardian", position: GUARDIAN_ANCHOR },
    { kind: "dog", position: DOG_ANCHOR },
  ],
  // s2_a 선배에게 물어본다 / s2_b 하나씩 적어본다
  sprout_p2: [
    { kind: "senior", position: SENIOR_ANCHOR },
    { kind: "clipboard", position: CLIPBOARD_ANCHOR },
  ],
  // s3_a 익숙한 방법으로 안내 / s3_b 새롭게 안내해본다
  sprout_p3: [
    { kind: "guardian", position: GUARDIAN_ANCHOR },
    { kind: "icon", position: ICON_IDEA_ANCHOR, variant: "idea" },
  ],
};

/** 지점 라벨(짧은 한글 라벨) — 씬 타깃 위 라벨 스프라이트용. choice.label 원문 대신
 *  화면에서 더 짧게 읽히도록 kind/variant 기준 고정 라벨을 쓴다(문구 자체는
 *  scenario.ts choice.label을 그대로 보조 텍스트로 병기 가능하도록 choice도 함께 반환한다). */
export const TARGET_LABELS: Record<NamedTargetKind | IconVariant, string> = {
  dog: "강아지",
  guardian: "보호자",
  senior: "선배 수의사",
  clipboard: "기록판",
  cabinet: "약장",
  idea: "다른 방법",
  together: "함께 보기",
  overview: "전체 살피기",
  compare: "비교하기",
};

function targetVariantKey(target: SceneTarget): NamedTargetKind | IconVariant {
  return target.kind === "icon" ? target.variant : target.kind;
}

/** choices[i] ↔ SCENE_TARGETS[id][i]를 인덱스로 짝짓는다. 길이가 다르면(설정 오류) 짧은 쪽까지만 짝짓는다. */
export function resolveTargets(id: string, choices: Choice[]): ResolvedTarget[] {
  const targets = SCENE_TARGETS[id];
  if (!targets) return [];
  const length = Math.min(targets.length, choices.length);
  const resolved: ResolvedTarget[] = [];
  for (let i = 0; i < length; i += 1) {
    resolved.push({ target: targets[i], choice: choices[i] });
  }
  return resolved;
}

export function targetLabel(target: SceneTarget): string {
  return TARGET_LABELS[targetVariantKey(target)];
}

// ---------- 회귀 검증용: 지점별 point 배열과 choices 배열 ----------
// sceneLayout.test.ts가 "모든 mode·point에서 target 개수 === choices 개수"를
// 검증할 때 scenario.ts를 다시 순회하지 않고 이 매핑을 통해 확인한다.

export const MODE_POINT_CHOICES: Record<Mode, Choice[][]> = {
  compass: CHOICE_POINTS.map((p) => p.choices),
  sprout: SPROUT_POINTS.map((p) => p.choices),
};

// ---------- 카메라: 지점별 타깃을 자동으로 프레임에 담는 계산 ----------
//
// 요리사 interactions3d.ts의 fitVerticalFov와 같은 핀홀 카메라 삼각함수를
// 쓰지만, 이 파일 안에서 독립적으로(파일 import 없이) 다시 구현했다 —
// 두 직업의 씬 파일이 서로 참조하지 않는다는 기존 설계 원칙(G2.2-R1
// scenario.ts 주석)을 카메라 계산에도 그대로 적용한다. 수의사는 select만
// 쓰므로 라벨 모서리·드롭존 등 요리사 전용 계산은 필요 없다 — 타깃 중심점
// + 여유 반경만으로 충분하다.

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

export function averageVec3(points: Vec3[]): Vec3 {
  if (points.length === 0) return [0, 1.3, -1.3];
  const sum = points.reduce<Vec3>((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [
    0, 0, 0,
  ]);
  return [sum[0] / points.length, sum[1] / points.length, sum[2] / points.length];
}

/**
 * 타깃 점들의 무게중심을 바라보는 카메라 position/lookAt을 계산한다.
 * pullBack이 클수록 카메라가 더 멀리 물러나 여유 있게 담는다. 순수 함수라
 * 어떤 point 조합에도 안전하게 동작하며, 카메라가 항상 타깃보다 +z 쪽
 * (씬 앞쪽)에 위치하도록 보장한다(캐릭터 메시 내부에 카메라가 파묻히는
 * 사고를 구조적으로 방지).
 */
export function cameraFor(points: Vec3[], pullBack: number): { position: Vec3; lookAt: Vec3 } {
  const centroid = averageVec3(points);
  const lookAt: Vec3 = [centroid[0] * 0.55, Math.max(1.05, centroid[1] - 0.05), centroid[2]];
  const position: Vec3 = [centroid[0] * 0.3, centroid[1] + 0.45, centroid[2] + pullBack];
  return { position, lookAt };
}

export interface FitFovInput {
  cameraPos: Vec3;
  lookAt: Vec3;
  points: Vec3[];
  aspect: number;
  marginRatio?: number;
  minFovDeg?: number;
  maxFovDeg?: number;
}

/**
 * 카메라 position/lookAt(자세)은 그대로 두고, 주어진 점들이 현재 aspect
 * ratio(width/height, 세로로 긴 모바일이면 1보다 작다)에서 모두 프레임 안에
 * (margin 포함) 들어오도록 필요한 "수직" FOV(THREE.PerspectiveCamera.fov,
 * degree)를 계산한다. 좁은 세로 화면일수록 가로 방향이 더 빡빡해지므로,
 * 가로 기준으로 필요한 각도를 aspect로 환산해 세로 기준과 비교한다 —
 * 375px 같은 좁은 화면에서 대상이 잘리는 문제를 카메라 위치 재배치 없이
 * FOV 하나로 구조적으로 방지한다.
 */
export function fitVerticalFov({
  cameraPos,
  lookAt,
  points,
  aspect,
  marginRatio = 0.78,
  minFovDeg = 42,
  maxFovDeg = 80,
}: FitFovInput): number {
  const forward = vNormalize(vSub(lookAt, cameraPos));
  const worldUp: Vec3 = [0, 1, 0];
  let right = vNormalize(vCross(forward, worldUp));
  if (vLen(right) < 1e-6) right = [1, 0, 0];
  const up = vNormalize(vCross(right, forward));

  let maxTanHalfH = 0;
  let maxTanHalfV = 0;
  for (const point of points) {
    const rel = vSub(point, cameraPos);
    const depth = vDot(rel, forward);
    if (depth <= 0.05) continue;
    maxTanHalfH = Math.max(maxTanHalfH, Math.abs(vDot(rel, right)) / depth);
    maxTanHalfV = Math.max(maxTanHalfV, Math.abs(vDot(rel, up)) / depth);
  }

  if (maxTanHalfH === 0 && maxTanHalfV === 0) {
    return Math.min(maxFovDeg, Math.max(minFovDeg, 55));
  }

  const clampedMargin = Math.min(0.95, Math.max(0.4, marginRatio));
  const tanHalfV = maxTanHalfV / clampedMargin;
  const tanHalfH = maxTanHalfH / clampedMargin;

  const halfVFovFromV = Math.atan(tanHalfV);
  const halfVFovFromH = Math.atan(tanHalfH / Math.max(0.01, aspect));

  const neededHalfVFov = Math.max(halfVFovFromV, halfVFovFromH);
  const vFovDeg = (neededHalfVFov * 2 * 180) / Math.PI;
  return Math.min(maxFovDeg, Math.max(minFovDeg, vFovDeg));
}

/** "이 지점에서 반드시 보여야 하는" 점 목록에 타깃 주변 여유 반경(라벨 포함 근사)을 더한다. */
function withPadding(points: Vec3[], radius: number): Vec3[] {
  const padded: Vec3[] = [];
  for (const p of points) {
    padded.push(
      p,
      [p[0] - radius, p[1] - radius, p[2]],
      [p[0] + radius, p[1] + radius, p[2]],
    );
  }
  return padded;
}

/** 좌표 목록(라벨 포함 근사 반경) 기준 프레이밍 포인트. */
export function framingPointsForPositions(points: Vec3[]): Vec3[] {
  return withPadding(points, 0.55);
}

/** intro/결과 화면에서 반드시 보여야 하는 랜드마크(강아지·보호자·선배·기록판). */
export const OVERVIEW_LANDMARKS: Vec3[] = [
  DOG_ANCHOR,
  GUARDIAN_ANCHOR,
  SENIOR_ANCHOR,
  CLIPBOARD_ANCHOR,
];

export const OVERVIEW_CAMERA_PULL_BACK = 3.6;
export const POINT_CAMERA_PULL_BACK = 2.9;

/** 특정 지점(sceneInteractionId)의 카메라 base position/lookAt. 강아지를 항상
 *  구도 안에 포함시켜(연속성 앵커) 병원 정체성이 매 지점에서 유지되게 한다. */
export function cameraForPoint(id: string): { position: Vec3; lookAt: Vec3; points: Vec3[] } {
  const targets = SCENE_TARGETS[id] ?? [];
  const points = [...targets.map((t) => t.position), DOG_ANCHOR];
  return { ...cameraFor(points, POINT_CAMERA_PULL_BACK), points };
}

export function overviewCamera(): { position: Vec3; lookAt: Vec3; points: Vec3[] } {
  return { ...cameraFor(OVERVIEW_LANDMARKS, OVERVIEW_CAMERA_PULL_BACK), points: OVERVIEW_LANDMARKS };
}

// ---------- 부드러운 전환(현기증 유발 방지 — 짧고 감쇠하는 보간) ----------

/** half-life(초) 기반 감쇠 — dt(프레임 간격)가 커도 오버슈트하지 않는다. */
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

export function easeScalar(current: number, target: number, alpha: number): number {
  return current + (target - current) * alpha;
}

/** 회귀 테스트용 — 동일 지점에서 동시에 등장하는 타깃 간 최소 간격(월드 단위). */
export const MIN_TARGET_SPACING = 0.9;

export function pairwiseMinDistance(points: Vec3[]): number {
  let min = Infinity;
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      min = Math.min(min, vLen(vSub(points[i], points[j])));
    }
  }
  return Number.isFinite(min) ? min : Infinity;
}

export type { AxisId, CameraStage };
