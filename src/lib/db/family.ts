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
//   - active child 선택: localStorage → parent.selected_child_id 컬럼으로 마이그레이션 예정
//   - plan entitlement: PLAN_ENTITLEMENTS → DB child_limit override
// ====================================================

import { supabase } from "@/lib/supabase";
import type { Child } from "@/types/family";
import { PLAN_ENTITLEMENTS } from "@/types/family";

// ──────────────────────────────────────────────────────────────
// Active Child — localStorage 유틸
//
// [현재 MVP]
//   자녀 1명 기준이므로 사실상 항상 첫 번째 child를 반환.
//   값이 없으면 getFirstActiveChild() fallback으로 동작.
//
// [family / family_plus 플랜 오픈 시]
//   parent/home의 자녀 카드 클릭 → setActiveChildId() 호출
//   report / roadmap / myeonddara 에서 getActiveChildId() 읽어서 child 기준 전환
//
// [로그아웃 시]
//   clearActiveChildId() 반드시 호출 — settings/page.tsx handleLogout 참고
// ──────────────────────────────────────────────────────────────

/** localStorage 저장 키 — 변경 시 이 상수 한 곳만 수정 */
export const ACTIVE_CHILD_STORAGE_KEY = "kkumddara_active_child_id";

/** 현재 선택된 active child ID를 반환. 없으면 null. */
export function getActiveChildId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_CHILD_STORAGE_KEY);
}

/** active child ID를 저장. parent/home 자녀 카드 선택 시 호출. */
export function setActiveChildId(childId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_CHILD_STORAGE_KEY, childId);
}

/** active child ID 삭제. 로그아웃 시 반드시 호출. */
export function clearActiveChildId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_CHILD_STORAGE_KEY);
}

// ──────────────────────────────────────────────────────────────
// Plan entitlement 기준
// DB의 subscription_plan.child_limit이 최종 source of truth.
// PLAN_ENTITLEMENTS는 클라이언트 측 조기 검증 및 UI 잠금용 fallback.
// → 요금제 정책 변경 시 src/types/family.ts의 PLAN_ENTITLEMENTS만 수정.
// ──────────────────────────────────────────────────────────────

/** DB에 plan이 없을 경우 적용할 안전 기본값 (베이직 기준) */
const DEFAULT_CHILD_LIMIT = PLAN_ENTITLEMENTS.basic.maxChildren;

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
//    - plan_name이 "family" / "family_plus"로 업그레이드되면
//      DB의 child_limit 컬럼이 자동으로 반영됨 (별도 코드 수정 불필요)
//    - 클라이언트 fallback은 PLAN_ENTITLEMENTS.basic.maxChildren (=1)
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
