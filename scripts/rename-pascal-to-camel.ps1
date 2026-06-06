$ErrorActionPreference = 'Stop'

# Whitelisted property names migrated from PascalCase to camelCase on the wire.
# Order matters: longer keys first to avoid partial overlaps.
$pairs = @(
  @('DropoffOptionsIdaVuelta', 'dropoffOptionsIdaVuelta'),
  @('DropoffOptionsIda', 'dropoffOptionsIda'),
  @('DropoffLocaationName', 'dropoffLocationName'),
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
  @('OriginId', 'originId'),
  @('DestinationCityName', 'destinationCityName'),
  @('DestinationCityId', 'destinationCityId'),
  @('DestinationName', 'destinationName'),
  @('DestinationId', 'destinationId'),
  @('DepartureDate', 'departureDate'),
  @('DepartureHour', 'departureHour'),
  @('ArrivalHour', 'arrivalHour'),
  @('EstimatedDuration', 'estimatedDuration'),
  @('StopSchedules', 'stopSchedules'),
  @('TripPickupStopId', 'tripPickupStopId'),
  @('TripPriceId', 'tripPriceId'),
  @('TripId', 'tripId'),
  @('ReserveTypeName', 'reserveTypeName'),
  @('ReserveTypeId', 'reserveTypeId'),
  @('ReservePriceId', 'reservePriceId'),
  @('ReservedQuantity', 'reservedQuantity'),
  @('ReserveDate', 'reserveDate'),
  @('ReserveId', 'reserveId'),
  @('CustomerFullName', 'customerFullName'),
  @('CustomerId', 'customerId'),
  @('CashBoxId', 'cashBoxId'),
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
  @('HasTraveled', 'hasTraveled'),
  @('StatusPaymentId', 'statusPaymentId'),
  @('PaidAmount', 'paidAmount'),
  @('PaymentsByMethod', 'paymentsByMethod'),
  @('PaymentMethodName', 'paymentMethodName'),
  @('PaymentMethodId', 'paymentMethodId'),
  @('PaymentMethods', 'paymentMethods'),
  @('PaymentMethod', 'paymentMethod'),
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
  @('Email', 'email'),
  @('ServiceName', 'serviceName'),
  @('ServiceIds', 'serviceIds'),
  @('ServiceId', 'serviceId'),
  @('Services', 'services'),
  @('DriverName', 'driverName'),
  @('DriverId', 'driverId'),
  @('PassengerId', 'passengerId'),
  @('PassengersReserve', 'passengersReserve'),
  @('Passengers', 'passengers'),
  @('DirectionName', 'directionName'),
  @('DirectionId', 'directionId'),
  @('Directions', 'directions'),
  @('CityName', 'cityName'),
  @('CityId', 'cityId'),
  @('DisplayName', 'displayName'),
  @('RelevantCities', 'relevantCities'),
  @('Prices', 'prices'),
  @('Price', 'price'),
  @('CreatedBy', 'createdBy'),
  @('CreatedDate', 'createdDate'),
  @('UpdatedBy', 'updatedBy'),
  @('UpdatedDate', 'updatedDate'),
  @('Description', 'description'),
  @('Status', 'status'),
  @('Items', 'items'),
  @('PageNumber', 'pageNumber'),
  @('PageSize', 'pageSize'),
  @('Outbound', 'outbound'),
  @('Amount', 'amount'),
  @('Order', 'order'),
  @('Name', 'name')
)

$roots = @(
  'app',
  'components',
  'contexts',
  'hooks',
  'services',
  '__tests__'
)

$base = (Resolve-Path '.').Path
$files = foreach ($r in $roots) {
  Get-ChildItem -Path (Join-Path $base $r) -Recurse -Include *.ts,*.tsx -ErrorAction SilentlyContinue
}

$total = 0
foreach ($file in $files) {
  $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
  if (-not $content) { continue }
  $orig = $content
  foreach ($pair in $pairs) {
    $from = $pair[0]
    $to = $pair[1]
    # Replace `.PascalCase` -> `.camelCase` only when it follows a dot.
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
