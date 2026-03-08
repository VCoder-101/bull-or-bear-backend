import { useEffect, useState } from 'react';
import api from '../../api/client';
import styles from './CryptoSelector.module.css';

// Красивые имена для символов
const SYMBOL_LABELS = {
  BTCUSDT: 'BTC',
  ETHUSDT: 'ETH',
  BNBUSDT: 'BNB',
  SOLUSDT: 'SOL',
  XRPUSDT: 'XRP',
  DOGEUSDT: 'DOGE',
  ADAUSDT: 'ADA',
  AVAXUSDT: 'AVAX',
};

export default function CryptoSelector({ selected, onSelect, currentPrice }) {
  const [symbols, setSymbols] = useState([]);

  useEffect(() => {
    api.get('/market/symbols/')
      .then(res => setSymbols(res.data.symbols))
      .catch(() => setSymbols(Object.keys(SYMBOL_LABELS)));
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.buttons}>
        {symbols.map(symbol => (
          <button
            key={symbol}
            className={`${styles.btn} ${selected === symbol ? styles.active : ''}`}
            onClick={() => onSelect(symbol)}
          >
            {SYMBOL_LABELS[symbol] || symbol}
          </button>
        ))}
      </div>
      {currentPrice !== null && (
        <div className={styles.price}>
          <span className={styles.priceLabel}>{SYMBOL_LABELS[selected] || selected}</span>
          <span className={styles.priceValue}>
            ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}
