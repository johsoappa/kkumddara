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
// 가족 그룹 조회
// ============================================================

/**
 * 현재 유저의 가족 그룹 조회
 *
 * TODO (Supabase 연동):
 * const { data } = await supabase
 *   .from('family_members')
 *   .select('families(*)')
 *   .eq('user_id', userId)
 *   .eq('status', 'accepted')
 *   .single();
 * return data?.families ?? null;
 */
export async function getMyFamily(userId: string): Promise<Family | null> {
  console.log("[더미] getMyFamily:", userId);
  return DUMMY_FAMILY;
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
 * 자녀 프로필 생성 (메인 계정만 가능)
 *
 * TODO (Supabase 연동):
 * 1. getMyRole로 role 확인 → "main"이 아니면 에러
 * 2. const { data } = await supabase
 *      .from('children')
 *      .insert({ family_id, created_by: userId, ...childData })
 *      .select()
 *      .single();
 */
export async function createChild(
  familyId: string,
  userId: string,
  childData: Pick<Child, "name" | "grade" | "interests" | "avatar_emoji">
): Promise<Child> {
  console.log("[더미] createChild:", familyId, userId, childData);
  // 더미: 새 자녀 객체 반환
  return {
    id: `child-${Date.now()}`,
    family_id: familyId,
    created_by: userId,
    ...childData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
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
