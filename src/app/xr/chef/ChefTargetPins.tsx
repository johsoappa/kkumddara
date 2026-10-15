"use client";

// ====================================================
// ChefTargetPins — 요리사 씬의 "실제 조작 대상" 표시 핀 (F9, 신규)
//
// 수의사 SceneTargetPins와 같은 방식(Canvas 위 DOM 오버레이, pointer-events: none,
// aria-hidden)을 쓰되, 번호 대신 행동 동사만 보여준다.
//   - 누르기: 눌러서 고르는 구슬 / 순서 확정 버튼
//   - 끌기:   끌어서 움직이는 노란 상자 / 순서 타일  (채운 알약)
//   - 놓는 곳: 끌어다 놓을 자리                      (테두리만 있는 알약)
// "채움 = 내가 잡는 것, 테두리 = 놓는 곳"으로 모양만 봐도 역할이 갈린다.
// 번호는 의도적으로 쓰지 않는다 — 선택지는 순서가 아닌 대안이고, order 지점에서는
// 번호가 정렬 순서로 읽힌다.
//
// 좌표는 이 컴포넌트가 계산하지 않는다. 카메라가 단계마다 이동·FOV 보정을 하므로
// ChefScene 안의 ChefPinProjector가 매 프레임 월드 좌표를 투영해 각 핀 요소의
// style을 직접 쓴다(React 리렌더 없음). 여기서는 요소를 만들고 registry에 등록할 뿐이다.
// ====================================================

import { useCallback, useState, type MutableRefObject } from "react";
import { TARGET_PIN_TEXT, type TargetPinSpec, type Vec3 } from "./interactions3d";

/**
 * 핀 요소 등록부. 알약은 `${id}`, 연결선 그룹(<g>)은 `${id}:line`으로 등록한다 —
 * ChefPinProjector가 매 프레임 이 요소들의 위치를 직접 쓴다.
 */
/**
 * 끄는 중인 대상 수를 센다. 알림은 "시작 +1 / 끝 -1"로 짝을 이루므로 두 손가락으로 타일 두 개를
 * 동시에 끌다 하나만 놓아도 나머지가 끌리는 동안에는 `dragging`이 true로 남는다.
 * (불리언 하나로 받으면 먼저 놓은 쪽의 false가 다른 쪽까지 덮어쓴다.)
 */
export function useDragActiveCounter(): [boolean, (active: boolean) => void] {
  const [count, setCount] = useState(0);
  const onChange = useCallback(
    (active: boolean) => setCount((previous) => Math.max(0, previous + (active ? 1 : -1))),
    [],
  );
  return [count > 0, onChange];
}

export type PinRegistry = MutableRefObject<Map<string, HTMLElement | SVGElement>>;

/**
 * 핀 알약과 (있다면) 연결선 그룹을 함께 숨긴다. 카메라 범위 밖 등 어떤 이유로든 알약을 숨길 때는
 * 연결선도 같이 숨겨야 이전 프레임의 선이 화면에 남지 않는다.
 */
export function hidePinElements(registry: PinRegistry, pinId: string): void {
  const pill = registry.current.get(pinId);
  if (pill) pill.style.visibility = "hidden";
  registry.current.get(`${pinId}:line`)?.setAttribute("visibility", "hidden");
}

/** 화면 가장자리에서 알약이 잘리지 않도록 좌우만 안쪽으로 눌러 두는 여백(CSS px) */
export const PIN_EDGE_MARGIN_PX = 24;

/** 월드 좌표 → NDC(-1~1, y 위쪽 +, z는 -1~1 사이가 시야 안). three의 Vector3.project와 같은 규약 */
export type PinProjector = (world: Vec3) => { x: number; y: number; z: number };

/**
 * 한 프레임분 핀 위치를 DOM에 쓴다(ChefPinProjector가 매 프레임 호출). 카메라·three에 의존하지 않도록
 * 투영 함수를 주입받아, 어떤 경로로 일찍 끝나든 알약과 연결선이 함께 숨겨지는지 단위 테스트로 확인한다.
 *
 * 숨김 경로(전부 연결선까지 같이 숨긴다): 알약 요소 없음 / 핀이 카메라 뒤·시야 밖(z) /
 * 화면 위아래 밖 / 연결선 끝점이 카메라 뒤.
 */
