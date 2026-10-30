# Clears Clerk-related env vars that override frontend/.env.local on Windows, then starts the dev server.
$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..")

$envVarsToClear = @(
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "CLERK_ENCRYPTION_KEY"
)

foreach ($name in $envVarsToClear) {
  if (Test-Path -Path "Env:$name") {
    Remove-Item -Path "Env:$name"
  }
}

# Invoke Next directly (avoids npm.ps1 / npx.ps1 issues under strict shells).
& node (Join-Path $PWD "node_modules\next\dist\bin\next") dev -p 3000
