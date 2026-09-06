import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// 렌더 간 DOM 누적으로 인한 "여러 요소 발견" 오탐을 막기 위해
// 매 테스트 후 명시적으로 언마운트한다.
afterEach(() => {
  cleanup();
});
