import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import XrChefFriedRiceClient from "./XrChefFriedRiceClient";
import type { FriedRiceState, HeatLevel, IngredientId } from "./friedRice";

// F11-3~5(조리 순서·불 조절·플레이팅·전달) 배선 검증. 실제 3D 포인터는 jsdom에서 자동화할 수 없어
// 브라우저 실입력으로 따로 확인한다(AI_COLLAB_TASK.md). 여기서는 씬 콜백 → reducer → 화면 문구/상태 연결만 본다.

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
  onPeekOrder: () => void;
  overlay?: ReactNode;
}

vi.mock("./FriedRiceScene", () => ({
  default: (props: FakeSceneProps) => (
    <div
      data-testid="fake-scene"
      data-phase={props.state.phase}
      data-wok={props.state.wok.join(",")}
      data-heat={props.state.heat ?? ""}
      data-plated={String(props.state.plated)}
      data-interactive={String(props.interactive)}
    >
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
      <button type="button" onClick={props.onPeekOrder}>
        scene:peek
      </button>
      {props.overlay}
    </div>
  ),
}));

// next/dynamic으로 불러오는 씬 목(mock)은 파일 안에서 처음 쓸 때 비동기로 로드되므로 한 번 미리 불러 둔다
beforeAll(async () => {
  isWebglSupportedMock.mockReturnValue(true);
  const { unmount } = render(<XrChefFriedRiceClient />);
  await screen.findByTestId("fake-scene");
  unmount();
});


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

function toDone() {
  click("scene:open-order");
  click("scene:check-request");
  click("재료 준비하러 가기");
  click("scene:add:rice");
  click("scene:add:carrot");
  click("scene:add:pea");
  click("재료 준비 완료");
}
function toCook() {
  toDone();
  click("조리 순서 정하기");
}
function toHeat(order: IngredientId[] = ["carrot", "pea", "rice"]) {
  toCook();
  for (const id of order) click(`scene:wok:${id}`);
  click("이 순서로 정하기");
}
function toPlate(level: HeatLevel = "medium") {
  toHeat();
  click(`scene:heat:${level}`);
  click("이 불로 볶기");
}

describe("F11-3 조리 순서 (클라이언트)", () => {
  beforeEach(() => {
    isWebglSupportedMock.mockReset();
    isWebglSupportedMock.mockReturnValue(true);
  });

  it("재료 준비 완료 뒤 '조리 순서 정하기'를 눌러야 3단계가 시작된다", () => {
    render(<XrChefFriedRiceClient />);
    toDone();
    expect(scene()).toHaveAttribute("data-phase", "done");
    const steps = screen.getByTestId("fried-rice-steps");
    expect(within(steps).getByText("조리 순서").closest("li")).not.toHaveAttribute("aria-current");
    click("조리 순서 정하기");
    expect(scene()).toHaveAttribute("data-phase", "cook");
    expect(within(steps).getByText("조리 순서").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByTestId("fried-rice-live")).toHaveTextContent("조리 순서");
    expect(screen.getByRole("heading", { name: "3단계 · 조리 순서" })).toBeInTheDocument();
  });

  it("씬에서 재료를 눌러 팬에 넣으면 순서·설명·진행도가 바뀐다(순서에 정답 없음)", () => {
    render(<XrChefFriedRiceClient />);
    toCook();
    expect(screen.getByRole("button", { name: "이 순서로 정하기" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "마지막 재료 빼기" })).toBeDisabled();
    click("scene:wok:rice");
    expect(scene()).toHaveAttribute("data-wok", "rice");
    expect(screen.getByTestId("cook-note")).toHaveTextContent("밥을 먼저");
    expect(screen.getByTestId("cook-status")).toHaveTextContent("넣은 순서 1/3");
    expect(screen.getByTestId("fried-rice-live")).toHaveTextContent("밥을 팬에 1번째로 넣었어요");
    // 같은 재료를 또 눌러도 한 번만 들어간다
    click("scene:wok:rice");
    expect(scene()).toHaveAttribute("data-wok", "rice");
    // 양파는 트레이에 없으므로 들어가지 않는다
    click("scene:wok:onion");
    expect(scene()).toHaveAttribute("data-wok", "rice");
    click("scene:wok:carrot");
    click("scene:wok:pea");
    expect(scene()).toHaveAttribute("data-wok", "rice,carrot,pea");
    expect(screen.getByTestId("cook-note")).toHaveTextContent("밥을 먼저 볶는");
    expect(screen.getByRole("button", { name: "이 순서로 정하기" })).toBeEnabled();
  });

  it("버튼(대체 경로)으로 넣고 마지막 재료를 빼서 순서를 바꿀 수 있다", () => {
    render(<XrChefFriedRiceClient />);
    toCook();
    click("당근 팬에 넣기");
    click("완두콩 팬에 넣기");
    click("마지막 재료 빼기");
    expect(scene()).toHaveAttribute("data-wok", "carrot");
    expect(screen.getByTestId("fried-rice-live")).toHaveTextContent("완두콩을 팬에서 뺐어요");
    click("밥 팬에 넣기");
    click("완두콩 팬에 넣기");
    expect(scene()).toHaveAttribute("data-wok", "carrot,rice,pea");
    expect(screen.getByRole("list", { name: "팬에 넣은 순서" })).toHaveTextContent("1. 당근");
  });

  it("어떤 순서든 확정하면 4단계로 가고, 순서는 요약으로 남는다", () => {
    render(<XrChefFriedRiceClient />);
    toHeat(["pea", "rice", "carrot"]);
    expect(scene()).toHaveAttribute("data-phase", "heat");
    expect(screen.getByTestId("heat-order-recap")).toHaveTextContent("완두콩 → 밥 → 당근");
  });

  it("3단계에서도 주문표 다시 보기가 된다", () => {
    render(<XrChefFriedRiceClient />);
    toCook();
    click("scene:peek");
    expect(screen.getByTestId("order-peek")).toHaveTextContent("양파는 빼 주세요");
  });
});

