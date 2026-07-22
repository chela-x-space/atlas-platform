"use client";

type DashboardToastProps = {
  message: string;
};

export function DashboardToast({
  message,
}: DashboardToastProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="dashboard-toast" role="status">
      <span>✓</span>
      {message}
    </div>
  );
}
