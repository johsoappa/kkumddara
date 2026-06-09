"use client";

// ====================================================
// 자녀 프로필 관리 (/settings/children)
//
// - active 자녀 목록 표시
// - 자녀 추가(경량 폼) — child_limit 준수(초과 시 추가 차단 + 안내)
// - 자녀 삭제 = soft delete (profile_status='inactive' update, 하드 삭제/cascade 없음)
// - 삭제 확인 모달 (체크박스 동의 후 활성화)
//
// [변경하지 않은 것]
//   DB schema / migration / RLS / child 하드 삭제 / cascade / 결제·요금제 로직
//   다자녀 전환 selector(후속 과제)
// ====================================================

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, X } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { supabase } from "@/lib/supabase";
import { getChildrenByParentId, canAddChild } from "@/lib/db/family";
import type { Child, GradeLevel, InterestField } from "@/types/family";
import {
  INTEREST_LABEL,
  GRADE_LEVEL_LABEL,
  GRADE_LEVEL_TO_SCHOOL_GRADE,
} from "@/types/family";

// onboarding/parent와 동일한 옵션 (불필요한 신규 필드 없음)
const GRADES: { value: GradeLevel; label: string }[] = [
  { value: "elem_1", label: "초1" }, { value: "elem_2", label: "초2" },
  { value: "elem_3", label: "초3" }, { value: "elem_4", label: "초4" },
  { value: "elem_5", label: "초5" }, { value: "elem_6", label: "초6" },
  { value: "middle_1", label: "중1" }, { value: "middle_2", label: "중2" },
  { value: "middle_3", label: "중3" },
  { value: "high_1", label: "고1" }, { value: "high_2", label: "고2" },
  { value: "high_3", label: "고3" },
];
const INTERESTS: InterestField[] = ["it", "art", "medical", "business", "education"];

