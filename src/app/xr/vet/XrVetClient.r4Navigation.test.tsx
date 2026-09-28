import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import XrVetClient from "./XrVetClient";

// G2.2-R4-C: mode/r4 props가 언마운트 없이 바뀔 때(클라이언트 사이드 네비게이션 —
// 예: /xr/vet?mode=sprout → /xr/vet?mode=compass, 또는 ?r4=1 → ?r4=0)의 상태 초기화
// 회귀 테스트. 실제로 이전 모드의 phase·history·pending action이 새 화면에 섞이는
// 결함을 발견해 XrVetClient.tsx에 RESET 처리(useReducer의 RESET 액션 + [mode, r4]를
// 의존성으로 하는 초기화 useEffect)를 추가했다 — 이 파일은 그 회귀를 고정한다.
// (이 파일의 내용은 임시 진단 파일 `_probe.test.tsx`에서 검증한 뒤 정식 커버리지로
// 옮긴 것이다 — 그 파일 자체는 커밋된 적 없고 이미 삭제됐다.)

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
