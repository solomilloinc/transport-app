# `Cancelar` y `Eliminar` un Pasajero coexisten (no reemplazamos `customer-reserve-delete`)

El charter del backend presenta `passenger-cancel` como *la* baja de un Pasajero (marca `Cancelled`,
revierte la deuda a saldo a favor, cascada IdaVuelta). Aun así decidimos **mantener** la baja legacy
`customer-reserve-delete` (`Eliminar`) en vez de reemplazarla, porque cubre dos casos que
`Cancelar` no puede: **borrar el registro sin dejar rastro** y **forzar "registrar como deuda"** en
un impago. `Cancelar` no deja elegir el destino de la plata (el backend lo decide); `Eliminar` sí.

## Consequences

La grilla tiene dos bajas con semántica distinta, lo que genera un solapamiento peligroso
(`Eliminar → favor` ≈ `Cancelar`). Lo resolvemos por jerarquía visual: `Cancelar` va inline (baja
normal, camino feliz) y `Eliminar` se relega al menú kebab `⋮` (bisturí destructivo/avanzado). Ver
`CONTEXT.md` → "Dar de baja un Pasajero". Si alguien borra `Eliminar` creyendo que `passenger-cancel`
lo dejó huérfano, pierde el escape hatch destructivo y el "registrar como deuda".

## Considered Options

- **Reemplazar `Eliminar` por `Cancelar`** — descartado: el operador pierde "borrar sin rastro" y
  "registrar como deuda", outcomes que el endpoint nuevo no expone.
