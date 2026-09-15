import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import VetXrEntryCard from "./VetXrEntryCard";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("VetXrEntryCard", () => {
  it("게이트 ON + occupationId=veterinarian이면 카드와 두 모드 버튼을 정확한 href로 렌더한다", () => {
    vi.stubEnv("NEXT_PUBLIC_XR_VETERINARIAN_ENABLED", "true");

    render(<VetXrEntryCard occupationId="veterinarian" />);

    expect(screen.getByText("수의사 XR 체험")).toBeInTheDocument();

    const sproutLink = screen.getByRole("link", { name: /새싹 모드 체험하기/ });
    expect(sproutLink).toHaveAttribute("href", "/xr/vet?mode=sprout");

    const compassLink = screen.getByRole("link", { name: /나침반 모드 체험하기/ });
    expect(compassLink).toHaveAttribute("href", "/xr/vet?mode=compass");
  });

  it("학년별 안내 문구와 모드별 추천 학년이 함께 노출된다", () => {
    vi.stubEnv("NEXT_PUBLIC_XR_VETERINARIAN_ENABLED", "true");

    render(<VetXrEntryCard occupationId="veterinarian" />);

    expect(screen.getByText("우리 아이 학년에 맞는 체험을 선택해 주세요.")).toBeInTheDocument();
    expect(screen.getByText("초등 3~4학년 추천")).toBeInTheDocument();
    expect(screen.getByText("초등 5학년~중1 추천")).toBeInTheDocument();
    // 두 모드 모두 계속 노출된다 — 하나를 숨기거나 기본값으로 강제하지 않는다
    expect(screen.getByRole("link", { name: /새싹 모드 체험하기/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /나침반 모드 체험하기/ })).toBeInTheDocument();
  });

  it("게이트가 꺼져 있으면(unset) 카드를 렌더하지 않는다", () => {
    vi.stubEnv("NEXT_PUBLIC_XR_VETERINARIAN_ENABLED", "");

    const { container } = render(<VetXrEntryCard occupationId="veterinarian" />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("수의사 XR 체험")).not.toBeInTheDocument();
  });

  it("게이트가 false면 카드를 렌더하지 않는다", () => {
    vi.stubEnv("NEXT_PUBLIC_XR_VETERINARIAN_ENABLED", "false");

    const { container } = render(<VetXrEntryCard occupationId="veterinarian" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("게이트가 ON이어도 occupationId가 veterinarian이 아니면 카드를 렌더하지 않는다", () => {
    vi.stubEnv("NEXT_PUBLIC_XR_VETERINARIAN_ENABLED", "true");

    const { container } = render(<VetXrEntryCard occupationId="chef" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("요리사 게이트만 켜져도(수의사 게이트 OFF) 카드를 렌더하지 않는다 — 게이트 상호 독립", () => {
    vi.stubEnv("NEXT_PUBLIC_XR_CHEF_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_XR_VETERINARIAN_ENABLED", "");

    const { container } = render(<VetXrEntryCard occupationId="veterinarian" />);

    expect(container).toBeEmptyDOMElement();
  });
});
