import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ActiveBets from '../components/ActiveBets/ActiveBets';
import BetPanel from '../components/BetPanel/BetPanel';
import PriceChart from '../components/PriceChart/PriceChart';
import { COINS, formatPrice } from '../constants/coins';
import { useMarketWebSocket } from '../hooks/useMarketWebSocket';
import styles from './Trade.module.css';

const TIMEFRAMES = [
  { label: '1м',  value: '1m' },
  { label: '15м', value: '15m' },
  { label: '1ч',  value: '1h' },
  { label: '1д',  value: '1d' },
];

export default function Trade() {
  const { symbol } = useParams();
  const [interval, setInterval]   = useState('15m');
  const [betRefresh, setBetRefresh] = useState(0);
  const { currentPrice, lastCandle, connected } = useMarketWebSocket(symbol);

  const coin = COINS[symbol] ?? {
    name: symbol, ticker: symbol?.replace('USDT', ''), color: '#818cf8', icon: '?',
  };

  return (
    <div className={styles.page}>

      {/* ── Шапка ── */}
      <div className={styles.pageHeader}>
        <Link to="/home" className={styles.back}>← Назад</Link>

        <div className={styles.coinInfo}>
          <div className={styles.iconWrap} style={{ '--c': coin.color }}>
            <span className={styles.coinIcon}>{coin.icon}</span>
          </div>
          <div>
            <div className={styles.pairName}>{coin.ticker} / USDT</div>
            <div className={styles.coinName}>{coin.name}</div>
          </div>
        </div>

        <div className={styles.priceBlock}>
          <span className={styles.currentPrice}>
            ${currentPrice !== null ? formatPrice(currentPrice) : '—'}
          </span>
          <span className={`${styles.liveTag} ${connected ? styles.online : styles.offline}`}>
            {connected ? '● Live' : '○ Reconnect'}
          </span>
        </div>
      </div>

      {/* ── Контент ── */}
      <div className={styles.content}>

        {/* График */}
        <div className={styles.chartCol}>
          {/* Переключатель таймфреймов */}
          <div className={styles.tfRow}>
            <span className={styles.tfLabel}>Интервал</span>
            <div className={styles.tfBtns}>
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf.value}
                  className={`${styles.tfBtn} ${interval === tf.value ? styles.tfActive : ''}`}
                  onClick={() => setInterval(tf.value)}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <PriceChart symbol={symbol} lastCandle={lastCandle} interval={interval} />
          <ActiveBets
            refreshTrigger={betRefresh}
            onBetsResolved={() => setBetRefresh(n => n + 1)}
          />
        </div>

        {/* Панель ставок */}
        <div className={styles.sideCol}>
          <BetPanel
            symbol={symbol}
            currentPrice={currentPrice}
            onBetPlaced={() => setBetRefresh(n => n + 1)}
          />
        </div>
      </div>
    </div>
  );
}
