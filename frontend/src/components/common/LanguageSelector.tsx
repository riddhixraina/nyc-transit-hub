import { Globe } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../../i18n";

export function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLabel =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language)?.label ?? "English";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget)) setOpen(false);
        }}
        className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink"
      >
        <Globe className="h-4 w-4" />
        {currentLabel}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 min-w-[10rem] rounded-2xl border border-white/70 bg-white p-2 shadow-panel">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                void i18n.changeLanguage(lang.code);
                setOpen(false);
              }}
              className={`w-full rounded-xl px-4 py-2 text-left text-sm font-semibold transition ${
                i18n.language === lang.code
                  ? "bg-ink text-white"
                  : "text-ink hover:bg-mist"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
