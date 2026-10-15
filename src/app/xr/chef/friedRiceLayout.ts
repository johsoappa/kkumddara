// ====================================================
// friedRiceLayout.ts — 볶음밥 시범 시나리오의 3D 배치·카메라·핀·선배 자세 (F11, 순수 데이터)
//
// FriedRiceScene(R3F)과 레이아웃 회귀 테스트가 같은 값을 쓰도록 좌표를 한곳에 둔다.
// three/React에 의존하지 않는다.
//
// 배치 원칙 (hz-immersive-designer 중 평면 3D에 해당하는 것만 적용)
//  - 시선 유도: 선배 요리사(왼쪽) → 손이 가리키는 주문표(가운데 오른쪽) → 조작 대상 순서로 읽힌다.
//  - 조작 대상은 항상 인물보다 카메라 쪽(앞)에 둔다. 인물은 조작 대상 뒤에 있어 가리지 않는다.
//  - 말풍선·HUD는 캔버스 밖(DOM 위쪽 카드)에 두어 3D 조작 대상을 덮지 않는다.
//  - 카메라는 사용자 입력 없이 크게 움직이지 않는다: 단계 전환 때만 한 번 부드럽게 이동한다.
// ====================================================

import { MENTOR_DIMS, MENTOR_HOLD, type MentorPose } from "./mentorPose";
import { DROP_ZONE_FLOOR_MIN_PX, type DropRegion } from "./friedRiceDrag";
import {
  fitCameraFraming,
  scaledCameraPosition,
  type TargetPinSpec,
  type Vec3,
} from "./interactions3d";
import {
  HEAT_LEVELS,
  INGREDIENTS,
  prepStatus,
  trayRemaining,
  type FriedRicePhase,
  type FriedRiceState,
  type IngredientId,
} from "./friedRice";

/** 조리대 상판 높이(기존 주방과 같은 값) */
export const COUNTER_TOP_Y = 1.06;

// ---------- 1단계: 주문표 ----------

export const TICKET = {
  /** 주문표 판 중심(월드). 조리대 위에 세워 둔 받침대에 기대어 있다. */
  center: [0.42, 1.74, -1.0] as Vec3,
  width: 1.0,
  height: 1.25,
  tiltX: -0.1,
  /** 요청 메모(노란 포스트잇)의 판 기준 로컬 위치와 크기 */
  sticky: { local: [0, -0.4, 0.03] as Vec3, width: 0.84, height: 0.42 },
} as const;

/** 재료 준비 단계에서 벽 레일에 걸어 두는 작은 주문표(눌러서 다시 보기) */
export const MINI_TICKET = {
  center: [0.62, 2.12, -2.3] as Vec3,
  width: 0.52,
  height: 0.65,
} as const;

/**
 * 선배 요리사 배치. 기존 체험(x=-0.85, 배율 1.25)보다 중앙 쪽·약간 작게 두어, 세로로 긴 모바일 화면에서
 * 선반 4칸 + 인물이 가로로 모두 들어오게 한다(가로 폭이 카메라 거리를 정한다).
 */
export const FRIED_RICE_MENTOR = { x: -0.7, y: 0.13, z: -2.1, yaw: 0.2, scale: 1.1 } as const;

/** 머리 기준점 상대 높이 → 월드 y (mentorPose.ts의 MENTOR_FACE_Y와 같은 식, 배치만 다르다) */
function mentorWorldY(relFromHeadPivot: number): number {
  const { legH, torsoH, neckH, headScale } = MENTOR_DIMS;
  return (legH + torsoH + neckH + relFromHeadPivot * headScale) * FRIED_RICE_MENTOR.scale + FRIED_RICE_MENTOR.y;
}
export const FRIED_RICE_MENTOR_FACE_Y = mentorWorldY(MENTOR_DIMS.faceCenterRel);
export const FRIED_RICE_MENTOR_HAT_TOP_Y = mentorWorldY(MENTOR_DIMS.hatTopRel);
export const FRIED_RICE_MENTOR_HEAD_RADIUS = 0.215 * MENTOR_DIMS.headScale * FRIED_RICE_MENTOR.scale;

// ---------- 2단계: 선반·트레이 ----------

export const SHELF_Y = COUNTER_TOP_Y;
export const SHELF_Z = -1.5;

