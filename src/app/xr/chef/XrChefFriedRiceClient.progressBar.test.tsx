import { act } from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import XrChefFriedRiceClient from "./XrChefFriedRiceClient";
import type { FriedRiceState, HeatLevel, IngredientId } from "./friedRice";

// F12 — 모바일 하단 진행 바. 실제 위치(fixed)·safe-area·터치는 jsdom에서 확인할 수 없어 브라우저/실기기로 따로 본다.
// 여기서는 "단계마다 진행 버튼이 정확히 하나", 이유·진행도 글자, 끄는 중/연타 방지, 완료 화면에 남지 않음을 본다.

const { isWebglSupportedMock } = vi.hoisted(() => ({
  isWebglSupportedMock: vi.fn<() => boolean>(),
}));
vi.mock("../webglSupport", () => ({ isWebglSupported: isWebglSupportedMock }));

interface FakeSceneProps {
  state: FriedRiceState;
  interactive: boolean;
  onOpenOrder: () => void;
  onCheckRequest: () => void;
  onAddIngredient: (id: IngredientId) => void;
  onAddToWok: (id: IngredientId) => void;
  onSetHeat: (level: HeatLevel) => void;
  onPlate: () => void;
  onServe: () => void;
  onDraggingChange?: (dragging: boolean) => void;
  overlay?: ReactNode;
}

vi.mock("./FriedRiceScene", () => ({
  default: (props: FakeSceneProps) => (
    <div data-testid="fake-scene" data-phase={props.state.phase}>
      <button type="button" onClick={props.onOpenOrder}>
        scene:open-order
      </button>
      <button type="button" onClick={props.onCheckRequest}>
        scene:check-request
      </button>
      {(["rice", "carrot", "pea", "onion"] as IngredientId[]).map((id) => (
        <span key={id}>
          <button type="button" onClick={() => props.onAddIngredient(id)}>
            {`scene:add:${id}`}
          </button>
          <button type="button" onClick={() => props.onAddToWok(id)}>
            {`scene:wok:${id}`}
          </button>
        </span>
      ))}
      {(["low", "medium", "high"] as HeatLevel[]).map((level) => (
        <button key={level} type="button" onClick={() => props.onSetHeat(level)}>
          {`scene:heat:${level}`}
        </button>
      ))}
      <button type="button" onClick={props.onPlate}>
        scene:plate
      </button>
      <button type="button" onClick={props.onServe}>
        scene:serve
      </button>
      <button type="button" onClick={() => props.onDraggingChange?.(true)}>
        scene:drag-start
      </button>
      <button type="button" onClick={() => props.onDraggingChange?.(false)}>
        scene:drag-end
      </button>
    </div>
  ),
}));

beforeAll(async () => {
  isWebglSupportedMock.mockReturnValue(true);
  const { unmount } = render(<XrChefFriedRiceClient />);
  await screen.findByTestId("fake-scene");
  unmount();
});

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const scene = () => screen.getByTestId("fake-scene");
const bars = () => screen.queryAllByRole("group", { name: "다음 단계" });
const bar = () => screen.getByRole("group", { name: "다음 단계" });

function toPrep() {
  click("scene:open-order");
  click("scene:check-request");
  click("재료 준비하러 가기");
}
function toDone() {
  toPrep();
  click("scene:add:rice");
  click("scene:add:carrot");
  click("scene:add:pea");
  click("재료 준비 완료");
}
function toCook() {
  toDone();
  click("조리 순서 정하기");
}
function toHeat() {
  toCook();
  for (const id of ["carrot", "pea", "rice"]) click(`scene:wok:${id}`);
  click("이 순서로 정하기");
}
function toPlate() {
  toHeat();
  click("scene:heat:medium");
  click("이 불로 볶기");
}

