import { Menu } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import { cn } from "../../lib/utils";

const navItems = [
  { to: "/", label: "Plan a trip", end: true },
  { to: "/alerts", label: "Alerts" },
  { to: "/accessibility", label: "Accessibility" },
];

export function AppLayout() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-mist font-body text-ink">
      <header className="sticky top-0 z-20 border-b border-ink/5 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink font-display text-lg font-semibold text-white">
              NY
            </span>
            <p className="font-display text-lg">Transit Hub</p>
          </NavLink>
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="rounded-full border border-ink/10 p-2 sm:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <nav
            className={cn(
              "absolute left-4 right-4 top-full rounded-2xl border border-ink/5 bg-white p-3 shadow-panel sm:static sm:flex sm:items-center sm:gap-1 sm:border-none sm:bg-transparent sm:p-0 sm:shadow-none",
              !isOpen && "hidden sm:flex",
            )}
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "block rounded-full px-4 py-2 text-sm font-semibold transition",
                    isActive
                      ? "bg-ink text-white"
                      : "text-slate hover:bg-mist hover:text-ink",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
