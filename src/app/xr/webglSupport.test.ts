import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";

// isWebglSupported는 "지원함" 결과를 모듈 안에 기억하므로, 테스트마다 모듈을 새로 불러 서로 영향을 주지 않게 한다.
async function loadFresh() {
  vi.resetModules();
  return import("./webglSupport");
}

describe("isWebglSupported", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("WebGL 컨텍스트를 생성할 수 있으면 true를 반환한다", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      // 실제 브라우저 반환 타입과 일치시키지 않고 존재 여부만 검증하면 되므로 최소 mock만 둔다
      () => ({}) as unknown as RenderingContext,
    );
    const { isWebglSupported } = await loadFresh();

    expect(isWebglSupported()).toBe(true);
  });

  it("getContext가 webgl/experimental-webgl 모두 null이면 false를 반환한다", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { isWebglSupported } = await loadFresh();

    expect(isWebglSupported()).toBe(false);
  });

  it("getContext 호출 자체가 예외를 던져도 false를 반환한다(안전 폴백)", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
      throw new Error("컨텍스트 생성 실패");
    });
    const { isWebglSupported } = await loadFresh();

    expect(isWebglSupported()).toBe(false);
  });

  it("확인용 컨텍스트를 바로 반납하고, 성공 결과는 다시 만들지 않고 재사용한다", async () => {
    const loseContext = vi.fn();
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation(
        () => ({ getExtension: () => ({ loseContext }) }) as unknown as RenderingContext,
      );
    const { isWebglSupported } = await loadFresh();

    expect(isWebglSupported()).toBe(true);
    expect(isWebglSupported()).toBe(true);
    expect(isWebglSupported()).toBe(true);

    expect(getContext).toHaveBeenCalledTimes(1);
    expect(loseContext).toHaveBeenCalledTimes(1);
  });

  it("미지원 결과는 기억하지 않아 이후 지원되면 true가 된다", async () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { isWebglSupported } = await loadFresh();

    expect(isWebglSupported()).toBe(false);
    getContext.mockReturnValue({ getExtension: () => null } as unknown as RenderingContext);
    expect(isWebglSupported()).toBe(true);
  });

  it("반납 확장 기능이 던져도 지원 여부 판정은 유지한다", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () =>
        ({
          getExtension: () => {
            throw new Error("boom");
          },
        }) as unknown as RenderingContext,
    );
    const { isWebglSupported } = await loadFresh();

    expect(isWebglSupported()).toBe(true);
  });
});
