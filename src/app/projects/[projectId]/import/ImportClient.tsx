"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UploadMapping, type RawData } from "@/components/UploadMapping";
import { ReviewStep } from "@/components/ReviewStep";
import {
  applyMapping,
  autoDetectMapping,
  validateAllRowsForEndpoint,
  getFieldDefsForEndpoint,
  type MappedRow,
  type Mapping,
} from "@/lib/validation";
import type { ProjectEndpoint } from "@/lib/schemas";
import { AddUserModal } from "@/components/AddUserModal";
import { AppShell } from "@/components/shell/AppShell";

export function ImportClient({ project }: { project: any }) {
  const router = useRouter();
  const endpoints: ProjectEndpoint[] = project.endpoints ?? [];

  const [screen, setScreen] = React.useState<"upload" | "review">("upload");
  const [selectedEndpoint, setSelectedEndpoint] = React.useState<ProjectEndpoint | null>(
    endpoints.length === 1 ? endpoints[0]! : null,
  );
  const [rawData, setRawData] = React.useState<RawData | null>(null);
  const [mapping, setMapping] = React.useState<Mapping>({});
  const [rows, setRows] = React.useState<MappedRow[]>([]);
  const [fields, setFields] = React.useState<string[]>([]);
  const [addUserOpen, setAddUserOpen] = React.useState(false);

  const handleFileLoad = (parsed: RawData | null, autoMap: Mapping) => {
    if (!parsed) { setRawData(null); setMapping({}); return; }
    setRawData({ ...parsed, fileName: parsed.fileName ?? "users.csv" });

    // Auto-apply saved mapping if available, with autoDetect as fallback
    const saved = selectedEndpoint?.savedMapping ?? {};
    const hasSaved = Object.keys(saved).length > 0;
    setMapping(hasSaved ? { ...autoMap, ...saved } : autoMap);
  };

  const handleMappingNext = () => {
    if (!rawData || !selectedEndpoint) return;
    const mapped = applyMapping(rawData.rows, mapping);
    const validated = validateAllRowsForEndpoint(mapped, selectedEndpoint);
    const activeFields = Object.keys(mapping).filter((k) => mapping[k] && mapping[k] !== "_skip");
    setRows(validated);
    setFields(activeFields);
    setScreen("review");
  };

  const handleSelectEndpoint = (ep: ProjectEndpoint) => {
    setSelectedEndpoint(ep);
    setRawData(null);
    setMapping({});
    setRows([]);
    setFields([]);
  };

  const breadcrumbs = [
    { label: "Projects", href: "/" },
    { label: project.name, href: `/projects/${project.id}/import` },
    ...(screen === "review" ? [{ label: "Review" }] : []),
  ];

  return (
    <AppShell breadcrumbs={breadcrumbs}>
      {/* ── Step 1: Upload & Map (with optional endpoint selector) ── */}
      {screen === "upload" && (
        <div>
          {/* Endpoint selector — shown if multiple endpoints */}
          {endpoints.length > 1 && (
            <div className="mb-6">
              <div className="label text-sm mb-2">Select Endpoint</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 10,
                }}
              >
                {endpoints.map((ep) => (
                  <div
                    key={ep.id}
                    className="card"
                    onClick={() => handleSelectEndpoint(ep)}
                    style={{
                      padding: "14px 16px",
                      cursor: "pointer",
                      border: `2px solid ${selectedEndpoint?.id === ep.id ? "var(--accent)" : "var(--border)"}`,
                      background: selectedEndpoint?.id === ep.id ? "var(--accent-soft)" : "var(--surface)",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                      {ep.label || ep.path}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                      {ep.method ?? "POST"} {ep.path}
                    </div>
                    {((ep.requiredFields?.length ?? 0) > 0 || (ep.optionalFields?.length ?? 0) > 0) && (
                      <div style={{ fontSize: 10, marginTop: 4, color: "var(--text-3)" }}>
                        {ep.requiredFields?.length ?? 0} required · {ep.optionalFields?.length ?? 0} optional fields
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {endpoints.length === 0 && (
            <div className="card" style={{ padding: "48px 24px", textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No endpoints configured</div>
              <div style={{ color: "var(--text-3)", marginBottom: 20 }}>
                Add endpoints in project settings to enable the import flow.
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => router.push(`/projects/${project.id}/settings`)}
              >
                Go to Settings →
              </button>
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
        </div>
      )}

      {/* ── Step 2: Review & Import ── */}
      {screen === "review" && selectedEndpoint && (
        <ReviewStep
          rows={rows}
          fields={fields}
          config={project}
          endpoint={selectedEndpoint}
          mappedRows={rows}
          mapping={mapping}
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

      {project.baseUrl && (
        <button
          type="button"
          className="btn btn-primary btn-icon"
          onClick={() => setAddUserOpen(true)}
          title="Add single user"
          style={{
            position: "fixed",
            bottom: 32,
            right: 24,
            width: 52,
            height: 52,
            borderRadius: 999,
            boxShadow: "0 4px 20px color-mix(in srgb, var(--accent) 45%, transparent)",
            zIndex: 10,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
        </button>
      )}

      <AddUserModal open={addUserOpen} onClose={() => setAddUserOpen(false)} config={project} />
    </AppShell>
  );
}
