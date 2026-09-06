// ====================================================
// webglSupport.ts — WebGL 지원 여부 감지 (브라우저 전용)
//
// [주의] 이 함수는 반드시 클라이언트에서만 호출한다. SSR 중 호출되면
//   document가 없어 예외가 발생하므로, 항상 ssr:false로 로드되는
//   Scene 컴포넌트 내부(XrSceneGuard 경유)에서만 호출해야 한다.
// ====================================================

/** 현재 브라우저가 WebGL 렌더링을 지원하는지 여부를 1회성으로 확인한다. */
export function isWebglSupported(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
    return context !== null;
  } catch {
    return false;
  }
}
