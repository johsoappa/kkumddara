import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import XrVetClient from "./XrVetClient";

// G2.2-R2: WebGL이 정상 지원되는 환경에서는 씬(Canvas) 쪽 상호작용이 1차
// 수단이 되어야 한다. 실제 R3F mesh의 pointer 동작은 jsdom에 WebGL
// 컨텍스트가 없어 자동화할 수 없으므로(별도 수동 QA 대상 — 완료 보고 참고),
// 이 스위트는 요리사 XrChefClient.sceneMode.test.tsx와 같은 방식으로
// "배선"만 검증한다: XrVetClient가 지점마다 올바른 mode/phase/point/choices를
// VetScene에 전달하는지, 씬 경로로 확정한 선택도 handleChoice의 기존 계약
// (잠금/analytics/집계/모드별 결과 노출)을 텍스트 경로와 동일하게 타는지,
// 그리고 "글로 진행하기" 토글·Canvas 런타임 오류 시 HTML fallback 전환이
// 되는지를 확인한다.

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

vi.mock("./VetScene", () => ({
  default: (props: {
    mode: string;
    phase: string;
    point: number;
    choices: FakeChoice[];
    onChoice: (choice: FakeChoice) => void;
    showChart: boolean;
    onSceneError?: () => void;
  }) => (
    <div
      data-testid="fake-vet-scene"
      data-mode={props.mode}
      data-phase={props.phase}
      data-point={props.point}
      data-show-chart={String(props.showChart)}
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

describe("XrVetClient — WebGL 지원 시 씬(Canvas) 경로가 1차 상호작용이 된다", () => {
  beforeEach(() => {
    isWebglSupportedMock.mockReset();
    isWebglSupportedMock.mockReturnValue(true);
    trackMock.mockReset();
  });

  it("G2.2-R2-R: 토글 없이도 씬은 기본값으로 활성 상태다 — useScene을 임의로 false로 초기화하지 않는다", async () => {
    render(<XrVetClient mode="compass" />);
    fireEvent.click(screen.getByRole("button", { name: "첫 상담 시작하기" }));

    const scene = await screen.findByTestId("fake-vet-scene");
    // 토글을 누르지 않은 상태에서 씬에 choices가 전달되어 있어야
    // "글로 진행하기"가 아니라 씬 자체가 기본 1차 경로임이 증명된다.
    expect(await screen.findByRole("button", { name: "scene-choice:p1_a" })).toBeInTheDocument();
    expect(scene).toHaveAttribute("data-phase", "choosing");
    // 오류 fallback으로 전환된 적이 없으므로 "글로 진행하기" 토글이 노출된다
    // (오류 시 이 토글 자체가 사라지는 것과 구분되는 정상 기본 상태).
    expect(screen.getByRole("button", { name: "글로 진행하기" })).toBeInTheDocument();
  });

  it("나침반: 5지점 모두 mode/phase/point가 올바르고, 기존 이벤트 계약(5+1+1)과 C 동점 결과가 씬 경로로도 동일하다", async () => {
    // 지점1→5: p1_a(axis1) / p2_a(axis2) / p3_c(axis2) / p4_a(axis1) / p5_b(axis3)
    // → axis1×2, axis2×2, axis3×1 (2:2:1 동점) → 역순 탐색으로 axis1 채택
    // (sceneLayout.test.ts/scenario.test.ts의 2:2:1 데이터셋과 동일 — 상호작용 방식만 씬으로 대체)
    render(<XrVetClient mode="compass" />);
    fireEvent.click(screen.getByRole("button", { name: "첫 상담 시작하기" }));

    let scene = await screen.findByTestId("fake-vet-scene");
    expect(scene).toHaveAttribute("data-mode", "compass");
    expect(scene).toHaveAttribute("data-phase", "choosing");
    expect(scene).toHaveAttribute("data-point", "1");
    sceneClick("p1_a");
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    await screen.findByRole("heading", { level: 2 });
    scene = screen.getByTestId("fake-vet-scene");
    expect(scene).toHaveAttribute("data-point", "2");
    sceneClick("p2_a");
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    await screen.findByRole("heading", { level: 2 });
    scene = screen.getByTestId("fake-vet-scene");
    expect(scene).toHaveAttribute("data-point", "3");
    sceneClick("p3_c");
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    await screen.findByRole("heading", { level: 2 });
    scene = screen.getByTestId("fake-vet-scene");
    expect(scene).toHaveAttribute("data-point", "4");
    expect(scene).toHaveAttribute("data-show-chart", "true");
    sceneClick("p4_a");
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    await screen.findByRole("heading", { level: 2 });
    scene = screen.getByTestId("fake-vet-scene");
    expect(scene).toHaveAttribute("data-point", "5");
    sceneClick("p5_b");
    fireEvent.click(await screen.findByRole("button", { name: "결과 보기" }));

    expect(await screen.findByText("오늘의 선택 스타일")).toBeInTheDocument();

    const eventNames = trackMock.mock.calls.map((call) => call[0]);
    expect(eventNames.filter((name) => name === "xr_vet_choice_selected")).toHaveLength(5);
    expect(eventNames.filter((name) => name === "xr_vet_result_shown")).toHaveLength(1);
    expect(eventNames.some((name) => String(name).startsWith("xr_chef_"))).toBe(false);
    expect(eventNames.some((name) => String(name).startsWith("xr_occupation_"))).toBe(false);

    const point3Event = trackMock.mock.calls.find(
      (call) => call[0] === "xr_vet_choice_selected" && call[1]?.choice_point === 3,
    );
    expect(point3Event?.[1]).toMatchObject({
      choice_id: "p3_c",
      axis_tag: "axis2",
      scenario_version: "v0.3",
    });

    const resultCall = trackMock.mock.calls.find((call) => call[0] === "xr_vet_result_shown");
    expect(resultCall?.[1]).toMatchObject({ result_axis: "axis1", mode: "compass" });

    fireEvent.click(screen.getByRole("button", { name: "다음 미션 시작하기" }));
    const ctaEvents = trackMock.mock.calls.filter((call) => call[0] === "xr_vet_cta_clicked");
    expect(ctaEvents).toHaveLength(1);
  });

  it("새싹: 3지점 모두 point가 1~3으로 올바르고, 씬 경로로 완료해도 축 결과·피드백이 노출되지 않는다", async () => {
    render(<XrVetClient mode="sprout" />);
    fireEvent.click(screen.getByRole("button", { name: "첫 상담 시작하기" }));

    let scene = await screen.findByTestId("fake-vet-scene");
    expect(scene).toHaveAttribute("data-mode", "sprout");
    expect(scene).toHaveAttribute("data-point", "1");
    sceneClick("s1_a");
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    await screen.findByRole("heading", { level: 2 });
    scene = screen.getByTestId("fake-vet-scene");
    expect(scene).toHaveAttribute("data-point", "2");
    sceneClick("s2_a");
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    await screen.findByRole("heading", { level: 2 });
    scene = screen.getByTestId("fake-vet-scene");
    expect(scene).toHaveAttribute("data-point", "3");
    sceneClick("s3_a");
    fireEvent.click(await screen.findByRole("button", { name: "완료 화면 보기" }));

    expect(await screen.findByText("첫 상담 완료!")).toBeInTheDocument();
    expect(screen.queryByText("오늘의 선택 스타일")).not.toBeInTheDocument();

    const resultCall = trackMock.mock.calls.find((call) => call[0] === "xr_vet_result_shown");
    expect(resultCall?.[1]).toMatchObject({ result_axis: "none", mode: "sprout" });
  });

  it("웹GL 지원 시에도 '글로 진행하기' 토글로 기존 HTML 흐름으로 전환할 수 있고, 다시 씬으로 돌아갈 수 있다", async () => {
    render(<XrVetClient mode="compass" />);
    fireEvent.click(screen.getByRole("button", { name: "첫 상담 시작하기" }));

    await screen.findByTestId("fake-vet-scene");
    // 씬이 1차일 때 텍스트 선택지는 보조 수단으로 여전히 존재한다(간결한 스타일).
    expect(screen.getByRole("button", { name: "차분히 관찰부터 시작한다" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "글로 진행하기" }));

    // 토글 후에는 씬에 choices가 전달되지 않는다(=[]).
    const sceneChoiceButtons = screen
      .queryAllByRole("button")
      .filter((button) => button.textContent?.startsWith("scene-choice:"));
    expect(sceneChoiceButtons).toHaveLength(0);

    const htmlChoiceButton = screen.getByRole("button", { name: "차분히 관찰부터 시작한다" });
    fireEvent.click(htmlChoiceButton);
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    const choiceEvent = trackMock.mock.calls.find((call) => call[0] === "xr_vet_choice_selected");
    expect(choiceEvent?.[1]).toMatchObject({ choice_id: "p1_a", axis_tag: "axis1" });

    // 다시 씬으로 전환 가능
    await screen.findByRole("heading", { level: 2 });
    fireEvent.click(screen.getByRole("button", { name: "화면으로 진행하기" }));
    expect(await screen.findByRole("button", { name: "scene-choice:p2_a" })).toBeInTheDocument();
  });

  it("Canvas 런타임 오류가 나면 즉시 HTML 흐름으로 전환되고, 그 이후에도 완주할 수 있다", async () => {
    render(<XrVetClient mode="compass" />);
    fireEvent.click(screen.getByRole("button", { name: "첫 상담 시작하기" }));

    await screen.findByTestId("fake-vet-scene");
    fireEvent.click(screen.getByRole("button", { name: "시뮬레이트 오류" }));

    // 오류 후: 씬에는 choices가 더 이상 전달되지 않고, 토글 버튼도 사라진다.
    const sceneChoiceButtons = screen
      .queryAllByRole("button")
      .filter((button) => button.textContent?.startsWith("scene-choice:"));
    expect(sceneChoiceButtons).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "글로 진행하기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "화면으로 진행하기" })).not.toBeInTheDocument();

    const htmlChoiceButton = screen.getByRole("button", { name: "차분히 관찰부터 시작한다" });
    fireEvent.click(htmlChoiceButton);

    expect(await screen.findByRole("button", { name: "계속하기" })).toBeInTheDocument();
  });
});
