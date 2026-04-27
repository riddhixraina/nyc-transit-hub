import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Route, Station } from "../../types/api";
import { parseLines } from "../../lib/router";
import { LineBullet } from "./LineBullet";

const BOROUGH_I18N_KEY: Record<string, string> = {
  M: "boroughManhattan",
  Bk: "boroughBrooklyn",
  Bx: "boroughBronx",
  Q: "boroughQueens",
  SI: "boroughStatenIsland",
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
  const { t } = useTranslation();
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
    if (!q) return stations.slice(0, 40);
    return stations
      .filter((s) => s.stop_name.toLowerCase().includes(q))
      .slice(0, 50);
  }, [query, stations]);

  const display = value ? value.stop_name : query;
  const valueLines = value ? parseLines(value.daytime_routes) : [];

  return (
    <div ref={wrapRef} className="relative z-0 overflow-visible">
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
          placeholder={placeholder ?? t("searchAStation")}
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
          {BOROUGH_I18N_KEY[value.borough]
            ? t(BOROUGH_I18N_KEY[value.borough]!)
            : value.borough}
        </p>
      ) : null}
      {open && matches.length > 0 ? (
        <ul
          className="absolute z-[100] mt-2 max-h-80 w-full min-w-[min(100%,20rem)] overflow-y-auto rounded-2xl border border-ink/10 bg-white py-1 shadow-2xl ring-1 ring-ink/5"
          role="listbox"
        >
          {query.trim() === "" && stations.length > 0 ? (
            <li className="border-b border-ink/5 px-3 py-2 text-xs text-slate">
              {t("stationComboboxHint", { count: stations.length })}
            </li>
          ) : null}
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
                      {BOROUGH_I18N_KEY[s.borough]
                        ? t(BOROUGH_I18N_KEY[s.borough]!)
                        : s.borough}
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
