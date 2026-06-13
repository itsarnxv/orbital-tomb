import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        nebula: {
          deep: '#05060F',
          purple: '#1a0b2e',
          blue: '#0b1a3a',
        },
        accent: {
          cyan: '#00E5FF',
          magenta: '#FF006E',
          green: '#00FF88',
          amber: '#FFB800',
        },
        text: {
          muted: '#8B9DC3',
        },
      },
      fontFamily: {
        'space-grotesk': ['var(--font-space-grotesk)', 'sans-serif'],
        'inter': ['var(--font-inter)', 'sans-serif'],
        'jetbrains-mono': ['var(--font-jetbrains-mono)', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
        glass: '20px',
      },
      boxShadow: {
        'glass-glow': '0 8px 32px 0 rgba(0, 229, 255, 0.08), inset 0 0 32px 0 rgba(255, 255, 255, 0.03)',
        'glass-glow-hover': '0 8px 32px 0 rgba(0, 229, 255, 0.25), inset 0 0 32px 0 rgba(255, 255, 255, 0.08)',
        'cyan-border': '0 0 12px rgba(0, 229, 255, 0.3)',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
      },
      animation: {
        'gradient-shift': 'gradient-shift 4s ease infinite',
      },
    },
  },
  plugins: [],
};
export default config;
