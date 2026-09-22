// ====================================================
// XR 수의사 씬 레이아웃 — 순수 데이터 + 순수 함수 (G2.2-R2-L)
//
// React/Three.js 인스턴스에 의존하지 않는 순수 데이터·함수만 담는다
// (scenario.ts가 순수 데이터/집계 로직만 담는 것과 동일한 원칙 — 요리사
// interactions3d.ts와 같은 위치의 파일이지만, 요리사 파일을 import하지
// 않고 이 파일 안에서 자체 완결형으로 재구현했다. 드래그/평면교차 등
// 요리사 전용 로직은 필요 없다 — 수의사 시나리오는 select만 사용한다).
//
// 이 파일은 scenario.ts를 읽기만 한다(타입·CHOICE_POINTS/SPROUT_POINTS
// import) — scenario.ts 자체는 수정하지 않는다.
//
// [G2.2-R2-L 재설계 배경]
// 실제 화면 캡처에서 확인된 문제:
//   1) 강아지가 진찰대 뒤에 가려 거의 보이지 않고, 보호자·선배 수의사가
//      화면 양옆에서 잘림 — 원인은 (a) 캐릭터 앵커가 "발 위치"가 아니라
//      임의의 y값(1.35~1.5)에 떠 있어 실제로는 공중에 뜬 채로 렌더됐고,
//      (b) 지점별 카메라가 "그 지점의 타깃 + 강아지"만 프레이밍해 보호자·
//      선배 수의사가 프레이밍 계산에서 아예 빠지는 경우가 있었기 때문.
//   2) 선택 단계마다 카메라가 타깃을 따라 크게 이동 — cameraForPoint가
//      매 지점마다 타깃 무게중심으로 위치 자체를 재계산했기 때문.
//   3) 장면 속 큰 한글 라벨 카드가 겹침 — 선택형 타깃 3개 모두에 0.85x0.42
//      크기의 전체 문구 스프라이트를 띄웠기 때문.
//
// 해결 방향(R2-L):
//   - 캐릭터는 "발이 바닥(y=0)에 닿는" 루트 앵커에서 렌더한다.
//   - 카메라 position/lookAt을 지점과 무관하게 고정한다(HERO_CAMERA) —
//     오직 FOV만 "이번에 반드시 보여야 하는 점들"에 맞춰 완만하게 보정된다.
//
// [G2.2-R2-L2 추가 배경] 대표님 실제 화면 검수: 강아지·인물 배치는
// 개선됐지만, 여전히 "장면 속 큰 번호 카드"가 선택 대상·서로를 가리고
// 있었다(번호로 줄어도 카드가 화면의 주인공). 이번 라운드는:
//   - 추상 아이콘(idea/together/overview/compare)과 번호 배지를 완전히
//     제거하고, 기존 진료실 소품(강아지·보호자·선배 수의사·기록판·약장·
//     모니터·병원 사인)"만"을 선택 대상으로 재사용한다 — 모든 choice가
//     실제 diegetic 오브젝트를 가리키므로 별도 마커 레이어 자체가 없다.
//   - 상호작용은 그 오브젝트를 감싸는 보이지 않는 hit-box + (필요한 경우)
//     발밑/받침대 높이의 아주 작은 링으로만 표시한다(얼굴·몸통을 가리지
//     않는 위치). VetScene.tsx의 각 캐릭터/소품 컴포넌트가 직접 담당한다.
// ====================================================

import type { AxisId, Choice, CameraStage, Mode } from "./scenario";
import { CHOICE_POINTS, SPROUT_POINTS } from "./scenario";

export type Vec3 = [number, number, number];

/** XrVetClient의 진행 단계 — VetScene/CameraRig가 오버뷰/결과/지점별 카메라를 고를 때 쓴다. */
export type VetScenePhase = "intro" | "choosing" | "reaction" | "result";

