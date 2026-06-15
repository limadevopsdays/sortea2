import { randomInt } from 'node:crypto';

/**
 * Estrategia para elegir al ganador (Open/Closed): hoy es aleatoria y justa,
 * pero se puede sustituir (ponderada, sin repetir ganadores previos, sembrada
 * para tests…) sin tocar el servicio que la consume.
 */
export abstract class WinnerPicker {
  /** Devuelve un índice válido en [0, count). */
  abstract pick(count: number): number;
}

/** Aleatoria uniforme con CSPRNG (no sesgada, no predecible). */
export class RandomWinnerPicker extends WinnerPicker {
  pick(count: number): number {
    if (count <= 0) throw new Error('No hay participantes para sortear');
    return randomInt(0, count);
  }
}
