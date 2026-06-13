'use client';

import React from 'react';
import { Loader2, ChevronRight, Crosshair } from 'lucide-react';

interface HUDButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: 'chevron' | 'crosshair' | 'none';
  isLoading?: boolean;
  glowColor?: 'cyan' | 'magenta';
}

export default function HUDButton({
  label,
  icon = 'none',
  isLoading = false,
  disabled = false,
  glowColor = 'cyan',
  className = '',
  id,
  ...props
}: HUDButtonProps) {
  const isButtonDisabled = disabled || isLoading;

  // Render the requested icon
  const renderIcon = () => {
    if (isLoading) {
      return <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-cyan" />;
    }
    switch (icon) {
      case 'chevron':
        return <ChevronRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 text-inherit" />;
      case 'crosshair':
        return <Crosshair className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-90 text-inherit" />;
      default:
        return null;
    }
  };

  const glowColors = {
    cyan: 'shadow-[inset_0_0_10px_rgba(0,229,255,0.15)] group-hover:shadow-[inset_0_0_18px_rgba(0,229,255,0.4)] border-accent-cyan/20',
    magenta: 'shadow-[inset_0_0_10px_rgba(255,0,110,0.15)] group-hover:shadow-[inset_0_0_18px_rgba(255,0,110,0.4)] border-accent-magenta/20',
  };

  const activeGlow = glowColors[glowColor];

  return (
    <button
      id={id}
      disabled={isButtonDisabled}
      className={`
        relative p-[1px] rounded-[4px] overflow-hidden group transition-all duration-300
        ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 cursor-none'}
        ${className}
      `}
      {...props}
    >
      {/* Animated Gradient Border Outer Layer */}
      <div 
        className={`
          absolute inset-0 bg-gradient-to-r from-accent-cyan via-accent-magenta to-accent-cyan 
          bg-[length:200%_auto] transition-opacity duration-300
          ${isButtonDisabled ? 'opacity-30' : 'opacity-70 group-hover:opacity-100 animate-gradient-shift'}
        `}
      />

      {/* Button Content Area */}
      <span 
        className={`
          relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-[3px] 
          bg-black/90 text-white font-space-grotesk tracking-[0.2em] text-[11px] font-bold uppercase
          transition-all duration-300
          ${activeGlow}
          ${!isButtonDisabled && 'group-hover:text-accent-cyan'}
        `}
      >
        {label}
        {renderIcon()}
      </span>
    </button>
  );
}
