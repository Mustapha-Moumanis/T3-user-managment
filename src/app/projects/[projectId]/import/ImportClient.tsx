"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UploadMapping, type RawData } from "@/components/UploadMapping";
import { ReviewStep } from "@/components/ReviewStep";
import { applyMapping, parseCSVText, autoDetectMapping, validateAllRows, type MappedRow, type Mapping } from "@/lib/validation";
import { AddUserModal } from "@/components/AddUserModal";
import { useTweaks, TweaksPanel, TweakSection, TweakToggle } from "@/components/TweaksPanel";

export function ImportClient({ project }: { project: any }) {
  const router = useRouter();
  const [screen, setScreen] = React.useState<"upload" | "review">("upload");
  const [rawData, setRawData] = React.useState<RawData | null>(null);
  const [mapping, setMapping] = React.useState<Mapping>({});
  const [rows, setRows] = React.useState<MappedRow[]>([]);
  const [fields, setFields] = React.useState<string[]>([]);
  const [addUserOpen, setAddUserOpen] = React.useState(false);

  const [tweaks, setTweak] = useTweaks({ showRowNumbers: true });

  const handleFileLoad = (parsed: RawData | null, autoMap: Mapping) => {
    if (!parsed) { setRawData(null); setMapping({}); return; }
    setRawData({ ...parsed, fileName: parsed.fileName ?? "users.csv" });
    setMapping(autoMap);
  };

  const handleMappingNext = () => {
    if (!rawData) return;
    const mapped = applyMapping(rawData.rows, mapping);
    const validated = validateAllRows(mapped);
    const activeFields = Object.keys(mapping).filter((k) => mapping[k] && mapping[k] !== "_skip");
    setRows(validated);
    setFields(activeFields);
    setScreen("review");
  };

  return (
    <div style={{ padding: "32px 24px" }}>
      {screen === "upload" && (
        <UploadMapping
          rawData={rawData}
          mapping={mapping}
          onMappingChange={setMapping}
          onFileLoad={handleFileLoad}
          onNext={handleMappingNext}
          onBack={() => router.push("/")}
        />
      )}

      {screen === "review" && (
        <ReviewStep
          rows={rows}
          fields={fields}
          config={project}
          mappedRows={rows}
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

      {/* FAB — mobile add user */}
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
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
          </svg>
        </button>
      )}

      <AddUserModal
        open={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        config={project}
      />

      {/* Tweaks Panel specific to Import */}
      <TweaksPanel>
        <TweakSection title="Table">
          <TweakToggle
            label="Show Row Numbers"
            value={Boolean(tweaks.showRowNumbers)}
            onChange={(v) => setTweak("showRowNumbers", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}
