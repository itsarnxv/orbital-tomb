'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Earth() {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const gridRef = useRef<THREE.Mesh>(null);

  // Rotate the Earth components
  useFrame((state, delta) => {
    const rotSpeed = 0.012 * delta;
    if (groupRef.current) {
      groupRef.current.rotation.y += rotSpeed;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y += rotSpeed * 0.5; // slight differential rotation
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. Base dark translucent core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[50, 32, 32]} />
        <meshBasicMaterial 
          color="#030612" 
          transparent={true} 
          opacity={0.85} 
        />
      </mesh>

      {/* 2. Cyberpunk cyan wireframe grid */}
      <mesh ref={gridRef}>
        <sphereGeometry args={[50.2, 24, 24]} />
        <meshBasicMaterial 
          color="#00E5FF" 
          wireframe={true} 
          transparent={true} 
          opacity={0.12} 
          depthWrite={false}
        />
      </mesh>

      {/* 3. Latitudinal / Equator rings for tactical tracking aesthetic */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[50.3, 50.5, 64]} />
        <meshBasicMaterial 
          color="#00E5FF" 
          side={THREE.DoubleSide} 
          transparent={true} 
          opacity={0.3} 
          depthWrite={false}
        />
      </mesh>

      {/* 4. Atmospheric Glow Ring (Backside rendering for soft outer halo) */}
      <mesh>
        <sphereGeometry args={[52.0, 32, 32]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent={true}
          opacity={0.06}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
