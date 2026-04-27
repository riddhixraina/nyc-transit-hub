export type GeocodeHit = {
  label: string;
  lat: number;
  lon: number;
};

const NYC_VIEWBOX = "-74.30,40.45,-73.65,40.95";

export async function geocode(query: string, signal?: AbortSignal): Promise<GeocodeHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const params = new URLSearchParams({
    q,
    format: "json",
    limit: "5",
    viewbox: NYC_VIEWBOX,
    bounded: "1",
    countrycodes: "us",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;
  return data.map((d) => ({
    label: d.display_name,
    lat: parseFloat(d.lat),
    lon: parseFloat(d.lon),
  }));
}
