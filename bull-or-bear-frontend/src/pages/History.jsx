import { useEffect, useState } from 'react';
import api from '../api/client';
import { COINS } from '../constants/coins';
import styles from './History.module.css';

const FILTERS = [
  { key: 'all',  label: 'Все' },
  { key: 'won',  label: 'Победы' },
  { key: 'lost', label: 'Поражения' },
  { key: 'draw', label: 'Ничьи' },
];

export default function History() {
  const [bets, setBets]     = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bets/history/')
      .then(r => setBets(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    const id = setInterval(() => {
      api.get('/bets/history/').then(r => setBets(r.data)).catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const won   = bets.filter(b => b.status === 'won').length;
  const lost  = bets.filter(b => b.status === 'lost').length;
  const draws = bets.filter(b => b.status === 'draw').length;
  const profit = bets.reduce((s, b) => {
    if (b.status === 'won')  return s + (b.payout - b.amount);
    if (b.status === 'lost') return s - b.amount;
    return s;
  }, 0);
  const winRate = bets.length > 0 ? Math.round((won / bets.length) * 100) : 0;

  const filtered = filter === 'all' ? bets : bets.filter(b => b.status === filter);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>◷ История ставок</h2>
        <p className={styles.sub}>Все завершённые ставки</p>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statVal}>{bets.length}</div>
          <div className={styles.statLabel}>Всего ставок</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statVal} ${styles.green}`}>{won}</div>
          <div className={styles.statLabel}>Победы</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statVal} ${styles.red}`}>{lost}</div>
          <div className={styles.statLabel}>Поражения</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statVal} ${styles.muted}`}>{draws}</div>
          <div className={styles.statLabel}>Ничьи</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statVal} ${winRate >= 50 ? styles.green : styles.red}`}>{winRate}%</div>
          <div className={styles.statLabel}>Винрейт</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statVal} ${profit >= 0 ? styles.green : styles.red}`}>
            {profit >= 0 ? '+' : ''}{profit.toLocaleString('ru-RU')} ◈
          </div>
          <div className={styles.statLabel}>Профит</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`${styles.filterBtn} ${filter === f.key ? styles.active : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>Нет завершённых ставок</div>
      ) : (
        <div className={styles.list}>
          {filtered.map(bet => {
            const coin = COINS[bet.symbol];
            const pnl = bet.status === 'won' ? bet.payout - bet.amount
                      : bet.status === 'lost' ? -bet.amount : 0;
            return (
              <div key={bet.id} className={`${styles.betRow} ${styles[bet.status]}`}>
                <span className={styles.ticker}>{coin?.ticker ?? bet.symbol}</span>
                <span className={`${styles.dir} ${bet.direction === 'bull' ? styles.bullText : styles.bearText}`}>
                  {bet.direction === 'bull' ? '↑ Bull' : '↓ Bear'}
                </span>
                <span className={styles.amount}>{bet.amount.toLocaleString('ru-RU')} ◈</span>
                <span className={`${styles.badge} ${styles[`badge_${bet.status}`]}`}>
                  {bet.status === 'won' ? 'WIN' : bet.status === 'lost' ? 'LOSE' : 'DRAW'}
                </span>
                <span className={`${styles.pnl} ${pnl > 0 ? styles.green : pnl < 0 ? styles.red : styles.muted}`}>
                  {pnl > 0 ? `+${pnl.toLocaleString('ru-RU')}` : pnl < 0 ? pnl.toLocaleString('ru-RU') : '±0'} ◈
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
