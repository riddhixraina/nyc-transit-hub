import { API_BASE } from "./client";

export type ChatResponse = {
  reply: string;
  sources: string[];
  error?: boolean;
  message?: string;
};

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = (await response.json()) as ChatResponse;

  if (!response.ok) {
    throw new Error(data.message ?? `Request failed with status ${response.status}`);
  }

  return data;
}
