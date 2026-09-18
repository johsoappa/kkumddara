// ====================================================
// vetLabelSprite.ts — 씬 안 선택 타깃용 텍스트 라벨 (G2.2-R2)
//
// 요리사 labelSprite.ts와 같은 방식(2D Canvas → THREE.CanvasTexture →
// billboard Sprite)이지만, 이 파일 안에서 독립적으로 재구현했다 — 두
// 직업의 씬 파일이 서로 참조하지 않는다는 기존 설계 원칙을 그대로 따른다.
// 수의사는 동시에 나타나는 타깃이 최대 3개뿐이라(요리사의 촘촘한 타일
// 배치와 달리) emphasize 단계 구분 없이 항상 큰 글자로 그린다.
// ====================================================

import { CanvasTexture, Sprite, SpriteMaterial } from "three";

const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 256;
const MAX_LINES = 2;
const FONT_WEIGHT = 700;
const MAX_FONT_SIZE = 58;
const MIN_FONT_SIZE = 28;
const FONT_STEP = 2;
const BG_INSET = 12;
const BG_RADIUS = 36;
const BORDER_WIDTH = 7;
const TEXT_SIDE_MARGIN = 36;
const TEXT_MAX_WIDTH = CANVAS_WIDTH - TEXT_SIDE_MARGIN * 2;

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
 * 주어진 텍스트가 maxWidth 기준 maxLines줄 안에 온전히 들어가는 가장 큰
 * 글자 크기를 찾는다(내용을 자르지 않고 완전히 표시하는 것이 최우선).
 * measureWidthAt을 주입받아 canvas 없는 jsdom에서도 이 로직만 독립적으로
 * 단위 테스트할 수 있다(요리사 labelSprite.ts와 동일한 설계).
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

/** 둥근 사각형 배경 + 줄바꿈 텍스트를 그린 THREE.Sprite를 만든다. Sprite는 항상
 *  카메라를 향해 세워지므로(billboard) 별도 화면-투영 계산이 필요 없다. */
export function createVetLabelSprite(text: string, scale: [number, number] = [0.85, 0.42]): Sprite {
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

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const r = BG_RADIUS;
  const w = CANVAS_WIDTH - BG_INSET * 2;
  const h = CANVAS_HEIGHT - BG_INSET * 2;
  ctx.beginPath();
  ctx.moveTo(BG_INSET + r, BG_INSET);
  ctx.arcTo(BG_INSET + w, BG_INSET, BG_INSET + w, BG_INSET + h, r);
  ctx.arcTo(BG_INSET + w, BG_INSET + h, BG_INSET, BG_INSET + h, r);
  ctx.arcTo(BG_INSET, BG_INSET + h, BG_INSET, BG_INSET, r);
  ctx.arcTo(BG_INSET, BG_INSET, BG_INSET + w, BG_INSET, r);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = BORDER_WIDTH;
  ctx.strokeStyle = "#2f6f66";
  ctx.stroke();

  ctx.fillStyle = "#173330";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const measureWidthAt = (t: string, fontSize: number) => {
    ctx.font = `${FONT_WEIGHT} ${fontSize}px sans-serif`;
    return ctx.measureText(t).width;
  };
  const { fontSize, lines } = fitTextToLines(text, TEXT_MAX_WIDTH, measureWidthAt, {
    maxFontSize: MAX_FONT_SIZE,
    minFontSize: MIN_FONT_SIZE,
    fontStep: FONT_STEP,
    maxLines: MAX_LINES,
  });
  ctx.font = `${FONT_WEIGHT} ${fontSize}px sans-serif`;
  const lineHeight = fontSize * 1.15;
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
