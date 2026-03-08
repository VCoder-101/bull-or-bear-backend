import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import styles from './Profile.module.css';

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory]     = useState([]);
  const [bonusMsg, setBonusMsg]   = useState(null);
  const [bonusLoading, setBonusLoading] = useState(false);

  useEffect(() => {
    api.get('/bets/history/').then(r => setHistory(r.data)).catch(() => {});
  }, []);

  const won     = history.filter(b => b.status === 'won').length;
  const total   = history.length;
  const winRate = total > 0 ? Math.round((won / total) * 100) : 0;
  const profit  = history.reduce((s, b) => {
    if (b.status === 'won')  return s + (b.payout - b.amount);
    if (b.status === 'lost') return s - b.amount;
    return s;
  }, 0);

  async function claimBonus() {
    setBonusLoading(true);
    setBonusMsg(null);
    try {
      const res = await api.post('/coins/daily/');
      setBonusMsg({ type: 'success', text: `+${res.data.amount} монет! Баланс: ${res.data.balance} ◈` });
      refreshUser();
    } catch (e) {
      const secs = e.response?.data?.next_in_seconds;
      if (secs) {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        setBonusMsg({ type: 'info', text: `Уже получен. Следующий через ${h}ч ${m}м` });
      } else {
        setBonusMsg({ type: 'error', text: 'Ошибка' });
      }
    } finally {
      setBonusLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!user) return null;

  return (
    <div className={styles.page}>
      {/* Profile header */}
      <div className={styles.profileCard}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>{user.username[0].toUpperCase()}</div>
        </div>
        <div className={styles.profileInfo}>
          <h2 className={styles.username}>{user.username}</h2>
          <p className={styles.email}>{user.email}</p>
        </div>
        <div className={styles.profileRight}>
          <div className={styles.balance}>
            <div className={styles.balanceVal}>{(user.coins ?? 0).toLocaleString('ru-RU')} ◈</div>
            <div className={styles.balanceLabel}>баланс монет</div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>Выйти</button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statVal}>{total}</div>
          <div className={styles.statLabel}>Ставок</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statVal} ${styles.green}`}>{won}</div>
          <div className={styles.statLabel}>Побед</div>
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

      {/* Daily bonus */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>◆ Ежедневный бонус</h3>
        </div>
        <p className={styles.cardDesc}>Заходите каждый день и получайте +50 монет</p>
        {bonusMsg && (
          <div className={`${styles.msg} ${styles[bonusMsg.type]}`}>{bonusMsg.text}</div>
        )}
        <button className={styles.bonusBtn} onClick={claimBonus} disabled={bonusLoading}>
          {bonusLoading ? 'Получаем...' : 'Получить +50 ◈'}
        </button>
      </div>
    </div>
  );
}
