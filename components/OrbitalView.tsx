'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Eye, Milestone, Compass } from 'lucide-react';
import type { Satellite } from '@/data/satellites';

interface OrbitalViewProps {
  satellite: Satellite | null;
}

export default function OrbitalView({ satellite }: OrbitalViewProps) {
  const [time, setTime] = useState(0);
  const [scanIndex, setScanIndex] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  // Animation ticks for both the orbit particle and light-curve scanner
  useEffect(() => {
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Update orbit progression time
      setTime((prev) => prev + delta);

      // Update light curve scanner index (0 to 99)
      setScanIndex((prev) => {
        // Increment scan position
        const next = prev + 15 * delta;
        return next >= 100 ? 0 : next;
      });

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (!satellite) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-5">
        <div className="w-16 h-16 mx-auto border border-white/[0.08] rounded-full flex items-center justify-center bg-white/[0.02]">
          <Milestone className="w-6 h-6 text-text-muted/30 animate-pulse" strokeWidth={1.5} />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] tracking-[0.3em] text-text-muted/40 font-space-grotesk uppercase block">
            02 / ORBITAL VIEW
          </span>
          <p className="text-[13px] text-text-muted/50 font-inter leading-relaxed max-w-[260px] mx-auto">
            Select a target from the registry to begin orbital analysis
          </p>
        </div>

        {/* Decorative corner brackets */}
        <div className="relative w-32 h-20 mx-auto mt-4">
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/[0.08]" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/[0.08]" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/[0.08]" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/[0.08]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-text-muted/20 pulse-status" />
          </div>
        </div>
      </div>
    );
  }

  // --- Orbit geometry math ---
  const cx = 150;
  const cy = 90;

  // Apogee and Perigee scale parameters
  const maxVal = Math.max(satellite.apogee, satellite.perigee, 1000);
  const minVal = Math.min(satellite.apogee, satellite.perigee, 100);

  // Draw base radius and offsets
  const earthRadius = 24;
  const semiMajor = 48 + (satellite.apogee / maxVal) * 32;
  const semiMinor = 48 + (satellite.perigee / maxVal) * 32;

  // Shift the ellipse center so Earth is located at one of the Keplerian foci
  // Focus offset c = sqrt(a^2 - b^2). 
  const focusOffset = Math.sqrt(Math.abs(semiMajor * semiMajor - semiMinor * semiMinor));

  // Position of satellite dot along the ellipse
  const orbitSpeed = 1.2; // Radians per second
  const angle = time * orbitSpeed;

  // Keplerian-adjusted orbital coordinates (within the rotated group)
  const satX = cx - focusOffset + semiMajor * Math.cos(angle);
  const satY = cy + semiMinor * Math.sin(angle);

  // Current scanner value for Light Curve
  const currentScanIdx = Math.floor(scanIndex);
  const scanVal = satellite.lightCurve[currentScanIdx] || 0.5;

  // Render SVG light curve path
  const curveWidth = 280;
  const curveHeight = 80;
  const step = curveWidth / 100;

  let pointsStr = '';
  let areaStr = '';

  satellite.lightCurve.forEach((val, i) => {
    // Invert Y coordinate so high values are at the top
    const x = i * step;
    const y = curveHeight - (val * (curveHeight - 16) + 8);
    if (i === 0) {
      pointsStr = `M ${x} ${y}`;
      areaStr = `M ${x} ${curveHeight} L ${x} ${y}`;
    } else {
      pointsStr += ` L ${x} ${y}`;
      areaStr += ` L ${x} ${y}`;
    }
  });
  areaStr += ` L ${curveWidth} ${curveHeight} Z`;

  return (
    <div className="space-y-3 h-full flex flex-col justify-between">
      {/* ── Title Header ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] tracking-[0.3em] text-text-muted/80 font-space-grotesk uppercase block">
            02 / ORBITAL ANALYSIS
          </span>
          <span className="text-[10px] tracking-[0.1em] font-mono text-white/80">
            INC: {satellite.inclination.toFixed(1)}°
          </span>
        </div>
        <div className="w-full h-px bg-white/[0.08]" />
      </div>

      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
        {/* ── SECTION 1: Keplerian Orbit Diagram ── */}
        <div className="border border-white/[0.06] bg-black/40 rounded-[6px] p-3 flex flex-col justify-between h-[165px] shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[9px] tracking-[0.2em] text-text-muted/80 font-space-grotesk uppercase">
              ORBITAL SCHEMATIC & VECTOR PATH
            </span>
            <div className="flex gap-4 text-[9px] font-jetbrains-mono text-white/90">
              <span>APOGEE: <strong className="text-white">{satellite.apogee}km</strong></span>
              <span>PERIGEE: <strong className="text-white">{satellite.perigee}km</strong></span>
            </div>
          </div>

          {/* SVG Orbit Canvas */}
          <div className="flex-1 flex items-center justify-center relative min-h-0">
            <svg
              viewBox="0 0 300 180"
              className="h-full max-w-[280px] overflow-visible"
              aria-label="Orbital Schematic Diagram"
            >
              {/* Polar Grid Rings */}
              <circle cx={cx} cy={cy} r={65} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
              <circle cx={cx} cy={cy} r={105} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth={1} />
              <line x1={cx - 110} y1={cy} x2={cx + 110} y2={cy} stroke="rgba(255,255,255,0.03)" strokeWidth={1} strokeDasharray="2,4" />
              <line x1={cx} y1={cy - 85} x2={cx} y2={cy + 85} stroke="rgba(255,255,255,0.03)" strokeWidth={1} strokeDasharray="2,4" />

              {/* Central Earth Sphere */}
              <defs>
                <radialGradient id="earthGrad" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#1a5fb4" />
                  <stop offset="70%" stopColor="#0a2240" />
                  <stop offset="100%" stopColor="#05060f" />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle
                cx={cx}
                cy={cy}
                r={earthRadius}
                fill="url(#earthGrad)"
                stroke="#00E5FF"
                strokeWidth={1}
                strokeOpacity={0.4}
              />
              <circle cx={cx} cy={cy} r={earthRadius + 2} fill="none" stroke="#00E5FF" strokeWidth={0.5} strokeOpacity={0.15} />

              {/* Rotated orbital plane group matching Inclination */}
              <g transform={`rotate(${-satellite.inclination / 2.5}, ${cx}, ${cy})`}>
                {/* Orbital Path Ellipse */}
                <ellipse
                  cx={cx - focusOffset}
                  cy={cy}
                  rx={semiMajor}
                  ry={semiMinor}
                  fill="none"
                  stroke={satellite.color}
                  strokeWidth={1.2}
                  strokeOpacity={0.4}
                  strokeDasharray="4,3"
                />

                {/* Vector lines: Earth center to Perigee/Apogee */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx - focusOffset - semiMajor}
                  y2={cy}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={1}
                />
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx - focusOffset + semiMajor}
                  y2={cy}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={1}
                />

                {/* Satellite marker along path */}
                <circle
                  cx={satX}
                  cy={satY}
                  r={3.5}
                  fill={satellite.color}
                  filter="url(#glow)"
                />
                <circle
                  cx={satX}
                  cy={satY}
                  r={7}
                  fill="none"
                  stroke={satellite.color}
                  strokeWidth={1}
                  opacity={0.5}
                  className="animate-ping"
                  style={{ animationDuration: '2s' }}
                />
              </g>

              {/* Diagram Labels */}
              <text x={cx + 10} y={cy - 28} className="font-space-grotesk fill-white/60 text-[7px] tracking-widest font-semibold uppercase">EARTH</text>
              <text x={cx - focusOffset - semiMajor - 2} y={cy + 12} className="font-jetbrains-mono fill-white/80 text-[6.5px] text-right uppercase">PERIGEE</text>
              <text x={cx - focusOffset + semiMajor + 2} y={cy - 6} className="font-jetbrains-mono fill-white/80 text-[6.5px] uppercase">APOGEE</text>
            </svg>
          </div>
        </div>

        {/* ── SECTION 2: Dynamic Light Curve Analyzer ── */}
        <div className="border border-white/[0.06] bg-black/40 rounded-[6px] p-3 flex flex-col justify-between h-[135px] shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[9px] tracking-[0.2em] text-text-muted/80 font-space-grotesk uppercase flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              PHOTOMETRIC LIGHT CURVE SIGNATURE
            </span>
            <div className="flex gap-3 text-[9px] font-jetbrains-mono text-white/85">
              <span>RPM: <strong className="text-white">{satellite.spinRate.toFixed(2)}</strong></span>
              <span>REFLECTIVITY: <strong className="text-white">{(scanVal * 100).toFixed(0)}%</strong></span>
            </div>
          </div>

          {/* SVG Light Curve Graph */}
          <div className="flex-1 flex items-center justify-center relative min-h-0">
            <div className="relative w-full max-w-[280px] h-full flex items-center">
              <svg
                viewBox={`0 0 ${curveWidth} ${curveHeight}`}
                className="w-full overflow-visible"
                aria-label="Light Curve Graph"
              >
                {/* Horizontal Baseline Grids */}
                <line x1={0} y1={8} x2={curveWidth} y2={8} stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
                <line x1={0} y1={curveHeight / 2} x2={curveWidth} y2={curveHeight / 2} stroke="rgba(255,255,255,0.03)" strokeWidth={1} strokeDasharray="3,3" />
                <line x1={0} y1={curveHeight - 8} x2={curveWidth} y2={curveHeight - 8} stroke="rgba(255,255,255,0.03)" strokeWidth={1} />

                {/* Filled Gradient Area */}
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={satellite.color} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={satellite.color} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <path d={areaStr} fill="url(#areaGrad)" />

                {/* Main Curve Line */}
                <path
                  d={pointsStr}
                  fill="none"
                  stroke={satellite.color}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />

                {/* Animated Vertical Scanner line */}
                <line
                  x1={scanIndex * step}
                  y1={0}
                  x2={scanIndex * step}
                  y2={curveHeight}
                  stroke="#FFFFFF"
                  strokeWidth={1}
                  strokeOpacity={0.4}
                />

                {/* Sweeping overlay glow */}
                <circle
                  cx={scanIndex * step}
                  cy={curveHeight - (scanVal * (curveHeight - 16) + 8)}
                  r={3.5}
                  fill="#FFFFFF"
                  filter="url(#glow)"
                />
              </svg>

              {/* Floating scanner metrics */}
              <div className="absolute top-0 left-0 bg-black/80 border border-white/10 rounded-[2px] px-1 py-0.5 font-jetbrains-mono text-[7.5px] text-white/80 pointer-events-none tabular-nums">
                T+{(scanIndex * 0.1).toFixed(1)}s: {scanVal.toFixed(2)} A.U.
              </div>
            </div>
          </div>

          {/* Micro telemetry descriptor */}
          <div className="text-[9px] text-text-muted/75 font-inter leading-relaxed flex items-center justify-between border-t border-white/[0.04] pt-1">
            <span>Spectrum Band: Visible (RGB 400-700nm)</span>
            <span>Signature confidence: 99.4% (Tumble locked)</span>
          </div>
        </div>
      </div>

      {/* ── Action Control buttons at the bottom of panel ── */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button className="h-8 border border-white/10 hover:border-white/30 text-[10px] uppercase font-space-grotesk tracking-widest text-white/70 hover:text-white rounded-[3px] bg-white/[0.01] hover:bg-white/[0.03] transition-colors flex items-center justify-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          Export Sig
        </button>
        <button className="h-8 border border-accent-cyan/20 hover:border-accent-cyan/50 text-[10px] uppercase font-space-grotesk tracking-widest text-accent-cyan hover:text-accent-cyan bg-accent-cyan/5 hover:bg-accent-cyan/10 rounded-[3px] transition-colors flex items-center justify-center gap-1.5">
          <Compass className="w-3.5 h-3.5" />
          Calculate Intercept
        </button>
      </div>
    </div>
  );
}
