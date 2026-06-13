'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'magenta' | 'green' | 'amber';
  tilt?: boolean;
}

export default function GlassCard({
  children,
  className = '',
  glowColor = 'cyan',
  tilt = false,
}: GlassCardProps) {
  // Animation states for page load
  const entryVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: 'easeOut' } 
    },
  };

  // Base shadows incorporating inset highlight and outer glow
  const baseShadows = {
    cyan: '0 8px 32px 0 rgba(0, 229, 255, 0.08), inset 0 0 32px 0 rgba(255, 255, 255, 0.03)',
    magenta: '0 8px 32px 0 rgba(255, 0, 110, 0.08), inset 0 0 32px 0 rgba(255, 255, 255, 0.03)',
    green: '0 8px 32px 0 rgba(0, 255, 136, 0.08), inset 0 0 32px 0 rgba(255, 255, 255, 0.03)',
    amber: '0 8px 32px 0 rgba(255, 184, 0, 0.08), inset 0 0 32px 0 rgba(255, 255, 255, 0.03)',
  };

  // Enhanced hover shadows (when tilted)
  const hoverShadows = {
    cyan: '0 16px 40px 0 rgba(0, 229, 255, 0.22), inset 0 0 32px 0 rgba(255, 255, 255, 0.08)',
    magenta: '0 16px 40px 0 rgba(255, 0, 110, 0.22), inset 0 0 32px 0 rgba(255, 255, 255, 0.08)',
    green: '0 16px 40px 0 rgba(0, 255, 136, 0.22), inset 0 0 32px 0 rgba(255, 255, 255, 0.08)',
    amber: '0 16px 40px 0 rgba(255, 184, 0, 0.22), inset 0 0 32px 0 rgba(255, 255, 255, 0.08)',
  };

  const selectedBaseShadow = baseShadows[glowColor];
  const selectedHoverShadow = hoverShadows[glowColor];

  // Specific border color changes on hover
  const hoverBorders = {
    cyan: 'rgba(0, 229, 255, 0.35)',
    magenta: 'rgba(255, 0, 110, 0.35)',
    green: 'rgba(0, 255, 136, 0.35)',
    amber: 'rgba(255, 184, 0, 0.35)',
  };

  const selectedHoverBorder = hoverBorders[glowColor];

  // 3D Parallax tilt states
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt) return;
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    // Get mouse offset relative to card center
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    // Calculate angle capped at max 8 degrees
    const rotX = -(y / (box.height / 2)) * 8;
    const rotY = (x / (box.width / 2)) * 8;
    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={entryVariants}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        background: 'rgba(255, 255, 255, 0.05)',
        boxShadow: hovered ? selectedHoverShadow : selectedBaseShadow,
        borderColor: hovered ? selectedHoverBorder : 'rgba(255, 255, 255, 0.12)',
        transform: hovered && tilt
          ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`
          : `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`,
      }}
      className={`relative group rounded-[16px] border p-3 transition-all duration-300 ease-out cursor-default
        before:opacity-0 before:transition-opacity before:duration-300 before:content-[''] before:absolute before:top-2 before:left-2 before:w-3 before:h-3 before:border-t before:border-l before:border-white/80 before:z-20
        after:opacity-0 after:transition-opacity after:duration-300 after:content-[''] after:absolute after:top-2 after:right-2 after:w-3 after:h-3 after:border-t after:border-r after:border-white/80 after:z-20
        hover:before:opacity-100 hover:after:opacity-100
        ${className}`}
    >
      {/* Sharp inner content area with 4px border-radius */}
      <div 
        className="relative rounded-[4px] bg-black/45 border border-white/5 p-4 h-full
          before:opacity-0 before:transition-opacity before:duration-300 before:content-[''] before:absolute before:bottom-2 before:left-2 before:w-3 before:h-3 before:border-b before:border-l before:border-white/80 before:z-20
          after:opacity-0 after:transition-opacity after:duration-300 after:content-[''] after:absolute after:bottom-2 after:right-2 after:w-3 after:h-3 before:z-20 after:border-b after:border-r after:border-white/80
          group-hover:before:opacity-100 group-hover:after:opacity-100"
      >
        {children}
      </div>
    </motion.div>
  );
}
