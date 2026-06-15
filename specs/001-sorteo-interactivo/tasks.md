# Tareas: Sorteo Interactivo en Vivo

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Marco**: GitHub Spec Kit
Convención: `[P]` = paralelizable (archivos distintos). Estado: todas implementadas (`[x]`).

## Fase A — Setup del monorepo
- [x] T001 Estructura pnpm workspaces + Turborepo (`apps/*`, `packages/*`), tsconfig base.
- [x] T002 `@sortea2/shared` con build **dual CJS/ESM** (tsup) y `exports` por condición. [P]
- [x] T003 App NestJS (`apps/api`) con config tipada, ValidationPipe, CORS, bodyParser 2MB, `PORT`. [P]
- [x] T004 App React/Vite (`apps/web`) con `base: './'`, CSS de marca portado. [P]

## Fase B — Contrato y datos
- [x] T005 Tipos de dominio + `SOCKET_EVENTS` en `packages/shared`.
- [x] T006 Schema Prisma: `Participant`, `RaffleDraw`, enums → migración `init`.
- [x] T007 `email @unique` → migración `unique_email`.
- [x] T008 `EventState` (singleton) → migración `event_state`.

## Fase C — Backend (puertos y adaptadores)
- [x] T009 `PrismaModule`/`PrismaService` (ciclo de vida).
- [x] T010 Puerto `ParticipantRepository` + adaptador Prisma (`create`, `createMany`, `findAll`, `deleteById`, `deleteAll`). [P]
- [x] T011 Puerto `AvatarStorage` + `SupabaseAvatarStorage` (sube data-URL, degrada). [P]
- [x] T012 Puerto `EventsPublisher` + `RealtimeGateway` (Socket.IO). [P]
- [x] T013 `EventStateService` (registro abierto/cerrado). [P]
- [x] T014 `WinnerPicker` (puerto) + `RandomWinnerPicker` (`crypto.randomInt`). [P]
- [x] T015 `ParticipantsService` (register/registerMany/list/remove/clear) + reglas (correo único, bloqueo).
- [x] T016 `RaffleService` (draw justo + persistencia + lock; end = reabrir).
- [x] T017 `OrganizerGuard` (header `x-organizer-key`).
- [x] T018 Controllers: participants, raffle, state; cableado de módulos.

## Fase D — Frontend
- [x] T019 Cliente REST tipado (`lib/api`) + socket (`lib/socket`) + clave organizador (`lib/organizer`).
- [x] T020 `useParticipants` (snapshot REST + deltas socket + estado de bloqueo).
- [x] T021 `DisplayView` (QR, grilla en vivo, modos, acciones, pegar lista, demo 10/50/600).
- [x] T022 `RegisterView` (responsive móvil; cerrado cuando el sorteo está en curso).
- [x] T023 QR de marca (`lib/qr`) con logo central, ojos redondeados y esquinas.
- [x] T024 `RaffleOverlay` + `engine.ts`: 8 modos animados; retirar/mantener ganador.

## Fase E — Pulido de modalidades
- [x] T025 Carrera de Cuys: cuy animado por color, cuenta regresiva 3·2·1, sonido, medallas 🥇🥈🥉, todos caben en pantalla, resaltar 1º.
- [x] T026 Ruleta: **spin manual** (botón) y, con > 30, avatares **flotando** alrededor.
- [x] T027 Sonido (Web Audio) + mute persistente.

## Fase F — Seguridad / estado
- [x] T028 Acciones de organizador protegidas (draw, end, bulk, remove, clear).
- [x] T029 Bloqueo de registro **mientras** el sorteo está en curso; reabre al volver a la principal.

## Fase G — Despliegue y documentación
- [x] T030 Dockerfile (Node 24) + `railway.json` + `.dockerignore`.
- [x] T031 Workflow CI (API→Railway, Web→Pages) con filtro por rutas e inyección de secretos.
- [x] T032 `README.md` + documentación Spec Kit (`.specify/`, `specs/001-...`).

## Pendientes / mejoras futuras
- [ ] T033 Tests automatizados (unit de services/picker; e2e de endpoints).
- [ ] T034 Adaptador Redis de Socket.IO si se escala a múltiples instancias de API.
- [ ] T035 Extender sonido/efectos a otras modalidades (opcional).
