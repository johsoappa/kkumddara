import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ====================================================
// Tailwind 클래스 병합 유틸리티
// 사용법: cn("기본클래스", 조건 && "조건부클래스")
// ====================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
