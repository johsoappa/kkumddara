// ====================================================
// labelSprite.ts — 씬 안 선택 타겟용 텍스트 라벨 (G2.1-R1)
//
// drei <Html>이 없고 외부 폰트/텍스처 에셋도 금지되어 있어, 브라우저
// 기본 2D Canvas로 라벨을 그려 THREE.CanvasTexture로 사용한다.
// THREE.Sprite는 항상 카메라를 향하므로(billboard) 별도의 화면-투영
// 계산 없이도 라벨이 항상 정면으로 보인다.
//
// Three.js에만 의존하고 React는 쓰지 않는다 — SceneInteractions.tsx가
// 이 함수를 <primitive object={...} />로 감싸 렌더링한다.
//
// G2.1-R1-F3 — 라벨 가독성 보정: 텍스처 해상도를 2배로, 글꼴을 굵고 크게,
// 배경을 완전 불투명으로, 테두리를 추가했다. 스프라이트의 월드 공간
// 크기(LABEL_SCALE_*, interactions3d.ts)는 그대로 두어 카메라 프레이밍·
// 타겟 간격 재검증이 필요 없게 했다.
//
// G2.1-R1-F4 — 완전 가독성 보정: 고정 글자 크기(46px)로는 문구에 따라
// 2줄 안에 다 들어가지 않아 wrapLines가 자동으로 초과 줄을 잘라버릴 수
// 있었다(내용 손실). 이제 글자 크기를 큰 값에서부터 줄여가며 "2줄 안에
// 온전히 들어가는" 첫 크기를 찾는 shrink-to-fit 방식으로 바꿔, 문구
// 길이에 관계없이 잘림 없이 완전히 표시되도록 보장한다. 배경/텍스트
// 내부 여백도 늘려 굵은 글씨의 획이 테두리에 닿지 않게 했다.
//
// G2.1-R1-F15 — 1~3단계 라벨 가독성 보정: 카메라 거리·FOV·앵커 배치는
// 이미 여러 차례(F1~F10) 실측으로 확정된 값이라 재조정 시 냄비·후드·
// 이웃 라벨과의 회귀 위험이 크다(재검증 결과 압도 확인). 대신 스프라이트의
// "월드 공간 크기"(따라서 카메라 프레이밍·충돌 여부)는 그대로 두고,
// 같은 박스 안에 그려지는 글자를 더 크고 굵게 그리는 emphasize 모드를
// 추가했다 — 화면상 라벨 박스 위치/크기는 baseline과 완전히 동일하므로
// 프레이밍·충돌 회귀가 원천적으로 생기지 않는다. emphasize=false(기본값)
// 경로는 기존 출력과 100% 동일하다(호출부를 바꾸지 않는 한 아무 동작도
// 바뀌지 않는다).
// ====================================================

import { CanvasTexture, Sprite, SpriteMaterial } from "three";

const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 256;
const MAX_LINES = 2;
const FONT_WEIGHT = 700;
const MAX_FONT_SIZE = 46;
const MIN_FONT_SIZE = 24;
const FONT_STEP = 2;
/** 캔버스 가장자리부터 둥근 사각형 배경까지의 여백(이전 8px → 14px, 텍스처 내부 여백 확대) */
const BG_INSET = 14;
const BG_RADIUS = 34;
const BORDER_WIDTH = 6;
/** 배경 안쪽에서 실제 글자가 차지할 수 있는 좌우 여백(이전 32px → 44px) */
const TEXT_SIDE_MARGIN = 44;
const TEXT_MAX_WIDTH = CANVAS_WIDTH - TEXT_SIDE_MARGIN * 2;

// ---- G2.1-R1-F15 emphasize 전용 치수 — 스프라이트 world 크기는 건드리지 않고
// 텍스처 내부 글자만 더 크고 여백을 좁혀 그린다 ----
const EMPHASIZE_MAX_FONT_SIZE = 70;
const EMPHASIZE_MIN_FONT_SIZE = 30;
const EMPHASIZE_BG_INSET = 10;
const EMPHASIZE_BORDER_WIDTH = 8;
const EMPHASIZE_TEXT_SIDE_MARGIN = 28;
const EMPHASIZE_TEXT_MAX_WIDTH = CANVAS_WIDTH - EMPHASIZE_TEXT_SIDE_MARGIN * 2;

