# dump-env.ps1
# Walks up the directory tree to find .env.local,
# auto-detects all declared keys,
# and writes env_dump.json in the current directory.

param (
  [string]$EnvFileName = ".env.local",
  [string]$Prefix = ""
)

function Find-EnvFile {
  param (
    [string]$StartDir,
    [string]$FileName
  )

  $current = Resolve-Path $StartDir

  while ($true) {
    $candidate = Join-Path $current $FileName
    if (Test-Path $candidate) {
      return $candidate
    }

    $parent = Split-Path $current -Parent
    if ($parent -eq $current) {
      return $null
    }

    $current = $parent
  }
}

$envPath = Find-EnvFile -StartDir (Get-Location) -FileName $EnvFileName

if (-not $envPath) {
  Write-Error "Could not find $EnvFileName in this directory or any parent directory."
  exit 1
}

$lines = Get-Content $envPath
$envMap = @{}

foreach ($line in $lines) {
  $trimmed = $line.Trim()

  if ($trimmed -eq "" -or $trimmed.StartsWith("#")) {
    continue
  }

  $idx = $trimmed.IndexOf("=")
  if ($idx -lt 1) {
    continue
  }

  $key = $trimmed.Substring(0, $idx).Trim()
  $value = $trimmed.Substring($idx + 1).Trim()

  if ($Prefix -ne "" -and -not $key.StartsWith($Prefix)) {
    continue
  }

  if (
    ($value.StartsWith('"') -and $value.EndsWith('"')) -or
    ($value.StartsWith("'") -and $value.EndsWith("'"))
  ) {
    $value = $value.Substring(1, $value.Length - 2)
  }

  $envMap[$key] = $value
}

$envMap |
  ConvertTo-Json -Depth 5 |
  Set-Content -Encoding UTF8 "env_dump.json"

Write-Host "Found env file at: $envPath"
Write-Host "Prefix filter: $(if ($Prefix -eq '') { '<none>' } else { $Prefix })"
Write-Host "Detected keys:"
$envMap.Keys
Write-Host "Wrote env_dump.json"