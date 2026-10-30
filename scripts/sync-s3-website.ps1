param(
  [Parameter(Mandatory = $true)]
  [string]$BucketName
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$outDir = Join-Path $PSScriptRoot "..\out"

if (-not (Test-Path -LiteralPath $outDir)) {
  Write-Host "No frontend/out directory found."
  Write-Host "Static export is optional. The default Next.js + Clerk app uses SSR (npm run build && npm run start), not output: export."
  Write-Host "To use this bucket, configure static export in next.config and run npm run build, then re-run this script."
  exit 0
}

Write-Host "Syncing $outDir to s3://$BucketName/ ..."
aws s3 sync $outDir "s3://$BucketName/" --delete
Write-Host "Done."
