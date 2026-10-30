# AskMyDocs frontend

Next.js web app for AskMyDocs (Milestone 6). Authentication uses [Clerk](https://clerk.com); document and chat features will call the AskMyDocs API in later phases.

## Prerequisites

- Node.js 20+
- A Clerk application with sign-in/sign-up enabled
- AskMyDocs API deployed (M4/M5). Base URL from `terraform output -raw api_endpoint` in `terraform/04_documents` or `terraform/05_chat`

## Clerk

This app is linked to the **ASkmydocs** Clerk application (`app_3LHZAwLbxXDYgFjRVEqFchr8ky7`). Development keys live in `.env.local` (refresh with `npx clerk@latest env pull` after `npx clerk@latest auth login`). Do not run `clerk init` here — it would replace this setup.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in `.env.local`:

   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
   - `CLERK_SECRET_KEY` — Clerk secret key
   - `NEXT_PUBLIC_API_URL` — API Gateway URL, no trailing slash (e.g. `https://55y804x887.execute-api.us-east-1.amazonaws.com`)

4. In the Clerk dashboard, add `http://localhost:3000` to allowed origins and configure sign-in/sign-up redirect URLs as needed.

## Development

```bash
npm run dev
```

On **Windows**, prefer clearing shell Clerk overrides automatically:

```bash
npm run dev:win
```

This runs `scripts/run-dev.ps1`, which removes `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `CLERK_ENCRYPTION_KEY` from the process environment if set, then starts `npm run dev`. See [DEPLOY.md](./DEPLOY.md) for why that matters.

Open [http://localhost:3000](http://localhost:3000). Protected routes: `/documents`, `/chat` (server `auth()` in each section’s `layout.tsx`).

**Note (Next.js 16 + Clerk v7):** `next.config.ts` loads `.env` and re-exports Clerk keys via the `env` block so middleware/proxy can read them. `CLERK_ENCRYPTION_KEY` is required when middleware passes `secretKey` (local dev only; generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). After Clerk errors, clear site data for `localhost:3000` or use incognito (stale handshake cookies). Restart `npm run dev` and delete `.next` if needed.

## Local dev / QA

See [TESTING.md](./TESTING.md) for the manual browser checklist.

On **Windows**, a user or system shell variable `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` overrides `.env.local` and can break Clerk locally — unset it before `npm run dev`.

Browser QA passed (Oct 2026) for `/`, `/sign-in`, and signed-out access to `/documents` (redirect to sign-in).

## Phase 2: API client

The frontend talks to the AskMyDocs HTTP API via a small typed client in `lib/api.ts` and shared types in `lib/types.ts`.

- **Base URL:** `NEXT_PUBLIC_API_URL` (no trailing slash). `getApiBaseUrl()` reads it at runtime.
- **Auth:** Every API route expects `Authorization: Bearer <jwt>`. The JWT must come from Clerk on the client (`useAuth().getToken()`). Server Components do not call the API directly in this phase.
- **Errors:** Non-OK responses are parsed as `{ error: string }` and thrown as `ApiError` (`.status`, `.message`).

### `apiFetch` and named helpers

`apiFetch(path, { method, body, token })` is the low-level helper. Higher-level functions take `token` as the first argument:

- Documents: `listDocuments`, `createDocument`, `processDocument`, `deleteDocument`, `uploadFileToPresignedUrl` (PUT to S3 presigned URL; no Bearer token)
- Chat: `listChats`, `createChat`, `getChat`, `sendMessage`

### React hook

`hooks/useAskMyDocsApi.ts` wraps those helpers and injects the Clerk token:

```tsx
"use client";

import { useAskMyDocsApi } from "@/hooks/useAskMyDocsApi";

export function Example() {
  const api = useAskMyDocsApi();

  async function load() {
    const documents = await api.listDocuments();
    console.log(documents);
  }

  return <button type="button" onClick={load}>Load documents</button>;
}
```

Phase 2 verification used a temporary **Test API** button on `/documents`; that was removed in Phase 3.

## Phase 3: Documents UI

Signed-in users manage documents at `/documents`:

- **Upload:** drag-and-drop or file picker (`.pdf`, `.txt`) → create record → PUT to presigned S3 URL → `POST …/process`. Progress labels: creating, uploading, starting processing.
- **List:** table with filename, status badge (`processing` / `ready` / `failed`), chunk count when ready, updated time, and ingest error text when failed.
- **Polling:** while any document is `processing`, the list refetches every 3 seconds until status is `ready` or `failed`.
- **Delete:** confirm dialog, then `DELETE /documents/{id}`.

Implementation: `lib/documents.ts`, `hooks/useDocumentsPage.ts`, `components/documents/*`. All API calls go through `useAskMyDocsApi`.

Manual QA: [TESTING.md](./TESTING.md) Phase 3 checklist rows.

## Phase 4: Chat UI

Signed-in users chat at `/chat`:

- **Sidebar:** **New chat** (`POST /chats`), list of chats with title and updated time; active chat highlighted.
- **Document picker:** checkboxes for **ready** documents only; select all / none; selection persisted in `sessionStorage` (`askmydocs-selected-docs`).
- **Messages:** load via `GET /chats/{id}`; send with `POST /chats/{id}/messages` (`content`, non-empty `document_ids`). User and assistant bubbles; assistant shows collapsible **Sources** (filename, chunk index, snippet).
- **Composer:** Enter sends, Shift+Enter newline; **Send** disabled without active chat, ready doc selection, or while sending (**Thinking…**).

Implementation: `lib/chat.ts`, `hooks/useChatPage.ts`, `components/chat/*`. API via `useAskMyDocsApi`. No delete-chat UI (API not exposed).

Manual QA: [TESTING.md](./TESTING.md) Phase 4 checklist rows 12–19.

## Phase 5: Production readiness

- **`.env.production.example`** — template for local prod test (`npm run build && npm run start`); notes prod Clerk instance, `NEXT_PUBLIC_API_URL`, Clerk allowed origins, and API CORS in `04_documents`.
- **`DEPLOY.md`** — end-to-end deploy: align `clerk_issuer` in `00_foundation`, apply `00` + `04`, local prod test, optional S3 via `06_frontend`, Windows env pitfall.
- **`components/AppFooter.tsx`** — site footer on all pages (via `app/layout.tsx`): “AskMyDocs · dev”, truncated API host when `NEXT_PUBLIC_API_URL` is set, link to deploy guide.
- **`scripts/run-dev.ps1`** + **`npm run dev:win`** — safe Windows dev startup (see above).

## Phase 6: Optional S3 frontend infra

- **`terraform/06_frontend`** — public S3 static website bucket (`askmydocs-frontend-<account_id>`). Does not replace SSR; use when you have `frontend/out` from a static export.
- **`scripts/sync-s3-website.ps1`** — sync `frontend/out` to the bucket (`-BucketName` required). Prints guidance if `out/` is missing.

After `06_frontend` apply, add the S3 website URL to Clerk and to `cors_allow_origins` in `04_documents`. Details: [DEPLOY.md](./DEPLOY.md) and [terraform/06_frontend/README.md](../terraform/06_frontend/README.md).

## Scripts

| Command           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Dev server on port 3000                          |
| `npm run dev:win` | Windows: clear Clerk env overrides, then dev     |
| `npm run build`   | Production build                                 |
| `npm run start`   | Serve production build                           |
| `npm run lint`    | Run ESLint                                       |