describe("F11-4 불 조절 (클라이언트)", () => {
  beforeEach(() => {
    isWebglSupportedMock.mockReset();
    isWebglSupportedMock.mockReturnValue(true);
  });

  it("불 세기를 고르기 전에는 '이 불로 볶기'가 꺼져 있고, 고르면 설명과 선택 표시가 나온다", () => {
    render(<XrChefFriedRiceClient />);
    toHeat();
    expect(screen.getByRole("button", { name: "이 불로 볶기" })).toBeDisabled();
    expect(screen.getByRole("radiogroup", { name: "불 세기" })).toBeInTheDocument();
    click("scene:heat:high");
    expect(scene()).toHaveAttribute("data-heat", "high");
    expect(screen.getByTestId("heat-note")).toHaveTextContent("강불");
    const high = screen.getByRole("radio", { name: /강불/ });
    expect(high).toHaveAttribute("aria-checked", "true");
    expect(within(high).getByText("✓", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /약불/ })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("button", { name: "이 불로 볶기" })).toBeEnabled();
  });

  it("라디오 버튼(대체 경로)으로도 같은 상태를 바꾸고, 세기를 바꿔 고를 수 있다", () => {
    render(<XrChefFriedRiceClient />);
    toHeat();
    fireEvent.click(screen.getByRole("radio", { name: /약불/ }));
    expect(scene()).toHaveAttribute("data-heat", "low");
    fireEvent.click(screen.getByRole("radio", { name: /중불/ }));
    expect(scene()).toHaveAttribute("data-heat", "medium");
    expect(screen.getByTestId("fried-rice-live")).toHaveTextContent("중불을 골랐어요");
  });

  it("불 세기 라디오 그룹은 화살표 키로 이동·선택하고, Tab 정지 지점은 하나뿐이다", () => {
    render(<XrChefFriedRiceClient />);
    toHeat();
    const radios = () => screen.getAllByRole("radio");
    // 아직 고르지 않았으면 첫 항목만 Tab으로 닿는다
    expect(radios().map((r) => r.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"]);
    fireEvent.keyDown(radios()[0], { key: "ArrowRight" });
    expect(scene()).toHaveAttribute("data-heat", "medium");
    expect(radios().map((r) => r.getAttribute("tabindex"))).toEqual(["-1", "0", "-1"]);
    expect(document.activeElement).toBe(radios()[1]);
    fireEvent.keyDown(radios()[1], { key: "ArrowDown" });
    expect(scene()).toHaveAttribute("data-heat", "high");
    // 끝에서 다음으로 가면 처음으로 돌아온다
    fireEvent.keyDown(radios()[2], { key: "ArrowRight" });
    expect(scene()).toHaveAttribute("data-heat", "low");
    fireEvent.keyDown(radios()[0], { key: "ArrowLeft" });
    expect(scene()).toHaveAttribute("data-heat", "high");
    // 화살표가 아닌 키는 무시
    fireEvent.keyDown(radios()[2], { key: "a" });
    expect(scene()).toHaveAttribute("data-heat", "high");
  });

  it("'순서 다시 정하기'는 팬을 비우고 3단계로 돌아간다", () => {
    render(<XrChefFriedRiceClient />);
    toHeat();
    click("scene:heat:low");
    click("순서 다시 정하기");
    expect(scene()).toHaveAttribute("data-phase", "cook");
    expect(scene()).toHaveAttribute("data-wok", "");
    expect(scene()).toHaveAttribute("data-heat", "");
  });
});

describe("F11-5 플레이팅·전달 (클라이언트)", () => {
  beforeEach(() => {
    isWebglSupportedMock.mockReset();
    isWebglSupportedMock.mockReturnValue(true);
  });

  it("불을 확정하면 5단계: 담기 전에는 전달 버튼이 없다", () => {
    render(<XrChefFriedRiceClient />);
    toPlate();
    expect(scene()).toHaveAttribute("data-phase", "plate");
    expect(screen.getByRole("heading", { name: "5단계 · 플레이팅·전달" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "손님에게 전달하기" })).toBeNull();
    expect(screen.getByTestId("plate-note")).toHaveTextContent("당근 → 완두콩 → 밥 순서로 넣고 중불로 볶았어요.");
  });

  it("씬에서 접시에 담고 벨을 눌러 전달하면 '한 접시 완성' 화면이 나온다", () => {
    render(<XrChefFriedRiceClient />);
    toPlate();
    // 담기 전에는 벨(scene:serve)을 눌러도 전달되지 않는다
    click("scene:serve");
    expect(scene()).toHaveAttribute("data-phase", "plate");
    click("scene:plate");
    expect(scene()).toHaveAttribute("data-plated", "true");
    expect(screen.getByTestId("fried-rice-bubble")).toHaveTextContent("전달 벨");
    click("scene:serve");
    expect(scene()).toHaveAttribute("data-phase", "served");
    expect(screen.getByTestId("fried-rice-served-title")).toHaveTextContent("한 접시 완성");
    expect(screen.getByTestId("served-outcome")).toHaveTextContent("중불로 볶았어요");
    // 손님이 마지막에 말한다(아바타 유지) — 양파가 없다는 점을 반영
    const bubble = screen.getByTestId("fried-rice-bubble");
    expect(within(bubble).getByText("손님")).toBeInTheDocument();
    expect(bubble).toHaveTextContent("양파가 없어서 좋네요");
    // 단계 표시줄은 모두 완료
    const steps = screen.getByTestId("fried-rice-steps");
    expect(within(steps).queryAllByText("예정")).toHaveLength(0);
  });

  it("버튼(대체 경로)으로 담고 전달할 수 있고, 담기 전에는 불 세기를 다시 고르러 돌아갈 수 있다", () => {
    render(<XrChefFriedRiceClient />);
    toPlate("high");
    click("불 세기 다시 고르기");
    expect(scene()).toHaveAttribute("data-phase", "heat");
    // 이전 선택은 비워져 있어 새로 골라야 볶을 수 있다
    expect(scene()).toHaveAttribute("data-heat", "");
    expect(screen.getByRole("button", { name: "이 불로 볶기" })).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: /강불/ }));
    click("이 불로 볶기");
    click("볶음밥 접시에 담기");
    click("손님에게 전달하기");
    expect(scene()).toHaveAttribute("data-phase", "served");
    expect(screen.getByTestId("served-outcome")).toHaveTextContent("강불로 볶았어요");
  });

  it("'완성'이라는 말은 전달 후 마지막 화면 전까지 화면 어디에도 나오지 않는다", () => {
    render(<XrChefFriedRiceClient />);
    const bodyText = () => document.body.textContent ?? "";
    expect(bodyText()).not.toMatch(/완성/);
    toDone();
    expect(bodyText()).not.toMatch(/완성/);
    click("조리 순서 정하기");
    expect(bodyText()).not.toMatch(/완성/);
    for (const id of ["carrot", "pea", "rice"]) click(`scene:wok:${id}`);
    click("이 순서로 정하기");
    expect(bodyText()).not.toMatch(/완성/);
    click("scene:heat:medium");
    click("이 불로 볶기");
    expect(bodyText()).not.toMatch(/완성/);
    click("scene:plate");
    expect(bodyText()).not.toMatch(/완성/);
    click("scene:serve");
    expect(bodyText()).toMatch(/한 접시 완성/);
  });

  it("처음부터 다시 해보기는 팬·불·접시까지 모두 초기화한다", () => {
    render(<XrChefFriedRiceClient />);
    toPlate();
    click("scene:plate");
    click("scene:serve");
    click("처음부터 다시 해보기");
    expect(scene()).toHaveAttribute("data-phase", "order");
    expect(scene()).toHaveAttribute("data-wok", "");
    expect(scene()).toHaveAttribute("data-heat", "");
    expect(scene()).toHaveAttribute("data-plated", "false");
  });

  it("글로 진행하기: 씬은 보기 전용이지만 3~5단계는 버튼으로 끝까지 갈 수 있다", () => {
    isWebglSupportedMock.mockReturnValue(false);
    render(<XrChefFriedRiceClient />);
    expect(scene()).toHaveAttribute("data-interactive", "false");
    click("주문표 열기");
    click("요청 메모 확인하기");
    click("재료 준비하러 가기");
    for (const name of ["밥 트레이에 올리기", "당근 트레이에 올리기", "완두콩 트레이에 올리기"]) click(name);
    click("재료 준비 완료");
    click("조리 순서 정하기");
    for (const name of ["당근 팬에 넣기", "완두콩 팬에 넣기", "밥 팬에 넣기"]) click(name);
    click("이 순서로 정하기");
    fireEvent.click(screen.getByRole("radio", { name: /약불/ }));
    click("이 불로 볶기");
    click("볶음밥 접시에 담기");
    click("손님에게 전달하기");
    expect(screen.getByTestId("fried-rice-served-title")).toHaveTextContent("한 접시 완성");
    expect(screen.getByTestId("served-outcome")).toHaveTextContent("약불로 볶았어요");
  });
});
