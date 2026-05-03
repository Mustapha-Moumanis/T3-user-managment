import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import React from "react";

export default async function ProjectLayout({ children, params }: { children: React.ReactNode, params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  await connectDB();
  let project;
  try {
    project = await Project.findById(projectId).lean();
  } catch (e) {
    notFound();
  }
  if (!project) notFound();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <header className="topbar">
        <Link href="/" className="logo-mark" style={{ flexShrink: 0 }}>UI</Link>
        <Link href="/" style={{ fontWeight: 600, fontSize: 15 }}>
          UserImport
        </Link>
        
        <span style={{ color: "var(--text-3)", fontFamily: "var(--font-mono)", fontSize: 12.5, display: "flex", gap: 4, alignItems: "center" }}>
          <span>/</span>
          <Link href="/" style={{ color: "var(--text-2)" }}>Projects</Link>
          <span>/</span>
          <Link href={`/projects/${projectId}/settings`} style={{ color: "var(--text-2)" }}>{project.name}</Link>
        </span>

        <div style={{ flex: 1 }} />
        
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Link href={`/projects/${projectId}/settings`} title="Project settings" className="btn btn-ghost btn-icon btn-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.18V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
            </Link>
            <ThemeToggle />
        </div>
        <div className="v-divider" />
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--c-1), var(--c-5))",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: 11, fontWeight: 600, flexShrink: 0,
        }}>UI</div>
      </header>

      <main style={{ flex: 1, overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
