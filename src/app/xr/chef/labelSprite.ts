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
// ====================================================

import { CanvasTexture, Sprite, SpriteMaterial } from "three";

const CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 128;

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
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  const r = 18;
  const w = CANVAS_WIDTH - 8;
  const h = CANVAS_HEIGHT - 8;
  ctx.beginPath();
  ctx.moveTo(4 + r, 4);
  ctx.arcTo(4 + w, 4, 4 + w, 4 + h, r);
  ctx.arcTo(4 + w, 4 + h, 4, 4 + h, r);
  ctx.arcTo(4, 4 + h, 4, 4, r);
  ctx.arcTo(4, 4, 4 + w, 4, r);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#3f2a1a";
  ctx.font = "600 24px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lines = wrapLines(ctx, text, CANVAS_WIDTH - 32).slice(0, 3);
  const lineHeight = 28;
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
