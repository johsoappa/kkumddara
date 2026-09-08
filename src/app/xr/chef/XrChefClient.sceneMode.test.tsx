import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import XrChefClient from "./XrChefClient";

// G2.1-R1: WebGL이 정상 지원되는 환경에서는 씬(Canvas) 쪽 상호작용이
// 1차 수단이 되어야 한다. 실제 R3F mesh의 pointer/드래그 동작은 jsdom에
// WebGL 컨텍스트가 없어 자동화할 수 없으므로(별도 수동 QA 대상),
// 이 스위트는 "배선"만 검증한다: XrChefClient가 지점마다 올바른
// sceneInteractionId/interactionKind/stage/choices를 ChefScene에
// 전달하는지, 씬 경로로 확정한 선택도 handleChoice의 기존 계약
// (잠금/analytics/집계/모드별 결과 노출)을 동일하게 타는지, 그리고
// HTML 토글·Canvas 런타임 오류 시 HTML fallback으로의 전환이 되는지.

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

interface FakeChoice {
  id: string;
  label: string;
  axis: string;
}

vi.mock("./ChefScene", () => ({
  default: (props: {
    stage: string;
    interactionKind: string | null;
    sceneInteractionId: string | null;
    choices: FakeChoice[];
    onChoice: (choice: FakeChoice) => void;
    onSceneError?: () => void;
  }) => (
    <div
      data-testid="fake-chef-scene"
      data-stage={props.stage}
      data-interaction-kind={props.interactionKind ?? ""}
      data-scene-id={props.sceneInteractionId ?? ""}
    >
      {props.choices.map((choice) => (
        <button key={choice.id} type="button" onClick={() => props.onChoice(choice)}>
          {`scene-choice:${choice.id}`}
        </button>
      ))}
      <button type="button" onClick={() => props.onSceneError?.()}>
        시뮬레이트 오류
      </button>
    </div>
  ),
}));

function sceneClick(choiceId: string) {
  fireEvent.click(screen.getByRole("button", { name: `scene-choice:${choiceId}` }));
}

