# Investigación y Decisiones (Fase 0)

Decisiones técnicas relevantes, con su justificación y alternativas. Varias surgieron de
problemas reales durante el despliegue.

## D-001 · Conexión a Supabase por el pooler (no la directa)
- **Decisión**: `DATABASE_URL` = transaction pooler (`...pooler.supabase.com:6543?pgbouncer=true`);
  `DIRECT_URL` = session pooler (`:5432`). Host `aws-1-<region>`.
- **Por qué**: la conexión directa (`db.<ref>.supabase.co`) es **solo IPv6**; en redes IPv4
  (CI, la mayoría) falla con `P1001`. El pooler es IPv4.
- **Detalle**: la región se dedujo cruzando la IPv6 del host directo con los rangos de AWS
  (→ `us-east-2`). Usuario del pooler: `postgres.<ref>`.

## D-002 · Node 24 en la imagen de la API
- **Decisión**: imagen Docker `node:24-slim` (requisito mínimo Node ≥ 22).
- **Por qué**: `@supabase/supabase-js` crea un `RealtimeClient` al `createClient` (aunque solo
  usemos Storage) y `realtime-js` exige un `WebSocket` **global**, estable desde Node 22.
  Node 20 fallaba en runtime.

## D-003 · Paquete compartido en formato dual (CJS + ESM)
- **Decisión**: `@sortea2/shared` se compila con **tsup** a `index.js` (CJS) + `index.mjs`
  (ESM) + `.d.ts`; `exports` enruta `require`→CJS, `import`→ESM.
- **Por qué**: la API (Node CJS) hacía `require()` del **fuente TS** y Node no lo entendía;
  Vite/Rollup no lee named-exports de CommonJS. Dual satisface a ambos consumidores.

## D-004 · El ganador se decide en el servidor (justicia)
- **Decisión**: `RandomWinnerPicker` con `crypto.randomInt(0, n)`; el índice ganador viaja al
  front, que solo lo *dramatiza*. Cada sorteo se persiste en `raffle_draws`.
- **Por qué**: la aleatoriedad y la auditoría no pueden depender del navegador.
- **Alternativa descartada**: elegir en el cliente (manipulable).

## D-005 · Bloqueo de registro durante el sorteo (estado persistente)
- **Decisión**: tabla singleton `event_state(registrationLocked)`. `draw` cierra; volver a la
  pantalla principal (`POST /raffle/end`) reabre; `clear` también reabre.
- **Por qué**: congelar el pool mientras el sorteo está en curso es justo; persistirlo evita
  que un reinicio de Railway reabra por accidente. Se difunde por socket en vivo.
- **Alternativa descartada**: flag en memoria (se pierde al reiniciar).

## D-006 · Alta masiva con `createMany` + snapshot
- **Decisión**: el bulk usa `prisma.createMany({ skipDuplicates })` (1 consulta) y emite un
  único evento `participants:snapshot`.
- **Por qué**: insertar fila por fila (600 viajes a la BD) era inviable (~no terminaba); con
  `createMany`, 500 filas ≈ 1.7 s. Un solo evento evita 600 renders en el cliente.

## D-007 · Frontend con `base: './'` para GitHub Pages
- **Decisión**: Vite `base: './'`; los logos se **importan** (fingerprint) en vez de rutas
  absolutas `/assets/...`.
- **Por qué**: GitHub Pages de proyecto sirve bajo `/<repo>/`; rutas absolutas se rompen. El
  base relativo funciona en subpath y en dominio propio sin conocer el nombre del repo.

## D-008 · CI inyecta secretos al entorno de Railway
- **Decisión**: el workflow hace `railway variables --set` desde GitHub Secrets/Variables y
  luego `railway up`; el job está filtrado por rutas (solo redepliega lo que cambió).
- **Por qué**: GitHub es la fuente de verdad; Railway lee `process.env` (no `.env` físico) y
  los secretos no quedan en la imagen.

## D-009 · `WebSocket` del navegador y `transports:['websocket']`
- **Decisión**: el cliente Socket.IO usa solo transporte websocket; CORS del gateway abierto.
- **Por qué**: evita problemas de *sticky sessions* del upgrade por polling. Con 1 instancia no
  hay Redis; al escalar, se añade el adaptador Redis.
