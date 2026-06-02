// ====================================================
// 명따라 결과 → "함께 살펴볼 직업" 정적 매핑
//
// [목적]
//   명따라(사주·만세력) 결과를 직업 단정이 아니라 "성향 참고 → 함께 탐색해볼 직업"으로
//   연결한다. 오행 주기운(dominant: 목/화/토/금/수)을 성향 그룹으로 매핑하고,
//   각 그룹에 실제 존재하는 직업(OCCUPATIONS.id)만 연결한다.
//
// [원칙]
//   - AI 호출 없음 (정적 매핑)
//   - "사주에 맞는 직업" / "타고난 직업" 같은 단정 표현 금지
//   - 존재하지 않는 직업 id는 렌더링 단계에서 필터링
//   - /explore/[id] (= OCCUPATIONS.id / legacy_occupation_id)로 연결
// ====================================================

import { OCCUPATIONS } from "@/data/occupations";

export interface CareerLinkCard {
  id:          string; // /explore/[id]
  name:        string;
  emoji:       string;
  description: string;
  reason:      string; // 성향 연결 이유 (그룹 공통, 단정 아님)
}

interface DominantGroup {
  traitLabel: string;   // 성향 라벨 (예: "탐구·분석 성향")
  reason:     string;   // 연결 이유 문구
  ids:        string[]; // OCCUPATIONS.id 기준 (존재하는 것만 렌더)
}

// 오행 주기운(한글 한 글자) → 성향 그룹 매핑
// ⚠️ ids는 모두 src/data/occupations.ts 에 실재하는 id. 렌더 시 한 번 더 검증한다.
const DOMINANT_GROUPS: Record<string, DominantGroup> = {
  목: {
    traitLabel: "소통·성장 성향",
    reason:     "사람과 어울리고 돕거나 가르치는 걸 좋아하는 모습이 보일 때 함께 살펴보기 좋아요.",
    ids:        ["teacher", "counselor", "social-worker"],
  },
  화: {
    traitLabel: "표현·창의 성향",
    reason:     "표현하고 만드는 걸 즐기는 모습이 보일 때 함께 탐색해볼 수 있어요.",
    ids:        ["pd-director", "graphic-designer", "writer"],
  },
  토: {
    traitLabel: "안정·신뢰 성향",
    reason:     "꾸준하고 차분하게 해내는 강점이 보일 때 함께 살펴보기 좋아요.",
    ids:        ["financial-analyst", "pharmacist", "nutritionist"],
  },
  금: {
    traitLabel: "실행·추진 성향",
    reason:     "목표를 향해 추진하고 이끄는 모습이 보일 때 함께 탐색해볼 수 있어요.",
    ids:        ["entrepreneur", "marketer", "police-officer"],
  },
  수: {
    traitLabel: "탐구·분석 성향",
    reason:     "관찰하고 깊이 파고드는 탐구 성향이 보일 때 함께 살펴보기 좋아요.",
    ids:        ["data-analyst", "bio-researcher", "software-engineer"],
  },
};

// 성향 분류가 어려울 때 안전 fallback (대표 직업 3개, 모두 실재 id)
const FALLBACK_IDS    = ["teacher", "data-analyst", "graphic-designer"];
const FALLBACK_REASON = "다양한 직업을 가볍게 살펴보며 아이가 흥미를 보이는 방향을 함께 찾아보세요.";

const MAX_CARDS = 3;

export interface MyeonddaraCareerLinks {
  traitLabel: string | null; // fallback이면 null
  cards:      CareerLinkCard[];
  isFallback: boolean;
}

/**
 * 오행 주기운(dominant)으로 함께 살펴볼 직업 카드를 반환한다.
 * 매칭되는 그룹이 없으면 안전 fallback을 제공한다.
 * 존재하지 않는 occupation id는 자동으로 제외된다.
 */
export function getMyeonddaraCareerLinks(
  dominant: string | null | undefined
): MyeonddaraCareerLinks {
  const group  = dominant ? DOMINANT_GROUPS[dominant.trim()] : undefined;
  const ids    = group?.ids ?? FALLBACK_IDS;
  const reason = group?.reason ?? FALLBACK_REASON;

  const cards = ids
    .map((id) => {
      const occ = OCCUPATIONS.find((o) => o.id === id);
      if (!occ) return null; // 존재하지 않는 직업은 렌더링하지 않음
      return {
        id:          occ.id,
        name:        occ.name,
        emoji:       occ.emoji,
        description: occ.description,
        reason,
      } satisfies CareerLinkCard;
    })
    .filter((c): c is CareerLinkCard => c !== null)
    .slice(0, MAX_CARDS);

  return {
    traitLabel: group?.traitLabel ?? null,
    cards,
    isFallback: !group,
  };
}