/**
 * 3D 좌표 totality 가드. R3F는 position/rotation/scale/lookAt에
 * undefined·NaN·Infinity가 섞여 들어오면 "Cannot read properties of
 * undefined (reading 'z')" 같은 런타임 오류를 던진다(Canvas mount 자체가
 * 깨져 XrSceneGuard의 에러 바운더리가 fallback으로 전환하게 만든다).
 * 좌표를 계산하는 모든 함수의 출력이 이 predicate를 통과해야 한다는 것을
 * sceneLayout.test.ts가 전수 검증한다.
 */
export function isFiniteVec3(value: unknown): value is Vec3 {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((n) => typeof n === "number" && Number.isFinite(n))
  );
}

/** XrVetClient가 현재 선택 지점을 가리키는 안정적인 id를 만든다 (요리사와 동일 패턴, 파일은 독립). */
export function sceneInteractionId(mode: Mode, point: number): string {
  return `${mode}_p${point}`;
}

// ---------- 장면 속 대상 종류 ----------

/** 항상 씬에 상시 렌더되는 "실제 진료실 오브젝트"만 선택 대상이 될 수 있다.
 *  G2.2-R2-L2: 추상 아이콘(icon/variant)을 완전히 없애고, 모든 choice가
 *  이 중 하나의 진짜 소품/캐릭터를 가리키게 했다 — 별도 마커 레이어가
 *  없으므로 "카드가 화면의 주인공이 되는" 문제가 구조적으로 생기지 않는다. */
export type NamedTargetKind =
  | "dog"
  | "guardian"
  | "senior"
  | "clipboard"
  | "cabinet"
  | "monitor"
  | "pawSign";

export interface SceneTarget {
  kind: NamedTargetKind;
  position: Vec3;
}

export interface ResolvedTarget {
  target: SceneTarget;
  choice: Choice;
}

// ---------- 캐릭터 루트 앵커(바닥 기준) ----------
// VetScene의 <group position={...}>가 그대로 사용한다 — 이 좌표가 바로
// "발이 닿는 바닥 위치"다(캐릭터 내부 mesh는 이 원점 기준 로컬 좌표로만
// 쌓아올린다). 강아지는 낮고 단순해 몸통 중심을 루트 겸 타깃으로 쓴다.

export const DOG_ANCHOR: Vec3 = [0, 0.92, -0.85];
export const GUARDIAN_ANCHOR: Vec3 = [-1.0, 0, -0.95];
export const SENIOR_ANCHOR: Vec3 = [1.0, 0, -1.05];
export const CABINET_ANCHOR: Vec3 = [-1.4, 0, -1.85];

/** 캐릭터 전신 높이 근사(발~정수리) — 카메라가 몸 전체를 프레임에 담을 때 쓴다. */
export const CHARACTER_HEIGHT = 1.4;

/** 캐릭터 루트에서 "상호작용 타깃/라벨"이 위치할 가슴 높이 오프셋. */
const GUARDIAN_TARGET_OFFSET_Y = 0.95;
const SENIOR_TARGET_OFFSET_Y = 1.05;
const CABINET_TARGET_OFFSET_Y = 0.55;

export const GUARDIAN_TARGET: Vec3 = [
  GUARDIAN_ANCHOR[0],
  GUARDIAN_ANCHOR[1] + GUARDIAN_TARGET_OFFSET_Y,
  GUARDIAN_ANCHOR[2],
];
export const SENIOR_TARGET: Vec3 = [
  SENIOR_ANCHOR[0],
  SENIOR_ANCHOR[1] + SENIOR_TARGET_OFFSET_Y,
  SENIOR_ANCHOR[2],
];
export const CABINET_TARGET: Vec3 = [
  CABINET_ANCHOR[0],
  CABINET_ANCHOR[1] + CABINET_TARGET_OFFSET_Y,
  CABINET_ANCHOR[2],
];

