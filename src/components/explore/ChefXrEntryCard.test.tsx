import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ChefXrEntryCard from "./ChefXrEntryCard";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("ChefXrEntryCard", () => {
  it("게이트 ON + occupationId=chef면 카드와 새 볶음밥 체험 링크 하나를 렌더한다", () => {
    vi.stubEnv("NEXT_PUBLIC_XR_CHEF_ENABLED", "true");

    render(<ChefXrEntryCard occupationId="chef" />);

    expect(screen.getByText("요리사 XR 체험")).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/xr/chef?scenario=fried-rice");
    expect(links[0]).toHaveTextContent("요리사 XR 체험하기");
  });

  it("새 체험이 지원하지 않는 모드(새싹/나침반)와 학년별 모드 안내를 표시하지 않고, 이전 체험 경로도 노출하지 않는다", () => {
    vi.stubEnv("NEXT_PUBLIC_XR_CHEF_ENABLED", "true");

    const { container } = render(<ChefXrEntryCard occupationId="chef" />);

    expect(screen.queryByText(/새싹/)).not.toBeInTheDocument();
    expect(screen.queryByText(/나침반/)).not.toBeInTheDocument();
    expect(screen.queryByText(/학년/)).not.toBeInTheDocument();
    expect(container.querySelector('a[href*="mode="]')).toBeNull();
    expect(container.querySelector('a[href*="classic"]')).toBeNull();
    expect(screen.getByText(/채소 볶음밥/)).toBeInTheDocument();
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
