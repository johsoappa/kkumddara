import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import XrVetPage from "./page";

// G2.2-R4-D: page.tsx의 R4 기본 활성화 판정(searchParams.r4 !== "0")을 URL 조합별로
// 검증한다. XrVetClient 자체의 R4/R3 동작은 XrVetClient.test.tsx/XrVetClient.r4.test.tsx가
// 이미 전수 검증하므로, 여기서는 "page.tsx가 어떤 mode/r4 prop을 내려보내는가"만
// 회귀 대상으로 삼는다(page.tsx가 각 URL을 올바르게 배선했는가).

const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ track: trackMock }));

vi.mock("./XrVetClient", () => ({
  default: (props: { mode: string; r4: boolean }) => (
    <div data-testid="fake-client" data-mode={props.mode} data-r4={String(props.r4)} />
  ),
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_XR_VETERINARIAN_ENABLED", "true");
  trackMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function renderPage(searchParams?: { [key: string]: string | string[] | undefined }) {
  render(<XrVetPage searchParams={searchParams} />);
  return screen.getByTestId("fake-client");
}

describe("G2.2-R4-D — 기본 활성화 판정(r4=0일 때만 R3, 그 외 전부 R4)", () => {
  it("쿼리 없음 → 나침반모드 R4", () => {
    const el = renderPage(undefined);
    expect(el).toHaveAttribute("data-mode", "compass");
    expect(el).toHaveAttribute("data-r4", "true");
  });

  it("mode=sprout → 새싹모드 R4", () => {
    const el = renderPage({ mode: "sprout" });
    expect(el).toHaveAttribute("data-mode", "sprout");
    expect(el).toHaveAttribute("data-r4", "true");
  });

  it("mode=compass → 나침반모드 R4", () => {
    const el = renderPage({ mode: "compass" });
    expect(el).toHaveAttribute("data-mode", "compass");
    expect(el).toHaveAttribute("data-r4", "true");
  });

  it("r4=1 → 나침반모드 R4", () => {
    const el = renderPage({ r4: "1" });
    expect(el).toHaveAttribute("data-r4", "true");
  });

  it("mode=sprout&r4=1 → 새싹모드 R4", () => {
    const el = renderPage({ mode: "sprout", r4: "1" });
    expect(el).toHaveAttribute("data-mode", "sprout");
    expect(el).toHaveAttribute("data-r4", "true");
  });

  it("r4=0 → 나침반모드 R3(숨겨진 긴급 롤백)", () => {
    const el = renderPage({ r4: "0" });
    expect(el).toHaveAttribute("data-mode", "compass");
    expect(el).toHaveAttribute("data-r4", "false");
  });

  it("mode=sprout&r4=0 → 새싹모드 R3", () => {
    const el = renderPage({ mode: "sprout", r4: "0" });
    expect(el).toHaveAttribute("data-mode", "sprout");
    expect(el).toHaveAttribute("data-r4", "false");
  });

  it("알 수 없는 r4 값(예: r4=test) → 나침반모드 R4", () => {
    const el = renderPage({ r4: "test" });
    expect(el).toHaveAttribute("data-r4", "true");
  });

  it("r4가 배열 값이어도(그 외 값 취급) R4", () => {
    const el = renderPage({ r4: ["0", "1"] });
    expect(el).toHaveAttribute("data-r4", "true");
  });

  it("mode가 알 수 없는 값이면 나침반으로 폴백된다(기존 화이트리스트 판정 무변경)", () => {
    const el = renderPage({ mode: "unknown" });
    expect(el).toHaveAttribute("data-mode", "compass");
  });
});

describe("G2.2-R4-D — 기본 URL 진입만으로 analytics가 발생하지 않는다", () => {
  it("쿼리 없이 page.tsx를 렌더해도 track()이 호출되지 않는다", () => {
    renderPage(undefined);
    expect(trackMock).not.toHaveBeenCalled();
  });
});
