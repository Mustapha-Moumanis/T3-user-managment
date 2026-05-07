"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject, updateProject } from "@/actions/projects";
import type { ProjectFormValues, ProjectEndpoint } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Lock, Eye, EyeOff,
  Loader2, CheckCircle, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";

const ACCENT_COLORS = [
  { key: "indigo",  hex: "#6366f1" },
  { key: "blue",    hex: "#3b82f6" },
  { key: "emerald", hex: "#10b981" },
  { key: "rose",    hex: "#f43f5e" },
  { key: "amber",   hex: "#f59e0b" },
  { key: "violet",  hex: "#8b5cf6" },
];

const ACCENT_KEY_TO_HEX: Record<string, string> = Object.fromEntries(
  ACCENT_COLORS.map((c) => [c.key, c.hex])
);

function colorKeyFromHex(hex: string): string | null {
  const entry = ACCENT_COLORS.find((c) => c.hex === hex.toLowerCase());
  return entry ? entry.key : null;
}

type FieldDef = { key: string; label: string; type: "string" | "number" | "array" };

const FieldEditor = ({
  endpointId, fieldType, label, endpoints, onAdd, onUpdate, onRemove,
}: {
  endpointId: string;
  fieldType: "requiredFields" | "optionalFields";
  label: string;
  endpoints: ProjectEndpoint[];
  onAdd: (epId: string, type: "requiredFields" | "optionalFields") => void;
  onUpdate: (epId: string, type: "requiredFields" | "optionalFields", idx: number, key: keyof FieldDef, val: string) => void;
  onRemove: (epId: string, type: "requiredFields" | "optionalFields", idx: number) => void;
}) => {
  const ep = endpoints.find((e) => e.id === endpointId);
  const fields = (ep?.[fieldType] || []) as FieldDef[];
  return (
    <div style={{ marginTop: 8 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "hsl(var(--muted-foreground))" }}>{label}</span>
        <Button variant="ghost" size="icon-sm" type="button" onClick={() => onAdd(endpointId, fieldType)}>
          <Plus size={12} />
        </Button>
      </div>
      {fields.length === 0 ? (
        <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", fontStyle: "italic" }}>No fields defined</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {fields.map((f, i) => (
            <div key={i} className="grid" style={{ gridTemplateColumns: "1fr 1fr 90px 32px", gap: 6 }}>
              <Input className="mono" style={{ height: 28, fontSize: 12 }} value={f.key} onChange={(e) => onUpdate(endpointId, fieldType, i, "key", e.target.value)} placeholder="fieldKey" />
              <Input style={{ height: 28, fontSize: 12 }} value={f.label} onChange={(e) => onUpdate(endpointId, fieldType, i, "label", e.target.value)} placeholder="Label" />
              <select
                className={cn("flex h-7 w-full rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2 text-xs")}
                value={f.type || "string"}
                onChange={(e) => onUpdate(endpointId, fieldType, i, "type", e.target.value)}
              >
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="array">array</option>
              </select>
              <Button variant="ghost" size="icon-sm" type="button" style={{ height: 28, width: 28, color: "hsl(var(--destructive))" }} onClick={() => onRemove(endpointId, fieldType, i)}>
                <Trash2 size={12} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function ProjectConfig({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: Partial<ProjectFormValues & { id: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [showSecret, setShowSecret] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  const resolveInitialColor = () => {
    const c = initial?.color;
    if (!c) return "indigo";
    if (ACCENT_COLORS.some((a) => a.key === c)) return c;
    const key = colorKeyFromHex(c);
    return key ?? "indigo";
  };

  const [color, setColor] = useState(resolveInitialColor());
  const [data, setData] = useState<ProjectFormValues>({
    name: initial?.name || "",
    description: initial?.description || "",
    color: resolveInitialColor(),
    baseUrl: initial?.baseUrl || "",
    auth: {
      type: initial?.auth?.type || "bearer",
      value: initial?.auth?.value || "",
      headerName: initial?.auth?.headerName || "Authorization",
      username: initial?.auth?.username || "",
      tokenUrl: initial?.auth?.tokenUrl || "",
      clientId: initial?.auth?.clientId || "",
    },
    endpoints: (initial?.endpoints as ProjectEndpoint[]) || [
      { id: "create", label: "Create User", method: "POST", path: "/users", requiredFields: [], optionalFields: [] },
    ],
  });

  const updateColor = (key: string) => {
    setColor(key);
    setData((d) => ({ ...d, color: key }));
  };

  // Endpoint handlers
  const handleEpChange = (id: string, field: string, val: string) =>
    setData((d) => ({ ...d, endpoints: (d.endpoints || []).map((e) => (e.id === id ? { ...e, [field]: val } : e)) }));

  const addEndpoint = () => {
    const id = Math.random().toString(36).substring(7);
    setData((d) => ({ ...d, endpoints: [...(d.endpoints || []), { id, label: "", method: "POST", path: "", requiredFields: [], optionalFields: [] }] }));
  };

  const removeEndpoint = (id: string) =>
    setData((d) => ({ ...d, endpoints: (d.endpoints || []).filter((e) => e.id !== id) }));

  const addField = (epId: string, ft: "requiredFields" | "optionalFields") =>
    setData((d) => ({
      ...d, endpoints: (d.endpoints || []).map((ep) => ep.id !== epId ? ep : { ...ep, [ft]: [...(ep[ft] || []), { key: "", label: "", type: "string" as const }] }),
    }));

  const updateField = (epId: string, ft: "requiredFields" | "optionalFields", idx: number, key: keyof FieldDef, val: string) =>
    setData((d) => ({
      ...d, endpoints: (d.endpoints || []).map((ep) => {
        if (ep.id !== epId) return ep;
        const arr = [...(ep[ft] || [])];
        arr[idx] = { ...arr[idx]!, [key]: val };
        return { ...ep, [ft]: arr };
      }),
    }));

  const removeField = (epId: string, ft: "requiredFields" | "optionalFields", idx: number) =>
    setData((d) => ({
      ...d, endpoints: (d.endpoints || []).map((ep) => {
        if (ep.id !== epId) return ep;
        const arr = [...(ep[ft] || [])];
        arr.splice(idx, 1);
        return { ...ep, [ft]: arr };
      }),
    }));

  const handleAuthChange = (field: string, val: string) =>
    setData((d) => ({ ...d, auth: { ...d.auth, [field]: val } }));

  const canNext = () => {
    if (step === 1) return data.name.trim().length > 0;
    if (step === 2) return !!data.baseUrl?.trim() && (data.endpoints || []).length > 0 && (data.endpoints || []).every((e) => e.path?.trim());
    if (step === 3) {
      const { type, value, headerName, username, tokenUrl, clientId } = data.auth || {};
      if (type === "none") return true;
      if (type === "bearer") return !!value?.trim();
      if (type === "apikey") return !!headerName?.trim() && !!value?.trim();
      if (type === "basic") return !!username?.trim() && !!value?.trim();
      if (type === "oauth2") return !!clientId?.trim() && !!value?.trim() && !!tokenUrl?.trim();
    }
    return true;
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createProject({ ...data, color });
          router.push("/");
        } else if (initial?.id) {
          await updateProject(initial.id, { ...data, color });
          router.push(`/projects/${initial.id}/import`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  };

  const testConnection = () => {
    setTestStatus("testing");
    setTimeout(() => {
      const ok = data.baseUrl?.trim().startsWith("http") && !!data.auth?.value?.trim();
      setTestStatus(ok ? "success" : "error");
    }, 900);
  };

  const STEPS = ["Info", "API & Endpoints", "Authentication", "Review"];
  const dot = ACCENT_KEY_TO_HEX[color] ?? "#6366f1";

  return (
    <div style={{ width: "100%" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.025em", margin: 0 }}>
            {mode === "create" ? "New project" : "Edit project"}
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 14, marginTop: 4 }}>
            Configure your API connection step-by-step.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => (mode === "edit" && initial?.id ? router.push(`/projects/${initial.id}/import`) : router.push("/"))}>
          Cancel
        </Button>
      </div>

      {/* Stepper */}
      <div style={{ marginBottom: 32 }}>
        <Stepper steps={STEPS} current={step - 1} />
      </div>

      {/* Card */}
      <Card className="fade-in">
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Project details</CardTitle>
              <CardDescription>Give this project a name and a theme color.</CardDescription>
            </CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proj-name">Name</Label>
                <Input id="proj-name" value={data.name} onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Compostage Prod" autoFocus />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proj-desc">
                  Description <span style={{ fontWeight: 400, color: "hsl(var(--muted-foreground))" }}>(optional)</span>
                </Label>
                <Textarea id="proj-desc" value={data.description} onChange={(e) => setData((d) => ({ ...d, description: e.target.value }))} placeholder="What is this project for?" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Theme color</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {ACCENT_COLORS.map(({ key, hex }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateColor(key)}
                      title={key}
                      style={{
                        width: 36, height: 36, borderRadius: 999, border: "none",
                        background: hex, cursor: "pointer",
                        boxShadow: color === key ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${hex}` : "none",
                        transition: "box-shadow 120ms",
                      }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>API &amp; endpoints</CardTitle>
              <CardDescription>Define the base URL and the routes you'll import users to.</CardDescription>
            </CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="base-url">Base URL</Label>
                <Input id="base-url" className="mono" value={data.baseUrl} onChange={(e) => setData((d) => ({ ...d, baseUrl: e.target.value }))} placeholder="https://api.example.com/v1" />
              </div>
              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <Label>Endpoints</Label>
                  <Button variant="outline" size="sm" type="button" onClick={addEndpoint}>
                    <Plus size={14} /> Add endpoint
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  {(data.endpoints || []).map((ep) => (
                    <div
                      key={ep.id}
                      style={{
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "calc(var(--radius) - 2px)",
                        background: "hsl(var(--muted) / 0.3)",
                        padding: 12,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <select
                          className="method"
                          value={ep.method || "POST"}
                          onChange={(e) => handleEpChange(ep.id, "method", e.target.value)}
                          style={{
                            width: 90, height: 36, fontFamily: "ui-monospace, monospace",
                            fontSize: 12, fontWeight: 700, cursor: "pointer",
                            border: "1px solid hsl(var(--input))", borderRadius: "calc(var(--radius)-4px)",
                            background: "hsl(var(--background))", color: "hsl(var(--foreground))",
                            padding: "0 8px",
                          }}
                        >
                          <option>POST</option><option>PUT</option><option>PATCH</option>
                        </select>
                        <Input className="mono" value={ep.path} onChange={(e) => handleEpChange(ep.id, "path", e.target.value)} placeholder="/users/create" style={{ flex: 2 }} />
                        <Input value={ep.label} onChange={(e) => handleEpChange(ep.id, "label", e.target.value)} placeholder="Label" style={{ flex: 1 }} />
                        <Badge variant="outline" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                          {(ep.requiredFields?.length ?? 0) + (ep.optionalFields?.length ?? 0)} fields
                        </Badge>
                        <Button variant="ghost" size="icon-sm" type="button" style={{ color: "hsl(var(--destructive))", flexShrink: 0 }} onClick={() => removeEndpoint(ep.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      <div style={{ marginTop: 8, borderTop: "1px solid hsl(var(--border))", paddingTop: 8 }}>
                        <FieldEditor endpointId={ep.id} fieldType="requiredFields" label="Required Fields" endpoints={data.endpoints || []} onAdd={addField} onUpdate={updateField} onRemove={removeField} />
                        <FieldEditor endpointId={ep.id} fieldType="optionalFields" label="Optional Fields" endpoints={data.endpoints || []} onAdd={addField} onUpdate={updateField} onRemove={removeField} />
                      </div>
                    </div>
                  ))}
                  {(data.endpoints || []).length === 0 && (
                    <div style={{ padding: "24px", textAlign: "center", border: "2px dashed hsl(var(--border))", borderRadius: "calc(var(--radius) - 2px)", color: "hsl(var(--muted-foreground))", fontSize: 13 }}>
                      No endpoints yet. Add one above.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>How requests will be authenticated.</CardDescription>
            </CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="flex flex-col gap-1.5">
                <Label>Auth method</Label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {[
                    { v: "bearer", l: "Bearer Token", d: "JWT or static token" },
                    { v: "apikey", l: "API Key", d: "Custom header" },
                    { v: "basic",  l: "Basic Auth", d: "User + password" },
                    { v: "oauth2", l: "OAuth2", d: "Client credentials" },
                    { v: "none",   l: "No Auth", d: "Public API" },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => handleAuthChange("type", opt.v)}
                      style={{
                        textAlign: "left", padding: 12, cursor: "pointer", transition: "all 120ms",
                        borderRadius: "calc(var(--radius) - 2px)",
                        border: `1px solid ${data.auth?.type === opt.v ? "hsl(var(--brand))" : "hsl(var(--border))"}`,
                        background: data.auth?.type === opt.v ? "hsl(var(--brand) / 0.06)" : "hsl(var(--background))",
                      }}
                    >
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{opt.l}</div>
                      <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>{opt.d}</div>
                    </button>
                  ))}
                </div>
              </div>

              {data.auth?.type === "bearer" && (
                <div className="flex flex-col gap-1.5">
                  <Label>Bearer token</Label>
                  <div style={{ position: "relative" }}>
                    <Lock size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
                    <Input className="mono" type={showSecret ? "text" : "password"} value={data.auth?.value || ""} onChange={(e) => handleAuthChange("value", e.target.value)} style={{ paddingLeft: 36, paddingRight: 36 }} placeholder="eyJhbGci..." />
                    <button type="button" onClick={() => setShowSecret(!showSecret)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", cursor: "pointer", color: "hsl(var(--muted-foreground))", padding: 4 }}>
                      {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              )}

              {data.auth?.type === "apikey" && (
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12 }}>
                  <div className="flex flex-col gap-1.5">
                    <Label>Header name</Label>
                    <Input className="mono" value={data.auth?.headerName || ""} onChange={(e) => handleAuthChange("headerName", e.target.value)} placeholder="X-API-Key" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>API key value</Label>
                    <div style={{ position: "relative" }}>
                      <Lock size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
                      <Input className="mono" type={showSecret ? "text" : "password"} value={data.auth?.value || ""} onChange={(e) => handleAuthChange("value", e.target.value)} style={{ paddingLeft: 36, paddingRight: 36 }} />
                      <button type="button" onClick={() => setShowSecret(!showSecret)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", cursor: "pointer", color: "hsl(var(--muted-foreground))", padding: 4 }}>
                        {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {data.auth?.type === "basic" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="flex flex-col gap-1.5">
                    <Label>Username</Label>
                    <Input value={data.auth?.username || ""} onChange={(e) => handleAuthChange("username", e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Password</Label>
                    <div style={{ position: "relative" }}>
                      <Input type={showSecret ? "text" : "password"} value={data.auth?.value || ""} onChange={(e) => handleAuthChange("value", e.target.value)} style={{ paddingRight: 36 }} />
                      <button type="button" onClick={() => setShowSecret(!showSecret)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", cursor: "pointer", color: "hsl(var(--muted-foreground))", padding: 4 }}>
                        {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {data.auth?.type === "oauth2" && (
                <div className="flex flex-col gap-3">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                    <div className="flex flex-col gap-1.5">
                      <Label>Client ID</Label>
                      <Input value={data.auth?.clientId || ""} onChange={(e) => handleAuthChange("clientId", e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Client secret</Label>
                      <div style={{ position: "relative" }}>
                        <Input type={showSecret ? "text" : "password"} value={data.auth?.value || ""} onChange={(e) => handleAuthChange("value", e.target.value)} style={{ paddingRight: 36 }} />
                        <button type="button" onClick={() => setShowSecret(!showSecret)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", cursor: "pointer", color: "hsl(var(--muted-foreground))", padding: 4 }}>
                          {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Token URL</Label>
                    <Input className="mono" value={data.auth?.tokenUrl || ""} onChange={(e) => handleAuthChange("tokenUrl", e.target.value)} placeholder="https://auth.example.com/oauth/token" />
                  </div>
                </div>
              )}

              {data.auth?.type !== "none" && (
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" type="button" disabled={!data.baseUrl || testStatus === "testing"} onClick={testConnection}>
                    {testStatus === "testing" ? <><Loader2 size={14} className="spin" /> Testing…</> : "Test connection"}
                  </Button>
                  {testStatus === "success" && <Badge variant="success"><CheckCircle size={12} /> Connected</Badge>}
                  {testStatus === "error" && <Badge variant="destructive"><AlertCircle size={12} /> Failed</Badge>}
                </div>
              )}
            </CardContent>
          </>
        )}

        {step === 4 && (
          <>
            <CardHeader>
              <CardTitle>Review &amp; finalize</CardTitle>
              <CardDescription>Confirm everything before creating the project.</CardDescription>
            </CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { label: "Project", value: data.name, sub: data.description, showDot: true, edit: 1 },
                { label: "API", value: data.baseUrl || "—", sub: `${(data.endpoints || []).length} endpoint${(data.endpoints || []).length !== 1 ? "s" : ""}`, edit: 2 },
                { label: "Authentication", value: (data.auth?.type || "bearer").toUpperCase(), showBadge: true, edit: 3 },
              ].map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "16px 0",
                    borderBottom: i < 2 ? "1px solid hsl(var(--border))" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginBottom: 4 }}>{row.label}</div>
                    <div className="flex items-center gap-2" style={{ fontWeight: 500 }}>
                      {row.showDot && <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />}
                      {row.value}
                      {row.showBadge && <Badge variant="success">configured</Badge>}
                    </div>
                    {row.sub && <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 4 }}>{row.sub}</div>}
                  </div>
                  <Button variant="ghost" size="sm" type="button" onClick={() => setStep(row.edit)}>Edit</Button>
                </div>
              ))}
              {error && (
                <div style={{ marginTop: 12, fontSize: 13, color: "hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.3)", padding: "8px 12px", borderRadius: "calc(var(--radius) - 2px)" }}>
                  {error}
                </div>
              )}
            </CardContent>
          </>
        )}

        <CardFooter style={{ justifyContent: "space-between" }}>
          <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
            <ArrowLeft size={14} /> Back
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep((s) => Math.min(4, s + 1))} disabled={!canNext()}>
              Continue <ArrowRight size={14} />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isPending || !canNext()}>
              {isPending ? (mode === "create" ? "Creating…" : "Saving…") : (mode === "create" ? "Create project" : "Save changes")}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