export function applyPinProjection(
  pins: TargetPinSpec[],
  registry: PinRegistry,
  size: { width: number; height: number },
  project: PinProjector,
): void {
  for (const pin of pins) {
    const element = registry.current.get(pin.id);
    if (!element) {
      // 알약이 없어도 선만 남아 있을 수 있다(등록 시점 차이) — 선도 숨긴다
      hidePinElements(registry, pin.id);
      continue;
    }
    const p = project(pin.world);
    if (!(p.z > -1 && p.z < 1)) {
      hidePinElements(registry, pin.id);
      continue;
    }
    const rawX = (p.x * 0.5 + 0.5) * size.width;
    const x = Math.min(size.width - PIN_EDGE_MARGIN_PX, Math.max(PIN_EDGE_MARGIN_PX, rawX));
    const y = (-p.y * 0.5 + 0.5) * size.height;
    if (!(y > 0 && y < size.height)) {
      hidePinElements(registry, pin.id);
      continue;
    }
    element.style.visibility = "visible";
    element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;

    // 연결선(드롭존): 알약 중심 → 실제 대상 점. 같은 프레임에서 함께 갱신한다.
    const line = registry.current.get(`${pin.id}:line`);
    if (!line || !pin.anchor) continue;
    const a = project(pin.anchor);
    if (!(a.z > -1 && a.z < 1)) {
      line.setAttribute("visibility", "hidden");
      continue;
    }
    line.setAttribute("visibility", "visible");
    const ax = (a.x * 0.5 + 0.5) * size.width;
    const ay = (-a.y * 0.5 + 0.5) * size.height;
    line.querySelectorAll("line").forEach((segment) => {
      segment.setAttribute("x1", x.toFixed(1));
      segment.setAttribute("y1", y.toFixed(1));
      segment.setAttribute("x2", ax.toFixed(1));
      segment.setAttribute("y2", ay.toFixed(1));
    });
    const dot = line.querySelector("circle");
    dot?.setAttribute("cx", ax.toFixed(1));
    dot?.setAttribute("cy", ay.toFixed(1));
  }
}

export interface ChefTargetPinsProps {
  pins: TargetPinSpec[];
  registry: PinRegistry;
  /** 노란 상자를 끄는 중이면 "끌기" 핀은 숨기고 "놓는 곳"만 남긴다 */
  dragging?: boolean;
}

export default function ChefTargetPins({ pins, registry, dragging = false }: ChefTargetPinsProps) {
  if (pins.length === 0) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      aria-hidden="true"
      data-testid="chef-target-pins"
    >
      {/* 연결선: 핀 → 실제 대상(드롭 원판). 알약보다 아래에 그려 알약이 선 시작을 덮는다. */}
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        {pins
          .filter((pin) => pin.anchor)
          .map((pin) => (
            <g
              key={`${pin.id}:line`}
              ref={(element) => {
                if (element) registry.current.set(`${pin.id}:line`, element);
                else registry.current.delete(`${pin.id}:line`);
              }}
              visibility="hidden"
              data-pin-line={pin.id}
            >
              <line stroke="#ffffff" strokeWidth={5} strokeLinecap="round" />
              <line stroke="#C83A20" strokeWidth={2.5} strokeLinecap="round" strokeDasharray="1 5" />
              <circle r={5} fill="#ffffff" stroke="#C83A20" strokeWidth={2.5} />
            </g>
          ))}
      </svg>
      {pins.map((pin) => {
        const hideWhileDragging = dragging && pin.kind === "drag";
        return (
          <div
            key={pin.id}
            ref={(element) => {
              if (element) registry.current.set(pin.id, element);
              else registry.current.delete(pin.id);
            }}
            // 투영 전에는 숨겨 둔다(0,0에 한 프레임 깜빡이지 않게). 위치·표시 여부는
            // ChefPinProjector가 매 프레임 직접 쓴다.
            style={{ visibility: "hidden" }}
            className="absolute left-0 top-0 will-change-transform"
            data-pin-kind={pin.kind}
          >
            <span
              className={[
                // before: 알약 위쪽의 작은 꼭지 — 어느 대상을 가리키는지 이어 준다(냄비·도마 같은
                // 옆 장식에 붙어 보이지 않게).
                "relative inline-flex items-center rounded-full px-1.5 py-[3px] text-[11px] font-bold leading-none shadow-sm transition-opacity duration-150 motion-reduce:transition-none",
                "before:absolute before:-top-[6px] before:left-1/2 before:-translate-x-1/2 before:border-x-[5px] before:border-b-[6px] before:border-x-transparent before:border-b-primary-hover before:content-['']",
                pin.kind === "drop"
                  ? "border-2 border-primary-hover bg-white text-primary-text"
                  : "border-2 border-white bg-primary-hover text-white",
                hideWhileDragging ? "opacity-0" : "opacity-100",
              ].join(" ")}
            >
              {TARGET_PIN_TEXT[pin.kind]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
