"use client";

import { useEffect, useRef } from "react";

type DashboardModalProps = {
  title: string;
  description: string;
  open: boolean;
  onClose: () => void;
};

export function DashboardModal({
  title,
  description,
  open,
  onClose,
}: DashboardModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="dashboard-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="dashboard-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dashboard-modal-header">
          <div>
            <span>ATLAS INTELLIGENCE</span>
            <h2 id="dashboard-modal-title">{title}</h2>
          </div>

          <button
            ref={closeRef}
            type="button"
            aria-label="Close modal"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <p className="dashboard-modal-description">{description}</p>

        <div className="dashboard-modal-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
