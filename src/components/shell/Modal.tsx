"use client";

import type { ReactNode } from "react";

export function Modal({
  children,
  onClose,
  width = 720,
}: {
  children: ReactNode;
  onClose: () => void;
  width?: number;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card animate-up"
        onClick={(e) => e.stopPropagation()}
        style={{ width, maxHeight: "88vh", overflow: "auto", boxShadow: "var(--shadow-lg)" }}
      >
        {children}
      </div>
    </div>
  );
}
