import { useEffect, useRef, useState } from 'react';
import api from '../../api/client';
import styles from './ActiveBets.module.css';

function Countdown({ createdAtTs, durationSec, onExpired }) {
  const endTs = createdAtTs + durationSec * 1000;
  const [remaining, setRemaining] = useState(Math.max(0, endTs - Date.now()));
  const firedRef = useRef(false);

  useEffect(() => {
    if (remaining <= 0) {
      if (!firedRef.current) { firedRef.current = true; onExpired?.(); }
      return;
    }
    const id = setInterval(() => {
      setRemaining(prev => {
        const next = Math.max(0, prev - 1000);
        if (next === 0 && !firedRef.current) {
          firedRef.current = true;
          setTimeout(() => onExpired?.(), 0);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  const total = Math.floor(remaining / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');

  return <span className={styles.countdown}>{m}:{s}</span>;
}

export default function ActiveBets({ refreshTrigger, onBetsResolved }) {
  const [bets, setBets] = useState([]);

  async function load() {
    try {
      const res = await api.get('/bets/active/');
      setBets(res.data);
    } catch { /* ignore */ }
  }

  useEffect(() => { load(); }, [refreshTrigger]);

  useEffect(() => {
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  async function handleExpired() {
    try { await api.post('/bets/resolve-expired/'); } catch { /* ignore */ }
    load();
    onBetsResolved?.();
  }

  if (!bets.length) return null;

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>⚡ Активные ставки</h4>
      <div className={styles.list}>
        {bets.map(bet => (
          <div key={bet.id} className={`${styles.bet} ${bet.direction === 'bull' ? styles.bullBet : styles.bearBet}`}>
            <span className={`${styles.dir} ${bet.direction === 'bull' ? styles.bull : styles.bear}`}>
              {bet.direction === 'bull' ? '↑ Bull' : '↓ Bear'}
            </span>
            <span className={styles.symbol}>{bet.symbol.replace('USDT', '')}</span>
            <span className={styles.amount}>{bet.amount} ◈</span>
            <Countdown
              createdAtTs={bet.created_at_ts}
              durationSec={bet.duration}
              onExpired={handleExpired}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
