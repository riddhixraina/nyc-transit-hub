export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-ink/15 bg-white/70 p-8 text-center shadow-panel">
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <p className="mt-2 text-sm text-slate">{description}</p>
    </div>
  );
}
