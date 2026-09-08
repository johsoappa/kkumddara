"use client";

// ====================================================
// XR Chef 주방 씬 — v0.2 (R3F Canvas 본체)
//
// 방식 A: 기본 geometry 저폴리곤 주방 (외부 에셋/텍스처 없음)
//   - 대용량 GLB·고해상도 텍스처·애니메이션 사용 금지 (성능 검증 목적)
//   - Canvas는 고정 높이 박스 안에만 렌더링 → 페이지 스크롤/버튼 터치 방해 없음
//
// v0.2 추가:
//   - stage props에 따라 CameraRig가 카메라를 이동 (v0.2: 즉시 스냅 /
//     G2.1-R1: 아래 참고 — 감쇠 보간으로 교체)
//     Canvas camera prop은 초기값 전용이라 마운트 후 변경이 반영되지 않으므로,
//     useThree()로 camera를 얻어 매 프레임 좌표를 갱신한다
//   - showPlate props로 조리대 위 접시 1개 표시 (mesh 단위 조건부 —
//     Canvas 재마운트 아님)
//
// G2.1 추가: WebGL 미지원/Canvas 오류 시 공용 XrSceneGuard가 이 Canvas
//   영역만 정적 텍스트 패널로 대체한다 (선택/결과 로직은 XrChefClient에
//   있으므로 영향 없음).
//
// G2.1-R1 추가 — 인캔버스 직접 조작 전환:
//   - CameraRig: useLayoutEffect 즉시 스냅 → useFrame 지수 감쇠 보간으로
//     교체(작업지시 "클릭 후 카메라가 자연스럽게 이동" 요구 반영).
//     stage prop 트리거 방식은 그대로라 Canvas 재마운트 없음 불변조건 유지.
//   - interactionKind/choices/onChoice가 전달되면 SceneInteractions가
//     씬 안에 클릭·드래그 가능한 실제 타겟을 렌더링한다. onChoice는
//     XrChefClient의 handleChoice를 가공 없이 그대로 관통시킨 값이므로
//     이 파일에서 선택 잠금/analytics를 절대 복제하지 않는다.
//   - onSceneError: Canvas 런타임 오류 시 상위에 알려 HTML fallback으로
//     즉시 전환할 수 있게 하는 선택적 콜백 (XrSceneGuard로 그대로 전달).
// ====================================================

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { Mesh, MeshStandardMaterial } from "three";
import type { Choice, CameraStage, InteractionKind } from "./scenario";
import { easeAlpha, easeVec3, type Vec3 } from "./interactions3d";
import SceneInteractions from "./SceneInteractions";
import XrSceneGuard from "../XrSceneGuard";
import XrScenePlaceholder from "../XrScenePlaceholder";

export interface ChefSceneProps {
  stage: CameraStage;
  showPlate: boolean;
  /** null/[]이면 씬은 지금처럼 배경으로만 존재(인트로·리액션·결과 단계) */
  sceneInteractionId?: string | null;
  interactionKind?: InteractionKind | null;
  choices?: Choice[];
  onChoice?: (choice: Choice) => void;
  /** Canvas 런타임 오류 시 상위(XrChefClient)에 1회 알림 — 선택적, 하위호환 */
  onSceneError?: () => void;
}

const CAMERA_EASE_HALF_LIFE = 0.35;

// 단계별 카메라 좌표 테이블 (position + lookAt 쌍)
// 조리대(중심 [0, 1, -1.2])가 항상 프레임에 들어오도록 이동 폭은 보수적으로 유지
const CAMERA_STAGES: Record<
  CameraStage,
  { position: [number, number, number]; lookAt: [number, number, number] }
> = {
  // 주방 전체 기본 시점 (intro) — v0.1 초기 시점과 동일한 위치
  overview: { position: [0, 1.8, 3.2], lookAt: [0, 1.1, -1.2] },
  // 지점1: 조리대 쪽으로 약간 접근 — 작업 시작 느낌
  approach: { position: [0, 1.6, 2.3], lookAt: [0, 1.0, -1.2] },
  // 지점2: 조리대 아래·측면 쪽 — 무언가 찾는 느낌
  // (뒤로·위로 소폭 물리고 시선을 중앙 우측으로 — 도마[x=0.8]가 프레임에 들어오게.
  //  overview[y=1.8]보다 낮은 측면 시점은 유지)
  search: { position: [-1.0, 1.4, 2.1], lookAt: [0.2, 0.8, -1.2] },
  // 지점3: 살짝 뒤로 물러나 조리대 전체 — 상황을 살피는 느낌
  survey: { position: [0, 2.1, 3.6], lookAt: [0, 1.0, -1.2] },
  // 지점4·5: 조리대 위 접시 쪽으로 근접 — 마무리 작업 느낌
  plating: { position: [0.4, 1.6, 0.6], lookAt: [0.1, 1.05, -1.1] },
  // G2.1 추가 — 결과 화면 전용, 완성된 접시와 전달대 쪽을 비추는 축하 연출
  celebrate: { position: [0.6, 1.5, 1.4], lookAt: [0.3, 1.05, -0.6] },
};

