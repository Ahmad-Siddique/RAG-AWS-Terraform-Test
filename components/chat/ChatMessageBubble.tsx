"use client";

import type { ChatMessage } from "@/lib/types";

type ChatMessageBubbleProps = {
  message: ChatMessage;
};

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  const sources = message.sources ?? [];
  const isStreaming = message.streaming === true;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(100%,42rem)] rounded-xl px-4 py-3 text-[0.9375rem] leading-relaxed tracking-tight ${
          isUser
            ? "border border-cyan-500/25 bg-cyan-950/40 text-slate-100"
            : "border border-slate-700/60 bg-slate-900/70 text-slate-100"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">
          {message.content}
          {isStreaming && (
            <span
              className="stream-cursor ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.12em] rounded-full bg-cyan-400 align-baseline"
              aria-hidden
            />
          )}
        </p>

        {!isUser && !isStreaming && sources.length > 0 && (
          <details className="group mt-3 border-t border-slate-700/50 pt-2.5">
            <summary className="cursor-pointer list-none text-[0.6875rem] font-medium uppercase tracking-wider text-slate-500 transition-colors group-open:text-cyan-400/90 [&::-webkit-details-marker]:hidden">
              Sources · {sources.length}
            </summary>
            <ul className="mt-2.5 space-y-2">
              {sources.map((source, index) => (
                <li
                  key={`${source.document_id}-${source.chunk_index}-${index}`}
                  className="rounded-lg border border-slate-800/80 bg-slate-950/50 px-2.5 py-2 text-xs"
                >
                  <p className="font-medium text-slate-300">
                    {source.filename}
                    <span className="font-normal text-slate-500">
                      {" "}
                      · chunk {source.chunk_index}
                    </span>
                  </p>
                  <p className="mt-1 text-slate-500">{source.snippet}</p>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
