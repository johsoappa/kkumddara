import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import OccupationDetailPage from "./page";

// G2.2-R1-R: 수의사(Vet) XR 진입 카드가 DB/static 렌더 분기에서 정확히 1회만
// 노출되는지, 다른 직업/게이트 OFF에서는 노출되지 않는지, 기존 요리사(Chef)
// XR 카드에 회귀가 없는지를 page.tsx 실제 렌더 경로로 검증한다.
//
// [이 파일이 검증하지 않는 것]
// - depth-only 분기(page.depthOnly.test.tsx가 별도로 담당) — "veterinarian"은
//   src/data/occupations.ts에 정적 데이터가 이미 존재해 실제로는 static 분기로
//   빠지므로, 이 파일에서는 depth-only를 재현하지 않는다(허위로 도달 가능한
//   척 만들지 않음).
// - VetXrEntryCard/ChefXrEntryCard 자체의 게이트·occupationId 판정 전체 매트릭스
//   (VetXrEntryCard.test.tsx / ChefXrEntryCard.test.tsx가 컴포넌트 단위로 이미
//   전수 검증한다) — 여기서는 "page.tsx가 각 분기에 카드를 올바르게 배선했는가"
//   만 회귀 대상으로 삼는다.

const { supabaseState, occupationMasterCallCount } = vi.hoisted(() => ({
  supabaseState: {
    master: null as null | {
      id: string;
      slug: string;
      name_ko: string;
      emoji: string;
      category: string;
      interest_fields: string[];
    },
  },
  occupationMasterCallCount: { count: 0 },
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
    from: (table: string) => {
      if (table === "occupation_master") {
        occupationMasterCallCount.count += 1;
        // 1번째 호출 = 상세 master 조회(maybeSingle), 2번째 이후 = 관련 직업
        // 더보기 조회(배열 awaited) — 같은 테이블이라 호출 순서로 구분한다.
        if (occupationMasterCallCount.count === 1) {
          return queryBuilder({ data: supabaseState.master, error: null });
        }
        return queryBuilder({ data: [], error: null });
      }
      if (table === "occupation_summary") return queryBuilder({ data: [], error: null });
      if (table === "occupation_preparations") return queryBuilder({ data: [], error: null });
      if (table === "occupation_goyo24_profile") return queryBuilder({ data: null, error: null });
      return queryBuilder({ data: null, error: null });
    },
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
  occupationMasterCallCount.count = 0;
  paramsState.id = "veterinarian";
});

describe("OccupationDetailPage — DB 분기의 수의사 XR 카드", () => {
  it("1. gate ON + DB에 veterinarian master가 있으면 수의사 XR 카드가 정확히 1회 노출된다", async () => {
    vi.stubEnv("NEXT_PUBLIC_XR_VETERINARIAN_ENABLED", "true");
    supabaseState.master = {
      id: "occ-vet-1",
      slug: "veterinarian",
      name_ko: "수의사",
      emoji: "🐾",
      category: "의료·과학",
      interest_fields: [],
    };

    render(<OccupationDetailPage />);

    expect(await screen.findByText("수의사 XR 체험")).toBeInTheDocument();
    expect(screen.getAllByText("수의사 XR 체험")).toHaveLength(1);
    expect(screen.queryByText("요리사 XR 체험")).not.toBeInTheDocument();
  });

  it("2. gate OFF면 DB 분기에서도 수의사 XR 카드가 노출되지 않는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_XR_VETERINARIAN_ENABLED", "");
    supabaseState.master = {
      id: "occ-vet-1",
      slug: "veterinarian",
      name_ko: "수의사",
      emoji: "🐾",
      category: "의료·과학",
      interest_fields: [],
    };

    render(<OccupationDetailPage />);

    // 헤더 h1("직업 상세")은 loading 상태를 벗어난 모든 분기(db/static/
    // depth-only)에서 공통으로 렌더된다 — summaries가 비어 있어도 항상
    // 존재하므로 "로딩 종료"를 판별하는 안정적인 시그널로 쓴다.
    await screen.findByText("직업 상세");
    expect(screen.queryByText("수의사 XR 체험")).not.toBeInTheDocument();
  });

  it("3. gate ON이어도 다른 직업(id≠veterinarian)에서는 수의사 XR 카드가 노출되지 않는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_XR_VETERINARIAN_ENABLED", "true");
    paramsState.id = "doctor";
    supabaseState.master = {
      id: "occ-doctor-1",
      slug: "doctor",
      name_ko: "의사",
      emoji: "🩺",
      category: "의료·과학",
      interest_fields: [],
    };

    render(<OccupationDetailPage />);

    await screen.findByText("직업 상세");
    expect(screen.queryByText("수의사 XR 체험")).not.toBeInTheDocument();
  });

  it("4. 회귀 없음 — chef가 DB 분기를 타도 요리사 XR 카드는 그대로 노출되고 수의사 카드는 섞이지 않는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_XR_CHEF_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_XR_VETERINARIAN_ENABLED", "true");
    paramsState.id = "chef";
    supabaseState.master = {
      id: "occ-chef-1",
      slug: "chef",
      name_ko: "요리사",
      emoji: "👨‍🍳",
      category: "요식업",
      interest_fields: [],
    };

    render(<OccupationDetailPage />);

    expect(await screen.findByText("요리사 XR 체험")).toBeInTheDocument();
    expect(screen.getAllByText("요리사 XR 체험")).toHaveLength(1);
    expect(screen.queryByText("수의사 XR 체험")).not.toBeInTheDocument();

    const sproutLink = screen.getByRole("link", { name: /새싹 모드 체험하기/ });
    expect(sproutLink).toHaveAttribute("href", "/xr/chef?mode=sprout");
    const compassLink = screen.getByRole("link", { name: /나침반 모드 체험하기/ });
    expect(compassLink).toHaveAttribute("href", "/xr/chef?mode=compass");
  });
});

describe("OccupationDetailPage — static 분기의 수의사 XR 카드", () => {
  it("5. gate ON + DB에 master가 없고(null) 정적 데이터(OCCUPATIONS)에 veterinarian이 있으면 static 분기에서 카드가 정확히 1회 노출된다", async () => {
    vi.stubEnv("NEXT_PUBLIC_XR_VETERINARIAN_ENABLED", "true");
    supabaseState.master = null; // DB 미등록 → static 폴백(OCCUPATIONS의 실제 veterinarian 데이터 사용)

    render(<OccupationDetailPage />);

    expect(await screen.findByText("수의사 XR 체험")).toBeInTheDocument();
    expect(screen.getAllByText("수의사 XR 체험")).toHaveLength(1);
    expect(screen.queryByText("요리사 XR 체험")).not.toBeInTheDocument();
  });

  it("6. static 분기에서도 gate OFF면 카드가 노출되지 않는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_XR_VETERINARIAN_ENABLED", "");
    supabaseState.master = null;

    render(<OccupationDetailPage />);

    await screen.findByText("직업 소개");
    expect(screen.queryByText("수의사 XR 체험")).not.toBeInTheDocument();
  });
});
