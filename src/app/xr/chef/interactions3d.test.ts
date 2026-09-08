import { describe, expect, it } from "vitest";
import { MODE_POINTS, type Mode } from "./scenario";
import {
  SCENE_ANCHORS,
  easeAlpha,
  easeVec3,
  hitTestDropZone,
  reorderOnDrag,
  sceneInteractionId,
} from "./interactions3d";

describe("sceneInteractionId", () => {
  it("모드+지점 번호로 안정적인 id를 만든다 (stage/kind로 추론하지 않음)", () => {
    expect(sceneInteractionId("compass", 4)).toBe("compass_p4");
    expect(sceneInteractionId("compass", 5)).toBe("compass_p5");
    expect(sceneInteractionId("sprout", 3)).toBe("sprout_p3");
    // compass p4/p5와 sprout p3는 모두 select+plating이지만 id는 모두 다르다
    const ids = [
      sceneInteractionId("compass", 4),
      sceneInteractionId("compass", 5),
      sceneInteractionId("sprout", 3),
    ];
    expect(new Set(ids).size).toBe(3);
  });
});

describe("SCENE_ANCHORS 매핑 무결성", () => {
  const modes: Mode[] = ["compass", "sprout"];

  for (const mode of modes) {
    MODE_POINTS[mode].forEach((point) => {
      it(`${mode} 지점${point.point} — anchor kind와 choices 개수가 시나리오와 일치한다`, () => {
        const id = sceneInteractionId(mode, point.point);
        const anchor = SCENE_ANCHORS[id];
        expect(anchor, `${id} 앵커가 존재해야 한다`).toBeDefined();
        expect(anchor.kind).toBe(point.interactionKind);

        if (anchor.kind === "select") {
          expect(anchor.targets.length).toBe(point.choices.length);
        } else if (anchor.kind === "place") {
          expect(anchor.tokens.length).toBe(point.choices.length);
        } else if (anchor.kind === "order") {
          expect(anchor.slots.length).toBe(point.choices.length);
        }
      });
    });
  }
});

describe("hitTestDropZone", () => {
  const zones = [{ id: "z1", x: 0, z: 0, radius: 0.3 }];

  it("반경 안이면 해당 zone id를 반환한다", () => {
    expect(hitTestDropZone({ x: 0.1, z: 0.1 }, zones)).toBe("z1");
  });

  it("반경 밖이면 null을 반환한다", () => {
    expect(hitTestDropZone({ x: 1, z: 1 }, zones)).toBeNull();
  });

  it("경계값(정확히 radius)은 포함으로 처리한다", () => {
    expect(hitTestDropZone({ x: 0.3, z: 0 }, zones)).toBe("z1");
  });

  it("여러 zone 중 먼저 맞는 것을 반환한다", () => {
    const multi = [
      { id: "a", x: -1, z: 0, radius: 0.2 },
      { id: "b", x: 1, z: 0, radius: 0.2 },
    ];
    expect(hitTestDropZone({ x: 1, z: 0 }, multi)).toBe("b");
  });
});

describe("reorderOnDrag", () => {
  const slotX = [-0.5, 0, 0.5];

  it("드래그한 타일이 오른쪽 슬롯을 넘어가면(정방향 교차) 순서가 바뀐다", () => {
    const order = ["a", "b", "c"]; // a는 slot 0
    const next = reorderOnDrag(order, "a", 0.5, slotX); // a가 slot 2 위치까지 이동
    expect(next).toEqual(["b", "c", "a"]);
  });

  it("드래그한 타일이 왼쪽 슬롯을 넘어가면(역방향 교차) 순서가 바뀐다", () => {
    const order = ["a", "b", "c"]; // c는 slot 2
    const next = reorderOnDrag(order, "c", -0.5, slotX); // c가 slot 0 위치까지 이동
    expect(next).toEqual(["c", "a", "b"]);
  });

  it("아직 이웃 슬롯을 넘지 않았으면(no-op) 같은 배열을 반환한다", () => {
    const order = ["a", "b", "c"];
    const next = reorderOnDrag(order, "b", 0.05, slotX); // slot 1 근처 그대로
    expect(next).toBe(order); // 참조 동일성까지 확인 — 불필요한 리렌더 방지
  });

  it("존재하지 않는 id면 원본을 그대로 반환한다", () => {
    const order = ["a", "b", "c"];
    expect(reorderOnDrag(order, "z", 0.5, slotX)).toBe(order);
  });
});

describe("easeAlpha / easeVec3", () => {
  it("dt가 0이면 alpha도 0이라 목표로 이동하지 않는다", () => {
    expect(easeAlpha(0, 0.35)).toBe(0);
  });

  it("dt가 커질수록 alpha가 1에 수렴한다", () => {
    const a1 = easeAlpha(0.1, 0.35);
    const a2 = easeAlpha(1, 0.35);
    const a3 = easeAlpha(10, 0.35);
    expect(a1).toBeLessThan(a2);
    expect(a2).toBeLessThan(a3);
    expect(a3).toBeGreaterThan(0.99);
  });

  it("halfLife가 0 이하이면 즉시 목표값(alpha=1)으로 스냅한다", () => {
    expect(easeAlpha(0.1, 0)).toBe(1);
  });

  it("easeVec3는 alpha=1이면 목표값과 정확히 같아진다(수렴)", () => {
    const result = easeVec3([0, 0, 0], [1, 2, 3], 1);
    expect(result).toEqual([1, 2, 3]);
  });

  it("easeVec3는 alpha=0이면 현재값을 그대로 유지한다(멱등)", () => {
    const result = easeVec3([1, 1, 1], [5, 5, 5], 0);
    expect(result).toEqual([1, 1, 1]);
  });

  it("easeVec3는 목표에 이미 도달했으면 그대로 유지한다(멱등)", () => {
    const result = easeVec3([2, 2, 2], [2, 2, 2], 0.5);
    expect(result).toEqual([2, 2, 2]);
  });
});
