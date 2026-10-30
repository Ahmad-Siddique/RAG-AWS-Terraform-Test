"use client";

import { formatChatTime, truncateTitle } from "@/lib/chat";
import type { Chat } from "@/lib/types";

type ChatSidebarProps = {
  chats: Chat[];
  activeChatId: string | null;
  loading: boolean;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
};

export function ChatSidebar({
  chats,
  activeChatId,
  loading,
  onNewChat,
  onSelectChat,
}: ChatSidebarProps) {
  return (
    <aside className="flex min-h-0 w-full shrink-0 flex-col border-b border-slate-800/80 bg-slate-950/50 md:w-56 md:border-b-0 md:border-r lg:w-64">
      <div className="border-b border-slate-800/80 p-3">
        <button
          type="button"
          onClick={() => void onNewChat()}
          className="w-full rounded-lg border border-cyan-500/25 bg-cyan-950/30 px-3 py-2 text-sm font-medium text-cyan-100 transition-colors hover:border-cyan-400/40 hover:bg-cyan-950/50"
        >
          New chat
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="px-2 py-3 text-sm text-slate-500">Loading chats…</p>
        ) : chats.length === 0 ? (
          <p className="px-2 py-3 text-sm text-slate-500">
            No chats yet. Start with New chat.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {chats.map((chat) => {
              const isActive = chat.chat_id === activeChatId;
              return (
                <li key={chat.chat_id}>
                  <button
                    type="button"
                    onClick={() => void onSelectChat(chat.chat_id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "border border-cyan-500/20 bg-cyan-950/25 font-medium text-cyan-50"
                        : "border border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                    }`}
                  >
                    <span className="block truncate">
                      {truncateTitle(chat.title)}
                    </span>
                    <span className="mt-0.5 block text-[0.6875rem] text-slate-600">
                      {formatChatTime(chat.updated_at)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
