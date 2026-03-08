import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { COINS, SYMBOLS, formatPrice } from '../constants/coins';
import styles from './Assets.module.css';

function CoinCard({ symbol, onClick }) {
  const coin = COINS[symbol];
  const [price, setPrice]   = useState(null);
  const [change, setChange] = useState(null);

  useEffect(() => {
    api.get('/market/candles/', { params: { symbol, interval: '1m', limit: 2 } })
      .then(res => {
        const candles = res.data.candles;
        if (candles && candles.length >= 2) {
          const last = parseFloat(candles[candles.length - 1].close);
          const prev = parseFloat(candles[0].close);
          setPrice(last);
          setChange(prev > 0 ? ((last - prev) / prev) * 100 : 0);
        } else if (candles && candles.length === 1) {
          setPrice(parseFloat(candles[0].close));
          setChange(0);
        }
      })
      .catch(() => {});
  }, [symbol]);

  const positive = change !== null && change >= 0;

  return (
    <div className={styles.card} onClick={onClick} style={{ '--coin-color': coin.color }}>
      <div className={styles.cardTop}>
        <div className={styles.iconWrap}>
          <span className={styles.icon}>{coin.icon}</span>
        </div>
        <div className={styles.info}>
          <div className={styles.ticker}>{coin.ticker}</div>
          <div className={styles.name}>{coin.name}</div>
        </div>
      </div>

      <div className={styles.cardBottom}>
        <div className={styles.price}>
          ${price !== null ? formatPrice(price) : '—'}
        </div>
        <div className={`${styles.change} ${positive ? styles.pos : styles.neg}`}>
          {change !== null
            ? `${positive ? '+' : ''}${change.toFixed(2)}%`
            : '—'}
        </div>
      </div>

      <div className={styles.overlay}>Торговать →</div>
    </div>
  );
}

export default function Assets() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>◈ Активы</h2>
        <p className={styles.sub}>Выберите монету для торговли</p>
      </div>

      <div className={styles.grid}>
        {SYMBOLS.map(symbol => (
          <CoinCard
            key={symbol}
            symbol={symbol}
            onClick={() => navigate(`/trade/${symbol}`)}
          />
        ))}
      </div>
    </div>
  );
}
