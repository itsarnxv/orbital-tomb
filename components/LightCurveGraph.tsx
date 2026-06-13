'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { Satellite } from '@/data/satellites';
import type { SpinAnalysisResult } from '@/lib/analyzeSpin';

interface LightCurveGraphProps {
  satellite: Satellite;
  analyzing?: boolean;
  spinResult?: SpinAnalysisResult | null;
  onAnalysisDone?: () => void;
  showFFT?: boolean;
}

const W = 600;
const H = 170;
const PAD = { top: 24, right: 16, bottom: 28, left: 36 };

export default function LightCurveGraph({
  satellite,
  analyzing = false,
  spinResult = null,
  onAnalysisDone,
  showFFT = false,
}: LightCurveGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef<number>(0);
  const cursorRef = useRef<number>(0);

  // Analysis animation state
  const [scanX, setScanX]           = useState<number | null>(null);
  const [showSpike, setShowSpike]   = useState(false);
  const [hoverPos, setHoverPos]     = useState<{ x: number; y: number } | null>(null);
  
  const analyzeRef = useRef(false);
  const scanStartRef = useRef<number>(0);
  const SCAN_DURATION = 1500; // ms

  const { peaks, peakVal, troughVal } = React.useMemo(() => {
    const lc = satellite.lightCurve;
    const peaks: number[] = [];
    for (let i = 1; i < lc.length - 1; i++) {
      if (lc[i] > lc[i - 1] && lc[i] > lc[i + 1]) peaks.push(i);
    }
    return {
      peaks,
      peakVal:   Math.max(...lc),
      troughVal: Math.min(...lc),
    };
  }, [satellite.id]);

  // Kick off scan animation when analyzing flips to true
  useEffect(() => {
    if (!analyzing) return;
    analyzeRef.current = true;
    setShowSpike(false);
    setScanX(0);
    scanStartRef.current = performance.now();

    const id = setTimeout(() => {
      setScanX(null);
      setShowSpike(true);
      analyzeRef.current = false;
      onAnalysisDone?.();
    }, SCAN_DURATION + 100);

    return () => clearTimeout(id);
  }, [analyzing]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lc = satellite.lightCurve;
    const color = satellite.color;
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top  - PAD.bottom;

    const mapY = (v: number) => PAD.top + innerH - Math.max(0, Math.min(1, v)) * innerH;
    const mapX = (i: number) => PAD.left + (i / (lc.length - 1)) * innerW;

    // ─────────────────────────────────────────────────────────────────────────
    //  FFT SPECTRUM VIEW MODE
    // ─────────────────────────────────────────────────────────────────────────
    if (showFFT) {
      ctx.clearRect(0, 0, W, H);

      // ── Grid lines ──
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const x = PAD.left + (i / 4) * innerW;
        ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, PAD.top + innerH); ctx.stroke();
      }
      for (let i = 0; i <= 2; i++) {
        const y = PAD.top + (i / 2) * innerH;
        ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + innerW, y); ctx.stroke();
      }

      // Simulate 40 frequency bins from 0.0 Hz to 1.0 Hz
      const bins = 40;
      const time = performance.now() / 1000;
      
      const f_target = spinResult ? spinResult.frequencyHz : (1 / (60 / satellite.spinRate));
      const targetBin = Math.round((f_target / 1.0) * bins);
      const binWidth = innerW / bins - 2;

      for (let i = 0; i < bins; i++) {
        let amplitude = 0.04; // baseline noise floor
        
        // Dynamic noise
        amplitude += (Math.sin(time * 6 + i) * 0.5 + 0.5) * 0.03;

        if (spinResult || analyzing) {
          const progress = analyzing ? (scanX ?? 0) : 1.0;
          
          // Primary Peak
          if (Math.abs(i - targetBin) <= 2) {
            const dist = Math.abs(i - targetBin);
            const factor = dist === 0 ? 0.82 : dist === 1 ? 0.38 : 0.08;
            amplitude += factor * progress;
          }
          
          // 2nd Harmonic
          const h2Bin = targetBin * 2;
          if (h2Bin < bins && Math.abs(i - h2Bin) <= 1) {
            const dist = Math.abs(i - h2Bin);
            const factor = dist === 0 ? 0.22 : 0.08;
            amplitude += factor * progress;
          }
        }

        const barH = Math.max(2, amplitude * innerH);
        const bx = PAD.left + (i / bins) * innerW + 1;
        const by = PAD.top + innerH - barH;

        // Draw spectral bar
        const barGrad = ctx.createLinearGradient(bx, by, bx, PAD.top + innerH);
        barGrad.addColorStop(0, color);
        barGrad.addColorStop(1, color + '05');

        ctx.fillStyle = barGrad;
        ctx.fillRect(bx, by, binWidth, barH);
      }

      // FFT Frequency Labels
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font      = '9px "JetBrains Mono", monospace';
      ctx.fillText('0.0 Hz', PAD.left,              PAD.top + innerH + 14);
      ctx.fillText('0.5 Hz', PAD.left + innerW / 2, PAD.top + innerH + 14);
      ctx.fillText('1.0 Hz', PAD.left + innerW,     PAD.top + innerH + 14);

      // Dominant frequency badge
      ctx.textAlign = 'right';
      if (spinResult) {
        ctx.font      = 'bold 10px "Space Grotesk", sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(
          `DOMINANT: ${spinResult.frequencyHz.toFixed(3)} Hz`,
          W - PAD.right,
          PAD.top + 10
        );
        ctx.font      = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillText(
          `CONF: ${(spinResult.confidence * 100).toFixed(0)}%`,
          W - PAD.right,
          PAD.top + 22
        );
      } else if (analyzing) {
        ctx.font      = 'bold 10px "Space Grotesk", sans-serif';
        ctx.fillStyle = '#FF3333';
        ctx.fillText('CALCULATING FFT...', W - PAD.right, PAD.top + 10);
      } else {
        ctx.font      = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillText('STANDBY — NO SIGNAL', W - PAD.right, PAD.top + 10);
      }

      return;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  NORMAL LIGHT CURVE VIEW MODE
    // ─────────────────────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, W, H);

    // ── grid ──
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const x = PAD.left + (i / 4) * innerW;
      ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, PAD.top + innerH); ctx.stroke();
    }
    for (let i = 0; i <= 2; i++) {
      const y = PAD.top + (i / 2) * innerH;
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + innerW, y); ctx.stroke();
    }

    // ── gradient area fill ──
    const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + innerH);
    grad.addColorStop(0,   color + '28');
    grad.addColorStop(1,   color + '00');
    ctx.beginPath();
    ctx.moveTo(mapX(0), PAD.top + innerH);
    for (let i = 0; i < lc.length; i++) ctx.lineTo(mapX(i), mapY(lc[i]));
    ctx.lineTo(mapX(lc.length - 1), PAD.top + innerH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // ── main curve ──
    ctx.beginPath();
    ctx.moveTo(mapX(0), mapY(lc[0]));
    for (let i = 1; i < lc.length; i++) {
      const mx = (mapX(i - 1) + mapX(i)) / 2;
      const my = (mapY(lc[i - 1]) + mapY(lc[i])) / 2;
      ctx.quadraticCurveTo(mapX(i - 1), mapY(lc[i - 1]), mx, my);
    }
    ctx.lineTo(mapX(lc.length - 1), mapY(lc[lc.length - 1]));
    ctx.shadowColor = color;
    ctx.shadowBlur  = 8;
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    ctx.stroke();
    ctx.shadowBlur  = 0;

    // ── peak markers (yellow dots) + labels ──
    for (const pi of peaks) {
      const px = mapX(pi);
      const py = mapY(lc[pi]);
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#FFB800';
      ctx.fill();

      // Peak value label
      ctx.font      = 'bold 8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#FFB800';
      ctx.textAlign = 'center';
      ctx.fillText(lc[pi].toFixed(2), px, py - 6);
    }

    // ── animated cursor (only when not analyzing) ──
    if (!analyzeRef.current) {
      const ci = Math.floor(cursorRef.current) % lc.length;
      const cx = mapX(ci);
      const cy = mapY(lc[ci]);
      ctx.beginPath();
      ctx.moveTo(cx, PAD.top);
      ctx.lineTo(cx, PAD.top + innerH);
      ctx.strokeStyle = '#FF006E35';
      ctx.lineWidth   = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.shadowColor = '#FF006E';
      ctx.shadowBlur  = 10;
      ctx.fillStyle   = '#FF006E';
      ctx.fill();
      ctx.shadowBlur  = 0;
    }

    // ── RED SCAN LINE (during analysis) ──
    if (scanX !== null) {
      const sx = PAD.left + scanX * innerW;
      ctx.beginPath();
      ctx.moveTo(sx, PAD.top);
      ctx.lineTo(sx, PAD.top + innerH);
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur  = 12;
      ctx.strokeStyle = '#FF3333';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
      ctx.shadowBlur  = 0;

      // Spike at each peak crossed
      for (const pi of peaks) {
        const px = mapX(pi);
        if (px <= sx + 4) {
          const conf = spinResult?.confidence ?? 0.8;
          const spikeH = innerH * conf * 0.7;
          ctx.beginPath();
          ctx.moveTo(px, PAD.top + innerH);
          ctx.lineTo(px, PAD.top + innerH - spikeH);
          ctx.shadowColor = '#FF0000';
          ctx.shadowBlur  = 16;
          ctx.strokeStyle = '#FF4444';
          ctx.lineWidth   = 1.5;
          ctx.stroke();
          ctx.shadowBlur  = 0;
          ctx.beginPath();
          ctx.arc(px, PAD.top + innerH - spikeH, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#FF4444';
          ctx.fill();
        }
      }
    }

    // ── POST-SCAN: permanent spike + label ──
    if (showSpike && spinResult) {
      const conf = spinResult.confidence;
      for (const pi of peaks) {
        const px = mapX(pi);
        const spikeH = innerH * conf * 0.7;
        ctx.beginPath();
        ctx.moveTo(px, PAD.top + innerH);
        ctx.lineTo(px, PAD.top + innerH - spikeH);
        ctx.shadowColor = '#FF3333';
        ctx.shadowBlur  = 10;
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth   = 1.5;
        ctx.stroke();
        ctx.shadowBlur  = 0;
      }

      // Dominant frequency label
      ctx.font      = 'bold 10px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#FF6666';
      ctx.textAlign = 'right';
      ctx.fillText(
        `DOMINANT: ${spinResult.frequencyHz.toFixed(3)} Hz`,
        W - PAD.right,
        PAD.top + 10
      );

      ctx.font      = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255,100,100,0.6)';
      ctx.fillText(
        `CONF: ${(conf * 100).toFixed(0)}%`,
        W - PAD.right,
        PAD.top + 22
      );
    } else {
      // Normal axis labels
      ctx.font      = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.textAlign = 'right';
      ctx.fillText('1.0', PAD.left - 4, PAD.top + 4);
      ctx.fillText('0.0', PAD.left - 4, PAD.top + innerH + 4);
      ctx.fillText(`PEAK: ${peakVal.toFixed(2)}`,   W - PAD.right, PAD.top + 10);
      ctx.fillText(`MIN: ${troughVal.toFixed(2)}`,  W - PAD.right, PAD.top + 22);
    }

    // Axis time labels
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font      = '9px "JetBrains Mono", monospace';
    ctx.fillText('t−50s', PAD.left,              PAD.top + innerH + 14);
    ctx.fillText('t=0',   PAD.left + innerW / 2, PAD.top + innerH + 14);
    ctx.fillText('t+50s', PAD.left + innerW,     PAD.top + innerH + 14);

    // ── Hover guide + tooltip tooltip (only when not analyzing and hoverPos exists) ──
    if (!analyzeRef.current && hoverPos) {
      if (hoverPos.x >= PAD.left && hoverPos.x <= W - PAD.right) {
        const ratio = (hoverPos.x - PAD.left) / innerW;
        const idx = Math.max(0, Math.min(lc.length - 1, Math.round(ratio * (lc.length - 1))));
        const val = lc[idx];
        const hx = mapX(idx);
        const hy = mapY(val);

        // Vertical guide line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(hx, PAD.top);
        ctx.lineTo(hx, PAD.top + innerH);
        ctx.stroke();
        ctx.setLineDash([]);

        // Interactive dot
        ctx.beginPath();
        ctx.arc(hx, hy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#00E5FF';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();

        // Tooltip box
        const boxW = 55;
        const boxH = 18;
        const bx = Math.max(PAD.left, Math.min(W - PAD.right - boxW, hx - boxW / 2));
        const by = Math.max(PAD.top, hy - 25);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(bx, by, boxW, boxH, 4);
        } else {
          ctx.rect(bx, by, boxW, boxH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(val.toFixed(2), bx + boxW / 2, by + 12);
      }
    }

  }, [satellite, peaks, peakVal, troughVal, scanX, showSpike, spinResult, showFFT, hoverPos]);

  // Normal animation loop
  useEffect(() => {
    let lastTime = performance.now();
    const SPEED = 12;

    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Advance scan line position
      if (analyzeRef.current && scanStartRef.current > 0) {
        const elapsed = now - scanStartRef.current;
        setScanX(Math.min(1, elapsed / SCAN_DURATION));
      }

      if (!analyzeRef.current) {
        cursorRef.current = (cursorRef.current + SPEED * delta) % 100;
      }

      draw();
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onMouseMove={(e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = W / rect.width;
        const scaleY = H / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        setHoverPos({ x, y });
      }}
      onMouseLeave={() => setHoverPos(null)}
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-label="Light Curve Graph"
    />
  );
}
