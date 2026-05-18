"use client";

// ====================================================
// 부모 리포트 화면 (/report)
// - 주간 요약 / Top3 직업 / 강점 / 미션 현황 / 성장 추이
// - 로드맵 미션 완료 데이터 실시간 연동
// - 섹션별 scroll fade-in 애니메이션
//
// [DB 전환 — 커밋 후 반영]
//   localStorage(kkumddara_onboarding / kkumddara_chosen_roadmap /
//               kkumddara_roadmap_{id}) 의존 제거.
//
//   데이터 소스:
//     userType         → student 테이블 row 존재 여부
//     chosenRoadmap    → roadmap_progress.chosen=true (child_id 기준)
//     checkedMissions  → roadmap_progress.checked_missions (JSONB)
//     occupationName   → occupation_master.name_ko
//     missions         → occupation_preparations(step_action) +
//                        occupation_student_actions(stage_number=1)
//                        (/roadmap/[occupationId] 와 동일 구조)
//
//   빈 상태 처리:
//     로그인 없음 / student·child 미연결 / roadmap 미선택 →
//     기존 "로드맵 없음" UX 유지, localStorage로 돌아가지 않음
// ====================================================

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import MissionStatus from "@/components/report/MissionStatus";
import { supabase } from "@/lib/supabase";
import type { MissionItem } from "@/types/report";

// ----------------------------------------
// 날짜 헬퍼
// ----------------------------------------
function getWeekLabel(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const week = Math.ceil(now.getDate() / 7);
  return `${year}년 ${month}월 ${week}주차`;
}

