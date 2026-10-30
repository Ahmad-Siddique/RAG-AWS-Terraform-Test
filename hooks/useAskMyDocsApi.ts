"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useMemo } from "react";
import {
  ApiError,
  createChat,
  createDocument,
  deleteDocument,
  getChat,
  listChats,
  listDocuments,
  processDocument,
  uploadFileToPresignedUrl,
} from "@/lib/api";
import { sendMessageStream } from "@/lib/chatStream";

export function useAskMyDocsApi() {
  const { getToken } = useAuth();

  const jwtTemplate = process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE;

  const withToken = useCallback(
    async <T>(fn: (token: string) => Promise<T>): Promise<T> => {
      const token = jwtTemplate
        ? await getToken({ template: jwtTemplate })
        : await getToken();
      if (!token) {
        throw new ApiError(401, "Not signed in");
      }
      return fn(token);
    },
    [getToken, jwtTemplate],
  );

  return useMemo(
    () => ({
      listDocuments: () => withToken(listDocuments),
      createDocument: (filename: string, content_type: string) =>
        withToken((token) => createDocument(token, filename, content_type)),
      processDocument: (documentId: string) =>
        withToken((token) => processDocument(token, documentId)),
      deleteDocument: (documentId: string) =>
        withToken((token) => deleteDocument(token, documentId)),
      uploadFileToPresignedUrl,
      listChats: () => withToken(listChats),
      createChat: (title?: string) =>
        withToken((token) => createChat(token, title)),
      getChat: (chatId: string) =>
        withToken((token) => getChat(token, chatId)),
      sendMessageStream: (
        chatId: string,
        content: string,
        document_ids: string[],
        handlers: Parameters<typeof sendMessageStream>[4],
      ) =>
        withToken((token) =>
          sendMessageStream(token, chatId, content, document_ids, handlers),
        ),
    }),
    [withToken],
  );
}
