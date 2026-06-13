'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Target, Lock, Activity, Send, Eye, Search, X, Settings, Bell, User, Check } from 'lucide-react';
import HUDButton from '@/components/HUDButton';
import GlassCard from '@/components/GlassCard';
import Scene3D from '@/components/Scene3D';
import SatelliteList from '@/components/SatelliteList';
import TelemetryPanel from '@/components/TelemetryPanel';
import SatelliteModel from '@/components/SatelliteModel';
import LightCurveGraph from '@/components/LightCurveGraph';
import { satellites } from '@/data/satellites';
import { analyzeSpin } from '@/lib/analyzeSpin';
import type { SpinAnalysisResult } from '@/lib/analyzeSpin';
import MissionCard from '@/components/MissionCard';

// ─────────────────────────────────────────────────────────────────────────────
//  Web Audio Beep Tone Generator
// ─────────────────────────────────────────────────────────────────────────────
const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(820, ctx.currentTime);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    console.warn("Web Audio Context not active or blocked: ", e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  System status mini meters
// ─────────────────────────────────────────────────────────────────────────────
function SystemMeter({ label }: { label: string }) {
  const [val, setVal] = useState(60);

  useEffect(() => {
    const update = () => {
      setVal(40 + Math.floor(Math.random() * 50));
    };
    update();
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="font-space-grotesk text-[8px] tracking-[0.15em] text-white/30 font-bold uppercase">
        {label}
      </span>
      <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden shrink-0">
        <motion.div
          animate={{ width: `${val}%` }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="h-full bg-accent-cyan"
        />
      </div>
      <span className="font-jetbrains-mono text-[9px] text-accent-cyan/85 w-6 text-right tabular-nums">
        {val}%
      </span>
    </div>
  );
}

function SystemStatusFooter() {
  return (
    <div className="fixed bottom-8 left-0 right-0 h-8 border-t border-white/[0.04] bg-black/75 backdrop-blur-md z-[45] px-6 flex items-center justify-between select-none pointer-events-none">
      <div className="flex items-center gap-6">
        <span className="text-[8px] tracking-[0.2em] font-space-grotesk font-bold text-white/20">
          SYS_LOG: LINK_NOMINAL
        </span>
        <div className="w-px h-3 bg-white/[0.08]" />
        <div className="flex items-center gap-4">
          <SystemMeter label="CPU" />
          <SystemMeter label="GPU" />
          <SystemMeter label="NET" />
          <SystemMeter label="SENSORS" />
        </div>
      </div>
      <div className="text-[8px] tracking-[0.2em] font-space-grotesk font-bold text-white/20">
        ISRO DEBRIS MONITOR V2.5
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Dynamic Trajectory Delta-V & ETA Overlay
// ─────────────────────────────────────────────────────────────────────────────
function TrajectoryStatsOverlay() {
  const [deltaV, setDeltaV] = useState(0);
  const [eta, setEta] = useState(0);

  useEffect(() => {
    let start = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(1.0, elapsed / 3.0); // 3 seconds duration

      setDeltaV(progress * 12.4);
      setEta(progress * 47);

      if (progress < 1.0) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20 pointer-events-none">
      <div className="bg-black/80 border border-[#00FF88]/30 px-5 py-2 rounded-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <span className="font-jetbrains-mono text-[9px] tracking-[0.2em] text-[#00FF88] uppercase leading-none block">
          TRAJECTORY LOCK: STABLE  &middot;  DELTA-V: {deltaV.toFixed(1)} m/s  &middot;  ETA: {Math.round(eta)}s
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Command Palette Filter Search Box
// ─────────────────────────────────────────────────────────────────────────────
function SearchModal({
  isOpen,
  onClose,
  satellites,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  satellites: any[];
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!query) return satellites;
    const q = query.toLowerCase();
    return satellites.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.designation.toLowerCase().includes(q) ||
        s.origin.toLowerCase().includes(q)
    );
  }, [query, satellites]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-lg bg-black/85 border border-white/10 rounded-[4px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden z-10"
      >
        {/* Input area */}
        <div className="flex items-center border-b border-white/10 px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="FILTER TARGETS BY NAME, ID, OR ORIGIN..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent outline-none border-none text-[11px] font-space-grotesk tracking-widest text-white placeholder-white/30 uppercase font-bold"
          />
          <span className="text-[8px] font-jetbrains-mono text-white/30 ml-2">ESC TO CLOSE</span>
        </div>

        {/* Results */}
        <div className="max-h-60 overflow-y-auto p-2 divide-y divide-white/5">
          {filtered.length > 0 ? (
            filtered.map((sat) => (
              <button
                key={sat.id}
                onClick={() => {
                  onSelect(sat.id);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-[2px] hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="flex flex-col">
                  <span className="text-[11px] font-space-grotesk font-bold text-white tracking-wide">
                    {sat.name}
                  </span>
                  <span className="text-[9px] font-jetbrains-mono text-white/40">
                    ID: #{sat.designation} &middot; {sat.origin.toUpperCase()}
                  </span>
                </div>
                <span
                  className="text-[9px] font-space-grotesk px-2 py-0.5 rounded-[2px]"
                  style={{ color: sat.color, border: `1px solid ${sat.color}40`, backgroundColor: `${sat.color}08` }}
                >
                  {sat.status.toUpperCase()}
                </span>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-[10px] font-space-grotesk text-white/30 tracking-widest uppercase">
              NO MATCHING TARGETS FOUND
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main Page Export
// ─────────────────────────────────────────────────────────────────────────────
export default function Page() {
  // --- States ---
  const [firstLoad, setFirstLoad] = useState(true);
  const [timeString, setTimeString] = useState<string>('00:00:00');
  const [launched, setLaunched] = useState(false);
  const [showDashboardLoader, setShowDashboardLoader] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedSatId, setSelectedSatId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [spinResult, setSpinResult] = useState<SpinAnalysisResult | null>(null);

  // Trajectory states
  const [showMissionCard, setShowMissionCard] = useState(false);
  const [showTrajectory, setShowTrajectory] = useState(false);

  // Cinematic overlay and sensor states
  const [triggerFlash, setTriggerFlash] = useState(0);
  const [triggerShake, setTriggerShake] = useState(0);
  const [showFFT, setShowFFT] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | 'orbit' | 'thermal'>('3d');
  const [met, setMet] = useState(0);

  // MET timer ticking up
  useEffect(() => {
    if (!launched) return;
    const start = Date.now();
    const interval = setInterval(() => {
      setMet(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [launched]);

  const formatMET = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `MET ${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Telemetry Timeline events tracking
  const [timelineEvents, setTimelineEvents] = useState<{ time: string; label: string; icon: string }[]>([]);

  const selectedSatellite = satellites.find((s) => s.id === selectedSatId) || null;

  // Add event helper
  const addTimelineEvent = useCallback((label: string, icon: string) => {
    const now = new Date();
    const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')} UTC`;
    setTimelineEvents(prev => {
      const next = [...prev, { time: timeStr, label, icon }];
      if (next.length > 5) {
        return next.slice(next.length - 5);
      }
      return next;
    });
  }, []);

  // --- Clock updates ---
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const utcHours = String(now.getUTCHours()).padStart(2, '0');
      const utcMinutes = String(now.getUTCMinutes()).padStart(2, '0');
      const utcSeconds = String(now.getUTCSeconds()).padStart(2, '0');
      setTimeString(`${utcHours}:${utcMinutes}:${utcSeconds}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // First loading timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setFirstLoad(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Target command palette key hooks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        playBeep();
        setShowSearch(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset states when satellite changes
  useEffect(() => {
    setAnalyzing(false);
    setAnalyzed(false);
    setSpinResult(null);
    setShowMissionCard(false);
    setShowTrajectory(false);
  }, [selectedSatId]);

  // Audio/Visual selection hooks on satellite lock
  const handleSelectSatellite = useCallback((id: string) => {
    setSelectedSatId(id);
    if (id) {
      playBeep();
      setTriggerFlash(prev => prev + 1);
      setTriggerShake(prev => prev + 1);
      const sat = satellites.find(s => s.id === id);
      if (sat) {
        addTimelineEvent(`UPLINK LOCKED: ${sat.name}`, 'lock');
      }
    }
  }, [addTimelineEvent]);

  // Spin analyze actions
  const handleAnalyze = useCallback(() => {
    if (!selectedSatellite || analyzing) return;
    const result = analyzeSpin(selectedSatellite.lightCurve);
    setSpinResult(result);
    setAnalyzing(true);
    setAnalyzed(false);
    playBeep();
  }, [selectedSatellite, analyzing]);

  const handleAnalysisDone = useCallback(() => {
    setAnalyzing(false);
    setAnalyzed(true);
    if (selectedSatellite) {
      addTimelineEvent('FFT SPECTRUM STABLE', 'fft');
    }
  }, [selectedSatellite, addTimelineEvent]);

  // --- Launch sequence ---
  const handleLaunch = () => {
    playBeep();
    setLaunched(true);
    // Show loading overlay after camera starts dollying
    setTimeout(() => {
      setShowDashboardLoader(true);
    }, 800);
    // Transition to full dashboard
    setTimeout(() => {
      setShowDashboard(true);
    }, 3000);
  };

  // --- Animation definitions ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
    exit: {
      opacity: 0,
      y: -40,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] },
    },
  };

  // Seeded stream data for matrix-style scroll
  const hexStream = useMemo(() => {
    return Array.from({ length: 45 }, () =>
      '0x' + (0x100000 + Math.floor(Math.random() * 0xefffff)).toString(16).toUpperCase()
    );
  }, []);

  return (
    <div className="relative h-screen flex flex-col text-white overflow-hidden select-none">

      {/* ── Initial Pulse Loading Screen (0.5s) ── */}
      <AnimatePresence>
        {firstLoad && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed inset-0 bg-[#030612] z-[100] flex flex-col items-center justify-center gap-4 select-none pointer-events-none"
          >
            <div className="w-12 h-12 rounded-[4px] border border-accent-cyan bg-accent-cyan/10 flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(0,229,255,0.45)]">
              <Target className="w-6 h-6 text-accent-cyan" />
            </div>
            <span className="font-space-grotesk text-[10px] tracking-[0.4em] text-accent-cyan font-bold uppercase animate-pulse">
              INITIALIZING NETRA MONITOR...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D background scene (fixed z-0) */}
      <Scene3D launched={launched} triggerShake={triggerShake} />

      {/* ── Blueprint Grid Overlay ── */}
      {launched && (
        <div
          className="fixed inset-0 pointer-events-none z-10 opacity-70"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 85%)',
            WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 85%)',
          }}
        />
      )}

      {/* ── Vignette & Film Grain Overlay (z-40) ── */}
      <div
        className="fixed inset-0 pointer-events-none z-40 mix-blend-overlay opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          background: 'radial-gradient(circle, transparent 50%, rgba(0,0,0,0.32) 100%)'
        }}
      />

      {/* ── Visual Screen Flash on Target Lock ── */}
      {triggerFlash > 0 && (
        <motion.div
          key={`flash-${triggerFlash}`}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 border-[6px] border-accent-cyan pointer-events-none z-50"
        />
      )}

      {/* ━━━ Two-Row Header (96px height total: Row 1 = 56px, Row 2 = 40px) ━━━ */}
      {launched ? (
        <header className="fixed top-0 left-0 right-0 h-24 border-b border-white/10 bg-black/40 backdrop-blur-md z-40 flex flex-col">
          {/* Row 1 (h-14 / 56px) */}
          <div className="h-14 flex items-center justify-between px-8 border-b border-white/5">
            <div className="flex items-center gap-3">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-accent-cyan"
                aria-label="Orbital Tomb Logo"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                <polygon points="12,6 6,16 18,16" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <span className="font-space-grotesk font-bold tracking-[0.3em] text-[15px] text-white">
                ORBITAL TOMB
              </span>
            </div>

            <div className="flex items-center gap-8">
              {['DASHBOARD', 'TARGETS', 'MISSIONS'].map((link) => (
                <span
                  key={link}
                  className={`text-[11px] tracking-[0.2em] font-bold transition-colors cursor-pointer ${link === 'DASHBOARD' ? 'text-accent-cyan' : 'text-white/40 hover:text-white'
                    }`}
                >
                  {link}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right font-space-grotesk">
                <span className="block text-[8px] tracking-[0.15em] text-white/30 uppercase font-bold">
                  UTC TIME
                </span>
                <span className="font-jetbrains-mono text-[13px] font-bold tracking-wider tabular-nums text-accent-cyan">
                  {timeString}
                </span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex items-center gap-4 text-white/40">
                <button className="hover:text-white transition-colors cursor-pointer" aria-label="Settings">
                  <Settings className="w-4 h-4" />
                </button>
                <button className="hover:text-white transition-colors cursor-pointer relative" aria-label="Notifications">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-accent-magenta" />
                </button>
                <button className="hover:text-white transition-colors cursor-pointer" aria-label="User Profile">
                  <User className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2 (h-10 / 40px) */}
          <div className="h-10 flex items-center justify-between px-8 bg-black/20">
            {/* Breadcrumb Trail */}
            <div className="flex items-center gap-2 text-[9px] font-jetbrains-mono tracking-[0.1em] text-white/50 uppercase">
              <span>MISSION CONTROL</span>
              <span className="text-white/20">/</span>
              <span>DASHBOARD</span>
              <span className="text-white/20">/</span>
              <span className="text-accent-cyan font-bold">
                TARGET: {selectedSatellite ? selectedSatellite.name : 'UNASSIGNED'}
              </span>
            </div>

            {/* Mission Elapsed Time (MET) */}
            <div className="font-jetbrains-mono text-[10px] tracking-wider text-accent-green font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              {formatMET(met)}
            </div>

            {/* Link Status */}
            <div className="flex items-center gap-2.5">
              <span className="text-[9px] font-space-grotesk tracking-[0.15em] text-white/50 font-bold uppercase">
                SIGNAL STRENGTH:
              </span>
              <div className="flex items-end gap-0.5 h-3">
                <div className="w-0.5 h-1 bg-accent-green" />
                <div className="w-0.5 h-1.5 bg-accent-green" />
                <div className="w-0.5 h-2 bg-accent-green" />
                <div className="w-0.5 h-2.5 bg-accent-green" />
                <div className="w-0.5 h-3 bg-accent-green" />
              </div>
              <span className="text-[9px] font-jetbrains-mono font-bold text-accent-green">
                LINK_NOMINAL
              </span>
            </div>
          </div>
        </header>
      ) : (
        <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/10 bg-black/40 backdrop-blur-md z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="text-accent-cyan"
              aria-label="Orbital Tomb Logo"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
              <polygon points="12,6 6,16 18,16" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] tracking-[0.25em] font-space-grotesk font-bold uppercase text-white/40 hidden sm:inline">
              SEC_LEVEL // 04
            </span>
          </div>

          <h1 className="font-space-grotesk font-bold tracking-[0.3em] text-[15px] sm:text-[18px] text-white">
            ORBITAL TOMB
          </h1>

          <div className="flex items-center gap-4">
            <div className="text-right font-space-grotesk">
              <span className="block text-[8px] tracking-[0.15em] text-white/30 uppercase font-bold">
                COORDINATED UNIVERSAL TIME
              </span>
              <span className="font-jetbrains-mono text-[14px] font-bold tracking-wider tabular-nums text-accent-cyan">
                {timeString}
              </span>
            </div>
          </div>
        </header>
      )}

      {/* ━━━ Main Content Area ━━━ */}
      <main className={`flex-1 flex flex-col overflow-hidden relative z-10 ${launched ? 'pt-24 pb-10' : 'pt-16 pb-16'}`}>
        <AnimatePresence mode="wait">

          {/* ── VIEW 1: Hero Landing ── */}
          {!launched ? (
            <motion.div
              key="hero-content"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex-1 flex flex-col items-center justify-center px-6 text-center relative"
            >
              {/* Left-side cyberpunk scrolling hexadecimal stream */}
              <div className="absolute left-10 top-24 bottom-24 w-20 overflow-hidden pointer-events-none select-none z-10 [mask-image:linear-gradient(to_bottom,transparent_0%,black_20%,black_80%,transparent_100%)]">
                <motion.div
                  animate={{ y: [0, -600] }}
                  transition={{ repeat: Infinity, ease: 'linear', duration: 16 }}
                  className="flex flex-col gap-2.5 font-jetbrains-mono text-[9px] text-accent-cyan/15 tracking-widest text-left"
                >
                  {hexStream.concat(hexStream).map((code, idx) => (
                    <span key={idx}>{code}</span>
                  ))}
                </motion.div>
              </div>

              {/* Category tag */}
              <motion.span
                variants={textVariants}
                className="text-[10px] tracking-[0.4em] text-accent-cyan font-bold uppercase mb-4"
              >
                DEAD SATELLITE REMOVAL PLANNER
              </motion.span>

              {/* Main title with Chromatic Aberration offset */}
              <motion.h2
                variants={textVariants}
                style={{
                  textShadow: '-2.5px -1.5px 0px rgba(0, 229, 255, 0.45), 2.5px 1.5px 0px rgba(255, 0, 110, 0.45)'
                }}
                className="font-space-grotesk font-bold text-[55px] sm:text-[90px] md:text-[120px] leading-[0.9] tracking-tight uppercase"
              >
                ORBITAL TOMB
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                variants={textVariants}
                className="font-inter text-[15px] sm:text-xl text-text-muted max-w-xl mx-auto mt-6 leading-relaxed"
              >
                Where dead satellites come to rest.
              </motion.p>

              {/* Status details line */}
              <motion.span
                variants={textVariants}
                className="block text-[10px] tracking-[0.25em] text-accent-cyan/60 uppercase mt-12 mb-8 font-space-grotesk font-semibold"
              >
                5 TARGETS IDENTIFIED &middot; LEO + GEO &middot; ISRO-NETRA LIVE
              </motion.span>

              {/* CTA launch trigger button */}
              <motion.div variants={textVariants}>
                <HUDButton
                  label="LAUNCH MISSION CONTROL"
                  icon="crosshair"
                  glowColor="cyan"
                  onClick={handleLaunch}
                />
              </motion.div>
            </motion.div>

            /* ── VIEW 2: Dashboard Loading ── */
          ) : !showDashboard ? (
            <motion.div
              key="dashboard-loader"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                transition: { duration: 0.6, ease: 'easeOut', delay: 0.2 },
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                transition: { duration: 0.4, ease: 'easeIn' },
              }}
              className="flex-1 flex items-center justify-center px-6"
            >
              {showDashboardLoader && (
                <div className="max-w-lg w-full">
                  <GlassCard glowColor="cyan" className="p-8 text-center" tilt={false}>
                    <div className="flex flex-col items-center justify-center py-12 gap-6">
                      {/* Radial scanner spinner */}
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border border-white/5" />
                        <div className="absolute inset-0 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin" />
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] tracking-[0.3em] font-space-grotesk text-accent-cyan uppercase font-bold animate-pulse">
                          DASHBOARD LOADING...
                        </span>
                        <p className="text-[13px] text-text-muted leading-relaxed font-inter">
                          Establishing secure uplink. Calibrating spectroscopic sensors and telemetry paths.
                        </p>
                      </div>

                      {/* Small orbital vector log details */}
                      <div className="w-full text-left font-jetbrains-mono text-[9px] text-accent-cyan/40 bg-black/40 border border-white/5 p-3 rounded-[4px] leading-relaxed">
                        &gt; UPLINK: ISRO_NETRA_FEED [OK]<br />
                        &gt; ORBITAL DISTANCE CALIBRATED TO 80KM [OK]<br />
                        &gt; RESOLVING VECTORS...
                      </div>
                    </div>
                  </GlassCard>
                </div>
              )}
            </motion.div>

            /* ── VIEW 3: Mission Control Dashboard ── */
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }}
              className="flex-1 flex gap-6 p-8 overflow-hidden h-full"
            >
              {/* ── LEFT PANEL: Satellite Registry (360px wide) ── */}
              <aside className="w-[360px] shrink-0 h-full overflow-y-auto flex flex-col gap-4">
                <div className="shrink-0">
                  <button
                    onClick={() => {
                      playBeep();
                      setShowSearch(true);
                    }}
                    className="w-full flex items-center justify-between border border-white/10 hover:border-accent-cyan/40 bg-white/[0.02] hover:bg-accent-cyan/5 px-3 py-2 rounded-[4px] text-white/50 hover:text-white transition-all duration-200 text-[10px] tracking-[0.2em] font-space-grotesk font-bold uppercase cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-accent-cyan" />
                      Filter registry
                    </span>
                    <span className="text-[8px] font-jetbrains-mono border border-white/15 px-1 rounded text-white/30 bg-black/40">F KEY</span>
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <SatelliteList
                    satellites={satellites}
                    selectedId={selectedSatId}
                    onSelect={handleSelectSatellite}
                  />
                </div>
              </aside>

              {/* ── CENTER PANEL: Unified 3D Model, Graph & Action Bar ── */}
              <div className="flex-1 h-full flex flex-col min-h-0 overflow-hidden">
                {selectedSatellite ? (
                  <GlassCard glowColor="cyan" className="flex-1 flex flex-col h-full min-h-0" tilt={false}>
                    <div className="flex flex-col h-full min-h-0 divide-y divide-white/5">
                      {/* Top Bar: Labeled Visualizer Modes */}
                      <div className="flex items-center justify-between pb-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-px bg-accent-cyan" />
                          <span className="text-[10px] tracking-[0.25em] text-text-muted/75 font-space-grotesk uppercase font-bold">
                            02 / TARGET VISUALIZATION
                          </span>
                        </div>

                        <div className="font-jetbrains-mono text-[10px] tracking-wider text-white/70">
                          SPIN RATE: <span className="text-accent-cyan font-light font-weight-200">{selectedSatellite.spinRate.toFixed(2)} RPM</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {(["3d", "orbit", "thermal"] as const).map((mode) => (
                            <button
                              key={mode}
                              onClick={() => {
                                setViewMode(mode);
                                playBeep();
                              }}
                              className={`px-2.5 py-1 rounded-[3px] text-[8px] font-space-grotesk tracking-[0.15em] font-bold uppercase transition-all duration-200 border ${viewMode === mode
                                ? "border-accent-cyan bg-accent-cyan/15 text-accent-cyan shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                                : "border-white/10 text-white/40 hover:text-white hover:border-white/20"
                                }`}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 3D Model Area (top 65%) */}
                      <div className="flex-[65] min-h-0 relative py-4">
                        <div className={`w-full h-full transition-all duration-500 ease-out ${viewMode === "thermal" ? "brightness-125 contrast-125 saturate-200 invert hue-rotate-180" :
                          viewMode === "orbit" ? "hue-rotate-[240deg] brightness-120 saturate-150" : ""
                          }`}>
                          <SatelliteModel satellite={selectedSatellite} showTrajectory={showTrajectory} />
                        </div>
                        {showTrajectory && <TrajectoryStatsOverlay />}
                      </div>

                      {/* Light Curve Graph Area (bottom 35%) */}
                      <div className="flex-[35] min-h-0 flex flex-col relative py-4">
                        <div className="flex items-center justify-between pb-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-px bg-accent-cyan" />
                            <span className="text-[10px] tracking-[0.25em] text-text-muted/75 font-space-grotesk uppercase font-bold">
                              {showFFT ? "03 / SPECTRUM ANALYSIS — FFT" : "03 / SPECTROSCOPIC SIGNATURE"}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                setShowFFT(prev => !prev);
                                playBeep();
                              }}
                              className={`px-2.5 py-1 rounded-[3px] text-[8px] font-space-grotesk tracking-[0.15em] font-bold uppercase transition-all duration-200 border ${showFFT
                                ? "border-accent-cyan bg-accent-cyan/15 text-accent-cyan shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                                : "border-white/10 text-white/40 hover:text-white hover:border-white/30"
                                }`}
                            >
                              FFT
                            </button>

                            <div className="flex items-center gap-1.5">
                              {analyzing && (
                                <span className="text-[9px] tracking-[0.15em] text-red-400 font-space-grotesk uppercase animate-pulse font-bold">SCANNING…</span>
                              )}
                              {!analyzing && (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full pulse-status animate-pulse" style={{ backgroundColor: selectedSatellite.color }} />
                                  <span className="font-space-grotesk text-[9px] tracking-[0.15em] text-white/60 uppercase font-bold">LIVE SCAN</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 min-h-0 h-[200px]">
                          <LightCurveGraph
                            satellite={selectedSatellite}
                            analyzing={analyzing}
                            spinResult={spinResult}
                            onAnalysisDone={handleAnalysisDone}
                            showFFT={showFFT}
                          />
                        </div>
                      </div>

                      {/* Dedicated Action Bar (96px height) */}
                      <div className="h-24 shrink-0 flex items-center justify-between pt-4">
                        {/* Left: State-based Status Label */}
                        <div className="flex flex-col justify-center max-w-[320px] font-space-grotesk">
                          <span className="text-[8px] tracking-[0.2em] text-white/40 font-bold uppercase">
                            OPERATIONAL STATE
                          </span>
                          <span className="text-[10px] tracking-wider text-accent-cyan font-bold mt-1 uppercase">
                            {(() => {
                              if (showTrajectory) return "TRAJECTORY LOCK ESTABLISHED · AUTONOMOUS FLYBY ACTIVE";
                              if (analyzed) return "SPIN SIGNATURE STABLE · CAPTURE WINDOW COMPUTED";
                              if (analyzing) return "RAW SPECTROSCOPY FEED LIVE · COMPUTING FFT";
                              return "TARGET ACQUIRED · STANDBY FOR SPECTRAL ANALYSIS";
                            })()}
                          </span>
                        </div>

                        {/* Center: Large Primary Button */}
                        <div className="flex items-center justify-center">
                          <button
                            onClick={analyzed ? () => { playBeep(); setShowMissionCard(true); addTimelineEvent("CAPTURE WINDOW OPENED", "window"); } : handleAnalyze}
                            disabled={analyzing}
                            className="flex items-center justify-center gap-3 px-6 h-14 w-auto min-w-[280px] rounded-[4px] text-[11px] tracking-[0.25em] font-space-grotesk uppercase font-bold transition-all duration-300 disabled:opacity-50 select-none shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:translate-y-[-2px] active:translate-y-[0px] cursor-pointer"
                            style={{
                              border: analyzed ? "1px solid rgba(0,255,136,0.5)" : "1px solid rgba(0,229,255,0.35)",
                              color: analyzed ? "#00FF88" : "#00E5FF",
                              backgroundColor: analyzed ? "rgba(0,255,136,0.1)" : "rgba(0,229,255,0.06)",
                            }}
                          >
                            {analyzing ? (
                              <>
                                <span className="relative w-4 h-4 flex items-center justify-center">
                                  <span className="absolute inset-0 rounded-full border border-white/5" />
                                  <span className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#00E5FF", borderTopColor: "transparent" }} />
                                </span>
                                SCANNING SIGNATURE...
                              </>
                            ) : analyzed ? (
                              <>
                                <Target className="w-4 h-4" />
                                FIND CAPTURE WINDOW
                              </>
                            ) : (
                              <>
                                <Crosshair className="w-4 h-4" />
                                ANALYZE SPIN STATE
                              </>
                            )}
                          </button>
                        </div>

                        {/* Right: RESET link */}
                        <div className="flex items-center justify-end w-[180px]">
                          {(analyzed || analyzing || showTrajectory) && (
                            <button
                              onClick={() => {
                                playBeep();
                                setAnalyzing(false);
                                setAnalyzed(false);
                                setSpinResult(null);
                                setShowMissionCard(false);
                                setShowTrajectory(false);
                                addTimelineEvent("SYSTEMS RESET", "reset");
                              }}
                              className="text-[9px] tracking-[0.2em] font-space-grotesk text-accent-magenta/60 hover:text-accent-magenta font-bold uppercase transition-colors border-b border-accent-magenta/20 hover:border-accent-magenta/80 pb-0.5 cursor-pointer"
                            >
                              RESET SYSTEM STATE
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                ) : (
                  <GlassCard glowColor="cyan" className="flex-1 flex flex-col h-full min-h-0" tilt={false}>
                    <div className="flex flex-col items-center justify-center text-center space-y-5 h-full">
                      <div className="w-16 h-16 border border-white/[0.08] rounded-full flex items-center justify-center bg-white/[0.02]">
                        <Crosshair className="w-6 h-6 text-text-muted/30" strokeWidth={1.5} />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] tracking-[0.3em] text-text-muted/40 font-space-grotesk uppercase block font-bold">
                          02 / TARGET VISUALIZATION
                        </span>
                        <p className="text-[13px] text-text-muted/50 font-inter leading-relaxed max-w-[260px] mx-auto">
                          Select a target from the registry to begin orbital analysis
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                )}
              </div>
              {/* ── RIGHT PANEL: Telemetry Dashboard (420px wide) ── */}
              <aside className="w-[420px] shrink-0 h-full overflow-y-auto">
                <TelemetryPanel
                  satellite={selectedSatellite}
                  spinResult={spinResult}
                  analyzed={analyzed}
                  timelineEvents={timelineEvents}
                />
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ━━━ Mission Briefing Modal ━━━ */}
      <AnimatePresence>
        {showMissionCard && selectedSatellite && (
          <MissionCard
            satellite={selectedSatellite}
            onGenerateTrajectory={() => {
              playBeep();
              setShowMissionCard(false);
              setShowTrajectory(true);
              addTimelineEvent('TRAJECTORY DRAW STARTED', 'trajectory');
            }}
            onDismiss={() => {
              playBeep();
              setShowMissionCard(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* ━━━ Command Palette Search Modal ━━━ */}
      <AnimatePresence>
        {showSearch && (
          <SearchModal
            isOpen={showSearch}
            onClose={() => setShowSearch(false)}
            satellites={satellites}
            onSelect={handleSelectSatellite}
          />
        )}
      </AnimatePresence>

      {/* ━━━ Two-Row Footer / Status Bar (40px height) ━━━ */}
      {launched && (
        <footer className="fixed bottom-0 left-0 right-0 h-10 bg-black/60 border-t border-white/10 backdrop-blur-md z-[45] px-8 flex items-center text-[10px] uppercase tracking-widest text-white/60">
          <div className="grid grid-cols-3 w-full items-center">
            {/* Left Segment: ISRO NETRA live feed */}
            <div className="flex items-center justify-start gap-2.5 font-space-grotesk">
              <span className="text-white/40 font-bold">ISRO NETRA FEED:</span>
              <span className="flex items-center gap-1.5 text-accent-green font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green pulse-green animate-pulse" />
                LIVE
              </span>
            </div>

            {/* Center Segment: CPU/GPU/NET/SENSORS mini meters */}
            <div className="flex items-center justify-center gap-6">
              <SystemMeter label="CPU" />
              <SystemMeter label="GPU" />
              <SystemMeter label="NET" />
              <SystemMeter label="SENS" />
            </div>

            {/* Right Segment: Checkmark and nominal text */}
            <div className="flex items-center justify-end gap-2 font-space-grotesk">
              <span className="text-white/40 font-bold mr-1">MISSION CONTROL:</span>
              <span className="text-accent-cyan font-bold flex items-center gap-1">
                NOMINAL <Check className="w-3.5 h-3.5 text-accent-green inline" />
              </span>
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}