/** 캐릭터 정수리 근사 — HERO_CAMERA가 항상 프레임에 담아야 하는 "몸 전체 범위" 계산용. */
export const GUARDIAN_HEAD_TOP: Vec3 = [
  GUARDIAN_ANCHOR[0],
  GUARDIAN_ANCHOR[1] + CHARACTER_HEIGHT,
  GUARDIAN_ANCHOR[2],
];
export const SENIOR_HEAD_TOP: Vec3 = [
  SENIOR_ANCHOR[0],
  SENIOR_ANCHOR[1] + CHARACTER_HEIGHT,
  SENIOR_ANCHOR[2],
];

/** 씬을 구성하는 상시 배경 소품 좌표 — VetScene이 참조한다. 모니터·병원 사인은
 *  평소엔 배경 소품이지만, 특정 지점에서는 SCENE_TARGETS를 통해 그대로
 *  상호작용 대상이 된다(새 마커를 만들지 않고 기존 소품을 재사용). */
export const TABLE_CENTER: Vec3 = [0, 0, -1.0];
export const CLIPBOARD_ANCHOR: Vec3 = [-0.15, 0.85, -0.65];
export const MONITOR_ANCHOR: Vec3 = [-1.15, 1.35, -2.25];
export const SCALE_ANCHOR: Vec3 = [-0.35, 0, -0.4];
export const WALL_SIGN_ANCHOR: Vec3 = [0, 2.0, -2.35];

// ---------- 지점별 씬 타깃 (choices[i] ↔ SCENE_TARGETS[id][i] 1:1) ----------
//
// 실제 매핑은 scenario.ts의 각 지점 choice 문구·순서를 그대로 따른다
// (문구는 여기서 복제하지 않고 choices 배열 인덱스로만 대응시킨다 —
// resolveTargets가 choices[i]와 짝지어 반환한다).
//
// G2.2-R2-L2: 더 이상 추상 아이콘이 없다 — "다른 방법을 생각해본다"류
// choice는 모니터(참고 화면)를, "전체 상황을 살핀다"는 병원 사인(공간
// 전체를 상징하는 기존 소품)을, "동물과 보호자를 함께 살펴본다"는 보호자
// 본인을 가리키는 식으로 실제 오브젝트에 재배정했다. 같은 물리적 오브젝트
// (예: 모니터)가 여러 지점에서 재사용되지만, 한 지점 안에서는 항상 서로
// 다른 오브젝트만 등장한다(중복 kind 없음 — sceneLayout.test.ts가 검증).

