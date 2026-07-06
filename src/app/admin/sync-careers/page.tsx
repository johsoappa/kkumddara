// ====================================================
// 관리자 직업 동기화 페이지 (/admin/sync-careers)
//
// [상태] 임시 비활성화 — 무인증 노출 차단 (2026-07-06 보안 핫픽스)
//   admin 인증 체계가 없는 상태라 접근 시 404 처리한다.
//   복구 시점: admin role + 서버 전용 보호 라우트 설계 이후.
//   기존 동기화 UI는 git 이력(이 커밋 직전) 참조. 로직은 src/lib/careerapi-sync.ts에 유지.
// ====================================================

import { notFound } from "next/navigation";

export default function SyncCareersPage() {
  notFound();
}
