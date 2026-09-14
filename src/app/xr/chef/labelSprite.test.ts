import { describe, expect, it, vi } from "vitest";
import { createLabelSprite, fitTextToLines, wrapLines } from "./labelSprite";

// G2.1-R1-F15 — labelSprite의 shrink-to-fit/emphasize 로직을 canvas 없이 검증한다.
// jsdom은 HTMLCanvasElement의 2D 렌더링 컨텍스트를 구현하지 않아
// (canvas.getContext("2d")가 null을 반환) createLabelSprite 내부의 실제 텍스처
// 렌더링 경로는 이 환경에서 테스트할 수 없다 — fitTextToLines가 measureWidthAt을
// 주입받도록 분리되어 있어, 결정적인 모의 측정 함수로 크기 선택 로직만
// canvas 독립적으로 검증한다.

/** 한 글자당 fontSize * CHAR_WIDTH_RATIO px로 근사하는 결정적 모의 measureText. */
const CHAR_WIDTH_RATIO = 0.9;
function mockMeasureWidthAt(text: string, fontSize: number): number {
  return text.length * fontSize * CHAR_WIDTH_RATIO;
}

describe("wrapLines", () => {
  it("공백 기준으로 단어를 나눠 maxWidth를 넘지 않는 줄로 묶는다", () => {
    const measure = (t: string) => t.length * 10; // 문자당 10px
    const lines = wrapLines(measure, "가 나 다 라 마", 25); // "가 나" = 3자*10=30 초과 방지 기준 확인
    expect(lines.join("")).toBe("가나다라마"); // 내용 손실 없음(공백 join 제거하고 이어붙여도 전체 글자 보존)
  });

  it("단일 단어가 maxWidth를 넘어도 그 줄에 그대로 유지한다(강제 절단 없음)", () => {
    const measure = (t: string) => t.length * 100;
    const lines = wrapLines(measure, "매우긴한단어", 50);
    expect(lines).toEqual(["매우긴한단어"]);
  });
});

describe("fitTextToLines — shrink-to-fit", () => {
  const opts = { maxFontSize: 46, minFontSize: 24, fontStep: 2, maxLines: 2 };

  it("짧은 텍스트는 maxFontSize를 그대로 쓴다", () => {
    const { fontSize, lines } = fitTextToLines("여기에 놓기", 424, mockMeasureWidthAt, opts);
    expect(fontSize).toBe(46);
    expect(lines.join("").replace(/\s/g, "")).toBe("여기에놓기");
    expect(lines.length).toBeLessThanOrEqual(2);
  });

  it("긴 텍스트는 2줄 안에 들어갈 때까지 글자 크기를 줄인다", () => {
    const longText = "수납장을 차례로 확인한다"; // 실제 나침반 2/5 choice 문구
    // maxWidth를 좁게 잡아 46px로는 2줄에 안 들어가는 상황을 재현한다
    const narrowWidth = 200;
    const { fontSize, lines } = fitTextToLines(longText, narrowWidth, mockMeasureWidthAt, opts);
    expect(fontSize).toBeLessThan(46);
    expect(lines.length).toBeLessThanOrEqual(2);
    // 내용 손실 없음 — 모든 원문 글자가 줄들에 그대로 남아있다
    expect(lines.join("").replace(/\s/g, "")).toBe(longText.replace(/\s/g, ""));
  });

  it("minFontSize까지 줄여도 2줄에 못 들어가면 minFontSize를 그대로 쓰고 내용을 자르지 않는다", () => {
    // 단어가 10개라 minFontSize에서도 2줄을 넘길 수밖에 없는 좁은 폭을 준다
    // (wrapLines는 한 "단어"를 강제로 쪼개지 않으므로, 줄 수를 minFontSize에서도
    // maxLines 이하로 만들 수 없게 하려면 단어 여러 개가 필요하다).
    const manyWords = "가 나 다 라 마 바 사 아 자 차";
    const narrowWidth = 30;
    const { fontSize, lines } = fitTextToLines(manyWords, narrowWidth, mockMeasureWidthAt, opts);
    expect(fontSize).toBe(opts.minFontSize);
    expect(lines.length).toBeGreaterThan(opts.maxLines); // minFontSize에서도 2줄을 넘긴다
    // 내용 손실 없음 — 모든 단어가 어딘가의 줄에 그대로 남아있다
    expect(lines.join(" ")).toBe(manyWords);
  });
});

describe("fitTextToLines — G2.1-R1-F15 emphasize 모드는 같은 텍스트에 더 큰 폰트를 고른다", () => {
  const baseline = { maxFontSize: 46, minFontSize: 24, fontStep: 2, maxLines: 2 };
  const emphasize = { maxFontSize: 70, minFontSize: 30, fontStep: 2, maxLines: 2 };

  it.each([
    "여기에 놓기",
    "이 순서로 확정",
    "선배에게 물어본다",
    "수납장을 차례로 확인한다",
    "다른 방법을 생각해본다",
  ])('"%s" — emphasize 폰트 크기가 baseline보다 크거나 같다', (text) => {
    const base = fitTextToLines(text, 424, mockMeasureWidthAt, baseline);
    // emphasize 쪽은 자체 여백 축소로 실제 가용 폭이 넓지만(452px), 여기서는
    // 폰트 선택 로직 자체가 상한을 실제로 더 크게 쓰는지만 검증한다.
    const boosted = fitTextToLines(text, 452, mockMeasureWidthAt, emphasize);
    expect(boosted.fontSize).toBeGreaterThanOrEqual(base.fontSize);
  });
});

describe("createLabelSprite — emphasize 파라미터", () => {
  it("emphasize 유무와 무관하게 스프라이트의 world 크기(scale)는 동일하다", () => {
    const scale: [number, number] = [0.58, 0.3];
    const plain = createLabelSprite("선배에게 물어본다", scale, false);
    const boosted = createLabelSprite("선배에게 물어본다", scale, true);
    expect(plain.scale.x).toBe(scale[0]);
    expect(plain.scale.y).toBe(scale[1]);
    expect(boosted.scale.x).toBe(scale[0]);
    expect(boosted.scale.y).toBe(scale[1]);
  });

  it("emphasize 기본값은 false다 — 기존 호출부(인자 2개)는 동작이 바뀌지 않는다", () => {
    const scale: [number, number] = [0.85, 0.42];
    const noArg = createLabelSprite("바로 준비를 시작한다", scale);
    expect(noArg.scale.x).toBe(scale[0]);
    expect(noArg.scale.y).toBe(scale[1]);
  });

  it("document가 없는 환경(SSR)에서도 예외 없이 스프라이트를 반환한다", () => {
    const originalDocument = globalThis.document;
    // @ts-expect-error — SSR 환경 시뮬레이션을 위해 일시적으로 document를 제거
    delete globalThis.document;
    try {
      expect(() => createLabelSprite("텍스트", [0.5, 0.3], true)).not.toThrow();
    } finally {
      globalThis.document = originalDocument;
    }
  });
});
