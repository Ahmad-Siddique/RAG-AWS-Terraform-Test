"use client";

import { useCallback, useState, type KeyboardEvent } from "react";

type ChatComposerProps = {
  activeChatId: string | null;
  sending: boolean;
  hasSelectedDocuments: boolean;
  onSend: (content: string) => Promise<void>;
};

export function ChatComposer({
  activeChatId,
  sending,
  hasSelectedDocuments,
  onSend,
}: ChatComposerProps) {
  const [draft, setDraft] = useState("");

  const disabled =
    sending ||
    activeChatId === null ||
    !hasSelectedDocuments ||
    draft.trim().length === 0;

  const handleSubmit = useCallback(async () => {
    if (disabled) {
      return;
    }
    const content = draft;
    setDraft("");
    await onSend(content);
  }, [disabled, draft, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="border-t border-slate-800/80 bg-slate-950/90 px-4 py-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl flex-col gap-2.5 sm:flex-row sm:items-end">
        <label className="sr-only" htmlFor="chat-message">
          Message
        </label>
        <textarea
          id="chat-message"
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={activeChatId === null || sending}
          placeholder={
            activeChatId === null
              ? "Create or select a chat first…"
              : !hasSelectedDocuments
                ? "Select at least one ready document…"
                : "Ask about your documents…"
          }
          className="min-h-[2.75rem] w-full flex-1 resize-y rounded-lg border border-slate-700/70 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 disabled:opacity-50"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => void handleSubmit()}
          className="shrink-0 rounded-lg border border-cyan-500/30 bg-cyan-600/90 px-4 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
        >
          {sending ? "Streaming…" : "Send"}
        </button>
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-[0.6875rem] text-slate-600">
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  );
}
