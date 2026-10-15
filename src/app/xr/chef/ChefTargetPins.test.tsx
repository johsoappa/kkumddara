import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { act, render, renderHook } from "@testing-library/react";
import ChefTargetPins, {
  applyPinProjection,
  hidePinElements,
  useDragActiveCounter,
  type PinRegistry,
} from "./ChefTargetPins";
import type { TargetPinSpec } from "./interactions3d";

const PINS: TargetPinSpec[] = [
  { id: "token-0", kind: "drag", world: [0, 1, 0] },
  { id: "token-1", kind: "drag", world: [1, 1, 0] },
  { id: "drop-zone", kind: "drop", world: [0.4, 0.77, -0.5], anchor: [0.4, 1.1, -1.05] },
];

function makeRegistry(): PinRegistry {
  const ref = createRef<Map<string, HTMLElement>>() as PinRegistry;
  ref.current = new Map();
  return ref;
}

describe("ChefTargetPins", () => {
  it("핀이 없으면 아무것도 렌더하지 않는다", () => {
    const { container } = render(<ChefTargetPins pins={[]} registry={makeRegistry()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("행동 문구를 보여주고, 오버레이는 aria-hidden + pointer-events-none이다", () => {
    const { getByTestId, getAllByText, getByText } = render(
      <ChefTargetPins pins={PINS} registry={makeRegistry()} />,
    );
    const root = getByTestId("chef-target-pins");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root.className).toContain("pointer-events-none");
    expect(getAllByText("끌기")).toHaveLength(2);
    expect(getByText("놓는 곳")).toBeInTheDocument();
  });

  it("각 핀 요소를 registry에 등록하고, 투영 전에는 숨겨 둔다", () => {
    const registry = makeRegistry();
    render(<ChefTargetPins pins={PINS} registry={registry} />);
    expect(Array.from(registry.current.keys()).sort()).toEqual([
      "drop-zone",
      "drop-zone:line",
      "token-0",
      "token-1",
    ]);
    for (const [key, element] of Array.from(registry.current.entries())) {
      if (key.endsWith(":line")) expect(element.getAttribute("visibility")).toBe("hidden");
      else expect((element as HTMLElement).style.visibility).toBe("hidden");
    }
  });

  it("끄는 중에는 '끌기' 핀만 숨기고 '놓는 곳' 핀은 그대로 둔다", () => {
    const { getAllByText, getByText, rerender } = render(
      <ChefTargetPins pins={PINS} registry={makeRegistry()} dragging={false} />,
    );
    getAllByText("끌기").forEach((el) => expect(el.className).toContain("opacity-100"));
    rerender(<ChefTargetPins pins={PINS} registry={makeRegistry()} dragging />);
    getAllByText("끌기").forEach((el) => expect(el.className).toContain("opacity-0"));
    expect(getByText("놓는 곳").className).toContain("opacity-100");
  });

  it("모양으로도 역할이 갈린다: 놓는 곳은 흰 바탕 테두리, 나머지는 채운 알약", () => {
    const { getByText, getAllByText } = render(
      <ChefTargetPins pins={PINS} registry={makeRegistry()} />,
    );
    expect(getByText("놓는 곳").className).toContain("bg-white");
    expect(getAllByText("끌기")[0].className).toContain("bg-primary-hover");
  });

  it("드롭존 핀에만 연결선이 있고, 선도 입력을 가로막지 않는다", () => {
    const { getByTestId, container } = render(
      <ChefTargetPins pins={PINS} registry={makeRegistry()} />,
    );
    const lines = container.querySelectorAll("[data-pin-line]");
    expect(lines).toHaveLength(1);
    expect(lines[0].getAttribute("data-pin-line")).toBe("drop-zone");
    // 선은 오버레이 루트(pointer-events-none) 안에 있다 — 별도로 입력을 받는 요소가 없다
    expect(getByTestId("chef-target-pins").contains(lines[0])).toBe(true);
    expect(container.querySelector("[onclick],[onpointerdown]")).toBeNull();
  });
});

// Codex 적대적 리뷰 반영: 두 손가락으로 두 대상을 동시에 끌 때 하나만 놓아도 숨김이 풀리면 안 된다.
describe("useDragActiveCounter", () => {
  it("시작 +1 / 끝 -1 — 둘 중 하나만 놓으면 아직 끄는 중이다", () => {
    const { result } = renderHook(() => useDragActiveCounter());
    expect(result.current[0]).toBe(false);
    act(() => result.current[1](true)); // 타일 A 시작
    act(() => result.current[1](true)); // 타일 B 시작
    expect(result.current[0]).toBe(true);
    act(() => result.current[1](false)); // A만 놓음
    expect(result.current[0]).toBe(true);
    act(() => result.current[1](false)); // B도 놓음
    expect(result.current[0]).toBe(false);
  });

  it("짝이 안 맞는 끝 알림이 와도 음수로 내려가지 않는다", () => {
    const { result } = renderHook(() => useDragActiveCounter());
    act(() => result.current[1](false));
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
  });
});

describe("hidePinElements", () => {
  it("알약과 연결선 그룹을 함께 숨긴다 — 카메라 범위 밖에서 선이 남지 않게", () => {
    const registry = makeRegistry();
    render(<ChefTargetPins pins={PINS} registry={registry} />);
    const pill = registry.current.get("drop-zone") as HTMLElement;
    const line = registry.current.get("drop-zone:line") as SVGElement;
    // 투영이 한 번 끝나 둘 다 보이는 상태를 만든다
    pill.style.visibility = "visible";
    line.setAttribute("visibility", "visible");

    hidePinElements(registry, "drop-zone");

    expect(pill.style.visibility).toBe("hidden");
    expect(line.getAttribute("visibility")).toBe("hidden");
  });

  it("연결선이 없는 핀·등록되지 않은 id도 안전하게 처리한다", () => {
    const registry = makeRegistry();
    render(<ChefTargetPins pins={PINS} registry={registry} />);
    const pill = registry.current.get("token-0") as HTMLElement;
    pill.style.visibility = "visible";
    expect(() => hidePinElements(registry, "token-0")).not.toThrow();
    expect(pill.style.visibility).toBe("hidden");
    expect(() => hidePinElements(registry, "없는-id")).not.toThrow();
  });
});

// Codex 3회차 반영: 투영 경로 전체에서(요소 없음·시야 밖·화면 밖·끝점 카메라 뒤) 알약과 연결선이
// 함께 숨겨지는지를 실제 투영 함수(applyPinProjection) 경유로 확인한다.
describe("applyPinProjection", () => {
  const SIZE = { width: 343, height: 487 };
  const DROP = PINS[2]; // 연결선이 있는 드롭 핀
  const visible = () => ({ x: 0, y: 0, z: 0.5 });

  function setup() {
    const registry = makeRegistry();
    render(<ChefTargetPins pins={PINS} registry={registry} />);
    const pill = registry.current.get("drop-zone") as HTMLElement;
    const line = registry.current.get("drop-zone:line") as SVGElement;
    return { registry, pill, line };
  }

  it("시야 안: 알약 위치를 쓰고 알약·연결선을 보이게 하며 선 끝점을 갱신한다", () => {
    const { registry, pill, line } = setup();
    applyPinProjection([DROP], registry, SIZE, (w) =>
      w === DROP.anchor ? { x: 0.2, y: 0.4, z: 0.5 } : { x: -0.5, y: -0.5, z: 0.5 },
    );
    expect(pill.style.visibility).toBe("visible");
    expect(pill.style.transform).toContain("translate3d(85.8px, 365.3px");
    expect(line.getAttribute("visibility")).toBe("visible");
    const seg = line.querySelector("line")!;
    expect(seg.getAttribute("x1")).toBe("85.8");
    expect(seg.getAttribute("x2")).toBe("205.8"); // (0.2*0.5+0.5)*343
    expect(seg.getAttribute("y2")).toBe("146.1"); // (-0.4*0.5+0.5)*487
  });

  const SHOWN = { x: -0.5, y: -0.5, z: 0.5 };

  it.each([
    ["핀이 카메라 뒤(z>1)", (w: readonly number[]) => (w === DROP.anchor ? SHOWN : { x: 0, y: 0, z: 1.2 })],
    ["핀이 화면 아래 밖", (w: readonly number[]) => (w === DROP.anchor ? SHOWN : { x: 0, y: -1.5, z: 0.5 })],
    ["핀이 화면 위 밖", (w: readonly number[]) => (w === DROP.anchor ? SHOWN : { x: 0, y: 1.5, z: 0.5 })],
  ])("%s → 이미 보이던 알약과 연결선이 함께 숨겨진다", (_name, project) => {
    const { registry, pill, line } = setup();
    applyPinProjection([DROP], registry, SIZE, () => ({ x: 0, y: 0, z: 0.5 })); // 먼저 보이게
    expect(line.getAttribute("visibility")).toBe("visible");
    applyPinProjection([DROP], registry, SIZE, project as never);
    expect(pill.style.visibility).toBe("hidden");
    expect(line.getAttribute("visibility")).toBe("hidden");
  });

  it("연결선 끝점만 카메라 뒤면 선만 숨기고 알약은 보인다", () => {
    const { registry, pill, line } = setup();
    applyPinProjection([DROP], registry, SIZE, visible);
    applyPinProjection([DROP], registry, SIZE, (w) =>
      w === DROP.anchor ? { x: 0, y: 0, z: 1.5 } : visible(),
    );
    expect(pill.style.visibility).toBe("visible");
    expect(line.getAttribute("visibility")).toBe("hidden");
  });

  it("알약 요소가 등록돼 있지 않아도 남아 있던 연결선은 숨긴다", () => {
    const { registry, line } = setup();
    applyPinProjection([DROP], registry, SIZE, visible);
    expect(line.getAttribute("visibility")).toBe("visible");
    registry.current.delete("drop-zone"); // 알약만 해제된 상태
    applyPinProjection([DROP], registry, SIZE, visible);
    expect(line.getAttribute("visibility")).toBe("hidden");
  });

  it("좌우 가장자리에서는 알약을 안쪽으로 눌러 잘리지 않게 한다", () => {
    const { registry, pill } = setup();
    applyPinProjection([DROP], registry, SIZE, () => ({ x: -1, y: 0, z: 0.5 }));
    expect(pill.style.transform).toContain("translate3d(24.0px");
    applyPinProjection([DROP], registry, SIZE, () => ({ x: 1, y: 0, z: 0.5 }));
    expect(pill.style.transform).toContain("translate3d(319.0px");
  });
});
