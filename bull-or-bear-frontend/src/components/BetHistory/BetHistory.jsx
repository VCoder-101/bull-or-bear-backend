import { useEffect, useState } from 'react';
import api from '../../api/client';
import { COINS } from '../../constants/coins';
import styles from './BetHistory.module.css';

const STATUS_LABELS = { won: 'Победа', lost: 'Поражение', draw: 'Ничья' };

export default function BetHistory({ refreshTrigger }) {
  const [bets, setBets] = useState([]);

  function load() {
    api.get('/bets/history/').then(res => setBets(res.data)).catch(() => {});
  }

  useEffect(() => { load(); }, [refreshTrigger]);

  useEffect(() => {
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>◷ История ставок</h4>
      {!bets.length ? (
        <p className={styles.empty}>Нет завершённых ставок</p>
      ) : (
        <div className={styles.list}>
          {bets.map(bet => {
            const coin = COINS[bet.symbol];
            return (
              <div key={bet.id} className={`${styles.bet} ${styles[bet.status]}`}>
                <span className={`${styles.dir} ${bet.direction === 'bull' ? styles.bull : styles.bear}`}>
                  {bet.direction === 'bull' ? '↑' : '↓'}
                </span>
                <span className={styles.symbol}>{coin?.ticker ?? bet.symbol.replace('USDT', '')}</span>
                <span className={styles.amount}>{bet.amount} ◈</span>
                <span className={styles.statusLabel}>{STATUS_LABELS[bet.status]}</span>
                <span className={styles.payout}>
                  {bet.status === 'won'  && `+${bet.payout}`}
                  {bet.status === 'lost' && `−${bet.amount}`}
                  {bet.status === 'draw' && `±0`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