export default function ChildrenManagePage() {
  const router = useRouter();

  const [parentId, setParentId]   = useState<string | null>(null);
  const [children, setChildren]   = useState<Child[]>([]);
  const [limit, setLimit]         = useState(1);
  const [canAdd, setCanAdd]       = useState(false);
  const [loading, setLoading]     = useState(true);

  // 추가 폼 상태
  const [showForm, setShowForm]   = useState(false);
  const [name, setName]           = useState("");
  const [grade, setGrade]         = useState<GradeLevel | null>(null);
  const [interests, setInterests] = useState<InterestField[]>([]);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 삭제 모달 상태
  const [deleteTarget, setDeleteTarget] = useState<Child | null>(null);
  const [deleteAgree, setDeleteAgree]   = useState(false);
  const [deleting, setDeleting]         = useState(false);

  const reload = useCallback(async (pid: string) => {
    const [list, add] = await Promise.all([
      getChildrenByParentId(pid),
      canAddChild(pid),
    ]);
    setChildren(list);
    setCanAdd(add.allowed);
    setLimit(add.limit);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace("/"); return; }
        const { data: parentRow } = await supabase
          .from("parent").select("id").eq("user_id", user.id).maybeSingle();
        if (!parentRow?.id) { router.replace("/"); return; }
        setParentId(parentRow.id);
        await reload(parentRow.id);
      } catch (err) {
        console.error("[settings/children] init 오류:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router, reload]);

  const toggleInterest = (f: InterestField) =>
    setInterests((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);

  // ── 자녀 추가 ─────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentId || saving) return;
    if (!name.trim() || !grade) { setFormError("이름과 학년을 입력해 주세요."); return; }

    setSaving(true);
    setFormError(null);
    try {
      // child_limit 재확인 (DB 기준 준수)
      const { allowed } = await canAddChild(parentId);
      if (!allowed) { setCanAdd(false); setFormError(null); setShowForm(false); return; }

      const { error } = await supabase.from("child").insert({
        parent_id:    parentId,
        name:         name.trim(),
        grade_level:  grade,
        school_grade: GRADE_LEVEL_TO_SCHOOL_GRADE[grade] ?? null,
        interests,
      });
      if (error) throw error;

      setName(""); setGrade(null); setInterests([]); setShowForm(false);
      await reload(parentId);
    } catch (err) {
      console.error("[settings/children] 자녀 추가 오류:", err);
      setFormError("자녀 추가 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  // ── 자녀 삭제 (soft delete: profile_status='inactive') ────
  const handleDelete = async () => {
    if (!parentId || !deleteTarget || !deleteAgree || deleting) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("child")
        .update({ profile_status: "inactive" })
        .eq("id", deleteTarget.id)
        .eq("parent_id", parentId); // 소유권 검증 (RLS와 병행)
      if (error) throw error;
      setDeleteTarget(null);
      setDeleteAgree(false);
      await reload(parentId);
    } catch (err) {
      console.error("[settings/children] 자녀 삭제 오류:", err);
    } finally {
      setDeleting(false);
    }
  };

  const gradeLabel = (c: Child): string | null =>
    (c.grade_level && GRADE_LEVEL_LABEL[c.grade_level as GradeLevel]) ?? null;

  if (loading) {
    return (
      <AppShell headerTitle="자녀 프로필 관리" showBack backHref="/settings">
        <div className="px-4 pt-6 text-center text-sm text-base-muted">불러오는 중...</div>
      </AppShell>
    );
  }

  return (
    <AppShell headerTitle="자녀 프로필 관리" showBack backHref="/settings">
      <div className="px-4 pt-4 pb-10 flex flex-col gap-4">

        <div>
          <h1 className="text-base font-bold text-base-text">자녀 프로필 관리</h1>
          <p className="text-xs text-base-muted mt-1 leading-relaxed">
            등록된 자녀 정보를 확인하고, 필요한 경우 새 자녀를 추가할 수 있어요.
          </p>
          <p className="text-[11px] text-base-muted mt-2 leading-relaxed px-3 py-2 rounded-card"
            style={{ backgroundColor: "#FFF8F4" }}>
            아이의 학년에 따라 씨앗모드(초1~초2), 새싹모드(초3~초4), 나침반모드(초5~고등) 기준으로
            진로 탐색 흐름을 다르게 안내합니다.
          </p>
        </div>

        {/* ── 자녀 목록 ───────────────────────────── */}
        {children.length === 0 ? (
          <div className="bg-white rounded-card-lg shadow-card px-5 py-6 text-center">
            <p className="text-sm font-bold text-base-text mb-1">등록된 자녀가 아직 없어요.</p>
            <p className="text-xs text-base-muted">자녀를 추가하고 꿈따라를 시작해 보세요.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {children.map((c) => (
              <div key={c.id} className="bg-white rounded-card-lg shadow-card px-5 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-base-text truncate">{c.name}</p>
                  <p className="text-xs text-base-muted mt-0.5">
                    {gradeLabel(c) ?? "학년 미설정"}
                    {(c.interests?.length ?? 0) > 0 && (
                      <span> · {c.interests.slice(0, 2).map((f) => INTEREST_LABEL[f as InterestField]).join(", ")}</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => { setDeleteTarget(c); setDeleteAgree(false); }}
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-red-500 border border-red-200 rounded-full px-3 py-1.5 active:opacity-70"
                  aria-label={`${c.name} 자녀 정보 삭제`}
                >
                  <Trash2 size={13} /> 자녀 정보 삭제
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── 자녀 추가 ───────────────────────────── */}
        {canAdd ? (
          showForm ? (
            <form onSubmit={handleAdd} className="bg-white rounded-card-lg shadow-card px-5 py-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-base-text">자녀 추가하기</p>
                <button type="button" onClick={() => { setShowForm(false); setFormError(null); }} aria-label="닫기">
                  <X size={18} className="text-base-muted" />
                </button>
              </div>

              {/* 이름 */}
              <div>
                <label className="block text-xs font-semibold text-base-text mb-1.5">자녀 이름</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름 또는 닉네임"
                  className="w-full px-4 py-2.5 rounded-button border border-base-border text-sm focus:outline-none focus:border-brand-red"
                />
              </div>

              {/* 학년 */}
              <div>
                <label className="block text-xs font-semibold text-base-text mb-1.5">학년</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {GRADES.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGrade(g.value)}
                      className={[
                        "py-2 rounded-button text-xs font-semibold border transition-colors",
                        grade === g.value ? "border-brand-red text-brand-red bg-brand-light" : "border-base-border text-base-text bg-white",
                      ].join(" ")}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 관심 분야 */}
              <div>
                <label className="block text-xs font-semibold text-base-text mb-1.5">관심 분야 (선택)</label>
                <div className="flex flex-wrap gap-1.5">
                  {INTERESTS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleInterest(f)}
                      className={[
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                        interests.includes(f) ? "border-brand-red text-brand-red bg-brand-light" : "border-base-border text-base-muted bg-white",
                      ].join(" ")}
                    >
                      {INTEREST_LABEL[f]}
                    </button>
                  ))}
                </div>
              </div>

              {formError && <p className="text-xs text-red-500">{formError}</p>}

              <button
                type="submit"
                disabled={saving || !name.trim() || !grade}
                className="w-full py-3 rounded-button text-sm font-bold text-white active:opacity-70 disabled:opacity-40"
                style={{ backgroundColor: "#E84B2E" }}
              >
                {saving ? "추가 중..." : "자녀 추가"}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-white rounded-card-lg shadow-card px-5 py-4 flex items-center justify-center gap-1.5 text-sm font-semibold active:opacity-70"
              style={{ color: "#E84B2E" }}
            >
              <Plus size={16} /> 자녀 추가하기
            </button>
          )
        ) : (
          // child_limit 초과 — 추가 차단 안내
          <div className="rounded-card-lg p-4" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}>
            <p className="text-xs leading-relaxed" style={{ color: "#92400E" }}>
              현재 플랜에서는 등록 가능한 자녀 수({limit}명)를 초과했어요.
              <br />자녀 추가는 향후 유료 플랜 또는 패밀리 플랜에서 확장 제공될 예정입니다.
              <br />기존 자녀 정보를 삭제한 뒤 새 자녀를 등록할 수 있습니다.
            </p>
          </div>
        )}
      </div>

      {/* ── 삭제 확인 모달 ───────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-6" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="w-full max-w-sm bg-white rounded-card-lg p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-base font-bold text-base-text mb-3">자녀 정보를 삭제할까요?</p>
            <p className="text-xs text-base-muted leading-relaxed">
              삭제하면 <span className="font-semibold text-base-text">{deleteTarget.name}</span> 자녀는 화면에서 더 이상 표시되지 않으며,
              진로 탐색 기록, 관심 직업, 명따라 결과, 활동 기록도 일반 화면에서 확인할 수 없어요.
            </p>
            <p className="text-xs text-base-muted leading-relaxed mt-2">
              관련 데이터는 개인정보 처리방침과 운영 기준에 따라 관리됩니다.
            </p>

            <label className="flex items-start gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteAgree}
                onChange={(e) => setDeleteAgree(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-xs text-base-text leading-relaxed">위 내용을 확인했습니다.</span>
            </label>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => !deleting && setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-button border border-base-border text-sm font-semibold text-base-text active:opacity-70"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={!deleteAgree || deleting}
                className="flex-1 py-2.5 rounded-button text-sm font-bold text-white active:opacity-70 disabled:opacity-40"
                style={{ backgroundColor: "#EF4444" }}
              >
                {deleting ? "삭제 중..." : "삭제하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
