import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import XrChefFriedRiceClient from "./XrChefFriedRiceClient";
import type { FriedRiceState, IngredientId } from "./friedRice";

// 실제 R3F mesh의 포인터·드래그는 jsdom에 WebGL이 없어 자동화할 수 없다(브라우저 실입력은 별도 검증).
// 이 스위트는 "배선"만 검증한다: 클라이언트가 씬에 올바른 상태·콜백을 넘기고, 씬 콜백이 reducer와 화면
// (말풍선·안내·준비 현황·완료 문구)에 반영되는지, 그리고 글로 진행하기 폴백이 같은 상태를 쓰는지.

const { isWebglSupportedMock } = vi.hoisted(() => ({
  isWebglSupportedMock: vi.fn<() => boolean>(),
}));

vi.mock("../webglSupport", () => ({
  isWebglSupported: isWebglSupportedMock,
}));

interface FakeSceneProps {
  state: FriedRiceState;
  interactive: boolean;
  onOpenOrder: () => void;
  onCheckRequest: () => void;
  onReviewRequest: () => void;
  onAddIngredient: (id: IngredientId) => void;
  onRemoveIngredient: (id: IngredientId) => void;
  onPeekOrder: () => void;
  onSceneError?: () => void;
  overlay?: ReactNode;
}

vi.mock("./FriedRiceScene", () => ({
  default: (props: FakeSceneProps) => (
    <div
      data-testid="fake-scene"
      data-interactive={String(props.interactive)}
      data-phase={props.state.phase}
      data-order={props.state.order}
      data-tray={props.state.tray.join(",")}
    >
      <button type="button" onClick={props.onOpenOrder}>
        scene:open-order
      </button>
      <button type="button" onClick={props.onCheckRequest}>
        scene:check-request
      </button>
      <button type="button" onClick={props.onReviewRequest}>
        scene:review-request
      </button>
      {(["rice", "carrot", "pea", "onion"] as IngredientId[]).map((id) => (
        <span key={id}>
          <button type="button" onClick={() => props.onAddIngredient(id)}>
            {`scene:add:${id}`}
          </button>
          <button type="button" onClick={() => props.onRemoveIngredient(id)}>
            {`scene:remove:${id}`}
          </button>
        </span>
      ))}
      <button type="button" onClick={props.onPeekOrder}>
        scene:peek
      </button>
      <button type="button" onClick={() => props.onSceneError?.()}>
        scene:error
      </button>
      {props.overlay}
    </div>
  ),
}));


// 진행 버튼은 한 번 누르면 600ms 동안 다시 실행하지 않는다(같은 자리 다음 단계 버튼의 더블탭·연타 방지, F12).
// 테스트는 사람보다 빠르게 연달아 누르므로, 시계를 호출마다 1초씩 앞으로 보내 매 클릭을 "충분히 뒤"로 만든다.
// 그 보호 자체는 XrChefFriedRiceClient.progressBar.test.tsx에서 시간을 고정해 따로 확인한다.
beforeEach(() => {
  let fakeNow = 1_000_000;
  vi.spyOn(Date, "now").mockImplementation(() => (fakeNow += 1000));
});
afterEach(() => {
  vi.restoreAllMocks();
});

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const scene = () => screen.getByTestId("fake-scene");

function toPrepViaScene() {
  click("scene:open-order");
  click("scene:check-request");
  click("재료 준비하러 가기");
}

