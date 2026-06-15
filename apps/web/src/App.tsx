import type { CreateParticipantInput, RaffleMode, RaffleResult } from '@sortea2/shared';
import { useCallback, useEffect, useState } from 'react';
import { DisplayView } from './components/DisplayView';
import { RaffleOverlay } from './components/RaffleOverlay';
import { RegisterView } from './components/RegisterView';
import { TopBar, type View } from './components/TopBar';
import { useParticipants } from './hooks/useParticipants';
import { api } from './lib/api';
import { EMOJIS } from './raffle/modes';

const MODE_KEY = 'dod-sorteo-mode';
const BULK_CHUNK = 500; // límite del endpoint /participants/bulk

const FIRST_NAMES = ['María', 'Juan', 'Sofía', 'Carlos', 'Lucía', 'Diego', 'Ana', 'Pedro', 'Camila', 'Renzo', 'Valeria', 'Luis', 'Gabriela', 'José', 'Daniela', 'Miguel', 'Fernanda', 'Andrés', 'Paola', 'Jorge', 'Rosa', 'Víctor', 'Karen', 'Bruno', 'Lorena', 'Iván', 'Patricia', 'Marco', 'Elena', 'Raúl'];
const LAST_NAMES = ['Rodríguez', 'Pérez', 'Quispe', 'Mendoza', 'Tello', 'Salazar', 'Vargas', 'Castañeda', 'Herrera', 'Aguirre', 'Núñez', 'Cárdenas', 'Flores', 'Ramos', 'Torres', 'Rojas', 'Chávez', 'Díaz', 'Gutiérrez', 'Paredes', 'Ríos', 'Espinoza', 'Cruz', 'Ríos', 'Ponce', 'Sánchez', 'Reyes', 'Campos', 'León', 'Soto'];

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]!;

/** Genera N participantes de demo con correos únicos. */
function makeDemo(n: number): CreateParticipantInput[] {
  const tag = Date.now().toString(36);
  return Array.from({ length: n }, (_, i) => ({
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    email: `demo-${tag}-${i}@sortea2.dev`,
    avatar: { type: 'emoji', value: pick(EMOJIS) },
  }));
}

export function App() {
  const [view, setView] = useState<View>(() =>
    window.location.hash === '#register' ? 'register' : 'display',
  );
  const [mode, setMode] = useState<RaffleMode>(
    () => (localStorage.getItem(MODE_KEY) as RaffleMode) || 'ruleta',
  );
  const [result, setResult] = useState<RaffleResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { participants, locked, clear, refresh } = useParticipants();

  const fail = useCallback((e: unknown) => {
    setError(e instanceof Error ? e.message : 'Algo salió mal');
    setTimeout(() => setError(null), 4000);
  }, []);

  const selectMode = (m: RaffleMode) => {
    setMode(m);
    localStorage.setItem(MODE_KEY, m);
  };

  const draw = useCallback(async () => {
    setBusy(true);
    try {
      setResult(await api.draw(mode));
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }, [mode, fail]);

  const loadDemo = useCallback(
    async (count: number) => {
      setBusy(true);
      try {
        const all = makeDemo(count);
        for (let i = 0; i < all.length; i += BULK_CHUNK) {
          await api.bulkRegister(all.slice(i, i + BULK_CHUNK));
        }
        await refresh(); // sincroniza la grilla de una vez tras la carga masiva
      } catch (e) {
        fail(e);
      } finally {
        setBusy(false);
      }
    },
    [fail, refresh],
  );

  const onClear = useCallback(async () => {
    if (!participants.length) return;
    if (!window.confirm('¿Borrar todos los participantes?')) return;
    try {
      await clear();
    } catch (e) {
      fail(e);
    }
  }, [participants.length, clear, fail]);

  const closeRaffle = useCallback(() => {
    setResult(null);
    // volver a la pantalla principal reabre el registro
    void api.endRaffle().catch(() => {});
  }, []);

  const removeWinner = useCallback(
    async (id: string) => {
      try {
        await api.remove(id);
      } catch (e) {
        fail(e);
      }
      closeRaffle();
    },
    [fail, closeRaffle],
  );

  useEffect(() => {
    const onHash = () => setView(window.location.hash === '#register' ? 'register' : 'display');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <>
      <div className="bg-grid" />
      <TopBar view={view} onChange={setView} />

      {view === 'display' ? (
        <DisplayView
          participants={participants}
          mode={mode}
          onSelectMode={selectMode}
          onStart={draw}
          onLoadDemo={loadDemo}
          onClear={onClear}
          onOpenForm={() => setView('register')}
          onBulkAdd={api.bulkRegister}
          locked={locked}
          busy={busy}
        />
      ) : (
        <RegisterView register={api.register} locked={locked} />
      )}

      <RaffleOverlay
        result={result}
        participants={participants}
        onClose={closeRaffle}
        onAgain={draw}
        onRemoveWinner={removeWinner}
      />

      {error && <div className="app-error">⚠ {error}</div>}
    </>
  );
}
