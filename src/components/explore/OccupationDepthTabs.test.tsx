import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OccupationDepthTabs, { type DepthTab } from "./OccupationDepthTabs";

// G2.1-R1-F15-R — afterTabsSlot: 탭 패널과 "다음 미션" 카드 사이에 끼워 넣는
// 선택적 콘텐츠 슬롯. 요리사 legacy/fallback 상세(depth-only 렌더)에서
// ChefXrEntryCard를 정확히 이 위치에 노출하기 위해 추가했다. 이 prop을
// 넘기지 않는 기존 호출부(다른 모든 직업 상세)는 출력이 전혀 바뀌지 않아야
// 한다 — 그것이 이 테스트의 핵심 회귀 기준이다.

const TABS: [DepthTab, DepthTab, DepthTab, DepthTab] = [
  { id: "do", label: "하는 일", panel: <p>하는 일 본문</p> },
  { id: "power", label: "필요한 힘", panel: <p>필요한 힘 본문</p> },
  { id: "day", label: "하루 모습", panel: <p>하루 모습 본문</p> },
  { id: "try", label: "해보기", panel: <p>해보기 본문</p> },
];

describe("OccupationDepthTabs — afterTabsSlot", () => {
  it("afterTabsSlot을 넘기면 탭 패널 다음, '다음 미션' 카드 이전에 렌더된다", () => {
    render(
      <OccupationDepthTabs
        occupationId="chef"
        occupationName="요리사"
        tabs={TABS}
        nextMission="다음 미션 문구"
        parentQuestions={[]}
        afterTabsSlot={<div data-testid="xr-slot">XR 카드</div>}
      />,
    );

    const panel = screen.getByRole("tabpanel");
    const slot = screen.getByTestId("xr-slot");
    const mission = screen.getByText("🎯 다음 미션");

    // DOM 순서: 탭 패널 → 슬롯 → 다음 미션 카드
    expect(
      panel.compareDocumentPosition(slot) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      slot.compareDocumentPosition(mission) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("afterTabsSlot을 넘기지 않으면(기존 호출부) 추가 콘텐츠 없이 기존과 동일하게 렌더된다", () => {
    const { container } = render(
      <OccupationDepthTabs
        occupationId="webtoon-artist"
        occupationName="웹툰 작가"
        tabs={TABS}
        nextMission="다음 미션 문구"
        parentQuestions={["질문1"]}
      />,
    );

    expect(container.querySelector('[data-testid="xr-slot"]')).toBeNull();
    expect(screen.getByText("🎯 다음 미션")).toBeInTheDocument();
    expect(screen.getByText("💬 부모 대화 질문")).toBeInTheDocument();
  });

  it("afterTabsSlot이 null/false/undefined면 아무것도 추가되지 않는다", () => {
    const { container } = render(
      <OccupationDepthTabs
        occupationId="chef"
        occupationName="요리사"
        tabs={TABS}
        nextMission="다음 미션 문구"
        parentQuestions={[]}
        afterTabsSlot={null}
      />,
    );
    expect(container.querySelector('[data-testid="xr-slot"]')).toBeNull();
  });

  it("탭 전환 등 기존 동작은 afterTabsSlot 존재 여부와 무관하게 그대로 동작한다", () => {
    render(
      <OccupationDepthTabs
        occupationId="chef"
        occupationName="요리사"
        tabs={TABS}
        nextMission=""
        parentQuestions={[]}
        afterTabsSlot={<div data-testid="xr-slot">XR 카드</div>}
      />,
    );

    expect(screen.getByText("하는 일 본문")).toBeInTheDocument();
    expect(screen.queryByText("필요한 힘 본문")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "필요한 힘" }));

    expect(screen.getByText("필요한 힘 본문")).toBeInTheDocument();
    expect(screen.queryByText("하는 일 본문")).not.toBeInTheDocument();
    // nextMission이 빈 문자열이면 다음 미션 카드는 여전히 미노출(기존 규칙 유지)
    expect(screen.queryByText("🎯 다음 미션")).not.toBeInTheDocument();
  });
});
