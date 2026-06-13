'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Satellite } from '@/data/satellites';
import TrajectoryOverlay from './TrajectoryOverlay';

// ─────────────────────────────────────────────────────────────
//  Seeded PRNG (same LCG as satellites.ts — keeps geometry deterministic)
// ─────────────────────────────────────────────────────────────
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─────────────────────────────────────────────────────────────
//  Materials
// ─────────────────────────────────────────────────────────────
function bodyMaterial(color: string, emissiveIntensity = 0.2) {
  return (
    <meshStandardMaterial
      color="#c8cdd8"
      metalness={0.7}
      roughness={0.3}
      emissive={color}
      emissiveIntensity={emissiveIntensity}
    />
  );
}

function panelMaterial(color: string) {
  return (
    <meshStandardMaterial
      color="#112244"
      metalness={0.4}
      roughness={0.6}
      emissive={color}
      emissiveIntensity={0.08}
    />
  );
}

// ─────────────────────────────────────────────────────────────
//  Shape: RECTANGULAR  (radar / EO satellite with solar wings)
// ─────────────────────────────────────────────────────────────
function RectangularSat({ color }: { color: string }) {
  return (
    <group>
      {/* Main bus */}
      <mesh>
        <boxGeometry args={[2, 2, 3]} />
        {bodyMaterial(color)}
      </mesh>

      {/* Left solar panel */}
      <mesh position={[-3, 0, 0]}>
        <boxGeometry args={[4, 0.05, 1.2]} />
        {panelMaterial(color)}
      </mesh>
      {/* Right solar panel */}
      <mesh position={[3, 0, 0]}>
        <boxGeometry args={[4, 0.05, 1.2]} />
        {panelMaterial(color)}
      </mesh>

      {/* Panel wireframe overlays */}
      <mesh position={[-3, 0.04, 0]}>
        <boxGeometry args={[4, 0.05, 1.2]} />
        <meshBasicMaterial color={color} wireframe opacity={0.25} transparent />
      </mesh>
      <mesh position={[3, 0.04, 0]}>
        <boxGeometry args={[4, 0.05, 1.2]} />
        <meshBasicMaterial color={color} wireframe opacity={0.25} transparent />
      </mesh>

      {/* Antenna */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
//  Shape: CYLINDRICAL  (spin-stabilised drum satellite)
// ─────────────────────────────────────────────────────────────
function CylindricalSat({ color }: { color: string }) {
  const drumPanels = useMemo(() => {
    const out: { pos: [number, number, number]; rot: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      out.push({
        pos: [Math.cos(angle) * 1.15, 0, Math.sin(angle) * 1.15],
        rot: angle,
      });
    }
    return out;
  }, []);

  return (
    <group>
      {/* Main cylindrical body */}
      <mesh>
        <cylinderGeometry args={[1, 1, 2.5, 32]} />
        {bodyMaterial(color)}
      </mesh>

      {/* Solar drum panels */}
      {drumPanels.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={[0, p.rot, 0]}>
          <boxGeometry args={[0.18, 2.2, 0.04]} />
          {panelMaterial(color)}
        </mesh>
      ))}

      {/* Top cap */}
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.6, 1, 0.12, 32]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Antenna */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.9, 8]} />
        <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
