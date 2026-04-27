const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001";

type ApiErrorPayload = {
  error?: boolean;
  message?: string;
};

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = null;
    }

    throw new Error(
      payload?.message ?? `Request failed with status ${response.status}`,
    );
  }

  return (await response.json()) as T;
}

export { API_BASE };
