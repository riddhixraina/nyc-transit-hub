import { useEffect, useMemo, useRef, useState } from "react";
import { geocode, type GeocodeHit } from "../../lib/geocode";

type Props = {
  label: string;
  value: GeocodeHit | null;
  onChange: (hit: GeocodeHit | null) => void;
  placeholder?: string;
};

export function PlaceCombobox({ label, value, onChange, placeholder }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (value) return;
    const q = query.trim();
    if (q.length < 3) {
      setHits([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await geocode(q, ctrl.signal);
        setHits(r);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, value]);

  const display = useMemo(() => {
    if (value) return value.label;
    return query;
  }, [value, query]);

  return (
    <div ref={wrapRef} className="relative z-0 overflow-visible">
      <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate">
        {label}
      </label>
      <input
        type="text"
        value={display}
        onChange={(e) => {
          if (value) onChange(null);
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? "e.g. 1 World Trade Center"}
        className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-base text-ink shadow-sm outline-none focus:border-tide focus:ring-2 focus:ring-tide/20"
      />
      {open && (loading || hits.length > 0) ? (
        <ul className="absolute z-[100] mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-ink/10 bg-white py-1 shadow-2xl ring-1 ring-ink/5">
          {loading ? (
            <li className="px-4 py-2 text-xs text-slate">Searching...</li>
          ) : (
            hits.map((h, i) => (
              <li key={`${h.lat},${h.lon},${i}`}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(h);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-ink hover:bg-mist"
                >
                  {h.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
