import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

/**
 * Ishlab chiqarish wallboardini real vaqtda yangilab turish uchun mustaqil STOMP mijozi.
 * `/topic/production/board` ga obuna bo'lib, har bir o'zgarish signalida onChange chaqiradi.
 * Umumiy webSocketService'ga tegmaydi (izolyatsiya) — faqat sahifa ochiq turganda ulanadi.
 */
export function useProductionBoardLive(
  onChange: () => void,
  onStatus?: (connected: boolean) => void,
) {
  const onChangeRef = useRef(onChange);
  const onStatusRef = useRef(onStatus);
  onChangeRef.current = onChange;
  onStatusRef.current = onStatus;

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const wsUrl = (import.meta.env.VITE_API_URL || '/api') + '/v1/ws';
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        onStatusRef.current?.(true);
        client.subscribe('/topic/production/board', () => {
          onChangeRef.current();
        });
      },
      onDisconnect: () => onStatusRef.current?.(false),
      onWebSocketClose: () => onStatusRef.current?.(false),
    });

    client.activate();
    return () => {
      onStatusRef.current?.(false);
      void client.deactivate();
    };
  }, []);
}