export const SCENE_TARGETS: Record<string, SceneTarget[]> = {
  // p1_a 관찰부터 시작 → 강아지 / p1_b 다른 확인 순서를 생각 → 모니터(참고 화면)
  // / p1_c 동물과 보호자를 함께 살펴본다 → 보호자
  compass_p1: [
    { kind: "dog", position: DOG_ANCHOR },
    { kind: "monitor", position: MONITOR_ANCHOR },
    { kind: "guardian", position: GUARDIAN_TARGET },
  ],
  // p2_a 선배에게 함께 들어달라 → 선배 수의사 / p2_b 순서대로 적어둔다 → 기록판
  // / p2_c 다른 기록 방법 생각 → 모니터
  compass_p2: [
    { kind: "senior", position: SENIOR_TARGET },
    { kind: "clipboard", position: CLIPBOARD_ANCHOR },
    { kind: "monitor", position: MONITOR_ANCHOR },
  ],
  // p3_a 전체 상황 먼저 살핀다 → 병원 사인(공간 전체 상징) / p3_b 두 상황 비교 → 모니터
  // / p3_c 선배와 역할 나눈다 → 선배 수의사
  compass_p3: [
    { kind: "pawSign", position: WALL_SIGN_ANCHOR },
    { kind: "monitor", position: MONITOR_ANCHOR },
    { kind: "senior", position: SENIOR_TARGET },
  ],
  // p4_a 바로 정리 시작 → 기록판 / p4_b 새로운 정리 방법 시도 → 모니터
  // / p4_c 기록 전체 다시 살펴본다 → 약장(보관된 기록)
  compass_p4: [
    { kind: "clipboard", position: CLIPBOARD_ANCHOR },
    { kind: "monitor", position: MONITOR_ANCHOR },
    { kind: "cabinet", position: CABINET_TARGET },
  ],
  // p5_a 정리한 기록 다시 확인 → 기록판 / p5_b 안내 순서 다시 정리 → 모니터
  // / p5_c 선배에게 확인받는다 → 선배 수의사
  compass_p5: [
    { kind: "clipboard", position: CLIPBOARD_ANCHOR },
    { kind: "monitor", position: MONITOR_ANCHOR },
    { kind: "senior", position: SENIOR_TARGET },
  ],
  // s1_a 보호자 이야기 먼저 듣는다 → 보호자 / s1_b 동물 먼저 살펴본다 → 강아지
  sprout_p1: [
    { kind: "guardian", position: GUARDIAN_TARGET },
    { kind: "dog", position: DOG_ANCHOR },
  ],
  // s2_a 선배에게 물어본다 → 선배 수의사 / s2_b 하나씩 적어본다 → 기록판
  sprout_p2: [
    { kind: "senior", position: SENIOR_TARGET },
    { kind: "clipboard", position: CLIPBOARD_ANCHOR },
  ],
  // s3_a 익숙한 방법으로 안내 → 보호자 / s3_b 새롭게 안내해본다 → 모니터
  sprout_p3: [
    { kind: "guardian", position: GUARDIAN_TARGET },
    { kind: "monitor", position: MONITOR_ANCHOR },
  ],
};

/** choices[i] ↔ SCENE_TARGETS[id][i]를 인덱스로 짝짓는다. 길이가 다르면(설정 오류) 짧은 쪽까지만 짝짓는다.
 *  G2.2-R2-L2: 장면 안에는 더 이상 문구·번호 라벨을 전혀 그리지 않는다 — 실제 오브젝트
 *  (강아지·보호자·선배 수의사·기록판·약장·모니터·병원 사인) 자체가 탭 대상이고, 정확한
 *  선택 문구는 Canvas 밖 HTML 선택지(XrVetClient.tsx)에서만 읽는다. */
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

// ---------- 회귀 검증용: 지점별 point 배열과 choices 배열 ----------
// sceneLayout.test.ts가 "모든 mode·point에서 target 개수 === choices 개수"를
// 검증할 때 scenario.ts를 다시 순회하지 않고 이 매핑을 통해 확인한다.

export const MODE_POINT_CHOICES: Record<Mode, Choice[][]> = {
  compass: CHOICE_POINTS.map((p) => p.choices),
  sprout: SPROUT_POINTS.map((p) => p.choices),
};

// ---------- 카메라: 고정 위치 + 지점별 FOV 보정 ----------
//
// G2.2-R2-L — 이전(R2)에는 지점마다 타깃 무게중심으로 카메라 position을
// 다시 계산했다(cameraFor). 이 방식이 "카메라가 타깃을 따라 크게 이동"
// 문제의 직접 원인이었다. 이제 카메라 position/lookAt은 HERO_CAMERA로
// 고정하고, 오직 FOV만 "이번에 반드시 보여야 하는 점들"에 맞춰 보정한다.
// 핀홀 카메라 삼각함수 자체는 요리사 interactions3d.ts와 같은 원리이지만,
// 이 파일 안에서 독립적으로(파일 import 없이) 다시 구현했다.

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