describe("XrChefClient — WebGL 지원 시 씬(Canvas) 경로가 1차 상호작용이 된다", () => {
  beforeEach(() => {
    isWebglSupportedMock.mockReset();
    isWebglSupportedMock.mockReturnValue(true);
    trackMock.mockReset();
  });

  it("나침반: 5지점 모두 sceneInteractionId/interactionKind/stage가 올바르고, 기존 이벤트 계약(5+1+1)과 C 동점 결과가 씬 경로로도 동일하다", async () => {
    // 지점1→5: p1_a(axis1) / p2_a(axis2) / p3_c(axis2) / p4_a(axis1) / p5_b(axis3)
    // → axis1×2, axis2×2, axis3×1 (2:2:1 동점) → 역순 탐색으로 axis1 채택
    // (XrChefClient.test.tsx의 "G2.1-D1"과 동일한 데이터셋 — 상호작용 방식만 씬으로 대체)
    render(<XrChefClient mode="compass" />);
    fireEvent.click(screen.getByRole("button", { name: "첫 주문 시작하기" }));

    const scene = await screen.findByTestId("fake-chef-scene");
    expect(scene).toHaveAttribute("data-scene-id", "compass_p1");
    expect(scene).toHaveAttribute("data-interaction-kind", "select");
    expect(scene).toHaveAttribute("data-stage", "approach");
    sceneClick("p1_a");
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    await screen.findByRole("heading", { level: 2 });
    expect(screen.getByTestId("fake-chef-scene")).toHaveAttribute("data-scene-id", "compass_p2");
    expect(screen.getByTestId("fake-chef-scene")).toHaveAttribute("data-interaction-kind", "place");
    expect(screen.getByTestId("fake-chef-scene")).toHaveAttribute("data-stage", "search");
    sceneClick("p2_a");
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    await screen.findByRole("heading", { level: 2 });
    expect(screen.getByTestId("fake-chef-scene")).toHaveAttribute("data-scene-id", "compass_p3");
    expect(screen.getByTestId("fake-chef-scene")).toHaveAttribute("data-interaction-kind", "order");
    expect(screen.getByTestId("fake-chef-scene")).toHaveAttribute("data-stage", "survey");
    sceneClick("p3_c");
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    await screen.findByRole("heading", { level: 2 });
    expect(screen.getByTestId("fake-chef-scene")).toHaveAttribute("data-scene-id", "compass_p4");
    expect(screen.getByTestId("fake-chef-scene")).toHaveAttribute("data-interaction-kind", "select");
    expect(screen.getByTestId("fake-chef-scene")).toHaveAttribute("data-stage", "plating");
    sceneClick("p4_a");
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    await screen.findByRole("heading", { level: 2 });
    expect(screen.getByTestId("fake-chef-scene")).toHaveAttribute("data-scene-id", "compass_p5");
    expect(screen.getByTestId("fake-chef-scene")).toHaveAttribute("data-interaction-kind", "select");
    expect(screen.getByTestId("fake-chef-scene")).toHaveAttribute("data-stage", "plating");
    sceneClick("p5_b");
    fireEvent.click(await screen.findByRole("button", { name: "결과 보기" }));

    expect(await screen.findByText("오늘의 선택 스타일")).toBeInTheDocument();

    const eventNames = trackMock.mock.calls.map((call) => call[0]);
    expect(eventNames.filter((name) => name === "xr_chef_choice_selected")).toHaveLength(5);
    expect(eventNames.filter((name) => name === "xr_chef_result_shown")).toHaveLength(1);
    expect(eventNames.some((name) => String(name).startsWith("xr_occupation_"))).toBe(false);

    const point3Event = trackMock.mock.calls.find(
      (call) => call[0] === "xr_chef_choice_selected" && call[1]?.choice_point === 3,
    );
    expect(point3Event?.[1]).toMatchObject({
      choice_id: "p3_c",
      axis_tag: "axis2",
      scenario_version: "v1.1",
    });

    const resultCall = trackMock.mock.calls.find((call) => call[0] === "xr_chef_result_shown");
    expect(resultCall?.[1]).toMatchObject({ result_axis: "axis1", mode: "compass" });

    fireEvent.click(screen.getByRole("button", { name: "다음 미션 시작하기" }));
    const ctaEvents = trackMock.mock.calls.filter((call) => call[0] === "xr_chef_cta_clicked");
    expect(ctaEvents).toHaveLength(1);
  });

  it("새싹: 3지점 모두 sprout_p*로 식별되고, 씬 경로로 완료해도 축 결과·피드백이 노출되지 않는다", async () => {
    render(<XrChefClient mode="sprout" />);
    fireEvent.click(screen.getByRole("button", { name: "첫 주문 시작하기" }));

    let scene = await screen.findByTestId("fake-chef-scene");
    expect(scene).toHaveAttribute("data-scene-id", "sprout_p1");
    sceneClick("s1_a");
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    await screen.findByRole("heading", { level: 2 });
    scene = screen.getByTestId("fake-chef-scene");
    expect(scene).toHaveAttribute("data-scene-id", "sprout_p2");
    sceneClick("s2_a");
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    await screen.findByRole("heading", { level: 2 });
    scene = screen.getByTestId("fake-chef-scene");
    expect(scene).toHaveAttribute("data-scene-id", "sprout_p3");
    sceneClick("s3_b");
    fireEvent.click(await screen.findByRole("button", { name: "완료 화면 보기" }));

    expect(await screen.findByText("첫 주문 완료!")).toBeInTheDocument();
    expect(screen.queryByText("오늘의 선택 스타일")).not.toBeInTheDocument();

    const resultCall = trackMock.mock.calls.find((call) => call[0] === "xr_chef_result_shown");
    expect(resultCall?.[1]).toMatchObject({ result_axis: "none", mode: "sprout" });
  });

  it("웹GL 지원 시에도 '글로 진행하기' 토글로 기존 HTML 흐름으로 전환할 수 있다", async () => {
    render(<XrChefClient mode="compass" />);
    fireEvent.click(screen.getByRole("button", { name: "첫 주문 시작하기" }));

    await screen.findByTestId("fake-chef-scene");
    expect(screen.getByTestId("fake-chef-scene")).toHaveAttribute("data-interaction-kind", "select");

    fireEvent.click(screen.getByRole("button", { name: "글로 진행하기" }));

    // 토글 후에는 씬에 interactionKind/choices가 전달되지 않고(=null/[]),
    // 기존 SelectChoices(HTML 버튼)가 대신 렌더링된다.
    expect(screen.getByTestId("fake-chef-scene")).toHaveAttribute("data-interaction-kind", "");
    const htmlChoiceButtons = screen
      .getAllByRole("button")
      .filter((button) => button.textContent?.includes("바로 준비를 시작한다"));
    expect(htmlChoiceButtons).toHaveLength(1);

    fireEvent.click(htmlChoiceButtons[0]);
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    const choiceEvent = trackMock.mock.calls.find(
      (call) => call[0] === "xr_chef_choice_selected",
    );
    expect(choiceEvent?.[1]).toMatchObject({ choice_id: "p1_a", axis_tag: "axis1" });

    // 다시 씬으로 전환 가능
    await screen.findByRole("heading", { level: 2 });
    fireEvent.click(screen.getByRole("button", { name: "화면으로 진행하기" }));
    expect(screen.getByTestId("fake-chef-scene")).toHaveAttribute("data-interaction-kind", "place");
  });

  it("Canvas 런타임 오류가 나면 즉시 HTML 흐름으로 전환되고, 그 이후에도 완주할 수 있다", async () => {
    render(<XrChefClient mode="compass" />);
    fireEvent.click(screen.getByRole("button", { name: "첫 주문 시작하기" }));

    await screen.findByTestId("fake-chef-scene");
    fireEvent.click(screen.getByRole("button", { name: "시뮬레이트 오류" }));

    // 오류 후: 씬에는 interactionKind가 더 이상 전달되지 않고, 토글 버튼도 사라지며
    // 기존 HTML 선택 UI가 자동으로 노출된다.
    expect(screen.getByTestId("fake-chef-scene")).toHaveAttribute("data-interaction-kind", "");
    expect(screen.queryByRole("button", { name: "글로 진행하기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "화면으로 진행하기" })).not.toBeInTheDocument();

    const htmlChoiceButtons = screen
      .getAllByRole("button")
      .filter((button) => button.textContent?.includes("바로 준비를 시작한다"));
    expect(htmlChoiceButtons).toHaveLength(1);
    fireEvent.click(htmlChoiceButtons[0]);

    expect(await screen.findByRole("button", { name: "계속하기" })).toBeInTheDocument();
  });
});