describe("F12 진행 바", () => {
  beforeEach(() => {
    isWebglSupportedMock.mockReset();
    isWebglSupportedMock.mockReturnValue(true);
    // 기본: 호출마다 시계를 1초 앞으로(테스트가 사람보다 빨리 연달아 눌러도 연타 방지에 걸리지 않게). 보호 자체를 보는 테스트는 시계를 고정한다.
    let fakeNow = 1_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => (fakeNow += 1000));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("(Codex 지적) 접시에 담은 직후 같은 자리 '손님에게 전달하기'를 600ms 안에 다시 실행해도(키보드 Enter 두 번 포함) 전달되지 않는다", () => {
    const now = vi.spyOn(Date, "now");
    render(<XrChefFriedRiceClient />);
    toPlate(); // 준비 단계는 시계가 자동으로 앞서가는 기본 상태로 진행
    now.mockReturnValue(2_000_000_000); // 여기부터 시계를 고정
    click("볶음밥 접시에 담기");
    now.mockReturnValue(2_000_000_200); // 200ms 뒤 같은 자리의 전달 버튼을 또 누름
    click("손님에게 전달하기");
    expect(scene()).toHaveAttribute("data-phase", "plate");
    now.mockReturnValue(2_000_000_800); // 600ms가 지난 뒤에는 정상
    click("손님에게 전달하기");
    expect(scene()).toHaveAttribute("data-phase", "served");
  });

  it("(Codex 지적) 씬이 처음 올라오며 보내는 '끄는 중 아님'은 드래그 끝으로 치지 않아 첫 클릭이 무시되지 않는다", () => {
    const now = vi.spyOn(Date, "now");
    now.mockReturnValue(10_000);
    render(<XrChefFriedRiceClient />);
    click("scene:open-order");
    click("scene:check-request");
    click("scene:drag-end"); // 끌었던 적 없이 false만 온 경우
    now.mockReturnValue(10_050);
    click("재료 준비하러 가기");
    expect(scene()).toHaveAttribute("data-phase", "prep");
  });

  it("단계마다 진행 버튼(바)이 정확히 하나이고 라벨이 같은 버튼이 둘로 늘지 않는다", () => {
    render(<XrChefFriedRiceClient />);
    expect(bars()).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "재료 준비하러 가기" })).toHaveLength(1);

    toPrep();
    expect(bars()).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "재료 준비 완료" })).toHaveLength(1);

    for (const id of ["rice", "carrot", "pea"]) click(`scene:add:${id}`);
    click("재료 준비 완료");
    expect(scene()).toHaveAttribute("data-phase", "done");
    expect(bars()).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "조리 순서 정하기" })).toHaveLength(1);

    click("조리 순서 정하기");
    expect(bars()).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "이 순서로 정하기" })).toHaveLength(1);

    for (const id of ["carrot", "pea", "rice"]) click(`scene:wok:${id}`);
    click("이 순서로 정하기");
    expect(bars()).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "이 불로 볶기" })).toHaveLength(1);

    click("scene:heat:medium");
    click("이 불로 볶기");
    expect(bars()).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "볶음밥 접시에 담기" })).toHaveLength(1);

    click("볶음밥 접시에 담기");
    expect(bars()).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "볶음밥 접시에 담기" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "손님에게 전달하기" })).toHaveLength(1);
  });

  it("전달 완료 화면에는 진행 바도, 비활성 '다음' 버튼도 남지 않는다", () => {
    render(<XrChefFriedRiceClient />);
    toPlate();
    click("볶음밥 접시에 담기");
    click("손님에게 전달하기");
    expect(scene()).toHaveAttribute("data-phase", "served");
    expect(bars()).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "손님에게 전달하기" })).toBeNull();
    for (const button of screen.getAllByRole("button")) {
      expect(button).not.toBeDisabled();
    }
    expect(screen.getByRole("button", { name: "처음부터 다시 해보기" })).toBeInTheDocument();
  });

  it("1단계: 비활성 이유와 진행도(0/2 → 1/2)가 글자로 나오고 버튼과 aria-describedby로 이어진다", () => {
    render(<XrChefFriedRiceClient />);
    const go = screen.getByRole("button", { name: "재료 준비하러 가기" });
    expect(go).toBeDisabled();
    expect(bar()).toHaveTextContent("○ 주문표를 열어 주세요 · 0/2");
    expect(go.getAttribute("aria-describedby")).toBeTruthy();
    expect(document.getElementById(go.getAttribute("aria-describedby")!)).toHaveTextContent("주문표를 열어 주세요 · 0/2");

    click("scene:open-order");
    expect(bar()).toHaveTextContent("○ 요청 메모를 확인해 주세요 · 1/2");
    expect(screen.getByRole("button", { name: "재료 준비하러 가기" })).toBeDisabled();

    click("scene:check-request");
    const enabled = screen.getByRole("button", { name: "재료 준비하러 가기" });
    expect(enabled).toBeEnabled();
    // 색만으로 구분하지 않는다: 활성일 때는 ✓ 글자, 비활성일 때는 ○ 글자 + 점선 테두리
    expect(bar()).toHaveTextContent("✓ 주문을 확인했어요 · 2/2");
    expect(enabled.className).not.toContain("border-dashed");
  });

  it("비활성 버튼은 점선 테두리로도 활성과 구분된다", () => {
    render(<XrChefFriedRiceClient />);
    expect(screen.getByRole("button", { name: "재료 준비하러 가기" }).className).toContain("border-dashed");
  });

  it("2단계: '필요한 재료를 준비해 주세요 · 2/3', 양파가 있으면 '양파는 빼야 해요', 다 되면 ✓", () => {
    render(<XrChefFriedRiceClient />);
    toPrep();
    expect(bar()).toHaveTextContent("○ 필요한 재료를 준비해 주세요 · 0/3");
    click("scene:add:rice");
    click("scene:add:carrot");
    expect(bar()).toHaveTextContent("필요한 재료를 준비해 주세요 · 2/3");
    expect(screen.getByRole("button", { name: "재료 준비 완료" })).toBeDisabled();

    click("scene:add:onion");
    expect(bar()).toHaveTextContent("양파는 빼야 해요 · 재료 2/3");

    click("scene:add:pea");
    expect(bar()).toHaveTextContent("양파는 빼야 해요 · 재료 3/3");
    expect(screen.getByRole("button", { name: "재료 준비 완료" })).toBeDisabled();
  });

  it("3·4단계: 조건 미충족 이유와 진행도가 보이고, 충족하면 ✓로 바뀐다", () => {
    render(<XrChefFriedRiceClient />);
    toCook();
    expect(bar()).toHaveTextContent("○ 재료를 모두 팬에 넣어 주세요 · 0/3");
    click("scene:wok:rice");
    expect(bar()).toHaveTextContent("재료를 모두 팬에 넣어 주세요 · 1/3");
    click("scene:wok:carrot");
    click("scene:wok:pea");
    expect(bar()).toHaveTextContent("✓ 순서를 모두 정했어요 · 3/3");
    click("이 순서로 정하기");

    expect(bar()).toHaveTextContent("○ 불 세기를 골라 주세요");
    expect(screen.getByRole("button", { name: "이 불로 볶기" })).toBeDisabled();
    click("scene:heat:high");
    expect(bar()).toHaveTextContent("✓ 강불을 골랐어요");
    expect(screen.getByRole("button", { name: "이 불로 볶기" })).toBeEnabled();
  });

  it("모바일 고정/데스크톱 원위치 CSS 계약: fixed·safe-area·md:static, 본문 아래 여백은 전달 완료 때만 없다", () => {
    const { container } = render(<XrChefFriedRiceClient />);
    const group = bar();
    expect(group.className).toContain("fixed");
    expect(group.className).toContain("bottom-0");
    expect(group.className).toContain("env(safe-area-inset-bottom)");
    expect(group.className).toContain("md:static");
    const main = container.querySelector("main")!;
    expect(main.className).toContain("pb-[calc(10rem+env(safe-area-inset-bottom))]");
    expect(main.className).toContain("md:pb-6");

    toPlate();
    click("볶음밥 접시에 담기");
    click("손님에게 전달하기");
    expect(main.className).not.toContain("pb-[calc(10rem");
  });

  it("끄는 중에는 바가 busy이고 눌러도 진행하지 않으며, 끝난 직후 짧은 시간도 무시한다", () => {
    const now = vi.spyOn(Date, "now");
    now.mockReturnValue(10_000);
    render(<XrChefFriedRiceClient />);
    click("scene:open-order");
    click("scene:check-request");

    click("scene:drag-start");
    expect(bar()).toHaveAttribute("data-busy", "true");
    click("재료 준비하러 가기");
    expect(scene()).toHaveAttribute("data-phase", "order");

    now.mockReturnValue(10_100);
    click("scene:drag-end");
    now.mockReturnValue(10_200); // 끝난 지 100ms
    click("재료 준비하러 가기");
    expect(scene()).toHaveAttribute("data-phase", "order");

    now.mockReturnValue(10_500); // 끝난 지 400ms
    click("재료 준비하러 가기");
    expect(scene()).toHaveAttribute("data-phase", "prep");
  });

  it("단계가 바뀐 직후에는 바가 잠깐 busy(연타·더블탭 방지)였다가 풀린다", () => {
    vi.useFakeTimers();
    render(<XrChefFriedRiceClient />);
    click("scene:open-order");
    click("scene:check-request");
    expect(bar()).toHaveAttribute("data-busy", "false");
    click("재료 준비하러 가기");
    expect(scene()).toHaveAttribute("data-phase", "prep");
    expect(bar()).toHaveAttribute("data-busy", "true");
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(bar()).toHaveAttribute("data-busy", "false");
  });

  it("글로 진행하기(HTML 모드)에서도 같은 진행 바가 하나만 나온다", () => {
    render(<XrChefFriedRiceClient />);
    click("글로 진행하기");
    expect(bars()).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "재료 준비하러 가기" })).toHaveLength(1);
  });

  it("DOM 순서: 진행 바는 해당 단계 패널 안(대체 입력 버튼 뒤)에 있어 키보드 초점 순서가 기존과 같다", () => {
    render(<XrChefFriedRiceClient />);
    toPrep();
    const section = screen.getByRole("region", { name: "2단계 재료 준비" });
    const buttons = Array.from(section.querySelectorAll("button"));
    const finish = buttons.findIndex((b) => b.textContent === "재료 준비 완료");
    const addRice = buttons.findIndex((b) => b.getAttribute("aria-label")?.startsWith("밥"));
    expect(finish).toBeGreaterThan(addRice);
    expect(section.contains(bar())).toBe(true);
  });
});
