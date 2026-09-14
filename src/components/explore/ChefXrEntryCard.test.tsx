import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ChefXrEntryCard from "./ChefXrEntryCard";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("ChefXrEntryCard", () => {
  it("게이트 ON + occupationId=chef면 카드와 두 모드 버튼을 정확한 href로 렌더한다", () => {
    vi.stubEnv("NEXT_PUBLIC_XR_CHEF_ENABLED", "true");

    render(<ChefXrEntryCard occupationId="chef" />);

    expect(screen.getByText("요리사 XR 체험")).toBeInTheDocument();

    const sproutLink = screen.getByRole("link", { name: "새싹 모드 체험하기" });
    expect(sproutLink).toHaveAttribute("href", "/xr/chef?mode=sprout");

    const compassLink = screen.getByRole("link", { name: "나침반 모드 체험하기" });
    expect(compassLink).toHaveAttribute("href", "/xr/chef?mode=compass");
  });

  it("게이트가 꺼져 있으면(unset) 카드를 렌더하지 않는다", () => {
    vi.stubEnv("NEXT_PUBLIC_XR_CHEF_ENABLED", "");

    const { container } = render(<ChefXrEntryCard occupationId="chef" />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("요리사 XR 체험")).not.toBeInTheDocument();
  });

  it("게이트가 false면 카드를 렌더하지 않는다", () => {
    vi.stubEnv("NEXT_PUBLIC_XR_CHEF_ENABLED", "false");

    const { container } = render(<ChefXrEntryCard occupationId="chef" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("게이트가 ON이어도 occupationId가 chef가 아니면 카드를 렌더하지 않는다", () => {
    vi.stubEnv("NEXT_PUBLIC_XR_CHEF_ENABLED", "true");

    const { container } = render(<ChefXrEntryCard occupationId="doctor" />);

    expect(container).toBeEmptyDOMElement();
  });
});
