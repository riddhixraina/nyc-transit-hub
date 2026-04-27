import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function BackButton() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (pathname === "/") return null;

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-slate transition hover:bg-mist hover:text-ink"
    >
      <ArrowLeft className="h-4 w-4" />
      {t("back")}
    </button>
  );
}