/** 선반 위 재료 원위치(INGREDIENTS 순서) */
export const SHELF_ORIGINS: Record<IngredientId, Vec3> = {
  rice: [-0.75, SHELF_Y, SHELF_Z],
  carrot: [-0.25, SHELF_Y, SHELF_Z],
  pea: [0.25, SHELF_Y, SHELF_Z],
  onion: [0.75, SHELF_Y, SHELF_Z],
};

export const TRAY = {
  center: [0, COUNTER_TOP_Y, -0.84] as Vec3,
  width: 1.8,
  depth: 0.58,
  /** 재료가 트레이 위에 놓이는 높이 */
  itemY: COUNTER_TOP_Y + 0.05,
} as const;

/**
 * "준비 트레이" 이름표. 선반 재료 이름표(y≈1.4)와 겹치지 않도록 트레이 위가 아니라
 * 조리대 앞면(트레이 바로 아래)에 둔다.
 */
export const TRAY_LABEL = {
  position: [0, 0.7, -0.5] as Vec3,
  scale: [0.62, 0.3] as [number, number],
} as const;

// ---------- 3~5단계: 팬·불 손잡이·접시·전달 벨 ----------

/**
 * 팬 받침대 높이. 팬을 조리대 바로 위에 두면 앞줄(트레이 재료·이름표)과 선배 몸통에 가려 거의 안 보여서,
 * 화덕 받침대로 이름표 줄 위까지 올린다.
 */
export const WOK_LIFT = 0.3;

/** 팬(화덕 위). 트레이 뒤, 선반 줄과 같은 깊이에 둔다 — 3~5단계에는 선반 재료가 없다. */
export const WOK = {
  center: [0, COUNTER_TOP_Y, -1.5] as Vec3,
  /** 팬 안쪽 반지름 */
  radius: 0.42,
  /** 팬 테두리 높이(월드 y) */
  rimY: COUNTER_TOP_Y + WOK_LIFT + 0.24,
} as const;

/** 볶은 음식을 끌기 시작하는 자리 — 팬 위(테두리 바로 위) */
export const MOUND_ORIGIN: Vec3 = [WOK.center[0], WOK.rimY - 0.04, WOK.center[2]];

/** 4단계 불 세기 손잡이 3개(트레이가 있던 앞줄). HEAT_LEVELS 순서(약·중·강)와 같다. */
export const KNOB_Y = COUNTER_TOP_Y + 0.05;
export const KNOB_Z = -0.84;
/**
 * 손잡이 가로 위치. 선배 요리사 얼굴(x≈-0.7)과 첫 손잡이 이름표가 겹치지 않도록 오른쪽으로 밀고(간격 0.45 — 손잡이
 * 지름 0.34보다 크고 이름표 폭 0.4보다 크다), 이름표는 손잡이 바로 위에 낮게 붙인다(KNOB_LABEL_*).
 * 이전 [-0.55, 0, 0.55] + 높은 이름표에서는 "약불" 이름표가 선배 턱·몸을 덮었다. 배치 테스트가 비겹침을 고정한다.
 */
export const KNOB_X = [-0.05, 0.4, 0.85] as const;
/** 손잡이 이름표: 월드 크기와 손잡이 위 높이(손잡이 바닥 기준 중심 높이) */
export const KNOB_LABEL_SCALE: [number, number] = [0.4, 0.22];
export const KNOB_LABEL_CENTER_Y = 0.33;
/** 손잡이 보이지 않는 누르기 영역 폭 — 이웃 손잡이 중심 간격(0.45)보다 작아 영역이 겹치지 않는다 */
export const KNOB_HIT_WIDTH = 0.42;
export const KNOB_RADIUS = 0.17;

export function knobPosition(index: number): Vec3 {
  return [KNOB_X[index] ?? 0, KNOB_Y, KNOB_Z];
}

/** 5단계 접시(앞줄 왼쪽)와 전달 벨(앞줄 오른쪽) */
export const PLATE = {
  center: [-0.2, COUNTER_TOP_Y, -0.84] as Vec3,
  radius: 0.4,
} as const;
export const BELL = {
  center: [0.62, COUNTER_TOP_Y, -0.84] as Vec3,
} as const;

