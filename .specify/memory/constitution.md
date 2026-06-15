<!--
Sync Impact Report
- Version: 1.0.0 (ratificación inicial)
- Principios definidos: 7
- Plantillas dependientes: spec.md, plan.md, tasks.md (alineadas)
- TODOs: ninguno
-->

# Constitución — Sortea2 (Sorteo Interactivo DevOpsDays Lima 2026)

Marco: **GitHub Spec Kit — Spec-Driven Development (SDD)**.
Esta constitución define principios NO negociables. Toda spec, plan y tarea debe
verificarse contra ella (sección "Constitution Check").

## Principios

### I. Contrato compartido como fuente única de verdad
Los tipos de dominio y los eventos de tiempo real viven **solo** en
`packages/shared`. Backend y frontend los consumen desde ahí; está prohibido
duplicar formas de datos o nombres de eventos. El paquete se compila en formato
**dual** (CJS para la API en Node, ESM para Vite) para que ambos lo usen sin
divergir. **Razón:** elimina desincronización front↔back y errores de strings mágicos.

### II. Arquitectura por puertos y adaptadores (SOLID / DIP)
La lógica de dominio (services) depende de **abstracciones** (puertos:
`ParticipantRepository`, `RaffleRepository`, `AvatarStorage`, `EventsPublisher`,
`WinnerPicker`), nunca de Prisma, Socket.IO o Supabase directamente. Las
implementaciones se inyectan por token. Cada clase tiene una sola responsabilidad
(controller = HTTP, service = caso de uso, repository = persistencia, gateway =
transporte). **Razón:** testeabilidad, sustituibilidad y cambios localizados.

### III. Sorteo justo y autoritativo en el servidor
El ganador se elige **en el backend** con un PRNG **criptográfico**
(`crypto.randomInt`), uniforme e impredecible — nunca en el navegador. Cada sorteo
se **persiste** (auditable). Mientras un sorteo está en curso, el pool de
participantes se **congela** (registro cerrado) para que nadie entre tras ver que
empezó. **Razón:** la justicia no puede depender del cliente.

### IV. Tiempo real por defecto
El proyector carga un snapshot inicial por REST y luego recibe **deltas** por
WebSocket (`participant:registered`, `:removed`, `participants:snapshot`,
`:cleared`, `raffle:drawn`, `registration:locked`). El backend es autoritativo y
emite; los clientes solo escuchan. Una sola instancia no requiere Redis; al escalar
a varias, es obligatorio el adaptador Redis de Socket.IO. **Razón:** experiencia en
vivo sin polling ni acoplar el front a la base de datos.

### V. Seguridad de secretos y acciones de organizador
Las acciones de organizador (`draw`, `end`, `bulk`, `remove`, `clear`) se protegen
con `ORGANIZER_KEY` (header `x-organizer-key`); el registro del asistente queda
abierto salvo bloqueo. Los secretos viven en GitHub Actions y el pipeline los
**inyecta al entorno de Railway**; nunca se hornean en la imagen ni se versionan.
**Razón:** mínimo privilegio y cero fugas de credenciales.

### VI. Tipado de extremo a extremo y builds verdes
TypeScript estricto en todo el monorepo. Ningún cambio se considera terminado si
`shared`, `api` o `web` no compilan. Las migraciones de Prisma son versionadas y se
aplican con `migrate deploy` en cada release. **Razón:** los tipos y el build son la
primera red de seguridad.

### VII. Degradación elegante
Si una dependencia opcional falta, el sistema no se cae: sin
`SUPABASE_SERVICE_ROLE_KEY` las fotos se guardan como data-URL; sin `ORGANIZER_KEY`
el guard opera en "modo abierto" (solo dev) con aviso; orígenes CORS configurables.
**Razón:** robustez en condiciones reales de evento.

## Restricciones tecnológicas

- **Stack fijo:** Backend NestJS (Node ≥ 22; imagen Docker Node 24), Frontend React
  + Vite, datos en Supabase (Postgres + Storage), monorepo pnpm + Turborepo.
- **Node ≥ 22** obligatorio: la API usa `WebSocket` global (lo exige
  `@supabase/realtime-js`).
- **Conexión a Postgres** siempre por el **pooler IPv4** de Supabase (no la
  conexión directa IPv6).

## Flujo de desarrollo (SDD)

1. `constitution` → 2. `specify` (qué/por qué) → 3. `clarify` → 4. `plan` (cómo) →
5. `tasks` → 6. `implement`. Cada fase produce artefactos en `specs/<feature>/` y se
revisa contra esta constitución antes de avanzar.

## Gobernanza

- Esta constitución prevalece sobre cualquier otra práctica.
- Las enmiendas requieren: documentar el cambio, su justificación y subir versión
  (semver: MAJOR = principio incompatible; MINOR = nuevo principio/sección; PATCH =
  aclaraciones).
- Toda PR/revisión debe confirmar cumplimiento de los principios aplicables.

**Versión**: 1.0.0 · **Ratificada**: 2026-06-14 · **Última enmienda**: 2026-06-14
