'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Satellite } from '@/data/satellites';
import SatelliteCard from './SatelliteCard';

interface SatelliteListProps {
  satellites: Satellite[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function SatelliteList({
  satellites,
  selectedId,
  onSelect,
}: SatelliteListProps) {
  const [filter, setFilter] = useState<'ALL' | 'LEO' | 'GEO'>('ALL');
  const [sortBy, setSortBy] = useState<'altitude' | 'spin' | 'mass'>('altitude');

  // Filter and sort targets lists dynamically
  const processedSatellites = useMemo(() => {
    let list = satellites.filter((sat) => {
      const alt = Math.round((sat.apogee + sat.perigee) / 2);
      if (filter === 'LEO') return alt < 1000;
      if (filter === 'GEO') return alt >= 1000;
      return true;
    });

    list.sort((a, b) => {
      const altA = Math.round((a.apogee + a.perigee) / 2);
      const altB = Math.round((b.apogee + b.perigee) / 2);
      
      if (sortBy === 'altitude') return altB - altA;
      if (sortBy === 'spin') return b.spinRate - a.spinRate;
      if (sortBy === 'mass') return b.mass - a.mass;
      return 0;
    });

    return list;
  }, [satellites, filter, sortBy]);

  return (
    <div className="space-y-5">
      {/* ── Section header with Sort Dropdown ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-px bg-accent-cyan" />
          <span className="text-[10px] tracking-[0.25em] text-text-muted/50 font-space-grotesk uppercase font-bold">
            TARGETS &middot; {processedSatellites.length}
          </span>
        </div>
        
        {/* Sort select list */}
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-space-grotesk tracking-widest text-text-muted/40 uppercase font-bold">SORT:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#05060f]/60 border border-white/10 rounded-[3px] px-2 py-0.5 text-[9px] font-space-grotesk font-bold uppercase text-white outline-none cursor-pointer hover:border-white/30 transition-all duration-200"
          >
            <option value="altitude" style={{ backgroundColor: '#0c0e1a' }}>ALTITUDE</option>
            <option value="spin" style={{ backgroundColor: '#0c0e1a' }}>SPIN RATE</option>
            <option value="mass" style={{ backgroundColor: '#0c0e1a' }}>MASS</option>
          </select>
        </div>
      </div>

      {/* ── LEO/GEO Filter Pills Row ── */}
      <div className="flex gap-2">
        {(['ALL', 'LEO', 'GEO'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-[9px] font-space-grotesk tracking-widest font-bold uppercase transition-all duration-200 border ${
              filter === f
                ? 'border-accent-cyan bg-accent-cyan/15 text-accent-cyan shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                : 'border-white/10 text-white/40 hover:text-white hover:border-white/30'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Divider ── */}
      <div className="w-full h-px bg-white/[0.06]" />

      {/* ── Satellite cards (20px gaps) ── */}
      <motion.div layout className="space-y-5 pt-1">
        {processedSatellites.map((sat, index) => (
          <SatelliteCard
            key={sat.id}
            satellite={sat}
            isSelected={selectedId === sat.id}
            onSelect={onSelect}
            index={index}
          />
        ))}
        {processedSatellites.length === 0 && (
          <div className="p-8 text-center text-[11px] font-space-grotesk text-white/30 tracking-widest uppercase">
            NO SATELLITES IN THIS RANGE
          </div>
        )}
      </motion.div>

      {/* ── Bottom micro-detail ── */}
      <div className="pt-4 mt-2">
        <div className="w-full h-px bg-white/[0.05]" />
        <p className="text-[9px] text-text-muted/30 font-inter mt-3 leading-relaxed">
          Data sourced from ISRO-NETRA and ESA DISCOS catalogs.
          Last sync{' '}
          <span className="font-jetbrains-mono tabular-nums text-text-muted/40">
            12 min
          </span>{' '}
          ago.
        </p>
      </div>
    </div>
  );
}
