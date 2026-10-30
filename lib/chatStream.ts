import {
  ApiError,
  formatApiErrorMessage,
  sendMessage,
} from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

export type StreamMessageHandlers = {
  onUserMessage: (message: ChatMessage) => void;
  onDelta: (text: string) => void;
  onDone: (message: ChatMessage) => void;
};

function parseSseBlock(block: string): { event: string; data: string } | null {
  const lines = block.split("\n");
  let event = "message";
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  if (dataLines.length === 0) {
    return null;
  }
  return { event, data: dataLines.join("\n") };
}

export async function consumeMessageStream(
  response: Response,
  handlers: StreamMessageHandlers,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const parsed = parseSseBlock(block);
      if (parsed) {
        const payload = JSON.parse(parsed.data) as unknown;
        if (parsed.event === "user") {
          handlers.onUserMessage(payload as ChatMessage);
        } else if (parsed.event === "delta") {
          const { text } = payload as { text: string };
          handlers.onDelta(text);
        } else if (parsed.event === "done") {
          handlers.onDone(payload as ChatMessage);
        } else if (parsed.event === "error") {
          const { message } = payload as { message?: string };
          throw new ApiError(500, message ?? "Stream failed");
        }
      }
      boundary = buffer.indexOf("\n\n");
    }
  }
}

async function sendMessageJsonFallback(
  token: string,
  chatId: string,
  content: string,
  document_ids: string[],
  handlers: StreamMessageHandlers,
): Promise<void> {
  const data = await sendMessage(token, chatId, content, document_ids);
  handlers.onUserMessage(data.user_message);
  if (data.assistant_message.content) {
    handlers.onDelta(data.assistant_message.content);
  }
  handlers.onDone(data.assistant_message);
}

/** Prefer Next.js SSE proxy; fall back to direct JSON API when streaming is unavailable. */
export async function sendMessageStream(
  token: string,
  chatId: string,
  content: string,
  document_ids: string[],
  handlers: StreamMessageHandlers,
): Promise<void> {
  let streamRes: Response | null = null;
  try {
    streamRes = await fetch(
      `/api/chats/${encodeURIComponent(chatId)}/messages/stream`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, document_ids }),
      },
    );
  } catch {
    streamRes = null;
  }

  const contentType = streamRes?.headers.get("content-type") ?? "";
  if (
    streamRes?.ok &&
    contentType.includes("text/event-stream")
  ) {
    await consumeMessageStream(streamRes, handlers);
    return;
  }

  if (streamRes && !streamRes.ok) {
    const status = streamRes.status;
    if (status !== 404 && status !== 502 && status !== 503) {
      let message = streamRes.statusText || `Request failed (${status})`;
      try {
        const errBody = (await streamRes.json()) as { error?: string };
        if (errBody.error) {
          message = errBody.error;
        }
      } catch {
        // non-JSON
      }
      throw new ApiError(status, formatApiErrorMessage(status, message));
    }
  }

  await sendMessageJsonFallback(
    token,
    chatId,
    content,
    document_ids,
    handlers,
  );
}
