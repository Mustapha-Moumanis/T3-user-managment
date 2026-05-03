"use client";

import { ReactNode } from "react";
import { Navbar } from "./Navbar";

interface AppShellProps {
  children: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  maxWidth?: number | string;
}

export function AppShell({ children, breadcrumbs, maxWidth = 1100 }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <Navbar breadcrumbs={breadcrumbs} />
      
      <main className="flex-1 w-full mx-auto px-6 py-8" style={{ 
        maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth, 
      }}>
        {children}
      </main>
    </div>
  );
}
