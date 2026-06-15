# Sortea2 · DevOpsDays Lima 2026

Sorteo interactivo en vivo: los asistentes se inscriben escaneando un QR desde el
celular y el organizador ejecuta el sorteo en pantalla con 8 modalidades animadas
(ruleta, carrera de cuys, tragamonedas, dardos, cartas, paracaidistas, bracket y
bola mágica). El ganador se elige y persiste en el servidor; la animación es solo
presentación.

## Arquitectura

Monorepo (**pnpm workspaces + Turborepo**):

```
apps/
  api/      NestJS · REST + WebSocket (Socket.IO) · Prisma sobre Postgres de Supabase
  web/      React + Vite · pantalla del proyector + formulario del celular
packages/
  shared/   tipos y contrato de eventos compartidos (fuente única de verdad)
```

Flujo en tiempo real (el backend es autoritativo, no limitado por las 200 conexiones
de Supabase Realtime):

```
[Celular] --POST /participants--> [NestJS] --emit socket--> [Proyector]
                                     |
                                  [Postgres/Supabase via Prisma]
```

El proyector carga el snapshot inicial por REST (`GET /participants`) y luego recibe
solo los deltas por WebSocket.

### Principios SOLID aplicados

- **SRP** — controllers (HTTP), services (casos de uso), repositories (persistencia) y
  gateway (transporte) tienen una sola razón de cambio.
- **OCP** — `WinnerPicker` es una estrategia sustituible (`RandomWinnerPicker` hoy).
- **LSP/ISP** — puertos pequeños (`ParticipantRepository`, `RaffleRepository`) con solo
  lo que el dominio necesita.
- **DIP** — los servicios dependen de abstracciones (`ParticipantRepository`,
  `EventsPublisher`), no de Prisma ni de Socket.IO; las implementaciones se inyectan
  por token en los módulos.

## Requisitos

- Node ≥ 22 (la API usa `WebSocket` global, estable desde Node 22; la imagen Docker usa Node 24)
- pnpm ≥ 9
- Un proyecto de Supabase (solo se usa como Postgres gestionado + Storage opcional)

## Puesta en marcha

```bash
# 1. Dependencias
pnpm install

# 2. Variables de entorno (raíz del monorepo)
cp .env.example .env
#   completa DATABASE_URL / DIRECT_URL con las cadenas de Supabase
#   (Settings → Database → Connection string: pooler 6543 y directa 5432)

# 3. Esquema en la base de datos
pnpm --filter @sortea2/api prisma:generate
pnpm --filter @sortea2/api prisma:migrate   # crea las tablas

# 4. Desarrollo (api + web en paralelo)
pnpm dev
```

- API: http://localhost:3000/api
- Web: http://localhost:5173 (proyector). El formulario está en `/#register`.

Para probar sin celulares: en la pantalla del proyector usa **🎲 Cargar demo**.

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Levanta API y Web (Turborepo) |
| `pnpm build` | Compila todos los paquetes |
| `pnpm lint` | Type-check de cada paquete |
| `pnpm --filter @sortea2/api prisma:migrate` | Migraciones de Prisma |

## Despliegue

**Frontend → GitHub Pages · API → Railway · Datos → Supabase**, todo en un solo
workflow: [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).
En cada push a `main` despliega **la API primero**, espera a que responda `200`, y
**luego** publica el frontend (que depende de ella). Plantilla de variables en
[`.env.production.example`](./.env.production.example).

> **¿Dónde viven los secretos?** En **GitHub** (fuente de verdad). El pipeline los
> **inyecta en el entorno del servicio de Railway** (`railway variables --set`) antes de
> desplegar — Railway no usa un `.env` físico, la API los lee de `process.env`. Así no hay
> que configurarlos a mano en Railway ni quedan secretos dentro de la imagen.

### Configuración por única vez

**1. Crear el servicio en Railway**

1. Nuevo proyecto + servicio para la API. Region **US East** (cercana a Supabase `us-east-2`).
2. Build con [`railway.json`](./railway.json) → [`apps/api/Dockerfile`](./apps/api/Dockerfile)
   (corre `prisma migrate deploy` al arrancar; healthcheck `/api/participants`).
   `PORT` lo inyecta Railway. **Las demás variables las pone el pipeline** (no las definas a mano).
