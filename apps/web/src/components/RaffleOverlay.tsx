import type { Participant, RaffleResult } from '@sortea2/shared';
import { useEffect, useRef, useState } from 'react';
import { sound } from '../lib/sound';
import { burstConfetti, runRaffleMode } from '../raffle/engine';
import { MODE_TAG } from '../raffle/modes';
import { Avatar } from './Avatar';

interface Props {
  result: RaffleResult | null;
  participants: Participant[];
  onClose: () => void;
  onAgain: () => void;
  onRemoveWinner: (id: string) => void;
}

/**
 * Capa del sorteo. Cuando llega un `result`, corre la animación del modo en un
 * nodo imperativo (stage) y, al terminar, revela la tarjeta de ganador + confetti.
 */
export function RaffleOverlay({ result, participants, onClose, onAgain, onRemoveWinner }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [muted, setMuted] = useState(sound.muted);

  useEffect(() => {
    const stage = stageRef.current;
    if (!result || !stage) return;
    let cancelled = false;
    setWinner(null);
    stage.innerHTML = '';
    void runRaffleMode(result.mode, stage, participants, result.winnerIndex).then(() => {
      if (cancelled) return;
      setWinner(result.winner);
      if (overlayRef.current) burstConfetti(overlayRef.current);
    });
    return () => {
      cancelled = true;
    };
  }, [result, participants]);

  return (
    <div ref={overlayRef} className={`raffle-overlay${result ? ' on' : ''}`}>
      <div className="raffle-head">
        <div className="title">
          Sorteo <span className="accent">en marcha</span>
        </div>
        <span className="mode-tag">{result ? MODE_TAG[result.mode] : 'Sorteo'}</span>
        <button
          className="close-x"
          title={muted ? 'Activar sonido' : 'Silenciar'}
          onClick={() => {
            const m = !muted;
            sound.setMuted(m);
            setMuted(m);
            if (!m) sound.unlock();
          }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <button className="close-x" onClick={onClose}>
          ✕
        </button>
      </div>

      <div ref={stageRef} className="raffle-stage" />

      <div className={`winner-card${winner ? ' show' : ''}`}>
        <div className="w-avatar">{winner && <Avatar avatar={winner.avatar} />}</div>
        <div className="w-info">
          <div className="lbl">¡Ganador!</div>
          <div className="name">{winner?.name ?? '—'}</div>
        </div>
        <div className="w-actions">
          <button className="w-btn" onClick={onAgain}>
            ↻ Otra vuelta
          </button>
          <button
            className="w-btn danger"
            title="Quita al ganador del sorteo para que no vuelva a salir"
            onClick={() => winner && onRemoveWinner(winner.id)}
          >
            🚫 Retirar ganador
          </button>
          <button className="w-btn" onClick={onClose}>
            Mantener y cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
