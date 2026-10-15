// ====================================================
// friedRiceDrag.ts — 볶음밥 시나리오 끌어서 놓기의 화면 기준 계산(순수 함수)
//
// 왜 따로 두는가: 이 장면의 카메라는 조리대를 거의 수평으로 내려다본다. 조리대 위의 깊이 0.66(선반→트레이 중심)이
// 화면에서는 약 11px뿐이라, "손가락 이동량 → 조리대 위 이동량"을 월드 단위로 옮기면(기존 stable 방식) 핀의 점(●)에
// 손가락을 가져가도 재료는 0.08밖에 못 간다. 그래서 끌기 전체를 "화면 px" 기준으로 계산한다.
//   - 재료는 손가락과 같은 화면 이동량만큼 움직인다(잡은 곳이 중앙이든 가장자리든 같다).
//   - 놓기 판정은 "재료 중심의 화면 위치가 안내선(점 ● ~ '놓는 곳' 이름표)과 놓을 곳 주변 영역 안인가"이다.
//     안내 핀과 같은 월드 점들에서 영역을 만들기 때문에 핀이 가리키는 곳에 놓으면 항상 성공한다.
// ====================================================

import {
  PLACE_HIT_AREA_CENTER_Y,
  projectPointToScreen,
  type Vec3,
} from "./interactions3d";

export interface DragView {
  cameraPos: Vec3;
  forward: Vec3;
  fovDeg: number;
  viewportWidthPx: number;
  viewportHeightPx: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

/** 놓을 곳 영역 둘레 여유(px) — 안내선 끝점에서 이만큼 더 넓게 본다 */
export const DROP_ZONE_PAD_PX = 14;
/** 안내선 영역의 최소 크기(px) — 기존 hit area 최소 터치 크기(48px)와 같은 기준 */
export const DROP_ZONE_MIN_PX = 48;
/**
 * 놓을 곳 "바닥" 조각의 최소 크기(px). 카메라가 거의 수평이라 트레이·접시의 화면 깊이가 매우 얕아서(약 10px),
 * 여기에 안내선과 같은 48px을 주면 앞뒤 ±1 칸이 모두 놓는 곳이 된다 — 그래서 바닥 조각은 더 작게 잡는다.
 */
export const DROP_ZONE_FLOOR_MIN_PX = 28;
/** 끌기 시작 위치에서 이만큼(px) 움직이지 않으면 놓은 것으로 치지 않는다(그냥 눌렀다 뗀 경우 보호) */
export const MIN_DRAG_TRAVEL_PX = 20;

/** 놓기 영역 한 조각 — 사각형 또는 타원(화면 px). 여러 조각의 합집합이 놓기 영역이다. */
export type ZoneShape =
  | { kind: "rect"; minX: number; maxX: number; minY: number; maxY: number }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number };

export interface ScreenZone {
  shapes: ZoneShape[];
}

/** 월드 점들을 감싸는 영역 한 조각의 정의 — 사각형 또는 타원(접시처럼 둥근 곳) */
export interface DropRegion {
  kind: "rect" | "ellipse";
  points: Vec3[];
  /** 이 조각의 최소 크기(px). 생략하면 DROP_ZONE_MIN_PX(안내선처럼 손가락이 꼭 맞춰야 하는 곳) */
  minPx?: number;
}

function vSub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function vDot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function vCross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function vNorm(a: Vec3): Vec3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

export interface ScreenDragSession {
  /** 끌기를 시작한 손가락의 화면 위치 */
  grab: ScreenPoint;
  /** 끌기 시작 때 재료 중심(hit area 중심)의 화면 위치 */
  center0: ScreenPoint;
  origin: Vec3;
  right: Vec3;
  up: Vec3;
  /** 재료 깊이에서 화면 1px이 월드 몇 칸인가 */
  worldPerPx: number;
}

/** 끌기 시작 — 잡은 화면 위치(canvas px)와 재료 원점으로 세션을 만든다. 투영이 불가능하면(카메라 뒤) null */
export function beginScreenDrag(grab: ScreenPoint, origin: Vec3, view: DragView): ScreenDragSession | null {
  const center = projectPointToScreen([origin[0], origin[1] + PLACE_HIT_AREA_CENTER_Y, origin[2]], view);
  if (!center) return null;
  const fwd = vNorm(view.forward);
  const right = vNorm(vCross(fwd, [0, 1, 0]));
  const up = vCross(right, fwd);
  const depth = vDot(vSub(origin, view.cameraPos), fwd);
  const tanHalfV = Math.tan((view.fovDeg * Math.PI) / 180 / 2);
  if (!(depth > 0.05) || !(tanHalfV > 1e-6) || !(view.viewportHeightPx > 0)) return null;
  return {
    grab,
    center0: { x: center.xPx, y: center.yPx },
    origin,
    right,
    up,
    worldPerPx: (2 * depth * tanHalfV) / view.viewportHeightPx,
  };
}

