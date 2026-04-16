"use client";

// ====================================================
// 관리자 직업 동기화 페이지 (/admin/sync-careers)
//
// [용도]
//   커리어넷 API → Supabase occupations/missions 수동 동기화
//
// [전제조건]
//   1. NEXT_PUBLIC_CAREER_API_KEY 환경변수 등록
//   2. supabase/migrations/014_occupations_missions.sql 실행 완료
//
// [보안]
//   ⚠ MVP에서는 URL 직접 접근 방식 — 베타 이후 인증 추가 필요
// ====================================================

import { useState } from "react";
import { syncCareerJobs, type SyncResult } from "@/lib/careerapi-sync";

type SyncStatus = "idle" | "running" | "done" | "error";

export default function SyncCareersPage() {
  const [status, setStatus]     = useState<SyncStatus>("idle");
  const [result, setResult]     = useState<SyncResult | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_CAREER_API_KEY;

  const handleSync = async () => {
    setStatus("running");
    setResult(null);
    try {
      const res = await syncCareerJobs();
      setResult(res);
      setStatus(res.errors.length > 0 ? "error" : "done");
    } catch (err) {
      setResult({
        occupationsUpserted: 0,
        missionsCreated:     0,
        errors:              [String(err)],
      });
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile px-4 py-8">

        <h1 className="text-xl font-bold text-base-text mb-1">
          커리어넷 직업 동기화
        </h1>
        <p className="text-sm text-base-muted mb-6">
          커리어넷 API에서 직업 목록을 가져와 Supabase에 저장합니다.
        </p>

        {/* API 키 상태 */}
        <div className="card mb-4">
          <p className="text-sm font-semibold text-base-text mb-2">
            환경변수 상태
          </p>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: apiKey ? "#4CAF50" : "#E84B2E" }}
            />
            <span className="text-xs text-base-muted">
              NEXT_PUBLIC_CAREER_API_KEY:{" "}
              <span className={apiKey ? "text-status-success font-semibold" : "text-brand-red font-semibold"}>
                {apiKey ? "등록됨" : "미등록 ⚠"}
              </span>
            </span>
          </div>
          {!apiKey && (
            <p className="text-xs text-base-muted mt-2 leading-relaxed">
              발급: https://www.career.go.kr/cnet/openapi/introduce.do
              <br />
              등록: .env.local + Vercel Dashboard → Environment Variables
            </p>
          )}
        </div>

        {/* 동기화 버튼 */}
        <button
          onClick={handleSync}
          disabled={status === "running" || !apiKey}
          className="w-full rounded-button py-3.5 text-sm font-bold text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "#E84B2E" }}
        >
          {status === "running" ? "동기화 중..." : "직업 동기화 실행"}
        </button>

        {/* 결과 */}
        {result && (
          <div className="card mt-4">
            <p className="text-sm font-bold text-base-text mb-3">
              {status === "done" ? "✅ 동기화 완료" : "⚠ 동기화 완료 (일부 오류)"}
            </p>
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-base-muted">직업 upsert</span>
                <span className="font-semibold text-base-text">
                  {result.occupationsUpserted}개
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-muted">기본 미션 생성</span>
                <span className="font-semibold text-base-text">
                  {result.missionsCreated}개
                </span>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mt-3 pt-3 border-t border-base-border">
                <p className="text-xs font-semibold text-brand-red mb-1">오류 목록</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-base-muted leading-relaxed">
                    • {e}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
