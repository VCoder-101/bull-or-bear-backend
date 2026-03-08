import { CandlestickSeries, createChart } from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import api from '../../api/client';
import styles from './PriceChart.module.css';

export default function PriceChart({ symbol, lastCandle, interval = '1m' }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);

  /* ── Создаём график один раз при монтировании ── */
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#1e1f38' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: { mode: 1 },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.07)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.07)',
      },
      handleScroll: {
        mouseWheel:       true,
        pressedMouseMove: true,
        horzTouchDrag:    true,
        vertTouchDrag:    false,
      },
      handleScale: {
        mouseWheel:             true,
        pinch:                  true,
        axisPressedMouseMove:   true,
      },
      width:  containerRef.current.clientWidth,
      height: 380,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor:       '#22c55e',
      downColor:     '#ef4444',
      borderVisible: false,
      wickUpColor:   '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current  = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current  = null;
      seriesRef.current = null;
    };
  }, []);

  /* ── Загружаем свечи при смене символа или интервала ── */
  useEffect(() => {
    if (!seriesRef.current || !symbol) return;

    api.get('/market/candles/', { params: { symbol, interval, limit: 200 } })
      .then(res => {
        const candles = res.data.candles.map(c => ({
          time:  c.time,
          open:  parseFloat(c.open),
          high:  parseFloat(c.high),
          low:   parseFloat(c.low),
          close: parseFloat(c.close),
        }));
        if (seriesRef.current) {
          seriesRef.current.setData(candles);
          chartRef.current?.timeScale().fitContent();
        }
      })
      .catch(err => console.error('Ошибка загрузки свечей:', err));
  }, [symbol, interval]);

  /* ── Реалтайм обновление последней свечи (только для 1m) ── */
  useEffect(() => {
    if (!seriesRef.current || !lastCandle || interval !== '1m') return;
    seriesRef.current.update({
      time:  lastCandle.time,
      open:  lastCandle.open,
      high:  lastCandle.high,
      low:   lastCandle.low,
      close: lastCandle.close,
    });
  }, [lastCandle, interval]);

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.chart} />
    </div>
  );
}
