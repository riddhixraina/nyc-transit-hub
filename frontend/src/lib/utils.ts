import clsx from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDelay(delaySeconds: number) {
  if (!delaySeconds) {
    return "On time";
  }

  const minutes = Math.round(delaySeconds / 60);
  return `${minutes} min delay`;
}

export function routeChipStyle(routeColor: string | undefined) {
  const color = routeColor ? `#${routeColor}` : "#112033";
  return {
    backgroundColor: color,
    color: "#ffffff",
  };
}
