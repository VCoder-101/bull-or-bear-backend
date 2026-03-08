import { useEffect, useState } from 'react';
import api from '../api/client';
import styles from './Quests.module.css';

const QUEST_ICONS = {
  first_bet_day: '⚡',
  bets_day_5:    '◆',
  wins_streak_3: '▲',
};

export default function Quests() {
  const [quests, setQuests]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/coins/quests/')
      .then(r => setQuests(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const done     = quests.filter(q => q.is_completed).length;
  const totalRew = quests.reduce((s, q) => s + q.reward, 0);
  const earnedRew = quests.filter(q => q.is_completed).reduce((s, q) => s + q.reward, 0);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}>◉ Задания</h2>
          <p className={styles.sub}>Выполняйте задания и получайте бонусные монеты</p>
        </div>
        {quests.length > 0 && (
          <div className={styles.summaryTag}>
            {done}/{quests.length} выполнено · {earnedRew}/{totalRew} ◈ получено
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : quests.length === 0 ? (
        <div className={styles.empty}>Заданий нет</div>
      ) : (
        <div className={styles.list}>
          {quests.map(q => {
            const pct = Math.min(100, (q.progress / q.target_value) * 100);
            return (
              <div key={q.id} className={`${styles.card} ${q.is_completed ? styles.done : ''}`}>
                <div className={styles.cardLeft}>
                  <div className={styles.icon}>
                    {QUEST_ICONS[q.quest_type] ?? '◉'}
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <span className={styles.questTitle}>{q.title}</span>
                    <span className={styles.reward}>+{q.reward} ◈</span>
                  </div>
                  <p className={styles.desc}>{q.description}</p>
                  <div className={styles.progressRow}>
                    <div className={styles.bar}>
                      <div className={styles.fill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.prog}>
                      {q.is_completed ? '✓ Выполнено' : `${q.progress} / ${q.target_value}`}
                    </span>
                  </div>
                </div>
                {q.is_completed && (
                  <div className={styles.checkBadge}>✓</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
