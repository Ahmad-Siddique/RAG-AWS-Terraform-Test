# AskMyDocs — local end-to-end testing

Manual browser flow plus an automated checklist for verifying Documents upload → ingest → Chat RAG against your deployed AWS stack from **http://localhost:3000**.

For UI-only regression items, see also [TESTING.md](./TESTING.md).

---

## Prerequisites

Complete these once per machine / environment before running the E2E flow.

### 1. AWS infrastructure and secrets

| Item | What to verify |
|------|----------------|
| Terraform stacks | At minimum: `00_foundation`, `04_documents`, `05_chat` (and ingest in `03_ingest` if documents never reach **Ready**) |
| MongoDB URI in SSM | Parameter **`/askmydocs/dev/mongodb_uri`** must be a real Atlas (or other) connection string — not the `USER:PASSWORD@cluster.example` placeholder |
| Clerk issuer in SSM | `clerk_issuer` / `clerk_jwks_url` in `terraform/00_foundation/secrets.auto.tfvars` match the Clerk app linked to this frontend |
| API URL | `terraform output -raw api_endpoint` from `04_documents` → `NEXT_PUBLIC_API_URL` in `frontend/.env.local` (no trailing slash) |

Apply foundation when secrets change:

```powershell
cd askmydocs/terraform/00_foundation
terraform apply -var-file="secrets.auto.tfvars"
```

Re-apply documents (JWT authorizer) and chat when issuer or Lambda code changes:

```powershell
cd ../04_documents
terraform apply

cd ../05_chat
terraform apply
```

**Lambda handler changes** (e.g. MongoDB error handling in `backend/documents/handler.py` or `backend/chat/handler.py`) are packaged by Terraform in **`04_documents`** and **`05_chat`**. After editing those files, run `terraform apply` in each stack so API Gateway invokes the updated Lambdas.

### 2. Clerk JWT template (`askmydocs-api`)

API Gateway validates **`iss`** and **`aud`**. Session tokens from plain `getToken()` lack `aud` → **401** before Lambda runs.

1. Clerk Dashboard → **JWT templates** → template name **`askmydocs-api`**
2. Set **`aud`** to the same URL as `clerk_issuer` in Terraform (see [DEPLOY.md](./DEPLOY.md))
3. In `frontend/.env.local`: `NEXT_PUBLIC_CLERK_JWT_TEMPLATE=askmydocs-api`

Optional CLI (from `frontend/`):

```powershell
npx clerk@latest api jwt_templates --file scripts/jwt-template-askmydocs-api.json --yes
```

### 3. Frontend env and dev server

From `frontend/`:

- Run `npx clerk env pull` (or maintain `.env.local` manually) with **one** publishable key source — no duplicate keys in `.env` + `.env.local`
- **Windows:** clear shell overrides for Clerk keys before dev (see [DEPLOY.md](./DEPLOY.md)); prefer:

```powershell
npm run dev:win
```

which runs [scripts/run-dev.ps1](./scripts/run-dev.ps1) (clears conflicting env vars, starts Next on port **3000**).

Or: `npm run dev` if your shell has no Clerk env pollution.

Use **http://localhost:3000** (not `127.0.0.1` unless CORS and Clerk allow that origin).

### 4. Upload test fixture (optional)

From repo root:

```powershell
.\scripts\create-e2e-fixture.ps1
```

Upload `frontend/test-fixtures/sample-e2e.txt` (or any small `.txt` / `.pdf`).

---

## Manual E2E flow

### Sign in

1. Open **http://localhost:3000**
2. **Sign in** (or sign up)
3. **Note:** Clerk may require an **email verification code** on a new device or browser — complete that before testing API routes.

**Expected:** Header shows user menu; **Documents** and **Chat** links work.

### Documents — upload and ready

1. Go to **Documents**
2. Upload `sample-e2e.txt` or a small PDF (drag-drop or file picker)
3. Watch status: **Processing** → poll every ~3s → **Ready** with chunk count

**Expected:**

- Row appears with filename and **Processing**, then **Ready**
- No red error banner during happy path
- `GET /documents` returns your row (visible in UI)

If stuck on **Processing**, check CloudWatch for **`askmydocs-dev-ingest`** (stack `03_ingest`).

