// ====================================================
// Supabase 브라우저 클라이언트
// @supabase/ssr의 createBrowserClient 사용
// → 세션을 쿠키에도 저장 (middleware에서 읽기 가능)
// ====================================================

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// cookieEncoding: "base64url" — 세션 JSON을 쿠키에 항상 base64url 인코딩으로 저장.
// 기본값(raw)으로 두면 단일 청크 세션이 원본 JSON으로 cookie 값에 들어가고,
// 이후 Cookie 헤더 전송 시 비-ASCII 문자(한글 등)가 포함될 때
// "String contains non ISO-8859-1 code point" 오류가 발생할 수 있다.
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { cookieEncoding: "base64url" }
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
