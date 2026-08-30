# Batch TMDB enrichment (local, via system proxy). Fill image/year/description,
# and rating only when the imported film has none. Writes UPDATE SQL then applies.
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
$envId = 'a213-d4gzgo1mn873d99da'

$envRaw = Get-Content -LiteralPath (Join-Path $root '.env') -Raw -Encoding UTF8
$key = ''
if ($envRaw -match 'TMDB_API_KEY\s*=\s*(\S+)') { $key = $Matches[1] }
if (-not $key) { Write-Output 'TMDB_API_KEY not found in .env'; exit 1 }

$filmsRaw = (tcb db execute -e $envId --sql "SELECT id, title, rating FROM films WHERE image IS NULL ORDER BY sort_order" --json 2>$null) | Out-String
$i = $filmsRaw.IndexOf('{')
if ($i -lt 0) { Write-Output 'tcb returned no JSON'; exit 1 }
$films = @((($filmsRaw.Substring($i) | ConvertFrom-Json).data.Rows) | ForEach-Object { $_ | ConvertFrom-Json })
Write-Output ("films to enrich: " + $films.Count)

$sql = New-Object System.Collections.Generic.List[string]
$ok = 0; $skip = 0
foreach ($f in $films) {
  $id = $f[0]; $title = $f[1]; $existingRating = $f[2]
  $q = [uri]::EscapeDataString($title)
  $url = "https://api.themoviedb.org/3/search/multi?query=$q&language=zh-CN&api_key=$key"
  $res = Invoke-RestMethod -Uri $url -TimeoutSec 12 -ErrorAction SilentlyContinue
  $best = @($res.results) | Select-Object -First 1
  if (-not $best -or -not $best.poster_path) { $skip++; Start-Sleep -Milliseconds 260; continue }

  $poster = "https://image.tmdb.org/t/p/w500$($best.poster_path)"
  $year = $null
  if ($best.release_date) { $year = $best.release_date.Substring(0, 4) }
  elseif ($best.first_air_date) { $year = $best.first_air_date.Substring(0, 4) }
  $overview = ($best.overview -replace "'", "''") -replace "`r|`n", ' '

  $set = @("image='$poster'")
  if ($year) { $set += "year='$year'" }
  if ($overview) { $set += "description='$overview'" }
  if (-not $existingRating -and $best.vote_average) {
    $set += "rating='$([math]::Round([double]$best.vote_average, 1))'"
  }
  $sql.Add("UPDATE films SET $($set -join ', ') WHERE id='$id';")
  $ok++
  if ($ok % 25 -eq 0) { Write-Output ("  $ok / " + $films.Count) }
  Start-Sleep -Milliseconds 260
}
Write-Output ("matched: $ok | skipped: $skip")

$sqlText = $sql -join "`n"
Set-Content -LiteralPath (Join-Path $env:TEMP 'enrich.sql') -Value $sqlText -Encoding UTF8
tcb db execute -e $envId --sql $sqlText --json 2>&1 | Out-String
