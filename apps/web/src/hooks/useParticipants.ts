import { SOCKET_EVENTS, type Participant } from '@sortea2/shared';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { socket } from '../lib/socket';

/**
 * Fuente única de la lista de participantes en el cliente:
 * snapshot inicial por REST + deltas en vivo por WebSocket.
 */
export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [locked, setLocked] = useState(false);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    setParticipants(await api.listParticipants());
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
    void api.getState().then((s) => setLocked(s.registrationLocked));

    const onLocked = (v: boolean) => setLocked(v);
    const onRegistered = (p: Participant) =>
      setParticipants((prev) => (prev.some((x) => x.id === p.id) ? prev : [...prev, p]));
    const onRemoved = (id: string) =>
      setParticipants((prev) => prev.filter((x) => x.id !== id));
    const onSnapshot = (list: Participant[]) => setParticipants(list);
    const onCleared = () => setParticipants([]);

    socket.on(SOCKET_EVENTS.participantRegistered, onRegistered);
    socket.on(SOCKET_EVENTS.participantRemoved, onRemoved);
    socket.on(SOCKET_EVENTS.participantsSnapshot, onSnapshot);
    socket.on(SOCKET_EVENTS.participantsCleared, onCleared);
    socket.on(SOCKET_EVENTS.registrationLocked, onLocked);
    return () => {
      socket.off(SOCKET_EVENTS.participantRegistered, onRegistered);
      socket.off(SOCKET_EVENTS.participantRemoved, onRemoved);
      socket.off(SOCKET_EVENTS.participantsSnapshot, onSnapshot);
      socket.off(SOCKET_EVENTS.participantsCleared, onCleared);
      socket.off(SOCKET_EVENTS.registrationLocked, onLocked);
    };
  }, [refresh]);

  const clear = useCallback(async () => {
    await api.clear();
    setParticipants([]);
    setLocked(false);
  }, []);

  return { participants, locked, ready, refresh, clear };
}
