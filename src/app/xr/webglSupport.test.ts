import { describe, expect, it, vi, afterEach } from "vitest";
import { isWebglSupported } from "./webglSupport";

describe("isWebglSupported", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("WebGL 컨텍스트를 생성할 수 있으면 true를 반환한다", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      // 실제 브라우저 반환 타입과 일치시키지 않고 존재 여부만 검증하면 되므로 최소 mock만 둔다
      () => ({}) as unknown as RenderingContext,
    );

    expect(isWebglSupported()).toBe(true);
  });

  it("getContext가 webgl/experimental-webgl 모두 null이면 false를 반환한다", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    expect(isWebglSupported()).toBe(false);
  });

  it("getContext 호출 자체가 예외를 던져도 false를 반환한다(안전 폴백)", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
      throw new Error("컨텍스트 생성 실패");
    });

    expect(isWebglSupported()).toBe(false);
  });
});
