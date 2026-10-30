"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  filterReadyDocuments,
  loadSelectedDocumentIds,
  saveSelectedDocumentIds,
} from "@/lib/chat";
import type { Chat, ChatMessage, Document } from "@/lib/types";
import { useAskMyDocsApi } from "@/hooks/useAskMyDocsApi";

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Something went wrong";
}

function pruneSelection(
  selected: Set<string>,
  readyDocuments: Document[],
): Set<string> {
  const readyIds = new Set(readyDocuments.map((d) => d.document_id));
  const next = new Set<string>();
  for (const id of selected) {
    if (readyIds.has(id)) {
      next.add(id);
    }
  }
  return next;
}

export function useChatPage() {
  const api = useAskMyDocsApi();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [readyDocuments, setReadyDocuments] = useState<Document[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dismissError = useCallback(() => setError(null), []);

  const refreshChats = useCallback(async () => {
    const list = await api.listChats();
    setChats(list);
    return list;
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const stored = loadSelectedDocumentIds();
        if (stored.size > 0) {
          setSelectedDocumentIds(stored);
        }
        const [list, docs] = await Promise.all([
          api.listChats(),
          api.listDocuments(),
        ]);
        if (cancelled) {
          return;
        }
        setChats(list);
        const ready = filterReadyDocuments(docs);
        setReadyDocuments(ready);
        setSelectedDocumentIds((prev) => {
          const base = prev.size > 0 ? prev : stored;
          const next = pruneSelection(base, ready);
          saveSelectedDocumentIds(next);
          return next;
        });
      } catch (err) {
        if (!cancelled) {
          setError(errorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const selectChat = useCallback(
    async (chatId: string) => {
      if (chatId === activeChatId && messages.length > 0) {
        return;
      }
      setActiveChatId(chatId);
      setLoadingMessages(true);
      setError(null);
      try {
        const data = await api.getChat(chatId);
        setMessages(data.messages);
      } catch (err) {
        setError(errorMessage(err));
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [activeChatId, api, messages.length],
  );

  const createNewChat = useCallback(async () => {
    setError(null);
    try {
      const chat = await api.createChat();
      setChats((prev) => [chat, ...prev]);
      setActiveChatId(chat.chat_id);
      setMessages([]);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [api]);

  const setDocumentSelection = useCallback((ids: Set<string>) => {
    setSelectedDocumentIds(ids);
    saveSelectedDocumentIds(ids);
  }, []);

  const toggleDocumentSelection = useCallback((documentId: string) => {
    setSelectedDocumentIds((prev) => {
      const next = new Set(prev);
      if (next.has(documentId)) {
        next.delete(documentId);
      } else {
        next.add(documentId);
      }
      saveSelectedDocumentIds(next);
      return next;
    });
  }, []);

  const selectAllDocuments = useCallback(() => {
    const ids = new Set(readyDocuments.map((d) => d.document_id));
    setDocumentSelection(ids);
  }, [readyDocuments, setDocumentSelection]);

  const selectNoDocuments = useCallback(() => {
    setDocumentSelection(new Set());
  }, [setDocumentSelection]);

  const sendChatMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!activeChatId) {
        setError("Select or create a chat first.");
        return;
      }
      if (!trimmed) {
        setError("Enter a message.");
        return;
      }
      const readyIds = new Set(readyDocuments.map((d) => d.document_id));
      const document_ids = [...selectedDocumentIds].filter((id) =>
        readyIds.has(id),
      );
      if (document_ids.length === 0) {
        setError("Select at least one ready document.");
        return;
      }

      setSending(true);
      setError(null);

      const optimisticAssistantId = `stream-${Date.now()}`;
      let streamAssistantId = optimisticAssistantId;

      try {
        await api.sendMessageStream(
          activeChatId,
          trimmed,
          document_ids,
          {
            onUserMessage: (user_message) => {
              streamAssistantId = `stream-${user_message.message_id}`;
              setMessages((prev) => [
                ...prev,
                user_message,
                {
                  message_id: streamAssistantId,
                  chat_id: activeChatId,
                  role: "assistant",
                  content: "",
                  document_ids,
                  sources: [],
                  created_at: new Date().toISOString(),
                  streaming: true,
                },
              ]);
            },
            onDelta: (text) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.message_id === streamAssistantId
                    ? { ...m, content: m.content + text }
                    : m,
                ),
              );
            },
            onDone: (assistant_message) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.message_id === streamAssistantId
                    ? { ...assistant_message, streaming: false }
                    : m,
                ),
              );
            },
          },
        );
        await refreshChats();
      } catch (err) {
        setMessages((prev) =>
          prev.filter(
            (m) =>
              m.message_id !== streamAssistantId &&
              m.message_id !== optimisticAssistantId,
          ),
        );
        setError(errorMessage(err));
      } finally {
        setSending(false);
      }
    },
    [
      activeChatId,
      api,
      readyDocuments,
      refreshChats,
      selectedDocumentIds,
    ],
  );

  return {
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
    sendMessage: sendChatMessage,
  };
}