//  Shape: FRAGMENT  (tight debris cluster)
// ─────────────────────────────────────────────────────────────
function FragmentSat({ color }: { color: string }) {
  const pieces = useMemo(() => {
    const rng = seededRng(999);
    return Array.from({ length: 25 }, () => ({
      pos: [(rng() - 0.5), (rng() - 0.5), (rng() - 0.5)] as [number, number, number],
      size: [0.1 + rng() * 0.4, 0.1 + rng() * 0.4, 0.1 + rng() * 0.4] as [number, number, number],
      rot: [rng() * Math.PI, rng() * Math.PI, rng() * Math.PI] as [number, number, number],
    }));
  }, []);

  return (
    <group>
      {pieces.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={p.rot}>
          <boxGeometry args={p.size} />
          <meshStandardMaterial
            color="#aaaaaa"
            metalness={0.6}
            roughness={0.4}
            emissive={color}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
//  Shape: SCATTERED  (wide debris field)
// ─────────────────────────────────────────────────────────────
function ScatteredSat({ color }: { color: string }) {
  const pieces = useMemo(() => {
    const rng = seededRng(1337);
    return Array.from({ length: 40 }, () => ({
      pos: [(rng() - 0.5) * 3, (rng() - 0.5) * 3, (rng() - 0.5) * 3] as [number, number, number],
      size: [0.08 + rng() * 0.35, 0.03 + rng() * 0.15, 0.08 + rng() * 0.35] as [number, number, number],
      rot: [rng() * Math.PI * 2, rng() * Math.PI * 2, rng() * Math.PI * 2] as [number, number, number],
    }));
  }, []);

  return (
    <group>
      {pieces.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={p.rot}>
          <boxGeometry args={p.size} />
          <meshStandardMaterial
            color="#999999"
            metalness={0.5}
            roughness={0.5}
            emissive={color}
            emissiveIntensity={0.15}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
//  Shape: BOX-SHAPED  (GEO comsat with deployable panels)
// ─────────────────────────────────────────────────────────────
function BoxSat({ color }: { color: string }) {
  const panelConfigs: { pos: [number, number, number]; rot: [number, number, number] }[] = [
    { pos: [0,  0.8, 0],  rot: [0, 0, 0] },
    { pos: [0, -0.8, 0],  rot: [0, 0, 0] },
    { pos: [0.8, 0, 0],   rot: [0, 0, Math.PI / 2] },
    { pos: [-0.8, 0, 0],  rot: [0, 0, Math.PI / 2] },
  ];

  return (
    <group>
      {/* Gold main body */}
      <mesh>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial
          color="#c8a020"
          metalness={0.8}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Deployable panels on each face */}
      {panelConfigs.map((cfg, i) => (
        <mesh key={i} position={cfg.pos} rotation={cfg.rot}>
          <boxGeometry args={[0.8, 0.05, 0.3]} />
          {panelMaterial(color)}
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
//  Rotating satellite root — drives all shapes
// ─────────────────────────────────────────────────────────────
function RotatingSatellite({ satellite }: { satellite: Satellite }) {
  const groupRef = useRef<THREE.Group>(null);
  const axisVec = useMemo(
    () => new THREE.Vector3(...satellite.tumbleAxis).normalize(),
    [satellite.tumbleAxis]
  );
  const angularSpeed = useMemo(
    () => (satellite.spinRate * 2 * Math.PI) / 60, // rad/s
    [satellite.spinRate]
  );
  const quaternion = useMemo(() => new THREE.Quaternion(), []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    quaternion.setFromAxisAngle(axisVec, angularSpeed * delta);
    groupRef.current.quaternion.premultiply(quaternion);
  });

  const ShapeComponent = useMemo(() => {
    switch (satellite.shape) {
      case 'Rectangular':  return <RectangularSat color={satellite.color} />;
      case 'Cylindrical':  return <CylindricalSat color={satellite.color} />;
      case 'Fragment':     return <FragmentSat    color={satellite.color} />;
      case 'Scattered':    return <ScatteredSat   color={satellite.color} />;
      case 'Box-shaped':   return <BoxSat         color={satellite.color} />;
      default:             return <RectangularSat color={satellite.color} />;
    }
  }, [satellite.shape, satellite.color]);

  return <group ref={groupRef}>{ShapeComponent}</group>;
}

// ─────────────────────────────────────────────────────────────
//  Orbital reference sphere (wireframe)
// ─────────────────────────────────────────────────────────────
function OrbitalSphere({ color }: { color: string }) {
  return (
    <mesh>
      <sphereGeometry args={[6, 24, 16]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.06} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────
//  Public export — full Canvas wrapper
// ─────────────────────────────────────────────────────────────
interface SatelliteModelProps {
  satellite: Satellite;
  showTrajectory?: boolean;
}

export default function SatelliteModel({ satellite, showTrajectory = false }: SatelliteModelProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
      dpr={[1, 1.5]}
    >
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={1.5} />
      <pointLight position={[0, 0, 0]} color={satellite.color} intensity={0.5} distance={20} />

      {/* Satellite */}
      <RotatingSatellite satellite={satellite} />

      {/* Orbital sphere */}
      <OrbitalSphere color={satellite.color} />

      {/* Trajectory visualization overlay */}
      <TrajectoryOverlay visible={showTrajectory} satelliteColor={satellite.color} />
    </Canvas>
  );
}
