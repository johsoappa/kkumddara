import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import XrVetClient from "./XrVetClient";

// G2.2-R4-A: ?r4=1 프로토타입의 선택 → action → reaction 상태 흐름 "배선" 검증.
// 실제 R3F 드래그/pointer 동작은 jsdom에서 검증할 수 없다(브라우저 검수 대상) — VetScene을
// 가짜로 대체해 r4 prop(actionChoiceId/onActionComplete)과 onChoice 전달만 확인한다.

const { isWebglSupportedMock, trackMock } = vi.hoisted(() => ({
  isWebglSupportedMock: vi.fn<() => boolean>(),
  trackMock: vi.fn(),
}));

vi.mock("../webglSupport", () => ({ isWebglSupported: isWebglSupportedMock }));
vi.mock("@/lib/analytics", () => ({ track: trackMock }));

interface FakeChoice {
  id: string;
  label: string;
  axis: string;
}

vi.mock("./VetScene", () => ({
  default: (props: {
    phase: string;
    point: number;
    choices: FakeChoice[];
    onChoice: (c: FakeChoice) => void;
    r4?: { actionChoiceId: string | null; onActionComplete: () => void };
  }) => (
    <div
      data-testid="fake-scene"
      data-phase={props.phase}
      data-r4={String(!!props.r4)}
      data-action={props.r4?.actionChoiceId ?? "none"}
    >
      {props.choices.map((c) => (
        <button key={c.id} type="button" onClick={() => props.onChoice(c)}>
          {`scene-choice:${c.id}`}
        </button>
      ))}
      <button type="button" onClick={() => props.r4?.onActionComplete()}>
        scene-action-complete
      </button>
    </div>
  ),
}));

function events(name: string) {
  return trackMock.mock.calls.filter((c) => c[0] === name);
}

async function startAt(mode: "sprout" | "compass", r4: boolean) {
  render(<XrVetClient mode={mode} r4={r4} />);
  fireEvent.click(screen.getByRole("button", { name: "첫 상담 시작하기" }));
  await screen.findByTestId("fake-scene");
}

