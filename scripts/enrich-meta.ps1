# Batch-fill films.release_date + duration via TMDB (search → detail runtime).
# Local run; TMDB via system proxy. Writes UPDATE SQL in chunks then applies.
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
$envId = 'a213-d4gzgo1mn873d99da'

$envRaw = Get-Content -LiteralPath (Join-Path $root '.env') -Raw -Encoding UTF8
$key = ''
if ($envRaw -match 'TMDB_API_KEY\s*=\s*(\S+)') { $key = $Matches[1] }
if (-not $key) { Write-Output 'no TMDB key'; exit 1 }

$filmsRaw = (tcb db execute -e $envId --sql "SELECT id, title FROM films WHERE release_date IS NULL ORDER BY sort_order" --json 2>$null) | Out-String
$i = $filmsRaw.IndexOf('{')
$films = @((($filmsRaw.Substring($i) | ConvertFrom-Json).data.Rows) | ForEach-Object { $_ | ConvertFrom-Json })
Write-Output ("films to enrich meta: " + $films.Count)

$sql = New-Object System.Collections.Generic.List[string]
$ok = 0; $skip = 0
foreach ($f in $films) {
  $id = $f[0]; $title = $f[1]
  $q = [uri]::EscapeDataString($title)
  $sr = Invoke-RestMethod -Uri "https://api.themoviedb.org/3/search/multi?query=$q&language=zh-CN&api_key=$key" -TimeoutSec 12 -ErrorAction SilentlyContinue
  $best = @($sr.results) | Select-Object -First 1
  if (-not $best) { $skip++; Start-Sleep -Milliseconds 260; continue }

  $release = $null
  if ($best.release_date) { $release = $best.release_date }
  elseif ($best.first_air_date) { $release = $best.first_air_date }

  $runtime = $null
  $mt = if ($best.media_type -eq 'tv') { 'tv' } else { 'movie' }
  try {
    $dr = Invoke-RestMethod -Uri "https://api.themoviedb.org/3/$mt/$($best.id)?api_key=$key&language=zh-CN" -TimeoutSec 12 -ErrorAction SilentlyContinue
    if ($dr.runtime) { $runtime = [int]$dr.runtime }
    elseif ($dr.episode_run_time -and @($dr.episode_run_time).Count -gt 0) { $runtime = [int]$dr.episode_run_time[0] }
    if (-not $release) { if ($dr.release_date) { $release = $dr.release_date } elseif ($dr.first_air_date) { $release = $dr.first_air_date } }
  } catch { }

  $set = @()
  if ($release) { $set += "release_date='$release'" }
  if ($runtime -gt 0) { $set += "duration=$runtime" }
  if ($set.Count -eq 0) { $skip++; Start-Sleep -Milliseconds 260; continue }

  $sql.Add("UPDATE films SET $($set -join ', ') WHERE id='$id';")
  $ok++
  if ($ok % 25 -eq 0) { Write-Output ("  $ok / " + $films.Count) }
  Start-Sleep -Milliseconds 260
}
Write-Output ("matched: $ok | skipped: $skip")

$sqlText = $sql -join "`n"
Set-Content -LiteralPath (Join-Path $env:TEMP 'enrich-meta.sql') -Value $sqlText -Encoding UTF8

# apply in chunks (Windows cmd-line length limit)
$lines = @(Get-Content -LiteralPath (Join-Path $env:TEMP 'enrich-meta.sql') -Encoding UTF8 | Where-Object { $_.Trim() })
for ($j = 0; $j -lt $lines.Count; $j += 25) {
  $chunk = $lines[$j..([math]::Min($j + 24, $lines.Count - 1))] -join "`n"
  tcb db execute -e $envId --sql $chunk --json 2>$null | Out-Null
}
Write-Output "applied"
