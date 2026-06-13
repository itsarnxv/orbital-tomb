'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { Satellite } from '@/data/satellites';

interface SatelliteCardProps {
  satellite: Satellite;
  isSelected: boolean;
  onSelect: (id: string) => void;
  index: number;
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
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
      return 'TRACKED';
    case 'removed':
      return 'REMOVED';
  }
}

export default function SatelliteCard({
  satellite,
  isSelected,
  onSelect,
  index,
}: SatelliteCardProps) {
  const altitude = Math.round((satellite.apogee + satellite.perigee) / 2);
  const statusColor = getStatusColor(satellite.status);

  return (
    <motion.div
      layoutId={`sat-card-${satellite.id}`}
      onClick={() => onSelect(satellite.id)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`
        relative rounded-[4px] overflow-hidden cursor-pointer group pr-8
        transition-shadow transition-colors duration-300
        ${
          isSelected
            ? 'border border-accent-cyan shadow-[0_0_20px_rgba(0,229,255,0.15)]'
            : 'border border-white/[0.08] hover:border-white/20'
        }
      `}
      style={{
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: isSelected
          ? 'rgba(0, 229, 255, 0.04)'
          : 'rgba(255, 255, 255, 0.03)',
      }}
    >
      {/* Top-Right Corner Badges Row */}
      <div className="absolute top-5 right-5 z-10 flex items-center gap-1.5 select-none pointer-events-none">
        {isSelected && (
          <span className="text-[8px] tracking-[0.15em] font-space-grotesk font-bold uppercase bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/35 px-1.5 py-0.5 rounded-[2px] leading-none">
            LOCKED
          </span>
        )}
        <span
          className="px-2 py-0.5 rounded-full text-[8px] font-space-grotesk font-bold tracking-wider leading-none uppercase"
          style={{
            color: statusColor,
            border: `1px solid ${statusColor}35`,
            backgroundColor: `${statusColor}12`,
          }}
        >
          {getStatusLabel(satellite.status)}
        </span>
      </div>

      {/* Tiny Chevron indicator on right edge */}
      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/80 group-hover:rotate-90 transition-all duration-300 pointer-events-none text-[16px] font-space-grotesk">
        &rsaquo;
      </span>

      {/* Main card content with increased p-6 internal padding */}
      <div className="p-6 space-y-4">
        
        {/* ── Top row: colored dot + name/NORAD ── */}
        <div className="flex items-start gap-4">
          {/* Satellite color dot */}
          <div
            className="w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse"
            style={{
              backgroundColor: satellite.color,
              boxShadow: `0 0 8px ${satellite.color}60, 0 0 0 2px ${satellite.color}30`,
            }}
          />

          {/* Name + NORAD ID */}
          <div className="flex-1 min-w-0">
            <h3 className="font-space-grotesk font-bold text-[15px] text-white leading-tight truncate">
              {satellite.name}
            </h3>
            <span className="font-jetbrains-mono text-[9px] tracking-widest text-text-muted/50 block mt-1">
              NORAD ID #{satellite.designation}
            </span>
          </div>
        </div>

        {/* ── Middle description / metadata ── */}
        <div className="pl-6">
          <p className="text-[11px] text-text-muted font-inter leading-snug">
            {satellite.owner}
          </p>
          <p className="text-[10px] text-text-muted/60 italic font-inter leading-snug mt-0.5">
            {satellite.type}
          </p>
        </div>

        {/* ── Subtle Divider (1px solid white/6%) ── */}
        <div className="w-full h-px bg-white/[0.06]" />

        {/* ── Bottom row: 3 stats not 2 ── */}
        <div className="grid grid-cols-3 gap-2 pl-6 pt-1">
          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] text-text-muted/40 font-space-grotesk block leading-none">ALT</span>
            <span className="font-jetbrains-mono text-[12px] font-bold text-white tabular-nums block mt-1.5 leading-none">
              {formatNumber(altitude)} <span className="text-[8px] text-text-muted/50 font-normal">km</span>
            </span>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] text-text-muted/40 font-space-grotesk block leading-none">SPIN</span>
            <span className="font-jetbrains-mono text-[12px] font-bold text-white tabular-nums block mt-1.5 leading-none">
              {satellite.spinRate.toFixed(2)} <span className="text-[8px] text-text-muted/50 font-normal">RPM</span>
            </span>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] text-text-muted/40 font-space-grotesk block leading-none">MASS</span>
            <span className="font-jetbrains-mono text-[12px] font-bold text-white tabular-nums block mt-1.5 leading-none">
              {(satellite.mass / 1000).toFixed(1)}<span className="text-[8px] text-text-muted/50 font-normal">t</span>
            </span>
          </div>
        </div>

      </div>

      {/* Hover edge glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${satellite.color}80, transparent)`,
        }}
      />
    </motion.div>
  );
}
