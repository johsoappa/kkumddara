"use client";

// ====================================================
// 가족 설정 페이지 (/parent/family)
//
// 기능:
//   - 자녀별 보호자 초대코드 발급/확인
//   - 플랜 max_guardians 기준으로 발급 가능 여부 표시
//   - 초대 상태: pending / accepted / expired
// ====================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Copy, Check, Clock, UserCheck, RefreshCw, Share2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Child } from "@/types/family";
import { GRADE_LEVEL_LABEL, GRADE_LABEL } from "@/types/family";
import type { GradeLevel, Grade } from "@/types/family";

// ── 초대 정보 타입 ──
interface CaregiverInvite {
  id:            string;
  child_id:      string;
  invite_code:   string | null;
  invite_status: "pending" | "accepted" | "rejected" | "expired";
  accepted_by:   string | null;
  expires_at:    string | null;
  created_at:    string;
}

interface ChildWithInvites extends Child {
  invites: CaregiverInvite[];
}

export default function FamilyPage() {
  const router = useRouter();

  const [parentId, setParentId]         = useState<string | null>(null);
  const [maxGuardians, setMaxGuardians] = useState<number>(0);
  const [children, setChildren]         = useState<ChildWithInvites[]>([]);
  const [loading, setLoading]           = useState(true);
  const [generating, setGenerating]     = useState<string | null>(null); // child_id
  const [copiedCode, setCopiedCode]     = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);

  // ── 초기 로드 ──────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/"); return; }

      const role = user.user_metadata?.role as string | undefined;
      if (role !== "parent") { router.replace("/"); return; }

      const { data: parentRow } = await supabase
        .from("parent")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!parentRow) { setError("학부모 정보를 불러오지 못했어요."); setLoading(false); return; }

      setParentId(parentRow.id);

      const [childrenRes, planRes] = await Promise.all([
        supabase
          .from("child")
          .select("*")
          .eq("parent_id", parentRow.id)
          .eq("profile_status", "active")
          .order("created_at", { ascending: true }),
        supabase
          .from("subscription_plan")
          .select("max_guardians")
          .eq("parent_id", parentRow.id)
          .maybeSingle(),
      ]);

      const maxG = planRes.data?.max_guardians ?? 0;
      setMaxGuardians(maxG);

      if (!childrenRes.data || childrenRes.data.length === 0) {
        setChildren([]);
        setLoading(false);
        return;
      }

      // 각 자녀의 초대 목록 조회
      const childIds = childrenRes.data.map((c) => c.id);
      const { data: inviteRows } = await supabase
        .from("caregiver_invite")
        .select("id, child_id, invite_code, invite_status, accepted_by, expires_at, created_at")
        .in("child_id", childIds)
        .order("created_at", { ascending: false });

      const inviteMap: Record<string, CaregiverInvite[]> = {};
      (inviteRows ?? []).forEach((inv) => {
        if (!inviteMap[inv.child_id]) inviteMap[inv.child_id] = [];
        inviteMap[inv.child_id].push(inv as CaregiverInvite);
      });

      setChildren(
        childrenRes.data.map((c) => ({
          ...c,
          invites: inviteMap[c.id] ?? [],
        })) as ChildWithInvites[]
      );
      setLoading(false);
    }

    init();
  }, [router]);

  // ── 초대코드 발급 ──────────────────────────────────────
  const generateInvite = async (childId: string) => {
    if (!parentId) return;
    setGenerating(childId);
    setError(null);

    // 기존 pending 초대가 있으면 expired 처리 후 새로 발급
    await supabase
      .from("caregiver_invite")
      .update({ invite_status: "expired" })
      .eq("child_id", childId)
      .eq("parent_id", parentId)
      .eq("invite_status", "pending");

    // 신규 발급 (invite_code는 DB default: 6자리 랜덤)
    const { data: newInvite, error: insertErr } = await supabase
      .from("caregiver_invite")
      .insert({
        parent_id: parentId,
        child_id:  childId,
        // expires_at default: now() + 7 days (DB 설정값 유지)
      })
      .select("id, child_id, invite_code, invite_status, accepted_by, expires_at, created_at")
      .maybeSingle();

    if (insertErr || !newInvite) {
      setError("초대코드 발급에 실패했어요. 다시 시도해주세요.");
      setGenerating(null);
      return;
    }

    setChildren((prev) =>
      prev.map((c) => {
        if (c.id !== childId) return c;
        // 기존 pending 제거 + 새 초대 추가
        const filtered = c.invites.filter((i) => i.invite_status !== "pending");
        return {
          ...c,
          invites: [newInvite as CaregiverInvite, ...filtered],
        };
      })
    );
    setGenerating(null);
  };

  // ── 코드 복사 ──────────────────────────────────────────
  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // ── 초대 공유 (Web Share API → 시스템 공유 시트) ─────────
  // 모바일에서 카카오톡·문자 등 선택 가능.
  // Web Share API 미지원 환경(PC 등)은 클립보드 텍스트 복사로 대체.
  const shareInvite = async (childName: string, code: string) => {
    const joinUrl = `${window.location.origin}/join/caregiver`;
    const text = [
      `${childName}의 보호자로 초대합니다.`,
      ``,
      `초대코드: ${code}`,
      `꿈따라에서 코드를 입력하면 연결돼요.`,
      joinUrl,
      ``,
      `코드는 7일간 유효합니다.`,
    ].join("\n");

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "꿈따라 보호자 초대", text });
      } catch {
        // 사용자가 공유 취소한 경우 — no-op
      }
    } else {
      // 시스템 공유 미지원 → 클립보드 복사
      await navigator.clipboard.writeText(text);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // ── 학년 표시 ──────────────────────────────────────────
  function gradeLabel(child: Child): string {
    if (child.grade_level && GRADE_LEVEL_LABEL[child.grade_level as GradeLevel]) {
      return GRADE_LEVEL_LABEL[child.grade_level as GradeLevel];
    }
    if (child.school_grade && GRADE_LABEL[child.school_grade as Grade]) {
      return GRADE_LABEL[child.school_grade as Grade];
    }
    return "";
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-off">
        <p className="text-sm text-base-muted">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-white min-h-screen flex flex-col">

        {/* 헤더 */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b border-base-border bg-white"
          style={{ paddingTop: "env(safe-area-inset-top, 12px)" }}
        >
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full hover:bg-base-off transition-colors"
            aria-label="뒤로가기"
          >
            <ChevronLeft size={20} className="text-base-text" />
          </button>
          <h1 className="text-sm font-bold text-base-text">가족 설정</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5">

          {/* 에러 */}
          {error && (
            <div className="p-3 bg-red-50 rounded-button text-sm text-red-500">
              {error}
            </div>
          )}

          {/* 플랜 안내 — 보호자 기능 잠금 */}
          {maxGuardians === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-card text-sm text-amber-700">
              <p className="font-semibold mb-1">보호자 초대는 베이직 이상 플랜에서 가능해요</p>
              <p className="text-xs leading-relaxed">
                패밀리·프리미엄 플랜에서 공동양육자를 초대해 아이의 진로 탐색을 함께 확인할 수 있어요.
              </p>
              <button
                onClick={() => router.push("/settings")}
                className="mt-2 text-xs font-semibold text-amber-700 underline underline-offset-2"
              >
                플랜 살펴보기
              </button>
            </div>
          )}

          {/* 자녀 없음 */}
          {children.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-base-muted">등록된 자녀 프로필이 없어요.</p>
            </div>
          )}

          {/* 자녀별 보호자 초대 카드 */}
          {children.map((child) => {
            const pendingInvite  = child.invites.find((i) => i.invite_status === "pending");
            const acceptedInvites = child.invites.filter((i) => i.invite_status === "accepted");
            const isGenerating   = generating === child.id;
            const canInvite      = maxGuardians > 0 && acceptedInvites.length < maxGuardians;

            return (
              <div key={child.id} className="bg-white border border-base-border rounded-card-lg p-4 flex flex-col gap-3">

                {/* 자녀 정보 */}
                <div className="flex items-center gap-2">
                  <span className="text-xl">{child.avatar_emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-base-text">{child.name}</p>
                    {gradeLabel(child) && (
                      <p className="text-xs text-base-muted">{gradeLabel(child)}</p>
                    )}
                  </div>
                </div>

                {/* 수락된 보호자 */}
                {acceptedInvites.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-semibold text-base-muted">연결된 보호자</p>
                    {acceptedInvites.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center gap-2 bg-green-50 rounded-button px-3 py-2"
                      >
                        <UserCheck size={13} className="text-green-600 shrink-0" />
                        <span className="text-xs text-green-700 font-medium">보호자 연결됨</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 발급된 초대코드 (pending) */}
                {pendingInvite && pendingInvite.invite_code && (
                  <div className="bg-base-off rounded-button px-3 py-3 flex flex-col gap-2.5">

                    {/* Row 1: 라벨 + 만료일 */}
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-base-muted font-medium">보호자 초대코드</p>
                      <div className="flex items-center gap-1 text-[10px] text-base-muted">
                        <Clock size={11} />
                        {pendingInvite.expires_at
                          ? `${Math.max(0, Math.ceil((new Date(pendingInvite.expires_at).getTime() - Date.now()) / 86400000))}일 남음`
                          : ""}
                      </div>
                    </div>

                    {/* Row 2: 코드 + 새 코드 버튼 */}
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-mono font-bold tracking-[0.25em] text-base-text">
                        {pendingInvite.invite_code}
                      </p>
                      <button
                        onClick={() => generateInvite(child.id)}
                        disabled={isGenerating}
                        className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-button bg-base-card text-base-muted disabled:opacity-40 transition-all"
                        title="새 코드 발급"
                      >
                        <RefreshCw size={11} className={isGenerating ? "animate-spin" : ""} />
                        <span className="text-[10px]">새 코드</span>
                      </button>
                    </div>

                    {/* Row 3: 복사 + 공유 버튼 */}
                    <div className="flex gap-2">
                      {/* 복사 */}
                      <button
                        onClick={() => copyCode(pendingInvite.invite_code!)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-button transition-all"
                        style={
                          copiedCode === pendingInvite.invite_code
                            ? { background: "#F0FDF4", color: "#16A34A" }
                            : { background: "#FFF0EB", color: "#E84B2E" }
                        }
                      >
                        {copiedCode === pendingInvite.invite_code
                          ? <><Check size={13} /> 복사됨</>
                          : <><Copy size={13} /> 복사하기</>}
                      </button>

                      {/* 공유하기 (Web Share API → 시스템 공유 시트)
                          모바일: 카카오톡·문자·이메일 등 선택 가능
                          PC 미지원 시: 클립보드 자동 복사 */}
                      <button
                        onClick={() => shareInvite(child.name, pendingInvite.invite_code!)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-button transition-all active:opacity-80"
                        style={{ background: "#FEE500", color: "#3C1E1E" }}
                      >
                        <Share2 size={13} />
                        공유하기
                      </button>
                    </div>

                    {/* Row 4: 안내 문구 */}
                    <p className="text-[10px] text-base-muted text-center leading-relaxed">
                      공유 후 보호자가 앱에서 코드를 입력하면 연결돼요
                    </p>
                  </div>
                )}

                {/* 초대코드 발급 버튼 (없을 때) */}
                {!pendingInvite && canInvite && (
                  <button
                    onClick={() => generateInvite(child.id)}
                    disabled={isGenerating}
                    className="
                      flex items-center justify-center gap-2 w-full
                      py-2.5 rounded-button border border-dashed border-base-border
                      text-sm font-semibold text-base-muted
                      hover:border-brand-red hover:text-brand-red transition-colors
                      disabled:opacity-40
                    "
                  >
                    {isGenerating ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Plus size={14} />
                    )}
                    보호자 초대코드 발급
                  </button>
                )}

                {/* 플랜 한도 초과 */}
                {!canInvite && maxGuardians > 0 && acceptedInvites.length >= maxGuardians && (
                  <p className="text-xs text-base-muted text-center py-1">
                    현재 플랜에서 보호자를 최대 {maxGuardians}명까지 연결할 수 있어요.
                  </p>
                )}
              </div>
            );
          })}

          {/* 안내 텍스트 */}
          {maxGuardians > 0 && children.length > 0 && (
            <div className="px-2 pb-2">
              <p className="text-xs text-base-muted text-center leading-relaxed">
                보호자가 꿈따라 앱에서 코드를 입력하면 연결돼요.
                코드는 발급 후 7일간 유효해요.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
