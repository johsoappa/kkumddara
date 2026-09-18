import { describe, expect, it } from "vitest";
import { createVetLabelSprite, fitTextToLines, wrapLines } from "./vetLabelSprite";

// 요리사 labelSprite.test.ts와 같은 이유로, jsdom은 HTMLCanvasElement의 2D 렌더링
// 컨텍스트를 구현하지 않아(canvas.getContext("2d")가 null) createVetLabelSprite
// 내부의 실제 텍스처 렌더링 경로는 이 환경에서 테스트할 수 없다. fitTextToLines가
// measureWidthAt을 주입받도록 분리되어 있어, 결정적인 모의 측정 함수로 크기
// 선택 로직만 canvas 독립적으로 검증한다.

const CHAR_WIDTH_RATIO = 0.9;
function mockMeasureWidthAt(text: string, fontSize: number): number {
  return text.length * fontSize * CHAR_WIDTH_RATIO;
}

describe("wrapLines", () => {
  it("공백 기준으로 단어를 나눠 maxWidth를 넘지 않는 줄로 묶는다", () => {
    const measure = (t: string) => t.length * 10;
    const lines = wrapLines(measure, "가 나 다 라 마", 25);
    expect(lines.join("")).toBe("가나다라마");
  });

  it("단일 단어가 maxWidth를 넘어도 그 줄에 그대로 유지한다(강제 절단 없음)", () => {
    const measure = (t: string) => t.length * 100;
    const lines = wrapLines(measure, "매우긴한단어", 50);
    expect(lines).toEqual(["매우긴한단어"]);
  });
});

describe("fitTextToLines — shrink-to-fit", () => {
  const opts = { maxFontSize: 58, minFontSize: 28, fontStep: 2, maxLines: 2 };

  it("짧은 텍스트는 maxFontSize를 그대로 쓴다", () => {
    const { fontSize, lines } = fitTextToLines("강아지", 440, mockMeasureWidthAt, opts);
    expect(fontSize).toBe(58);
    expect(lines.join("").replace(/\s/g, "")).toBe("강아지");
    expect(lines.length).toBeLessThanOrEqual(2);
  });

  it("긴 텍스트는 2줄 안에 들어갈 때까지 글자 크기를 줄인다", () => {
    const longText = "안내할 순서를 다시 정리한다"; // 실제 나침반 5/5 choice 문구
    const narrowWidth = 220;
    const { fontSize, lines } = fitTextToLines(longText, narrowWidth, mockMeasureWidthAt, opts);
    expect(fontSize).toBeLessThan(58);
    expect(lines.length).toBeLessThanOrEqual(2);
    expect(lines.join("").replace(/\s/g, "")).toBe(longText.replace(/\s/g, ""));
  });

  it("minFontSize까지 줄여도 2줄에 못 들어가면 minFontSize를 그대로 쓰고 내용을 자르지 않는다", () => {
    const manyWords = "가 나 다 라 마 바 사 아 자 차";
    const narrowWidth = 30;
    const { fontSize, lines } = fitTextToLines(manyWords, narrowWidth, mockMeasureWidthAt, opts);
    expect(fontSize).toBe(opts.minFontSize);
    expect(lines.length).toBeGreaterThan(opts.maxLines);
    expect(lines.join(" ")).toBe(manyWords);
  });
});

describe("createVetLabelSprite", () => {
  it("스프라이트의 world 크기(scale)는 전달한 값 그대로다", () => {
    const scale: [number, number] = [0.62, 0.31];
    const sprite = createVetLabelSprite("기록판", scale);
    expect(sprite.scale.x).toBe(scale[0]);
    expect(sprite.scale.y).toBe(scale[1]);
  });

  it("scale 인자를 생략하면 기본값(0.85 x 0.42)을 쓴다", () => {
    const sprite = createVetLabelSprite("선배 수의사");
    expect(sprite.scale.x).toBe(0.85);
    expect(sprite.scale.y).toBe(0.42);
  });

  it("document가 없는 환경(SSR)에서도 예외 없이 스프라이트를 반환한다", () => {
    const originalDocument = globalThis.document;
    // @ts-expect-error — SSR 환경 시뮬레이션을 위해 일시적으로 document를 제거
    delete globalThis.document;
    try {
      expect(() => createVetLabelSprite("강아지", [0.5, 0.3])).not.toThrow();
    } finally {
      globalThis.document = originalDocument;
    }
  });
});
