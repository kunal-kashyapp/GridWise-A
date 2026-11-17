import { useEffect, useState, useRef, useCallback } from 'react';
import type { ZoneReading, AnomalyItem } from './client';

export interface LiveWsData {
  zones: Record<string, ZoneReading>;
  anomalies: AnomalyItem[];
  total_power_kw: number;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  data: LiveWsData | null;
  lastUpdated: Date | null;
  error: string | null;
  reconnect: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [data, setData] = useState<LiveWsData | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectDelay = 10000;

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Determine WS protocol & host
    const isHttps = window.location.protocol === 'https:';
    const wsProtocol = isHttps ? 'wss:' : 'ws:';
    // When running under vite dev server, host might be localhost:5173 which proxies /ws
    // Or connect directly to localhost:8000
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/live`;
    const fallbackUrl = 'ws://localhost:8000/ws/live';

    let socket: WebSocket;
    try {
      socket = new WebSocket(wsUrl);
    } catch {
      socket = new WebSocket(fallbackUrl);
    }

    wsRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as LiveWsData;
        setData(parsed);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    socket.onerror = () => {
      setError('WebSocket connection error');
    };

    socket.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      // Exponential backoff reconnect
      const attempts = reconnectAttemptsRef.current;
      const delay = Math.min(1000 * Math.pow(1.5, attempts), maxReconnectDelay);
      reconnectAttemptsRef.current += 1;

      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, delay);
    };
  }, []);

  const manualReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    isConnected,
    data,
    lastUpdated,
    error,
    reconnect: manualReconnect,
  };
}
