# El frontend es dueño del copy de error que ve el usuario

La API devuelve los errores como ProblemDetails (RFC 7807): `title` = código (`Cat.SubCode`),
`detail` = descripción. Las descripciones del backend son inconsistentes para mostrar al usuario:
algunas en inglés (`"Trip not found"`, `"The service you are looking for does not exist"`), otras
técnicas. Decidimos que `lib/apiErrors.ts` (`API_ERROR_CATALOG`) es la **única** fuente del texto
que ve el usuario final, keyado por el `code` del backend. **Nunca** se renderiza el `detail` del
backend directamente; el `code` es el contrato estable, el copy es nuestro.

Para que el contrato escale, `services/api.ts` trata el `title` del ProblemDetails como código si
**no contiene espacios** (los títulos-oración del middleware como `"Server failure"` o
`"Tenant Resolution Failed"` sí tienen espacios y se descartan; los códigos de un solo token como
`"Unauthorized"` sí se aceptan). Esta regla es defensiva: cubre cualquier código `Cat.SubCode` y
aguanta drift futuro sin tocar el frontend. Todo código desconocido cae a un único **mensaje base**,
y en dev se emite un `console.warn` para que el hueco se note antes de que lo reporte un usuario.

> Los códigos legacy de una sola palabra del backend (`ServiceNotFound`, `VehicleNotFound`,
> `VehicleAlreadyExists`, `VehicleNotAvailable`, `VehicleType`) ya fueron normalizados a `Cat.SubCode`
> (`Service.NotFound`, `Vehicle.NotFound`, etc.), así que el catálogo ya no mantiene esos alias.

## Considered Options

- **Mostrar el `detail` del backend** (DRY, menos mantenimiento en el front) — descartado: expone
  inglés y jerga al usuario, y acopla el wording de la UI al backend.
- **Codegen cross-repo del catálogo** desde los `*Error.cs` — descartado: acopla el build del
  frontend al repo del backend y los mensajes user-facing igual no viven allá. En su lugar, un
  script de drift en `scripts/` reporta códigos faltantes sin acoplar builds.
