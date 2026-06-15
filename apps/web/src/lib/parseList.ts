import type { CreateParticipantInput } from '@sortea2/shared';
import { EMOJIS } from '../raffle/modes';

const EMAIL_RE = /[^\s,;<>"]+@[^\s,;<>"]+\.[^\s,;<>"]+/;

export interface ParseResult {
  participants: CreateParticipantInput[];
  /** líneas no vacías sin un correo válido (se omiten) */
  invalid: number;
}

/**
 * Parsea una lista pegada. Acepta una persona por línea en formatos como:
 *   "Ada Lovelace, ada@x.dev"   ·   "Ada Lovelace <ada@x.dev>"   ·   "ada@x.dev"
 * Requiere un correo válido por línea (un correo = un participante). A cada
 * importado se le asigna un emoji al azar como avatar.
 */
export function parseParticipantList(text: string): ParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const participants: CreateParticipantInput[] = [];
  let invalid = 0;

  for (const line of lines) {
    const match = line.match(EMAIL_RE);
    if (!match) {
      invalid++;
      continue;
    }
    const email = match[0].toLowerCase();
    let name = line
      .replace(match[0], '')
      .replace(/[<>;,|\t"]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!name) name = email.split('@')[0]!;
    participants.push({
      name: name.slice(0, 60),
      email,
      avatar: { type: 'emoji', value: EMOJIS[Math.floor(Math.random() * EMOJIS.length)]! },
    });
  }

  return { participants, invalid };
}
