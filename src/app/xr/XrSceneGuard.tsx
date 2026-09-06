"use client";

// ====================================================
// XrSceneGuard — 요리사·수의사 공용 WebGL Guard/Fallback
//
// 이 컴포넌트 하나를 두 직업이 그대로 가져다 쓴다 (직업별 복제 금지).
// 항상 ssr:false로 로드되는 Scene 모듈(ChefScene/VetScene) 내부에서만
// 사용해야 한다 — isWebglSupported()가 브라우저 API를 호출하기 때문.
//
// 2단 방어:
//   1) 마운트 전 WebGL 지원 여부를 1회 확인 — 미지원이면 Canvas를
//      아예 시도하지 않고 바로 fallback을 그린다.
//   2) 그래도 Canvas 마운트/렌더 중 예외가 나면(예: 컨텍스트 생성 실패)
//      React 표준 에러 바운더리(getDerivedStateFromError)로 잡아
//      동일한 fallback으로 전환한다.
//      (@react-three/fiber의 Canvas는 자식에서 던진 에러를 내부에서
//       잡았다가 상위로 다시 throw하도록 구현되어 있어, 바깥의 일반
//       React 에러 바운더리가 이를 안전하게 캐치한다.)
// ====================================================

import { Component, type ReactNode } from "react";
import { isWebglSupported } from "./webglSupport";

interface CanvasErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface CanvasErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export interface XrSceneGuardProps {
  children: ReactNode;
  fallback: ReactNode;
}

export default function XrSceneGuard({ children, fallback }: XrSceneGuardProps) {
  if (!isWebglSupported()) {
    return <>{fallback}</>;
  }
  return <CanvasErrorBoundary fallback={fallback}>{children}</CanvasErrorBoundary>;
}
