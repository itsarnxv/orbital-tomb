'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import type { Satellite } from '@/data/satellites';
import type { SpinAnalysisResult } from '@/lib/analyzeSpin';
import { Lock, Activity, Target, Send, Eye } from 'lucide-react';

const CURRENT_YEAR = 2025;

function fmtNum(n: number) {
  return n.toLocaleString('en-IN');
}

function getStatusColor(status: Satellite['status']): string {
  switch (status) {
    case 'tumbling':
      return '#FF4444';
    case 'decaying':
      return '#FFB800';
    case 'stable':
      return '#00FF88';
    case 'removed':
      return '#8B9DC3';
  }
}

function getStatusLabel(status: Satellite['status']): string {
  switch (status) {
    case 'tumbling':
      return 'TUMBLING';
    case 'decaying':
      return 'DECAYING';
    case 'stable':
      return 'ACTIVE';
    case 'removed':
      return 'REMOVED';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Animate Number CountUp Component
// ─────────────────────────────────────────────────────────────────────────────
function CountUp({
  target,
  duration = 0.6,
  decimals = 0,
  suffix = '',
  className = '',
}: {
  target: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState('0');
  const prevTargetRef = useRef(0);

  useEffect(() => {
    const from = prevTargetRef.current;
    const controls = animate(from, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => {
        setDisplay(
          decimals > 0
            ? latest.toFixed(decimals)
            : fmtNum(Math.round(latest))
        );
      },
    });
    prevTargetRef.current = target;
    return () => controls.stop();
  }, [target, duration, decimals]);

  return (
    <span className={className}>
      {display}{suffix}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section Header Line Component
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="pt-4 pb-2 select-none pointer-events-none shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-px bg-accent-cyan/80" />
        <span className="text-[10px] tracking-[0.3em] font-space-grotesk font-semibold text-accent-cyan/95 uppercase">
          {title}
        </span>
      </div>
      <div className="w-full h-px bg-white/[0.06] mt-2 mb-1" />
    </div>
  );
}

interface TelemetryPanelProps {
  satellite: Satellite | null;
  spinResult?: SpinAnalysisResult | null;
  analyzed?: boolean;
  timelineEvents?: { time: string; label: string; icon: string }[];
}

export default function TelemetryPanel({
  satellite,
  spinResult,
  analyzed = false,
  timelineEvents = [],
}: TelemetryPanelProps) {
  if (!satellite) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-5 text-center py-16 select-none">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border border-white/5" />
          <div className="absolute inset-0 rounded-full border-2 border-white/15 border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-px bg-accent-cyan/60" />
            <span className="text-[9px] tracking-[0.3em] text-white/40 font-space-grotesk uppercase">04 / LIVE TELEMETRY</span>
          </div>
          <span className="text-[9px] tracking-[0.3em] text-white/20 font-space-grotesk uppercase block">OFFLINE</span>
          <p className="text-[11px] text-white/25 font-inter leading-relaxed max-w-[200px]">
            Select a target from the registry to stream telemetry
          </p>
        </div>
      </div>
    );
  }

  const sat = satellite;
  const yearsAgo = CURRENT_YEAR - sat.launchYear;
  const avgAlt = Math.round((sat.apogee + sat.perigee) / 2);
  const rad = (sat.inclination * Math.PI) / 180;
  const statusColor = getStatusColor(sat.status);

  return (
    <div className="flex flex-col h-full gap-5 overflow-y-auto pr-1">

      {/* ── Panel Header ── */}
      <div className="flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-px bg-accent-cyan" />
          <span className="text-[10px] tracking-[0.3em] text-white/50 font-space-grotesk uppercase font-bold">04 / LIVE TELEMETRY</span>
          <div className="w-px h-3 bg-white/[0.1]" />
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] tracking-[0.2em] text-emerald-400 font-space-grotesk uppercase font-bold">LIVE STREAM</span>
          </div>
        </div>
        <span
          className="text-[9px] tracking-[0.12em] font-space-grotesk font-bold uppercase px-2 py-0.5 rounded-[2px] border leading-none"
          style={{ color: sat.color, borderColor: `${sat.color}35`, backgroundColor: `${sat.color}0a` }}
        >
          LINK ACTIVE
        </span>
      </div>

      <div className="w-full h-px bg-white/[0.08] shrink-0" />

      {/* ── Section 1: Orbital Parameters ── */}
      <div className="space-y-3 shrink-0">
        <SectionHeader title="01  ORBITAL PARAMETERS" />
        
        {/* Row block style (no nested card backgrounds) */}
        <div className="grid grid-cols-3 divide-x divide-white/10 items-center py-2 border border-white/5 rounded-[4px] bg-white/[0.01] h-[105px]">
          
          {/* ALTITUDE */}
          <div className="px-4 text-left flex flex-col justify-center h-full">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-space-grotesk font-bold">ALTITUDE</span>
            <span className="font-jetbrains-mono font-light text-[22px] text-white tabular-nums mt-1 leading-none">
              <CountUp target={avgAlt} duration={0.6} />
            </span>
            <span className="text-[8px] uppercase tracking-widest text-white/30 font-space-grotesk mt-1.5 leading-none">KM MEAN</span>
          </div>
          
          {/* INCLINATION */}
          <div className="px-4 text-left flex flex-col justify-center h-full relative">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-space-grotesk font-bold">INCLINATION</span>
            <div className="flex items-center justify-between gap-1 mt-1">
              <span className="font-jetbrains-mono font-light text-[22px] text-white tabular-nums leading-none">
                <CountUp target={sat.inclination} decimals={1} duration={0.6} />°
              </span>
              {/* Inline SVG angle indicator */}
              <svg width="32" height="26" viewBox="0 0 32 26" className="opacity-70 shrink-0">
                <line x1="2" y1="20" x2="30" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <line x1="16" y1="20" x2={16 + 12 * Math.cos(-rad)} y2={20 - 12 * Math.sin(-rad)} stroke={sat.color} strokeWidth="1.5" />
                <path d={`M 20 20 A 4 4 0 0 0 ${16 + 4 * Math.cos(-rad)} ${20 - 4 * Math.sin(-rad)}`} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          
          {/* APOAPSIS */}
          <div className="px-4 text-left flex flex-col justify-center h-full">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-space-grotesk font-bold">APOAPSIS</span>
            <span className="font-jetbrains-mono font-light text-[22px] text-white tabular-nums mt-1 leading-none">
              <CountUp target={avgAlt + 50} duration={0.6} />
            </span>
            <span className="text-[8px] uppercase tracking-widest text-white/30 font-space-grotesk mt-1.5 leading-none">KM PEAK</span>
          </div>

        </div>
      </div>

      {/* ── Section 2: Rotational Dynamics ── */}
      <div className="space-y-3 shrink-0">
        <SectionHeader title="02  ROTATIONAL DYNAMICS" />
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-6">
            
            {/* Main RPM readout */}
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-space-grotesk font-bold">SPIN period</span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="font-space-grotesk font-extralight text-[60px] text-white leading-none tabular-nums">
                  {sat.spinRate.toFixed(2)}
                </span>
                <span className="text-[12px] font-space-grotesk tracking-widest text-white/40 font-bold uppercase">RPM</span>
              </div>
            </div>

            {/* Stacked tumble axis bars (32px tall rows) */}
            <div className="flex-1 flex flex-col justify-center gap-2.5">
              {[
                { label: 'X_AXIS', val: sat.tumbleAxis[0] },
                { label: 'Y_AXIS', val: sat.tumbleAxis[1] },
                { label: 'Z_AXIS', val: sat.tumbleAxis[2] }
              ].map((ax) => (
                <div key={ax.label} className="flex items-center gap-3 h-[22px]">
                  <span className="font-jetbrains-mono text-[9px] tracking-wider text-white/45 w-14 text-left font-bold">{ax.label}</span>
                  <div className="flex-1 h-[2px] bg-white/5 overflow-hidden rounded-full">
                    <motion.div
                      key={`${sat.id}-${ax.label}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.abs(ax.val) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: sat.color }}
                    />
                  </div>
                  <span className="font-jetbrains-mono text-[10px] text-white tabular-nums w-8 text-right leading-none">
                    {ax.val.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

          </div>

          {/* Stability ratings dots bar */}
          <div className="flex items-center justify-between border border-white/5 rounded-[4px] bg-white/[0.01] p-3">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-space-grotesk font-bold">STABILITY RATING</span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }, (_, idx) => {
                const rating = sat.spinRate <= 1.0 ? 5 : sat.spinRate <= 2.0 ? 4 : sat.spinRate <= 3.0 ? 3 : sat.spinRate <= 4.0 ? 2 : 1;
                const active = idx < rating;
                return (
                  <div 
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
                      active 
                        ? 'border-accent-cyan bg-accent-cyan shadow-[0_0_8px_rgba(0,229,255,0.6)]' 
                        : 'border-white/10 bg-transparent'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Physical Specifications ── */}
      <div className="space-y-3 shrink-0">
        <SectionHeader title="03  PHYSICAL SPECIFICATIONS" />

        <div className="grid grid-cols-2 gap-3.5">
          {/* MASS */}
          <div className="border border-white/5 rounded-[4px] bg-white/[0.01] p-3 text-left h-[58px] flex flex-col justify-center">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-space-grotesk font-bold">MASS</span>
            <span className="font-jetbrains-mono text-[15px] font-bold text-white tabular-nums mt-1 leading-none">
              <CountUp target={sat.mass} /> <span className="text-[9px] text-white/50 font-normal">kg</span>
            </span>
          </div>
          {/* SHAPE */}
          <div className="border border-white/5 rounded-[4px] bg-white/[0.01] p-3 text-left h-[58px] flex flex-col justify-center">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-space-grotesk font-bold">SHAPE PROFILE</span>
            <span className="font-space-grotesk text-[13px] font-bold text-white mt-1 leading-none uppercase">
              {sat.shape}
            </span>
          </div>
          {/* LAUNCH YEAR */}
          <div className="border border-white/5 rounded-[4px] bg-white/[0.01] p-3 text-left h-[58px] flex flex-col justify-center">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-space-grotesk font-bold">LAUNCH YEAR</span>
            <span className="font-jetbrains-mono text-[15px] font-bold text-white tabular-nums mt-1 leading-none">
              {sat.launchYear}
            </span>
          </div>
          {/* NORAD ID */}
          <div className="border border-white/5 rounded-[4px] bg-white/[0.01] p-3 text-left h-[58px] flex flex-col justify-center">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-space-grotesk font-bold">NORAD ID</span>
            <span className="font-jetbrains-mono text-[15px] font-bold text-white tabular-nums mt-1 leading-none">
              #{sat.designation}
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 4: Mission Context ── */}
      <div className="space-y-3 shrink-0">
        <SectionHeader title="04  MISSION CONTEXT" />

        <div className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-3.5">
            {/* Operator */}
            <div className="border border-white/5 rounded-[4px] bg-white/[0.01] p-3 flex flex-col justify-center h-[58px]">
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-space-grotesk font-bold">OPERATOR</span>
              <span className="font-space-grotesk text-[13px] font-bold text-white mt-1 leading-none uppercase truncate">
                {sat.owner}
              </span>
            </div>
            {/* Status badge */}
            <div className="border border-white/5 rounded-[4px] bg-white/[0.01] p-3 flex items-center justify-between h-[58px]">
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-space-grotesk font-bold">STATUS</span>
              <span
                className="px-2.5 py-1.5 rounded-full text-[9px] font-space-grotesk font-bold tracking-wider leading-none uppercase text-center shrink-0"
                style={{
                  color: statusColor,
                  border: `1px solid ${statusColor}35`,
                  backgroundColor: `${statusColor}12`,
                }}
              >
                {getStatusLabel(sat.status)}
              </span>
            </div>
          </div>
          
          {/* Launch period (humanized) */}
          <div className="border border-white/5 rounded-[4px] bg-white/[0.01] p-3 flex flex-col justify-center h-[58px]">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-space-grotesk font-bold">ORBITAL AGE</span>
            <span className="font-space-grotesk text-[13px] text-white mt-1 leading-none font-bold">
              Launched {yearsAgo} years ago <span className="text-[10px] text-white/40 font-normal">({sat.launchYear})</span>
            </span>
          </div>

          {/* ISRO relevance Context */}
          <div className="border border-white/5 rounded-[4px] bg-white/[0.01] p-4 space-y-2">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-space-grotesk font-bold block">ISRO MONITORING NOTES</span>
            <p className="text-[11px] text-white/60 font-inter italic leading-[1.6]">
              {sat.isroContext}
            </p>
          </div>
        </div>
      </div>

      {/* ── Telemetry Timeline ── */}
      {timelineEvents && timelineEvents.length > 0 && (
        <div className="shrink-0 border-t border-white/[0.05] pt-4 mt-2 space-y-2">
          <span className="text-[9px] tracking-[0.25em] text-white/30 font-space-grotesk uppercase">
            TELEMETRY TIMELINE
          </span>
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none">
            {timelineEvents.map((evt, idx) => {
              const iconMap: Record<string, any> = {
                lock: Lock,
                fft: Activity,
                window: Target,
                trajectory: Send,
                signal: Eye,
              };
              const IconComponent = iconMap[evt.icon] || Eye;

              return (
                <div 
                  key={idx}
                  className="inline-flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] rounded-[4px] px-2.5 py-1.5"
                >
                  <IconComponent className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] font-space-grotesk font-bold text-white tracking-wide leading-none uppercase">
                      {evt.label}
                    </span>
                    <span className="text-[8px] font-jetbrains-mono text-white/30 leading-none mt-0.5">
                      {evt.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
