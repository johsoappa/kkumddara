"use client";

// ====================================================
// 학생 프로필 수정 (/student/edit)
// - 학년 / 관심분야 수정
// - 저장 성공 후 router.refresh() 호출 → 홈 컴포넌트 캐시 무효화
//   → 홈 복귀 즉시 최신값 반영 (다른 탭 이동 불필요)
// ====================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { Grade, InterestField } from "@/types/family";
import { SPROUT_GRADES, VALID_GRADES } from "@/types/family";

const GRADE_GROUPS: { label: string; options: { value: Grade; label: string }[] }[] = [
  {
    label: "초등학생",
    options: [
      { value: "elementary3", label: "초3" },
      { value: "elementary4", label: "초4" },
      { value: "elementary5", label: "초5" },
      { value: "elementary6", label: "초6" },
    ],
  },
  {
    label: "중학생",
    options: [
      { value: "middle1", label: "중1" },
      { value: "middle2", label: "중2" },
      { value: "middle3", label: "중3" },
    ],
  },
  {
    label: "고등학생",
    options: [
      { value: "high1", label: "고1" },
      { value: "high2", label: "고2" },
      { value: "high3", label: "고3" },
    ],
  },
];

const INTEREST_OPTIONS: { value: InterestField; label: string; emoji: string }[] = [
  { value: "it",        label: "IT·기술",      emoji: "💻" },
  { value: "art",       label: "예술·디자인",   emoji: "🎨" },
  { value: "medical",   label: "의료·과학",     emoji: "🔬" },
  { value: "business",  label: "비즈니스·경영", emoji: "💼" },
  { value: "education", label: "교육·사회",     emoji: "📚" },
];

export default function StudentEditPage() {
  const router = useRouter();

  const [grade, setGrade]         = useState<Grade | null>(null);
  const [interests, setInterests] = useState<InterestField[]>([]);
  const [childId, setChildId]     = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // ── 기존값 로드: Supabase DB 우선, localStorage fallback ──
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: studentData } = await supabase
          .from("student")
          .select("child_id")
          .eq("user_id", user.id)
          .maybeSingle(); // student 레코드 없을 때 예외 방지

        if (studentData?.child_id) {
          const { data: childData } = await supabase
            .from("child")
            .select("id, school_grade, interests")
            .eq("id", studentData.child_id)
            .maybeSingle(); // child가 삭제됐을 경우 null 반환

          if (childData) {
            setChildId(childData.id);
            setGrade(childData.school_grade as Grade);
            setInterests((childData.interests ?? []) as InterestField[]);
            setLoading(false);
            return;
          }
        }
      }

      // localStorage fallback (구 아키텍처 호환)
      const stored = localStorage.getItem("kkumddara_onboarding");
      if (stored) {
        const parsed = JSON.parse(stored);
        setGrade(parsed.grade ?? null);
        setInterests(parsed.interests ?? []);
      }
      setLoading(false);
    }

    load();
  }, []);

  const toggleInterest = (field: InterestField) =>
    setInterests((prev) =>
      prev.includes(field) ? prev.filter((i) => i !== field) : [...prev, field]
    );

  // ── 저장 ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!grade) { setError("학년을 선택해주세요."); return; }
    if (!(VALID_GRADES as readonly string[]).includes(grade)) {
      console.error("[student/edit] 유효하지 않은 grade 값:", grade);
      setError("올바르지 않은 학년 값입니다.");
      return;
    }
    if (interests.length === 0) { setError("관심 분야를 하나 이상 선택해주세요."); return; }
    setError(null);
    setSaving(true);

    try {
      // 1. localStorage 업데이트 (구 아키텍처 호환)
      const stored = localStorage.getItem("kkumddara_onboarding");
      const existing = stored ? JSON.parse(stored) : {};
      localStorage.setItem("kkumddara_onboarding", JSON.stringify({
        ...existing,
        grade,
        interests,
      }));

      // 2. Supabase child 테이블 업데이트
      if (childId) {
        const { error: dbError } = await supabase
          .from("child")
          .update({ school_grade: grade, interests })
          .eq("id", childId);
        if (dbError) throw dbError;
      }

      // 3. 라우터 캐시 무효화 → 홈 컴포넌트 리마운트 보장
      //    이 호출 없이는 Next.js가 캐시된 홈 컴포넌트를 그대로 표시하여
      //    useEffect([])가 재실행되지 않아 구값이 남는다.
      router.refresh();

      // 4. 홈으로 이동 (새 아키텍처는 항상 /student/home)
      router.replace("/student/home");
    } catch (e) {
      console.error("[student/edit] 저장 오류:", e);
      setError("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const canSave = !!grade && interests.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-off">
        <p className="text-sm text-base-muted">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-mobile flex flex-col px-5 pt-5 pb-10">

        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => router.push("/student/home")}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-base-card transition-colors"
            aria-label="뒤로"
          >
            <ArrowLeft size={20} className="text-base-text" />
          </button>
          <h1 className="text-lg font-bold text-base-text">내 정보 수정</h1>
        </div>

        {/* ── 학년 선택 ──────────────────────────────── */}
        <section className="mb-7">
          <h2 className="text-sm font-bold text-base-muted mb-3 uppercase tracking-wide">
            학년
          </h2>
          <div className="flex flex-col gap-3">
            {GRADE_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-xs text-base-muted mb-1.5">{group.label}</p>
                <div className="flex gap-2 flex-wrap">
                  {group.options.map(({ value, label }) => {
                    const selected = grade === value;
                    return (
                      <button
                        key={value}
                        onClick={() => setGrade(value)}
                        className={cn(
                          "px-4 py-2.5 rounded-full text-sm font-semibold border-2 min-w-[52px] transition-all",
                          selected
                            ? "bg-brand-red border-brand-red text-white"
                            : "bg-white border-base-border text-base-text hover:border-brand-red"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 관심 분야 선택 ─────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-base-muted mb-1 uppercase tracking-wide">
            관심 분야
          </h2>
          <p className="text-xs text-base-muted mb-3">복수 선택 가능</p>
          <div className="grid grid-cols-2 gap-2">
            {INTEREST_OPTIONS.map(({ value, label, emoji }) => {
              const selected = interests.includes(value);
              return (
                <button
                  key={value}
                  onClick={() => toggleInterest(value)}
                  className={cn(
                    "flex items-center gap-3 py-3 px-4 rounded-card border-2 transition-all text-left",
                    selected
                      ? "border-brand-red bg-red-50"
                      : "border-base-border bg-white hover:border-brand-red"
                  )}
                >
                  <span className="text-xl">{emoji}</span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      selected ? "text-brand-red" : "text-base-text"
                    )}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 에러 */}
        {error && (
          <p className="mb-3 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-button">
            {error}
          </p>
        )}

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className={cn(
            "w-full py-4 rounded-button text-sm font-bold text-white",
            "flex items-center justify-center gap-1.5 transition-opacity",
            canSave && !saving
              ? "bg-brand-red active:opacity-80"
              : "bg-gray-300 cursor-not-allowed"
          )}
        >
          {saving ? (
            "저장 중..."
          ) : (
            <>저장하기 <ChevronRight size={16} /></>
          )}
        </button>

      </div>
    </div>
  );
}
