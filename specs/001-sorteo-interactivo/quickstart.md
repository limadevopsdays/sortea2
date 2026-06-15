# Quickstart y Verificación (Fase 1)

## Requisitos
- Node ≥ 22 · pnpm ≥ 9 · proyecto Supabase (Postgres + Storage)

## Puesta en marcha (local)
```bash
pnpm install
cp .env.example .env          # completar DATABASE_URL/DIRECT_URL (pooler), SUPABASE_*, ORGANIZER_KEY
pnpm --filter @sortea2/api prisma:generate
pnpm --filter @sortea2/api prisma:migrate   # crea tablas en Supabase
pnpm dev                       # API :3000 + Web :5173 (Turborepo)
```
- Proyector: http://localhost:5173 · Formulario del celular: `/#register`
- Prueba rápida: **Cargar demo → 10/50/600** → elegir modalidad → **Iniciar sorteo**.

## Pruebas de aceptación (curl)
Con la API arriba (`B=http://localhost:3000/api`, `K='x-organizer-key: <clave>'`):

```bash
# FR-001 inscripción
curl -s -X POST $B/participants -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@x.dev","avatar":{"type":"emoji","value":"🦄"}}'   # 201

# FR-002 correo único
curl -s -X POST $B/participants -H 'Content-Type: application/json' \
  -d '{"name":"Otra","email":"ada@x.dev","avatar":{"type":"emoji","value":"🐙"}}'   # 409

# FR-005 sortear (cierra registro)
curl -s -X POST $B/raffle/draw -H 'Content-Type: application/json' -H "$K" \
  -d '{"mode":"ruleta"}'                                                            # 201 + winner
curl -s $B/state                                                                    # {"registrationLocked":true}

# FR-006 registro cerrado durante el sorteo …
curl -s -o /dev/null -w "%{http_code}\n" -X POST $B/participants -H 'Content-Type: application/json' \
  -d '{"name":"Caro","email":"caro@x.dev","avatar":{"type":"emoji","value":"🐢"}}'  # 403
# … y reabre al terminar
curl -s -X POST $B/raffle/end -H "$K"                                               # 204 → state false

# FR-009 guard
curl -s -o /dev/null -w "%{http_code}\n" -X POST $B/raffle/draw \
  -H 'Content-Type: application/json' -d '{"mode":"ruleta"}'                         # 401 sin clave
```

## Verificación de tiempo real
Conectar un cliente Socket.IO, hacer un `POST /participants` y confirmar que llega
`participant:registered`. Hacer `draw` y confirmar `registration:locked(true)`.

## Builds (deben quedar verdes)
```bash
pnpm --filter @sortea2/shared build
pnpm --filter @sortea2/api exec nest build
pnpm --filter @sortea2/web build
```

## Despliegue
Ver `README.md` (raíz): API → Railway (Docker, Node 24), Web → GitHub Pages (Actions,
filtrado por rutas), secretos inyectados por el pipeline a Railway.
