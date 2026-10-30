export type DocumentStatus = "processing" | "ready" | "failed";

export interface Document {
  document_id: string;
  clerk_user_id: string;
  filename: string;
  content_type: string;
  s3_key: string;
  status: DocumentStatus;
  chunk_count: number;
  vector_keys: string[];
  created_at: string;
  updated_at: string;
  error: string | null;
}

export interface CreateDocumentResponse {
  document_id: string;
  filename: string;
  s3_key: string;
  upload_url: string;
  status: DocumentStatus;
}

export interface ProcessDocumentResponse {
  message: string;
  document_id: string;
}

export interface DeleteDocumentResponse {
  message: string;
  document_id: string;
}

export interface Chat {
  chat_id: string;
  clerk_user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export type ChatMessageRole = "user" | "assistant";

export interface Source {
  document_id: string;
  filename: string;
  chunk_index: number;
  snippet: string;
}

export interface ChatMessage {
  message_id: string;
  chat_id: string;
  role: ChatMessageRole;
  content: string;
  document_ids: string[];
  sources?: Source[];
  created_at: string;
  /** UI-only: assistant reply still streaming */
  streaming?: boolean;
}

export interface SendMessageResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

export interface GetChatResponse {
  chat: Chat;
  messages: ChatMessage[];
}
