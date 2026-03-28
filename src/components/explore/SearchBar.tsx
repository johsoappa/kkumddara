"use client";

// ====================================================
// 직업 검색 바 컴포넌트
// ====================================================

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search
        size={17}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-muted pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="직업을 검색해보세요"
        className="
          w-full pl-10 pr-9 py-3
          bg-base-card rounded-card
          text-sm text-base-text
          placeholder:text-base-muted
          focus:outline-none focus:ring-2 focus:ring-brand-red/20
        "
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-base-muted"
          aria-label="검색어 지우기"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
