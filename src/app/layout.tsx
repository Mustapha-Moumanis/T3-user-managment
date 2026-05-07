import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata = {
  title: 'UserImport',
  description: 'Bulk import users into REST APIs via CSV upload.',
};

// Sets data-theme and data-accent before first paint
const earlyTheme = `(()=>{
  try {
    const t = localStorage.getItem('uim.theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
    const a = localStorage.getItem('uim.accent') || 'indigo';
    document.documentElement.setAttribute('data-accent', a);
  } catch(_) {}
})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      data-accent="indigo"
      suppressHydrationWarning
      className={inter.variable}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: earlyTheme }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
