import type { ChatMessage, SendMessageResponse } from "@/lib/types";
import { getApiBaseUrl } from "@/lib/api";

type RouteParams = { params: Promise<{ chatId: string }> };

function sseEncode(event: string, data: unknown): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function synthesizeFromJson(
  data: SendMessageResponse,
  controller: ReadableStreamDefaultController<Uint8Array>,
) {
  controller.enqueue(sseEncode("user", data.user_message));
  const assistantText = data.assistant_message?.content ?? "";
  if (!assistantText) {
    controller.enqueue(sseEncode("done", data.assistant_message));
    return;
  }
  const parts = assistantText.match(/\S+\s*|\s+/g) ?? [assistantText];
  for (const part of parts) {
    controller.enqueue(sseEncode("delta", { text: part }));
    await new Promise((r) => setTimeout(r, 12));
  }
  controller.enqueue(sseEncode("done", data.assistant_message));
}

function ndjsonToSseStream(ndjsonBody: string): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const line of ndjsonBody.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }
        let row: {
          event?: string;
          message?: ChatMessage;
          content?: string;
          assistant_message?: ChatMessage;
          error?: string;
        };
        try {
          row = JSON.parse(trimmed) as typeof row;
        } catch {
          continue;
        }
        if (row.event === "error") {
          controller.enqueue(
            sseEncode("error", { message: row.error ?? "Stream failed" }),
          );
          break;
        }
        if (row.event === "user_message" && row.message) {
          controller.enqueue(sseEncode("user", row.message));
        }
        if (row.event === "delta" && row.content) {
          controller.enqueue(sseEncode("delta", { text: row.content }));
        }
        if (row.event === "done" && row.assistant_message) {
          controller.enqueue(sseEncode("done", row.assistant_message));
        }
      }
      controller.close();
    },
  });
}

export async function POST(req: Request, { params }: RouteParams) {
  const { chatId } = await params;
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { content?: string; document_ids?: string[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const content = body.content?.trim();
  const document_ids = body.document_ids;
  if (!content || !document_ids?.length) {
    return new Response(
      JSON.stringify({ error: "content and document_ids required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  let apiBase: string;
  try {
    apiBase = getApiBaseUrl();
  } catch {
    return new Response(JSON.stringify({ error: "API URL not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = JSON.stringify({ content, document_ids });
  const headers = {
    Authorization: authHeader,
    "Content-Type": "application/json",
  };

  const streamUrl = `${apiBase}/chats/${encodeURIComponent(chatId)}/messages/stream`;
  const streamAttempt = await fetch(streamUrl, {
    method: "POST",
    headers,
    body: payload,
  });

  if (streamAttempt.ok) {
    const ndjson = await streamAttempt.text();
    return new Response(ndjsonToSseStream(ndjson), {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  const upstream = await fetch(
    `${apiBase}/chats/${encodeURIComponent(chatId)}/messages`,
    { method: "POST", headers, body: payload },
  );

  if (!upstream.ok) {
    const errText = await upstream.text();
    return new Response(errText, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  }

  const data = (await upstream.json()) as SendMessageResponse;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      await synthesizeFromJson(data, controller);
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
