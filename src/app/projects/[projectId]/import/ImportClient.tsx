"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Settings, UserPlus, ArrowRight, Pencil } from "lucide-react";
import { UploadMapping, type RawData } from "@/components/UploadMapping";
import { ReviewStep } from "@/components/ReviewStep";
import { EndpointEditPanel } from "@/components/EndpointEditPanel";
import {
  applyMapping,
  autoDetectMapping,
  validateAllRowsForEndpoint,
  getFieldDefsForEndpoint,
  type ProcessedRow,
  type Mapping,
} from "@/lib/validation";
import type { ProjectEndpoint } from "@/lib/schemas";
import type { ProjectDto } from "@/lib/types";
import { AddUserModal } from "@/components/AddUserModal";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stepper } from "@/components/ui/stepper";

export function ImportClient({ project, globalAllowedDomains = [] }: { project: ProjectDto; globalAllowedDomains?: string[] }) {
  const router = useRouter();
  const endpoints: ProjectEndpoint[] = project.endpoints ?? [];

  const [screen, setScreen] = React.useState<"upload" | "review">("upload");
  const [selectedEndpoint, setSelectedEndpoint] = React.useState<ProjectEndpoint | null>(
    endpoints.length === 1 ? endpoints[0]! : null,
  );
  const [rawData, setRawData] = React.useState<RawData | null>(null);
  const [mapping, setMapping] = React.useState<Mapping>({});
  const [rows, setRows] = React.useState<ProcessedRow[]>([]);
  const [fields, setFields] = React.useState<string[]>([]);
  const [addUserOpen, setAddUserOpen] = React.useState(false);
  const [editingEndpointId, setEditingEndpointId] = React.useState<string | null>(null);
  const [localEndpoints, setLocalEndpoints] = React.useState<ProjectEndpoint[]>(endpoints);

  const handleFileLoad = (parsed: RawData | null, autoMap: Mapping) => {
    if (!parsed) { setRawData(null); setMapping({}); return; }
    setRawData({ ...parsed, fileName: parsed.fileName ?? "users.csv" });
    const saved = selectedEndpoint?.savedMapping ?? {};
    const hasSaved = Object.keys(saved).length > 0;
    setMapping(hasSaved ? { ...autoMap, ...saved } : autoMap);
  };

  const handleMappingNext = () => {
    if (!rawData || !selectedEndpoint) return;
    const mapped = applyMapping(rawData.rows, mapping);
    const validated = validateAllRowsForEndpoint(mapped, selectedEndpoint, new Set(), globalAllowedDomains);
    const activeFields = Object.keys(mapping).filter((k) => mapping[k] && mapping[k] !== "_skip");
    setRows(validated);
    setFields(activeFields);
    setScreen("review");
  };

  const handleSelectEndpoint = (ep: ProjectEndpoint) => {
    setSelectedEndpoint(ep);
    setEditingEndpointId(null);
    setRawData(null);
    setMapping({});
    setRows([]);
    setFields([]);
  };

  const handleEndpointSaved = (updated: ProjectEndpoint) => {
    setLocalEndpoints((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setSelectedEndpoint(updated);
    setEditingEndpointId(null);
    // re-validate rows with updated endpoint if we already have data mapped
    if (rows.length > 0) {
      setRows(validateAllRowsForEndpoint(rows, updated, new Set(), globalAllowedDomains));
    }
  };

  const breadcrumbs = [
    { label: "Projects", href: "/" },
    { label: project.name, href: `/projects/${project.id}/import` },
    ...(screen === "review" ? [{ label: "Review" }] : []),
  ];

  return (
    <AppShell breadcrumbs={breadcrumbs} maxWidth={1100}>
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
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.025em", margin: 0 }}>
            Import users
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 14, marginTop: 4 }}>
            Upload a CSV and map columns to the destination fields.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button variant="ghost" size="icon-sm" asChild>
            <a href={`/projects/${project.id}/settings`}>
              <Settings size={16} />
            </a>
          </Button>
          <Button size="sm" onClick={() => setAddUserOpen(true)}>
            <UserPlus size={14} /> Add single user
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <div style={{ marginBottom: 32 }}>
        <Stepper
          steps={["Upload & map", "Review & import"]}
          current={screen === "upload" ? 0 : 1}
        />
      </div>

      {/* ── Upload screen ── */}
      {screen === "upload" && (
        <>
          {/* Endpoint selector */}
          <Card style={{ marginBottom: 16 }}>
            <CardContent style={{ paddingTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "hsl(var(--foreground))" }}>
                  Destination endpoint
                </span>
                {localEndpoints.length === 1 && selectedEndpoint && (
                  <Button variant="ghost" size="sm" onClick={() => setEditingEndpointId(selectedEndpoint.id)} style={{ fontSize: 12, gap: 4 }}>
                    <Pencil size={12} /> Edit
                  </Button>
                )}
              </div>

              {localEndpoints.length > 1 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {localEndpoints.map((ep) => {
                    const reqCount = ep.requiredFields?.length ?? 0;
                    const selected = selectedEndpoint?.id === ep.id;
                    return (
                      <div key={ep.id} style={{ position: "relative" }}>
                        <button
                          type="button"
                          onClick={() => handleSelectEndpoint(ep)}
                          style={{
                            width: "100%", textAlign: "left", padding: 12, paddingRight: 36,
                            borderRadius: "calc(var(--radius) - 2px)",
                            border: `1px solid ${selected ? "hsl(var(--brand))" : "hsl(var(--border))"}`,
                            background: selected ? "hsl(var(--brand) / 0.06)" : "hsl(var(--background))",
                            cursor: "pointer", transition: "all 120ms",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontWeight: 500, fontSize: 14 }}>{ep.label || ep.path}</span>
                            <span className="method method-POST" style={{ fontSize: 11 }}>{ep.method ?? "POST"}</span>
                          </div>
                          <div className="mono" style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>{ep.path}</div>
                          {reqCount > 0 && (
                            <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 8 }}>{reqCount} required</div>
                          )}
                        </button>
                        <button
                          type="button"
                          title="Edit endpoint"
                          onClick={(e) => { e.stopPropagation(); setEditingEndpointId(ep.id); if (!selected) handleSelectEndpoint(ep); }}
                          style={{
                            position: "absolute", top: 8, right: 8, border: "none", background: "transparent",
                            cursor: "pointer", color: "hsl(var(--muted-foreground))", padding: 4, borderRadius: 4,
                          }}
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {localEndpoints.length === 1 && selectedEndpoint && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                  border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) - 2px)",
                  background: "hsl(var(--background))",
                }}>
                  <span className="method method-POST" style={{ fontSize: 11 }}>{selectedEndpoint.method ?? "POST"}</span>
                  <span className="mono" style={{ fontSize: 13, flex: 1 }}>{selectedEndpoint.path}</span>
                  {selectedEndpoint.label && (
                    <span style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>{selectedEndpoint.label}</span>
                  )}
                  <Badge variant="outline" style={{ fontSize: 11 }}>
                    {(selectedEndpoint.requiredFields?.length ?? 0) + (selectedEndpoint.optionalFields?.length ?? 0)} fields
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {localEndpoints.length === 0 && (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                border: "2px dashed hsl(var(--border))",
                borderRadius: "var(--radius)",
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No endpoints configured</div>
              <p style={{ color: "hsl(var(--muted-foreground))", marginBottom: 20 }}>
                Add endpoints in project settings to enable the import flow.
              </p>
              <Button onClick={() => router.push(`/projects/${project.id}/settings`)}>
                Go to Settings <ArrowRight size={14} />
              </Button>
            </div>
          )}

          {selectedEndpoint && (
            <UploadMapping
              fieldDefs={getFieldDefsForEndpoint(selectedEndpoint)}
              rawData={rawData}
              mapping={mapping}
              onMappingChange={setMapping}
              onFileLoad={handleFileLoad}
              onNext={handleMappingNext}
              onBack={() => router.push("/")}
              savedMapping={selectedEndpoint.savedMapping}
            />
          )}
        </>
      )}

      {/* ── Review screen ── */}
      {screen === "review" && selectedEndpoint && (
        <ReviewStep
          rows={rows}
          fields={fields}
          config={project}
          endpoint={selectedEndpoint}
          mappedRows={rows}
          mapping={mapping}
          globalAllowedDomains={globalAllowedDomains}
          rawRows={rawData?.rows}
          rawHeaders={rawData?.headers}
          onBack={() => setScreen("upload")}
          onRowUpdate={(updated) => setRows(updated)}
          onDeleteSelected={(updated) => setRows(updated)}
          onStartNew={() => {
            setRawData(null);
            setMapping({});
            setRows([]);
            setFields([]);
            setScreen("upload");
          }}
        />
      )}

      {/* Endpoint edit dialog — rendered once, outside the upload/review screens */}
      {editingEndpointId && (
        <EndpointEditPanel
          open={true}
          onOpenChange={(o) => { if (!o) setEditingEndpointId(null); }}
          endpoint={localEndpoints.find((e) => e.id === editingEndpointId) ?? localEndpoints[0]!}
          projectId={project.id}
          globalDomains={globalAllowedDomains}
          onSave={handleEndpointSaved}
        />
      )}

      <AddUserModal open={addUserOpen} onClose={() => setAddUserOpen(false)} config={project} />
    </AppShell>
  );
}
