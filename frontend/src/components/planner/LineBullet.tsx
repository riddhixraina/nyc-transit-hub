import type { Route } from "../../types/api";

export function LineBullet({
  line,
  route,
  size = "md",
}: {
  line: string;
  route?: Route;
  size?: "sm" | "md";
}) {
  const bg = route?.route_color ? `#${route.route_color}` : "#475569";
  const fg = route?.route_text_color ? `#${route.route_text_color}` : "#ffffff";
  const dim = size === "sm" ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm";
  return (
    <span
      className={`inline-flex ${dim} items-center justify-center rounded-full font-display font-bold`}
      style={{ backgroundColor: bg, color: fg }}
      aria-label={`Line ${line}`}
    >
      {line}
    </span>
  );
}
