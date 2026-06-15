# Contrato WebSocket (Fase 1)

Transporte: **Socket.IO** (gateway NestJS). El servidor **emite**; los clientes solo
**escuchan**. Nombres y firmas en `@sortea2/shared` (`SOCKET_EVENTS`,
`ServerToClientEvents`) — fuente única para evitar strings mágicos.

Conexión del cliente: `io(API_URL, { transports: ['websocket'] })`.

## Eventos servidor → cliente

| Evento (constante) | String | Payload | Cuándo |
|---|---|---|---|
| `participantRegistered` | `participant:registered` | `Participant` | alguien se inscribió |
| `participantRemoved` | `participant:removed` | `string` (id) | se retiró a alguien (p. ej. el ganador) |
| `participantsSnapshot` | `participants:snapshot` | `Participant[]` | reemplazo total (tras alta masiva) |
| `participantsCleared` | `participants:cleared` | — | se limpió la lista |
| `raffleDrawn` | `raffle:drawn` | `RaffleResult` | se ejecutó un sorteo |
| `registrationLocked` | `registration:locked` | `boolean` | se cerró/abrió el registro |

## Patrón de sincronización del proyector
1. Al cargar: `GET /api/participants` (snapshot) + `GET /api/state` (bloqueo).
2. Luego solo **deltas** por socket (registered / removed / snapshot / cleared / locked).
3. El cliente deduplica por `id` (idempotente ante reconexión).

## Escalado
Con **1 instancia** de API, los eventos llegan a todos los sockets sin más. Con **varias
instancias** es **obligatorio** el adaptador Redis de Socket.IO (si no, un evento emitido por
la instancia A no llega a un cliente conectado a la B).
