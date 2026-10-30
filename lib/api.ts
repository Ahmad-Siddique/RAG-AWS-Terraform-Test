import type {
  Chat,
  CreateDocumentResponse,
  DeleteDocumentResponse,
  Document,
  GetChatResponse,
  ProcessDocumentResponse,
  SendMessageResponse,
} from "@/lib/types";

export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  return base.replace(/\/$/, "");
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** User-facing hints for common API failure modes (JWT, MongoDB, etc.). */
export function formatApiErrorMessage(status: number, message: string): string {
  if (status === 503) {
    const lower = message.toLowerCase();
    if (lower.includes("database unavailable") || lower.includes("mongodb")) {
      return (
        `${message} Set a valid connection string in AWS SSM Parameter Store at ` +
        `/askmydocs/dev/mongodb_uri (terraform/00_foundation secrets.auto.tfvars, then terraform apply).`
      );
    }
    return message;
  }
  if (status !== 401) {
    return message;
  }
  const lower = message.toLowerCase();
  if (lower.includes("not signed in")) {
    return message;
  }
  return (
    `${message} — API Gateway validates Clerk JWT issuer and aud. Session tokens from getToken() have no aud; ` +
    `create a Clerk JWT template (see frontend/DEPLOY.md) and set NEXT_PUBLIC_CLERK_JWT_TEMPLATE. ` +
    `Issuer in SSM must match your Clerk app (terraform/00_foundation clerk_issuer).`
  );
}

type ApiFetchOptions = {
  method?: "GET" | "POST" | "DELETE" | "PUT";
  body?: unknown;
  token: string;
};

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, token }: ApiFetchOptions,
): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };

  let payload: string | undefined;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(url, {
    method,
    headers,
    body: payload,
  });

  if (!res.ok) {
    let message = res.statusText || `Request failed with status ${res.status}`;
    try {
      const errBody = (await res.json()) as { error?: string; message?: string };
      if (errBody.error) {
        message = errBody.error;
      } else if (errBody.message) {
        message = errBody.message;
      }
    } catch {
      // API Gateway JWT failures are often non-JSON
    }
    throw new ApiError(res.status, formatApiErrorMessage(res.status, message));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export async function listDocuments(token: string): Promise<Document[]> {
  const data = await apiFetch<{ documents: Document[] }>("/documents", {
    token,
  });
  return data.documents;
}

export async function createDocument(
  token: string,
  filename: string,
  content_type: string,
): Promise<CreateDocumentResponse> {
  return apiFetch<CreateDocumentResponse>("/documents", {
    method: "POST",
    token,
    body: { filename, content_type },
  });
}

export async function processDocument(
  token: string,
  documentId: string,
): Promise<ProcessDocumentResponse> {
  return apiFetch<ProcessDocumentResponse>(
    `/documents/${encodeURIComponent(documentId)}/process`,
    { method: "POST", token },
  );
}

export async function deleteDocument(
  token: string,
  documentId: string,
): Promise<DeleteDocumentResponse> {
  return apiFetch<DeleteDocumentResponse>(
    `/documents/${encodeURIComponent(documentId)}`,
    { method: "DELETE", token },
  );
}

export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: Blob,
  contentType: string,
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });

  if (!res.ok) {
    throw new ApiError(
      res.status,
      `Upload failed with status ${res.status}`,
    );
  }
}

export async function listChats(token: string): Promise<Chat[]> {
  const data = await apiFetch<{ chats: Chat[] }>("/chats", { token });
  return data.chats;
}

export async function createChat(
  token: string,
  title?: string,
): Promise<Chat> {
  const data = await apiFetch<{ chat: Chat }>("/chats", {
    method: "POST",
    token,
    body: title !== undefined ? { title } : {},
  });
  return data.chat;
}

export async function getChat(
  token: string,
  chatId: string,
): Promise<GetChatResponse> {
  return apiFetch<GetChatResponse>(
    `/chats/${encodeURIComponent(chatId)}`,
    { token },
  );
}

export async function sendMessage(
  token: string,
  chatId: string,
  content: string,
  document_ids: string[],
): Promise<SendMessageResponse> {
  return apiFetch<SendMessageResponse>(
    `/chats/${encodeURIComponent(chatId)}/messages`,
    {
      method: "POST",
      token,
      body: { content, document_ids },
    },
  );
}