/** 접시 위에 놓았는지 — 눈에 보이는 접시보다 약간 넓게 판정한다. */
export const PLATE_DROP_MARGIN = 0.12;
export function isInsidePlate(point: { x: number; z: number }): boolean {
  const dx = point.x - PLATE.center[0];
  const dz = point.z - PLATE.center[2];
  return Math.hypot(dx, dz) <= PLATE.radius + PLATE_DROP_MARGIN;
}

/** 트레이에 올린 재료의 표시 배율(선반 위보다 조금 작게) */
export const TRAY_ITEM_SCALE = 0.78;

/** 끌다 놓은 위치가 트레이 안(여유 포함)인지 — 드롭 판정. 판정 영역은 눈에 보이는 트레이보다 약간 넓다. */
export const TRAY_DROP_MARGIN = 0.12;

export function isInsideTray(point: { x: number; z: number }): boolean {
  const halfW = TRAY.width / 2 + TRAY_DROP_MARGIN;
  const halfD = TRAY.depth / 2 + TRAY_DROP_MARGIN;
  return (
    Math.abs(point.x - TRAY.center[0]) <= halfW && Math.abs(point.z - TRAY.center[2]) <= halfD
  );
}

/** "놓는 곳" 핀: world = 이름표 위치, anchor = 점(●, 놓을 곳 중심). pinsFor와 놓기 영역이 같은 값을 쓴다. */
export const TRAY_DROP_PIN = {
  world: [TRAY.center[0], TRAY.center[1] - 0.1, TRAY.center[2] + TRAY.depth / 2 + 0.1] as Vec3,
  anchor: [TRAY.center[0], TRAY.center[1] + 0.06, TRAY.center[2]] as Vec3,
};
export const PLATE_DROP_PIN = {
  world: [PLATE.center[0], PLATE.center[1] - 0.1, PLATE.center[2] + PLATE.radius + 0.1] as Vec3,
  anchor: [PLATE.center[0], PLATE.center[1] + 0.06, PLATE.center[2]] as Vec3,
};

export type DropTarget = "tray" | "plate";

/**
 * 끌어 놓는 영역을 이루는 조각들(월드 점들) — 놓을 곳 자체(트레이 윗면·"준비 트레이" 이름표 / 접시 윗면), 그리고
 * 안내선(점 ● ~ "놓는 곳" 이름표). 각 조각을 따로 화면에 투영해 합집합으로 쓰므로(friedRiceDrag.dropZoneFromRegions)
 * 핀이 가리키는 곳과 눈에 보이는 놓을 곳 위에서는 성공하고, 그 사이·바깥의 빈 조리대에서는 실패한다.
 */
export function dropRegionsFor(target: DropTarget): DropRegion[] {
  const guide: DropRegion = {
    kind: "rect",
    points: target === "plate" ? [PLATE_DROP_PIN.anchor, PLATE_DROP_PIN.world] : [TRAY_DROP_PIN.anchor, TRAY_DROP_PIN.world],
  };
  if (target === "plate") {
    const [cx, cy, cz] = PLATE.center;
    const r = PLATE.radius;
    return [
      {
        kind: "ellipse",
        minPx: DROP_ZONE_FLOOR_MIN_PX,
        points: [
          [cx - r, cy, cz],
          [cx + r, cy, cz],
          [cx, cy, cz - r],
          [cx, cy, cz + r],
        ],
      },
      guide,
    ];
  }
  const [cx, cy, cz] = TRAY.center;
  const hw = TRAY.width / 2;
  const hd = TRAY.depth / 2;
  const [lx, ly, lz] = TRAY_LABEL.position;
  const [lw, lh] = TRAY_LABEL.scale;
  return [
    {
      kind: "rect",
      minPx: DROP_ZONE_FLOOR_MIN_PX,
      points: [
        [cx - hw, cy, cz - hd],
        [cx + hw, cy, cz - hd],
        [cx - hw, cy, cz + hd],
        [cx + hw, cy, cz + hd],
      ],
    },
    {
      kind: "rect",
      points: [
        [lx - lw / 2, ly - lh / 2, lz],
        [lx + lw / 2, ly + lh / 2, lz],
      ],
    },
    guide,
  ];
}

