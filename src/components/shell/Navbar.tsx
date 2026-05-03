"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function Navbar({ breadcrumbs }: NavbarProps) {
  return (
    <header className="topbar">
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity no-underline text-[var(--text)]">
        <div className="logo-mark" style={{ cursor: "pointer", flexShrink: 0 }}>UI</div>
        <span style={{ fontWeight: 600, fontSize: 15 }}>
          T3 User Import
        </span>
      </Link>

      {breadcrumbs && breadcrumbs.map((bc, i) => (
        <span key={i} className="flex items-center">
          <span style={{ color: "var(--text-3)", fontFamily: "var(--font-mono)", fontSize: 12.5, margin: "0 4px" }}>
            /
          </span>
          {bc.href ? (
            <Link 
              href={bc.href} 
              className="hover:text-[var(--accent)] transition-colors no-underline"
              style={{ color: "var(--text-3)", fontFamily: "var(--font-mono)", fontSize: 12.5 }}
            >
              {bc.label}
            </Link>
          ) : (
            <span style={{ color: "var(--text-3)", fontFamily: "var(--font-mono)", fontSize: 12.5 }}>
              {bc.label}
            </span>
          )}
        </span>
      ))}

      <div style={{ flex: 1 }} />

      <ThemeToggle />
    </header>
  );
}