// ----------------------------------------
// Scroll fade-in 래퍼 컴포넌트
// ----------------------------------------
function FadeInSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ----------------------------------------
// 메인 컴포넌트
// ----------------------------------------
export default function ReportPage() {
  const router = useRouter();

  const [userType, setUserType]           = useState<"parent" | "student" | null>(null);
  const [missions, setMissions]           = useState<MissionItem[]>([]);
  const [occupationName, setOccupationName] = useState<string | null>(null);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // ── 1. 인증 확인 ─────────────────────────────────────
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // ── 2. userType 판단: student 테이블 row 존재 여부 ──
        //   student row 있음 → "student"
        //   student row 없음 → "parent" (parent 계정 또는 연결 전 상태)
        const { data: studentData } = await supabase
          .from("student")
          .select("child_id")
          .eq("user_id", user.id)
          .maybeSingle();

        const resolvedUserType: "parent" | "student" =
          studentData ? "student" : "parent";
        setUserType(resolvedUserType);

        // ── 3. child_id 결정 ──────────────────────────────────
        //   student → student.child_id 직접 사용
        //   parent  → parent.id → child 테이블에서 첫 번째 active child
        let resolvedChildId: string | null = null;

        if (resolvedUserType === "student") {
          resolvedChildId = studentData?.child_id ?? null;
        } else {
          // parent 흐름: parent.id → child 목록 첫 번째
          const { data: parentData } = await supabase
            .from("parent")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (parentData?.id) {
            const { data: childData } = await supabase
              .from("child")
              .select("id")
              .eq("parent_id", parentData.id)
              .eq("profile_status", "active")
              .order("created_at", { ascending: true })
              .limit(1)
              .maybeSingle();

            resolvedChildId = childData?.id ?? null;
          }
        }

        // child 연결 없음 → 빈 상태 유지
        if (!resolvedChildId) {
          setLoading(false);
          return;
        }

        // ── 4. roadmap_progress 조회 ─────────────────────────
        //   chosen=true 우선, last_visited_at DESC 로 1개 선택
        const { data: progressData, error: progressErr } = await supabase
          .from("roadmap_progress")
          .select("occupation_id, checked_missions")
          .eq("child_id", resolvedChildId)
          .order("chosen", { ascending: false })
          .order("last_visited_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // chosen 컬럼 오류 시 last_visited_at 단독 재시도 (student/home 패턴 동일)
        let occupationId: string | null = null;
        let checkedMissions: Record<string, boolean> = {};

        if (!progressErr && progressData) {
          occupationId   = progressData.occupation_id;
          checkedMissions = (progressData.checked_missions ?? {}) as Record<string, boolean>;
        } else if (progressErr) {
          console.warn("[report] chosen 정렬 오류, last_visited_at fallback:", progressErr.message);
          const { data: fallback } = await supabase
            .from("roadmap_progress")
            .select("occupation_id, checked_missions")
            .eq("child_id", resolvedChildId)
            .order("last_visited_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (fallback) {
            occupationId   = fallback.occupation_id;
            checkedMissions = (fallback.checked_missions ?? {}) as Record<string, boolean>;
          }
        }

        // 선택 직업 없음 → 빈 상태 유지
        if (!occupationId) {
          setLoading(false);
          return;
        }

        // ── 5. occupation_master 조회 (직업명) ───────────────
        //   occupation_id = legacy_occupation_id 로 조회
        //   (roadmap_progress.occupation_id = legacy_occupation_id 형식)
        const { data: masterData } = await supabase
          .from("occupation_master")
          .select("id, name_ko")
          .eq("legacy_occupation_id", occupationId)
          .eq("is_active", true)
          .maybeSingle();

        if (masterData?.name_ko) {
          setOccupationName(masterData.name_ko);
        }

        // occupation_master 매칭 실패 시 미션 없음 → 빈 상태 유지
        if (!masterData?.id) {
          setLoading(false);
          return;
        }

        // ── 6. 미션 목록 DB 구성 ──────────────────────────────
        //   /roadmap/[occupationId] 및 student/home 과 동일한 병렬 조회 구조:
        //     ① occupation_preparations(step_action) → prep-{uuid}
        //     ② occupation_student_actions(stage_number=1) → action-{uuid}
        const [{ data: prepRows }, { data: actionRows }] = await Promise.all([
          supabase
            .from("occupation_preparations")
            .select("id, content, display_order")
            .eq("occupation_id", masterData.id)
            .eq("is_current", true)
            .eq("status", "published")
            .eq("prep_type", "step_action")
            .order("display_order", { ascending: true }),
          supabase
            .from("occupation_student_actions")
            .select("id, action_text, stage_title, display_order")
            .eq("occupation_id", masterData.id)
            .eq("stage_number", 1)
            .eq("is_current", true)
            .eq("is_active", true)
            .eq("status", "published")
            .order("display_order", { ascending: true }),
        ]);

        // checked_missions key 체계: prep-{uuid}, action-{uuid}
        const prepMissions: MissionItem[] = (prepRows ?? []).map((r) => ({
          id:        `prep-${r.id}`,
          text:      r.content,
          completed: Boolean(checkedMissions[`prep-${r.id}`]),
        }));

        const actionMissions: MissionItem[] = (actionRows ?? []).map((r) => ({
          id:        `action-${r.id}`,
          text:      r.action_text,
          completed: Boolean(checkedMissions[`action-${r.id}`]),
        }));

        const allMissions = [...prepMissions, ...actionMissions];
        setMissions(allMissions);

      } catch (err) {
        console.error("[report] loadData 오류:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const subtitlePrefix = userType === "parent" ? "자녀의" : "나의";

  const handleShare = () => alert("카카오톡 공유 기능은 준비 중입니다. 😊");
  const handleSave  = () => alert("리포트 저장 기능은 준비 중입니다. 😊");

  // 로딩 중 최소 스켈레톤 (기존 UX 동일)
  if (loading) {
    return (
      <AppShell headerTitle="부모 리포트">
        <div className="px-4 pt-4 pb-6 flex flex-col gap-4">
          <div className="h-10 bg-base-border rounded-lg animate-pulse" />
          <div className="h-40 bg-base-border rounded-lg animate-pulse" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell headerTitle="부모 리포트">
      <div className="px-4 pt-4 pb-6 flex flex-col gap-4">

        {/* ① 헤더 정보 */}
        <FadeInSection delay={0}>
          <div>
            <p className="text-xs font-semibold text-brand-red mb-0.5">
              {getWeekLabel()}
            </p>
            <p className="text-sm text-base-muted">
              {subtitlePrefix} 이번 주 진로 탐색 리포트
              {occupationName && (
                <span className="font-semibold text-base-text">
                  {" "}— {occupationName}
                </span>
              )}
            </p>
          </div>
        </FadeInSection>

        {/* ② 이번 주 미션 현황 (DB 데이터 연동) */}
        <FadeInSection delay={60}>
          {missions.length > 0 ? (
            <MissionStatus missions={missions} />
          ) : (
            <div className="card text-center py-6">
              <p className="text-3xl mb-2">🗺️</p>
              <p className="text-sm text-base-muted">
                아직 진행 중인 로드맵이 없어요
              </p>
              <button
                onClick={() => router.push("/explore")}
                className="mt-3 text-sm font-semibold text-brand-red"
              >
                직업 탐색하러 가기 →
              </button>
            </div>
          )}
        </FadeInSection>

        {/* ③ 베타 안내 — 주간 요약·Top3·강점·성장추이·활동 제안은 데이터 준비 중 */}
        <FadeInSection delay={0}>
          <div className="card text-center py-8 px-4">
            <p className="text-3xl mb-3">📊</p>
            <p className="text-sm font-bold text-base-text mb-2">
              주간 리포트를 준비 중이에요
            </p>
            <p className="text-xs text-base-muted leading-relaxed">
              아직 리포트를 만들 만큼의 활동 데이터가 쌓이지 않았어요.
              <br />
              직업 탐색과 로드맵 미션을 진행하면
              <br />
              이곳에 주간 리포트가 표시됩니다.
            </p>
            <p className="text-[11px] text-base-muted mt-3 opacity-60">
              현재 화면은 베타 기간 중 준비 중인 리포트 영역입니다.
            </p>
          </div>
        </FadeInSection>

        {/* ⑨ 명따라 유도 버튼 — 학부모/비로그인만 표시, 학생은 숨김 */}
        {userType !== "student" && (
          <FadeInSection delay={0}>
            <button
              onClick={() => router.push("/myeonddara")}
              className="
                w-full py-4 rounded-button text-sm font-bold
                flex items-center justify-center gap-2
                active:opacity-80 transition-opacity
              "
              style={{ background: "linear-gradient(135deg, #1A3A6B, #2C5F8A)", color: "#fff" }}
            >
              ✨ 명따라로 더 깊이 분석해보기
            </button>
          </FadeInSection>
        )}

        {/* ⑩ 공유 / 저장 버튼 */}
        <FadeInSection delay={0}>
          <div className="flex flex-col gap-3 mt-2">
            <button
              onClick={handleShare}
              className="
                w-full py-4 rounded-button
                font-semibold text-sm
                flex items-center justify-center gap-2
                active:opacity-80 transition-opacity
              "
              style={{ backgroundColor: "#FEE500", color: "#3C1E1E" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9 0.5C4.029 0.5 0 3.643 0 7.5C0 10.003 1.548 12.205 3.9 13.5L3 17.5L7.2 14.877C7.789 14.959 8.39 15 9 15C13.971 15 18 11.866 18 8C18 4.134 13.971 0.5 9 0.5Z"
                  fill="#3C1E1E"
                />
              </svg>
              리포트 카카오톡 공유하기
            </button>
            <button onClick={handleSave} className="btn-primary">
              리포트 저장하기
            </button>
          </div>
        </FadeInSection>

        {/* ⑪ 의견 보내기 */}
        <FadeInSection delay={0}>
          <button
            onClick={() => router.push("/feedback")}
            className="
              w-full py-3 rounded-button text-sm font-semibold
              flex items-center justify-center gap-1.5
              border border-base-border text-base-muted
              hover:border-brand-red hover:text-brand-red
              active:opacity-70 transition-colors
            "
          >
            💬 의견 보내기
          </button>
        </FadeInSection>

      </div>
    </AppShell>
  );
}
