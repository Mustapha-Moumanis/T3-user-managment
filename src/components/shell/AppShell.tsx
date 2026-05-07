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
    <div
      style={{
        minHeight: "100vh",
        background: "hsl(var(--background))",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar breadcrumbs={breadcrumbs} />
      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
          margin: "0 auto",
          padding: "32px 32px",
        }}
      >
        {children}
      </main>
    </div>
  );
}
