import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import rStyles from './Rewards.module.css';
import qStyles from './Quests.module.css';
import styles from './Bonuses.module.css';

/* ════════ Награды ════════ */

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

function RewardsSection() {
  const { refreshUser } = useAuth();
  const [msg, setMsg]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);

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
    <>
      {/* Ежедневная */}
      <div className={rStyles.card}>
        <h3 className={rStyles.cardTitle}>Ежедневная награда</h3>
        <p className={rStyles.cardDesc}>
          Заходите каждый день и получайте монеты. Серия входов увеличивает бонус!
        </p>

        <div className={rStyles.weekRow}>
          {DAYS.map((day, i) => (
            <div
              key={day}
              className={`${rStyles.dayCell} ${i < todayIdx ? rStyles.dayDone : ''} ${i === todayIdx ? rStyles.dayToday : ''}`}
            >
              <div className={rStyles.dayLabel}>{day}</div>
              <div className={rStyles.dayIcon}>{i < todayIdx ? '✓' : i === todayIdx ? '★' : '·'}</div>
            </div>
          ))}
        </div>

        {msg && (
          <div className={`${rStyles.msg} ${rStyles[msg.type]}`}>{msg.text}</div>
        )}

        <button
          className={`${rStyles.claimBtn} ${claimed ? rStyles.claimDone : ''}`}
          onClick={claimBonus}
          disabled={loading || claimed}
        >
          {loading ? 'Получаем...' : claimed ? 'Уже получено ✓' : 'Получить +50 ◈'}
        </button>
      </div>

      {/* Серия входов */}
      <div className={rStyles.card}>
        <h3 className={rStyles.cardTitle}>Бонусы за серию входов</h3>
        <p className={rStyles.cardDesc}>Чем дольше серия ежедневных входов, тем больше награда</p>

        <div className={rStyles.streakGrid}>
          {STREAK_REWARDS.map((r, i) => (
            <div
              key={r.days}
              className={`${rStyles.streakCell} ${i <= todayIdx ? rStyles.streakDone : ''}`}
            >
              <div className={rStyles.streakDay}>{r.label}</div>
              <div className={rStyles.streakAmount}>+{r.amount} ◈</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ════════ Задания ════════ */

const QUEST_ICONS = {
  first_bet_day: '⚡',
  bets_day_5:    '◆',
  wins_streak_3: '▲',
};

function QuestsSection() {
  const [quests, setQuests]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/coins/quests/')
      .then(r => setQuests(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const done      = quests.filter(q => q.is_completed).length;
  const totalRew  = quests.reduce((s, q) => s + q.reward, 0);
  const earnedRew = quests.filter(q => q.is_completed).reduce((s, q) => s + q.reward, 0);

  return (
    <div className={styles.questsBlock}>
      <div className={styles.questsHeader}>
        <div>
          <h3 className={styles.blockTitle}>◉ Задания</h3>
          <p className={styles.blockSub}>Выполняйте задания и получайте бонусные монеты</p>
        </div>
        {quests.length > 0 && (
          <div className={qStyles.summaryTag}>
            {done}/{quests.length} выполнено · {earnedRew}/{totalRew} ◈
          </div>
        )}
      </div>

      {loading ? (
        <div className={qStyles.loading}>Загрузка...</div>
      ) : quests.length === 0 ? (
        <div className={qStyles.empty}>Заданий нет</div>
      ) : (
        <div className={qStyles.list}>
          {quests.map(q => {
            const pct = Math.min(100, (q.progress / q.target_value) * 100);
            return (
              <div key={q.id} className={`${qStyles.card} ${q.is_completed ? qStyles.done : ''}`}>
                <div className={qStyles.cardLeft}>
                  <div className={qStyles.icon}>{QUEST_ICONS[q.quest_type] ?? '◉'}</div>
                </div>
                <div className={qStyles.cardBody}>
                  <div className={qStyles.cardTop}>
                    <span className={qStyles.questTitle}>{q.title}</span>
                    <span className={qStyles.reward}>+{q.reward} ◈</span>
                  </div>
                  <p className={qStyles.desc}>{q.description}</p>
                  <div className={qStyles.progressRow}>
                    <div className={qStyles.bar}>
                      <div className={qStyles.fill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={qStyles.prog}>
                      {q.is_completed ? '✓ Выполнено' : `${q.progress} / ${q.target_value}`}
                    </span>
                  </div>
                </div>
                {q.is_completed && (
                  <div className={qStyles.checkBadge}>✓</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════ Главная страница ════════ */

export default function Bonuses() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>◆ Бонусы</h2>
        <p className={styles.sub}>Ежедневные награды и задания</p>
      </div>

      <RewardsSection />
      <QuestsSection />
    </div>
  );
}
