# AskMyDocs frontend — manual / browser QA (M6 phases 0–6)

## Before testing

- Dev server: `npm run dev` → **http://localhost:3000** (not `127.0.0.1` unless CORS updated).
- **Windows:** If `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in your user/shell environment (even to a short placeholder), it overrides `.env.local` and Clerk will fail. Unset it before `npm run dev`, or remove it from System → Environment Variables.
- **One** Clerk key set in `.env.local` only (run `npx clerk env pull` after link). Duplicate keys cause handshake / secret errors.
- `NEXT_PUBLIC_API_URL` = API Gateway `api_endpoint` (no trailing slash).
- Clear `localhost` cookies or use incognito after Clerk key changes.

## Checklist

| # | Area | Steps | Pass? |
|---|------|--------|-------|
| 1 | Home | `/` shows AskMyDocs, Sign in / Sign up | |
| 2 | Sign-in | `/sign-in` renders Clerk form | |
| 3 | Sign-up | `/sign-up` renders Clerk form | |
| 4 | Auth | Sign in → header shows UserButton, Documents + Chat links | |
| 5 | Protect | Signed out → `/documents` redirects to sign-in | |
| 6 | Documents list | Signed in → Documents → empty state or table of documents (no test button) | |
| 7 | Upload PDF | Drop or pick a `.pdf` → progress steps → row shows **Processing** then **Ready** with chunk count | |
| 8 | Upload txt | Upload a `.txt` file → reaches **Ready** | |
| 9 | Poll | While **Processing**, list refreshes every ~3s without manual reload | |
| 10 | Delete | Delete a document → confirm → row removed | |
| 11 | Errors | Dismissible red banner on API/upload failure | |
| 12 | Chat layout | Signed in → `/chat` → sidebar, document picker, message area, composer (not placeholder) | |
| 13 | New chat | **New chat** creates a thread, selects it, empty message state | |
| 14 | Doc picker | Only **ready** docs listed; select all / none; hint when none ready | |
| 15 | Send message | Select ≥1 ready doc → type question → **Send** (or Enter) → user + assistant bubbles | |
| 16 | Sources | Assistant reply → expand **Sources (N)** → filename, chunk, snippet | |
| 17 | Chat list | After send, sidebar chat title/time updates; reopen chat loads history | |
| 18 | Selection persist | Refresh page → document checkbox selection restored (sessionStorage) | |
| 19 | Chat errors | Dismissible red banner on send/API failure (e.g. no doc selected) | |
| 20 | Phase 5 build | `npm run build` succeeds; `npm run start` → app loads, footer shows “AskMyDocs · dev” and API host when `NEXT_PUBLIC_API_URL` set | |
| 21 | Phase 5 deploy doc | Footer **Deploy guide** opens `/DEPLOY.md` (same content as `frontend/DEPLOY.md`) | |
| 22 | Phase 6 S3 (optional) | After `terraform/06_frontend` apply + static `frontend/out`, `sync-s3-website.ps1 -BucketName …` uploads; S3 website URL loads (Clerk/CORS updated for that origin) | |

## Common failures

- **Handshake / invalid secret**: duplicate or mixed Clerk keys in `.env` + `.env.local` — keep only `.env.local` from `env pull`.
- **401 on API test**: Clerk JWT issuer must match Terraform SSM `clerk_issuer` (M4). Frontend **ASkmydocs** uses `https://set-mole-985.clerk.accounts.dev`; if SSM still has `bright-chow-13`, API Gateway returns **401** before Lambda runs. Fix: set `clerk_issuer` / `clerk_jwks_url` in `terraform/00_foundation/secrets.auto.tfvars`, then `terraform apply` in **00_foundation** and **04_documents** (authorizer reads SSM).
- **CORS / failed to fetch**: use `http://localhost:3000`.
- **Upload stuck on Processing**: check ingest Lambda logs; processing continues server-side after **Starting processing…**.

## M7 ops (manual)

No browser test required. Confirm once per environment:

- [ ] Billing SNS subscription on **`askmydocs-dev-billing`** is **Confirmed** (see [`../terraform/OPERATIONS.md`](../terraform/OPERATIONS.md)).
- [ ] `terraform/07_hardening` applied; ops SNS on **`askmydocs-dev-ops-alerts`** is **Confirmed**.
- [ ] [`../terraform/OPERATIONS.md`](../terraform/OPERATIONS.md) exists and destroy order is understood before tearing down stacks.
