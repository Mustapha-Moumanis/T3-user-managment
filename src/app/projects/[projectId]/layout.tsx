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
      <main style={{ flex: 1, overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
