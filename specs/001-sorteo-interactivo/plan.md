# Plan de Implementación: Sorteo Interactivo en Vivo

**Spec**: [spec.md](./spec.md) · **Branch**: `001-sorteo-interactivo` · **Marco**: GitHub Spec Kit

## Resumen
Monorepo con API NestJS (autoritativa, tiempo real por WebSocket, Prisma → Supabase) y
frontend React/Vite (proyector + formulario del celular). El ganador se decide en el
servidor; las animaciones son presentación.

## Contexto técnico

| Aspecto | Decisión |
|---|---|
| Lenguaje | TypeScript (estricto) |
| Backend | NestJS 10, Node ≥ 22 (imagen Docker **Node 24**) |
| Frontend | React 18 + Vite 5 (`base: './'` para GitHub Pages) |
| ORM / DB | Prisma 5 → **Supabase Postgres** (pooler IPv4) |
| Almacenamiento | Supabase Storage (avatares con foto) |
| Tiempo real | Socket.IO (gateway NestJS) |
| Monorepo | pnpm workspaces + Turborepo |
| Paquete compartido | `@sortea2/shared` (build dual CJS+ESM con tsup) |
| Auth organizador | header `x-organizer-key` vs `ORGANIZER_KEY` (guard) |
| Despliegue | API → Railway (Docker) · Web → GitHub Pages (Actions) · Datos → Supabase |
| Escala objetivo | Evento de cientos–miles de inscritos; 1 proyector (varias pantallas posibles) |

## Constitution Check
- **I. Contrato único** → `packages/shared` (tipos + `SOCKET_EVENTS`), build dual. ✅
- **II. Puertos/Adaptadores (DIP)** → `ParticipantRepository`, `RaffleRepository`,
  `AvatarStorage`, `EventsPublisher`, `WinnerPicker` con implementación inyectada. ✅
- **III. Sorteo justo en servidor** → `RandomWinnerPicker` (`crypto.randomInt`), draws
  persistidos, pool congelado durante el sorteo. ✅
- **IV. Tiempo real** → snapshot REST + deltas socket; gateway solo emite. ✅
- **V. Secretos / guard** → `OrganizerGuard`; secretos GitHub→Railway, fuera de la imagen. ✅
- **VI. Tipos + builds verdes** → `tsc` estricto; migraciones `migrate deploy`. ✅
- **VII. Degradación** → Storage→data-URL; guard "modo abierto" sin clave. ✅

## Estructura del proyecto

```
apps/
  api/                         NestJS
    src/
      main.ts                  bootstrap (CORS, validación, bodyParser 2MB, PORT)
      config/                  configuración tipada
      prisma/                  PrismaModule + PrismaService
      common/                  OrganizerGuard
      state/                   EventState (estado del evento: registro abierto/cerrado)
      participants/            controller · service · dto · mapper · repositories(port+prisma)
      raffle/                  controller · service · domain/winner-picker · repositories
      realtime/                EventsPublisher (puerto) + RealtimeGateway (Socket.IO)
      storage/                 AvatarStorage (puerto) + SupabaseAvatarStorage
    prisma/schema.prisma       Participant · RaffleDraw · EventState
    Dockerfile                 multi-stage, Node 24
  web/                         React + Vite
    src/
      App.tsx                  orquestador (vistas, estado, sorteo)
      components/              TopBar · DisplayView · RegisterView · QrPanel · RaffleOverlay · Avatar
      hooks/useParticipants.ts snapshot REST + deltas socket + estado de bloqueo
      lib/                     api · socket · qr · sound · parseList · organizer · env
      raffle/engine.ts         8 modos (animaciones DOM agnósticas)
      styles/                  sorteo.css (diseño) + extra.css (complementos)
packages/
  shared/src/index.ts          tipos + eventos de socket (fuente única)
.github/workflows/deploy.yml   CI: API→Railway, Web→Pages (filtrado por rutas)
railway.json · .dockerignore   despliegue de la API
specs/ · .specify/             documentación Spec-Driven
```

## Fase 0 — Investigación
Decisiones clave en [research.md](./research.md): pooler IPv4 de Supabase, Node 24 por
`WebSocket` global, paquete compartido dual CJS/ESM, sorteo justo en servidor, bloqueo
de registro durante el sorteo, `base: './'` para Pages.

## Fase 1 — Diseño
- **Datos**: [data-model.md](./data-model.md)
- **Contratos**: [contracts/rest-api.md](./contracts/rest-api.md) ·
  [contracts/websocket-events.md](./contracts/websocket-events.md)
- **Puesta en marcha y verificación**: [quickstart.md](./quickstart.md)

## Fase 2 — Tareas
Desglose en [tasks.md](./tasks.md).
