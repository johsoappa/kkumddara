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
import type { GradeLevel, Grade, InterestField } from "@/types/family";
import { GRADE_LEVEL_TO_SCHOOL_GRADE } from "@/types/family";
import { updateStudentProfile } from "./actions";

// ── 학년 그룹 (grade_level 기준, 초1~고3 전체) ──────────────
// 005_add_grade_level 이후 child.grade_level이 source of truth.
// 기존 school_grade(초3~고3)만 지원하던 한계를 초1~고3으로 확장.
const GRADE_GROUPS: { label: string; options: { value: GradeLevel; label: string }[] }[] = [
  {
    label: "초등학생",
    options: [
      { value: "elem_1", label: "초1" },
      { value: "elem_2", label: "초2" },
      { value: "elem_3", label: "초3" },
      { value: "elem_4", label: "초4" },
      { value: "elem_5", label: "초5" },
      { value: "elem_6", label: "초6" },
    ],
  },
  {
    label: "중학생",
    options: [
      { value: "middle_1", label: "중1" },
      { value: "middle_2", label: "중2" },
      { value: "middle_3", label: "중3" },
    ],
  },
  {
    label: "고등학생",
    options: [
      { value: "high_1", label: "고1" },
      { value: "high_2", label: "고2" },
      { value: "high_3", label: "고3" },
    ],
  },
];

// ── school_grade → grade_level 역방향 매핑 (로드 시 fallback용) ─
// 기존에 school_grade만 저장된 레코드를 grade_level UI에서 초기화할 때 사용.
const SCHOOL_GRADE_TO_GRADE_LEVEL: Partial<Record<Grade, GradeLevel>> = Object.fromEntries(
  Object.entries(GRADE_LEVEL_TO_SCHOOL_GRADE).map(([gl, sg]) => [sg, gl])
) as Partial<Record<Grade, GradeLevel>>;

const INTEREST_OPTIONS: { value: InterestField; label: string; emoji: string }[] = [
  { value: "it",        label: "IT·기술",      emoji: "💻" },
  { value: "art",       label: "예술·디자인",   emoji: "🎨" },
  { value: "medical",   label: "의료·과학",     emoji: "🔬" },
  { value: "business",  label: "비즈니스·경영", emoji: "💼" },
  { value: "education", label: "교육·사회",     emoji: "📚" },
];

export default function StudentEditPage() {
  const router = useRouter();

  const [grade, setGrade]         = useState<GradeLevel | null>(null);
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
            .select("id, grade_level, school_grade, interests")
            .eq("id", studentData.child_id)
            .maybeSingle(); // child가 삭제됐을 경우 null 반환

          if (childData) {
            setChildId(childData.id);
            // grade_level 우선, 없으면 school_grade → grade_level 역방향 매핑으로 초기화
            const gl =
              (childData.grade_level as GradeLevel | null) ??
              (childData.school_grade
                ? SCHOOL_GRADE_TO_GRADE_LEVEL[childData.school_grade as Grade] ?? null
                : null);
            setGrade(gl);
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

  // ── 저장 (Server Action 경유 → 서버 검증 후 DB 업데이트) ──
  const handleSave = async () => {
    // 클라이언트 프리플라이트 (UX 빠른 피드백)
    if (!grade)            { setError("학년을 선택해주세요."); return; }
    if (!interests.length) { setError("관심 분야를 하나 이상 선택해주세요."); return; }
    setError(null);
    setSaving(true);

    try {
      // 1. Server Action 호출 (서버에서 재검증 + DB 업데이트)
      const result = await updateStudentProfile(grade, interests);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      // 2. localStorage 동기화 (구 아키텍처 호환 유지)
      const stored = localStorage.getItem("kkumddara_onboarding");
      const existing = stored ? JSON.parse(stored) : {};
      localStorage.setItem("kkumddara_onboarding", JSON.stringify({
        ...existing,
        grade,
        interests,
      }));

      // 3. 라우터 캐시 무효화 → 홈 컴포넌트 리마운트 보장
      router.refresh();
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
