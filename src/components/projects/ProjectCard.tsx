"use client";

import Link from "next/link";
import { useState } from "react";
import { formatRelative } from "@/lib/format";
import { starProject } from "@/actions/projects";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { DeleteProjectModal } from "./DeleteProjectModal";
// import { type ProjectDoc } from "@/lib/models/Project";

// Helper copied from t3-dashboard-v1
const ACCENT_PRESETS: Record<string, { l: string }> = {
  dodgerBlue: { l: "#0d74f6" },
  indigo:     { l: "#4f46e5" },
  emerald:    { l: "#059669" },
  amber:      { l: "#d97706" },
  rose:       { l: "#db2777" },
};

export function ProjectCard({ project }: { project: any }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const editingColor = project.color || "dodgerBlue";
  const accentValue = editingColor.startsWith("#") ? editingColor : (ACCENT_PRESETS[editingColor]?.l || ACCENT_PRESETS.dodgerBlue.l);
  const endpointCount = project.endpoints?.length || 0;

  return (
    <>
      <div className="card" style={{ padding: 18, position: "relative", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Link href={`/projects/${project.id}/import`} className="truncate" style={{ fontWeight: 600, fontSize: 16, display: "block" }}>
              {project.name}
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span className="mono truncate" style={{ color: "var(--text-3)", fontSize: 13, maxWidth: 240 }}>
                {project.baseUrl || "—"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => starProject(project.id, !project.starred)}
              style={{ color: project.starred ? "var(--warn)" : "var(--text-3)" }}
            >
              {project.starred ? "★" : "☆"}
            </button>
            <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(true)} aria-label="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
            <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleting(true)} aria-label="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="badge badge-accent">
            {project.auth?.type || "bearer"}
          </span>
          <span className="badge">{endpointCount} endpoint{endpointCount !== 1 ? "s" : ""}</span>
        </div>

        <div style={{ flex: 1, marginTop: 14, color: "var(--text-2)", fontSize: 13 }}>
          {project.description || "No description provided."}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <Link href={`/projects/${project.id}/import`} className="btn btn-primary btn-sm">
            Import Workflow
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {project.updatedAt && (
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                Updated {formatRelative(project.updatedAt)}
              </span>
            )}
            <span
              title="Theme color"
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: accentValue,
                flexShrink: 0,
              }}
            />
          </div>
        </div>
      </div>

      {editing && (
        <ProjectFormModal
          mode="edit"
          initial={project}
          onClose={() => setEditing(false)}
        />
      )}

      {deleting && (
        <DeleteProjectModal
          projectName={project.name}
          onClose={() => setDeleting(false)}
          onConfirm={async () => {
            const { deleteProject } = await import("@/actions/projects");
            await deleteProject(project.id);
          }}
        />
      )}
    </>
  );
}
