const STATUS_STYLES = {
  NEW: 'bg-slate-100 text-slate-800 ring-slate-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-900 ring-amber-200',
  RESOLVED: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
};

const STATUS_LABELS = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

export function StatusBadge({ status }) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.NEW;
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles}`}
    >
      {label}
    </span>
  );
}
