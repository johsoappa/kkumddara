"use client";

// ====================================================
// 학부모 온보딩 (/onboarding/parent)
// - 자녀 프로필 생성 (이름, 학년, 관심 분야)
// - 완료 시 completeParentOnboarding() 호출
// - → /parent/home 이동
// ====================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { completeParentOnboarding, flushPendingProfile } from "@/lib/auth";
import { getFirstActiveChild, canAddChild } from "@/lib/db/family";
import type { InterestField, GradeLevel } from "@/types/family";
import {
  INTEREST_LABEL,
  VALID_GRADE_LEVELS,
  GRADE_LEVEL_TO_SCHOOL_GRADE,
} from "@/types/family";

// 005: elem_1~high_3 전체 범위 (초1·초2 신규 추가)
const GRADES: { value: GradeLevel; label: string; group: string }[] = [
  { value: "elem_1",   label: "초1", group: "초등" },
  { value: "elem_2",   label: "초2", group: "초등" },
  { value: "elem_3",   label: "초3", group: "초등" },
  { value: "elem_4",   label: "초4", group: "초등" },
  { value: "elem_5",   label: "초5", group: "초등" },
  { value: "elem_6",   label: "초6", group: "초등" },
  { value: "middle_1", label: "중1", group: "중학" },
  { value: "middle_2", label: "중2", group: "중학" },
  { value: "middle_3", label: "중3", group: "중학" },
  { value: "high_1",   label: "고1", group: "고등" },
  { value: "high_2",   label: "고2", group: "고등" },
  { value: "high_3",   label: "고3", group: "고등" },
];

const INTERESTS: InterestField[] = ["it", "art", "medical", "business", "education"];

