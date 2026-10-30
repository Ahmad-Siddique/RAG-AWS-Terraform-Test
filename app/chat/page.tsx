"use client";

import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { DocumentPicker } from "@/components/chat/DocumentPicker";
import { useChatPage } from "@/hooks/useChatPage";

export default function ChatPage() {
  const {
    chats,
    activeChatId,
    messages,
    readyDocuments,
    selectedDocumentIds,
    loading,
    loadingMessages,
    sending,
    error,
    dismissError,
    selectChat,
    createNewChat,
    toggleDocumentSelection,
    selectAllDocuments,
    selectNoDocuments,
    sendMessage,
  } = useChatPage();

  const hasSelectedDocuments =
    readyDocuments.some((d) => selectedDocumentIds.has(d.document_id));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 md:py-7">
      <header className="mb-5 shrink-0">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-cyan-500/80">
          AskMyDocs
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-100">
          Chat
        </h1>
      </header>

      {error !== null && (
        <div
          role="alert"
          className="mb-4 flex shrink-0 items-start justify-between gap-4 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={dismissError}
            className="shrink-0 text-red-300/90 underline-offset-2 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex min-h-[min(72vh,44rem)] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-800/90 bg-slate-950/80 shadow-[0_0_0_1px_rgba(15,23,42,0.5)] md:flex-row">
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          loading={loading}
          onNewChat={createNewChat}
          onSelectChat={selectChat}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#070b14]">
          <DocumentPicker
            readyDocuments={readyDocuments}
            selectedDocumentIds={selectedDocumentIds}
            onToggle={toggleDocumentSelection}
            onSelectAll={selectAllDocuments}
            onSelectNone={selectNoDocuments}
          />

          <ChatMessageList
            activeChatId={activeChatId}
            messages={messages}
            loadingMessages={loadingMessages}
          />

          <ChatComposer
            activeChatId={activeChatId}
            sending={sending}
            hasSelectedDocuments={hasSelectedDocuments}
            onSend={sendMessage}
          />
        </div>
      </div>
    </div>
  );
}