3. ⚠️ **Desactiva el auto-deploy nativo de Railway** (Service → Settings → desconecta el
   repo o quita "Deploy on push"). Si no, Railway y el workflow desplegarían **dos veces**.
4. Crea un **Project token** (Project → Settings → Tokens) — lo usa el CI.

**2. GitHub → Settings → Secrets and variables → Actions**

Habilita además **Pages → Source: GitHub Actions**.

| Tipo | Nombre | Para |
|---|---|---|
| 🔒 Secret | `RAILWAY_TOKEN` | autenticar el CLI de Railway |
| 🔒 Secret | `DATABASE_URL` | API (pooler 6543) → Railway |
| 🔒 Secret | `DIRECT_URL` | API (migraciones, 5432) → Railway |
| 🔒 Secret | `SUPABASE_SERVICE_ROLE_KEY` | API (Storage) → Railway |
| 🔒 Secret | `ORGANIZER_KEY` | API (guard) → Railway |
| 📋 Variable | `SUPABASE_URL` | API → Railway |
| 📋 Variable | `AVATAR_BUCKET` | API → Railway (`avatars`) |
| 📋 Variable | `CORS_ORIGINS` | API → Railway (`https://<usuario>.github.io`) |
| 📋 Variable | `RAILWAY_SERVICE` | nombre del servicio de la API |
| 📋 Variable | `VITE_API_URL` | build web (`https://<svc>.up.railway.app`) |
| 📋 Variable | `VITE_PUBLIC_URL` | build web (`https://<usuario>.github.io/<repo>`) ← **el QR codifica esta** |

Los `secrets.*` los enmascara GitHub en los logs. El job `deploy-api` corre
`railway variables --set …` con estos valores y luego `railway up`.

Listo: cada push a `main` (o "Run workflow") sincroniza la config y despliega en orden. El
build usa `base: './'`, así que funciona bajo el subpath `/<repo>/` sin configurar nada más.

> Para re-sincronizar variables sin cambiar código de la API, usa **Run workflow** (dispara
> `deploy-api` aunque no haya cambios en `apps/api`).

> - **WebSockets** ✓ nativos en Railway. Con **1 instancia** no necesitas Redis; al escalar a
>   varias, añade el adaptador Redis de Socket.IO.
> - Ambos servicios dan **HTTPS** automático (requerido para cámara/QR y portapapeles).

### Qué se despliega en cada push (filtrado por rutas)

Un job `changes` (con `dorny/paths-filter`) decide qué corre:

| Cambios en… | `deploy-api` | `deploy-web` |
|---|---|---|
| `apps/api/**`, `railway.json`, `.dockerignore` | ✅ | — |
| `apps/web/**` | — | ✅ |
| `packages/shared/**` (afecta a ambos) | ✅ | ✅ (tras la API) |
| Ejecución manual (*Run workflow*) | ✅ | ✅ |

Cuando ambos corren, el orden se mantiene (`deploy-web` espera a `deploy-api`). Si solo
cambió el front, `deploy-api` se salta y `deploy-web` corre igual contra la API ya viva.
Si `deploy-api` **falla**, el front no se publica.

## Notas

- **Fotos de avatar**: el backend las sube a Supabase Storage (bucket `avatars`, público)
  y guarda solo la URL; si falta `SUPABASE_SERVICE_ROLE_KEY`, degrada a data-URL.
- **Correo único**: un correo = un participante (constraint `@unique`); el alta repetida
  devuelve `409`.
- **Acciones de organizador** (protegidas por `ORGANIZER_KEY`, header `x-organizer-key`;
  el registro de asistentes queda abierto):
  - `POST /raffle/draw` — sortear.
  - `POST /participants/bulk` — alta masiva desde lista pegada (omite repetidos).
  - `DELETE /participants/:id` — retirar a un participante (p. ej. el ganador).
  - `DELETE /participants` — limpiar todo.

### Endpoints

| Método | Ruta | Auth | Para |
|---|---|---|---|
| `POST` | `/api/participants` | abierto | inscripción desde el celular |
| `GET` | `/api/participants` | abierto | snapshot inicial del proyector |
| `POST` | `/api/participants/bulk` | organizador | pegar lista |
| `DELETE` | `/api/participants/:id` | organizador | retirar uno |
| `DELETE` | `/api/participants` | organizador | limpiar |
| `POST` | `/api/raffle/draw` | organizador | sortear |
