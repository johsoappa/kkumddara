import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement } from "react";

// F13 — /xr/chef 진입 규칙: 기본은 볶음밥 체험, 이전 체험(나침반·새싹)은 ?scenario=classic 으로 명시 보존,
// scenario 없이 온 기존 ?mode=sprout|compass 링크는 이전 체험 그대로(의미 보존).
// 클라이언트 컴포넌트는 이름만 비교하도록 가볍게 목킹한다.

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("./XrChefClient", () => ({ default: function XrChefClient() { return null; } }));
vi.mock("./XrChefFriedRiceClient", () => ({
  default: function XrChefFriedRiceClient() {
    return null;
  },
}));

import XrChefPage from "./page";

type SearchParams = { [key: string]: string | string[] | undefined };

function render(searchParams?: SearchParams) {
  const element = XrChefPage({ searchParams });
  if (!isValidElement(element)) throw new Error("element expected");
  const type = element.type as { name?: string };
  return { name: type.name, props: element.props as { mode?: string } };
}

describe("/xr/chef 진입 분기", () => {
  const original = process.env.NEXT_PUBLIC_XR_CHEF_ENABLED;
  beforeEach(() => {
    process.env.NEXT_PUBLIC_XR_CHEF_ENABLED = "true";
  });
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_XR_CHEF_ENABLED;
    else process.env.NEXT_PUBLIC_XR_CHEF_ENABLED = original;
  });

  it("플래그가 꺼져 있으면 모든 진입이 404다(이전 체험 경로 포함, 같은 플래그 뒤에 있다)", () => {
    process.env.NEXT_PUBLIC_XR_CHEF_ENABLED = "false";
    expect(() => render({ scenario: "fried-rice" })).toThrow("NEXT_NOT_FOUND");
    expect(() => render({ scenario: "classic" })).toThrow("NEXT_NOT_FOUND");
    expect(() => render({ mode: "sprout" })).toThrow("NEXT_NOT_FOUND");
    expect(() => render()).toThrow("NEXT_NOT_FOUND");
    delete process.env.NEXT_PUBLIC_XR_CHEF_ENABLED;
    expect(() => render()).toThrow("NEXT_NOT_FOUND");
  });

  it("기본 진입(/xr/chef)은 볶음밥 체험이다", () => {
    expect(render().name).toBe("XrChefFriedRiceClient");
    expect(render({}).name).toBe("XrChefFriedRiceClient");
  });

  it("?scenario=fried-rice는 볶음밥 체험이다(mode가 같이 와도 — 새 체험에는 모드가 없다)", () => {
    expect(render({ scenario: "fried-rice" }).name).toBe("XrChefFriedRiceClient");
    expect(render({ scenario: "fried-rice", mode: "sprout" }).name).toBe("XrChefFriedRiceClient");
  });

  it("이전 체험은 ?scenario=classic 으로 명시 보존된다 — mode=sprout만 새싹, 나머지는 나침반", () => {
    expect(render({ scenario: "classic" })).toMatchObject({ name: "XrChefClient", props: { mode: "compass" } });
    expect(render({ scenario: "classic", mode: "sprout" })).toMatchObject({ name: "XrChefClient", props: { mode: "sprout" } });
    expect(render({ scenario: "classic", mode: "compass" })).toMatchObject({ name: "XrChefClient", props: { mode: "compass" } });
    expect(render({ scenario: "classic", mode: "other" })).toMatchObject({ name: "XrChefClient", props: { mode: "compass" } });
    expect(render({ scenario: "classic", mode: ["sprout"] })).toMatchObject({ name: "XrChefClient", props: { mode: "compass" } });
  });

  it("scenario 없이 온 기존 모드 링크(?mode=sprout|compass)는 이전 체험 그대로 열린다 — 의미를 조용히 바꾸지 않는다", () => {
    expect(render({ mode: "sprout" })).toMatchObject({ name: "XrChefClient", props: { mode: "sprout" } });
    expect(render({ mode: "compass" })).toMatchObject({ name: "XrChefClient", props: { mode: "compass" } });
  });

  it("알 수 없는 mode·scenario 값(대소문자·배열·빈 값·다른 이름)은 모드가 아니므로 기본(볶음밥)으로 간다", () => {
    for (const scenario of ["Fried-Rice", "fried_rice", "", "other", ["fried-rice"], ["fried-rice", "x"], "Classic"]) {
      expect(render({ scenario }).name, JSON.stringify(scenario)).toBe("XrChefFriedRiceClient");
    }
    for (const mode of ["Sprout", "", "other", ["sprout"]]) {
      expect(render({ mode }).name, JSON.stringify(mode)).toBe("XrChefFriedRiceClient");
    }
    // scenario가 알 수 없는 값이어도 유효한 모드 링크는 그 모드의 이전 체험
    expect(render({ scenario: "other", mode: "sprout" })).toMatchObject({ name: "XrChefClient", props: { mode: "sprout" } });
  });
});