/**
 * 트레이 위 재료 자리: 선반에서 놓여 있던 칸의 바로 아래(x 동일)다. 어떤 순서로 올려도 같은 재료는 같은 자리에 놓여
 * 이름표가 이웃 선반 이름표를 가리지 않고, 되돌릴 때도 "원래 칸"이 어디인지 한눈에 보인다.
 */
export function traySlotPosition(id: IngredientId): Vec3 {
  return [SHELF_ORIGINS[id][0], TRAY.itemY, TRAY.center[2]];
}

// ---------- 카메라 ----------

export type FriedRiceStage = "order" | "prep";

/** 프레이밍 여유 비율 — 기본(0.82)보다 조금 타이트하게 잡아 세로가 긴 화면에서도 재료가 작아 보이지 않게 한다 */
export const FRAMING_MARGIN = 0.86;

export const FRIED_RICE_CAMERA: Record<FriedRiceStage, { position: Vec3; lookAt: Vec3 }> = {
  order: { position: [0, 2.0, 2.6], lookAt: [0, 1.74, -1.3] },
  prep: { position: [0, 1.85, 2.5], lookAt: [0, 1.6, -1.3] },
};

export function stageForPhase(phase: FriedRicePhase): FriedRiceStage {
  return phase === "order" ? "order" : "prep";
}

function boxCorners(center: Vec3, halfW: number, halfH: number, z = center[2]): Vec3[] {
  return [
    [center[0] - halfW, center[1] - halfH, z],
    [center[0] + halfW, center[1] - halfH, z],
    [center[0] - halfW, center[1] + halfH, z],
    [center[0] + halfW, center[1] + halfH, z],
  ];
}

const MENTOR_X = FRIED_RICE_MENTOR.x;
const MENTOR_Z = FRIED_RICE_MENTOR.z;

/** 선배 요리사의 얼굴·모자 — 어느 단계에서든 프레임 안에 있어야 하는 점들 */
function mentorPoints(): Vec3[] {
  const r = FRIED_RICE_MENTOR_HEAD_RADIUS;
  return [
    [MENTOR_X - r, FRIED_RICE_MENTOR_FACE_Y - r, MENTOR_Z],
    [MENTOR_X + r, FRIED_RICE_MENTOR_FACE_Y - r, MENTOR_Z],
    [MENTOR_X - r, FRIED_RICE_MENTOR_HAT_TOP_Y, MENTOR_Z],
    [MENTOR_X + r, FRIED_RICE_MENTOR_HAT_TOP_Y, MENTOR_Z],
  ];
}

/** 이 단계에서 반드시 보여야 하는 월드 좌표들(라벨·핀이 닿는 높이까지 포함) */
export function framingPointsFor(stage: FriedRiceStage): Vec3[] {
  if (stage === "order") {
    return [
      ...boxCorners(TICKET.center, TICKET.width / 2 + 0.06, TICKET.height / 2 + 0.06),
      // 주문표 아래 핀 높이
      [TICKET.center[0], COUNTER_TOP_Y - 0.1, TICKET.center[2] + 0.18],
      ...mentorPoints(),
    ];
  }
  const points: Vec3[] = [];
  for (const item of INGREDIENTS) {
    const o = SHELF_ORIGINS[item.id];
    // 아래: 핀 높이, 위: 이름표 윗면
    points.push([o[0] - 0.25, o[1] - 0.05, o[2] + 0.34], [o[0] + 0.25, o[1] + 0.52, o[2]]);
  }
  points.push(
    [TRAY.center[0] - TRAY.width / 2, TRAY.center[1], TRAY.center[2] + TRAY.depth / 2 + 0.06],
    [TRAY.center[0] + TRAY.width / 2, TRAY.center[1], TRAY.center[2] + TRAY.depth / 2 + 0.06],
    [TRAY.center[0], TRAY.center[1] + 0.34, TRAY.center[2]],
    // 조리대 앞면에 붙는 "준비 트레이" 이름표 아랫면
    [TRAY_LABEL.position[0], TRAY_LABEL.position[1] - TRAY_LABEL.scale[1] / 2, TRAY_LABEL.position[2]],
  );
  points.push(
    // 작은 주문표 + 그 아래 핀 높이
    ...boxCorners(MINI_TICKET.center, MINI_TICKET.width / 2 + 0.04, MINI_TICKET.height / 2 + 0.04),
    [MINI_TICKET.center[0], MINI_TICKET.center[1] - MINI_TICKET.height / 2 - 0.3, MINI_TICKET.center[2]],
  );
  // 3~5단계 대상: 팬, 앞줄 불 손잡이(이름표·핀 포함), 접시, 전달 벨
  points.push(
    [WOK.center[0] - WOK.radius, WOK.center[1], WOK.center[2] + 0.05],
    [WOK.center[0] + WOK.radius + 0.25, WOK.rimY + 0.1, WOK.center[2]],
    [KNOB_X[0] - KNOB_RADIUS, KNOB_Y + 0.5, KNOB_Z],
    [KNOB_X[2] + KNOB_LABEL_SCALE[0] / 2, KNOB_Y - 0.06, KNOB_Z + 0.36],
    [PLATE.center[0] - PLATE.radius, PLATE.center[1], PLATE.center[2] + PLATE.radius],
    [BELL.center[0] + 0.2, BELL.center[1] + 0.4, BELL.center[2]],
  );
  points.push(...mentorPoints());
  return points;
}

