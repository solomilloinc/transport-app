---
status: proposed
---

# Export binario (xlsx) vía Route Handler, fuera del carril Server Action

## Contexto

Toda la capa de datos del front es server-side: [services/api.ts](../../services/api.ts) es
`'use server'` y cada llamada pasa por [`getServerAxios`](../../services/axios.ts), que resuelve la
sesión NextAuth en el servidor, adjunta el `Bearer` (que **rota**, ver
[ADR 0004](0004-refresh-token-rotativo-bajo-nextauth-serverless.md)), las cookies y los headers de
tenant. El cliente **nunca** tiene el access token, así que no puede llamar al backend directo sin
saltarse auth, resolución de tenant y refresh de token.

La Reportería agrega un endpoint que **no** devuelve JSON: `reporting/{passengers,reserves}/export`
responde un **binario xlsx** cuyo nombre de archivo viaja en el header `Content-Disposition`
(`attachment; filename="reporte-pasajeros-20260501_20260531.xlsx"`).

Esto choca con dos propiedades del carril Server Action:
1. Un Server Action serializa su **valor de retorno** pero **descarta los headers HTTP** de la
   respuesta del backend ⇒ se pierde el `filename`.
2. Un Error arrojado desde un Server Action sólo conserva `message` ⇒ el 422 de ventana > 92 días o
   > ~50k filas hay que cuidarlo a mano.

## Decisión

Servir el export con un **Route Handler** de Next (`app/api/reporting/passengers/export/route.ts` y
`.../reserves/export/route.ts`), no con un Server Action:

- Es same-origin, así que la cookie de sesión NextAuth viaja sola ⇒ `getServerSession` funciona
  igual que en los Server Actions. **Reutiliza `getServerAxios`** (es un módulo plano, no
  `'use server'`) para pegarle al backend con `responseType: 'arraybuffer'`.
- **Passthrough del binario**: reenvía `Content-Type` y `Content-Disposition` tal cual, así el
  browser nombra el archivo solo.
- En 422/400 lee el JSON de error del backend y lo reenvía con el mismo `status` y forma
  `API_ERROR:<code>` que el cliente ya sabe interpretar, para que el mensaje de límite salga
  verbatim.
- Cliente: `fetch()` al route → `blob()` → `URL.createObjectURL` → click en un `<a download>`.

`pageNumber`/`pageSize` se ignoran en el body del export (trae todo el set filtrado); se mandan los
mismos `filters` + `sortBy`/`sortDescending` de la grilla.

## Opciones consideradas (descartadas)

- **Server Action que devuelve `{ base64, filename, contentType }`.** Reutiliza el mapeo de errores
  de `rethrowWithCode`, pero infla el payload ~33% (malo contra el techo de ~50k filas) y obliga a
  reconstruir el filename a mano leyendo `Content-Disposition` del lado servidor. Más frágil por
  poco beneficio.
- **Llamada directa cliente → backend con `responseType: blob`.** Imposible sin romper el modelo de
  auth: el token vive sólo en la sesión server-side y rota (ADR 0004); el cliente no lo tiene.

## Consecuencias

- Aparece un segundo carril de acceso al backend (Route Handler) además de los Server Actions. Hay
  que mantener la atadura de auth/tenant en un solo lugar (`getServerAxios`) para que ambos carriles
  no diverjan.
- El Route Handler no pasa por `rethrowWithCode`; replica el contrato de error mínimo
  (`API_ERROR:<code>` + status) para no duplicar el envelope-matching completo.
