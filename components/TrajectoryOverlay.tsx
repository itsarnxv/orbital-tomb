'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface TrajectoryOverlayProps {
  visible: boolean;
  satelliteColor?: string;
}

export default function TrajectoryOverlay({
  visible,
  satelliteColor = '#00E5FF',
}: TrajectoryOverlayProps) {
  const chaserRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<any>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Reticle rings refs
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  // Positions and vectors
  const startPos = useMemo(() => new THREE.Vector3(4, 2, 4), []);
  const satellitePos = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  
  // Calculate stopping position: distance of 0.5 from the satellite origin
  const stopPos = useMemo(() => {
    const dir = satellitePos.clone().sub(startPos).normalize();
    return startPos.clone().add(dir.multiplyScalar(5.5)); // total distance is 6.0, stop at 5.5 (0.5 away)
  }, [startPos, satellitePos]);

  // Particle positions initial buffer
  const particleCount = 30;
  const particlePositions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    return arr;
  }, []);

  // Track the absolute start time when trajectory becomes visible
  const startTimeRef = useRef<number | null>(null);

  useFrame((state) => {
    if (!visible) {
      startTimeRef.current = null;
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.getElapsedTime();
    }

    const elapsed = state.clock.getElapsedTime() - startTimeRef.current;

    // 1. Chaser motion: lerp from startPos to stopPos over 3 seconds
    const chaserProgress = Math.min(1.0, elapsed / 3.0);
    // Smooth stepping for chaser drift
    const easeOutCubic = 1 - Math.pow(1 - chaserProgress, 3);
    const currentChaserPos = new THREE.Vector3().lerpVectors(startPos, stopPos, easeOutCubic);
    
    if (chaserRef.current) {
      chaserRef.current.position.copy(currentChaserPos);
      // Let chaser face the satellite
      chaserRef.current.lookAt(satellitePos);
    }

    // 2. Trajectory Line: draws progressively from chaserPos to satellitePos over 2 seconds
    const lineProgress = Math.min(1.0, elapsed / 2.0);
    const currentLineEndPos = new THREE.Vector3().lerpVectors(currentChaserPos, satellitePos, lineProgress);

    if (lineRef.current) {
      // Rebuild line geometry points dynamically
      const lineGeom = lineRef.current.geometry;
      lineGeom.setPositions([
        currentChaserPos.x, currentChaserPos.y, currentChaserPos.z,
        currentLineEndPos.x, currentLineEndPos.y, currentLineEndPos.z
      ]);
      // Animate line dashed offset for scrolling flow effect
      if (lineRef.current.material) {
        lineRef.current.material.dashOffset = -state.clock.getElapsedTime() * 3.5;
      }
    }

    // 3. Pulse reticle rings: scale 1 -> 1.3, opacity 0.8 -> 0
    const time = state.clock.getElapsedTime();
    const updateRing = (ringMesh: THREE.Mesh | null, offset: number) => {
      if (!ringMesh) return;
      const period = 1.4; // seconds per pulse cycle
      const ringProgress = ((time - offset) % period) / period;
      
      const scale = 1.0 + 0.3 * ringProgress;
      const opacity = 0.8 * (1.0 - ringProgress);

      ringMesh.scale.set(scale, scale, scale);
      
      const mat = ringMesh.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = opacity;
      }
    };

    updateRing(ring1Ref.current as any, 0.0);
    updateRing(ring2Ref.current as any, 0.45);
    updateRing(ring3Ref.current as any, 0.9);

    // 4. Flow particles along the path from chaserPos to satellitePos
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        // Offset each particle to distribute them evenly
        const pProgress = (elapsed * 0.45 + i / particleCount) % 1.0;
        
        // Linear path from chaser position to satellite position
        const pPos = new THREE.Vector3().lerpVectors(currentChaserPos, satellitePos, pProgress);
        
        positions[i * 3] = pPos.x;
        positions[i * 3 + 1] = pPos.y;
        positions[i * 3 + 2] = pPos.z;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (!visible) return null;

  return (
    <group>
      {/* Chaser Spacecraft (green emissive cube) */}
      <mesh ref={chaserRef} position={[4, 2, 4]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial
          color="#00FF88"
          emissive="#00FF88"
          emissiveIntensity={1.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Trajectory Line (Dashed cyan) */}
      <Line
        ref={lineRef}
        points={[startPos, startPos]} // Initialized to start point, updated dynamically in useFrame
        color="#00E5FF"
        lineWidth={1.8}
        dashed={true}
        dashScale={8}
        dashSize={0.4}
        gapSize={0.25}
        transparent={true}
        opacity={0.8}
        depthWrite={false}
      />

      {/* Pulsing reticle (3 concentric rings) */}
      <group position={[0, 0, 0]}>
        <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.75, 0.77, 32]} />
          <meshBasicMaterial color={satelliteColor} transparent={true} opacity={0.8} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.75, 0.77, 32]} />
          <meshBasicMaterial color={satelliteColor} transparent={true} opacity={0} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh ref={ring3Ref} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.75, 0.77, 32]} />
          <meshBasicMaterial color={satelliteColor} transparent={true} opacity={0} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>

      {/* Particle Stream (30 glowing dots) */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#00FF88"
          size={0.12}
          transparent={true}
          opacity={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
