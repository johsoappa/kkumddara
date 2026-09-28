import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import XrVetClient from "./XrVetClient";
import { R4_ACTION_ID_LIST } from "./r4ActionDefinitions";
import { CHOICE_POINTS, SPROUT_POINTS, type Mode } from "./scenario";

// G2.2-R4-C: R4-B 승인 이후 안정화 회귀 검수에서 새로 추가하는 테스트.
// - mode/r4 props가 언마운트 없이 바뀔 때(클라이언트 사이드 네비게이션) 상태가
//   섞이지 않는지(실제로 섞이는 결함을 발견해 XrVetClient.tsx에 RESET 처리를 추가했다)
// - 21개 choice 전체에서 analytics가 정확히 1회만 전송되는지
// - 키보드 대체 경로(여러 단계)가 순서를 건너뛰지 않는지
// 기존 XrVetClient.r4.test.tsx의 커버리지와 중복되지 않는 항목만 담는다.

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
      data-point={props.point}
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

async function start(mode: Mode, r4: boolean) {
  render(<XrVetClient mode={mode} r4={r4} />);
  fireEvent.click(screen.getByRole("button", { name: "첫 상담 시작하기" }));
  await screen.findByTestId("fake-scene");
}

beforeEach(() => {
  isWebglSupportedMock.mockReset();
  isWebglSupportedMock.mockReturnValue(true);
  trackMock.mockReset();
});

describe("G2.2-R4-C — mode/r4 props 변경 시 상태 초기화", () => {
  it("mode가 언마운트 없이 바뀌면(클라이언트 사이드 네비게이션) 이전 모드의 phase·기록이 남지 않는다", async () => {
    const { rerender } = render(<XrVetClient mode="sprout" r4={false} />);
    fireEvent.click(screen.getByRole("button", { name: "첫 상담 시작하기" }));
    await screen.findByTestId("fake-scene");
    fireEvent.click(screen.getByRole("button", { name: "scene-choice:s1_a" }));
    expect(await screen.findByRole("button", { name: "계속하기" })).toBeInTheDocument();

    rerender(<XrVetClient mode="compass" r4={false} />);

    // 나침반 모드는 intro로 돌아가야 한다 — 새싹의 reaction 화면이 섞여 보이면 결함이다.
    expect(screen.getByRole("heading", { name: "수의사 체험 — 나침반모드" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "첫 상담 시작하기" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "계속하기" })).not.toBeInTheDocument();
    expect(screen.getByTestId("fake-scene")).toHaveAttribute("data-phase", "intro");
  });

  it("r4=1 -> r4=0으로 바뀌면 진행 중이던 action 패널이 사라지고 크래시 없이 intro로 돌아간다", async () => {
    const { rerender } = render(<XrVetClient mode="sprout" r4={true} />);
    fireEvent.click(screen.getByRole("button", { name: "첫 상담 시작하기" }));
    await screen.findByTestId("fake-scene");
    fireEvent.click(screen.getByRole("button", { name: "scene-choice:s1_a" }));
    expect(screen.getByRole("group", { name: "직접 조작" })).toBeInTheDocument();

    rerender(<XrVetClient mode="sprout" r4={false} />);

    expect(screen.queryByRole("group", { name: "직접 조작" })).not.toBeInTheDocument();
    expect(screen.getByTestId("fake-scene")).toHaveAttribute("data-phase", "intro");
    expect(screen.getByTestId("fake-scene")).toHaveAttribute("data-r4", "false");
  });

  it("r4=0 -> r4=1로 바뀌어도 이전 R3 진행 기록이 새 R4 흐름에 남지 않는다", async () => {
    const { rerender } = render(<XrVetClient mode="sprout" r4={false} />);
    fireEvent.click(screen.getByRole("button", { name: "첫 상담 시작하기" }));
    await screen.findByTestId("fake-scene");
    fireEvent.click(screen.getByRole("button", { name: "scene-choice:s1_a" }));
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));
    fireEvent.click(await screen.findByRole("button", { name: "scene-choice:s2_a" }));
    expect(await screen.findByRole("button", { name: "계속하기" })).toBeInTheDocument();

    rerender(<XrVetClient mode="sprout" r4={true} />);

    expect(screen.getByRole("button", { name: "첫 상담 시작하기" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "첫 상담 시작하기" }));
    // 새 R4 흐름은 1지점부터 다시 시작해야 한다(2지점 기록이 남아 있으면 결함)
    expect(await screen.findByTestId("fake-scene")).toHaveAttribute("data-point", "1");
  });
});

