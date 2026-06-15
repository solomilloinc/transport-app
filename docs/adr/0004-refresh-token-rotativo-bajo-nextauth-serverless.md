---
status: proposed
---

# Refresh de access token con refresh token rotativo bajo NextAuth (JWT) + serverless

## Contexto

Auth es NextAuth v4 con `session.strategy = "jwt"`. El refresh del access token vive en el
callback `jwt` ([auth.config.ts](../../auth.config.ts)), de forma lazy: cuando se lee el JWT y al
access token le quedan menos de `REFRESH_THRESHOLD_SECONDS` para expirar, hace `POST /renew-token`.
El refresh token se guarda **dentro del JWT cifrado de NextAuth** (`token.refreshToken`), no en la
cookie `refreshToken` que setea el backend en `/login` (esa cookie se la come el `fetch`
server-side de `authenticateWithBackend` y nunca llega al browser — es decorativa para el front).

El backend (`transport-api`) **rota el refresh token en cada canje** (uso único: al canjear RT1
emite RT2 e invalida RT1). El frontend corre en Azure Static Web Apps, donde el callback `jwt` se
ejecuta en **invocaciones serverless independientes** que no comparten memoria.

## Problema observado

Al loguearte desde la landing (`/`) o desde la búsqueda de reserva, te desloguea al instante.
Desde una ruta pública como `/results` no pasa (esa página usa `skipAuth: true`, así que **nunca**
llama a `getServerSession` en RSC). El logout lo dispara `useSessionError`, que hace `signOut`
apenas `session.error === 'RefreshTokenError'` ([hooks/use-session-error.ts](../../hooks/use-session-error.ts)),
y ese error se setea cuando `refreshAccessToken` devuelve `null` (RT ya rotado → 401 del backend).

Hay **dos mecanismos fatales**, ambos disparados porque hoy `lifetime == threshold == 5 min` ⇒ el
token está dentro de la ventana de refresh desde el segundo cero, así que *cada* lectura del JWT
refresca:

- **M1 — carrera por concurrencia.** Varias lecturas en paralelo (el `getSession()` del modal + el
  refetch del `SessionProvider` + los `getServerSession` de la página destino) canjean el mismo RT.
  Una gana y rota; las demás canjean un RT ya muerto → `RefreshTokenError` → `signOut`.
- **M2 — el refresh en RSC no puede persistir el token rotado.** `getServerSession` dentro del
  render de un Server Component corre el callback `jwt` y rota en el backend (RT1→RT2), pero un RSC
  **no puede escribir cookies**: la cookie queda con RT1 viejo. La próxima lectura reintenta RT1 →
  "ya usado" → `RefreshTokenError`. Determinístico, sin necesidad de concurrencia.

Esto explica la dependencia de página: `/results` no toca `getServerSession`, así que sólo refresca
vía `/api/auth/session` (contexto que sí escribe cookie) → sin M1 ni M2.

## Decisión (propuesta — Opción C, "robusto de verdad")

Tres capas que se complementan:

- **C.1 — Ventana de gracia de rotación en el backend.** `/renew-token` tolera un RT recién rotado
  durante N segundos (30–60s): si entra un RT que acaba de rotarse, devuelve el *mismo* par sucesor
  ya emitido en vez de 401 (rotación idempotente con *reuse-leeway*). Fuera de la ventana, reuse =
  revocar todo (reuse-detection real). Neutraliza M1 y ablanda M2; cubre multi-pestaña y reintentos.
- **C.2 — Una sola autoridad de refresh, en contexto que escribe cookie.** Mover el refresh
  proactivo a un lugar que pueda persistir el token rotado antes de que rendericen los RSC.
- **C.3 — `threshold ≪ lifetime`.** Que el refresh sea infrecuente (p. ej. test: lifetime 5 min /
  threshold 60s; prod: lifetime 15–60 min), reduciendo la superficie de carrera y la carga al backend.

### Decisión abierta (revisar después): dónde va C.2

- **C.2a — Refresh proactivo en middleware.** El middleware decodifica el JWT, y si está cerca de
  expirar refresca, re-encripta (`encode` de `next-auth/jwt`) y **setea la cookie de sesión en la
  respuesta**. Corre serial por request y antes del RSC, así el `getServerSession` ve token fresco y
  no vuelve a refrescar. Costo: código de crypto en el Edge runtime (encode/decode, fetch a
  `/renew-token`, resolución de tenant, nombre/chunking de la cookie `__Secure-next-auth.session-token`).
  Conviene extraer el refresh a una función compartida entre middleware y callback `jwt`.
  → **Robusto de verdad.**
- **C.2b — Dejar el refresh en el callback `jwt` y apoyarse sólo en C.1 + el poll del cliente.**
  Mucho menos código, pero depende de que la ventana de gracia tape el hueco hasta el próximo
  `/api/auth/session` que persista la rotación. Saca el bug reportado, pero es más delicado.

Recomendación: C.2a para el estado final; C.1 + C.2b como fix mínimo si se necesita rápido, con
camino a C.2a después.

## Opciones consideradas (descartadas)

- **A sola (sólo ventana de gracia en backend).** Ablanda M2 pero, si el refresh sigue ocurriendo
  sólo en contextos que no persisten, la cookie nunca avanza el RT y la gracia se vuelve frágil.
- **B — single-flight en el frontend (el plan original).** No sirve: el callback `jwt` corre en
  invocaciones serverless independientes; una promesa compartida en memoria no deduplica entre el
  RSC, `/api/auth/session` y otras pestañas. Requeriría un lock distribuido (Redis/DB) — sobreingeniería.
- **Cola/retry de 401 en una capa de axios cliente.** No existe interceptor cliente (axios es
  server-only) y el logout no nace de un 401 de data sino del refresh del `jwt`. Fuera de alcance.

## Consecuencias

- La ventana de gracia (C.1) debilita levemente la pureza "uso único" del refresh token a cambio de
  robustez; se compensa con reuse-detection fuera de la ventana.
- C.2a mete lógica de auth en el Edge runtime: hay que mantener encode/decode de NextAuth en sync con
  la config y cuidar el manejo de la cookie chunked.
- StrictMode (dev) es irrelevante para este bug: se observa en producción.
