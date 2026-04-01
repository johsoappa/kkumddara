// ====================================================
// 꿈따라 — Family / Child DB 헬퍼
//
// [설계 원칙]
//   child는 user 단위가 아니라 parent(=family) 단위로 관리된다.
//   조회·생성·수정 모두 parent_id 기준으로 수행해
//   향후 multi-child / shared-family 확장을 막지 않는다.
//
// [현재 MVP 가정]
//   - parent 1명 → child 1~n명 (plan의 child_limit이 상한)
//   - active child = profile_status = 'active'
//   - 홈/로드맵/리포트는 추후 "selected child" 개념 추가 가능
//
// [향후 확장 포인트]
//   - multi-child 전환: getChildrenByParentId() 활용
//   - active child 선택: selected_child_id 컬럼 추가 예정
//   - plan entitlement: PLAN_MAX_CHILDREN 상수 → DB child_limit으로 override
// ====================================================

import { supabase } from "@/lib/supabase";
import type { Child } from "@/types/family";

// ──────────────────────────────────────────────────────────────
// Plan entitlement 상수
// DB의 subscription_plan.child_limit이 최종 source of truth.
// 이 상수는 클라이언트 측 조기 검증 및 UI 표시용 fallback.
//
// [요금제별 자녀 한도 — 향후 plan_name 확장 시 함께 수정]
//   free:         1명 (무료 체험)
//   basic:        1명 (베이직)
//   pro:          1명 (프리미엄 — MVP 한시적)
// ── 아래는 향후 플랜 추가 시 DB 스키마와 함께 확장 ──────────
//   premium:      1명
//   family:       2명
//   family_plus:  3명+
// ──────────────────────────────────────────────────────────────
export const PLAN_MAX_CHILDREN: Record<string, number> = {
  free:  1,
  basic: 1,
  pro:   1,
} as const;

/** DB에 plan이 없을 경우 적용할 안전 기본값 */
const DEFAULT_CHILD_LIMIT = 1;

// ──────────────────────────────────────────────────────────────
// 1. parent 기준 active children 전체 조회
//    향후 active child 목록 선택 UI, multi-child 리포트 등에 활용
// ──────────────────────────────────────────────────────────────
export async function getChildrenByParentId(parentId: string): Promise<Child[]> {
  const { data, error } = await supabase
    .from("child")
    .select("*")
    .eq("parent_id", parentId)
    .eq("profile_status", "active")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Child[];
}

// ──────────────────────────────────────────────────────────────
// 2. parent의 첫 번째 active child (MVP: 단일 자녀 화면용)
//    향후 "selected_child_id" 컬럼 추가 시 이 함수를 그에 맞게 교체
// ──────────────────────────────────────────────────────────────
export async function getFirstActiveChild(parentId: string): Promise<Child | null> {
  const { data } = await supabase
    .from("child")
    .select("*")
    .eq("parent_id", parentId)
    .eq("profile_status", "active")
    .order("created_at", { ascending: true });

  if (!data || data.length === 0) return null;
  return data[0] as Child;
}

// ──────────────────────────────────────────────────────────────
// 3. plan child_limit 기준 자녀 추가 가능 여부 확인
//    INSERT 전 반드시 호출해 중복/초과 방지
//
//    [확장 포인트]
//    - plan_name이 "family" / "family_plus" 등으로 늘어나면
//      PLAN_MAX_CHILDREN 상수와 DB child_limit 둘 다 갱신
//    - 서버 측 RLS / DB function으로 이중 검증 추가 권장
// ──────────────────────────────────────────────────────────────
export async function canAddChild(parentId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number;
}> {
  const [childrenRes, planRes] = await Promise.all([
    supabase
      .from("child")
      .select("id")
      .eq("parent_id", parentId)
      .eq("profile_status", "active"),
    supabase
      .from("subscription_plan")
      .select("child_limit")
      .eq("parent_id", parentId)
      .maybeSingle(),
  ]);

  const currentCount = childrenRes.data?.length ?? 0;
  // subscription_plan이 없을 경우 안전 기본값 적용
  const limit = planRes.data?.child_limit ?? DEFAULT_CHILD_LIMIT;

  return { allowed: currentCount < limit, currentCount, limit };
}
