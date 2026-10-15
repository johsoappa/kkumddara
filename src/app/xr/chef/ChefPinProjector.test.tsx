import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { PerspectiveCamera } from "three";

// R3F를 목킹해 useFrame 콜백을 붙잡는다. ChefPinProjector가 매 프레임 applyPinProjection을
// 실제 카메라 투영과 함께 호출하는지(연결 회귀)를 고정한다.
let frameCallback: ((state: unknown) => void) | null = null;
vi.mock("@react-three/fiber", () => ({
  useFrame: (cb: (state: unknown) => void) => {
    frameCallback = cb;
  },
}));

import ChefPinProjector from "./ChefPinProjector";
import ChefTargetPins, { type PinRegistry } from "./ChefTargetPins";
import type { TargetPinSpec } from "./interactions3d";

const PINS: TargetPinSpec[] = [
  { id: "token-0", kind: "drag", world: [0, 0, 0] },
  { id: "drop-zone", kind: "drop", world: [0, 0, 0], anchor: [0, 0.2, 0] },
];
const SIZE = { width: 400, height: 500 };

function makeCamera(z: number) {
  const camera = new PerspectiveCamera(50, SIZE.width / SIZE.height, 0.1, 100);
  camera.position.set(0, 0, z);
  camera.lookAt(0, 0, 0);
  return camera;
}

function setup() {
  const registry = createRef<Map<string, HTMLElement>>() as PinRegistry;
  registry.current = new Map();
  render(
    <>
      <ChefTargetPins pins={PINS} registry={registry} />
      <ChefPinProjector pins={PINS} registry={registry} />
    </>,
  );
  return registry;
}

describe("ChefPinProjector", () => {
  beforeEach(() => {
    frameCallback = null;
  });

  it("프레임마다 실제 카메라로 투영해 알약·연결선을 보이게 한다", () => {
    const registry = setup();
    expect(frameCallback).not.toBeNull();
    frameCallback!({ camera: makeCamera(5), size: SIZE });
    const pill = registry.current.get("token-0") as HTMLElement;
    const line = registry.current.get("drop-zone:line") as SVGElement;
    expect(pill.style.visibility).toBe("visible");
    expect(pill.style.transform).toContain("translate3d(200.0px"); // 화면 가로 중앙
    expect(line.getAttribute("visibility")).toBe("visible");
  });

  it("프레임 state의 캔버스 크기(가로·세로)를 그대로 투영에 사용한다", () => {
    const registry = setup();
    frameCallback!({ camera: makeCamera(5), size: { width: 320, height: 300 } });
    const pill = registry.current.get("token-0") as HTMLElement;
    // 대상이 화면 정중앙이므로 x·y가 각각 캔버스 폭·높이의 절반이어야 한다
    expect(pill.style.transform).toContain("translate3d(160.0px, 150.0px");
  });

  it("카메라가 대상 뒤를 향하면 같은 프레임 경로에서 알약과 연결선이 함께 숨겨진다", () => {
    const registry = setup();
    frameCallback!({ camera: makeCamera(5), size: SIZE });
    const behind = makeCamera(-5);
    behind.position.set(0, 0, 5);
    behind.lookAt(0, 0, 10); // 대상이 카메라 뒤
    frameCallback!({ camera: behind, size: SIZE });
    const pill = registry.current.get("token-0") as HTMLElement;
    const line = registry.current.get("drop-zone:line") as SVGElement;
    expect(pill.style.visibility).toBe("hidden");
    expect(line.getAttribute("visibility")).toBe("hidden");
  });
});
