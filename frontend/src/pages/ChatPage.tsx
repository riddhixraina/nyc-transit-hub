import { Send, Bot, User, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { sendChatMessage } from "../api/chat";
import { SectionTitle } from "../components/common/SectionTitle";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

const SUGGESTION_KEYS = [
  "chatSuggest1",
  "chatSuggest2",
  "chatSuggest3",
  "chatSuggest4",
] as const;

export function ChatPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setInput("");
    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    scrollToBottom();

    try {
      const data = await sendChatMessage(msg);
      const assistantMsg: Message = {
        role: "assistant",
        content: data.reply,
        sources: data.sources,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : t("chatErrorGeneric");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("chatErrorMessage", { message: errorMsg }) },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 12rem)" }}>
      <SectionTitle
        eyebrow={t("chat")}
        title={t("chatTitle")}
        description={t("chatDesc")}
      />

      <div className="mt-4 flex flex-1 flex-col rounded-[2rem] border border-white/70 bg-white/90 shadow-panel">
        <div className="flex-1 space-y-4 overflow-y-auto p-6" style={{ maxHeight: "55vh" }}>
          {messages.length === 0 && (
            <div className="space-y-3 py-8 text-center">
              <Bot className="mx-auto h-12 w-12 text-slate/40" />
              <p className="text-sm text-slate">{t("chatEmpty")}</p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {SUGGESTION_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSend(t(key))}
                    className="rounded-full border border-ink/10 bg-mist px-4 py-2 text-xs font-semibold text-ink transition hover:bg-white"
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tide text-white">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-ink text-white"
                    : "bg-mist text-ink"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <p className="mt-2 text-xs opacity-60">
                    {msg.sources.join(" · ")}
                  </p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tide text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("chatThinking")}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-ink/5 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chatPlaceholder")}
              disabled={loading}
              className="flex-1 rounded-full border border-ink/10 bg-mist px-5 py-3 text-sm text-ink outline-none placeholder:text-slate/50 focus:border-tide focus:ring-1 focus:ring-tide disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white transition hover:bg-tide disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
