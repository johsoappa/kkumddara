import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { OrderInteraction, PlaceInteraction, SelectChoices } from "./interactions";
import type { Choice } from "./scenario";

const CHOICES: Choice[] = [
  { id: "a", label: "A안", axis: "axis1" },
  { id: "b", label: "B안", axis: "axis2" },
  { id: "c", label: "C안", axis: "axis3" },
];

describe("SelectChoices", () => {
  it("선택지를 클릭하면 해당 choice로 onSelect가 호출된다", () => {
    const onSelect = vi.fn();
    render(<SelectChoices choices={CHOICES} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "B안" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(CHOICES[1]);
  });

  it("5초 이상 상호작용이 없으면 힌트를 노출한다", () => {
    vi.useFakeTimers();
    render(<SelectChoices choices={CHOICES} onSelect={vi.fn()} />);

    expect(screen.queryByText("마음에 드는 선택지를 눌러보세요.")).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText("마음에 드는 선택지를 눌러보세요.")).toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe("PlaceInteraction — 드래그·배치(탭-탭 경로)", () => {
  it("재료를 고르고 작업대를 누르면 해당 choice로 onPlace가 호출된다 (2탭)", () => {
    const onPlace = vi.fn();
    render(<PlaceInteraction choices={CHOICES} onPlace={onPlace} />);

    fireEvent.click(screen.getByRole("button", { name: "C안" }));
    fireEvent.click(screen.getByRole("button", { name: "작업대에 놓기" }));

    expect(onPlace).toHaveBeenCalledTimes(1);
    expect(onPlace).toHaveBeenCalledWith(CHOICES[2]);
  });

  it("재료를 고르기 전에 작업대를 눌러도 onPlace가 호출되지 않는다", () => {
    const onPlace = vi.fn();
    render(<PlaceInteraction choices={CHOICES} onPlace={onPlace} />);

    fireEvent.click(screen.getByRole("button", { name: "작업대에 놓기" }));

    expect(onPlace).not.toHaveBeenCalled();
  });
});

describe("OrderInteraction — 순서 정하기", () => {
  it("기본 순서 그대로 확정하면 맨 앞 choice로 onConfirm이 호출된다 (1탭)", () => {
    const onConfirm = vi.fn();
    render(<OrderInteraction choices={CHOICES} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "이 순서로 진행하기" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(CHOICES[0]);
  });

  it("카드를 맨 앞으로 옮긴 뒤 확정하면 바뀐 순서의 choice로 onConfirm이 호출된다", () => {
    const onConfirm = vi.fn();
    render(<OrderInteraction choices={CHOICES} onConfirm={onConfirm} />);

    const moveButtons = screen.getAllByRole("button", { name: "맨 앞으로" });
    // 두 번째로 표시된 "맨 앞으로" 버튼은 순서상 C안(index 2)에 해당한다.
    fireEvent.click(moveButtons[1]);
    fireEvent.click(screen.getByRole("button", { name: "이 순서로 진행하기" }));

    expect(onConfirm).toHaveBeenCalledWith(CHOICES[2]);
  });
});

describe("interactions — 공통 idle 힌트 타이머 정리", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("언마운트 후에는 힌트 타이머가 상태를 갱신하지 않는다", () => {
    const { unmount } = render(<PlaceInteraction choices={CHOICES} onPlace={vi.fn()} />);
    unmount();
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    }).not.toThrow();
  });
});