describe("G2.2-R4-C — 21개 choice 전체 analytics 1회 검증", () => {
  const compassIds = CHOICE_POINTS.flatMap((p) => p.choices.map((c) => c.id));
  const sproutIds = SPROUT_POINTS.flatMap((p) => p.choices.map((c) => c.id));

  it("scenario.ts의 21개 choice ID가 전부 r4ActionDefinitions에 정의돼 있다(전제 조건)", () => {
    expect(new Set(R4_ACTION_ID_LIST)).toEqual(new Set([...compassIds, ...sproutIds]));
  });

  function pointOf(mode: Mode, choiceId: string): number {
    const points = mode === "compass" ? CHOICE_POINTS : SPROUT_POINTS;
    const found = points.find((p) => p.choices.some((c) => c.id === choiceId));
    if (!found) throw new Error(`unknown choice ${choiceId}`);
    return found.point;
  }

  /** target 지점에 도달할 때까지 이전 지점은 첫 번째 선택지로 완주하고, target 지점에서는
   *  targetChoiceId를 골라 action을 완료한다. 완료 콜백은 조작 유형과 무관하게 동작하는
   *  fake scene의 "scene-action-complete" 버튼을 그대로 쓴다. */
  async function completeChoiceAt(mode: Mode, targetChoiceId: string) {
    const points = mode === "compass" ? CHOICE_POINTS : SPROUT_POINTS;
    const targetPoint = pointOf(mode, targetChoiceId);
    await start(mode, true);
    for (const point of points) {
      const choiceId = point.point === targetPoint ? targetChoiceId : point.choices[0].id;
      fireEvent.click(await screen.findByRole("button", { name: `scene-choice:${choiceId}` }));
      fireEvent.click(screen.getByRole("button", { name: "scene-action-complete" }));
      if (point.point === targetPoint) break;
      fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));
    }
  }

  it.each(sproutIds)("새싹 — choice '%s' 완료 시 xr_vet_choice_selected가 정확히 1회 전송된다", async (choiceId) => {
    await completeChoiceAt("sprout", choiceId);
    const calls = events("xr_vet_choice_selected").filter((c) => c[1].choice_id === choiceId);
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toMatchObject({ choice_id: choiceId, mode: "sprout" });
  });

  it.each(compassIds)("나침반 — choice '%s' 완료 시 xr_vet_choice_selected가 정확히 1회 전송된다", async (choiceId) => {
    await completeChoiceAt("compass", choiceId);
    const calls = events("xr_vet_choice_selected").filter((c) => c[1].choice_id === choiceId);
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toMatchObject({ choice_id: choiceId, mode: "compass" });
  });
});