describe("XrChefFriedRiceClient — 1단계 주문 확인", () => {
  beforeEach(() => {
    isWebglSupportedMock.mockReset();
    isWebglSupportedMock.mockReturnValue(true);
  });

  it("손님의 주문 말풍선으로 시작하고 1단계가 활성이다", () => {
    render(<XrChefFriedRiceClient />);
    const bubble = screen.getByTestId("fried-rice-bubble");
    expect(within(bubble).getByText("손님")).toBeInTheDocument();
    expect(within(bubble).getByText("채소 볶음밥 주세요. 양파는 빼 주세요.")).toBeInTheDocument();
    const steps = screen.getByTestId("fried-rice-steps");
    expect(within(steps).getByText("주문 확인").closest("li")).toHaveAttribute("aria-current", "step");
    // 지금 단계 뒤의 2~5단계는 "예정"으로 보인다
    expect(within(steps).getAllByText("예정")).toHaveLength(4);
  });

  it("씬에는 주문표 상태와 interactive=true가 전달된다", () => {
    render(<XrChefFriedRiceClient />);
    expect(scene()).toHaveAttribute("data-interactive", "true");
    expect(scene()).toHaveAttribute("data-order", "closed");
  });

  it("주문표를 열고 요청까지 확인해야 '재료 준비하러 가기'가 켜진다", () => {
    render(<XrChefFriedRiceClient />);
    const go = screen.getByRole("button", { name: "재료 준비하러 가기" });
    expect(go).toBeDisabled();
    click("scene:open-order");
    expect(scene()).toHaveAttribute("data-order", "opened");
    expect(screen.getByRole("button", { name: "재료 준비하러 가기" })).toBeDisabled();
    // 선배 요리사가 요청 확인을 도와 준다
    expect(within(screen.getByTestId("fried-rice-bubble")).getByText("선배 요리사")).toBeInTheDocument();
    click("scene:check-request");
    expect(scene()).toHaveAttribute("data-order", "requestChecked");
    expect(screen.getByRole("button", { name: "재료 준비하러 가기" })).toBeEnabled();
  });

  it("요청을 확인한 뒤 '요청 다시 보기'를 해도 1단계에 머문다", () => {
    render(<XrChefFriedRiceClient />);
    click("scene:open-order");
    click("scene:check-request");
    click("scene:review-request");
    expect(scene()).toHaveAttribute("data-phase", "order");
    expect(screen.getByTestId("fried-rice-live")).toHaveTextContent("요청을 다시 봤어요");
  });

  it("열기 전에 요청 확인·재료 준비 시도는 무시된다", () => {
    render(<XrChefFriedRiceClient />);
    click("scene:check-request");
    expect(scene()).toHaveAttribute("data-order", "closed");
    click("scene:add:rice");
    expect(scene()).toHaveAttribute("data-tray", "");
  });

  it("글로 진행하기: 씬은 보기 전용이 되고, 주문표 카드 버튼으로 같은 단계를 진행한다", () => {
    render(<XrChefFriedRiceClient />);
    click("글로 진행하기");
    expect(scene()).toHaveAttribute("data-interactive", "false");
    const slip = screen.getByTestId("order-slip");
    expect(within(slip).getByText("새 주문이 도착했어요")).toBeInTheDocument();
    click("주문표 열기");
    expect(within(screen.getByTestId("order-slip")).getByText("채소 볶음밥")).toBeInTheDocument();
    click("요청 메모 확인하기");
    expect(within(screen.getByTestId("order-slip")).getByText("요청 · 확인했어요")).toBeInTheDocument();
    click("요청 다시 보기");
    expect(screen.getByRole("button", { name: "재료 준비하러 가기" })).toBeEnabled();
    click("화면으로 진행하기");
    expect(scene()).toHaveAttribute("data-interactive", "true");
  });

  it("WebGL이 지원되지 않으면 처음부터 주문표 카드로 진행한다(전환 토글 없음)", () => {
    isWebglSupportedMock.mockReturnValue(false);
    render(<XrChefFriedRiceClient />);
    expect(scene()).toHaveAttribute("data-interactive", "false");
    expect(screen.queryByRole("button", { name: /글로 진행하기|화면으로 진행하기/ })).toBeNull();
    click("주문표 열기");
    click("요청 메모 확인하기");
    click("재료 준비하러 가기");
    expect(scene()).toHaveAttribute("data-phase", "prep");
  });

  it("씬 런타임 오류가 나면 글로 진행으로 고정된다", () => {
    render(<XrChefFriedRiceClient />);
    click("scene:error");
    expect(scene()).toHaveAttribute("data-interactive", "false");
    expect(screen.queryByRole("button", { name: "화면으로 진행하기" })).toBeNull();
    expect(screen.getByTestId("order-slip")).toBeInTheDocument();
  });
});

