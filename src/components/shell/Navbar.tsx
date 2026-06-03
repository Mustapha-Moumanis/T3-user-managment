"use client";

import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function Navbar({ breadcrumbs }: NavbarProps) {
  return (
    <header
      style={{
        height: 56,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        borderBottom: "1px solid hsl(var(--border))",
        background: "hsl(var(--background) / 0.8)",
        backdropFilter: "blur(8px)",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 no-underline">
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "hsl(var(--brand))",
            color: "hsl(var(--brand-foreground))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Users size={16} />
        </div>
        <span style={{ fontWeight: 600, fontSize: 14, color: "hsl(var(--foreground))" }}>
          UserImport
        </span>
      </Link>

      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1" style={{ marginLeft: 4 }}>
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
              {bc.href ? (
                <Link
                  href={bc.href}
                  style={{ fontSize: 13, color: "hsl(var(--muted-foreground))" }}
                  className="hover:text-[hsl(var(--foreground))] transition-colors no-underline"
                >
                  {bc.label}
                </Link>
              ) : (
                <span style={{ fontSize: 13, fontWeight: 500, color: "hsl(var(--foreground))" }}>
                  {bc.label}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }} />
      <ThemeToggle />
    </header>
  );
}
