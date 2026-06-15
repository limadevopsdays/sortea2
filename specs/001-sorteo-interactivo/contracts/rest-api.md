# Contrato REST (Fase 1)

Base: `/<API_URL>/api`. Tipos en `@sortea2/shared`. Validación con class-validator.
Auth de organizador: header `x-organizer-key: <ORGANIZER_KEY>` (devuelve `401` si falta/incorrecta;
en "modo abierto" sin `ORGANIZER_KEY` configurada, permite).

## Participantes

### `POST /api/participants` — inscribirse *(abierto)*
Body `CreateParticipantInput`:
```json
{ "name": "Ada Lovelace", "email": "ada@x.dev", "phone": "+51 999...",
  "avatar": { "type": "emoji", "value": "🦄" } }
```
- `201` → `Participant` `{ id, name, number, avatar, createdAt }`
- `409` correo duplicado · `403` registro cerrado (sorteo en curso) · `400` validación.
- Si `avatar.type==="photo"` y el valor es data-URL, se sube a Storage y se guarda la URL.

### `GET /api/participants` — listar *(abierto)*
- `200` → `Participant[]` (orden de inscripción). Snapshot inicial del proyector.

### `POST /api/participants/bulk` — alta masiva *(organizador)*
Body `{ participants: CreateParticipantInput[] }` (1–500).
- `201` → `{ created: number, skipped: number }` (omite correos repetidos)
- `403` registro cerrado · `401` sin clave · `400` > 500 o validación.

### `DELETE /api/participants/:id` — retirar uno *(organizador)*
- `204` ok · `404` no existe · `401` sin clave. (Usado para "retirar al ganador".)

### `DELETE /api/participants` — limpiar todo *(organizador)*
- `204` ok (también **reabre** el registro) · `401` sin clave.

## Sorteo

### `POST /api/raffle/draw` — ejecutar *(organizador)*
Body `{ mode: RaffleMode }`.
- `201` → `RaffleResult` `{ id, mode, winner, winnerIndex, drawnAt }`
- Efecto: persiste el sorteo y **cierra el registro** (`registrationLocked=true`).
- `400` < 2 participantes o modo inválido · `401` sin clave.

### `POST /api/raffle/end` — terminar *(organizador)*
- `204` ok. Efecto: **reabre el registro** (volver a la pantalla principal). `401` sin clave.

## Estado

### `GET /api/state` — estado del evento *(abierto)*
- `200` → `{ "registrationLocked": boolean }`. Lo consulta el celular al cargar.

## Notas
- Límite de body: 2 MB (fotos en base64 antes de subirse a Storage).
- CORS: orígenes en `CORS_ORIGINS` (coma-separados, con esquema, sin barra final).
