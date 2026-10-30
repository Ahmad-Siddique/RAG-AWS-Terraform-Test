"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";

type ChatMessageListProps = {
  activeChatId: string | null;
  messages: ChatMessage[];
  loadingMessages: boolean;
};

export function ChatMessageList({
  activeChatId,
  messages,
  loadingMessages,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChatId]);

  if (activeChatId === null) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="max-w-sm text-center">
          <p className="text-sm font-medium text-slate-200">No chat selected</p>
          <p className="mt-1.5 text-sm text-slate-500">
            Choose a thread or start a new one.
          </p>
        </div>
      </div>
    );
  }

  if (loadingMessages) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <p className="text-sm text-slate-500">Loading messages…</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="max-w-sm text-center">
          <p className="text-sm font-medium text-slate-200">Empty thread</p>
          <p className="mt-1.5 text-sm text-slate-500">
            Select documents above, then ask a question.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        {messages.map((message) => (
          <ChatMessageBubble key={message.message_id} message={message} />
        ))}
        <div ref={bottomRef} aria-hidden />
      </div>
    </div>
  );
}
