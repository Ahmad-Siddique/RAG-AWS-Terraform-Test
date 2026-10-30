# AskMyDocs frontend — deployment

This app uses **Next.js with Clerk SSR** by default. The primary production-style test on your machine is `npm run build && npm run start`. Optional S3 static hosting (`terraform/06_frontend`) is for course parity and only works if you add a static export (`frontend/out`); it does **not** replace a Node server for full Clerk + SSR unless you adopt a separate hosting pattern (e.g. Vercel).

## 1. Align Clerk issuer with Terraform

JWTs from the Clerk app linked to this frontend must match what API Gateway validates.

1. In Clerk Dashboard → your app → **API keys**, note the **Frontend API** URL (issuer), e.g. `https://your-app.clerk.accounts.dev`.
2. Set matching values in `terraform/00_foundation/secrets.auto.tfvars`:
   - `clerk_issuer`
   - `clerk_jwks_url` (issuer + `/.well-known/jwks.json`)
3. Apply foundation, then documents (authorizer reads SSM):

   ```powershell
   cd terraform/00_foundation
   terraform apply -var-file=secrets.auto.tfvars

   cd ../04_documents
   terraform apply
   ```

4. Copy `terraform output -raw api_endpoint` into `NEXT_PUBLIC_API_URL` (no trailing slash).

### Clerk JWT template (required for API Gateway)

API Gateway’s JWT authorizer checks **`iss`** and **`aud`**. A normal Clerk **session** token from `getToken()` has `iss` but **no `aud`**, so the API returns **401 Unauthorized** even when SSM issuer matches your frontend app.

1. Clerk Dashboard → **JWT templates** → **New template**
2. **Name:** `askmydocs-api` (must match `NEXT_PUBLIC_CLERK_JWT_TEMPLATE` in `.env.local`)
3. **Claims** (JSON) — set `aud` to the **same string** as `clerk_issuer` in Terraform:

   ```json
   {
     "aud": "https://set-mole-985.clerk.accounts.dev"
   }
   ```

   Replace the URL with your app’s Frontend API URL if different.

4. Save the template. Restart `npm run dev` after adding `NEXT_PUBLIC_CLERK_JWT_TEMPLATE=askmydocs-api` to `.env.local`.

**Or create via CLI** (from `frontend/`, linked to ASkmydocs):

```powershell
npx clerk@latest api jwt_templates --file scripts/jwt-template-askmydocs-api.json --yes
```

Edit `scripts/jwt-template-askmydocs-api.json` if your `clerk_issuer` URL differs.

The frontend calls `getToken({ template: 'askmydocs-api' })` for all AskMyDocs API requests.

## 2. Local production test (recommended)

From `frontend/`:

```powershell
cp .env.production.example .env.production.local
# Fill Clerk keys and NEXT_PUBLIC_API_URL

npm run build
npm run start
```

Open **http://localhost:3000** (not `127.0.0.1` unless you add that origin to Clerk and `cors_allow_origins`).

### Clerk allowed origins

In Clerk Dashboard → **Paths** / **Domains** (or allowed origins for your SDK version), add:

- `http://localhost:3000` for local dev and local prod test
- Any deployed frontend origin (e.g. S3 website URL from `06_frontend`, or your Vercel URL)

Redirect URLs should include `/sign-in`, `/sign-up`, and post-auth paths (`/documents`).

### API CORS

In `terraform/04_documents`, set `cors_allow_origins` to the same browser origins the app runs on (see `terraform.tfvars.example`). Re-apply `04_documents` after changes.

## 3. Windows shell environment pitfall

User or system environment variables **override** `.env.local` and `.env.production.local`. In particular, a stale `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in Windows causes Clerk handshake errors even when `.env.local` is correct.

**Fix:** unset those variables before dev/prod local runs, or use:

```powershell
npm run dev:win
```

which runs `scripts/run-dev.ps1` (clears Clerk-related env vars, then `npm run dev`).

## 4. Optional: S3 static website (`terraform/06_frontend`)

For optional static hosting (requires `frontend/out` from a static export):

```powershell
cd terraform/06_frontend
terraform init
terraform apply
```

Note `website_url` from outputs. Add that **http://** origin to Clerk and to `cors_allow_origins` in `04_documents`, then re-apply `04`.

Sync built static files (if `out/` exists):

```powershell
cd frontend
powershell -File ./scripts/sync-s3-website.ps1 -BucketName (terraform output -raw bucket_name)
```

If `out/` is missing, the script explains that SSR via `npm run start` (or Vercel) is the default path.

## 6. Vercel deployment

1. **Root directory:** `askmydocs/frontend` (if the repo root is the course folder).
2. **Environment variables** (Production **and** Preview — builds use Preview env on PRs):

   | Variable | Required |
   |----------|----------|
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes (or set `CLERK_PUBLISHABLE_KEY` — build copies it to `NEXT_PUBLIC_*`) |
   | `CLERK_SECRET_KEY` | Yes |
   | `CLERK_ENCRYPTION_KEY` | Yes (same value as local) |
   | `NEXT_PUBLIC_API_URL` | Yes (no trailing slash) |
   | `NEXT_PUBLIC_CLERK_JWT_TEMPLATE` | Yes (`askmydocs-api`) |

3. **Clerk Dashboard:** add `https://your-project.vercel.app` to allowed origins / redirect URLs.
4. **AWS CORS:** add the same Vercel origin to `cors_allow_origins` in `terraform/04_documents`, then `terraform apply`.

Redeploy after changing env vars (Vercel does not rebuild automatically for env-only changes unless you redeploy).

## 7. Destroy / change stacks

Destroy `06_frontend` independently when you no longer need the public bucket. Keep `04_documents` CORS in sync when you remove an origin.
