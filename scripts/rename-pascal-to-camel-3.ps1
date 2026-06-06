$ErrorActionPreference = 'Stop'

# Third pass: also matches object literal keys and quoted form field names that
# previous passes missed (because they have no leading dot).
$pairs = @(
  @('DropoffOptionsIdaVuelta', 'dropoffOptionsIdaVuelta'),
  @('DropoffOptionsIda', 'dropoffOptionsIda'),
  @('DropoffLocationName', 'dropoffLocationName'),
  @('DropoffLocationId', 'dropoffLocationId'),
  @('DropoffDirectionId', 'dropoffDirectionId'),
  @('PickupLocationName', 'pickupLocationName'),
  @('PickupLocationId', 'pickupLocationId'),
  @('PickupDirectionId', 'pickupDirectionId'),
  @('PickupTimeOffset', 'pickupTimeOffset'),
  @('PickupOptions', 'pickupOptions'),
  @('PickupTime', 'pickupTime'),
  @('VehicleTypeQuantity', 'vehicleTypeQuantity'),
  @('VehicleTypeName', 'vehicleTypeName'),
  @('VehicleTypeId', 'vehicleTypeId'),
  @('VehicleName', 'vehicleName'),
  @('VehicleId', 'vehicleId'),
  @('OriginCityName', 'originCityName'),
  @('OriginCityId', 'originCityId'),
  @('OriginName', 'originName'),
  @('DestinationCityName', 'destinationCityName'),
  @('DestinationCityId', 'destinationCityId'),
  @('DestinationName', 'destinationName'),
  @('DepartureDate', 'departureDate'),
  @('DepartureHour', 'departureHour'),
  @('ArrivalHour', 'arrivalHour'),
  @('EstimatedDuration', 'estimatedDuration'),
  @('StopSchedules', 'stopSchedules'),
  @('TripPickupStopId', 'tripPickupStopId'),
  @('TripPriceId', 'tripPriceId'),
  @('TripName', 'tripName'),
  @('TripId', 'tripId'),
  @('ReserveTypeName', 'reserveTypeName'),
  @('ReserveTypeId', 'reserveTypeId'),
  @('ReservePriceId', 'reservePriceId'),
  @('ReservedQuantity', 'reservedQuantity'),
  @('ReserveDate', 'reserveDate'),
  @('ReserveId', 'reserveId'),
  @('CustomerFullName', 'customerFullName'),
  @('CustomerId', 'customerId'),
  @('CurrentBalance', 'currentBalance'),
  @('PendingDebt', 'pendingDebt'),
  @('TotalRecords', 'totalRecords'),
  @('TotalPages', 'totalPages'),
  @('TotalPrice', 'totalPrice'),
  @('TotalPaid', 'totalPaid'),
  @('TotalAmount', 'totalAmount'),
  @('AvailableQuantity', 'availableQuantity'),
  @('InternalNumber', 'internalNumber'),
  @('IsMainDestination', 'isMainDestination'),
  @('IsRoundTrip', 'isRoundTrip'),
  @('IsPayment', 'isPayment'),
  @('IsHoliday', 'isHoliday'),
  @('HasTraveled', 'hasTraveled'),
  @('HolidayId', 'holidayId'),
  @('HolidayName', 'holidayName'),
  @('HolidayDate', 'holidayDate'),
  @('StatusPaymentId', 'statusPaymentId'),
  @('PaidAmount', 'paidAmount'),
  @('PaymentsByMethod', 'paymentsByMethod'),
  @('PaymentMethodName', 'paymentMethodName'),
  @('PaymentMethodId', 'paymentMethodId'),
  @('TransactionAmount', 'transactionAmount'),
  @('TransactionType', 'transactionType'),
  @('Transactions', 'transactions'),
  @('PreferenceId', 'preferenceId'),
  @('LockToken', 'lockToken'),
  @('ExpiresAt', 'expiresAt'),
  @('TimeoutMinutes', 'timeoutMinutes'),
  @('DocumentNumber', 'documentNumber'),
  @('FirstName', 'firstName'),
  @('LastName', 'lastName'),
  @('FullName', 'fullName'),
  @('Phone1', 'phone1'),
  @('Phone2', 'phone2'),
  @('ServiceName', 'serviceName'),
  @('ServiceIds', 'serviceIds'),
  @('ServiceScheduleId', 'serviceScheduleId'),
  @('ServiceId', 'serviceId'),
  @('DriverName', 'driverName'),
  @('DriverId', 'driverId'),
  @('PassengerId', 'passengerId'),
  @('PassengersReserve', 'passengersReserve'),
  @('DirectionName', 'directionName'),
  @('DirectionId', 'directionId'),
  @('CityName', 'cityName'),
  @('CityId', 'cityId'),
  @('DisplayName', 'displayName'),
  @('RelevantCities', 'relevantCities'),
  @('Prices', 'prices'),
  @('Schedules', 'schedules'),
  @('Schedulers', 'schedulers'),
  @('AllowedDirections', 'allowedDirections'),
  @('AllowedDirectionIds', 'allowedDirectionIds'),
  @('StartDay', 'startDay'),
  @('EndDay', 'endDay'),
  @('OpenedAt', 'openedAt'),
  @('OpenedByUserEmail', 'openedByUserEmail'),
  @('ClosedAt', 'closedAt'),
  @('ClosedByUserEmail', 'closedByUserEmail'),
  @('TotalPayments', 'totalPayments'),
  @('CashBoxId', 'cashBoxId'),
  @('Quantity', 'quantity'),
  @('ImageBase64', 'imageBase64'),
  @('PriceFrom', 'priceFrom')
)

$roots = @(
  'app',
  'components\admin',
  'components\checkout',
  'components\results',
  'contexts',
  'hooks',
  'services',
  '__tests__',
  'validations'
)

$excludeContains = @(
  '\components\ui\',
  '\node_modules\'
)

$base = (Resolve-Path '.').Path
$files = foreach ($r in $roots) {
  Get-ChildItem -Path (Join-Path $base $r) -Recurse -Include *.ts,*.tsx -ErrorAction SilentlyContinue
}

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
    $esc = [regex]::Escape($from)
    # 1) Object literal key:  `  PascalCase: value`  (with whitespace before, then colon)
    $content = [regex]::Replace($content, '(?<=^|[\s,\{\(])' + $esc + '(?=\s*:)', $to)
    # 2) Quoted identifier:  `'PascalCase'`  or  `"PascalCase"`
    $content = [regex]::Replace($content, "(?<=['""])$esc(?=['""])", $to)
  }
  if (-not $content.Equals($orig)) {
    Set-Content -LiteralPath $file.FullName -Value $content -NoNewline -Encoding UTF8
    $total++
    Write-Host "  rewrote $($file.FullName.Substring($base.Length+1))"
  }
}

Write-Host ""
Write-Host "Files rewritten: $total"
