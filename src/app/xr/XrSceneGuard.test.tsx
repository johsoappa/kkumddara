import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import XrSceneGuard from "./XrSceneGuard";

const { isWebglSupportedMock } = vi.hoisted(() => ({
  isWebglSupportedMock: vi.fn<() => boolean>(),
}));

vi.mock("./webglSupport", () => ({
  isWebglSupported: isWebglSupportedMock,
}));

// 렌더 중 의도적으로 예외를 던져 Canvas 마운트/렌더 실패를 재현하는 컴포넌트.
// 실제 Canvas 마운트 실패(WebGLRenderer 생성 실패)와 동일하게 동기 throw로 표현한다.
function ThrowingScene(): never {
  throw new Error("Canvas 마운트 실패 (시뮬레이션)");
}

describe("XrSceneGuard", () => {
  beforeEach(() => {
    isWebglSupportedMock.mockReset();
    // 테스트 중 의도적으로 던지는 에러가 콘솔을 어지럽히지 않게 한다
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("WebGL 미지원이면 Canvas를 시도하지 않고 바로 fallback을 그린다", () => {
    isWebglSupportedMock.mockReturnValue(false);

    render(
      <XrSceneGuard fallback={<div>텍스트 fallback</div>}>
        <div>3D 장면</div>
      </XrSceneGuard>,
    );

    expect(screen.getByText("텍스트 fallback")).toBeInTheDocument();
    expect(screen.queryByText("3D 장면")).not.toBeInTheDocument();
  });

  it("WebGL 지원이면 children을 그대로 렌더링한다", () => {
    isWebglSupportedMock.mockReturnValue(true);

    render(
      <XrSceneGuard fallback={<div>텍스트 fallback</div>}>
        <div>3D 장면</div>
      </XrSceneGuard>,
    );

    expect(screen.getByText("3D 장면")).toBeInTheDocument();
    expect(screen.queryByText("텍스트 fallback")).not.toBeInTheDocument();
  });

  it("WebGL 지원 판정이 true여도 Canvas 마운트 중 예외가 나면 fallback으로 전환한다", () => {
    isWebglSupportedMock.mockReturnValue(true);

    render(
      <XrSceneGuard fallback={<div>텍스트 fallback</div>}>
        <ThrowingScene />
      </XrSceneGuard>,
    );

    expect(screen.getByText("텍스트 fallback")).toBeInTheDocument();
  });

  it("G2.1-R1: onSceneError를 넘기면 Canvas 런타임 오류 시 1회 호출한다", () => {
    isWebglSupportedMock.mockReturnValue(true);
    const onSceneError = vi.fn();

    render(
      <XrSceneGuard fallback={<div>텍스트 fallback</div>} onSceneError={onSceneError}>
        <ThrowingScene />
      </XrSceneGuard>,
    );

    expect(screen.getByText("텍스트 fallback")).toBeInTheDocument();
    expect(onSceneError).toHaveBeenCalledTimes(1);
  });

  it("G2.1-R1: onSceneError 없이도(미전달) 기존 동작이 그대로 유지된다", () => {
    isWebglSupportedMock.mockReturnValue(true);

    expect(() =>
      render(
        <XrSceneGuard fallback={<div>텍스트 fallback</div>}>
          <ThrowingScene />
        </XrSceneGuard>,
      ),
    ).not.toThrow();

    expect(screen.getByText("텍스트 fallback")).toBeInTheDocument();
  });
});
