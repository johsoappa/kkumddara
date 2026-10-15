import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement } from "react";

// 실험 진입(?scenario=fried-rice)이 기존 체험(나침반·새싹)의 진입을 바꾸지 않는지 확인한다.
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

  it("플래그가 꺼져 있으면 시범 진입도 404다(같은 플래그 뒤에 있다)", () => {
    process.env.NEXT_PUBLIC_XR_CHEF_ENABLED = "false";
    expect(() => render({ scenario: "fried-rice" })).toThrow("NEXT_NOT_FOUND");
    expect(() => render()).toThrow("NEXT_NOT_FOUND");
  });

  it("기본 진입은 기존 나침반 체험이다", () => {
    expect(render()).toMatchObject({ name: "XrChefClient", props: { mode: "compass" } });
    expect(render({})).toMatchObject({ name: "XrChefClient", props: { mode: "compass" } });
  });

  it("?mode=sprout는 기존 새싹 체험이다", () => {
    expect(render({ mode: "sprout" })).toMatchObject({ name: "XrChefClient", props: { mode: "sprout" } });
  });

  it("?scenario=fried-rice(정확 일치)만 볶음밥 시범 체험이다", () => {
    expect(render({ scenario: "fried-rice" }).name).toBe("XrChefFriedRiceClient");
    // mode가 같이 와도 시범 체험
    expect(render({ scenario: "fried-rice", mode: "sprout" }).name).toBe("XrChefFriedRiceClient");
  });

  it("그 밖의 scenario 값(대소문자·배열·빈 값·다른 이름)은 기존 체험으로 되돌아간다", () => {
    for (const scenario of ["Fried-Rice", "fried_rice", "", "other", ["fried-rice"], ["fried-rice", "x"]]) {
      expect(render({ scenario }).name, JSON.stringify(scenario)).toBe("XrChefClient");
    }
    expect(render({ scenario: "other", mode: "sprout" })).toMatchObject({
      name: "XrChefClient",
      props: { mode: "sprout" },
    });
  });
});
