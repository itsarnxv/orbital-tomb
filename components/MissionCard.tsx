'use client';

import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crosshair, X } from 'lucide-react';
import { Satellite } from '@/data/satellites';
import { findCaptureWindow } from '@/lib/findCaptureWindow';

interface MissionCardProps {
  satellite: Satellite;
  onGenerateTrajectory: () => void;
  onDismiss: () => void;
}

export default function MissionCard({
  satellite,
  onGenerateTrajectory,
  onDismiss,
}: MissionCardProps) {
  // Compute capture window values
  const cw = useMemo(() => findCaptureWindow(satellite), [satellite]);
  
  // Extract minutes offset from perigee
  const minutesOffset = satellite.perigee % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onDismiss}
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 22, stiffness: 220 }}
        className="relative w-[520px] bg-black/75 border border-white/10 rounded-[24px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center select-none"
      >
        {/* Repeating diagonal scan-line background pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.02] rounded-[24px]"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #fff, #fff 1px, transparent 1px, transparent 10px)'
          }}
        />

        {/* Close button (X) top-right */}
        <button
          onClick={onDismiss}
          className="absolute top-5 right-5 text-white/40 hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 p-1"
          aria-label="Dismiss Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top: Crosshair Icon with cyan glow */}
        <div className="w-12 h-12 rounded-[4px] border border-accent-cyan bg-accent-cyan/10 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.45)] mt-2 mb-4">
          <Crosshair className="w-6 h-6 text-accent-cyan animate-pulse" />
        </div>

        {/* Section Label */}
        <span className="text-[10px] tracking-[0.4em] font-space-grotesk font-bold text-accent-cyan uppercase mb-1">
          MISSION BRIEFING
        </span>

        {/* Capture Window Title */}
        <h2 className="font-space-grotesk font-bold text-[26px] text-white tracking-tight uppercase mb-6">
          CAPTURE WINDOW
        </h2>

        {/* Three big stat blocks (sharp-cornered border-radius 4px for DATA) */}
        <div className="grid grid-cols-3 gap-3 w-full mb-8">
          
          {/* TIMESTAMP BLOCK */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-[4px] p-3 flex flex-col justify-between h-[105px] text-left hover:border-white/[0.14] transition-all duration-300">
            <span className="text-[9px] tracking-[0.2em] font-space-grotesk text-white/40 uppercase font-bold">
              TUESDAY
            </span>
            <div className="flex flex-col mt-auto">
              <span className="font-jetbrains-mono text-[15px] font-bold text-white tracking-tight uppercase leading-none">
                03:42 UTC
              </span>
              <span className="text-[9px] font-jetbrains-mono font-semibold text-accent-cyan mt-1 leading-none">
                + {minutesOffset.toString().padStart(2, '0')} MIN
              </span>
            </div>
          </div>

          {/* APPROACH BLOCK */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-[4px] p-3 flex flex-col justify-between h-[105px] text-left hover:border-white/[0.14] transition-all duration-300">
            <span className="text-[9px] tracking-[0.2em] font-space-grotesk text-white/40 uppercase font-bold">
              APPROACH
            </span>
            <div className="flex flex-col mt-auto font-jetbrains-mono font-bold text-[13px] leading-tight text-white/90">
              <span className="tabular-nums">{cw.elevationDeg.toFixed(1)}° ELEV</span>
              <span className="tabular-nums">{Math.round(cw.azimuthDeg)}° AZIM</span>
            </div>
          </div>

          {/* STABILITY BLOCK */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-[4px] p-3 flex flex-col justify-between h-[105px] text-left hover:border-white/[0.14] transition-all duration-300">
            <span className="text-[9px] tracking-[0.2em] font-space-grotesk text-white/40 uppercase font-bold">
              STABILITY
            </span>
            <div className="flex flex-col mt-auto">
              <span className="font-jetbrains-mono text-[14px] font-bold text-white leading-none">
                {cw.stabilityDuration} SECONDS
              </span>
              {/* Progress bar */}
              <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(cw.stabilityDuration / 120) * 100}%` }}
                  transition={{ duration: 1.0, ease: 'easeOut' }}
                  className="h-full bg-accent-cyan"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Success Rate Section */}
        <div className="flex flex-col items-center mb-8">
          <span className="text-[9px] tracking-[0.3em] font-space-grotesk text-white/40 uppercase font-bold mb-4">
            SUCCESS PROBABILITY
          </span>

          {/* Circular progress ring with big percentage */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <defs>
                <linearGradient id="cyanGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00E5FF" />
                  <stop offset="100%" stopColor="#00FF88" />
                </linearGradient>
              </defs>
              {/* Track circle */}
              <circle
                cx="88"
                cy="88"
                r="76"
                className="stroke-white/5"
                strokeWidth="4"
                fill="none"
              />
              {/* Progress circle */}
              <motion.circle
                cx="88"
                cy="88"
                r="76"
                className="stroke-[url(#cyanGreenGrad)]"
                strokeWidth="4"
                fill="none"
                strokeDasharray={2 * Math.PI * 76}
                initial={{ strokeDashoffset: 2 * Math.PI * 76 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 76 * (1 - cw.successRate) }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                strokeLinecap="round"
              />
            </svg>
            <span className="font-jetbrains-mono text-[64px] font-light text-white tracking-tight tabular-nums">
              {Math.round(cw.successRate * 100)}%
            </span>
          </div>

          <span className="text-[9px] tracking-wider text-white/30 font-space-grotesk mt-4 uppercase">
            BASED ON SPIN RATE, TUMBLE AXIS, ALTITUDE
          </span>
        </div>

        {/* Buttons at bottom (rounded 24px) */}
        <div className="flex flex-col gap-2 w-full mt-2">
          {/* Primary Action Button */}
          <button
            onClick={onGenerateTrajectory}
            className="w-full py-3.5 px-6 rounded-[24px] border border-accent-green/50 text-accent-green bg-accent-green/5 hover:bg-accent-green/15 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:scale-[1.01] active:scale-95 transition-all duration-300 font-space-grotesk text-[10px] tracking-[0.25em] font-bold uppercase"
          >
            GENERATE APPROACH TRAJECTORY
          </button>

          {/* Secondary Dismiss Button */}
          <button
            onClick={onDismiss}
            className="w-full py-3 px-6 rounded-[24px] text-white/40 hover:text-white/80 hover:bg-white/5 hover:scale-[1.01] active:scale-95 transition-all duration-200 font-space-grotesk text-[10px] tracking-[0.25em] uppercase font-semibold"
          >
            DISMISS
          </button>
        </div>

      </motion.div>
    </div>
  );
}
