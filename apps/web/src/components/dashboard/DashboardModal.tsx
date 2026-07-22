"use client";

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
            type="button"
            aria-label="Close modal"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <p>{description}</p>

        <div className="dashboard-modal-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
