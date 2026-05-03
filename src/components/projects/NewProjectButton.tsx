"use client";

import Link from "next/link";

export function NewProjectButton({ variant = "button" }: { variant?: "button" | "card" }) {
  if (variant === "button") {
    return (
      <Link href="/projects/new" className="btn btn-primary no-underline">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New project
      </Link>
    );
  }

  return (
    <Link
      href="/projects/new"
      className="card no-underline hover:border-[var(--border)] transition-colors duration-200"
      style={{
        padding: 18,
        borderStyle: "dashed",
        borderWidth: 2,
        borderColor: "var(--border-2)",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        minHeight: 150,
      }}
    >
      <span style={{ color: "var(--text-3)", fontSize: 20 }}>+</span>
      <span style={{ color: "var(--text-2)", fontWeight: 500, fontSize: 13 }}>New project</span>
    </Link>
  );
}