/**
 * 카메라·화면 크기가 바뀐 뒤의 세션 — 잡은 손가락 위치(grab)는 그대로 두고, 재료 중심의 화면 위치·월드 환산·카메라 방향을
 * 지금 view로 다시 구한다. 끄는 도중 단계 전환(카메라 이동)이나 기기 회전이 있어도 그려진 재료와 놓기 판정이 어긋나지 않는다.
 */
export function rebaseScreenDrag(session: ScreenDragSession, view: DragView): ScreenDragSession | null {
  return beginScreenDrag(session.grab, session.origin, view);
}

/** 지금 손가락 위치에서 재료 중심의 화면 위치(잡은 곳과 중심의 차이를 유지한다) */
export function dragCenterScreen(session: ScreenDragSession, cursor: ScreenPoint): ScreenPoint {
  return {
    x: session.center0.x + (cursor.x - session.grab.x),
    y: session.center0.y + (cursor.y - session.grab.y),
  };
}

/** 재료가 그려질 월드 위치 — 손가락과 같은 화면 이동량(카메라를 향한 평면 위) */
export function dragWorldPosition(session: ScreenDragSession, cursor: ScreenPoint): Vec3 {
  const dx = (cursor.x - session.grab.x) * session.worldPerPx;
  const dy = -(cursor.y - session.grab.y) * session.worldPerPx;
  return [
    session.origin[0] + session.right[0] * dx + session.up[0] * dy,
    session.origin[1] + session.right[1] * dx + session.up[1] * dy,
    session.origin[2] + session.right[2] * dx + session.up[2] * dy,
  ];
}

/** 끌기 시작 위치에서 재료 중심이 움직인 화면 거리(px) */
export function dragTravelPx(session: ScreenDragSession, cursor: ScreenPoint): number {
  const c = dragCenterScreen(session, cursor);
  return Math.hypot(c.x - session.center0.x, c.y - session.center0.y);
}

/**
 * 놓을 곳을 이루는 조각들(놓을 곳 자체의 바닥, 이름표, 안내선)을 각각 화면에 투영해 놓기 영역(px)을 만든다.
 * 조각마다 둘레에 DROP_ZONE_PAD_PX를 더하고, 가로·세로가 DROP_ZONE_MIN_PX보다 작으면 중심을 지킨 채 키운다.
 * 조각을 하나의 큰 사각형으로 합치지 않으므로, 조각 사이의 빈 조리대는 놓는 곳으로 치지 않는다.
 */
export function dropZoneFromRegions(regions: DropRegion[], view: DragView): ScreenZone | null {
  const shapes: ZoneShape[] = [];
  for (const region of regions) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of region.points) {
      const s = projectPointToScreen(p, view);
      if (!s) continue;
      minX = Math.min(minX, s.xPx);
      maxX = Math.max(maxX, s.xPx);
      minY = Math.min(minY, s.yPx);
      maxY = Math.max(maxY, s.yPx);
    }
    if (!Number.isFinite(minX)) continue;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const minHalf = (region.minPx ?? DROP_ZONE_MIN_PX) / 2;
    const halfW = Math.max((maxX - minX) / 2 + DROP_ZONE_PAD_PX, minHalf);
    const halfH = Math.max((maxY - minY) / 2 + DROP_ZONE_PAD_PX, minHalf);
    shapes.push(
      region.kind === "ellipse"
        ? { kind: "ellipse", cx, cy, rx: halfW, ry: halfH }
        : { kind: "rect", minX: cx - halfW, maxX: cx + halfW, minY: cy - halfH, maxY: cy + halfH },
    );
  }
  return shapes.length > 0 ? { shapes } : null;
}

export function isInScreenZone(point: ScreenPoint, zone: ScreenZone | null): boolean {
  if (!zone) return false;
  return zone.shapes.some((shape) => {
    if (shape.kind === "rect") {
      return point.x >= shape.minX && point.x <= shape.maxX && point.y >= shape.minY && point.y <= shape.maxY;
    }
    const nx = (point.x - shape.cx) / shape.rx;
    const ny = (point.y - shape.cy) / shape.ry;
    return nx * nx + ny * ny <= 1;
  });
}

/** 놓기 판정 전체: 충분히 움직였고, 재료 중심이 영역 안일 때만 성공 */
export function isDropAt(session: ScreenDragSession, cursor: ScreenPoint, zone: ScreenZone | null): boolean {
  if (dragTravelPx(session, cursor) < MIN_DRAG_TRAVEL_PX) return false;
  return isInScreenZone(dragCenterScreen(session, cursor), zone);
}
