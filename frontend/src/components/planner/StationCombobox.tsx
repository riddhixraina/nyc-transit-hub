import { useEffect, useMemo, useRef, useState } from "react";
import type { Route, Station } from "../../types/api";
import { parseLines } from "../../lib/router";
import { LineBullet } from "./LineBullet";

const BOROUGH_LABEL: Record<string, string> = {
  M: "Manhattan",
  Bk: "Brooklyn",
  Bx: "Bronx",
  Q: "Queens",
  SI: "Staten Island",
};

type Props = {
  label: string;
  value: Station | null;
  onChange: (station: Station | null) => void;
  stations: Station[];
  routesById: Map<string, Route>;
  placeholder?: string;
};

export function StationCombobox({
  label,
  value,
  onChange,
  stations,
  routesById,
  placeholder,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
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

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stations.slice(0, 8);
    return stations
      .filter((s) => s.stop_name.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, stations]);

  const display = value ? value.stop_name : query;
  const valueLines = value ? parseLines(value.daytime_routes) : [];

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          type="text"
          value={display}
          onChange={(e) => {
            if (value) onChange(null);
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? "Search a station"}
          className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 pr-24 text-base text-ink shadow-sm outline-none focus:border-tide focus:ring-2 focus:ring-tide/20"
        />
        {value ? (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-1">
            {valueLines.map((l) => (
              <LineBullet key={l} line={l} route={routesById.get(l)} size="sm" />
            ))}
          </div>
        ) : null}
      </div>
      {value ? (
        <p className="mt-1 text-xs text-slate">
          {BOROUGH_LABEL[value.borough] ?? value.borough}
        </p>
      ) : null}
      {open && matches.length > 0 ? (
        <ul className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-ink/10 bg-white py-1 shadow-panel">
          {matches.map((s) => {
            const lines = parseLines(s.daytime_routes);
            return (
              <li key={s.stop_id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(s);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm hover:bg-mist"
                >
                  <span>
                    <span className="block font-medium text-ink">{s.stop_name}</span>
                    <span className="block text-xs text-slate">
                      {BOROUGH_LABEL[s.borough] ?? s.borough}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {lines.map((l) => (
                      <LineBullet key={l} line={l} route={routesById.get(l)} size="sm" />
                    ))}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
