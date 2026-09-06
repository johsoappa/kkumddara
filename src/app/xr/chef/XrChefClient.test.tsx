import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import XrChefClient from "./XrChefClient";

// Q8: WebGL 미지원 환경에서도 요리사 나침반 체험이 처음부터 끝까지
// (도입 → 5선택 → 결과 → CTA) 텍스트만으로 완료 가능해야 한다.
// Q9: xr_chef_* 이벤트만 사용해야 하며, xr_occupation_* 이름으로
// 새지 않아야 한다.
// G2.1: 지점별 상호작용 방식(select/place/order)이 달라도 handleChoice
// 계약(choice_point/choice_id/axis_tag/scenario_version)은 동일해야 한다.

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

type InteractionKind = "select" | "place" | "order";

const COMPASS_KINDS: InteractionKind[] = ["select", "place", "order", "select", "select"];
const SPROUT_KINDS: InteractionKind[] = ["select", "place", "select"];

async function advanceChoosingPoint(kind: InteractionKind) {
  await screen.findByRole("heading", { level: 2 });

  if (kind === "select") {
    const choiceButtons = screen
      .getAllByRole("button")
      .filter((button) => button.textContent !== "");
    fireEvent.click(choiceButtons[0]);
    return;
  }

  if (kind === "place") {
    // 재료 카드는 aria-pressed를 갖는 버튼 — 작업대(드롭존)와 구분한다.
    const ingredientButtons = screen
      .getAllByRole("button")
      .filter((button) => button.hasAttribute("aria-pressed"));
    fireEvent.click(ingredientButtons[0]);
    fireEvent.click(screen.getByRole("button", { name: "작업대에 놓기" }));
    return;
  }

  // order: 기본 순서(맨 앞 카드) 그대로 확정 — 1클릭 경로 검증
  fireEvent.click(screen.getByRole("button", { name: "이 순서로 진행하기" }));
}

async function completeCompassFlow() {
  render(<XrChefClient mode="compass" />);

  fireEvent.click(screen.getByRole("button", { name: "첫 주문 시작하기" }));

  for (let i = 0; i < COMPASS_KINDS.length; i++) {
    await advanceChoosingPoint(COMPASS_KINDS[i]);

    const continueLabel = i === COMPASS_KINDS.length - 1 ? "결과 보기" : "계속하기";
    fireEvent.click(await screen.findByRole("button", { name: continueLabel }));
  }
}

