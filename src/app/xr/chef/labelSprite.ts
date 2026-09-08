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

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * 주어진 텍스트가 maxWidth 기준 최대 MAX_LINES줄 안에 온전히 들어가는 가장 큰
 * 글자 크기를 찾는다(내용을 자르지 않고 완전히 표시하는 것이 최우선). 최소
 * 크기(MIN_FONT_SIZE)에서도 넘치면, 그 이상 줄이지 않고 최소 크기의 wrap
 * 결과를 그대로 쓴다 — 이 경우도 slice로 줄을 버리지 않으므로 글자가 다소
 * 빽빽해질 뿐 내용 손실은 없다.
 */
function fitTextToLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): { fontSize: number; lines: string[] } {
  let fontSize = MAX_FONT_SIZE;
  let lines: string[] = [];
  for (; fontSize >= MIN_FONT_SIZE; fontSize -= FONT_STEP) {
    ctx.font = `${FONT_WEIGHT} ${fontSize}px sans-serif`;
    lines = wrapLines(ctx, text, maxWidth);
    if (lines.length <= MAX_LINES) {
      return { fontSize, lines };
    }
  }
  ctx.font = `${FONT_WEIGHT} ${MIN_FONT_SIZE}px sans-serif`;
  lines = wrapLines(ctx, text, maxWidth);
  return { fontSize: MIN_FONT_SIZE, lines };
}

/** 둥근 사각형 배경 + 줄바꿈 텍스트를 그린 THREE.Sprite를 만든다.
 * scale: 좁은 간격에 여러 개를 배치할 때(재료 토큰·순서 타일) 겹침을 줄이기 위해
 * 기본값(0.85 x 0.42)보다 작은 값을 넘길 수 있다. */
export function createLabelSprite(text: string, scale: [number, number] = [0.85, 0.42]): Sprite {
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
  ctx.fillStyle = "#fff6e8";
  ctx.fill();
  ctx.lineWidth = BORDER_WIDTH;
  ctx.strokeStyle = "#8a6f4d";
  ctx.stroke();

  ctx.fillStyle = "#20130a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const { fontSize, lines } = fitTextToLines(ctx, text, TEXT_MAX_WIDTH);
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
