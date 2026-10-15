// ====================================================
// mentorPose.ts — 선배 요리사 연출 데이터 (F10, 순수 로직)
//
// ChefMentor.tsx(절차형 사람 리그)가 이 값을 관절 각도로 그대로 적용한다.
// React/Three.js에 의존하지 않아 단위 테스트로 연출 규칙을 고정할 수 있다.
//
// 원칙
//  - 연출은 "분위기"만 만든다. 선택지를 정답·오답으로 평가하는 동작(박수·엄지·고개 젓기 등)은
//    정의하지 않는다. 반응 연출은 어떤 선택을 했는지와 무관하게 같다(선택 id를 입력으로 받지 않는다).
//  - 반복 동작은 만들지 않는다. 손 흔들기만 정해진 횟수(WAVE_CYCLES)만 하고 멈춘다.
//  - reduced-motion이면 흔들기·끄덕임 진동을 빼고 같은 "의미 자세"만 정적으로 보여준다.
//
// 단위: 라디안. 캐릭터 앞=+z, 캐릭터의 왼쪽=+x(월드에서 조리대 중앙 쪽).
//   arm.fwd 앞으로 듦(+), arm.abd 몸 바깥으로 벌림(+), arm.elbow 팔꿈치 굽힘(+)
//   headYaw 시선 좌우(+: 캐릭터 왼쪽=조리대 쪽), headPitch 아래를 봄(+)
// ====================================================

// ---------- 배치·치수 (카메라 프레이밍과 레이아웃 테스트가 같은 값을 쓴다) ----------

/**
 * 배치: 조리대 뒤(구슬·토큰·타일보다 항상 카메라에서 먼 쪽)에 서 있어서 깊이 순서만으로도 조작 대상을
 * 가리지 않는다. x는 냄비(-0.9,-1.2) 바로 뒤라서 얼굴·어깨가 냄비 위로 보이고, 발판 높이(y)로
 * 상체를 냄비 윗선(약 1.37) 위로 올렸다. 높이는 상부장 밑면(2.55) 아래로 맞춘다.
 */
export const MENTOR_PLACEMENT = { x: -0.85, y: 0.13, z: -2.1, yaw: 0.2, scale: 1.25 } as const;

/** 스케일 1 기준 몸 치수(발바닥 y=0). 머리는 headScale배로 키워 작은 화면에서도 얼굴이 읽히게 한다. */
export const MENTOR_DIMS = {
  legH: 0.55,
  torsoH: 0.5,
  neckH: 0.07,
  headScale: 1.12,
  /** 머리 기준점에서 얼굴 구 중심까지 */
  faceCenterRel: 0.2,
  /** 머리 기준점에서 모자 꼭대기까지(머리 스케일 적용 전) */
  hatTopRel: 0.71,
} as const;

function mentorWorldY(relFromHeadPivot: number): number {
  const { legH, torsoH, neckH, headScale } = MENTOR_DIMS;
  return (legH + torsoH + neckH + relFromHeadPivot * headScale) * MENTOR_PLACEMENT.scale + MENTOR_PLACEMENT.y;
}

/** 얼굴 구 중심의 월드 y */
export const MENTOR_FACE_Y = mentorWorldY(MENTOR_DIMS.faceCenterRel);
/** 모자 꼭대기의 월드 y */
export const MENTOR_HAT_TOP_Y = mentorWorldY(MENTOR_DIMS.hatTopRel);
/** 얼굴(머리 구) 반지름의 월드 크기 */
export const MENTOR_HEAD_RADIUS = 0.215 * MENTOR_DIMS.headScale * MENTOR_PLACEMENT.scale;

export interface MentorArm {
  fwd: number;
  abd: number;
  elbow: number;
}

export interface MentorPose {
  headYaw: number;
  headPitch: number;
  headRoll: number;
  torsoLean: number;
  torsoYaw: number;
  armL: MentorArm; // 조리대 쪽 팔
  armR: MentorArm; // 바깥쪽 팔(손 흔들기)
}

/** 씬 상태에서 유도하는 연출 단서. 선택 내용은 담지 않는다. */
export type MentorCue = "greet" | "watch" | "respond" | "present";

const REST_ARM: MentorArm = { fwd: 0.05, abd: 0.14, elbow: 0.18 };

export const MENTOR_REST: MentorPose = {
  headYaw: 0,
  headPitch: 0.02,
  headRoll: 0,
  torsoLean: 0,
  torsoYaw: 0,
  armL: REST_ARM,
  armR: REST_ARM,
};

function pose(overrides: Partial<MentorPose>): MentorPose {
  return { ...MENTOR_REST, ...overrides };
}

