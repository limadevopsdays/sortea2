import type { CreateParticipantInput, Participant, RaffleMode } from '@sortea2/shared';
import { useState } from 'react';
import { parseParticipantList } from '../lib/parseList';
import { MODE_META } from '../raffle/modes';
import { Avatar } from './Avatar';
import { QrPanel } from './QrPanel';

interface Props {
  participants: Participant[];
  mode: RaffleMode;
  onSelectMode: (m: RaffleMode) => void;
  onStart: () => void;
  onLoadDemo: (count: number) => void;
  onClear: () => void;
  onOpenForm: () => void;
  onBulkAdd: (list: CreateParticipantInput[]) => Promise<{ created: number; skipped: number }>;
  locked: boolean;
  busy?: boolean;
}

export function DisplayView({
  participants,
  mode,
  onSelectMode,
  onStart,
  onLoadDemo,
  onClear,
  onOpenForm,
  onBulkAdd,
  locked,
  busy,
}: Props) {
  const count = participants.length;

  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteBusy, setPasteBusy] = useState(false);
  const [pasteMsg, setPasteMsg] = useState<string | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);

  const addPasted = async () => {
    const { participants: list, invalid } = parseParticipantList(pasteText);
    if (list.length === 0) {
      setPasteMsg('No encontré correos válidos. Usa "Nombre, correo@dominio.com" por línea.');
      return;
    }
    setPasteBusy(true);
    setPasteMsg(null);
    try {
      const { created, skipped } = await onBulkAdd(list);
      setPasteText('');
      setPasteMsg(`✓ ${created} agregados · ${skipped + invalid} omitidos (repetidos o sin correo).`);
    } catch (e) {
      setPasteMsg(e instanceof Error ? e.message : 'No se pudo agregar la lista.');
    } finally {
      setPasteBusy(false);
    }
  };

  return (
    <main className="stage">
      <div className="display-wrap">
        <QrPanel onOpenForm={onOpenForm} />

        <div className="right-col">
          <section>
            <div className="section-head">
              <div>
                <span className="eyebrow">Paso 02 · En la sala</span>
                <h2>
                  Participantes registrados
                  {locked && <span className="lock-badge">🔒 Registro cerrado</span>}
                </h2>
              </div>
              <div className="count">
                {String(count).padStart(2, '0')}
                <small>Inscritos</small>
              </div>
            </div>

            <div className="participants">
              {count === 0 ? (
                <div className="empty-state">
                  <div className="ico">📱</div>
                  <div>Aún no hay registros. Comparte el QR o pega una lista.</div>
                  <div className="hint">Tip · "Cargar demo" para probar</div>
                </div>
              ) : (
                participants.map((p, i) => (
                  <div className="participant" key={p.id}>
                    <div className="avatar">
                      <Avatar avatar={p.avatar} />
                    </div>
                    <div className="name">{p.name}</div>
                    <div className="id">#{String(p.number ?? i + 1).padStart(3, '0')}</div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <div className="section-head">
              <div>
                <span className="eyebrow">Paso 03 · Elige modalidad</span>
                <h2>Cómo sortear</h2>
              </div>
            </div>
            <div className="modes">
              {MODE_META.map((m) => (
                <button
                  key={m.mode}
                  className={`mode${mode === m.mode ? ' selected' : ''}`}
                  onClick={() => onSelectMode(m.mode)}
                >
                  <div className="icon">{m.icon}</div>
                  <div className="name">{m.name}</div>
                  <div className="desc">{m.desc}</div>
                </button>
              ))}
            </div>
          </section>

          <div className="action-bar">
            <button className="btn-primary" disabled={count < 2 || busy} onClick={onStart}>
              <span>{busy ? 'Sorteando…' : 'Iniciar sorteo'}</span>
              <span className="arrow">→</span>
            </button>
            <button className="btn-secondary" onClick={() => setShowPaste(true)}>
              📋 Pegar lista
            </button>
            <div className="demo-wrap">
              <button className="btn-secondary" onClick={() => setDemoOpen((v) => !v)}>
                🎲 Cargar demo ▾
              </button>
              {demoOpen && (
                <div className="demo-menu">
                  {[10, 50, 600].map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        setDemoOpen(false);
                        onLoadDemo(n);
                      }}
                    >
                      {n} participantes
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="btn-secondary" onClick={onClear}>
              🗑 Limpiar
            </button>
          </div>
        </div>
      </div>

      {showPaste && (
        <div className="modal-backdrop" onClick={() => !pasteBusy && setShowPaste(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Pegar lista de participantes</h3>
              <button className="close-x" onClick={() => !pasteBusy && setShowPaste(false)}>
                ✕
              </button>
            </div>
            <p className="modal-hint">
              Una persona por línea. Formatos válidos:{' '}
              <code>Ada Lovelace, ada@x.dev</code> · <code>Ada &lt;ada@x.dev&gt;</code> ·{' '}
              <code>ada@x.dev</code>. Se requiere un correo válido por persona; los repetidos se omiten.
            </p>
            <textarea
              className="paste-area"
              rows={9}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={'María Rodríguez, maria@empresa.com\nJuan Pérez <juan@empresa.com>\nsofia@empresa.com'}
            />
            {pasteMsg && <div className="paste-msg">{pasteMsg}</div>}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowPaste(false)} disabled={pasteBusy}>
                Cerrar
              </button>
              <button className="btn-primary modal-add" onClick={addPasted} disabled={pasteBusy || !pasteText.trim()}>
                {pasteBusy ? 'Agregando…' : 'Agregar al sorteo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
