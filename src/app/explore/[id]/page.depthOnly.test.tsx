import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import OccupationDetailPage from "./page";

// G2.2-R1-R: depth-only 렌더 분기(3차 폴백 — DB/OCCUPATIONS 둘 다 없지만
// OCCUPATION_DEPTH_SEED에는 있는 직업)에서 XR 진입 카드가 afterTabsSlot을
// 통해 정확히 1회만 노출되는지 검증한다.
//
// [이 분기를 "강제로" 재현하는 이유]
// 실제 운영 데이터 기준으로 "veterinarian"은 src/data/occupations.ts에
// 정적 데이터가 이미 존재해, DB에도 없는 상태라면 depth-only가 아니라
// static 분기로 빠진다(= depth-only는 veterinarian 기준으로는 현재
// 도달 불가능한 경로). 이 파일은 "OCCUPATIONS에 veterinarian이 없는
// 상태에서도 depth-only의 afterTabsSlot이 카드를 올바르게 배선하는가"를
// 방어적으로 검증하기 위해, 이 파일 안에서만 OCCUPATIONS를 빈 배열로
// mock한다 — 실제 데이터를 변경하는 것이 아니라 이 테스트 파일의
// 모듈 그래프 안에서만 유효한 격리된 mock이다(page.test.tsx의 static
// 분기 테스트는 실제 OCCUPATIONS 데이터를 그대로 사용한다).
vi.mock("@/data/occupations", () => ({ OCCUPATIONS: [] }));

const { supabaseState } = vi.hoisted(() => ({
  supabaseState: { master: null as null | Record<string, unknown> },
}));

function queryBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    in: () => builder,
    order: () => builder,
    maybeSingle: () => Promise.resolve(result),
    then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    // OCCUPATIONS도 비어 있으므로 depth-only 분기에서는 master 조회 1회 외에
    // 다른 occupation_* 테이블 조회가 일어나지 않는다 — 항상 null/빈 응답.
    from: () => queryBuilder({ data: supabaseState.master, error: null }),
  },
}));

vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));

const { paramsState } = vi.hoisted(() => ({ paramsState: { id: "veterinarian" } }));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: paramsState.id }),
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  supabaseState.master = null;
});

describe("OccupationDetailPage — depth-only 분기의 XR 진입 카드", () => {
  it("1. gate ON + veterinarian이 depth-only로 폴백되면 afterTabsSlot에서 수의사 XR 카드가 정확히 1회 노출된다", async () => {
    vi.stubEnv("NEXT_PUBLIC_XR_VETERINARIAN_ENABLED", "true");
    paramsState.id = "veterinarian"; // OCCUPATION_DEPTH_SEED에 실제 존재(occupationDepthSeed.ts)

    render(<OccupationDetailPage />);

    expect(await screen.findByText("수의사 XR 체험")).toBeInTheDocument();
    expect(screen.getAllByText("수의사 XR 체험")).toHaveLength(1);
    expect(screen.queryByText("요리사 XR 체험")).not.toBeInTheDocument();
  });

  it("2. 회귀 없음 — chef가 depth-only로 폴백되면 요리사 XR 카드가 그대로 1회 노출되고 수의사 카드는 섞이지 않는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_XR_CHEF_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_XR_VETERINARIAN_ENABLED", "true");
    paramsState.id = "chef"; // OCCUPATION_DEPTH_SEED에 실제 존재(occupationDepthSeed.ts)

    render(<OccupationDetailPage />);

    expect(await screen.findByText("요리사 XR 체험")).toBeInTheDocument();
    expect(screen.getAllByText("요리사 XR 체험")).toHaveLength(1);
    expect(screen.queryByText("수의사 XR 체험")).not.toBeInTheDocument();
  });

  it("3. 두 게이트 모두 OFF면 depth-only 분기에서 두 카드 모두 노출되지 않는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_XR_CHEF_ENABLED", "");
    vi.stubEnv("NEXT_PUBLIC_XR_VETERINARIAN_ENABLED", "");
    paramsState.id = "veterinarian";

    render(<OccupationDetailPage />);

    // depth-only 화면의 직업명 히어로가 뜰 때까지 대기 — 로딩 종료 보장
    await screen.findByRole("heading", { level: 2, name: "수의사" });
    expect(screen.queryByText("수의사 XR 체험")).not.toBeInTheDocument();
    expect(screen.queryByText("요리사 XR 체험")).not.toBeInTheDocument();
  });
});
