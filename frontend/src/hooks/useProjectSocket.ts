'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export type SocketStatus = 'connected' | 'connecting' | 'disconnected';

export interface RealtimeMessage {
  event: string;
  project_id: string;
  entity_id: string;
  payload?: unknown;
}

export function useProjectSocket(projectId?: string) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SocketStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const isUnmountedRef = useRef(false);

  const connect = useCallback(() => {
    if (!projectId || isUnmountedRef.current) return;

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setStatus('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (isUnmountedRef.current) {
          socket.close();
          return;
        }
        setStatus('connected');
        retryCountRef.current = 0;
      };

      socket.onmessage = (event) => {
        try {
          const data: RealtimeMessage = JSON.parse(event.data);
          if (data.project_id && data.project_id === projectId) {
            if (data.event.startsWith('task:')) {
              queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            } else if (data.event.startsWith('note:')) {
              queryClient.invalidateQueries({ queryKey: ['notes', projectId] });
            }
          }
        } catch {
          // Ignore non-JSON messages (like ping/pong)
        }
      };

      socket.onclose = () => {
        if (isUnmountedRef.current) return;
        setStatus('disconnected');
        wsRef.current = null;

        // Exponential backoff: 1s, 2s, 4s, 8s, max 15s
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 15000);
        retryCountRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };

      socket.onerror = () => {
        // Handled via onclose
      };
    } catch {
      setStatus('disconnected');
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 15000);
      retryCountRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    }
  }, [projectId, queryClient]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { status };
}
