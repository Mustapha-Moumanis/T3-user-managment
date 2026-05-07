"use client";

import { useState, useTransition } from "react";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeleteProjectModal({
  projectName,
  onClose,
  onConfirm,
}: {
  projectName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      await onConfirm();
      onClose();
    });
  };

  const confirmed = confirmation === projectName;

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <div style={{ padding: "24px 24px 8px" }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                background: "hsl(var(--destructive) / 0.12)",
                color: "hsl(var(--destructive))",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <AlertCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Delete project</div>
              <p style={{ fontSize: 14, color: "hsl(var(--muted-foreground))", margin: 0, lineHeight: 1.5 }}>
                This will permanently remove <strong>{projectName}</strong> and its saved column
                mappings. This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Confirmation input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label>Type the project name to confirm</Label>
            <Input
              placeholder={projectName}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!confirmed || isPending}>
            {isPending ? "Deleting…" : "Delete project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
