export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-tide">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-3xl text-ink">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate">{description}</p>
    </div>
  );
}
