import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import CustomCursor from '@/components/CustomCursor';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ORBITAL TOMB — Dead Satellite Debris Removal Planner',
  description: 'Advanced real-time simulation and orbital cleanup coordination interface for dead satellites and space debris removal.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased min-h-screen relative select-none">
        {/* CRT Scan lines layer */}
        <div className="scan-lines" aria-hidden="true" />
        
        {/* Premium nebula backdrop */}
        <div className="nebula-bg" aria-hidden="true" />
        
        {/* Custom cursor dot */}
        <CustomCursor />
        
        {children}
      </body>
    </html>
  );
}