/** 손 흔들기: 정해진 횟수만 하고 멈춘다(반복 움직임 절제). */
export const WAVE_CYCLES = 2;
export const WAVE_DURATION_S = 1.2;
const WAVE_AMPLITUDE = 0.32;
/** 끄덕임: 한 번(내려갔다 올라옴)만 하고 멈춘다. */
export const NOD_DURATION_S = 0.8;
const NOD_AMPLITUDE = 0.26;

/** 정적(최종) 자세 — reduced-motion과 연출이 끝난 뒤의 유지 자세가 같은 값이다. */
export const MENTOR_HOLD: Record<MentorCue, MentorPose> = {
  // 도입: 사용자 쪽(앞)을 바라보며 바깥쪽 손을 가볍게 든다
  greet: pose({
    headYaw: -0.05,
    headPitch: -0.04,
    armR: { fwd: 1.15, abd: 0.55, elbow: 1.45 },
  }),
  // 선택 중: 조리대 쪽을 바라보며 기다린다(손은 내려둔다)
  watch: pose({
    headYaw: 0.32,
    headPitch: 0.04,
    torsoYaw: 0.06,
    armL: { fwd: 0.1, abd: 0.16, elbow: 0.3 },
  }),
  // 반응: 끄덕인 뒤 조리대 쪽을 손으로 가리킨다
  respond: pose({
    headYaw: 0.3,
    headPitch: -0.02,
    torsoYaw: 0.12,
    armL: { fwd: 0.55, abd: 1.2, elbow: 0.2 },
  }),
  // 결과: 완성 접시 쪽으로 손바닥을 펴 소개한다
  present: pose({
    headYaw: 0.28,
    headPitch: 0.0,
    torsoLean: 0.03,
    torsoYaw: 0.1,
    armL: { fwd: 0.95, abd: 0.75, elbow: 0.75 },
  }),
};

/**
 * 단서(cue)와 그 단서가 시작된 뒤 경과 시간으로 "지금 목표 자세"를 계산한다.
 * reduced=true이면 경과 시간과 무관하게 정적 자세만 돌려준다.
 */
export function mentorTargetPose(cue: MentorCue, elapsedS: number, reduced: boolean): MentorPose {
  const hold = MENTOR_HOLD[cue];
  if (reduced) return hold;
  if (cue === "greet" && elapsedS >= 0 && elapsedS < WAVE_DURATION_S) {
    const wave = Math.sin((elapsedS / WAVE_DURATION_S) * Math.PI * 2 * WAVE_CYCLES) * WAVE_AMPLITUDE;
    // 위팔이 앞으로 올라간 상태라 abd를 흔들면 손이 화면에서 좌우로 흔들려 "손 흔들기"로 읽힌다
    return { ...hold, armR: { ...hold.armR, abd: hold.armR.abd + wave } };
  }
  if (cue === "respond" && elapsedS >= 0 && elapsedS < NOD_DURATION_S) {
    const nod = Math.sin((elapsedS / NOD_DURATION_S) * Math.PI * 2) * NOD_AMPLITUDE;
    // 끄덕이는 동안은 팔을 아직 내려 둔다 — 끄덕임이 끝난 뒤에 가리킨다
    return { ...MENTOR_HOLD.watch, headPitch: MENTOR_HOLD.watch.headPitch + nod };
  }
  return hold;
}

/** 두 자세 사이를 t(0~1)만큼 보간한다. */
export function lerpMentorPose(a: MentorPose, b: MentorPose, t: number): MentorPose {
  const l = (x: number, y: number) => x + (y - x) * t;
  const arm = (p: MentorArm, q: MentorArm): MentorArm => ({
    fwd: l(p.fwd, q.fwd),
    abd: l(p.abd, q.abd),
    elbow: l(p.elbow, q.elbow),
  });
  return {
    headYaw: l(a.headYaw, b.headYaw),
    headPitch: l(a.headPitch, b.headPitch),
    headRoll: l(a.headRoll, b.headRoll),
    torsoLean: l(a.torsoLean, b.torsoLean),
    torsoYaw: l(a.torsoYaw, b.torsoYaw),
    armL: arm(a.armL, b.armL),
    armR: arm(a.armR, b.armR),
  };
}

/** XrChefClient의 진행 단계 → 연출 단서. 선택 내용(choice id·축)은 입력으로 받지 않는다. */
export function mentorCueForPhase(phase: "intro" | "choosing" | "reaction" | "result"): MentorCue {
  switch (phase) {
    case "intro":
      return "greet";
    case "choosing":
      return "watch";
    case "reaction":
      return "respond";
    case "result":
      return "present";
  }
}

/** 지수 감쇠 보간 계수 — 프레임레이트와 무관하게 half-life 기준으로 접근한다. */
export function mentorEaseAlpha(deltaS: number, halfLifeS = 0.14): number {
  if (!(deltaS > 0)) return 0;
  return 1 - Math.pow(0.5, deltaS / halfLifeS);
}
