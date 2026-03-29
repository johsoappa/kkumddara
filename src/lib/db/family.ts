// ====================================================
// 꿈따라 — 가족 DB 쿼리 함수 스텁
//
// [현재 상태] 더미 데이터를 반환하는 껍데기 함수
// [연동 방법] 각 함수 본문의 TODO 주석을 Supabase 코드로 교체
//
// 연동 순서:
// 1. npm install @supabase/supabase-js
// 2. src/lib/supabase.ts 생성 (클라이언트 초기화)
// 3. 이 파일의 TODO 주석을 실제 쿼리로 교체
// 4. 더미 import 제거
// ====================================================

import type {
  Family,
  FamilyMember,
  FamilySettings,
  Child,
  ChildWithFamily,
  Invitation,
  FamilyRole,
} from "@/types/family";

import {
  DUMMY_FAMILY,
  DUMMY_FAMILY_MEMBERS,
  DUMMY_FAMILY_SETTINGS,
  DUMMY_CHILDREN,
  DUMMY_CHILDREN_WITH_FAMILY,
  findInvitationByCode,
} from "@/lib/dummy/family";

import { supabase } from "@/lib/supabase";

// ============================================================
// 가족 그룹 조회 / 생성
// ============================================================

/**
 * 현재 유저의 가족 그룹 조회 (더미 — 레거시 호환용)
 */
export async function getMyFamily(userId: string): Promise<Family | null> {
  console.log("[더미] getMyFamily:", userId);
  return DUMMY_FAMILY;
}

/**
 * 유저의 가족 그룹 조회 — 없으면 자동 생성
 * 온보딩 최초 저장 시 호출
 */
export async function getOrCreateFamily(userId: string): Promise<Family | null> {
  // 1. 기존 가족 조회
  const { data: existing, error: fetchErr } = await supabase
    .from("families")
    .select("*")
    .eq("main_user_id", userId)
    .maybeSingle();

  if (fetchErr) {
    console.error("[getOrCreateFamily] 조회 실패:", fetchErr.message);
  }

  if (existing) return existing as unknown as Family;

  // 2. 없으면 신규 생성
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: created, error: insertErr } = await (supabase as any)
    .from("families")
    .insert({ main_user_id: userId })
    .select()
    .single();

  if (insertErr) {
    console.error("[getOrCreateFamily] 생성 실패:", insertErr.message);
    return null;
  }
  return created as unknown as Family;
}

// ============================================================
// 가족 구성원 조회
// ============================================================

/**
 * 가족 구성원 목록 조회
 * [주의] 상대방 개인정보(email 등)는 조회하지 않음
 * display_name, avatar_url만 조회 (RLS 정책으로 강제)
 *
 * TODO (Supabase 연동):
 * const { data } = await supabase
 *   .from('family_members')
 *   .select(`
 *     *,
 *     users:user_id (display_name, avatar_url)
 *   `)
 *   .eq('family_id', familyId)
 *   .eq('status', 'accepted');
 */
export async function getFamilyMembers(
  familyId: string
): Promise<FamilyMember[]> {
  console.log("[더미] getFamilyMembers:", familyId);
  return DUMMY_FAMILY_MEMBERS;
}

/**
 * 현재 유저의 가족 내 역할 조회
 *
 * TODO (Supabase 연동):
 * const { data } = await supabase
 *   .from('family_members')
 *   .select('role')
 *   .eq('family_id', familyId)
 *   .eq('user_id', userId)
 *   .single();
 * return data?.role ?? null;
 */
export async function getMyRole(
  familyId: string,
  userId: string
): Promise<FamilyRole | null> {
  console.log("[더미] getMyRole:", familyId, userId);
  // 더미: user-main-001 → main, 나머지 → co-parent
  return userId === "user-main-001" ? "main" : "co-parent";
}

// ============================================================
// 자녀 프로필
// ============================================================

/**
 * 가족의 자녀 프로필 목록 조회
 *
 * TODO (Supabase 연동):
 * const { data } = await supabase
 *   .from('children')
 *   .select('*')
 *   .eq('family_id', familyId)
 *   .order('created_at', { ascending: true });
 */
export async function getChildren(familyId: string): Promise<Child[]> {
  console.log("[더미] getChildren:", familyId);
  return DUMMY_CHILDREN;
}

/**
 * 자녀 + 가족 복합 정보 조회 (홈/리포트 화면용)
 *
 * TODO (Supabase 연동):
 * 위 getChildren + getMyRole 결과를 조합
 */
export async function getChildrenWithFamily(
  familyId: string,
  _userId: string
): Promise<ChildWithFamily[]> {
  console.log("[더미] getChildrenWithFamily:", familyId);
  return DUMMY_CHILDREN_WITH_FAMILY;
}

/**
 * 자녀 프로필 생성 — 실제 Supabase INSERT
 * 온보딩 최초 저장 시 호출
 */