/** 카메라 기준 정규직교 축(forward/right/up) — world up = +Y 규약(three.js와 동일). */
function cameraBasis(cameraPos: Vec3, lookAt: Vec3): { forward: Vec3; right: Vec3; up: Vec3 } {
  const forward = vNormalize(vSub(lookAt, cameraPos));
  const worldUp: Vec3 = [0, 1, 0];
  let right = vNormalize(vCross(forward, worldUp));
  if (vLen(right) < 1e-6) right = [1, 0, 0];
  const up = vNormalize(vCross(right, forward));
  return { forward, right, up };
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
  const { forward, right, up } = cameraBasis(cameraPos, lookAt);

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

/**
 * 점 하나를 카메라 기준 NDC(정규화 화면 좌표, x/y 각각 [-1,1]이면 화면 안)로
 * 투영한다. 카메라 뒤에 있으면 null. 실제 화면 픽셀 크기 없이 NDC만 반환하므로
 * 테스트가 임의의 aspect에서 "잘리지 않는가"를 좌표 수준에서 재확인할 수 있다.
 *
 * [주의] 이 함수와 이 함수를 쓰는 테스트는 "카메라 수학이 맞는가"만 검증한다 —
 * 실제 R3F Canvas가 그 수학대로 그려지는지, 사람 눈에 어떻게 보이는지는
 * 검증하지 않는다(완료 보고 참고). 시각 검수를 대체하지 않는다.
 */
export function projectToNdc(
  cameraPos: Vec3,
  lookAt: Vec3,
  fovDeg: number,
  aspect: number,
  point: Vec3,
): { ndcX: number; ndcY: number } | null {
  const { forward, right, up } = cameraBasis(cameraPos, lookAt);
  const rel = vSub(point, cameraPos);
  const depth = vDot(rel, forward);
  if (depth <= 0.05) return null;
  const tanHalfV = Math.tan((fovDeg * Math.PI) / 180 / 2);
  const tanHalfH = tanHalfV * Math.max(0.01, aspect);
  if (tanHalfV <= 1e-6 || tanHalfH <= 1e-6) return null;
  return {
    ndcX: vDot(rel, right) / depth / tanHalfH,
    ndcY: vDot(rel, up) / depth / tanHalfV,
  };
}

/** "이 지점에서 반드시 보여야 하는" 점 목록에 타깃 주변 여유 반경(배지·링 포함 근사)을 더한다.
 *  R2-L에서는 핵심 인물의 실제 발~정수리 좌표를 이미 points에 포함시키므로, 이 반경은
 *  "몸 전체를 근사"하는 용도가 아니라 배지·링 여유분만 담당한다(값을 0.55→0.3으로 축소). */
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

/** 좌표 목록(배지·링 여유 반경 포함) 기준 프레이밍 포인트. */
export function framingPointsForPositions(points: Vec3[]): Vec3[] {
  return withPadding(points, 0.3);
}

/**
 * G2.2-R2-L — 고정 카메라 position/lookAt. 어떤 mode·phase·point에서도
 * 이 값은 바뀌지 않는다(오직 FOV만 보정된다) — "카메라가 타깃을 따라
 * 크게 이동"하는 문제를 구조적으로 제거한다.
 */
export const HERO_CAMERA_POSITION: Vec3 = [0, 1.6, 2.9];
export const HERO_CAMERA_LOOKAT: Vec3 = [0, 0.95, -1.0];

/** 모든 phase에서 항상 프레임에 있어야 하는 핵심 3인 — 강아지 몸통 중심 +
 *  보호자·선배 수의사의 발~정수리(몸 전체 범위). */
export const CORE_FRAMING_POINTS: Vec3[] = [
  DOG_ANCHOR,
  GUARDIAN_ANCHOR,
  GUARDIAN_HEAD_TOP,
  SENIOR_ANCHOR,
  SENIOR_HEAD_TOP,
];

/** 결과 화면 전용 완료 배지 위치 — CORE_FRAMING_POINTS와 함께 항상 프레임 안에 들어오도록
 *  hero 카메라 tanV 여유 범위 안쪽으로 잡았다(VetScene.tsx의 CompletionBadge와 좌표를 공유). */
export const RESULT_BADGE_POINT: Vec3 = [0, 1.85, -1.1];

function heroCamera(extraPoints: Vec3[]): { position: Vec3; lookAt: Vec3; points: Vec3[] } {
  return {
    position: HERO_CAMERA_POSITION,
    lookAt: HERO_CAMERA_LOOKAT,
    points: [...CORE_FRAMING_POINTS, ...extraPoints],
  };
}

/** 특정 지점(sceneInteractionId)의 카메라 — position/lookAt은 항상 HERO_CAMERA로
 *  고정이고, 그 지점의 타깃들만 "추가로 반드시 보여야 하는 점"에 더한다. */
export function cameraForPoint(id: string): { position: Vec3; lookAt: Vec3; points: Vec3[] } {
  const targets = SCENE_TARGETS[id] ?? [];
  return heroCamera(targets.map((t) => t.position));
}

/** intro 화면 — 핵심 3인만 프레임에 담으면 된다(선택 타깃 없음). */
export function overviewCamera(): { position: Vec3; lookAt: Vec3; points: Vec3[] } {
  return heroCamera([]);
}

/** 결과 화면 — 핵심 3인 + 완료 배지가 함께 프레임에 담긴다. */
export function resultCamera(): { position: Vec3; lookAt: Vec3; points: Vec3[] } {
  return heroCamera([RESULT_BADGE_POINT]);
}

export interface ScenePresentation {
  camera: { position: Vec3; lookAt: Vec3; points: Vec3[] };
  /** phase === "choosing"일 때만 값이 있다 — 그 외에는 null(인터랙션 타깃 없음) */
  sceneId: string | null;
  /** sceneId가 null이면 항상 빈 배열 */
  targets: ResolvedTarget[];
}

/**
 * VetScene(CameraRig + 인터랙션 타깃)이 매 프레임/매 렌더 참조하는 "이번에
 * 보여줄 화면" 하나로 묶은 단일 진입점. intro는 overview 카메라, result는
 * result 카메라(완료 배지 포함), choosing/reaction은 현재 (mode, point)의
 * 카메라를 쓴다 — reaction에서도 같은 카메라를 유지해 CONTINUE 전까지
 * 화면이 갑자기 바뀌지 않는다. 어느 경우든 position/lookAt은 HERO_CAMERA로
 * 항상 동일하다 — 오직 camera.points(따라서 FOV)만 phase별로 다르다.
 * choices는 phase==="choosing"일 때만 의미가 있고, 그 외에는 호출부가 빈
 * 배열을 넘겨도 sceneId 자체가 null이라 targets도 항상 빈 배열이다.
 */
export function resolveScenePresentation(
  mode: Mode,
  phase: VetScenePhase,
  point: number,
  choices: Choice[],
): ScenePresentation {
  const camera =
    phase === "intro"
      ? overviewCamera()
      : phase === "result"
        ? resultCamera()
        : cameraForPoint(sceneInteractionId(mode, point));
  const sceneId = phase === "choosing" ? sceneInteractionId(mode, point) : null;
  const targets = sceneId ? resolveTargets(sceneId, choices) : [];
  return { camera, sceneId, targets };
}

// ---------- 부드러운 전환(현기증 유발 방지 — 짧고 감쇠하는 보간) ----------
// position/lookAt이 고정이라 더 이상 이 값들을 보간할 필요는 없지만, FOV
// 전환은 여전히 완만하게 이어지는 편이 자연스러워 그대로 둔다.

/** half-life(초) 기반 감쇠 — dt(프레임 간격)가 커도 오버슈트하지 않는다. */
export function easeAlpha(dt: number, halfLifeSeconds: number): number {
  if (halfLifeSeconds <= 0) return 1;
  return 1 - Math.pow(0.5, dt / halfLifeSeconds);
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
