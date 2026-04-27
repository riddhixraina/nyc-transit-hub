import type { TFunction } from "i18next";

/** Map API / backend status labels to i18n keys (see locales/en.json). */
const SERVICE_STATUS_KEY: Record<string, string> = {
  "Good Service": "goodService",
  Delays: "delays",
  "Service Change": "serviceChange",
  Suspended: "suspended",
  "Planned Work": "plannedWork",
};

export function translateServiceStatus(status: string, t: TFunction): string {
  const key = SERVICE_STATUS_KEY[status];
  return key ? String(t(key)) : status;
}
