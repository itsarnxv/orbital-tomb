'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Earth from './Earth';
import DebrisField from './DebrisField';

interface Scene3DProps {
  launched: boolean;
  triggerShake?: number;
}

// Camera controller component running inside R3F Canvas context
function CameraController({ launched, triggerShake }: { launched: boolean; triggerShake?: number }) {
  const { camera } = useThree();
  const angleRef = useRef(0);
  const currentDistanceRef = useRef(150);
  const startTimeRef = useRef<number | null>(null);

  // Shake tracking references
  const shouldTriggerShakeRef = useRef(false);
  const shakeStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (launched) {
      startTimeRef.current = null;
    }
  }, [launched]);

  useEffect(() => {
    if (triggerShake && triggerShake > 0) {
      shouldTriggerShakeRef.current = true;
    }
  }, [triggerShake]);

  useFrame((state, delta) => {
    // 1. Slow orbit around center at 0.05 rad/s
    angleRef.current += 0.05 * delta;

    // 2. Animate camera distance from 150 to 80 on launch trigger
    let targetDistance = 150;
    if (launched) {
      if (startTimeRef.current === null) {
        startTimeRef.current = state.clock.getElapsedTime();
      }
      const elapsed = state.clock.getElapsedTime() - startTimeRef.current;
      const progress = Math.min(elapsed / 1.5, 1.0); // 1.5 second duration
      
      // Custom easeOutQuart curve approximating cubic-bezier(0.16, 1, 0.3, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      targetDistance = THREE.MathUtils.lerp(150, 80, easeProgress);
    }

    currentDistanceRef.current = THREE.MathUtils.lerp(
      currentDistanceRef.current,
      targetDistance,
      0.08
    );

    const dist = currentDistanceRef.current;

    // 3. Compute camera shake if active
    const shakeOffset = new THREE.Vector3(0, 0, 0);
    
    if (shouldTriggerShakeRef.current) {
      shakeStartRef.current = state.clock.getElapsedTime();
      shouldTriggerShakeRef.current = false;
    }
    
    if (shakeStartRef.current !== null) {
      const shakeElapsed = state.clock.getElapsedTime() - shakeStartRef.current;
      const shakeDuration = 0.2; // 0.2s duration
      if (shakeElapsed < shakeDuration) {
        const decay = 1 - shakeElapsed / shakeDuration;
        const amp = decay * 0.85; // amplitude offset max
        shakeOffset.set(
          (Math.random() - 0.5) * amp,
          (Math.random() - 0.5) * amp,
          (Math.random() - 0.5) * amp
        );
      } else {
        shakeStartRef.current = null;
      }
    }

    // Set orbit coordinates with shake applied
    camera.position.x = Math.sin(angleRef.current) * dist + shakeOffset.x;
    camera.position.z = Math.cos(angleRef.current) * dist + shakeOffset.z;
    camera.position.y = Math.sin(angleRef.current * 0.3) * (dist * 0.18) + shakeOffset.y;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function Scene3D({ launched, triggerShake }: Scene3DProps) {
  return (
    <div className="fixed inset-0 w-full h-full z-0 pointer-events-none bg-nebula-deep">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 150], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Lights matching sun coordinates in shader */}
        <ambientLight intensity={0.1} />
        <directionalLight position={[10, 5, 8]} intensity={1.2} />

        {/* 3D Objects */}
        <Earth />
        <DebrisField />

        {/* Camera Orbit and Dolly Controller */}
        <CameraController launched={launched} triggerShake={triggerShake} />
      </Canvas>
    </div>
  );
}
