/**
 * Clave de organizador del lado del proyector. No va en el bundle: se pide una
 * vez y se guarda en localStorage. Solo se envía en acciones protegidas
 * (sortear / limpiar); el registro de asistentes sigue abierto.
 */
const KEY = 'dod-organizer-key';

export function getOrganizerKey(): string | null {
  return localStorage.getItem(KEY);
}

/** Devuelve la clave; si no hay, la pide y la guarda. '' si el usuario cancela. */
export function ensureOrganizerKey(): string {
  let k = localStorage.getItem(KEY);
  if (!k) {
    k = window.prompt('Clave de organizador para sortear/limpiar:') ?? '';
    if (k) localStorage.setItem(KEY, k);
  }
  return k;
}

export function clearOrganizerKey(): void {
  localStorage.removeItem(KEY);
}
