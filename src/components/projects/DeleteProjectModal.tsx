"use client";

import { useTransition } from "react";

export function DeleteProjectModal({
  projectName,
  onClose,
  onConfirm,
}: {
  projectName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      await onConfirm();
      onClose();
    });
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card modal max-w-[520px]">
        <div className="text-lg font-semibold mb-1.5">Delete project?</div>
        <div className="text-[var(--text-2)]">
          <strong>“{projectName}”</strong> will be permanently removed. Your API credentials will be erased.
        </div>
        <div className="flex justify-end gap-2.5 mt-4">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary bg-[var(--danger)] border-[color-mix(in_srgb,var(--danger)_70%,var(--border-2))]"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
