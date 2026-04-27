export function StatusSummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-panel">
      <p className="text-xs uppercase tracking-[0.2em] text-slate">{label}</p>
      <p className="mt-3 font-display text-4xl text-ink">{value}</p>
    </div>
  );
}