describe("XrChefClient — WebGL fallback 하에서도 전체 흐름 완료(Q8)", () => {
  beforeEach(() => {
    isWebglSupportedMock.mockReset();
    isWebglSupportedMock.mockReturnValue(false);
    trackMock.mockReset();
  });

  it("나침반모드: fallback 패널이 보이고, 도입부터 결과·CTA까지 완료할 수 있다", async () => {
    await completeCompassFlow();

    expect(
      await screen.findByText("지금 화면에서는 그림 대신 글로 주방 체험을 이어가요."),
    ).toBeInTheDocument();

    expect(screen.getByText("오늘의 선택 스타일")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다음 미션 시작하기" }));
    expect(await screen.findByText("곧 미션이 열릴 예정이에요")).toBeInTheDocument();
  });

  it("Q9: xr_chef_* 이벤트만 사용하고, 선택 5회+결과 1회+CTA 1회로 정확히 전송된다", async () => {
    await completeCompassFlow();
    fireEvent.click(screen.getByRole("button", { name: "다음 미션 시작하기" }));

    const eventNames = trackMock.mock.calls.map((call) => call[0]);
    expect(eventNames.filter((name) => name === "xr_chef_choice_selected")).toHaveLength(5);
    expect(eventNames.filter((name) => name === "xr_chef_result_shown")).toHaveLength(1);
    expect(eventNames.filter((name) => name === "xr_chef_cta_clicked")).toHaveLength(1);
    expect(eventNames.some((name) => String(name).startsWith("xr_occupation_"))).toBe(false);

    const resultCall = trackMock.mock.calls.find(
      (call) => call[0] === "xr_chef_result_shown",
    );
    expect(resultCall?.[1]).toMatchObject({ mode: "compass", scenario_version: "v1.1" });
  });

  it("새싹모드: WebGL 미지원이어도 3선택 후 축/피드백 노출 없이 완료 화면을 보여준다", async () => {
    render(<XrChefClient mode="sprout" />);
    fireEvent.click(screen.getByRole("button", { name: "첫 주문 시작하기" }));

    for (let i = 0; i < SPROUT_KINDS.length; i++) {
      await advanceChoosingPoint(SPROUT_KINDS[i]);
      const continueLabel = i === SPROUT_KINDS.length - 1 ? "완료 화면 보기" : "계속하기";
      fireEvent.click(await screen.findByRole("button", { name: continueLabel }));
    }

    expect(await screen.findByText("첫 주문 완료!")).toBeInTheDocument();
    expect(screen.queryByText("오늘의 선택 스타일")).not.toBeInTheDocument();

    await waitFor(() => {
      const resultCall = trackMock.mock.calls.find(
        (call) => call[0] === "xr_chef_result_shown",
      );
      expect(resultCall?.[1]).toMatchObject({ result_axis: "none" });
    });
  });

  it("G2.1: place 지점에서 드래그(dragstart/drop)로도 배치를 완료할 수 있다", async () => {
    render(<XrChefClient mode="compass" />);
    fireEvent.click(screen.getByRole("button", { name: "첫 주문 시작하기" }));

    // 지점1: select
    await advanceChoosingPoint("select");
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    // 지점2: place — 네이티브 드래그 경로
    await screen.findByRole("heading", { level: 2 });
    const ingredientButtons = screen
      .getAllByRole("button")
      .filter((button) => button.hasAttribute("aria-pressed"));
    const dataTransfer = { setData: vi.fn(), getData: vi.fn(() => "") };
    fireEvent.dragStart(ingredientButtons[0], { dataTransfer });
    dataTransfer.getData.mockReturnValue(
      ingredientButtons[0].textContent ?? "",
    );

    const dropzone = screen.getByRole("button", { name: "작업대에 놓기" });
    fireEvent.drop(dropzone, {
      dataTransfer: {
        getData: () => (dataTransfer.setData.mock.calls[0]?.[1] as string) ?? "",
      },
    });

    // 배치 직후 reaction 단계(선배 코멘트)로 전환되어야 한다
    expect(await screen.findByRole("button", { name: "계속하기" })).toBeInTheDocument();

    const choiceEvents = trackMock.mock.calls.filter(
      (call) => call[0] === "xr_chef_choice_selected",
    );
    expect(choiceEvents).toHaveLength(2);
  });

  it("G2.1-D1: 2:2:1 동점 상황 — OrderInteraction에서 재정렬로 확정한 선택이 집계에 반영되고, 마지막 지점이 후보가 아니면 건너뛴다", async () => {
    // 구성(지점1→5): p1_a(axis1) / p2_a(axis2) / p3_c(axis2, 재정렬로 확정)
    //   / p4_a(axis1) / p5_b(axis3)
    // → axis1×2(지점1,4), axis2×2(지점2,3), axis3×1(지점5, 동점 후보 아님)
    // 역순 탐색: 지점5(axis3, 후보 아님→스킵) → 지점4(axis1, 후보→채택)
    // 기대 결과축: axis1 (scenario.test.ts의 순수 함수 테스트와 동일 데이터셋)
    render(<XrChefClient mode="compass" />);
    fireEvent.click(screen.getByRole("button", { name: "첫 주문 시작하기" }));

    // 지점1(select): p1_a — 첫 번째 버튼
    await screen.findByRole("heading", { level: 2 });
    fireEvent.click(screen.getAllByRole("button").filter((b) => b.textContent !== "")[0]);
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    // 지점2(place): p2_a — 첫 번째 재료 카드
    await screen.findByRole("heading", { level: 2 });
    fireEvent.click(
      screen.getAllByRole("button").filter((b) => b.hasAttribute("aria-pressed"))[0],
    );
    fireEvent.click(screen.getByRole("button", { name: "작업대에 놓기" }));
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    // 지점3(order): p3_c(원래 3번째 카드)를 "맨 앞으로"로 재정렬한 뒤 확정
    await screen.findByRole("heading", { level: 2 });
    const moveButtons = screen.getAllByRole("button", { name: "맨 앞으로" });
    fireEvent.click(moveButtons[1]); // p3_b, p3_c 순서 중 두 번째 = p3_c
    fireEvent.click(screen.getByRole("button", { name: "이 순서로 진행하기" }));
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    // 지점4(select): p4_a — 첫 번째 버튼
    await screen.findByRole("heading", { level: 2 });
    fireEvent.click(screen.getAllByRole("button").filter((b) => b.textContent !== "")[0]);
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    // 지점5(select): p5_b — 두 번째 버튼
    await screen.findByRole("heading", { level: 2 });
    fireEvent.click(screen.getAllByRole("button").filter((b) => b.textContent !== "")[1]);
    fireEvent.click(await screen.findByRole("button", { name: "결과 보기" }));

    const point3Event = trackMock.mock.calls.find(
      (call) => call[0] === "xr_chef_choice_selected" && call[1]?.choice_point === 3,
    );
    expect(point3Event?.[1]).toMatchObject({
      choice_id: "p3_c",
      axis_tag: "axis2",
      scenario_version: "v1.1",
    });

    const resultCall = trackMock.mock.calls.find(
      (call) => call[0] === "xr_chef_result_shown",
    );
    expect(resultCall?.[1]).toMatchObject({ result_axis: "axis1", mode: "compass" });

    expect(await screen.findByText("오늘의 선택 스타일")).toBeInTheDocument();
  });
});
