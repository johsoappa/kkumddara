// ====================================================
// friedRiceTextures.ts — 주문표·요청 메모를 2D Canvas로 그려 CanvasTexture로 만든다 (F11)
//
// 외부 이미지/폰트 에셋 없이 기본 Canvas 2D만 쓴다(labelSprite.ts와 같은 방식).
// document/Canvas가 없는 환경(SSR·jsdom)에서는 null을 돌려주고, 호출부는 단색 재질로 대체한다.
// 긴 문장은 3D 텍스트에 의존하지 않도록 짧게만 쓴다(메뉴명·요청 한 줄).
// ====================================================

import { CanvasTexture } from "three";
import { ORDER } from "./friedRice";

export type TicketFace = "cover" | "menu";
export type NoteFace = "pending" | "checked";

const PAPER = "#fffaf0";
const INK = "#2a2320";
const RED = "#c83a20";
const BAND = "#3f4a52";
const NOTE = "#ffe27a";
const NOTE_CHECKED = "#c8efc4";

function makeCanvas(width: number, height: number): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas.getContext("2d");
}

function toTexture(ctx: CanvasRenderingContext2D): CanvasTexture {
  const texture = new CanvasTexture(ctx.canvas);
  texture.needsUpdate = true;
  return texture;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function font(weight: number, px: number): string {
  return `${weight} ${px}px sans-serif`;
}

/** 주문표 판: 덮여 있을 때는 "눌러서 확인", 열리면 메뉴·수량이 보인다. 요청은 별도 노란 메모가 맡는다. */
export function drawTicketTexture(face: TicketFace): CanvasTexture | null {
  const ctx = makeCanvas(512, 640);
  if (!ctx) return null;
  ctx.fillStyle = PAPER;
  roundRect(ctx, 6, 6, 500, 628, 28);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = BAND;
  ctx.stroke();

  // 윗띠
  ctx.fillStyle = BAND;
  roundRect(ctx, 6, 6, 500, 110, 28);
  ctx.fill();
  ctx.fillRect(6, 70, 500, 46);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font(800, 62);
  ctx.fillText("주문표", 256, 62);

  if (face === "cover") {
    ctx.fillStyle = RED;
    ctx.font = font(800, 66);
    ctx.fillText("새 주문", 256, 230);
    ctx.fillStyle = INK;
    ctx.font = font(700, 54);
    ctx.fillText("눌러서", 256, 340);
    ctx.fillText("확인하기", 256, 410);
    // 접힌 모서리 표시
    ctx.fillStyle = "#eadfc9";
    ctx.beginPath();
    ctx.moveTo(506, 520);
    ctx.lineTo(506, 634);
    ctx.lineTo(392, 634);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = "#7a6a58";
    ctx.font = font(700, 40);
    ctx.fillText("메뉴", 256, 168);
    ctx.fillStyle = INK;
    ctx.font = font(800, 76);
    ctx.fillText(ORDER.menu, 256, 248);
    ctx.fillStyle = RED;
    ctx.font = font(800, 60);
    ctx.fillText(`${ORDER.quantity}개`, 256, 330);
    // 점선
    ctx.strokeStyle = "#b8a98f";
    ctx.lineWidth = 5;
    ctx.setLineDash([14, 12]);
    ctx.beginPath();
    ctx.moveTo(40, 392);
    ctx.lineTo(472, 392);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  return toTexture(ctx);
}

/** 요청 메모(노란 포스트잇). checked면 초록으로 바뀌고 "확인했어요"가 붙는다(색에만 기대지 않도록 글자도 바뀐다). */
export function drawNoteTexture(face: NoteFace): CanvasTexture | null {
  const ctx = makeCanvas(512, 256);
  if (!ctx) return null;
  ctx.fillStyle = face === "checked" ? NOTE_CHECKED : NOTE;
  roundRect(ctx, 6, 6, 500, 244, 18);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = face === "checked" ? "#4c9a54" : "#c9a11f";
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#6b5a14";
  ctx.font = font(700, 38);
  ctx.fillText(face === "checked" ? "요청 · 확인했어요" : "요청 · 눌러서 확인", 256, 62);
  ctx.fillStyle = INK;
  ctx.font = font(800, 70);
  ctx.fillText(ORDER.request, 256, 160);
  return toTexture(ctx);
}

/** 재료 준비 중 벽에 걸어 두는 작은 주문표 — 메뉴와 요청을 한눈에. */
export function drawMiniTicketTexture(): CanvasTexture | null {
  const ctx = makeCanvas(384, 480);
  if (!ctx) return null;
  ctx.fillStyle = PAPER;
  roundRect(ctx, 5, 5, 374, 470, 22);
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = BAND;
  ctx.stroke();
  ctx.fillStyle = BAND;
  roundRect(ctx, 5, 5, 374, 84, 22);
  ctx.fill();
  ctx.fillRect(5, 54, 374, 35);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font(800, 50);
  ctx.fillText("주문표", 192, 48);
  ctx.fillStyle = INK;
  ctx.font = font(800, 54);
  ctx.fillText(ORDER.menu, 192, 160);
  ctx.fillStyle = RED;
  ctx.font = font(800, 46);
  ctx.fillText(`${ORDER.quantity}개`, 192, 226);
  ctx.fillStyle = NOTE;
  roundRect(ctx, 28, 280, 328, 150, 14);
  ctx.fill();
  ctx.strokeStyle = "#c9a11f";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = "#6b5a14";
  ctx.font = font(700, 32);
  ctx.fillText("요청", 192, 316);
  ctx.fillStyle = INK;
  ctx.font = font(800, 46);
  ctx.fillText(ORDER.requestShort, 192, 380);
  return toTexture(ctx);
}
