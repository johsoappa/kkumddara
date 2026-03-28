// ====================================================
// Supabase 클라이언트 설정
// 사용법: import { supabase } from "@/lib/supabase"
// ====================================================

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Supabase 환경변수가 설정되지 않았습니다.\n" +
    ".env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 추가하세요."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    // 브라우저 localStorage에 세션 자동 저장
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ====================================================
// 타입 헬퍼 — 자주 쓰는 테이블 타입 단축키
// ====================================================
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertDTO<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateDTO<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
