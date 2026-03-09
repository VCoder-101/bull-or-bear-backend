import { useEffect, useState } from 'react';
import styles from './Ticker.module.css';

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT'];
const LABELS  = { BTCUSDT: 'BTC', ETHUSDT: 'ETH', BNBUSDT: 'BNB', SOLUSDT: 'SOL', XRPUSDT: 'XRP', DOGEUSDT: 'DOGE' };

const Ticker = () => {
  const [prices, setPrices] = useState([]);

  useEffect(() => {
    const symbolsParam = JSON.stringify(SYMBOLS);
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`;

    const fetch_ = async () => {
      try {
        const res  = await fetch(url);
        const data = await res.json();
        setPrices(data.map(d => ({
          symbol: d.symbol,
          price:  parseFloat(d.lastPrice),
          change: parseFloat(d.priceChangePercent),
        })));
      } catch { /* keep previous */ }
    };

    fetch_();
    const id = setInterval(fetch_, 15000);
    return () => clearInterval(id);
  }, []);

  if (!prices.length) return <div className={styles.bar} />;

  const items = [...prices, ...prices];

  return (
    <div className={styles.bar}>
      <div className={styles.track}>
        {items.map((p, i) => (
          <span key={i} className={styles.item}>
            <span className={styles.sym}>{LABELS[p.symbol]}</span>
            <span className={styles.price}>
              ${p.price.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: p.price >= 1 ? 2 : 4,
              })}
            </span>
            <span className={p.change >= 0 ? styles.up : styles.down}>
              {p.change >= 0 ? '+' : ''}{p.change.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default Ticker;
