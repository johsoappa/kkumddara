import { describe, expect, it } from "vitest";
import {
  DROP_ZONE_FLOOR_MIN_PX,
  DROP_ZONE_MIN_PX,
  MIN_DRAG_TRAVEL_PX,
  beginScreenDrag,
  dragCenterScreen,
  dragTravelPx,
  dragWorldPosition,
  dropZoneFromRegions,
  isDropAt,
  isInScreenZone,
  rebaseScreenDrag,
  type DragView,
  type ScreenPoint,
} from "./friedRiceDrag";
import {
  MOUND_ORIGIN,
  PLATE_DROP_PIN,
  SHELF_ORIGINS,
  TRAY_DROP_PIN,
  convergedCamera,
  dropRegionsFor,
  type DropTarget,
} from "./friedRiceLayout";
import { INGREDIENTS } from "./friedRice";
import { PLACE_HIT_AREA_CENTER_Y, projectPointToScreen, type Vec3 } from "./interactions3d";

const VIEWPORTS: Array<[number, number]> = [
  [343, 343],
  [328, 328],
  [544, 460],
];

function viewFor(w: number, h: number): DragView {
  const cam = convergedCamera("prep", w / h);
  return { cameraPos: cam.cameraPos, forward: cam.forward, fovDeg: cam.fovDeg, viewportWidthPx: w, viewportHeightPx: h };
}

function px(point: Vec3, view: DragView): ScreenPoint {
  const s = projectPointToScreen(point, view);
  if (!s) throw new Error("투영 불가");
  return { x: s.xPx, y: s.yPx };
}

/** 재료를 hit area 중심에서 (gx, gy)px 떨어진 곳에서 잡았다고 하고, 재료 중심이 target에 오도록 손가락을 옮긴 위치 */
function cursorPlacingCenterAt(
  origin: Vec3,
  grabOffset: ScreenPoint,
  target: ScreenPoint,
  view: DragView,
) {
  const center = px([origin[0], origin[1] + PLACE_HIT_AREA_CENTER_Y, origin[2]], view);
  const grab = { x: center.x + grabOffset.x, y: center.y + grabOffset.y };
  const session = beginScreenDrag(grab, origin, view)!;
  const cursor = { x: target.x + grabOffset.x, y: target.y + grabOffset.y };
  return { session, cursor, center };
}

const GRABS: Array<[string, ScreenPoint]> = [
  ["중앙", { x: 0, y: 0 }],
  ["왼쪽 가장자리", { x: -20, y: 0 }],
  ["오른쪽 가장자리", { x: 20, y: 0 }],
  ["위쪽 가장자리", { x: 0, y: -20 }],
  ["아래쪽 가장자리", { x: 0, y: 20 }],
];

