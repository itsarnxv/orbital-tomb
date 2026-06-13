'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Targets and interpolated positions
  const mousePos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      setIsVisible(true);

      // Check if hovering over interactive/clickable components
      const target = e.target as HTMLElement | null;
      if (target) {
        const isClickable =
          target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.closest('button') ||
          target.closest('a') ||
          target.classList.contains('cursor-pointer') ||
          target.getAttribute('role') === 'button';
        setIsHovered(!!isClickable);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Lerp loop running via requestAnimationFrame
    let animFrameId: number;
    const loop = () => {
      const smoothing = 0.15;
      
      // Calculate lerped coordinates
      currentPos.current.x += (mousePos.current.x - currentPos.current.x) * smoothing;
      currentPos.current.y += (mousePos.current.y - currentPos.current.y) * smoothing;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      ref={cursorRef}
      className={`
        fixed top-0 left-0 rounded-full pointer-events-none z-[9999] mix-blend-difference transition-all duration-300 ease-out
        ${isHovered 
          ? 'w-4 h-4 bg-white shadow-[0_0_12px_rgba(0,229,255,0.8)] border border-accent-cyan/40' 
          : 'w-2 h-2 bg-white'
        }
      `}
      style={{
        transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%)',
      }}
    />
  );
}
