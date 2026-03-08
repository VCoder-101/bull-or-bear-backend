import { useEffect, useState } from 'react';
import api from '../api/client';
import { COINS } from '../constants/coins';
import { useAuth } from '../context/AuthContext';
import styles from './Leaderboard.module.css';

const MEDALS = ['🥇', '🥈', '🥉'];

/* ════════════════════════════════════════════
   ЛЕВАЯ КОЛОНКА: Моя история
════════════════════════════════════════════ */
const HIST_FILTERS = [
  { key: 'all',  label: 'Все' },
  { key: 'won',  label: 'Победы' },
  { key: 'lost', label: 'Поражения' },
  { key: 'draw', label: 'Ничьи' },
];

function HistoryCol() {
  const [bets, setBets]       = useState([]);
  const [filter, setFilter]   = useState('all');
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

  const won     = bets.filter(b => b.status === 'won').length;
  const lost    = bets.filter(b => b.status === 'lost').length;
  const draws   = bets.filter(b => b.status === 'draw').length;
  const profit  = bets.reduce((s, b) => {
    if (b.status === 'won')  return s + (b.payout - b.amount);
    if (b.status === 'lost') return s - b.amount;
    return s;
  }, 0);
  const winRate = bets.length > 0 ? Math.round((won / bets.length) * 100) : 0;

  const filtered = filter === 'all' ? bets : bets.filter(b => b.status === filter);

  return (
    <div className={styles.historyCol}>
      <h2 className={styles.colTitle}>◷ Моя история</h2>

      {/* Статистика */}
      <div className={styles.histStats}>
        <div className={styles.hStat}>
          <div className={styles.hStatVal}>{bets.length}</div>
          <div className={styles.hStatLabel}>Всего</div>
        </div>
        <div className={styles.hStat}>
          <div className={`${styles.hStatVal} ${styles.green}`}>{won}</div>
          <div className={styles.hStatLabel}>Победы</div>
        </div>
        <div className={styles.hStat}>
          <div className={`${styles.hStatVal} ${styles.red}`}>{lost}</div>
          <div className={styles.hStatLabel}>Поражения</div>
        </div>
        <div className={styles.hStat}>
          <div className={`${styles.hStatVal} ${styles.muted}`}>{draws}</div>
          <div className={styles.hStatLabel}>Ничьи</div>
        </div>
        <div className={styles.hStat}>
          <div className={`${styles.hStatVal} ${winRate >= 50 ? styles.green : styles.red}`}>{winRate}%</div>
          <div className={styles.hStatLabel}>Винрейт</div>
        </div>
        <div className={styles.hStat}>
          <div className={`${styles.hStatVal} ${profit >= 0 ? styles.green : styles.red}`}>
            {profit >= 0 ? '+' : ''}{profit.toLocaleString('ru-RU')} ◈
          </div>
          <div className={styles.hStatLabel}>Профит</div>
        </div>
      </div>

      {/* Фильтры */}
      <div className={styles.filters}>
        {HIST_FILTERS.map(f => (
          <button
            key={f.key}
            className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Список */}
      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>Нет ставок</div>
      ) : (
        <div className={styles.histList}>
          {filtered.map(bet => {
            const coin = COINS[bet.symbol];
            const pnl  = bet.status === 'won'  ? bet.payout - bet.amount
                       : bet.status === 'lost' ? -bet.amount : 0;
            return (
              <div key={bet.id} className={`${styles.histRow} ${styles[bet.status]}`}>
                <span className={styles.histTicker}>{coin?.ticker ?? bet.symbol.replace('USDT','')}</span>
                <span className={`${styles.histDir} ${bet.direction === 'bull' ? styles.green : styles.red}`}>
                  {bet.direction === 'bull' ? '↑ Bull' : '↓ Bear'}
                </span>
                <span className={styles.histAmt}>{bet.amount.toLocaleString('ru-RU')} ◈</span>
                <span className={`${styles.badge} ${styles[`badge_${bet.status}`]}`}>
                  {bet.status === 'won' ? 'WIN' : bet.status === 'lost' ? 'LOSE' : 'DRAW'}
                </span>
                <span className={`${styles.histPnl} ${pnl > 0 ? styles.green : pnl < 0 ? styles.red : styles.muted}`}>
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

/* ════════════════════════════════════════════
   ПРАВАЯ КОЛОНКА: Лидерборд
════════════════════════════════════════════ */
function LeaderboardCol({ user }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaderboard/')
      .then(r => setRows(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.leaderCol}><div className={styles.loading}>Загрузка...</div></div>;

  return (
    <div className={styles.leaderCol}>
      <h2 className={styles.colTitle}>▲ Лидерборд</h2>

      {/* Подиум топ-3 */}
      {rows.length >= 3 && (
        <div className={styles.podium}>
          {[rows[1], rows[0], rows[2]].map((row, i) => {
            const pos = [2, 1, 3][i];
            return (
              <div key={row.rank} className={`${styles.podiumItem} ${styles[`pos${pos}`]}`}>
                <div className={styles.podiumMedal}>{MEDALS[row.rank - 1]}</div>
                <div className={styles.podiumAvatar}>
                  {row.username[0].toUpperCase()}
                </div>
                <div className={styles.podiumName}>{row.username}</div>
                <div className={styles.podiumCoins}>{row.coins.toLocaleString('ru-RU')} ◈</div>
                <div className={styles.podiumWinrate}>{row.win_rate}% win</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Таблица */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>#</th>
              <th className={styles.th}>Игрок</th>
              <th className={styles.th}>Баланс</th>
              <th className={styles.th}>Ставок</th>
              <th className={styles.th}>Винрейт</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.rank}
                className={`${styles.tr}
                  ${row.rank <= 3 ? styles.topRow : ''}
                  ${row.username === user?.username ? styles.myRow : ''}`}
              >
                <td className={styles.rankCell}>
                  {row.rank <= 3
                    ? MEDALS[row.rank - 1]
                    : <span className={styles.rankNum}>{row.rank}</span>}
                </td>
                <td className={styles.nameCell}>
                  <div className={styles.nameInner}>
                    <span className={styles.nameText}>{row.username}</span>
                    {row.username === user?.username && (
                      <span className={styles.youTag}>Вы</span>
                    )}
                  </div>
                </td>
                <td className={styles.td}>
                  <span className={styles.mono}>{row.coins.toLocaleString('ru-RU')}</span>
                  <span className={styles.coinIcon}> ◈</span>
                </td>
                <td className={styles.td}>{row.total_bets}</td>
                <td className={styles.td}>
                  <span className={`${styles.wr} ${row.win_rate >= 50 ? styles.green : styles.red}`}>
                    {row.win_rate}%
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className={styles.empty}>Пока никого нет</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Главный компонент
════════════════════════════════════════════ */
export default function Leaderboard() {
  const { user } = useAuth();

  return (
    <div className={styles.page}>
      <HistoryCol />
      <LeaderboardCol user={user} />
    </div>
  );
}