### Chat — RAG on selected documents

1. Go to **Chat**
2. **New chat**
3. In the document picker, select one or more **Ready** documents only
4. Send a question tied to the upload (e.g. “What is this document about?”)

**Expected:**

- User and assistant messages appear
- Assistant may cite **Sources** with filename / chunk / snippet
- Sidebar chat list updates; reopening the chat loads history

---

## Automated checklist

Copy and tick when running a full local E2E pass:

```text
[ ] terraform/00_foundation applied with -var-file=secrets.auto.tfvars (valid mongodb_uri, clerk_issuer)
[ ] terraform/04_documents and 05_chat applied; api_endpoint in NEXT_PUBLIC_API_URL
[ ] Clerk JWT template askmydocs-api + NEXT_PUBLIC_CLERK_JWT_TEMPLATE set
[ ] npm run dev:win (or npm run dev) on http://localhost:3000
[ ] Sign-in completes (email code if prompted)
[ ] Upload .txt or .pdf → Processing → Ready
[ ] Chat: new thread, select ready doc(s), send message → assistant reply
[ ] (Optional) npm run build succeeds
```

---

## Expected outcomes (summary)

| Step | Success signal |
|------|----------------|
| Auth | Signed-in UI; API calls include Bearer token from JWT template |
| POST /documents + S3 PUT | Upload progress completes; document row created |
| POST …/process + ingest | Status becomes **Ready**; chunk count > 0 |
| GET /documents | Lists your documents |
| POST /chats, GET /chats | Thread created and listed |
| POST …/messages | 200 with user + assistant messages; sources when RAG hits chunks |

---

## Troubleshooting

| Symptom | Likely cause | What to do |
|---------|----------------|------------|
| **401 Unauthorized** (often non-JSON body) | JWT **`aud`** / **`iss`** mismatch; session token instead of template | Create **`askmydocs-api`** template; set `NEXT_PUBLIC_CLERK_JWT_TEMPLATE`; align `clerk_issuer` in SSM via `00_foundation` apply + **`04_documents`** apply |
| **401** “Missing or invalid token” | Not signed in or token not passed | Sign in; check browser network tab for `Authorization` header |
| **503** “Database unavailable…” | Invalid or placeholder **`mongodb_uri`** in SSM; Atlas IP/network; wrong URI | Fix `mongodb_uri` in `secrets.auto.tfvars`; `terraform apply -var-file="secrets.auto.tfvars"` in **00_foundation**; confirm parameter **`/askmydocs/dev/mongodb_uri`** in AWS console |
| **500** / **Internal Server Error** on upload/list | MongoDB **`AskMyDocs`** vs **`askmydocs`** case conflict on Atlas | Handlers use **`AskMyDocs`**; redeploy **`03_ingest`**, **`04_documents`**, **`05_chat`** with `terraform apply` |
| **500** with generic/internal error | Unhandled Lambda error (non-Mongo), ingest failure, OpenRouter key | CloudWatch logs for documents, chat, ingest Lambdas; verify **`/askmydocs/dev/openrouter_api_key`** |
| **500** after Mongo fix still on old code | Lambdas not redeployed | `terraform apply` in **04_documents** and **05_chat** |
| Red banner **Internal Server Error** | Often API 500 JSON `{ "error": "..." }` or Gateway fault | Read error text in banner; map to table above |
| Upload stuck **Processing** | Ingest Lambda or embedding failure | Logs for **`askmydocs-dev-ingest`**; S3 object exists under `docs/{user_id}/…` |
| **CORS** / failed to fetch | Wrong origin | Use **http://localhost:3000**; update `cors_allow_origins` in **04_documents** if needed |
| Clerk handshake / invalid secret | Duplicate Clerk keys in environment vs `.env.local` | Use **`npm run dev:win`** or unset system `CLERK_*` / `NEXT_PUBLIC_CLERK_*` vars |

---

## Related docs

- [DEPLOY.md](./DEPLOY.md) — Clerk issuer, JWT template, CORS, production build
- [TESTING.md](./TESTING.md) — broader manual QA checklist (phases 0–6)
- [../terraform/OPERATIONS.md](../terraform/OPERATIONS.md) — ops and destroy order
