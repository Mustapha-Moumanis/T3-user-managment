import type { ReactNode } from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata = {
  title: 'User Import Management',
  description: 'Import and manage users via CSV upload with configurable API connections.',
};

// Inline script that runs before first paint — sets data-theme + accent CSS vars
// Mirrors the t3-dashboard-v1 earlyTheme pattern exactly.
const earlyTheme = `(()=>{
  try {
    const t = localStorage.getItem('uim.theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
    const a = localStorage.getItem('uim.accent') || 'dodgerBlue';
    const presets = {
      dodgerBlue: { l: '#0d74f6', l2: '#4a94ff', ls: '#ebf4ff', d: '#8ab4f8', ds: '#0b2559' },
      indigo:     { l: '#4f46e5', l2: '#6366f1', ls: '#eef2ff', d: '#818cf8', ds: '#1e1b4b' },
      emerald:    { l: '#059669', l2: '#10b981', ls: '#ecfdf5', d: '#34d399', ds: '#022c22' },
      amber:      { l: '#d97706', l2: '#f59e0b', ls: '#fffbeb', d: '#fbbf24', ds: '#451a03' },
      rose:       { l: '#db2777', l2: '#ec4899', ls: '#fdf2f8', d: '#f472b6', ds: '#500724' },
    };
    const p = presets[a] || presets.dodgerBlue;
    const r = document.documentElement.style;
    if (t === 'dark') {
      r.setProperty('--accent', p.d);
      r.setProperty('--accent-soft', p.ds);
    } else {
      r.setProperty('--accent', p.l);
      r.setProperty('--accent-2', p.l2);
      r.setProperty('--accent-soft', p.ls);
    }
    const dens = localStorage.getItem('uim.density');
    document.documentElement.style.fontSize = dens === 'compact' ? '12px' : '13px';
  } catch(_) {}
})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      style={{
        '--accent': '#0d74f6',
        '--accent-2': '#4a94ff',
        '--accent-soft': '#ebf4ff',
        fontSize: '13px',
      } as React.CSSProperties}
      className={`${inter.variable} ${jetbrains.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: earlyTheme }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
