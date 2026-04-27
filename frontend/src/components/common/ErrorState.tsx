export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-coral/30 bg-white p-6 text-sm text-ink shadow-panel">
      <p className="font-semibold text-coral">Unable to load data</p>
      <p className="mt-2 text-slate">{message}</p>
    </div>
  );
}