export default function OnboardingParentPage() {
  const router = useRouter();

  const [parentId, setParentId]       = useState<string | null>(null);
  const [childName, setChildName]     = useState("");
  const [gradeLevel, setGradeLevel]   = useState<GradeLevel | null>(null);
  const [interests, setInterests]     = useState<InterestField[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // 현재 로그인된 유저의 parent.id 로드
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("parent")
        .select("id")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setParentId(data.id);
        });
    });
  }, []);

  const toggleInterest = (field: InterestField) => {
    setInterests((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentId || !gradeLevel || !childName.trim()) return;

    // ── grade_level 런타임 검증 ────────────────────────────────
    if (!(VALID_GRADE_LEVELS as readonly string[]).includes(gradeLevel)) {
      console.error("[onboarding/parent] 유효하지 않은 grade_level 값:", gradeLevel);
      setError("올바르지 않은 학년 값입니다.");
      return;
    }

    // school_grade 역방향 매핑 (elem_1·elem_2는 null — 기존 enum에 없음)
    const schoolGrade = GRADE_LEVEL_TO_SCHOOL_GRADE[gradeLevel] ?? null;

    setLoading(true);
    setError(null);

    try {
      // ── 1. 기존 child 존재 여부 확인 (중복 INSERT 방지) ────────
      // 재제출·페이지 새로고침 등으로 이미 child가 생성된 경우를 처리.
      // 향후 multi-child 지원 시: 단건 upsert가 아니라 명시적 INSERT만 허용으로 변경.
      const existingChild = await getFirstActiveChild(parentId);

      if (existingChild) {
        // 이미 child가 있으면 폼 데이터로 UPDATE (온보딩 재진입 방어)
        const { error: updateErr } = await supabase
          .from("child")
          .update({
            name:         childName.trim(),
            grade_level:  gradeLevel,   // 005 신규
            school_grade: schoolGrade,  // 하위호환 병행 저장
            interests:    interests,
          })
          .eq("id", existingChild.id)
          .eq("parent_id", parentId); // 소유권 검증
        if (updateErr) throw updateErr;
      } else {
        // ── 신규 child 생성 전 plan 한도 확인 ──────────────────
        // child_limit은 subscription_plan 테이블이 source of truth.
        // 향후 plan tier별(family/family_plus) 복수 자녀 허용 시 이 분기가 그대로 활용됨.
        const { allowed, limit } = await canAddChild(parentId);
        if (!allowed) {
          setError(`현재 플랜에서는 자녀를 최대 ${limit}명까지 등록할 수 있어요.`);
          return;
        }

        const { error: childErr } = await supabase.from("child").insert({
          parent_id:    parentId,
          name:         childName.trim(),
          grade_level:  gradeLevel,   // 005 신규
          school_grade: schoolGrade,  // 하위호환 병행 저장
          interests:    interests,
        });
        if (childErr) throw childErr;
      }

      // 2. onboarding_status 완료 처리
      await completeParentOnboarding(parentId);

      // 3. 회원가입 시 localStorage에 임시 저장해 둔 display_name을 DB에 flush.
      //    (한글 이름을 signup 직후 PATCH하지 않고 여기서 처리 — ISO-8859-1 오류 방지)
      await flushPendingProfile("parent", parentId);

      router.replace("/parent/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isValid = !!childName.trim() && !!gradeLevel;

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-white min-h-screen flex flex-col">

        {/* 헤더 */}
        <div className="px-6 pt-10 pb-2">
          <p className="text-xs font-semibold" style={{ color: "#E84B2E" }}>
            학부모 온보딩
          </p>
          <h1 className="mt-1 text-2xl font-bold text-base-text leading-tight">
            자녀 프로필을 만들어요
          </h1>
          <p className="mt-1.5 text-sm text-base-muted">
            자녀의 정보를 입력하면 맞춤 진로 탐색이 시작돼요.
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="flex-1 px-6 pt-6 pb-10 flex flex-col gap-6">

          {/* 자녀 이름 */}
          <div>
            <label className="block text-sm font-semibold text-base-text mb-2">
              자녀 이름
            </label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="이름을 입력해 주세요"
              required
              className="
                w-full px-4 py-3 rounded-button border border-base-border
                text-sm text-base-text bg-white
                focus:outline-none focus:border-brand-red transition-colors
                placeholder:text-base-muted
              "
            />
          </div>

          {/* 학년 */}
          <div>
            <label className="block text-sm font-semibold text-base-text mb-2">
              학년
            </label>
            <div className="grid grid-cols-6 gap-2">
              {GRADES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGradeLevel(value)}
                  className={`
                    py-2.5 rounded-button text-sm font-medium border transition-all
                    ${gradeLevel === value
                      ? "border-brand-red text-brand-red font-semibold bg-brand-light"
                      : "border-base-border text-base-text bg-white hover:border-brand-red"}
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 관심 분야 */}
          <div>
            <label className="block text-sm font-semibold text-base-text mb-1">
              관심 분야{" "}
              <span className="text-xs font-normal text-base-muted">
                (복수 선택 가능)
              </span>
            </label>
            <p className="text-xs text-base-muted mb-3">
              나중에 언제든 바꿀 수 있어요.
            </p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((field) => {
                const selected = interests.includes(field);
                return (
                  <button
                    key={field}
                    type="button"
                    onClick={() => toggleInterest(field)}
                    className={`
                      flex items-center gap-1.5 px-4 py-2 rounded-full
                      text-sm font-medium border transition-all
                      ${selected
                        ? "border-brand-red text-brand-red bg-brand-light"
                        : "border-base-border text-base-text bg-white hover:border-brand-red"}
                    `}
                  >
                    {selected && <Check size={13} strokeWidth={2.5} />}
                    {INTEREST_LABEL[field]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 에러 */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-button">
              {error}
            </p>
          )}

          {/* 제출 */}
          <div className="mt-auto">
            <button
              type="submit"
              disabled={!isValid || loading}
              className="
                w-full py-3.5 rounded-button text-sm font-bold text-white
                disabled:opacity-40 transition-opacity
              "
              style={{ backgroundColor: "#E84B2E" }}
            >
              {loading ? "저장 중..." : "완료 — 시작하기"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
