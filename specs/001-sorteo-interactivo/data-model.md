# Modelo de Datos (Fase 1)

Persistencia: **PostgreSQL** (Supabase) vía Prisma. Fuente: `apps/api/prisma/schema.prisma`.

## Entidades

### Participant — `participants`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | generado |
| `number` | int | **autoincremental** — es el "#0001" en pantalla y el orden de inscripción |
| `name` | varchar(60) | 2–60 chars |
| `email` | varchar(120) | **@unique** — un correo = un participante |
| `phone` | varchar(30)? | opcional |
| `avatarType` | enum(`emoji`,`photo`) | |
| `avatarValue` | text | emoji literal o URL pública (Supabase Storage) |
| `createdAt` | timestamp | índice |

- Regla: el correo se almacena pero **no se expone** en el DTO público (solo nombre, número,
  avatar, fecha).
- `findAll` ordena por `number asc` (orden de llegada) → alinea índices front/back.

### RaffleDraw — `raffle_draws`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `mode` | enum(8 modos) | `ruleta`,`cuys`,`slot`,`dardos`,`cartas`,`paracaidas`,`bracket`,`bola` |
| `winnerId` | uuid (FK→participant) | `onDelete: Cascade` |
| `winnerIndex` | int | índice del ganador en la lista al momento del sorteo |
| `drawnAt` | timestamp | índice |

- Auditoría de cada ejecución de sorteo.

### EventState — `event_state`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | int (PK) | **singleton** (siempre 1) |
| `registrationLocked` | boolean | `true` mientras un sorteo está en curso |
| `updatedAt` | timestamp | |

- Transiciones: `draw` → `true`; `raffle/end` o `clear` → `false`.

## Relaciones
```
Participant 1 ──< RaffleDraw   (winnerId, cascade al borrar al participante)
EventState  (fila única, sin relaciones)
```

## Migraciones (orden)
1. `..._init` — `participants`, `raffle_draws`, enums.
2. `..._unique_email` — índice único en `participants.email`.
3. `..._event_state` — tabla `event_state`.

> Aplicar con `prisma migrate deploy`. `DIRECT_URL` (session pooler) para migraciones.
