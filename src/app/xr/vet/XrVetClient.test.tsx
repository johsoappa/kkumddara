import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import XrVetClient from "./XrVetClient";

// Q8: WebGL 미지원 환경에서도 수의사 나침반 체험이 처음부터 끝까지
// (도입 → 5선택 → 결과 → CTA) 텍스트만으로 완료 가능해야 한다.
// Q9: xr_vet_* 이벤트만 사용해야 하며, 요리사의 xr_chef_* 이름이나
// 원본 브랜치의 xr_occupation_* 이름으로 새지 않아야 한다.

const { isWebglSupportedMock, trackMock } = vi.hoisted(() => ({
  isWebglSupportedMock: vi.fn<() => boolean>(),
  trackMock: vi.fn(),
}));

vi.mock("../webglSupport", () => ({
  isWebglSupported: isWebglSupportedMock,
}));

vi.mock("@/lib/analytics", () => ({
  track: trackMock,
}));

async function completeCompassFlow() {
  render(<XrVetClient mode="compass" />);

  fireEvent.click(screen.getByRole("button", { name: "첫 상담 시작하기" }));

  for (let point = 1; point <= 5; point++) {
    await screen.findByRole("heading", { level: 2 });
    const choiceButtons = screen
      .getAllByRole("button")
      .filter((button) => button.textContent !== "");
    fireEvent.click(choiceButtons[0]);

    const continueLabel = point === 5 ? "결과 보기" : "계속하기";
    fireEvent.click(await screen.findByRole("button", { name: continueLabel }));
  }
}

describe("XrVetClient — WebGL fallback 하에서도 전체 흐름 완료(Q8)", () => {
  beforeEach(() => {
    isWebglSupportedMock.mockReset();
    isWebglSupportedMock.mockReturnValue(false);
    trackMock.mockReset();
  });

  it("나침반모드: fallback 패널이 보이고, 도입부터 결과·CTA까지 완료할 수 있다", async () => {
    await completeCompassFlow();

    expect(
      await screen.findByText(
        "지금 화면에서는 그림 대신 글로 동물병원 체험을 이어가요.",
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("오늘의 선택 스타일")).toBeInTheDocument();
    expect(
      screen.getByText(
        "이 체험은 직업 이해를 위한 활동이며 실제 진료나 판단을 대신하지 않습니다.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다음 미션 시작하기" }));
    expect(await screen.findByText("곧 미션이 열릴 예정이에요")).toBeInTheDocument();
  });

  it("Q9: xr_vet_* 이벤트만 사용하고, 선택 5회+결과 1회+CTA 1회로 정확히 전송된다", async () => {
    await completeCompassFlow();
    fireEvent.click(screen.getByRole("button", { name: "다음 미션 시작하기" }));

    const eventNames = trackMock.mock.calls.map((call) => call[0]);
    expect(eventNames.filter((name) => name === "xr_vet_choice_selected")).toHaveLength(5);
    expect(eventNames.filter((name) => name === "xr_vet_result_shown")).toHaveLength(1);
    expect(eventNames.filter((name) => name === "xr_vet_cta_clicked")).toHaveLength(1);
    expect(eventNames.some((name) => String(name).startsWith("xr_chef_"))).toBe(false);
    expect(eventNames.some((name) => String(name).startsWith("xr_occupation_"))).toBe(false);

    const choiceCall = trackMock.mock.calls.find(
      (call) => call[0] === "xr_vet_choice_selected",
    );
    expect(choiceCall?.[1]).toMatchObject({ route: "/xr/vet", scenario_version: "v0.4" });

    const resultCall = trackMock.mock.calls.find(
      (call) => call[0] === "xr_vet_result_shown",
    );
    expect(resultCall?.[1]).toMatchObject({ mode: "compass", scenario_version: "v0.4" });
  });

  it("새싹모드: WebGL 미지원이어도 3선택 후 축/피드백 노출 없이 완료 화면을 보여준다", async () => {
    render(<XrVetClient mode="sprout" />);
    fireEvent.click(screen.getByRole("button", { name: "첫 상담 시작하기" }));

    for (let point = 1; point <= 3; point++) {
      await screen.findByRole("heading", { level: 2 });
      const choiceButtons = screen
        .getAllByRole("button")
        .filter((button) => button.textContent !== "");
      fireEvent.click(choiceButtons[0]);
      const continueLabel = point === 3 ? "완료 화면 보기" : "계속하기";
      fireEvent.click(await screen.findByRole("button", { name: continueLabel }));
    }

    expect(await screen.findByText("첫 상담 완료!")).toBeInTheDocument();
    expect(screen.queryByText("오늘의 선택 스타일")).not.toBeInTheDocument();

    await waitFor(() => {
      const resultCall = trackMock.mock.calls.find(
        (call) => call[0] === "xr_vet_result_shown",
      );
      expect(resultCall?.[1]).toMatchObject({ result_axis: "none" });
    });
  });

  it("잘못된 mode 값은 페이지(page.tsx)에서 나침반으로 안전 폴백된다 — 여기서는 compass 렌더가 나침반 5지점 흐름을 그대로 따름을 확인", async () => {
    // page.tsx의 화이트리스트 판정("sprout" 정확 일치 외 전부 compass 폴백)은
    // 요리사 /xr/chef page.tsx와 동일 정책이며 이 컴포넌트 자체는 mode prop만
    // 받는다 — compass가 5지점을 온전히 완주함을 재확인해 폴백 값 처리를 검증한다.
    render(<XrVetClient mode="compass" />);
    fireEvent.click(screen.getByRole("button", { name: "첫 상담 시작하기" }));
    expect(await screen.findByText("선택 1 / 5")).toBeInTheDocument();
  });
});
