"use client";

// F9: 오버레이 핀(DOM)의 화면 좌표를 매 프레임 갱신한다. 카메라가 단계마다 이동하고
// FOV·거리까지 보정하므로(CameraRig) 핀 위치는 고정 픽셀이 아니라 "지금 카메라"로
// 월드 좌표를 투영해야 한다. React state를 거치지 않고 요소 style만 직접 쓴다.
// CameraRig보다 뒤에서 실행되도록 Canvas 안에서 CameraRig 다음에 둔다.
// (ChefScene에서 분리: R3F를 목킹해 매 프레임 applyPinProjection 호출을 테스트로 고정하기 위함)

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import type { TargetPinSpec } from "./interactions3d";
import { applyPinProjection, type PinRegistry } from "./ChefTargetPins";

export default function ChefPinProjector({
  pins,
  registry,
}: {
  pins: TargetPinSpec[];
  registry: PinRegistry;
}) {
  const scratch = useMemo(() => new Vector3(), []);
  useFrame(({ camera, size }) => {
    camera.updateMatrixWorld();
    applyPinProjection(pins, registry, size, (world) => {
      scratch.set(world[0], world[1], world[2]).project(camera);
      return { x: scratch.x, y: scratch.y, z: scratch.z };
    });
  });
  return null;
}