describe("XrChefFriedRiceClient — 2단계 재료 준비", () => {
  beforeEach(() => {
    isWebglSupportedMock.mockReset();
    isWebglSupportedMock.mockReturnValue(true);
  });

  it("재료 준비 단계가 활성이 되고 준비 현황 0/3, 완료 버튼은 꺼져 있다", () => {
    render(<XrChefFriedRiceClient />);
    toPrepViaScene();
    const steps = screen.getByTestId("fried-rice-steps");
    expect(within(steps).getByText("재료 준비").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByTestId("prep-status")).toHaveTextContent("준비 현황 0/3");
    expect(screen.getByRole("button", { name: "재료 준비 완료" })).toBeDisabled();
    expect(screen.getByTestId("prep-guidance")).toHaveTextContent("밥, 당근, 완두콩");
  });

  it("재료 한 개를 놓아도 다음 단계로 넘어가지 않고 현황만 갱신된다", () => {
    render(<XrChefFriedRiceClient />);
    toPrepViaScene();
    click("scene:add:rice");
    expect(scene()).toHaveAttribute("data-phase", "prep");
    expect(scene()).toHaveAttribute("data-tray", "rice");
    expect(screen.getByTestId("prep-status")).toHaveTextContent("준비 현황 1/3");
    expect(screen.getByRole("button", { name: "재료 준비 완료" })).toBeDisabled();
    expect(screen.getByTestId("fried-rice-live")).toHaveTextContent("밥을 트레이에 올렸어요");
  });

  it("양파를 올리면 주문 요청을 다시 안내하고, 필요한 재료가 다 있어도 완료할 수 없다", () => {
    render(<XrChefFriedRiceClient />);
    toPrepViaScene();
    click("scene:add:rice");
    click("scene:add:carrot");
    click("scene:add:pea");
    expect(screen.getByRole("button", { name: "재료 준비 완료" })).toBeEnabled();
    click("scene:add:onion");
    const guidance = screen.getByTestId("prep-guidance");
    expect(guidance).toHaveAttribute("data-tone", "warn");
    expect(guidance).toHaveTextContent("양파는 빼 주세요");
    expect(within(screen.getByTestId("fried-rice-bubble")).getByText(/양파는 빼 달라고/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "재료 준비 완료" })).toBeDisabled();
    expect(screen.getByTestId("fried-rice-live")).toHaveTextContent("양파를 트레이에 올렸어요");
    // 같은 줄에서 '빼야 해요'로 문자 신호를 준다(색에만 의존하지 않는다)
    const row = screen.getByTestId("prep-status").querySelector('[data-ingredient="onion"]')!;
    expect(row).toHaveTextContent("빼야 해요");
  });

  it("양파를 되돌리면(씬에서 누르기) 안내가 풀리고 완료할 수 있다", () => {
    render(<XrChefFriedRiceClient />);
    toPrepViaScene();
    click("scene:add:rice");
    click("scene:add:carrot");
    click("scene:add:pea");
    click("scene:add:onion");
    click("scene:remove:onion");
    expect(scene()).toHaveAttribute("data-tray", "rice,carrot,pea");
    expect(screen.getByTestId("prep-guidance")).toHaveAttribute("data-tone", "ready");
    expect(screen.getByTestId("fried-rice-live")).toHaveTextContent("양파를 선반으로 되돌렸어요");
    expect(screen.getByRole("button", { name: "재료 준비 완료" })).toBeEnabled();
  });

  it("준비 현황의 올리기/되돌리기 버튼도 같은 상태를 바꾼다(끌기 대체 경로)", () => {
    render(<XrChefFriedRiceClient />);
    toPrepViaScene();
    click("양파 트레이에 올리기");
    expect(scene()).toHaveAttribute("data-tray", "onion");
    click("양파 선반으로 되돌리기");
    expect(scene()).toHaveAttribute("data-tray", "");
    click("밥 트레이에 올리기");
    click("당근 트레이에 올리기");
    click("완두콩 트레이에 올리기");
    click("재료 준비 완료");
    expect(screen.getByTestId("fried-rice-done-title")).toHaveTextContent("재료 준비 완료");
  });

  it("준비 완료: 제목은 '재료 준비 완료'이고 음식을 완성했다는 표현이 없으며 3~5단계는 예정이다", () => {
    render(<XrChefFriedRiceClient />);
    toPrepViaScene();
    click("scene:add:rice");
    click("scene:add:carrot");
    click("scene:add:pea");
    click("재료 준비 완료");
    expect(screen.getByTestId("fried-rice-done-title")).toHaveTextContent("재료 준비 완료");
    expect(scene()).toHaveAttribute("data-phase", "done");
    expect(document.body.textContent).not.toMatch(/완성/);
    expect(document.body.textContent).toContain("조리는 시작하지 않았어요");
    const steps = screen.getByTestId("fried-rice-steps");
    expect(within(steps).getAllByText("예정")).toHaveLength(3);
    // 준비한 재료와 양파 제외가 요약된다
    const chips = screen.getByRole("list", { name: "준비한 재료" });
    expect(chips).toHaveTextContent("밥");
    expect(chips).toHaveTextContent("양파 제외");
  });

  it("주문표 다시 보기: 작은 주문표/버튼으로 카드가 열리고 요청이 보이며 닫을 수 있다", () => {
    render(<XrChefFriedRiceClient />);
    toPrepViaScene();
    expect(screen.queryByTestId("order-peek")).toBeNull();
    click("scene:peek");
    const peek = screen.getByTestId("order-peek");
    expect(peek).toHaveTextContent("채소 볶음밥");
    expect(peek).toHaveTextContent("양파는 빼 주세요");
    // 준비 현황의 토글과 카드의 닫기 버튼은 이름이 같고 둘 다 닫는다
    const closers = screen.getAllByRole("button", { name: "주문표 닫기" });
    expect(closers).toHaveLength(2);
    fireEvent.click(closers[1]);
    expect(screen.queryByTestId("order-peek")).toBeNull();
    // 다시 열면 '요청 다시 보기'로 센다(상태는 그대로 prep)
    click("주문표 다시 보기");
    expect(screen.getByTestId("order-peek")).toBeInTheDocument();
    expect(scene()).toHaveAttribute("data-phase", "prep");
  });

  it("주문 확인을 거치지 않으면 재료 단계가 열리지 않는다(상태는 씬 콜백으로도 우회 불가)", () => {
    render(<XrChefFriedRiceClient />);
    click("scene:add:rice");
    expect(scene()).toHaveAttribute("data-phase", "order");
    expect(screen.queryByTestId("prep-status")).toBeNull();
  });

  it("처음부터 다시 해보기로 초기 상태로 돌아간다", () => {
    render(<XrChefFriedRiceClient />);
    toPrepViaScene();
    click("scene:add:rice");
    click("scene:add:carrot");
    click("scene:add:pea");
    click("재료 준비 완료");
    click("처음부터 다시 해보기");
    expect(scene()).toHaveAttribute("data-phase", "order");
    expect(scene()).toHaveAttribute("data-order", "closed");
    expect(scene()).toHaveAttribute("data-tray", "");
    expect(within(screen.getByTestId("fried-rice-bubble")).getByText("손님")).toBeInTheDocument();
  });

  it("기존 체험으로 돌아가는 링크가 있다", () => {
    render(<XrChefFriedRiceClient />);
    expect(screen.getByRole("link", { name: "기존 체험으로 가기" })).toHaveAttribute("href", "/xr/chef");
  });
});
