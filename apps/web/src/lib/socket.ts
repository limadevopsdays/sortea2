import type { ServerToClientEvents } from '@sortea2/shared';
import { io, type Socket } from 'socket.io-client';
import { env } from './env';

/** Conexión única al gateway de NestJS (solo escucha eventos del servidor). */
export const socket: Socket<ServerToClientEvents> = io(env.apiUrl, {
  autoConnect: true,
  transports: ['websocket'],
});
