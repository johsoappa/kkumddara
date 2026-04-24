"use client";

// ====================================================
// 가족 설정 페이지 (/parent/family)
//
// 기능:
//   - 자녀별 보호자 초대코드 발급/확인
//   - 플랜 max_guardians 기준으로 발급 가능 여부 표시
//   - 초대 상태: pending / accepted / expired
//
// 공유 방식:
//   1순위: Kakao JavaScript SDK sendDefault (직접 카카오톡 공유)
//   2순위: 클립보드 복사 fallback (SDK 미지원/실패 시)
//
// 환경변수:
//   NEXT_PUBLIC_KAKAO_JS_KEY — 카카오 JS 앱 키 (필수)
//   미설정 시 자동으로 클립보드 복사 fallback 동작
//
// 전제:
//   카카오 개발자 콘솔 > 플랫폼 > Web 에 배포 도메인이 등록되어야 함
// ====================================================

// ── Kakao SDK 전역 타입 ──────────────────────────────────────
declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: {
          objectType: string;
          text?: string;
          link?: { mobileWebUrl?: string; webUrl?: string };
          buttonTitle?: string;
        }) => void;
      };
    };
  }
}

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Copy, Check, Clock, UserCheck, RefreshCw } from "lucide-react";
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

// ── Kakao SDK 로더 ──────────────────────────────────────────
// SDK 스크립트를 동적으로 삽입하고 앱 키로 초기화한다.
// 이미 로드된 경우 재삽입 없이 초기화 여부만 확인한다.
async function loadKakaoSDK(): Promise<boolean> {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!appKey || typeof window === "undefined") return false;

  // 이미 초기화 완료
  if (window.Kakao?.isInitialized?.()) return true;

  // 스크립트가 아직 없으면 삽입
  if (!window.Kakao) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src   = "https://developers.kakao.com/sdk/js/kakao.min.js";
      script.async = true;
      script.onload  = () => resolve();
      script.onerror = () => reject(new Error("Kakao SDK load failed"));
      document.head.appendChild(script);
    });
  }

  // 초기화 (중복 호출 방지)
  if (window.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init(appKey);
  }

  return window.Kakao?.isInitialized?.() ?? false;
}

export default function FamilyPage() {
  const router = useRouter();

  const [parentId, setParentId]         = useState<string | null>(null);
  const [maxGuardians, setMaxGuardians] = useState<number>(0);
  const [children, setChildren]         = useState<ChildWithInvites[]>([]);
  const [loading, setLoading]           = useState(true);
  const [generating, setGenerating]     = useState<string | null>(null); // child_id
  const [copiedCode, setCopiedCode]     = useState<string | null>(null);
  const [shareNote, setShareNote]       = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);

  // ── Kakao SDK 사전 로드 (버튼 클릭 시 지연 없애기) ────────────
  useEffect(() => {
    loadKakaoSDK().catch(() => {/* SDK 없어도 fallback으로 동작 */});
  }, []);

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

  // ── 클립보드 fallback (Kakao 공유 실패 시) ─────────────
  const clipboardFallback = async (childName: string, code: string) => {
    const joinUrl = `${window.location.origin}/join/caregiver`;
    const text = [
      `${childName}의 보호자로 초대합니다.`,
      ``,
      `초대코드: ${code}`,
      `꿈따라 앱에서 코드를 입력하면 연결돼요.`,
      joinUrl,
      ``,
      `코드는 7일간 유효합니다.`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(code);
      setShareNote("카카오 공유가 어려워 초대 코드를 복사했어요. 붙여넣어 전달해 주세요.");
    } catch {
      setShareNote("공유에 실패했어요. 복사하기 버튼을 이용해 주세요.");
    }
    setTimeout(() => { setCopiedCode(null); setShareNote(null); }, 3500);
  };

  // ── 카카오톡 직접 공유 ─────────────────────────────────
  // Kakao JavaScript SDK sendDefault 호출.
  // SDK 미준비·실패 시 클립보드 복사 fallback 자동 적용.
  const shareViaKakao = async (childName: string, code: string) => {
    const joinUrl = `${window.location.origin}/join/caregiver`;

    let sdkReady = false;
    try {
      sdkReady = await loadKakaoSDK();
    } catch {
      // SDK 로드 실패 — fallback으로 진행
    }

    if (sdkReady && window.Kakao) {
      try {
        window.Kakao.Share.sendDefault({
          objectType: "text",
          text: [
            `${childName}의 보호자로 초대합니다.`,
            ``,
            `초대코드: ${code}`,
            `꿈따라 앱에서 코드를 입력하면 연결돼요.`,
            `코드는 7일간 유효합니다.`,
          ].join("\n"),
          link: {
            mobileWebUrl: joinUrl,
            webUrl:       joinUrl,
          },
          buttonTitle: "꿈따라 열기",
        });
        return; // 공유창 정상 오픈 — UI 추가 피드백 불필요
      } catch (e) {
        console.warn("[family] Kakao.Share.sendDefault 실패:", e);
      }
    }

    // Kakao 공유 불가 → 클립보드 복사
    await clipboardFallback(childName, code);
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
            const pendingInvite   = child.invites.find((i) => i.invite_status === "pending");
            const acceptedInvites = child.invites.filter((i) => i.invite_status === "accepted");
            const isGenerating    = generating === child.id;
            const canInvite       = maxGuardians > 0 && acceptedInvites.length < maxGuardians;

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

                    {/* Row 3: 복사 + 카카오 공유 버튼 */}
                    <div className="flex gap-2">

                      {/* 복사하기 */}
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

                      {/* 카카오톡으로 공유
                          Kakao JS SDK sendDefault 호출 → 직접 카카오 공유창
                          SDK 실패 시 클립보드 복사 자동 fallback */}
                      <button
                        onClick={() => shareViaKakao(child.name, pendingInvite.invite_code!)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-button transition-all active:opacity-80"
                        style={{ background: "#FEE500", color: "#3C1E1E" }}
                      >
                        {/* KakaoTalk 스타일 아이콘 */}
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 3C6.48 3 2 6.35 2 10.5c0 2.64 1.58 4.97 4 6.43L5 21l4.18-2.5c.91.16 1.86.25 2.82.25 5.52 0 10-3.35 10-7.25S17.52 3 12 3z" />
                        </svg>
                        카카오톡으로 공유
                      </button>
                    </div>

                    {/* Row 4: 공유 결과 안내 / 기본 안내 */}
                    {shareNote ? (
                      <p className="text-[10px] text-amber-600 text-center leading-relaxed">
                        {shareNote}
                      </p>
                    ) : (
                      <p className="text-[10px] text-base-muted text-center leading-relaxed">
                        공유 후 보호자가 앱에서 코드를 입력하면 연결돼요
                      </p>
                    )}
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