// 카메라 이동 담당 — Canvas 내부에서만 사용 (재마운트 없이 좌표만 변경).
// G2.1-R1: stage가 바뀔 때마다 목표 좌표로 순간 이동하지 않고, 프레임마다
// 목표에 지수 감쇠로 접근한다(half-life 기반 — 프레임레이트 독립적).
// 초기 카메라 위치(Canvas camera prop)가 이미 overview와 같아 첫 진입 시
// 눈에 띄는 글라이드는 없다.
function CameraRig({ stage }: { stage: CameraStage }) {
  const camera = useThree((state) => state.camera);
  const lookAtRef = useRef<Vec3>(CAMERA_STAGES.overview.lookAt);

  useFrame((_, delta) => {
    const { position, lookAt } = CAMERA_STAGES[stage];
    const alpha = easeAlpha(delta, CAMERA_EASE_HALF_LIFE);
    camera.position.set(
      camera.position.x + (position[0] - camera.position.x) * alpha,
      camera.position.y + (position[1] - camera.position.y) * alpha,
      camera.position.z + (position[2] - camera.position.z) * alpha,
    );
    lookAtRef.current = easeVec3(lookAtRef.current, lookAt, alpha);
    camera.lookAt(lookAtRef.current[0], lookAtRef.current[1], lookAtRef.current[2]);
  });

  return null;
}

// 접시 — 지점3 이후 조리대 위에 등장하는 소품.
// G2.1 추가: 완성 반짝임 — 얇은 링 하나에 emissive 펄스만 주는 저비용 효과
function Plate() {
  const highlightRef = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const material = highlightRef.current?.material as MeshStandardMaterial | undefined;
    if (material) {
      material.opacity = 0.25 + Math.abs(Math.sin(clock.elapsedTime * 2)) * 0.5;
    }
  });
  return (
    <group>
      <mesh position={[0.1, 1.09, -1.0]}>
        <cylinderGeometry args={[0.3, 0.25, 0.05, 20]} />
        <meshStandardMaterial color="#f5f2ea" />
      </mesh>
      <mesh ref={highlightRef} position={[0.1, 1.12, -1.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.34, 24]} />
        <meshStandardMaterial
          color="#ffe9a8"
          transparent
          opacity={0.4}
          emissive="#ffd166"
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  );
}

// G2.1 추가 — 주문표: 주방장 옆 게시판 + 새 주문 알림 표시등(깜빡임)
function OrderBoard() {
  const lightRef = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const material = lightRef.current?.material as MeshStandardMaterial | undefined;
    if (material) {
      material.emissiveIntensity = 0.6 + Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.8;
    }
  });
  return (
    <group position={[-1.9, 1.6, -1.6]} rotation={[0, 0.5, 0]}>
      <mesh>
        <boxGeometry args={[0.9, 0.7, 0.05]} />
        <meshStandardMaterial color="#3f4a52" />
      </mesh>
      <mesh position={[0, 0.05, 0.03]}>
        <planeGeometry args={[0.7, 0.45]} />
        <meshStandardMaterial color="#fbf8f2" />
      </mesh>
      <mesh ref={lightRef} position={[0.32, 0.28, 0.04]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#ff6b57" emissive="#ff6b57" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
        <meshStandardMaterial color="#5a4b3a" />
      </mesh>
    </group>
  );
}

