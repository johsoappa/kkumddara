"use client";

// ====================================================
// 학생 "내 활동" 섹션 컴포넌트
//
// 자녀가 본인이 완료한 미션과 이어서 할 활동을 확인하는 자녀 전용 UI.
// 부모 주간 리포트(/report)와 분리된, 평가/분석이 아닌 활동 기록 중심 화면.
//
// 데이터 소스 (신규 DB/저장 로직 없음, 기존 데이터만 사용):
//   - roadmap_progress.checked_missions → 완료 미션 ID 집합
//   - occupation_student_actions / occupation_preparations(prep) → DB 미션 텍스트
//   - 정적 ROADMAPS fallback (DB miss 시)
//   - localStorage (DB 기록이 전혀 없을 때만 보조)
//
// student/home 의 completedMissionDetails 계산 로직을 이 컴포넌트로 통합해
// home / activity 간 중복 구현을 방지한다.
// ====================================================

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getRoadmap } from "@/data/roadmaps";

interface MissionDetail {
  id:         string;
  text:       string;
  stageTitle: string;
}

export default function StudentActivitySection() {
  const router = useRouter();

  const [loading, setLoading]             = useState(true);
  const [chosenRoadmapId, setChosen]      = useState<string | null>(null);
  const [completedMissions, setCompleted] = useState<string[]>([]);
  const [occupationName, setOccName]      = useState<string | null>(null);
  // DB Stage 1 미션 (prep + action). null=조회 전, []=DB miss(정적 fallback)
  const [dbMissions, setDbMissions]       = useState<MissionDetail[] | null>(null);

  // ── 데이터 로드 ───────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace("/"); return; }

        // student → child_id
        const { data: studentData } = await supabase
          .from("student")
          .select("child_id")
          .eq("user_id", user.id)
          .maybeSingle();

        let resolvedRoadmapId: string | null = null;

        // 선택된 로드맵 & 완료 미션 (DB 우선, localStorage 보조)
        if (studentData?.child_id) {
          const applyRoadmapData = (row: { occupation_id: string; checked_missions: unknown }) => {
            resolvedRoadmapId = row.occupation_id;
            setChosen(row.occupation_id);
            const m = (row.checked_missions ?? {}) as Record<string, boolean>;
            setCompleted(Object.keys(m).filter((k) => m[k]));
          };

          const { data: chosenData, error: chosenErr } = await supabase
            .from("roadmap_progress")
            .select("occupation_id, checked_missions")
            .eq("child_id", studentData.child_id)
            .order("chosen", { ascending: false })
            .order("last_visited_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!chosenErr && chosenData) {
            applyRoadmapData(chosenData);
          } else if (chosenErr) {
            // chosen 컬럼 미존재 등 → last_visited_at DESC fallback
            const { data: fallbackData } = await supabase
              .from("roadmap_progress")
              .select("occupation_id, checked_missions")
              .eq("child_id", studentData.child_id)
              .order("last_visited_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (fallbackData) applyRoadmapData(fallbackData);
          }
        }

        // localStorage fallback: DB에 로드맵 기록이 전혀 없을 때만
        if (!resolvedRoadmapId) {
          const localChosen = localStorage.getItem("kkumddara_chosen_roadmap");
          if (localChosen) {
            resolvedRoadmapId = localChosen;
            setChosen(localChosen);
            const localProgress = localStorage.getItem(`kkumddara_roadmap_${localChosen}`);
            if (localProgress) {
              try { setCompleted(JSON.parse(localProgress)); } catch { /* 파싱 실패 무시 */ }
            }
          }
        }

        // DB 미션(prep + action) + 직업명 조회, miss 시 정적 fallback
        if (resolvedRoadmapId) {
          // 정적 ROADMAPS에 직업명이 있으면 우선 사용
          const staticRoadmap = getRoadmap(resolvedRoadmapId);
          if (staticRoadmap?.occupationName) setOccName(staticRoadmap.occupationName);

          try {
            const { data: masterData } = await supabase
              .from("occupation_master")
              .select("id, name_ko")
              .eq("legacy_occupation_id", resolvedRoadmapId)
              .eq("is_active", true)
              .maybeSingle();

            if (masterData?.id) {
              if (masterData.name_ko) setOccName(masterData.name_ko as string);

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

              const prepMissions = (prepRows ?? []).map((r) => ({
                id:         `prep-${r.id}`,
                text:       r.content,
                stageTitle: "탐색하기",
              }));
              const actionMissions = (actionRows ?? []).map((r) => ({
                id:         `action-${r.id}`,
                text:       r.action_text,
                stageTitle: r.stage_title ?? "탐색하기",
              }));

              setDbMissions([...prepMissions, ...actionMissions]);
            } else {
              setDbMissions([]);
            }
          } catch (err) {
            setDbMissions([]);
            console.error("[student/activity] DB 미션 조회 오류:", err);
          }
        }
      } catch (err) {
        console.error("[student/activity] loadData 오류:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // ── 완료한 미션 상세 (최근 3개) ────────────────────────────
  // student/home 의 completedMissionDetails 와 동일 규칙
  const completedMissionDetails = useMemo<MissionDetail[]>(() => {
    if (!completedMissions.length || !chosenRoadmapId) return [];
    const completedSet = new Set(completedMissions);

    if (dbMissions && dbMissions.length > 0) {
      return dbMissions.filter((m) => completedSet.has(m.id)).slice(0, 3);
    }

    const roadmap = getRoadmap(chosenRoadmapId);
    if (!roadmap) return [];
    const all = roadmap.stages.flatMap((s) =>
      s.missions.map((m) => ({ id: m.id, text: m.text, stageTitle: s.title }))
    );
    return all.filter((m) => completedSet.has(m.id)).slice(0, 3);
  }, [completedMissions, chosenRoadmapId, dbMissions]);

  if (loading) {
    return (
      <div className="bg-white rounded-card-lg shadow-card px-4 py-8 text-center">
        <p className="text-sm text-base-muted">불러오는 중...</p>
      </div>
    );
  }

  // ── 완료한 미션 없음 ──────────────────────────────────────
  if (completedMissions.length === 0) {
    return (
      <div className="bg-white rounded-card-lg shadow-card px-4 py-6">
        <p className="text-sm font-bold text-base-text mb-1">
          아직 완료한 미션이 없어요.
        </p>
        <p className="text-xs text-base-muted leading-relaxed mb-3">
          관심 있는 직업을 골라 작은 미션부터 시작해볼까요?
        </p>
        <button
          onClick={() => router.push("/explore")}
          className="inline-flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-full"
          style={{ backgroundColor: "#FFF0EB", color: "#E84B2E" }}
        >
          직업 탐색하러 가기 <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  // ── 완료한 미션 있음 ──────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* 완료한 미션 요약 */}
      <div className="bg-white rounded-card-lg shadow-card overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-base-border">
          <p className="text-xs font-bold text-brand-red mb-1">완료한 미션</p>
          <p className="text-sm font-bold text-base-text">
            지금까지 {completedMissions.length}개의 미션을 완료했어요.
          </p>
          <p className="text-xs text-base-muted mt-0.5 leading-relaxed">
            작은 활동이 모이면 내가 좋아하는 일을 더 잘 알 수 있어요.
          </p>
          {occupationName && (
            <p className="text-xs text-base-muted mt-1.5">
              관심 직업: <span className="font-semibold text-base-text">{occupationName}</span>
            </p>
          )}
        </div>

        {completedMissionDetails.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-base-muted mb-2">최근 완료한 미션</p>
            <div className="flex flex-col gap-1.5">
              {completedMissionDetails.map((m) => (
                <div key={m.id} className="flex items-start gap-2">
                  <span className="text-xs mt-0.5" style={{ color: "#E84B2E" }}>✓</span>
                  <p className="text-xs text-base-text leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 다음 활동 */}
      <div className="bg-white rounded-card-lg shadow-card px-4 py-4">
        <p className="text-xs font-bold text-brand-red mb-3">다음 활동</p>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => router.push(chosenRoadmapId ? `/roadmap/${chosenRoadmapId}` : "/explore")}
            className="flex items-center justify-between w-full px-3.5 py-3 rounded-button text-left active:opacity-70 transition-opacity"
            style={{ backgroundColor: "#FFF0EB" }}
          >
            <span className="text-sm font-semibold" style={{ color: "#E84B2E" }}>
              로드맵 이어가기
            </span>
            <ChevronRight size={15} style={{ color: "#E84B2E" }} />
          </button>
          <button
            onClick={() => router.push("/explore")}
            className="flex items-center justify-between w-full px-3.5 py-3 rounded-button text-left bg-base-card active:opacity-70 transition-opacity"
          >
            <span className="text-sm font-semibold text-base-text">
              직업 탐색하러 가기
            </span>
            <ChevronRight size={15} className="text-base-muted" />
          </button>
        </div>
      </div>
    </div>
  );
}