export function wrapLines(
  measureWidth: (text: string) => number,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && measureWidth(candidate) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export interface FitTextToLinesOptions {
  maxFontSize: number;
  minFontSize: number;
  fontStep: number;
  maxLines: number;
}

/**
 * 주어진 텍스트가 maxWidth 기준 maxLines줄 안에 온전히 들어가는 가장 큰 글자
 * 크기를 찾는다(내용을 자르지 않고 완전히 표시하는 것이 최우선). 최소
 * 크기(minFontSize)에서도 넘치면, 그 이상 줄이지 않고 최소 크기의 wrap
 * 결과를 그대로 쓴다 — 이 경우도 slice로 줄을 버리지 않으므로 글자가 다소
 * 빽빽해질 뿐 내용 손실은 없다.
 *
 * measureWidthAt: 주어진 fontSize에서 문자열의 렌더 폭을 재는 함수(실제
 * 렌더링에서는 canvas 2D ctx.measureText, 테스트에서는 결정적인 모의 측정
 * 함수를 주입한다) — canvas가 없는 jsdom 환경에서도 이 로직을 그대로
 * 단위 테스트할 수 있게 하기 위한 의존성 주입이다.
 */
export function fitTextToLines(
  text: string,
  maxWidth: number,
  measureWidthAt: (text: string, fontSize: number) => number,
  { maxFontSize, minFontSize, fontStep, maxLines }: FitTextToLinesOptions,
): { fontSize: number; lines: string[] } {
  let fontSize = maxFontSize;
  let lines: string[] = [];
  for (; fontSize >= minFontSize; fontSize -= fontStep) {
    const size = fontSize;
    lines = wrapLines((t) => measureWidthAt(t, size), text, maxWidth);
    if (lines.length <= maxLines) {
      return { fontSize, lines };
    }
  }
  lines = wrapLines((t) => measureWidthAt(t, minFontSize), text, maxWidth);
  return { fontSize: minFontSize, lines };
}

/** 둥근 사각형 배경 + 줄바꿈 텍스트를 그린 THREE.Sprite를 만든다.
 * scale: 좁은 간격에 여러 개를 배치할 때(재료 토큰·순서 타일) 겹침을 줄이기 위해
 * 기본값(0.85 x 0.42)보다 작은 값을 넘길 수 있다.
 * emphasize: true면 스프라이트의 world 크기(scale)는 그대로 두고, 텍스처
 * 안에 그려지는 글자만 더 크고 굵게·배경 여백은 좁게 그린다(G2.1-R1-F15,
 * 1~3단계 전용) — 화면상 라벨 박스의 위치·크기는 baseline과 동일하므로
 * 카메라 프레이밍/충돌 계산에 영향이 없다. */
export function createLabelSprite(
  text: string,
  scale: [number, number] = [0.85, 0.42],
  emphasize: boolean = false,
): Sprite {
  const material = new SpriteMaterial({ transparent: true, depthTest: false });
  const sprite = new Sprite(material);
  sprite.scale.set(scale[0], scale[1], 1);
  sprite.renderOrder = 10;

  if (typeof document === "undefined") {
    return sprite;
  }

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return sprite;

  const bgInset = emphasize ? EMPHASIZE_BG_INSET : BG_INSET;
  const borderWidth = emphasize ? EMPHASIZE_BORDER_WIDTH : BORDER_WIDTH;
  const textMaxWidth = emphasize ? EMPHASIZE_TEXT_MAX_WIDTH : TEXT_MAX_WIDTH;

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const r = BG_RADIUS;
  const w = CANVAS_WIDTH - bgInset * 2;
  const h = CANVAS_HEIGHT - bgInset * 2;
  ctx.beginPath();
  ctx.moveTo(bgInset + r, bgInset);
  ctx.arcTo(bgInset + w, bgInset, bgInset + w, bgInset + h, r);
  ctx.arcTo(bgInset + w, bgInset + h, bgInset, bgInset + h, r);
  ctx.arcTo(bgInset, bgInset + h, bgInset, bgInset, r);
  ctx.arcTo(bgInset, bgInset, bgInset + w, bgInset, r);
  ctx.closePath();
  ctx.fillStyle = "#fff6e8";
  ctx.fill();
  ctx.lineWidth = borderWidth;
  ctx.strokeStyle = "#8a6f4d";
  ctx.stroke();

  ctx.fillStyle = "#20130a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const measureWidthAt = (t: string, fontSize: number) => {
    ctx.font = `${FONT_WEIGHT} ${fontSize}px sans-serif`;
    return ctx.measureText(t).width;
  };
  const { fontSize, lines } = fitTextToLines(text, textMaxWidth, measureWidthAt, {
    maxFontSize: emphasize ? EMPHASIZE_MAX_FONT_SIZE : MAX_FONT_SIZE,
    minFontSize: emphasize ? EMPHASIZE_MIN_FONT_SIZE : MIN_FONT_SIZE,
    fontStep: FONT_STEP,
    maxLines: MAX_LINES,
  });
  ctx.font = `${FONT_WEIGHT} ${fontSize}px sans-serif`;
  const lineHeight = fontSize * 1.13;
  const startY = CANVAS_HEIGHT / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, CANVAS_WIDTH / 2, startY + i * lineHeight);
  });

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  material.map = texture;
  material.needsUpdate = true;
  return sprite;
}
