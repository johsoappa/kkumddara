// ====================================================
// webglSupport.ts — WebGL 지원 여부 감지 (브라우저 전용)
//
// [주의] 이 함수는 반드시 클라이언트에서만 호출한다. SSR 중 호출되면
//   document가 없어 예외가 발생하므로, 항상 ssr:false로 로드되는
//   Scene 컴포넌트 내부(XrSceneGuard 경유)에서만 호출해야 한다.
// ====================================================

// 지원 판정은 "성공"만 기억한다. XrSceneGuard는 렌더마다 이 함수를 부르는데, 매번 버려지는 캔버스에 WebGL
// 컨텍스트를 만들면 브라우저 한도(약 16개)에 가까워져 실제 장면의 컨텍스트가 먼저 밀려날 수 있다.
let supportedCache = false;

/** 현재 브라우저가 WebGL 렌더링을 지원하는지 여부를 확인한다(성공 결과는 재사용, 확인용 컨텍스트는 즉시 반납). */
export function isWebglSupported(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  if (supportedCache) return true;
  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
    if (context === null) return false;
    try {
      (context as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      // 반납 실패는 지원 여부 판정에 영향을 주지 않는다
    }
    supportedCache = true;
    return true;
  } catch {
    return false;
  }
}
