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

/**
 * G2.1-R1-F15 — 1~3단계(나침반 1/5~3/5, 새싹 1/3~3/3) 라벨 가독성 보정 대상 여부.
 * sceneInteractionId(`${mode}_p${point}`)에서 point만 파싱해 판단한다 — 카메라
 * stage나 interactionKind로 추론하지 않는 것은 sceneInteractionId 자체의 설계
 * 원칙(파일 상단 주석)과 같다. 4~5단계(plating)는 이미 상대적으로 읽기 쉬워
 * 대상에서 제외한다.
 */
export function isEarlyReadabilityStage(sceneInteractionId: string): boolean {
  const match = /_p(\d+)$/.exec(sceneInteractionId);
  if (!match) return false;
  return Number(match[1]) <= 3;
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
  // 나침반 지점1 — 조리대 개관(select): 재료 쪽/도마 쪽/주문표 쪽 3타겟
  // (라벨 스프라이트 폭 0.85 기준 서로 1.0 이상 떨어뜨려 겹침 방지)
  //
  // G2.1-R1-F10 — 타겟1을 [-0.9, 1.32, -1.15] → [1.95, 1.25, -1.3]으로 옮겼다.
  // 이전 좌표는 냄비(pot: 중심 [-0.9, 1.25, -1.2], 반경 0.35, y 1.075~1.425)의
  // xz 중심과 사실상 같은 자리(수평 거리 0.05)에 y까지 냄비 높이 범위 안이라
  // 선택 mesh(반경 0.17)가 통째로 냄비 속에 들어가 있었다. 375px 실브라우저
  // 투영으로 재면 mesh 화면 bbox가 냄비 실루엣과 그대로 교차했고(겹침),
  // 라벨은 냄비 윗면과 0.6px 떨어져 있어 사실상 냄비에 얹힌 것처럼 보였다.
  // 같은 이유로 이 라벨이 타겟3("조리대 전체를 살펴본다") 라벨과도 화면에서
  // 겹쳐, 선택지 하나가 가려졌다(compass_p4·p5의 파묻힘과 같은 계열).
  //
  // 새 좌표는 실제 approach 카메라·FOV·375px 투영으로 후보를 비교해 골랐다.
  //  - 냄비까지 라벨 104.3px / mesh 117.7px (요구 10px 이상) — 375px 기준
  //  - 타겟3 라벨과 11.5px 벌어져 교차 없음 (이전에는 겹침)
  //  - 세 타겟의 화면 크기 비 1.13 (원근 왜곡 없음), 후드·Canvas 경계 침범 없음
  //  - 조리대 상판(y 1.06) 위 y=1.25, 조리대 풋프린트(x ±2.05, z -1.85~-0.55) 안
  // 냄비는 배경 소품으로 두고, 선택지는 재료·보관대 쪽 빈 조리대로 내보냈다.
  // 타겟2·3과 다른 앵커는 건드리지 않는다.
  compass_p1: {
    kind: "select",
    targets: [
      [1.95, 1.25, -1.3],
      [0.8, 1.32, -1.0],
      [-1.55, 1.75, -1.55],
    ],
  },
  // 나침반 지점2 — 조리대 재료 3개(같은 높이·같은 깊이의 가로 한 줄) → 도마 옆 드롭존 1개
  //
  // G2.1-R1-F6 — 지그재그 배치를 가로 한 줄로 교체했다.
  // 이전 3번 토큰은 [1.7, 1.55, -2.15]로 혼자 높이 떠 있었는데, 드래그 평면은
  // 토큰 자신의 높이(planeY = origin[1] = 1.55)라서 그 평면이 search stage 카메라
  // 높이(y=1.40)보다 0.15 "위"에 있었다. 카메라보다 위에 있는 수평면은 시선과
  // 5° 수준으로 스치듯 만나기 때문에, 라벨을 잡는 순간 교차점이 카메라 코앞
  // (깊이 4.8 → 1.6)으로 튀고, 포인터를 조금만 내려도 교차점이 깊이 60 밖으로
  // 날아갔다가 아예 교차하지 않게 된다. 화면에서는 "좌우로 가는 게 아니라
  // 앞뒤로 움직이며 커졌다 작아지는" 것으로 보인다(Gate C 신고 증상).
  // 세 토큰을 모두 조리대 높이(y=1.12, 카메라보다 0.28 아래)의 같은 z 줄에
  // 두면 드래그 평면이 전부 카메라 아래로 내려와 좌우 이동이 화면 좌우 이동으로
  // 그대로 대응된다. x 간격 0.70은 라벨 폭(0.58)과 hit area 비겹침 상한을 함께
  // 만족하는 값이다. 이 배치는 compass_p2 전용이며 sprout_p2는 건드리지 않는다.
  //
  // G2.1-R1-F8 — 첫 토큰만 x 0.65 → -0.15로 옮겼다(y·z는 그대로).
  // F6의 x=0.65는 375px 실브라우저에서 "선배에게 물어본다" 라벨이 드롭존 라벨
  // "여기에 놓기" 뒤에 거의 완전히 가려졌다. 원인은 월드 좌표 거리가 아니라 투영이다:
  // 드롭존(z=-1.05)은 토큰 줄(z=-1.75)보다 카메라에 0.7 가까워 라벨이 50.2px → 61.6px로
  // 더 크게 그려지고, 두 라벨의 화면 x 구간이 166.8~217.0 / 165.7~227.3으로
  // 51.3px 겹쳤다(= 첫 라벨 폭보다 큰 겹침). 라벨 sprite는 depthTest:false라
  // 앞뒤 관계 없이 그려지므로 겹치면 그대로 가려진다.
  // x=-0.15는 375px 실제 카메라·FOV(60.51°, distanceScale 1.0) 투영으로 고른 값이다:
  //  - 두 라벨 화면 가로 간격 +15.8px (요구 12px 이상), bbox 교차 없음
  //  - 첫 토큰 라벨 좌단이 냄비 몸통 화면 우단보다 2.0px 오른쪽 → 냄비에 묻히지 않음
  //    (x=-0.18부터 라벨이 냄비 위로 올라타므로 더 왼쪽으로 가지 않는다)
  //  - 재료 mesh는 냄비 몸통에서 17.4px 여백
  //  - hit area 53.1 CSS px (F5 기준 48px 이상), 비겹침 상한 1.330 그대로
  //  - framing 점이 좁아지지 않아 FOV·distanceScale이 F7과 동일 → 2·3번 토큰 지표 불변
  // 2·3번 토큰과 sprout_p2는 건드리지 않는다.
  compass_p2: {
    kind: "place",
    tokens: [
      [-0.15, 1.12, -1.75],
      [1.35, 1.12, -1.75],
      [2.05, 1.12, -1.75],
    ],
    dropZone: [0.4, 1.1, -1.05],
    dropRadius: 0.36,
  },
  // 나침반 지점3 — 조리대 위 순서 타일 3개(작은 라벨) + 확인 프롭
  // G2.1-R1-F3 보정: 이전 좌표(슬롯 간격 0.55, 슬롯3-확인 간격 0.522)는
  // 라벨 폭(LABEL_SCALE_SMALL[0]=0.58)보다 가까워 라벨끼리 겹쳤다. 슬롯
  // 간격을 0.62로 넓히고, 전체를 냄비(pot) 쪽에서 오른쪽으로 밀었다.
  // G2.1-R1-F4 보정: F3 간격(0.62/0.69)은 겹침은 없었지만 실브라우저에서
  // "밀집도가 높다"는 판정을 받았다. 간격을 0.70/0.73으로 더 넓히고,
  // 냄비 반경(0.35+타일 반폭 0.2+여유 0.05=0.6) 밖으로 슬롯0을 더
  // 확실히 밀었다.
  compass_p3: {
    kind: "order",
    slots: [
      [-0.28, 1.18, -1.2],
      [0.42, 1.18, -1.2],
      [1.12, 1.18, -1.2],
    ],
    confirm: [1.85, 1.18, -1.0],
  },
  // 나침반 지점4 — 동료/협업 관련 타겟 3개
  // G2.1-R1-F4 보정 1차: 기존 좌표의 타겟1([-0.9,1.2,-1.0])은 냄비(pot, position
  // [-0.9,1.25,-1.2], 반경 0.35) 중심에서 0.2만큼만 떨어져 있어 사실상 냄비
  // 속에 파묻혀 있었고, 타겟3([-0.15,1.55,-1.35])은 라벨 상단(mesh.y + 0.34 +
  // 0.21 = 2.10)이 후드(hood, position [0,2.2,-1.2], size [1.4,0.5,0.8] →
  // y 1.95~2.45, x -0.7~0.7, z -1.6~-0.8) 바닥보다 위로 올라가 라벨이 후드
  // 속에 파묻혀 있었다. 실브라우저에서는 depthTest가 꺼진 라벨이 후드 앞에
  // 그대로 그려져 "타겟과 동떨어진 곳에 라벨이 떠 있는" 것처럼 보였다(Gate C:
  // "라벨과 선택 오브젝트가 시각적으로 가까워 혼잡").
  // G2.1-R1-F4 보정 2차: 1차 보정 좌표는 냄비·후드는 피했지만, 타겟3([0.12,
  // 1.4,-0.62])이 카메라(z=0.6)에 다른 두 타겟(z≈-1.55)보다 훨씬 가까워
  // (카메라로부터의 깊이 비율 약 1.8배) 원근감 때문에 화면에서 압도적으로
  // 크게 보이고 다른 타겟은 상대적으로 작아 보이는 문제가 실브라우저에서
  // 확인됐다. 세 타겟의 카메라 깊이 비율을 1.35 이하로 제한해 비슷한
  // 크기로 보이도록 재배치했다(냄비·후드·조리대 상판 회피, 상호 0.85
  // 이상 간격은 그대로 유지).
  compass_p4: {
    kind: "select",
    targets: [
      [0.97, 1.2, -1.49],
      [-1.15, 1.67, -1.53],
      [-0.32, 1.16, -1.19],
    ],
  },
  // 나침반 지점5 — 전달대/안내 관련 타겟 3개 (지점4와 다른 위치, 넓게 배치)
  // G2.1-R1-F1 보정 1차: 이전 좌표(z가 +0.5~1.15)는 plating 카메라(lookAt z=-1.1,
  // 카메라 z=0.6 — 즉 -z 방향을 바라봄)의 시야 반대쪽(카메라 뒤/옆)에 있어
  // 렌더링 자체가 되지 않는 버그였다.
  // G2.1-R1-F1 보정 2차: 그 다음 좌표(y=1.0~1.05)는 조리대 상판(y≈0.98~1.06,
  // Kitchen()의 "조리대 상판" 박스)과 같은 높이라 상판 안에 파묻혀 카메라 각도에서
  // 거의 가려져 안 보이는 버그였다.
  // G2.1-R1-F2 보정 3차: 타겟 3개가 서로 0.6~0.77 거리로 붙어 있어 라벨
  // 스프라이트 폭(0.85)보다 가까워 라벨끼리 겹쳤다.
  // G2.1-R1-F4 보정 4차: F2에서 냄비·조리대 상판은 피했지만 후드(hood)는
  // 확인하지 않았다 — 타겟1의 라벨 상단이 후드 바닥보다 위였다(compass_p4와
  // 같은 계열의 버그).
  // G2.1-R1-F4 보정 5차: 4차 보정 좌표도 compass_p4와 같은 이유로 타겟 간
  // 카메라 깊이 비율이 커서(원근감으로 한 타겟만 거대해 보임) 재배치했다.
  // 깊이 비율을 1.35 이하로 제한하면서 냄비·후드·조리대 상판을 모두 피하고
  // 상호 0.85 이상 간격을 유지한다(회귀 테스트로 고정).
  compass_p5: {
    kind: "select",
    targets: [
      [0.04, 1.33, -1.44],
      [-0.46, 1.16, -0.73],
      [0.94, 1.23, -1.57],
    ],
  },
  // 새싹 지점1 — compass_p1의 2타겟 버전
  // G2.1-R1-F10 — compass_p1과 같은 타겟1 좌표를 공유하므로 같은 냄비 파묻힘이
  // 있었다(2타겟이라 프레이밍이 달라 별도로 375px·1280px 투영을 재검증했다).
  // 타겟2는 그대로 두고 타겟1만 compass_p1과 동일하게 옮긴다.
  sprout_p1: {
    kind: "select",
    targets: [
      [1.95, 1.25, -1.3],
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
  // 새싹 지점3 — compass_p4의 2타겟 버전(타겟1은 F10에서 별도 좌표로 분리)
  //
  // G2.1-R1-F10 — 타겟1("익숙하게 담아본다")을 [-0.9, 1.2, -1.0] →
  // [1.5, 1.25, -1.1]으로 옮겼다. 이전 좌표는 냄비 xz 중심에서 수평 0.2,
  // y도 냄비 범위(1.075~1.425) 안이라 mesh가 냄비에 파묻혔고, plating 카메라는
  // 조리대에 바짝 붙어 있어 냄비 실루엣이 화면 왼쪽을 크게 차지한 탓에
  // 라벨까지 냄비 위에 걸쳐 그려졌다(375px 실브라우저 QA 신고 증상).
  // 라벨 sprite는 depthTest:false라 앞뒤 관계로는 해결되지 않는다.
  //
  // 새 좌표는 실제 plating 카메라·FOV·375px 투영으로 골랐다.
  //  - 냄비까지 라벨 92.1px / mesh 108.2px (요구 10px 이상) — 375px 기준
  //  - "새롭게 담아본다" 라벨과 12.3px 벌어져 교차 없음
  //  - 두 타겟의 화면 크기 비 1.03 (원근 왜곡 없음)
  //  - sprout_p2 드롭존([0.4, 1.1, -1.05])과 xz로 1.10 떨어져 혼동되지 않음
  // plating 카메라 정면·조리대 상판 위·조리대 풋프린트 안을 모두 만족한다.
  // 타겟2("새롭게 담아본다")는 회귀 방지를 위해 그대로 둔다.
  sprout_p3: {
    kind: "select",
    targets: [
      [1.5, 1.25, -1.1],
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

/**
 * G2.1-R1-F15 — "여기에 놓기" 드롭존 라벨 전용 축소 스프라이트.
 *
 * compass_p2/sprout_p2의 토큰 줄(z=-1.75)보다 드롭존(z=-1.05)이 카메라에
 * 0.7 가까워, 드롭존 라벨이 LABEL_SCALE_SMALL 그대로면 토큰 라벨보다 화면에서
 * 더 크게 그려진다. F8은 첫 토큰의 x를 옮겨 이 중 하나(토큰0-드롭존) 겹침만
 * 해결했는데, 375px 투영으로 재보면 두 번째 토큰("수납장을 차례로 확인한다")
 * 라벨과는 여전히 6.4px 겹쳐 있었다(G2.1-R1-F15에서 새로 확인). 토큰 위치를
 * 다시 옮기면 F6/F7/F8이 이미 맞춰 둔 토큰-토큰 간격·드래그 평면·hit area를
 * 연쇄적으로 다시 검증해야 해 회귀 위험이 크므로, 대신 "드롭존 라벨만" 더
 * 작게 그려 두 토큰 모두와 겹치지 않게 한다 — 드롭 판정(dropRadius)·토큰
 * 좌표·프레이밍 계산(framingPointsForAnchor는 기존 LABEL_SCALE_SMALL 기준을
 * 그대로 써 더 넉넉하게(보수적으로) 프레임을 잡으므로 화면 밖으로 잘릴 위험은
 * 없다)은 전혀 건드리지 않는다.
 */
export const DROP_ZONE_LABEL_SCALE: [number, number] = [0.42, 0.22];

/**
 * G2.1-R1-F5 — place 토큰의 "보이지 않는 통합 터치 영역" 크기. 실제 재료
 * mesh(0.22 정육면체)보다 훨씬 크게, 라벨(LABEL_SCALE_SMALL) 세로 범위까지
 * 포함하도록 잡아 라벨을 클릭·터치해도 같은 드래그 대상으로 인식되게 한다
 * (Gate C: 375px에서 라벨 영역을 드래그하려 하면 잘 잡히지 않는 문제).
 * 토큰 원점 기준 로컬 좌표로, Y만 위로 띄워(PLACE_HIT_AREA_CENTER_Y) 재료
 * mesh와 그 위 라벨을 하나의 영역으로 감싼다. 이 값은 "화면에서 몇 px이냐"가
 * 아니라 라벨·재료를 덮는 최소 world 크기이며, 좁은 화면에서 실제 터치 크기는
 * placeHitAreaScale이 화면 px을 측정해 이 값을 키워서 맞춘다(줄이지는 않는다).
 * 키울 때의 상한은 maxNonOverlappingHitAreaScale이 정하므로 옆 토큰과 겹쳐
 * 잘못된 choice가 선택되는 일은 어떤 화면 크기에서도 생기지 않는다.
 */
export const PLACE_HIT_AREA_SIZE: Vec3 = [0.5, 0.58, 0.3];
export const PLACE_HIT_AREA_CENTER_Y = 0.165;

/**
 * 375px 같은 좁은 화면에서 손가락으로 누를 수 있어야 하는 최소 터치 크기(CSS px).
 * world 크기(PLACE_HIT_AREA_SIZE)는 화면 크기·FOV·카메라 거리에 따라 실제
 * 화면에서 몇 px이 되는지가 달라지므로, 이 값은 "고정 world 배율"이 아니라
 * projectedBoxScreenSize로 매 프레임 실제 측정한 px을 기준으로 보장한다.
 */
export const PLACE_HIT_AREA_MIN_PX = 48;

/**
 * G2.1-R1-F3 — place 드롭존 시각 강조: 드롭 판정 반경(dropRadius)은 그대로 두고
 * (판정 로직 변경 금지), 눈에 보이는 외곽선 링만 이 배율만큼 더 크게 그린다.
 * SceneInteractions.tsx가 실제 렌더링에, framingPointsForAnchor가 카메라
 * 프레이밍 계산에 동일한 값을 써야 "커진 링이 화면 밖으로 잘리는" 일이 없다.
 */
export const DROP_ZONE_RING_MULTIPLIER = 1.4;

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

/**
 * G2.1-R1-F3: place 드롭존의 확대된 외곽선 링(조리대 표면 XZ 평면에 눕는
 * 원반)이 프레임 밖으로 잘리지 않도록, 링이 뻗는 좌우/앞뒤 끝점 4개를
 * "반드시 보여야 하는 점"에 포함시킨다. 라벨은 항상 카메라를 향해 세워지는
 * billboard라 world X/Y로 근사하지만(labelCorners 주석 참고), 이 링은
 * 실제로 XZ 평면에 눕는 지오메트리라 X/Z로 근사하는 쪽이 더 정확하다.
 */
function ringEdgePoints(center: Vec3, radius: number): Vec3[] {
  return [
    [center[0] - radius, center[1], center[2]],
    [center[0] + radius, center[1], center[2]],
    [center[0], center[1], center[2] - radius],
    [center[0], center[1], center[2] + radius],
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
    // G2.1-R1-F3: 드롭존에 "여기에 놓기" 라벨과 확대 외곽선 링이 추가되어,
    // 더 이상 "라벨 없음"이 아니다 — 둘 다 프레이밍 계산에 포함해야 잘리지 않는다.
    const dropLabelPoints = labelCorners(
      anchor.dropZone,
      LABEL_OFFSET_SMALL,
      LABEL_HALF_WIDTH_SMALL,
      LABEL_HALF_HEIGHT_SMALL,
    );
    const dropRingPoints = ringEdgePoints(
      anchor.dropZone,
      anchor.dropRadius * DROP_ZONE_RING_MULTIPLIER,
    );
    return [...tokenPoints, anchor.dropZone, ...dropLabelPoints, ...dropRingPoints];
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

// ---------- 카메라: 단계별 좌표 + 화면 픽셀 환산 ----------

/**
 * 단계별 카메라 좌표 테이블 (position + lookAt 쌍).
 * ChefScene의 CameraRig가 렌더링에, place hit area의 px 환산 테스트가 검증에
 * 같은 값을 써야 하므로 순수 데이터인 이 파일에 둔다.
 * 조리대(중심 [0, 1, -1.2])가 항상 프레임에 들어오도록 이동 폭은 보수적으로 유지한다.
 */
export const CAMERA_STAGES: Record<CameraStage, { position: Vec3; lookAt: Vec3 }> = {
  // 주방 전체 기본 시점 (intro) — v0.1 초기 시점과 동일한 위치
  overview: { position: [0, 1.8, 3.2], lookAt: [0, 1.1, -1.2] },
  // 지점1: 조리대 쪽으로 약간 접근 — 작업 시작 느낌
  approach: { position: [0, 1.6, 2.3], lookAt: [0, 1.0, -1.2] },
  // 지점2: 조리대 아래·측면 쪽 — 무언가 찾는 느낌
  search: { position: [-1.0, 1.4, 2.1], lookAt: [0.2, 0.8, -1.2] },
  // 지점3: 살짝 뒤로 물러나 조리대 전체 — 상황을 살피는 느낌
  survey: { position: [0, 2.1, 3.6], lookAt: [0, 1.0, -1.2] },
  // 지점4·5: 조리대 위 접시 쪽으로 근접 — 마무리 작업 느낌
  plating: { position: [0.4, 1.6, 0.6], lookAt: [0.1, 1.05, -1.1] },
  // 결과 화면 전용, 완성된 접시와 전달대 쪽을 비추는 축하 연출
  celebrate: { position: [0.6, 1.5, 1.4], lookAt: [0.3, 1.05, -0.6] },
};

/** fitCameraFraming의 distanceScale을 적용한 실제 카메라 위치 (CameraRig와 테스트가 공유). */
export function scaledCameraPosition(basePos: Vec3, lookAt: Vec3, distanceScale: number): Vec3 {
  return [
    lookAt[0] + (basePos[0] - lookAt[0]) * distanceScale,
    lookAt[1] + (basePos[1] - lookAt[1]) * distanceScale,
    lookAt[2] + (basePos[2] - lookAt[2]) * distanceScale,
  ];
}

/** 카메라 한 대의 화면 투영 상태 — 월드↔화면 변환에 필요한 최소 정보 */
export interface ScreenView {
  cameraPos: Vec3;
  /** 카메라가 바라보는 단위 방향 벡터 (three의 camera.getWorldDirection 결과) */
  forward: Vec3;
  /** THREE.PerspectiveCamera.fov와 같은 "수직" FOV(degree) */
  fovDeg: number;
  /** canvas의 실제 CSS 픽셀 크기 */
  viewportWidthPx: number;
  viewportHeightPx: number;
}

export interface ProjectedBoxInput extends ScreenView {
  /** 박스 중심(월드 좌표) */
  center: Vec3;
  /** 박스의 x/y/z 전체 크기(월드 단위) */
  size: Vec3;
}

/** 카메라 기준 정규직교 축. three가 만드는 view 행렬과 같은 규약(world up = +Y). */
function cameraBasis(forward: Vec3): { fwd: Vec3; right: Vec3; up: Vec3 } {
  const fwd = vNormalize(forward);
  let right = vNormalize(vCross(fwd, [0, 1, 0]));
  if (vLen(right) < 1e-6) right = [1, 0, 0];
  return { fwd, right, up: vNormalize(vCross(right, fwd)) };
}

/**
 * 월드 좌표 한 점을 canvas CSS 픽셀 좌표로 투영한다(카메라 뒤면 null).
 * G2.1-R1-F6 — "화면에서 실제로 어느 방향으로 움직이는지"를 고정 월드 좌표가
 * 아니라 실제 카메라·viewport 기준으로 검증하기 위해 쓴다.
 */
export function projectPointToScreen(
  point: Vec3,
  { cameraPos, forward, fovDeg, viewportWidthPx, viewportHeightPx }: ScreenView,
): { xPx: number; yPx: number; depth: number } | null {
  const { fwd, right, up } = cameraBasis(forward);
  const rel = vSub(point, cameraPos);
  const depth = vDot(rel, fwd);
  if (depth <= 0.05) return null;
  const tanHalfV = Math.tan((fovDeg * Math.PI) / 180 / 2);
  const aspect = viewportHeightPx > 0 ? viewportWidthPx / viewportHeightPx : 1;
  const tanHalfH = tanHalfV * aspect;
  if (tanHalfV <= 1e-6 || tanHalfH <= 1e-6) return null;
  return {
    xPx: ((vDot(rel, right) / depth / tanHalfH) * 0.5 + 0.5) * viewportWidthPx,
    yPx: (1 - ((vDot(rel, up) / depth / tanHalfV) * 0.5 + 0.5)) * viewportHeightPx,
    depth,
  };
}

/**
 * canvas CSS 픽셀 좌표에서 카메라가 쏘는 광선을 만든다 — R3F가 pointer 이벤트마다
 * event.ray로 넘겨주는 것과 같은 광선이다. intersectRayWithPlaneY와 짝을 이뤄
 * "이 화면 지점을 끌면 토큰이 어디로 가는가"를 순수 함수로 재현할 수 있다.
 */
export function cameraRayForScreenPoint(
  xPx: number,
  yPx: number,
  { cameraPos, forward, fovDeg, viewportWidthPx, viewportHeightPx }: ScreenView,
): { origin: Vec3; direction: Vec3 } {
  const { fwd, right, up } = cameraBasis(forward);
  const tanHalfV = Math.tan((fovDeg * Math.PI) / 180 / 2);
  const aspect = viewportHeightPx > 0 ? viewportWidthPx / viewportHeightPx : 1;
  const tanHalfH = tanHalfV * aspect;
  const ndcX = (xPx / viewportWidthPx) * 2 - 1;
  const ndcY = -((yPx / viewportHeightPx) * 2 - 1);
  return {
    origin: cameraPos,
    direction: vNormalize([
      fwd[0] + right[0] * ndcX * tanHalfH + up[0] * ndcY * tanHalfV,
      fwd[1] + right[1] * ndcX * tanHalfH + up[1] * ndcY * tanHalfV,
      fwd[2] + right[2] * ndcX * tanHalfH + up[2] * ndcY * tanHalfV,
    ]),
  };
}

/**
 * 축 정렬 박스가 현재 카메라·화면에서 차지하는 화면 크기(CSS px)를 측정한다.
 * 8개 꼭짓점을 모두 투영해 화면상 bounding box를 구하므로, 박스를 비스듬히
 * 보는 각도까지 반영된 "실제로 손가락이 닿을 수 있는 크기"가 나온다.
 * 카메라 뒤로 넘어간 꼭짓점이 하나라도 있으면 측정 불가로 보고 0을 돌려준다.
 */
export function projectedBoxScreenSize({
  center,
  size,
  cameraPos,
  forward,
  fovDeg,
  viewportWidthPx,
  viewportHeightPx,
}: ProjectedBoxInput): { widthPx: number; heightPx: number } {
  const { fwd, right, up } = cameraBasis(forward);

  const tanHalfV = Math.tan((fovDeg * Math.PI) / 180 / 2);
  const aspect = viewportHeightPx > 0 ? viewportWidthPx / viewportHeightPx : 1;
  const tanHalfH = tanHalfV * aspect;
  if (tanHalfV <= 1e-6 || tanHalfH <= 1e-6) return { widthPx: 0, heightPx: 0 };

  const half: Vec3 = [size[0] / 2, size[1] / 2, size[2] / 2];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const corner: Vec3 = [
          center[0] + sx * half[0],
          center[1] + sy * half[1],
          center[2] + sz * half[2],
        ];
        const rel = vSub(corner, cameraPos);
        const depth = vDot(rel, fwd);
        if (depth <= 0.05) return { widthPx: 0, heightPx: 0 };
        const px = ((vDot(rel, right) / depth / tanHalfH) * 0.5 + 0.5) * viewportWidthPx;
        const py = (1 - ((vDot(rel, up) / depth / tanHalfV) * 0.5 + 0.5)) * viewportHeightPx;
        minX = Math.min(minX, px);
        maxX = Math.max(maxX, px);
        minY = Math.min(minY, py);
        maxY = Math.max(maxY, py);
      }
    }
  }

  return { widthPx: maxX - minX, heightPx: maxY - minY };
}

/**
 * hit area를 키워도 인접 토큰과 겹치지 않는 최대 배율.
 * 두 축 정렬 박스는 "한 축에서라도 떨어져 있으면" 겹치지 않으므로, 각 쌍에서
 * 가장 여유 있는 축의 (간격 / 기본 크기) 비율을 상한으로 삼고 그 최솟값을 취한다.
 * margin(<1)만큼 더 줄여 경계에서 맞닿는 것도 피한다.
 */
export function maxNonOverlappingHitAreaScale(tokens: Vec3[], margin = 0.95): number {
  let cap = Infinity;
  for (let i = 0; i < tokens.length; i += 1) {
    for (let j = i + 1; j < tokens.length; j += 1) {
      const a = tokens[i];
      const b = tokens[j];
      let best = 0;
      for (let axis = 0; axis < 3; axis += 1) {
        const separation = Math.abs(a[axis] - b[axis]);
        best = Math.max(best, separation / PLACE_HIT_AREA_SIZE[axis]);
      }
      cap = Math.min(cap, best);
    }
  }
  if (!Number.isFinite(cap)) return Infinity; // 토큰이 1개뿐이면 겹칠 상대가 없다
  return cap * margin;
}

export interface PlaceHitAreaScaleInput extends Omit<ProjectedBoxInput, "size"> {
  /** maxNonOverlappingHitAreaScale이 정한 상한 */
  maxScale: number;
  minPixels?: number;
}

/**
 * place 토큰 hit area의 world 배율을 "실제 화면 픽셀" 기준으로 정한다.
 * 기본 크기가 현재 화면(canvas CSS 크기 + 카메라 FOV·거리)에서 minPixels보다
 * 작게 보이면 그만큼 키우고, 인접 토큰과 겹치지 않는 상한(maxScale)을 넘지 않는다.
 * 항상 1 이상 — 기본 크기는 라벨·재료를 덮는 최소치이므로 줄이지 않는다.
 */
export function placeHitAreaScale({
  maxScale,
  minPixels = PLACE_HIT_AREA_MIN_PX,
  ...box
}: PlaceHitAreaScaleInput): number {
  const { widthPx, heightPx } = projectedBoxScreenSize({ ...box, size: PLACE_HIT_AREA_SIZE });
  const smallest = Math.min(widthPx, heightPx);
  if (!(smallest > 0)) return 1;
  const needed = minPixels / smallest;
  return Math.min(Math.max(1, needed), Math.max(1, maxScale));
}

// ---------- place/order: 드래그 좌표 계산 ----------

/**
 * G2.1-R1-F4 — 드래그 중 좌표를 R3F의 `event.point`(포인터가 실제로 부딪힌
 * mesh와의 교차점) 대신 이 함수로 계산한다. `event.point`는 드래그 중인
 * mesh 자신을 대상으로 매 프레임 다시 레이캐스트하는데, 그 mesh는 우리가
 * 방금 직전 프레임에 옮긴 위치에 있으므로 "포인터가 빠르게 움직이면 이전
 * 프레임 위치의 mesh를 스치듯 맞히거나 아예 놓치는" 피드백이 생겨 드래그가
 * 끊기고 흔들리게 만든다. 대신 카메라에서 나가는 광선(ray)을 조리대 높이의
 * 고정된 수평면(y=planeY)과 직접 교차시키면, 드래그 중인 mesh의 현재 위치와
 * 무관하게 항상 안정적으로 좌표가 나온다.
 */
export function intersectRayWithPlaneY(
  rayOrigin: Vec3,
  rayDirection: Vec3,
  planeY: number,
): { x: number; z: number } | null {
  const dy = rayDirection[1];
  if (Math.abs(dy) < 1e-6) return null;
  const t = (planeY - rayOrigin[1]) / dy;
  if (t < 0) return null;
  return {
    x: rayOrigin[0] + rayDirection[0] * t,
    z: rayOrigin[2] + rayDirection[2] * t,
  };
}

// ====================================================
// G2.1-R1-F7 — place 드래그 세션 평면 (라벨 상단 Dead Zone 제거)
//
// F6은 토큰 y를 조리대 높이(1.12)로 내려 "토큰 중심을 잡았을 때"의 수평
// 평면 교차를 정상화했지만, 실제로 손가락이 닿는 곳은 토큰이 아니라 그 위의
// 흰 라벨이다. 라벨은 토큰 원점 + LABEL_OFFSET_SMALL(0.29)을 중심으로
// ±LABEL_HALF_HEIGHT_SMALL(0.15) 이므로 y 1.26~1.56 범위를 차지하는데,
// search stage 카메라는 y=1.40에 있다. 즉 라벨의 위쪽 2/3(y>1.40)를 지나는
// 광선은 위를 향하므로 조리대 수평 평면(y=1.12)과 **영원히 만나지 않고**
// (intersectRayWithPlaneY가 t<0으로 null), 나머지 아래쪽 1/3을 지나는 광선도
// 시선과 평면이 약 10°로 스쳐 교차점이 토큰보다 2배 먼 깊이(4.6 → 9.2)에
// 잡힌다. 전자가 "라벨 위쪽을 잡으면 토큰이 안 움직인다"(Dead Zone),
// 후자가 "잡는 순간 토큰이 확 작아졌다가 튄다"(원근 점프)의 원인이다.
//
// 해결: pointer down 한 번에 이 드래그 세션이 쓸 평면을 정하고(중간에 바꾸지
// 않는다), 불안정 조건이면 카메라 시선에 수직인 평면(=토큰과 같은 깊이의
// 평면)으로 고정한다. 이 평면은 어떤 화면 지점에서도 반드시, 그리고 정확히
// 한 번 교차하므로 Dead Zone 자체가 성립하지 않는다.
//
// 다만 "카메라 수직 평면 교차점을 그대로 쓰고 y만 조리대 높이로 눌러버리는"
// 순진한 방식은 쓸 수 없다. 이 카메라는 피치가 약 -9.7°라 평면의 세로축(up)이
// 거의 world up과 같아, y를 눌러 없애면 세로 성분의 월드 이동량이 0.17배로
// 찌그러진다 — 드롭존까지 가려면 화면을 560px 넘게 내려야 해서 420px 캔버스
// 안에서는 도달 자체가 불가능하다. 그래서 교차점을 "화면 가로/세로 이동량"
// (right·up 성분)으로 분해한 뒤, 조리대 평면 위의 직교 기저
// (right = 화면 오른쪽, fwdFlat = 화면 위쪽 = 카메라에서 멀어지는 방향)로
// 같은 크기만큼 옮긴다. 지시서가 허용한 "동등하게 화면 이동을 안정적으로
// 월드 이동으로 바꾸는 방식"이다.
//
// 이 매핑의 성질(회귀 테스트로 고정):
//  - pointer down 시점 이동량 0 → 토큰은 원위치 그대로 (잡는 순간 점프 없음).
//    grab offset을 저장해 "라벨의 어디를 눌렀는가"가 토큰 위치를 바꾸지 않는다.
//  - right는 카메라 forward와 직교하고 y성분이 0이므로, 화면 수평 이동은
//    깊이를 **정확히** 보존한다 → 원근 크기 변화 0, 화면 이동량 1:1.
//  - 화면 세로 이동은 조리대 위 앞뒤 이동으로 1:1 환산된다 → 드롭존까지
//    캔버스 안에서 도달 가능(최악 케이스 좌 102px + 하 95px).
//  - 토큰 y는 항상 planeY(조리대 높이) 그대로다. x/z만 돌려준다.
// ====================================================

/** 수평 평면 교차를 신뢰할 수 있는 최소 입사각(sin). 약 20°보다 스치면 불안정으로 본다. */
export const MIN_COUNTER_PLANE_INCIDENCE = 0.35;
/** 잡은 지점의 교차 깊이가 토큰 깊이의 이 배를 넘으면 "멀리서 만났다"고 보고 안정 평면으로 간다. */
export const MAX_GRAB_DEPTH_RATIO = 1.6;
/**
 * 수평 평면 교차점이 "손가락이 실제로 있는 지점"(토큰과 같은 깊이의 평면 위 점)에서
 * 이만큼(월드 단위) 넘게 떨어져 있으면 안정 평면으로 간다. 라벨 위쪽을 잡는 경우가
 * 정확히 이 상태다 — 라벨 상단은 교차가 아예 없고(t<0), 하단은 교차하더라도
 * 손가락 위치에서 4~5 월드 단위 떨어진 곳에서 만난다. 즉 "pointer down 위치가
 * 토큰보다 위에 있음"은 이 한 조건으로 수치적으로 잡힌다.
 */
export const MAX_GRAB_DRIFT = 0.5;

/** 임의의 평면(점 + 법선)과 광선의 교차점. 평행하거나 뒤쪽이면 null. */
export function intersectRayWithPlane(
  rayOrigin: Vec3,
  rayDirection: Vec3,
  planePoint: Vec3,
  planeNormal: Vec3,
): Vec3 | null {
  const denom = vDot(rayDirection, planeNormal);
  if (Math.abs(denom) < 1e-6) return null;
  const t = vDot(vSub(planePoint, rayOrigin), planeNormal) / denom;
  if (t < 0) return null;
  return [
    rayOrigin[0] + rayDirection[0] * t,
    rayOrigin[1] + rayDirection[1] * t,
    rayOrigin[2] + rayDirection[2] * t,
  ];
}

/**
 * 드래그 세션 하나가 끝까지 쓰는 좌표 변환 상태. pointer down에서 한 번 만들고
 * pointer up까지 절대 바꾸지 않는다 — 드래그 도중 모드가 바뀌면 그 순간 토큰이
 * 튀기 때문이다.
 */
export type PlaceDragSession =
  | {
      mode: "counter";
      /** 토큰이 유지하는 조리대 높이 */
      planeY: number;
      /** 토큰 원점 - pointer down 교차점 (잡은 지점이 토큰을 순간이동시키지 않게 한다) */
      grabOffsetX: number;
      grabOffsetZ: number;
    }
  | {
      mode: "stable";
      planeY: number;
      /** 드래그 세션 고정 평면: 토큰을 지나고 카메라 시선에 수직 */
      planePoint: Vec3;
      planeNormal: Vec3;
      /** pointer down 시 그 평면과의 교차점 — 이후 이동량의 기준점(grab offset의 다른 표현) */
      anchor: Vec3;
      /** 화면 가로/세로 축 (평면 위 직교 기저) */
      right: Vec3;
      up: Vec3;
      /** 조리대 평면에 눕힌 "화면 위쪽" 대응 방향 (카메라에서 멀어지는 수평 방향) */
      forwardFlat: Vec3;
      /** 토큰 원점의 x/z — 이동량 0일 때 돌려줄 좌표 */
      originX: number;
      originZ: number;
    };

export interface BeginPlaceDragInput {
  /** R3F event.ray.origin (원근 카메라에서는 카메라 위치) */
  rayOrigin: Vec3;
  /** R3F event.ray.direction (단위 벡터) */
  rayDirection: Vec3;
  /** camera.getWorldDirection 결과 */
  cameraForward: Vec3;
  /** 드래그를 시작한 토큰의 원점 */
  tokenOrigin: Vec3;
}

/**
 * pointer down 한 번에 이 드래그가 끝까지 쓸 평면과 grab offset을 정한다.
 * 수평 평면이 "정상 영역"(F4/F6 경로)일 때만 counter 모드를 쓰고, 아래 중
 * 하나라도 걸리면 세션 전체를 stable 모드로 고정한다.
 *  - 수평 평면과 교차 자체가 없다 (라벨 상단처럼 광선이 위를 향한다)
 *  - 입사각이 너무 얕아 수치적으로 불안정하다
 *  - 교차점이 토큰보다 비정상적으로 멀다 (잡는 순간 깊이 점프)
 *  - 교차점이 실제 손가락 위치에서 너무 멀다 (= 잡은 지점이 토큰보다 위에 있다)
 */
export function beginPlaceDrag({
  rayOrigin,
  rayDirection,
  cameraForward,
  tokenOrigin,
}: BeginPlaceDragInput): PlaceDragSession {
  const { fwd, right, up } = cameraBasis(cameraForward);
  const planeY = tokenOrigin[1];
  const tokenDepth = vDot(vSub(tokenOrigin, rayOrigin), fwd);
  const counter = intersectRayWithPlaneY(rayOrigin, rayDirection, planeY);
  const anchor = intersectRayWithPlane(rayOrigin, rayDirection, tokenOrigin, fwd);

  if (counter && anchor && tokenDepth > 0.05) {
    const counterPoint: Vec3 = [counter.x, planeY, counter.z];
    const counterDepth = vDot(vSub(counterPoint, rayOrigin), fwd);
    const usable =
      Math.abs(rayDirection[1]) >= MIN_COUNTER_PLANE_INCIDENCE &&
      counterDepth > 0.05 &&
      counterDepth <= tokenDepth * MAX_GRAB_DEPTH_RATIO &&
      vLen(vSub(counterPoint, anchor)) <= MAX_GRAB_DRIFT;
    if (usable) {
      return {
        mode: "counter",
        planeY,
        grabOffsetX: tokenOrigin[0] - counter.x,
        grabOffsetZ: tokenOrigin[2] - counter.z,
      };
    }
  }

  return {
    mode: "stable",
    planeY,
    planePoint: tokenOrigin,
    planeNormal: fwd,
    // 카메라 뒤에서 시작하는 극단적 상황에서도 세션이 성립하도록 토큰 자신을 기준점으로 둔다.
    anchor: anchor ?? tokenOrigin,
    right,
    up,
    forwardFlat: vNormalize([fwd[0], 0, fwd[2]]),
    originX: tokenOrigin[0],
    originZ: tokenOrigin[2],
  };
}

/**
 * pointer move의 광선을 세션이 정한 평면으로 풀어 토큰의 조리대 위 x/z를 돌려준다.
 * y는 언제나 session.planeY이므로 반환하지 않는다(호출부가 그대로 유지한다).
 * 계산이 불가능한 극단적 상황에서만 null — 호출부는 직전 좌표를 유지하면 된다.
 */
export function placeDragPoint(
  session: PlaceDragSession,
  rayOrigin: Vec3,
  rayDirection: Vec3,
): { x: number; z: number } | null {
  if (session.mode === "counter") {
    const hit = intersectRayWithPlaneY(rayOrigin, rayDirection, session.planeY);
    if (!hit) return null;
    return { x: hit.x + session.grabOffsetX, z: hit.z + session.grabOffsetZ };
  }

  const hit = intersectRayWithPlane(
    rayOrigin,
    rayDirection,
    session.planePoint,
    session.planeNormal,
  );
  if (!hit) return null;
  const moved = vSub(hit, session.anchor);
  const dRight = vDot(moved, session.right);
  const dUp = vDot(moved, session.up);
  const x = session.originX + dRight * session.right[0] + dUp * session.forwardFlat[0];
  const z = session.originZ + dRight * session.right[2] + dUp * session.forwardFlat[2];
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  return { x, z };
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
