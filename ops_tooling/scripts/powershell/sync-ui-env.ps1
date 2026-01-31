# sync-ui-env.ps1
# Copies selected env vars from repo-root .env.local
# Prefixes them with NEXT_PUBLIC_
# Writes them to apps/web/.env.local using absolute paths

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$RootEnvPath = Join-Path $RepoRoot ".env.local"
$WebEnvPath = Join-Path $RepoRoot "apps\web\.env.local"

# ---- CONFIG ----
# Only these keys are allowed to be exposed to the UI
$AllowedKeys = @(
  # Edge Functions access (required)
  "SUPABASE_FUNCTIONS_URL",

  # Optional anon auth for Edge Functions
  "SUPABASE_ANON_KEY",

  # Future: if UI ever uses Supabase JS client (auth, storage, rest)
  "SUPABASE_URL",

  # Future: explicit UI-only internal gate (not v0, but allowed)
  "INTERNAL_UI_SHARED_SECRET"
)

# Set to $true if you want to overwrite existing keys in apps/web/.env.local
$OverwriteExisting = $false
# ----------------

if (-not (Test-Path $RootEnvPath)) {
  Write-Error "Root .env.local not found at $RootEnvPath"
  exit 1
}

if (-not (Test-Path (Split-Path $WebEnvPath))) {
  Write-Error "apps/web directory not found"
  exit 1
}

$rootLines = Get-Content $RootEnvPath
$existingWebEnv = @{}
if (Test-Path $WebEnvPath) {
  Get-Content $WebEnvPath | ForEach-Object {
    if ($_ -match "^\s*([^#=]+)=(.*)$") {
      $existingWebEnv[$matches[1]] = $matches[2]
    }
  }
}

$newLines = @()

foreach ($line in $rootLines) {
  $trimmed = $line.Trim()
  if ($trimmed -eq "" -or $trimmed.StartsWith("#")) {
    continue
  }

  if ($trimmed -notmatch "^([^=]+)=(.*)$") {
    continue
  }

  $key = $matches[1]
  $value = $matches[2]

  if ($AllowedKeys -notcontains $key) {
    continue
  }

  $uiKey = "NEXT_PUBLIC_$key"

  if (-not $OverwriteExisting -and $existingWebEnv.ContainsKey($uiKey)) {
    continue
  }

  $newLines += "$uiKey=$value"
}

if ($newLines.Count -eq 0) {
  Write-Host "No new UI env vars to write"
  exit 0
}

Add-Content -Path $WebEnvPath -Value ""
Add-Content -Path $WebEnvPath -Value "# Auto-synced UI env vars"
Add-Content -Path $WebEnvPath -Value $newLines

Write-Host "Synced UI env vars to $WebEnvPath"
$newLines | ForEach-Object { Write-Host "  $_" }