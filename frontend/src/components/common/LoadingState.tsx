export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/80 p-6 text-sm text-slate shadow-panel">
      {label}
    </div>
  );
}