describe.each(VIEWPORTS)("끌어 놓기 화면 계산 %ipx x %ipx", (w, h) => {
  const view = viewFor(w, h);

  it.each(INGREDIENTS.map((i) => i.id))("%s: 트레이 안내 점(●)에 재료 중심을 가져가면 어디를 잡았든 성공한다", (id) => {
    const zone = dropZoneFromRegions(dropRegionsFor("tray"), view);
    const dot = px(TRAY_DROP_PIN.anchor, view);
    for (const [name, grab] of GRABS) {
      const { session, cursor } = cursorPlacingCenterAt(SHELF_ORIGINS[id], grab, dot, view);
      expect(isDropAt(session, cursor, zone), `${id} ${name}`).toBe(true);
    }
  });

  it("안내선 끝의 \"놓는 곳\" 이름표와 눈에 보이는 \"준비 트레이\" 이름표 위에 놓아도 성공한다", () => {
    const zone = dropZoneFromRegions(dropRegionsFor("tray"), view);
    const label = px(TRAY_DROP_PIN.world, view);
    const trayCard = px([0, 0.7, -0.5], view);
    for (const target of [label, trayCard]) {
      const { session, cursor } = cursorPlacingCenterAt(SHELF_ORIGINS.rice, { x: 0, y: 0 }, target, view);
      expect(isDropAt(session, cursor, zone)).toBe(true);
    }
  });

  it("그냥 눌렀다 떼거나 조금(기준 미만) 움직인 뒤 놓으면 놓은 것으로 치지 않는다", () => {
    const zone = dropZoneFromRegions(dropRegionsFor("tray"), view);
    for (const id of INGREDIENTS.map((i) => i.id)) {
      const origin = SHELF_ORIGINS[id];
      const center = px([origin[0], origin[1] + PLACE_HIT_AREA_CENTER_Y, origin[2]], view);
      const session = beginScreenDrag(center, origin, view)!;
      expect(isDropAt(session, center, zone)).toBe(false);
      expect(isDropAt(session, { x: center.x + 4, y: center.y + (MIN_DRAG_TRAVEL_PX - 6) }, zone)).toBe(false);
    }
  });

  it("선반 위 제자리는 트레이 영역 밖이다(움직임 기준과 별개로)", () => {
    const zone = dropZoneFromRegions(dropRegionsFor("tray"), view);
    for (const id of INGREDIENTS.map((i) => i.id)) {
      const origin = SHELF_ORIGINS[id];
      const center = px([origin[0], origin[1] + PLACE_HIT_AREA_CENTER_Y, origin[2]], view);
      expect(isInScreenZone(center, zone), id).toBe(false);
    }
  });

  it("트레이 밖(화면 구석·위쪽·옆)에 놓으면 실패한다", () => {
    const zone = dropZoneFromRegions(dropRegionsFor("tray"), view);
    const outside: ScreenPoint[] = [
      { x: 6, y: 6 },
      { x: w / 2, y: 20 },
      { x: w - 6, y: h - 6 },
      { x: w / 2, y: px(TRAY_DROP_PIN.world, view).y + 120 },
    ];
    for (const target of outside) {
      const { session, cursor } = cursorPlacingCenterAt(SHELF_ORIGINS.carrot, { x: 0, y: 0 }, target, view);
      expect(isDropAt(session, cursor, zone), JSON.stringify(target)).toBe(false);
    }
  });

  it("재료는 손가락과 같은 화면 이동량만큼 움직인다(그려지는 위치가 손가락을 따라간다)", () => {
    const origin = SHELF_ORIGINS.pea;
    const center = px([origin[0], origin[1] + PLACE_HIT_AREA_CENTER_Y, origin[2]], view);
    const session = beginScreenDrag({ x: center.x + 10, y: center.y - 8 }, origin, view)!;
    for (const [dx, dy] of [
      [0, 0],
      [30, 40],
      [-25, 15],
      [10, -35],
    ]) {
      const cursor = { x: center.x + 10 + dx, y: center.y - 8 + dy };
      const pos = dragWorldPosition(session, cursor);
      const shown = px([pos[0], pos[1] + PLACE_HIT_AREA_CENTER_Y, pos[2]], view);
      const expected = dragCenterScreen(session, cursor);
      expect(Math.abs(shown.x - expected.x)).toBeLessThan(1.5);
      expect(Math.abs(shown.y - expected.y)).toBeLessThan(1.5);
      expect(dragTravelPx(session, cursor)).toBeCloseTo(Math.hypot(dx, dy), 5);
    }
  });

  it("5단계: 볶음밥을 접시 안내 점(●)이나 접시 위에 가져가면 성공하고, 팬 위 제자리·트레이 쪽은 실패한다", () => {
    const zone = dropZoneFromRegions(dropRegionsFor("plate"), view);
    const dot = px(PLATE_DROP_PIN.anchor, view);
    const label = px(PLATE_DROP_PIN.world, view);
    for (const [name, grab] of GRABS) {
      for (const target of [dot, label]) {
        const { session, cursor } = cursorPlacingCenterAt(MOUND_ORIGIN, grab, target, view);
        expect(isDropAt(session, cursor, zone), name).toBe(true);
      }
    }
    const rest = px([MOUND_ORIGIN[0], MOUND_ORIGIN[1] + PLACE_HIT_AREA_CENTER_Y, MOUND_ORIGIN[2]], view);
    expect(isInScreenZone(rest, zone)).toBe(false);
    const elsewhere = px([0.85, 1.06, -0.84], view);
    const { session, cursor } = cursorPlacingCenterAt(MOUND_ORIGIN, { x: 0, y: 0 }, elsewhere, view);
    expect(isDropAt(session, cursor, zone)).toBe(false);
  });

  it.each<DropTarget>(["tray", "plate"])("%s 놓기 영역의 모든 조각은 바닥 조각 최소 크기(28px) 이상이고 화면 근처에 있다", (target) => {
    const zone = dropZoneFromRegions(dropRegionsFor(target), view)!;
    expect(zone.shapes.length).toBeGreaterThan(0);
    for (const shape of zone.shapes) {
      if (shape.kind === "rect") {
        expect(shape.maxX - shape.minX).toBeGreaterThanOrEqual(DROP_ZONE_FLOOR_MIN_PX);
        expect(shape.maxY - shape.minY).toBeGreaterThanOrEqual(DROP_ZONE_FLOOR_MIN_PX);
        expect(shape.minX).toBeGreaterThanOrEqual(-DROP_ZONE_MIN_PX);
        expect(shape.maxX).toBeLessThanOrEqual(w + DROP_ZONE_MIN_PX);
      } else {
        expect(shape.rx * 2).toBeGreaterThanOrEqual(DROP_ZONE_FLOOR_MIN_PX);
        expect(shape.ry * 2).toBeGreaterThanOrEqual(DROP_ZONE_FLOOR_MIN_PX);
      }
    }
  });

  it("(Codex 지적) 조각 사이·바깥의 빈 조리대는 놓는 곳이 아니다 — 트레이 오른쪽 앞, 접시 뒤쪽 모서리", () => {
    const tray = dropZoneFromRegions(dropRegionsFor("tray"), view);
    const plate = dropZoneFromRegions(dropRegionsFor("plate"), view);
    const emptyCounterNearTray = px([1.15, 1.06, -0.2], view);
    expect(isInScreenZone(emptyCounterNearTray, tray)).toBe(false);
    // 접시 뒤쪽 모서리(월드 기준 접시 밖, 화면에서는 가장자리 약 6px 뒤)는 둘레 여유 안이라 허용되고,
    // 접시에서 한참 벗어난 오른쪽(전달 벨 자리)·왼쪽 끝은 실패한다.
    const farLeftOfPlate = px([-1.0, 1.06, -0.84], view);
    expect(isInScreenZone(farLeftOfPlate, plate)).toBe(false);
    const rightOfPlate = px([0.62, 1.06, -0.84], view);
    expect(isInScreenZone(rightOfPlate, plate)).toBe(false);
  });
});

