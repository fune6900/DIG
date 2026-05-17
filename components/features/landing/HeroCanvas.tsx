"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// ジオメトリ生成: 「D」の輪郭を 2D Shape で定義し ExtrudeGeometry で押し出す。
// 文字フォントの D を SVG パス相当でベジエ曲線で近似している。
// ---------------------------------------------------------------------------
function buildDShape(): THREE.Shape {
  const shape = new THREE.Shape();

  // 外形（左下から時計回り）
  shape.moveTo(-0.55, -1);
  shape.lineTo(0.1, -1);
  shape.bezierCurveTo(0.95, -1, 1.3, -0.55, 1.3, 0);
  shape.bezierCurveTo(1.3, 0.55, 0.95, 1, 0.1, 1);
  shape.lineTo(-0.55, 1);
  shape.lineTo(-0.55, -1);

  // 内側（D のカウンター）を hole として
  const hole = new THREE.Path();
  hole.moveTo(-0.2, -0.65);
  hole.lineTo(0.05, -0.65);
  hole.bezierCurveTo(0.55, -0.65, 0.75, -0.35, 0.75, 0);
  hole.bezierCurveTo(0.75, 0.35, 0.55, 0.65, 0.05, 0.65);
  hole.lineTo(-0.2, 0.65);
  hole.lineTo(-0.2, -0.65);
  shape.holes.push(hole);

  return shape;
}

// ---------------------------------------------------------------------------
// シャベルの 2D 輪郭。柄（細い縦棒）+ ブレード（下向き台形 + 先端三角）。
// D の前面に少し小さめに配置する想定で原点周りに収める。
// ---------------------------------------------------------------------------
function buildShovelShape(): THREE.Shape {
  const shape = new THREE.Shape();

  // 柄の上端中央から開始（時計回り）
  shape.moveTo(-0.04, 0.95);
  shape.lineTo(0.04, 0.95);
  shape.lineTo(0.04, -0.1); // 柄の下端（ブレード境界）
  shape.lineTo(0.22, -0.2); // ブレード右肩
  shape.lineTo(0.18, -0.7); // ブレード右下
  shape.lineTo(0, -0.95); // ブレード先端
  shape.lineTo(-0.18, -0.7); // ブレード左下
  shape.lineTo(-0.22, -0.2); // ブレード左肩
  shape.lineTo(-0.04, -0.1); // 柄の下端
  shape.lineTo(-0.04, 0.95);

  return shape;
}

const EXTRUDE_SETTINGS: THREE.ExtrudeGeometryOptions = {
  depth: 0.25,
  bevelEnabled: true,
  bevelThickness: 0.02,
  bevelSize: 0.02,
  bevelSegments: 2,
  curveSegments: 24,
};

interface DigShovelMarkProps {
  /** スクロール進行度 (0..1)。回転速度に微弱に反映する */
  scrollProgress?: number;
}

function DigShovelMark({ scrollProgress = 0 }: DigShovelMarkProps) {
  const groupRef = useRef<THREE.Group>(null);

  const dGeometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(buildDShape(), EXTRUDE_SETTINGS);
    geo.center();
    return geo;
  }, []);

  const shovelGeometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(buildShovelShape(), EXTRUDE_SETTINGS);
    geo.center();
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // 基本の自転 + スクロール進行で少しスピードアップ
    groupRef.current.rotation.y += delta * (0.25 + scrollProgress * 0.4);
    groupRef.current.rotation.x =
      Math.sin(performance.now() / 3500) * 0.08 + scrollProgress * 0.15;
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={dGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#f8f4ed"
          metalness={0.15}
          roughness={0.55}
        />
      </mesh>
      <mesh
        geometry={shovelGeometry}
        position={[0.05, -0.05, 0.18]}
        scale={[0.65, 0.65, 1]}
        castShadow
      >
        <meshStandardMaterial
          color="#c0392b"
          metalness={0.2}
          roughness={0.45}
        />
      </mesh>
    </group>
  );
}

interface HeroCanvasProps {
  scrollProgress?: number;
}

/**
 * トップ LP の HERO に重ねる 3D シーン。R3F で薄く包む。
 * 親 (HeroCanvasLazy) が IntersectionObserver と reduced-motion を見て
 * このコンポーネントの mount を制御する。
 */
export function HeroCanvas({ scrollProgress = 0 }: HeroCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.6], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.35} color="#f8f4ed" />
      <directionalLight position={[3, 4, 5]} intensity={1.1} color="#f8f4ed" />
      <directionalLight
        position={[-4, -2, -3]}
        intensity={0.5}
        color="#4a6fa5"
      />
      <DigShovelMark scrollProgress={scrollProgress} />
    </Canvas>
  );
}
