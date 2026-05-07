"use client";

import Link from "next/link";
import { useState } from "react";
import { Star, Pencil, ArrowRight } from "lucide-react";
import { formatRelative } from "@/lib/format";
import { starProject } from "@/actions/projects";
import { DeleteProjectModal } from "./DeleteProjectModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const ACCENT_DOT: Record<string, string> = {
  indigo: "#6366f1",
  blue: "#3b82f6",
  emerald: "#10b981",
  rose: "#f43f5e",
  amber: "#f59e0b",
  violet: "#8b5cf6",
  dodgerBlue: "#0d74f6",
};

export function ProjectCard({ project }: { project: any }) {
  const [deleting, setDeleting] = useState(false);
  const [starred, setStarred] = useState(project.starred);

  const dotColor = ACCENT_DOT[project.color] ?? "#6366f1";
  const endpointCount = project.endpoints?.length || 0;
  const authType = project.auth?.type || project.auth?.method || "bearer";

  const handleStar = async () => {
    setStarred(!starred);
    await starProject(project.id, !starred);
  };

  return (
    <>
      <Card
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 16,
          transition: "transform 160ms, box-shadow 160ms",
          cursor: "default",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
        }}
      >
        {/* Row 1: name + actions */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="flex items-center gap-2">
              <span
                style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }}
              />
              <span
                className="truncate"
                style={{ fontWeight: 600, fontSize: 14, color: "hsl(var(--foreground))" }}
              >
                {project.name}
              </span>
            </div>
            <div
              className="mono truncate"
              style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 2 }}
            >
              {project.baseUrl || "—"}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleStar}
              style={{ color: starred ? "#f59e0b" : undefined }}
            >
              <Star size={14} fill={starred ? "#f59e0b" : "none"} />
            </Button>
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href={`/projects/${project.id}/settings`}>
                <Pencil size={14} />
              </Link>
            </Button>
          </div>
        </div>

        {/* Row 2: badge strip */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="mono uppercase" style={{ fontSize: 11 }}>
            {authType}
          </Badge>
          <Badge variant="secondary">{endpointCount} endpoint{endpointCount !== 1 ? "s" : ""}</Badge>
          {starred && <Badge variant="warning">Starred</Badge>}
        </div>

        {/* Row 3: description */}
        <div
          style={{
            flex: 1,
            minHeight: 32,
            fontSize: 13,
            color: "hsl(var(--muted-foreground))",
          }}
        >
          {project.description || "No description provided."}
        </div>

        {/* Row 4: footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 12,
            borderTop: "1px solid hsl(var(--border))",
          }}
        >
          <Button variant="default" size="sm" asChild>
            <Link href={`/projects/${project.id}/import`}>
              Open import <ArrowRight size={14} />
            </Link>
          </Button>
          {project.updatedAt && (
            <span style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
              Updated {formatRelative(project.updatedAt)}
            </span>
          )}
        </div>
      </Card>

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
