import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { COINS } from '../constants/coins';
import styles from './ActiveBetsPage.module.css';

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
  const pct = Math.max(0, Math.min(100, (remaining / (durationSec * 1000)) * 100));

  return (
    <div className={styles.timerWrap}>
      <span className={styles.timer}>{m}:{s}</span>
      <div className={styles.timerBar}>
        <div className={styles.timerFill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ActiveBetsPage() {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get('/bets/active/');
      setBets(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  async function handleExpired() {
    try { await api.post('/bets/resolve-expired/'); } catch { /* ignore */ }
    load();
  }

  const inBets = bets.reduce((s, b) => s + b.amount, 0);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}>⚡ Активные ставки</h2>
          <p className={styles.sub}>Ставки ожидающие результата</p>
        </div>
        {bets.length > 0 && (
          <div className={styles.summaryTag}>
            {bets.length} ставок · {inBets.toLocaleString('ru-RU')} ◈ в игре
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : bets.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⚡</div>
          <p>Нет активных ставок</p>
          <Link to="/assets" className={styles.ctaBtn}>Сделать ставку →</Link>
        </div>
      ) : (
        <div className={styles.list}>
          {bets.map(bet => {
            const coin = COINS[bet.symbol];
            const payout = Math.floor(bet.amount * 1.9);
            return (
              <div key={bet.id} className={`${styles.betCard} ${bet.direction === 'bull' ? styles.bullCard : styles.bearCard}`}>
                <div className={styles.betLeft}>
                  <div className={styles.betCoin}>
                    <span className={styles.betTicker}>{coin?.ticker ?? bet.symbol}</span>
                    <span className={styles.betName}>{coin?.name ?? ''}</span>
                  </div>
                  <div className={`${styles.betDir} ${bet.direction === 'bull' ? styles.bull : styles.bear}`}>
                    {bet.direction === 'bull' ? '↑ Bull' : '↓ Bear'}
                  </div>
                </div>

                <div className={styles.betMid}>
                  <div className={styles.betAmountLabel}>Ставка</div>
                  <div className={styles.betAmount}>{bet.amount.toLocaleString('ru-RU')} ◈</div>
                  <div className={styles.betPayoutLabel}>Выигрыш</div>
                  <div className={styles.betPayout}>{payout.toLocaleString('ru-RU')} ◈</div>
                </div>

                <div className={styles.betRight}>
                  <Countdown
                    createdAtTs={bet.created_at_ts}
                    durationSec={bet.duration}
                    onExpired={handleExpired}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
