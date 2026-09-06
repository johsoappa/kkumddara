import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// G2.0 XR v0.3 — WebGL Guard/Fallback 단위·컴포넌트 테스트 전용 설정.
// 운영 빌드(next build)와 무관한 별도 테스트 러너다.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
