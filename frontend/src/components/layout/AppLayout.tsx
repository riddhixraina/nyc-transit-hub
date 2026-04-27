import { Menu, UserCircle2, MessageCircle } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../lib/auth";
import { cn } from "../../lib/utils";
import { BackButton } from "../common/BackButton";
import { LanguageSelector } from "../common/LanguageSelector";

const navItems = [
  { to: "/", key: "home" },
  { to: "/planner", key: "tripPlanner" },
  { to: "/dashboard", key: "dashboard" },
  { to: "/stations", key: "stations" },
  { to: "/routes", key: "routes" },
  { to: "/alerts", key: "alerts" },
  { to: "/accessibility", key: "accessibility" },
  { to: "/analytics", key: "analytics" },
  { to: "/chat", key: "chat" },
  { to: "/favorites", key: "favorites" },
  { to: "/login", key: "login" },
];

export function AppLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const { user, logOut } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-mist bg-grid-fade bg-[size:24px_24px] font-body text-ink">
      <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(13,108,125,0.22),_transparent_45%),radial-gradient(circle_at_top_right,_rgba(230,107,76,0.2),_transparent_40%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_100%)]" />
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/75 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink font-display text-xl font-semibold text-white">
              NY
            </span>
            <div>
              <p className="font-display text-xl">Transit Hub</p>
              <p className="text-xs uppercase tracking-[0.28em] text-slate">
                Live subway control room
              </p>
            </div>
          </NavLink>
          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="rounded-full border border-ink/10 p-3 lg:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <nav
            className={cn(
              "absolute left-4 right-4 top-full rounded-[2rem] border border-white/70 bg-white/95 p-4 shadow-panel lg:static lg:flex lg:flex-1 lg:items-center lg:justify-between lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none",
              !isOpen && "hidden lg:flex",
            )}
          >
            <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      isActive
                        ? "bg-ink text-white"
                        : "text-slate hover:bg-white hover:text-ink",
                    )
                  }
                >
                  {t(item.key)}
                </NavLink>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 lg:mt-0">
              <LanguageSelector />
              {user ? (
                <button
                  type="button"
                  onClick={() => void logOut()}
                  className="inline-flex items-center gap-2 rounded-full bg-tide px-4 py-2 text-sm font-semibold text-white"
                >
                  <UserCircle2 className="h-4 w-4" />
                  {t("signOut")}
                </button>
              ) : (
                <NavLink
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-tide px-4 py-2 text-sm font-semibold text-white"
                >
                  <UserCircle2 className="h-4 w-4" />
                  {t("signIn")}
                </NavLink>
              )}
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <BackButton />
        <Outlet />
      </main>

      {pathname !== "/chat" && (
        <NavLink
          to="/chat"
          className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-lg transition hover:scale-105 hover:bg-tide"
          aria-label={t("chat")}
        >
          <MessageCircle className="h-6 w-6" />
        </NavLink>
      )}
    </div>
  );
}
