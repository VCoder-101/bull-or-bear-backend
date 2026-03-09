import { useEffect, useRef, useState } from 'react';

const WS_BASE_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;

/**
 * Хук для подключения к WebSocket потоку рыночных данных.
 * Возвращает последнюю свечу и текущую цену.
 */
export function useMarketWebSocket(symbol) {
  const [currentPrice, setCurrentPrice] = useState(null);
  const [lastCandle, setLastCandle] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    if (!symbol) return;

    let isCancelled = false;

    function connect() {
      if (isCancelled) return;

      const ws = new WebSocket(`${WS_BASE_URL}/ws/market/${symbol}/`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isCancelled) setConnected(true);
      };

      ws.onmessage = (event) => {
        if (isCancelled) return;
        const data = JSON.parse(event.data);
        setCurrentPrice(parseFloat(data.close));
        setLastCandle({
          time: data.time,
          open: parseFloat(data.open),
          high: parseFloat(data.high),
          low: parseFloat(data.low),
          close: parseFloat(data.close),
          volume: parseFloat(data.volume),
          isClosed: data.is_closed,
        });
      };

      ws.onclose = () => {
        if (isCancelled) return;
        setConnected(false);
        // Переподключение через 3 секунды
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      isCancelled = true;
      clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
      setConnected(false);
      setCurrentPrice(null);
      setLastCandle(null);
    };
  }, [symbol]);

  return { currentPrice, lastCandle, connected };
}
