"use client";

// ====================================================
// 자녀 정보 수정 (/parent/child/[id]/edit)
// - grade_level 선택
// - interests 다중 선택
// - 저장 후 /parent/home 이동
// ====================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  GRADE_LEVEL_LABEL,
  GRADE_LEVEL_TO_SCHOOL_GRADE,
  INTEREST_LABEL,
  VALID_GRADE_LEVELS,
} from "@/types/family";
import type { GradeLevel, InterestField } from "@/types/family";

const INTEREST_FIELDS: InterestField[] = ["it", "art", "medical", "business", "education"];

const GRADE_GROUPS = [
  {
    label: "초등학교",
    levels: ["elem_1","elem_2","elem_3","elem_4","elem_5","elem_6"] as GradeLevel[],
  },
  {
    label: "중학교",
    levels: ["middle_1","middle_2","middle_3"] as GradeLevel[],
  },
  {
    label: "고등학교",
    levels: ["high_1","high_2","high_3"] as GradeLevel[],
  },
];

export default function ChildEditPage({
  params,
}: {
  params: { id: string };
}) {
  const childId = params.id;
  const router = useRouter();

  const [childName,   setChildName]   = useState("");
  const [gradeLevel,  setGradeLevel]  = useState<GradeLevel | null>(null);
  const [interests,   setInterests]   = useState<InterestField[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);

  // ── 자녀 데이터 로드 ──────────────────────────────
  useEffect(() => {
    async function loadChild() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/"); return; }

      const { data: parentRow } = await supabase
        .from("parent")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!parentRow) { router.replace("/parent/home"); return; }

      const { data: child, error } = await supabase
        .from("child")
        .select("name, grade_level, interests")
        .eq("id", childId)
        .eq("parent_id", parentRow.id)
        .eq("profile_status", "active")
        .maybeSingle();

      if (error || !child) {
        console.error("[child/edit] 자녀 조회 실패:", error);
        router.replace("/parent/home");
        return;
      }

      setChildName(child.name ?? "");
      setGradeLevel((child.grade_level as GradeLevel) ?? null);
      setInterests((child.interests as InterestField[]) ?? []);
      setLoading(false);
    }

    loadChild();
  }, [childId, router]);

  // ── 관심 분야 토글 ────────────────────────────────
  const toggleInterest = (field: InterestField) => {
    setInterests((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  };

  // ── 저장 ──────────────────────────────────────────
  const handleSave = async () => {
    if (!gradeLevel) {
      setSaveError("학년을 선택해주세요.");
      return;
    }
    if (!VALID_GRADE_LEVELS.includes(gradeLevel)) {
      setSaveError("올바르지 않은 학년 값이에요.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    // grade_level: source of truth (초1~고3 전체)
    // school_grade: 하위호환 병행 저장 (초1·초2는 매핑 없음 → null)
    const schoolGrade = GRADE_LEVEL_TO_SCHOOL_GRADE[gradeLevel] ?? null;

    const { error } = await supabase
      .from("child")
      .update({
        grade_level:  gradeLevel,
        school_grade: schoolGrade,
        interests:    interests,
        updated_at:   new Date().toISOString(),
      })
      .eq("id", childId);

    if (error) {
      console.error("[child/edit] 저장 실패:", error.message, error.code);
      setSaveError("저장 중 오류가 발생했어요. 다시 시도해주세요.");
      setSaving(false);
      return;
    }

    router.replace("/parent/home");
  };

  // ── 로딩 ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-base-off flex items-center justify-center">
        <p className="text-sm text-base-muted">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-base-off">

        {/* 헤더 */}
        <div className="sticky top-0 z-50 bg-white border-b border-base-border">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-off transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft size={20} className="text-base-text" />
            </button>
            <h1 className="text-sm font-bold text-base-text">
              {childName} 정보 수정
            </h1>
            <div className="w-9" />
          </div>
        </div>

        <div className="px-4 pt-5 pb-10 flex flex-col gap-6">

          {/* ── 학년 선택 ─────────────────────────── */}
          <section>
            <h2 className="text-sm font-bold text-base-text mb-3">학년</h2>
            <div className="flex flex-col gap-3">
              {GRADE_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-xs text-base-muted font-semibold mb-2 tracking-wide">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {group.levels.map((level) => {
                      const selected = gradeLevel === level;
                      return (
                        <button
                          key={level}
                          onClick={() => setGradeLevel(level)}
                          className={`
                            py-2.5 rounded-button text-sm font-semibold
                            transition-colors border
                            ${selected
                              ? "border-brand-red text-brand-red"
                              : "border-base-border text-base-muted bg-white"
                            }
                          `}
                          style={selected ? { backgroundColor: "#FFF0EB" } : {}}
                        >
                          {GRADE_LEVEL_LABEL[level]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 관심 분야 선택 ────────────────────── */}
          <section>
            <h2 className="text-sm font-bold text-base-text mb-1">관심 분야</h2>
            <p className="text-xs text-base-muted mb-3">복수 선택 가능해요</p>
            <div className="flex flex-col gap-2">
              {INTEREST_FIELDS.map((field) => {
                const selected = interests.includes(field);
                return (
                  <button
                    key={field}
                    onClick={() => toggleInterest(field)}
                    className={`
                      flex items-center justify-between
                      px-4 py-3 rounded-card border text-sm font-medium
                      transition-colors
                      ${selected
                        ? "border-brand-red text-brand-red"
                        : "border-base-border text-base-text bg-white"
                      }
                    `}
                    style={selected ? { backgroundColor: "#FFF0EB" } : {}}
                  >
                    <span>{INTEREST_LABEL[field]}</span>
                    {selected && <Check size={16} className="text-brand-red" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 에러 메시지 */}
          {saveError && (
            <p className="text-sm font-semibold text-center" style={{ color: "#E84B2E" }}>
              ⚠️ {saveError}
            </p>
          )}

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="
              w-full py-4 rounded-button
              text-white text-sm font-bold
              active:opacity-80 transition-opacity
              disabled:opacity-50
            "
            style={{ backgroundColor: "#E84B2E" }}
          >
            {saving ? "저장 중..." : "저장하기"}
          </button>

        </div>
      </div>
    </div>
  );
}
