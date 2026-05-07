"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Folder, Users, AlertCircle, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProjectCard } from "./ProjectCard";

const STATS = [
  { label: "Active projects", icon: Folder, trend: "+1 this week" },
  { label: "Users imported", value: "—", icon: Users, trend: "via import flow" },
  { label: "Failed rows", value: "—", icon: AlertCircle, trend: "—" },
  { label: "Last import", value: "—", icon: Activity, trend: "—" },
];

export function ProjectsClient({ projects }: { projects: any[] }) {
  const [search, setSearch] = useState("");

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              margin: 0,
              color: "hsl(var(--foreground))",
            }}
          >
            Projects
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 14, marginTop: 4 }}>
            Manage your API integrations and import users.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "hsl(var(--muted-foreground))",
              }}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects"
              style={{ paddingLeft: 32, width: 240 }}
            />
          </div>
          <Button asChild>
            <Link href="/projects/new">
              <Plus size={16} /> New project
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {STATS.map((s, i) => (
          <Card key={i} style={{ padding: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>{s.label}</span>
              <s.icon size={16} style={{ color: "hsl(var(--muted-foreground))" }} />
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "hsl(var(--foreground))",
              }}
            >
              {i === 0 ? projects.length : (s.value ?? "—")}
            </div>
            <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 4 }}>
              {s.trend}
            </div>
          </Card>
        ))}
      </div>

      {/* Project grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 16,
        }}
      >
        {filtered.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}

        {/* Ghost "new project" card */}
        <Link href="/projects/new" style={{ textDecoration: "none" }}>
          <Card
            style={{
              borderStyle: "dashed",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 220,
              cursor: "pointer",
              color: "hsl(var(--muted-foreground))",
              transition: "border-color 160ms, color 160ms",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--brand))";
              (e.currentTarget as HTMLElement).style.color = "hsl(var(--brand))";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "";
              (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))";
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "hsl(var(--muted))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Plus size={20} />
            </div>
            <div style={{ fontWeight: 500, color: "hsl(var(--foreground))", fontSize: 14 }}>
              New project
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Connect a new API</div>
          </Card>
        </Link>
      </div>
    </>
  );
}
