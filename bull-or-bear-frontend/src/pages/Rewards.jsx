import { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import styles from './Rewards.module.css';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const STREAK_REWARDS = [
  { days: 1, amount: 50,  label: 'День 1' },
  { days: 2, amount: 60,  label: 'День 2' },
  { days: 3, amount: 80,  label: 'День 3' },
  { days: 4, amount: 100, label: 'День 4' },
  { days: 5, amount: 130, label: 'День 5' },
  { days: 6, amount: 160, label: 'День 6' },
  { days: 7, amount: 200, label: 'День 7 🔥' },
];

export default function Rewards() {
  const { refreshUser } = useAuth();
  const [msg, setMsg]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);

  // Определяем текущий день недели (0 = Пн)
  const todayIdx = (new Date().getDay() + 6) % 7;

  async function claimBonus() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.post('/coins/daily/');
      setMsg({ type: 'success', text: `+${res.data.amount} монет! Баланс: ${res.data.balance} ◈` });
      setClaimed(true);
      refreshUser();
    } catch (e) {
      const secs = e.response?.data?.next_in_seconds;
      if (secs) {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        setMsg({ type: 'info', text: `Уже получен. Следующий через ${h}ч ${m}м` });
        setClaimed(true);
      } else {
        setMsg({ type: 'error', text: 'Ошибка получения бонуса' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>◆ Награды</h2>
        <p className={styles.sub}>Заходи каждый день и получай монеты</p>
      </div>

      {/* Daily calendar */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Ежедневная награда</h3>
        <p className={styles.cardDesc}>
          Заходите каждый день и получайте монеты. Серия входов увеличивает бонус!
        </p>

        <div className={styles.weekRow}>
          {DAYS.map((day, i) => (
            <div
              key={day}
              className={`${styles.dayCell} ${i < todayIdx ? styles.dayDone : ''} ${i === todayIdx ? styles.dayToday : ''}`}
            >
              <div className={styles.dayLabel}>{day}</div>
              <div className={styles.dayIcon}>{i < todayIdx ? '✓' : i === todayIdx ? '★' : '·'}</div>
            </div>
          ))}
        </div>

        {msg && (
          <div className={`${styles.msg} ${styles[msg.type]}`}>{msg.text}</div>
        )}

        <button
          className={`${styles.claimBtn} ${claimed ? styles.claimDone : ''}`}
          onClick={claimBonus}
          disabled={loading || claimed}
        >
          {loading ? 'Получаем...' : claimed ? 'Уже получено ✓' : 'Получить +50 ◈'}
        </button>
      </div>

      {/* Streak rewards */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Бонусы за серию входов</h3>
        <p className={styles.cardDesc}>Чем дольше серия ежедневных входов, тем больше награда</p>

        <div className={styles.streakGrid}>
          {STREAK_REWARDS.map((r, i) => (
            <div
              key={r.days}
              className={`${styles.streakCell} ${i <= todayIdx ? styles.streakDone : ''}`}
            >
              <div className={styles.streakDay}>{r.label}</div>
              <div className={styles.streakAmount}>+{r.amount} ◈</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