describe("XrVetClient — R4-A 프로토타입 흐름", () => {
  beforeEach(() => {
    isWebglSupportedMock.mockReset();
    isWebglSupportedMock.mockReturnValue(true);
    trackMock.mockReset();
  });

  it("기본(r4 없음)에서는 R3 흐름 그대로: 씬 선택 즉시 reaction, r4 prop이 씬에 전달되지 않는다", async () => {
    await startAt("sprout", false);
    expect(screen.getByTestId("fake-scene")).toHaveAttribute("data-r4", "false");
    fireEvent.click(screen.getByRole("button", { name: "scene-choice:s1_a" }));
    expect(await screen.findByRole("button", { name: "계속하기" })).toBeInTheDocument();
    expect(events("xr_vet_choice_selected")).toHaveLength(1);
  });

  it("G2.2-R4-B: r4=1이면 compass에서도 활성화된다", async () => {
    await startAt("compass", true);
    expect(screen.getByTestId("fake-scene")).toHaveAttribute("data-r4", "true");
  });

  it("r4=0(기본)이면 compass에서 R3 그대로 — r4 prop이 씬에 전달되지 않는다", async () => {
    await startAt("compass", false);
    expect(screen.getByTestId("fake-scene")).toHaveAttribute("data-r4", "false");
  });

  it("r4=1(sprout): s1_a 선택은 action을 시작할 뿐 analytics를 보내지 않고, 선택 목록은 숨겨진다", async () => {
    await startAt("sprout", true);
    expect(screen.getByTestId("fake-scene")).toHaveAttribute("data-r4", "true");
    fireEvent.click(screen.getByRole("button", { name: "scene-choice:s1_a" }));
    expect(screen.getByTestId("fake-scene")).toHaveAttribute("data-action", "s1_a");
    expect(events("xr_vet_choice_selected")).toHaveLength(0);
    expect(screen.getByRole("group", { name: "직접 조작" })).toBeInTheDocument();
    // 진행 중에는 HTML 선택 버튼으로 다른 선택을 할 수 없다(목록이 숨겨짐)
    expect(screen.queryByRole("button", { name: "콩이의 움직임과 자세를 먼저 살핀다" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "계속하기" })).not.toBeInTheDocument();
  });

  it("action 완료(씬)는 handleChoice를 정확히 한 번 호출하고, 더블 완료도 한 번만 처리한다", async () => {
    await startAt("sprout", true);
    fireEvent.click(screen.getByRole("button", { name: "scene-choice:s1_b" }));
    const complete = screen.getByRole("button", { name: "scene-action-complete" });
    fireEvent.click(complete);
    fireEvent.click(complete);
    expect(await screen.findByRole("button", { name: "계속하기" })).toBeInTheDocument();
    const calls = events("xr_vet_choice_selected");
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toMatchObject({ choice_id: "s1_b", axis_tag: "axis5", choice_point: 1, mode: "sprout" });
    expect(screen.getByTestId("fake-scene")).toHaveAttribute("data-action", "none");
  });

  it("접근성 대체 버튼은 드래그 완료와 같은 결과(choice 한 번 전송, reaction 이동)를 만든다", async () => {
    await startAt("sprout", true);
    fireEvent.click(screen.getByRole("button", { name: "보호자 이야기를 먼저 듣는다" }));
    const alt = screen.getByRole("button", { name: "보호자 이야기를 기록하기" });
    fireEvent.click(alt);
    fireEvent.click(alt);
    expect(await screen.findByRole("button", { name: "계속하기" })).toBeInTheDocument();
    const calls = events("xr_vet_choice_selected");
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toMatchObject({ choice_id: "s1_a", axis_tag: "axis1" });
  });

  it("'다른 선택 고르기'는 pending action을 초기화하고 analytics를 보내지 않는다", async () => {
    await startAt("sprout", true);
    fireEvent.click(screen.getByRole("button", { name: "scene-choice:s1_a" }));
    fireEvent.click(screen.getByRole("button", { name: "다른 선택 고르기" }));
    expect(screen.getByTestId("fake-scene")).toHaveAttribute("data-action", "none");
    expect(screen.queryByRole("group", { name: "직접 조작" })).not.toBeInTheDocument();
    expect(events("xr_vet_choice_selected")).toHaveLength(0);
    // 다시 선택할 수 있고 완료하면 한 번만 전송된다
    fireEvent.click(screen.getByRole("button", { name: "scene-choice:s1_b" }));
    fireEvent.click(screen.getByRole("button", { name: "scene-action-complete" }));
    expect(events("xr_vet_choice_selected")).toHaveLength(1);
  });

  it("'글로 진행하기'로 전환하면 진행 중 action을 버리고 기존 선택형 흐름으로 완주한다", async () => {
    await startAt("sprout", true);
    fireEvent.click(screen.getByRole("button", { name: "scene-choice:s1_a" }));
    // action 패널에서는 토글이 노출되지 않으므로 취소 후 토글한다
    fireEvent.click(screen.getByRole("button", { name: "다른 선택 고르기" }));
    fireEvent.click(screen.getByRole("button", { name: "글로 진행하기" }));
    fireEvent.click(screen.getByRole("button", { name: "콩이의 움직임과 자세를 먼저 살핀다" }));
    // 글로 진행하기 = action 없이 즉시 reaction
    expect(await screen.findByRole("button", { name: "계속하기" })).toBeInTheDocument();
    expect(events("xr_vet_choice_selected")).toHaveLength(1);
  });

  it("R4-B에서도 새싹 3지점 완주 시 choice 3회·result 1회, 결과 집계(none)는 변하지 않는다 — 2·3단계도 이제 action이 붙는다", async () => {
    await startAt("sprout", true);
    fireEvent.click(screen.getByRole("button", { name: "scene-choice:s1_a" }));
    fireEvent.click(screen.getByRole("button", { name: "scene-action-complete" }));
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));
    // G2.2-R4-B: 새싹 2·3단계도 이제 action이 붙는다(가짜 씬은 조작 유형과 무관하게 완료 버튼만 노출한다)
    fireEvent.click(await screen.findByRole("button", { name: "scene-choice:s2_a" }));
    fireEvent.click(screen.getByRole("button", { name: "scene-action-complete" }));
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));
    fireEvent.click(await screen.findByRole("button", { name: "scene-choice:s3_a" }));
    fireEvent.click(screen.getByRole("button", { name: "scene-action-complete" }));
    fireEvent.click(await screen.findByRole("button", { name: "완료 화면 보기" }));
    expect(await screen.findByText("첫 상담 완료!")).toBeInTheDocument();
    expect(events("xr_vet_choice_selected")).toHaveLength(3);
    const result = events("xr_vet_result_shown");
    expect(result).toHaveLength(1);
    expect(result[0][1]).toMatchObject({ mode: "sprout", result_axis: "none" });
  });
});