describe("dropZoneFromRegions", () => {
  it("투영할 수 있는 점이 하나도 없으면 null이고, null 영역에는 놓을 수 없다", () => {
    const view = viewFor(343, 343);
    const behind: Vec3[] = [[0, 1, 50]];
    expect(dropZoneFromRegions([{ kind: "rect", points: behind }], view)).toBeNull();
    expect(isInScreenZone({ x: 10, y: 10 }, null)).toBe(false);
  });
});

describe("rebaseScreenDrag (카메라·화면 크기가 끄는 도중 바뀐 경우)", () => {
  it("단계 전환 카메라(order→prep)가 움직이는 중이어도 재료가 지금 화면의 손가락을 따라가고 놓기 판정이 그 화면과 맞는다", () => {
    const w = 343;
    const h = 343;
    const prep = viewFor(w, h);
    const orderCam = convergedCamera("order", w / h);
    const order: DragView = {
      cameraPos: orderCam.cameraPos,
      forward: orderCam.forward,
      fovDeg: orderCam.fovDeg,
      viewportWidthPx: w,
      viewportHeightPx: h,
    };
    const origin = SHELF_ORIGINS.rice;
    const centerPrep = px([origin[0], origin[1] + PLACE_HIT_AREA_CENTER_Y, origin[2]], prep);
    const session = beginScreenDrag(centerPrep, origin, prep)!;
    const cursor = { x: centerPrep.x + 40, y: centerPrep.y + 55 };

    // 카메라가 order 쪽에 있을 때(전환 도중)의 화면: 재료 중심 = 그 카메라에서의 원위치 + 손가락 이동량
    const live = rebaseScreenDrag(session, order)!;
    const centerOrder = px([origin[0], origin[1] + PLACE_HIT_AREA_CENTER_Y, origin[2]], order);
    const expected = { x: centerOrder.x + 40, y: centerOrder.y + 55 };
    const center = dragCenterScreen(live, cursor);
    expect(Math.abs(center.x - expected.x)).toBeLessThan(1e-6);
    expect(Math.abs(center.y - expected.y)).toBeLessThan(1e-6);

    // 그려지는 위치도 그 카메라 화면에서 같은 곳에 보인다
    const pos = dragWorldPosition(live, cursor);
    const shown = px([pos[0], pos[1] + PLACE_HIT_AREA_CENTER_Y, pos[2]], order);
    expect(Math.abs(shown.x - expected.x)).toBeLessThan(1.5);
    expect(Math.abs(shown.y - expected.y)).toBeLessThan(1.5);

    // 놓기 판정은 그 카메라의 영역으로: 재료 중심이 그 화면의 안내 점에 오면 성공
    const zone = dropZoneFromRegions(dropRegionsFor("tray"), order);
    const dotOrder = px(TRAY_DROP_PIN.anchor, order);
    const cursorAtDot = { x: dotOrder.x - (centerOrder.x - centerPrep.x), y: dotOrder.y - (centerOrder.y - centerPrep.y) };
    expect(isDropAt(live, cursorAtDot, zone)).toBe(true);
  });

  it("카메라가 같으면 다시 구한 세션이 원래 세션과 같은 결과를 낸다", () => {
    const view = viewFor(343, 343);
    const origin = SHELF_ORIGINS.carrot;
    const c = px([origin[0], origin[1] + PLACE_HIT_AREA_CENTER_Y, origin[2]], view);
    const session = beginScreenDrag({ x: c.x + 8, y: c.y - 6 }, origin, view)!;
    const again = rebaseScreenDrag(session, view)!;
    const cur = { x: c.x + 60, y: c.y + 30 };
    expect(dragCenterScreen(again, cur)).toEqual(dragCenterScreen(session, cur));
    expect(dragWorldPosition(again, cur)).toEqual(dragWorldPosition(session, cur));
  });
});
