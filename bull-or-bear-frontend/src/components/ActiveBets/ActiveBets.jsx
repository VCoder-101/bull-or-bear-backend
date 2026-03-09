import { useEffect, useRef, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
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
  const { refreshUser } = useAuth();
  const [bets, setBets] = useState([]);
  const prevCountRef = useRef(0);

  async function load() {
    try {
      const res = await api.get('/bets/active/');
      setBets(res.data);
    } catch { /* ignore */ }
  }

  useEffect(() => { load(); }, [refreshTrigger]);

  // Поллинг каждые 5 секунд
  useEffect(() => {
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  // Когда количество активных ставок уменьшилось — ставка разрешена, обновляем баланс
  useEffect(() => {
    if (prevCountRef.current > 0 && bets.length < prevCountRef.current) {
      refreshUser();
      onBetsResolved?.();
    }
    prevCountRef.current = bets.length;
  }, [bets.length]); // eslint-disable-line

  async function handleExpired() {
    // Вызываем fallback-разрешение (на случай если Celery не успел)
    try { await api.post('/bets/resolve-expired/'); } catch { /* ignore */ }
    load(); // следующий load обнаружит изменение и вызовет refreshUser через useEffect выше
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