/**
 * 이미 수렴한 카메라(위치·FOV)를 순수 계산으로 구한다 — CameraRig가 매 프레임 이 값을 향해
 * 감쇠 보간하므로, 수렴 후 화면은 이 값과 같다(레이아웃 회귀 테스트와 렌더링이 같은 계산을 공유).
 */
export function convergedCamera(stage: FriedRiceStage, aspect: number) {
  const { position, lookAt } = FRIED_RICE_CAMERA[stage];
  const framing = fitCameraFraming({
    cameraPos: position,
    lookAt,
    points: framingPointsFor(stage),
    aspect,
    marginRatio: FRAMING_MARGIN,
  });
  const cameraPos = scaledCameraPosition(position, lookAt, framing.distanceScale);
  const fwdRaw: Vec3 = [lookAt[0] - cameraPos[0], lookAt[1] - cameraPos[1], lookAt[2] - cameraPos[2]];
  const len = Math.hypot(...fwdRaw);
  const forward: Vec3 = [fwdRaw[0] / len, fwdRaw[1] / len, fwdRaw[2] / len];
  return { cameraPos, forward, fovDeg: framing.fovDeg };
}

// ---------- 조작 대상 핀(F9 방식 DOM 오버레이용 스펙) ----------

/** 핀 위치는 대상의 화면상 "아래"에 오도록 이미 내려 잡은 월드 좌표다. */
export function pinsFor(state: FriedRiceState, interactive: boolean): TargetPinSpec[] {
  if (!interactive) return [];
  if (state.phase === "order") {
    if (state.order === "closed") {
      return [
        {
          id: "ticket",
          kind: "press",
          world: [TICKET.center[0], TICKET.center[1] - TICKET.height / 2 - 0.08, TICKET.center[2] + 0.14],
        },
      ];
    }
    return [
      {
        id: "request-note",
        kind: "press",
        world: [
          TICKET.center[0],
          TICKET.center[1] + TICKET.sticky.local[1] - TICKET.sticky.height / 2 - 0.1,
          TICKET.center[2] + 0.14,
        ],
      },
    ];
  }
  const miniTicketPin: TargetPinSpec = {
    id: "mini-ticket",
    kind: "press",
    world: [
      MINI_TICKET.center[0],
      MINI_TICKET.center[1] - MINI_TICKET.height / 2 - 0.16,
      MINI_TICKET.center[2] + 0.1,
    ],
  };
  if (state.phase === "cook") {
    // 트레이에 남은 재료를 눌러 팬에 넣는다
    const pins: TargetPinSpec[] = trayRemaining(state).map((id) => ({
      id: `tray-${id}`,
      kind: "press" as const,
      world: [SHELF_ORIGINS[id][0], TRAY.center[1] - 0.02, TRAY.center[2] + TRAY.depth / 2 + 0.1] as Vec3,
    }));
    return [...pins, miniTicketPin];
  }
  if (state.phase === "heat") {
    const pins: TargetPinSpec[] = HEAT_LEVELS.map((option, index) => ({
      id: `knob-${option.id}`,
      kind: "press" as const,
      world: [KNOB_X[index], KNOB_Y - 0.06, KNOB_Z + 0.3] as Vec3,
    }));
    return [...pins, miniTicketPin];
  }
  if (state.phase === "plate") {
    if (state.plated) {
      return [
        { id: "bell", kind: "press", world: [BELL.center[0], BELL.center[1] - 0.02, BELL.center[2] + 0.3] },
        miniTicketPin,
      ];
    }
    return [
      {
        id: "mound",
        kind: "drag",
        // 끄는 대상(팬 위 볶음밥) 바로 아래 — 접시 쪽 핀과 떨어져 어느 쪽이 "끌기"인지 헷갈리지 않게 한다
        world: [MOUND_ORIGIN[0], WOK.rimY - 0.08, WOK.center[2] + 0.42],
      },
      {
        id: "plate",
        kind: "drop",
        world: PLATE_DROP_PIN.world,
        anchor: PLATE_DROP_PIN.anchor,
      },
      miniTicketPin,
    ];
  }
  if (state.phase !== "prep") return [];
  const pins: TargetPinSpec[] = [];
  for (const item of INGREDIENTS) {
    if (state.tray.includes(item.id)) continue;
    const o = SHELF_ORIGINS[item.id];
    pins.push({ id: `ingredient-${item.id}`, kind: "drag", world: [o[0], o[1] + 0.01, o[2] + 0.32] });
  }
  pins.push({
    id: "tray",
    kind: "drop",
    world: TRAY_DROP_PIN.world,
    anchor: TRAY_DROP_PIN.anchor,
  });
  pins.push(miniTicketPin);
  return pins;
}

