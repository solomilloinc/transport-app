$ErrorActionPreference = 'Stop'

# Second pass: identifiers missed in pass 1.
$pairs = @(
  @('HolidayId', 'holidayId'),
  @('HolidayName', 'holidayName'),
  @('HolidayDate', 'holidayDate'),
  @('AllowedDirections', 'allowedDirections'),
  @('AllowedDirectionIds', 'allowedDirectionIds'),
  @('ServiceScheduleId', 'serviceScheduleId'),
  @('StartDay', 'startDay'),
  @('EndDay', 'endDay'),
  @('IsHoliday', 'isHoliday'),
  @('Schedulers', 'schedulers'),
  @('Schedules', 'schedules'),
  @('TripName', 'tripName'),
  @('Quantity', 'quantity'),
  @('ImageBase64', 'imageBase64'),
  @('PriceFrom', 'priceFrom'),
  @('Payments', 'payments'),
  @('OpenedAt', 'openedAt'),
  @('OpenedByUserEmail', 'openedByUserEmail'),
  @('ClosedAt', 'closedAt'),
  @('ClosedByUserEmail', 'closedByUserEmail'),
  @('TotalPayments', 'totalPayments'),
  @('Vehicle', 'vehicle'),
  @('Return', 'return'),
  @('Code', 'code'),
  @('Date', 'date'),
  @('Id', 'id')
)

$roots = @(
  'app',
  'components\admin',
  'components\checkout',
  'components\results',
  'contexts',
  'hooks',
  'services',
  '__tests__'
)

# Files NOT to touch (shadcn UI components that wrap Radix primitives with
# PascalCase compound names).
$excludeContains = @(
  '\components\ui\',
  '\components\dashboard\',
  '\node_modules\'
)

$base = (Resolve-Path '.').Path
$files = foreach ($r in $roots) {
  Get-ChildItem -Path (Join-Path $base $r) -Recurse -Include *.ts,*.tsx -ErrorAction SilentlyContinue
}

# Filter out excluded paths
$files = $files | Where-Object {
  $path = $_.FullName
  $skip = $false
  foreach ($ex in $excludeContains) {
    if ($path.Contains($ex)) { $skip = $true; break }
  }
  -not $skip
}

$total = 0
foreach ($file in $files) {
  $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
  if (-not $content) { continue }
  $orig = $content
  foreach ($pair in $pairs) {
    $from = $pair[0]
    $to = $pair[1]
    $pattern = '\.' + [regex]::Escape($from) + '\b'
    $content = [regex]::Replace($content, $pattern, '.' + $to)
  }
  if (-not $content.Equals($orig)) {
    Set-Content -LiteralPath $file.FullName -Value $content -NoNewline -Encoding UTF8
    $total++
    Write-Host "  rewrote $($file.FullName.Substring($base.Length+1))"
  }
}

Write-Host ""
Write-Host "Files rewritten: $total"