export async function createChild(
  familyId: string,
  userId: string,
  childData: {
    name: string;
    grade: Child["grade"];
    interests?: string[];
    avatar_emoji?: string;
  }
): Promise<Child | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("children")
    .insert({
      family_id:    familyId,
      created_by:   userId,
      name:         childData.name,
      grade:        childData.grade,
      interests:    childData.interests ?? [],
      avatar_emoji: childData.avatar_emoji ?? "🌱",
    })
    .select()
    .single();

  if (error) {
    console.error("[createChild] 오류:", error.message);
    return null;
  }
  return data as Child;
}

/**
 * 자녀 프로필 단건 조회
 * isEdit 온보딩 저장 시 호출
 */
export async function getChild(childId: string): Promise<Child | null> {
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("id", childId)
    .single();

  if (error) {
    console.error("[getChild] 오류:", error.message);
    return null;
  }
  return data as Child;
}

/**
 * 자녀 프로필 업데이트 (grade + interests 포함)
 *
 * 사용 예시:
 * await updateChild(childId, { grade: "elementary4", interests: ["it", "art"] });
 */
export async function updateChild(
  childId: string,
  updates: Partial<Pick<Child, "name" | "grade" | "interests" | "avatar_emoji">>
): Promise<Child | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("children")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", childId)
    .select()
    .single();

  if (error) {
    console.error("[updateChild] 오류:", error.message);
    return null;
  }
  return data as Child;
}

/**
 * 자녀 관심분야 조회
 * children.interests 컬럼(string[])을 읽어 반환
 *
 * ※ 현재 스키마에 child_interests 별도 테이블이 없어
 *    children.interests 배열 컬럼으로 관리합니다.
 */
export async function getChildInterests(childId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("children")
    .select("interests")
    .eq("id", childId)
    .single();

  if (error) {
    console.error("[getChildInterests] 오류:", error.message);
    return [];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any)?.interests ?? [];
}

/**
 * 자녀 관심분야 전체 교체
 * 기존 값을 덮어쓰고 새 배열로 저장
 *
 * ※ child_interests 별도 테이블 대신
 *    children.interests 배열 컬럼을 UPDATE합니다.
 */
export async function updateChildInterests(
  childId: string,
  interests: string[]
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("children")
    .update({ interests, updated_at: new Date().toISOString() })
    .eq("id", childId);

  if (error) {
    console.error("[updateChildInterests] 오류:", error.message);
    return false;
  }
  return true;
}

// ============================================================
// 초대 기능
// ============================================================

/**
 * 공동 양육자 초대 발송 (메인 계정만 가능)
 * 초대 코드 생성 → DB 저장 → 이메일 발송
 *
 * TODO (Supabase 연동):
 * 1. 권한 확인 (role === "main")
 * 2. 현재 co-parent 수 확인 (최대 1명)
 *    → SELECT count(*) FROM family_members
 *       WHERE family_id = ? AND role = 'co-parent' AND status = 'accepted'
 * 3. 초대 코드 생성 (nanoid 또는 UUID 앞 8자리)
 * 4. invitations 테이블에 insert
 * 5. Supabase Edge Function으로 초대 이메일 발송
 *    → supabase.functions.invoke('send-invite-email', { body: { email, inviteCode } })
 *
 * [확인 포인트] 이메일 발송은 Supabase Edge Function + Resend/SendGrid 필요
 */
export async function inviteCoParent(
  familyId: string,
  invitedBy: string,
  invitedEmail: string
): Promise<{ inviteCode: string; expiresAt: string }> {
  console.log("[더미] inviteCoParent:", familyId, invitedBy, invitedEmail);

  const inviteCode = `KKUM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return { inviteCode, expiresAt };
}

/**
 * 초대 코드 유효성 검사 + 수락
 * 공동 양육자가 초대 링크 클릭 시 호출
 *
 * TODO (Supabase 연동):
 * 1. invitations 테이블에서 code 조회 (status=pending, expires_at > now)
 * 2. family_members에 co-parent로 insert
 * 3. invitations.status를 'accepted'로 update
 */
export async function acceptInvitation(
  inviteCode: string,
  userId: string
): Promise<{ success: boolean; familyId?: string; error?: string }> {
  console.log("[더미] acceptInvitation:", inviteCode, userId);

  const invitation = findInvitationByCode(inviteCode);

  if (!invitation) {
    return { success: false, error: "유효하지 않거나 만료된 초대 코드입니다." };
  }

  return { success: true, familyId: invitation.family_id };
}

// ============================================================
// 가족 설정 페이지 통합 조회
// ============================================================

/**
 * 가족 설정 페이지에 필요한 모든 정보 한 번에 조회
 *
 * TODO (Supabase 연동):
 * const { data } = await supabase
 *   .from('families')
 *   .select(`
 *     *,
 *     family_members (
 *       *,
 *       users:user_id (display_name, avatar_url)
 *     ),
 *     children (*),
 *     invitations (*)
 *   `)
 *   .eq('id', familyId)
 *   .single();
 */
export async function getFamilySettings(
  familyId: string
): Promise<FamilySettings | null> {
  console.log("[더미] getFamilySettings:", familyId);
  return DUMMY_FAMILY_SETTINGS;
}