// G2.1 추가 — 동료 요리사: 기본 도형 조합(원통 몸+구 머리+모자)의 저폴리 캐릭터.
// 외부 3D 에셋 사용 금지 원칙에 따라 geometry 조합만으로 구성한다.
function Colleague() {
  return (
    <group position={[-1.5, 0, -1.6]} rotation={[0, 0.6, 0]}>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.26, 0.3, 0.9, 12]} />
        <meshStandardMaterial color="#f4f1ea" />
      </mesh>
      <mesh position={[0, 0.6, 0.2]}>
        <boxGeometry args={[0.4, 0.55, 0.04]} />
        <meshStandardMaterial color="#c1462f" />
      </mesh>
      <mesh position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#e8b98c" />
      </mesh>
      <mesh position={[0, 1.62, 0]}>
        <cylinderGeometry args={[0.2, 0.16, 0.22, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 1.76, 0]}>
        <sphereGeometry args={[0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

// G2.1 추가 — 재료 보관대: 선반 + 색색의 보관함 (3.1 팔레트: 크림/토마토레드/버터옐로/청록)
function StorageRack() {
  const boxColors = ["#d94f3c", "#e7b23c", "#3f9c96", "#f2e4c4"];
  return (
    <group position={[1.9, 0, -2]}>
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.9, 0.06, 0.5]} />
        <meshStandardMaterial color="#8a6f4d" />
      </mesh>
      <mesh position={[-0.38, 0.42, 0]}>
        <boxGeometry args={[0.08, 0.85, 0.08]} />
        <meshStandardMaterial color="#6b5539" />
      </mesh>
      <mesh position={[0.38, 0.42, 0]}>
        <boxGeometry args={[0.08, 0.85, 0.08]} />
        <meshStandardMaterial color="#6b5539" />
      </mesh>
      {boxColors.map((color, index) => (
        <mesh key={color} position={[-0.32 + index * 0.22, 0.98, 0]}>
          <boxGeometry args={[0.18, 0.2, 0.18]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

// G2.1 추가 — 접시 전달대: 완성된 접시를 손님 쪽으로 내보내는 별도 카운터
function DeliveryCounter() {
  return (
    <group position={[0.9, 0, 0.9]} rotation={[0, -0.3, 0]}>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.1, 0.9, 0.5]} />
        <meshStandardMaterial color="#e8c76a" />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[1.15, 0.06, 0.55]} />
        <meshStandardMaterial color="#fbf3df" />
      </mesh>
    </group>
  );
}

// G2.1 추가 — 냄비 위 수증기: 외부 파티클 라이브러리 없이 useFrame으로 상승+페이드만 반복
function Steam() {
  const meshRef = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = (clock.elapsedTime % 2) / 2;
    mesh.position.y = 1.55 + t * 0.5;
    const material = mesh.material as MeshStandardMaterial;
    material.opacity = 0.5 * (1 - t);
  });
  return (
    <mesh ref={meshRef} position={[-0.9, 1.55, -1.2]}>
      <sphereGeometry args={[0.14, 10, 10]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0.4} />
    </mesh>
  );
}

function Kitchen() {
  return (
    <group>
      {/* 바닥 */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#d9c9a8" />
      </mesh>

      {/* 뒷벽 */}
      <mesh position={[0, 2, -3]}>
        <planeGeometry args={[10, 4.2]} />
        <meshStandardMaterial color="#f3ede2" />
      </mesh>

      {/* 조리대 */}
      <mesh position={[0, 0.5, -1.2]}>
        <boxGeometry args={[4, 1, 1.2]} />
        <meshStandardMaterial color="#8a6f4d" />
      </mesh>
      {/* 조리대 상판 */}
      <mesh position={[0, 1.02, -1.2]}>
        <boxGeometry args={[4.1, 0.08, 1.3]} />
        <meshStandardMaterial color="#e8e4dc" />
      </mesh>

      {/* 냄비 (몸통 + 손잡이) */}
      <mesh position={[-0.9, 1.25, -1.2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.35, 16]} />
        <meshStandardMaterial color="#5a5f66" />
      </mesh>
      <mesh position={[-0.45, 1.3, -1.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
        <meshStandardMaterial color="#3b3f45" />
      </mesh>

      {/* 도마 */}
      <mesh position={[0.8, 1.09, -1.1]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.9, 0.05, 0.5]} />
        <meshStandardMaterial color="#c79a63" />
      </mesh>

      {/* 상부장 */}
      <mesh position={[0, 3, -2.6]}>
        <boxGeometry args={[4, 0.9, 0.7]} />
        <meshStandardMaterial color="#a68a68" />
      </mesh>

      {/* 후드 */}
      <mesh position={[0, 2.2, -1.2]}>
        <boxGeometry args={[1.4, 0.5, 0.8]} />
        <meshStandardMaterial color="#9aa0a6" />
      </mesh>

      {/* G2.1 — 씬 필수 요소: 주문표/동료/보관대/전달대/수증기 */}
      <OrderBoard />
      <Colleague />
      <StorageRack />
      <DeliveryCounter />
      <Steam />
    </group>
  );
}

export default function ChefScene({
  stage,
  showPlate,
  sceneInteractionId,
  interactionKind,
  choices,
  onChoice,
  onSceneError,
}: ChefSceneProps) {
  // choices가 undefined일 수 있어 매 렌더 새 배열을 만들지 않도록 메모이즈
  const resolvedChoices = useMemo(() => choices ?? [], [choices]);

  return (
    <XrSceneGuard
      onSceneError={onSceneError}
      fallback={
        <XrScenePlaceholder message="지금 화면에서는 그림 대신 글로 주방 체험을 이어가요." />
      }
    >
      <div className="h-[60vh] w-full touch-none overflow-hidden rounded-xl bg-[#efe9dd]">
        <Canvas
          camera={{ position: [0, 1.8, 3.2], fov: 55 }}
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "low-power" }}
        >
          <CameraRig stage={stage} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[3, 5, 4]} intensity={1.1} />
          <Kitchen />
          {showPlate && <Plate />}
          {sceneInteractionId && interactionKind && onChoice && (
            <SceneInteractions
              sceneInteractionId={sceneInteractionId}
              interactionKind={interactionKind}
              choices={resolvedChoices}
              onChoice={onChoice}
            />
          )}
        </Canvas>
      </div>
    </XrSceneGuard>
  );
}