// ---------- 선배 요리사 자세 (선택 평가 없음 — 안내 동작만) ----------

/**
 * 선배 요리사는 화면 왼쪽(x=-0.85)에 서 있고, 캐릭터의 왼팔(armL)이 화면 오른쪽(조리대 중앙·주문표)을 향한다.
 * 모든 자세는 정적 목표값이며 ChefMentor가 부드럽게 보간한다(반복 동작 없음).
 */
export const FRIED_RICE_MENTOR_POSES = {
  /** 주문표를 가리킨다 */
  pointTicket: {
    ...MENTOR_HOLD.respond,
    headYaw: 0.3,
    armL: { fwd: 0.7, abd: 1.1, elbow: 0.25 },
  } satisfies MentorPose,
  /** 선반과 트레이 쪽 조리대를 가리킨다 */
  pointCounter: {
    ...MENTOR_HOLD.respond,
    headYaw: 0.22,
    headPitch: 0.1,
    armL: { fwd: 0.6, abd: 0.85, elbow: 0.2 },
  } satisfies MentorPose,
  /** 위쪽 벽의 작은 주문표를 가리킨다(양파를 올렸을 때) */
  pointMiniTicket: {
    ...MENTOR_HOLD.respond,
    headYaw: 0.34,
    headPitch: -0.06,
    armL: { fwd: 0.95, abd: 1.45, elbow: 0.12 },
  } satisfies MentorPose,
  /** 준비가 끝난 트레이 쪽으로 손바닥을 펴 보인다 */
  present: MENTOR_HOLD.present,
} as const;

export type FriedRiceMentorPoseKey = keyof typeof FRIED_RICE_MENTOR_POSES;

export function mentorPoseKeyFor(state: FriedRiceState): FriedRiceMentorPoseKey {
  if (state.phase === "order") return "pointTicket";
  if (state.phase === "done" || state.phase === "served") return "present";
  if (state.phase === "cook" || state.phase === "heat") return "pointCounter";
  if (state.phase === "plate") return state.plated ? "present" : "pointCounter";
  const status = prepStatus(state.tray);
  if (status.hasOnion) return "pointMiniTicket";
  if (status.ready) return "present";
  return "pointCounter";
}

/**
 * 드래그 중에는 끄는 대상만 포인터를 받는다. 다른 대상(트레이 재료·작은 주문표·이웃 선반 재료)의 hover 핸들러가
 * event.stopPropagation()으로 같은 이벤트의 뒤쪽 대상(포인터 캡처 중인 끄는 재료)에게 move가 전달되는 것을
 * 끊을 수 있어, 드래그가 시작되면 나머지는 핸들러를 달지 않는다(Codex 리뷰 반영).
 */
export function receivesPointer(interactive: boolean, anyDragging: boolean, selfDragging: boolean): boolean {
  return interactive && (!anyDragging || selfDragging);
}
