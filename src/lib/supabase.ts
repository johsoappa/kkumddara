// ====================================================
// Supabase 브라우저 클라이언트
// @supabase/ssr의 createBrowserClient 사용
// → 세션을 쿠키에도 저장 (middleware에서 읽기 가능)
// ====================================================

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ====================================================
// 타입 헬퍼 — 자주 쓰는 테이블 타입 단축키
// ====================================================
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertDTO<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateDTO<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