describe("G2.2-R4-C — 키보드 대체 경로(여러 단계) 순차 진행", () => {
  it("s2_b(순서형) 대체 버튼은 순서를 건너뛰고 완료할 수 없다", async () => {
    await start("sprout", true);
    fireEvent.click(screen.getByRole("button", { name: "scene-choice:s1_a" }));
    fireEvent.click(screen.getByRole("button", { name: "scene-action-complete" }));
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));
    fireEvent.click(await screen.findByRole("button", { name: "scene-choice:s2_b" }));

    const step1 = screen.getByRole("button", { name: /1\. .*기록판 1번 줄/ });
    const step2 = screen.getByRole("button", { name: /2\. .*기록판 2번 줄/ });
    expect(step1).toBeEnabled();
    expect(step2).toBeDisabled();

    // 2단계를 먼저 눌러도(비활성 버튼) 아무 효과가 없다 — 여전히 action 진행 중, s2_b의
    // choice_selected 이벤트는 아직 전송되지 않는다(s1_a 완료분 1건만 있어야 한다)
    fireEvent.click(step2);
    expect(screen.getByRole("group", { name: "직접 조작" })).toBeInTheDocument();
    expect(events("xr_vet_choice_selected").filter((c) => c[1].choice_id === "s2_b")).toHaveLength(0);

    fireEvent.click(step1);
    const step2After = screen.getByRole("button", { name: /2\. .*기록판 2번 줄/ });
    expect(step2After).toBeEnabled();
    fireEvent.click(step2After);

    expect(await screen.findByRole("button", { name: "계속하기" })).toBeInTheDocument();
    expect(events("xr_vet_choice_selected").filter((c) => c[1].choice_id === "s2_b")).toHaveLength(1);
  });

  it("새 action을 시작하면 대체 버튼 진행 인덱스가 0으로 초기화된다(이전 action 잔류 없음)", async () => {
    await start("compass", true);
    // 1단계는 아무 선택이나 완주해 2단계(p2_a/p2_b/p2_c)로 넘어간다
    fireEvent.click(await screen.findByRole("button", { name: "scene-choice:p1_a" }));
    fireEvent.click(screen.getByRole("button", { name: "scene-action-complete" }));
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));

    fireEvent.click(await screen.findByRole("button", { name: "scene-choice:p2_a" }));
    fireEvent.click(screen.getByRole("button", { name: "다른 선택 고르기" }));
    fireEvent.click(screen.getByRole("button", { name: "scene-choice:p2_b" }));
    const step1 = screen.getByRole("button", { name: /^1\./ });
    expect(step1).toBeEnabled();
    fireEvent.click(step1);
    fireEvent.click(screen.getByRole("button", { name: "다른 선택 고르기" }));

    // 같은 action을 다시 시작하면 1단계부터다(이전에 1단계를 완료했던 상태가 남으면 결함)
    fireEvent.click(screen.getByRole("button", { name: "scene-choice:p2_b" }));
    const restartedStep1 = screen.getByRole("button", { name: /^1\./ });
    expect(restartedStep1).toBeEnabled();
    const restartedStep2 = screen.getByRole("button", { name: /^2\./ });
    expect(restartedStep2).toBeDisabled();
  });
});

describe("G2.2-R4-C — 선택 직후 포커스가 action 패널로 이동한다", () => {
  // 실제 키보드 회귀 검수에서 발견한 결함: 선택지 버튼은 action 시작 후에도 언마운트되지
  // 않고 hidden 처리만 되므로(XrVetClient의 choices 목록 div), 키보드로 선택한 직후
  // 포커스가 숨겨진 옛 버튼에 남아 다음 Tab이 새로 나타난 action 패널을 건너뛰었다.
  // XrVetClient.tsx에 action 패널 자동 포커스(tabIndex=-1 + useEffect)를 추가해 고쳤다.
  it("단일 단계(legacy) action 선택 시 포커스가 action 패널 그룹으로 이동한다", async () => {
    await start("sprout", true);
    fireEvent.click(screen.getByRole("button", { name: "scene-choice:s1_a" }));
    expect(screen.getByRole("group", { name: "직접 조작" })).toHaveFocus();
  });

  it("여러 단계 action 선택 시에도 포커스가 action 패널 그룹으로 이동한다", async () => {
    await start("compass", true);
    fireEvent.click(screen.getByRole("button", { name: "scene-choice:p1_a" }));
    fireEvent.click(screen.getByRole("button", { name: "scene-action-complete" }));
    fireEvent.click(await screen.findByRole("button", { name: "계속하기" }));
    fireEvent.click(await screen.findByRole("button", { name: "scene-choice:p2_b" }));
    expect(screen.getByRole("group", { name: "직접 조작" })).toHaveFocus();
  });
});
