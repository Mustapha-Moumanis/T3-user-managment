"use client";

import { useState } from "react";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";

export function NewProjectButton({ variant = "button" }: { variant?: "button" | "card" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "button" ? (
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New project
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="card"
          style={{
            padding: 18,
            borderStyle: "dashed",
            borderWidth: 2,
            borderColor: "var(--border-2)",
            background: "transparent",
            cursor: "pointer",
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
        </button>
      )}

      {open && <ProjectFormModal mode="create" onClose={() => setOpen(false)} />}
    </>
  );
}
