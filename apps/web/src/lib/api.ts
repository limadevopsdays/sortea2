import type {
  CreateParticipantInput,
  EventState,
  Participant,
  RaffleMode,
  RaffleResult,
} from '@sortea2/shared';
import { env } from './env';
import { clearOrganizerKey, ensureOrganizerKey } from './organizer';

const base = `${env.apiUrl}/api`;

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new HttpError(res.status, (body as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

/** Acciones de organizador: adjuntan la clave y, ante 401, la olvidan para repreguntar. */
async function organizerAction<T>(path: string, init: RequestInit): Promise<T> {
  try {
    return await http<T>(path, {
      ...init,
      headers: { ...init.headers, 'x-organizer-key': ensureOrganizerKey() },
    });
  } catch (e) {
    if (e instanceof HttpError && e.status === 401) {
      clearOrganizerKey();
      throw new Error('Clave de organizador inválida — intenta de nuevo.');
    }
    throw e;
  }
}

/** Cliente REST tipado de la API. */
export const api = {
  getState: () => http<EventState>('/state'),
  listParticipants: () => http<Participant[]>('/participants'),
  register: (input: CreateParticipantInput) =>
    http<Participant>('/participants', { method: 'POST', body: JSON.stringify(input) }),
  bulkRegister: (participants: CreateParticipantInput[]) =>
    organizerAction<{ created: number; skipped: number }>('/participants/bulk', {
      method: 'POST',
      body: JSON.stringify({ participants }),
    }),
  remove: (id: string) => organizerAction<void>(`/participants/${id}`, { method: 'DELETE' }),
  clear: () => organizerAction<void>('/participants', { method: 'DELETE' }),
  draw: (mode: RaffleMode) =>
    organizerAction<RaffleResult>('/raffle/draw', { method: 'POST', body: JSON.stringify({ mode }) }),
  endRaffle: () => organizerAction<void>('/raffle/end', { method: 'POST' }),
};
