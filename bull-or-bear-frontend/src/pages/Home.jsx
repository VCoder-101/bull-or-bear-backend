import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { COINS, SYMBOLS, formatPrice } from '../constants/coins';
import { useAuth } from '../context/AuthContext';
import { useMarketWebSocket } from '../hooks/useMarketWebSocket';
import styles from './Home.module.css';

/* ── Одна карточка монеты — собственный WS-коннект ── */
function CoinCard({ symbol, isActive, onClick }) {
  const coin = COINS[symbol];
  const { currentPrice } = useMarketWebSocket(symbol);
  const [prevClose, setPrevClose] = useState(null);

  useEffect(() => {
    api.get('/market/candles/', { params: { symbol, interval: '1m', limit: 2 } })
      .then(res => {
        const c = res.data.candles;
        if (c?.length >= 2) setPrevClose(parseFloat(c[0].close));
        else if (c?.length === 1) setPrevClose(parseFloat(c[0].close));
      })
      .catch(() => {});
  }, [symbol]);

  const change = (currentPrice && prevClose && prevClose > 0)
    ? ((currentPrice - prevClose) / prevClose) * 100
    : null;
  const positive = change === null || change >= 0;

  return (
    <div
      className={`${styles.coinCard} ${isActive ? styles.coinActive : ''}`}
      onClick={onClick}
      style={{ '--coin-color': coin.color }}
    >
      <div className={styles.coinTop}>
        <div className={styles.coinIcon}>{coin.icon}</div>
        <div className={styles.coinInfo}>
          <div className={styles.coinTicker}>{coin.ticker}</div>
          <div className={styles.coinName}>{coin.name}</div>
        </div>
        <div className={`${styles.coinChange} ${positive ? styles.pos : styles.neg}`}>
          {change !== null
            ? `${positive ? '+' : ''}${change.toFixed(2)}%`
            : '—'}
        </div>
      </div>
      <div className={styles.coinPrice}>
        ${currentPrice !== null ? formatPrice(currentPrice) : '—'}
      </div>
      <div className={styles.coinHover}>Торговать →</div>
    </div>
  );
}

/* ── Вычисляем серию побед ── */
function calcStreak(history) {
  let streak = 0;
  for (const b of history) {
    if (b.status === 'won') streak++;
    else break;
  }
  return streak;
}

const HERO_FEATURES = [
  { icon: '📊', label: 'Реальные графики' },
  { icon: '💰', label: 'Ставки ×1.9' },
  { icon: '🏆', label: 'Соревнуйся с другими' },
];

const HOW_CARDS = [
  {
    icon: '📊',
    title: 'Следи за рынком',
    desc: 'Реальные графики криптовалют с биржи Binance в реальном времени',
  },
  {
    icon: '🎯',
    title: 'Делай прогнозы',
    desc: 'Выбери Bull (рост) или Bear (падение) и поставь монеты на исход',
  },
  {
    icon: '🏆',
    title: 'Соревнуйся',
    desc: 'Попади в топ лидерборда и выполняй задания для дополнительных бонусов',
  },
  {
    icon: '⚠️',
    title: 'Это игра',
    desc: 'Все монеты виртуальные. Никаких реальных денег. Только азарт и стратегия!',
  },
];

/* ── Главная страница ── */
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeBets, setActiveBets] = useState([]);
  const [history, setHistory]       = useState([]);
  const [quests, setQuests]         = useState([]);

  useEffect(() => {
    api.get('/bets/active/').then(r => setActiveBets(r.data)).catch(() => {});
    api.get('/bets/history/').then(r => setHistory(r.data)).catch(() => {});
    api.get('/coins/quests/').then(r => setQuests(r.data)).catch(() => {});
  }, []);

  const inBets  = activeBets.reduce((s, b) => s + b.amount, 0);
  const streak  = calcStreak(history);
  const recent  = history.slice(0, 5);

  return (
    <div className={styles.page}>

      {/* ── Hero-баннер ── */}
      <div className={styles.hero}>
        <div className={styles.heroMain}>
          <span className={styles.arrowBull}>↑</span>
          <h1 className={styles.heroTitle}>BullOrBear</h1>
          <span className={styles.arrowBear}>↓</span>
        </div>
        <p className={styles.heroDesc}>
          Делай прогнозы на криптовалюту. Угадай направление — заработай монеты!
        </p>
        <div className={styles.heroFeatures}>
          {HERO_FEATURES.map(f => (
            <div key={f.label} className={styles.heroFeatureCard}>
              <span className={styles.heroFeatureIcon}>{f.icon}</span>
              <span className={styles.heroFeatureLabel}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Карточки монет ── */}
      <section>
        <h2 className={styles.sectionTitle}>Рынок</h2>
        <div className={styles.coinsGrid}>
          {SYMBOLS.map(sym => (
            <CoinCard
              key={sym}
              symbol={sym}
              isActive={false}
              onClick={() => navigate(`/trade/${sym}`)}
            />
          ))}
        </div>
      </section>

      {/* ── Статистика ── */}
      <div className={styles.statsRow}>
        <div className={`${styles.statCard} ${styles.accentBorder}`}>
          <div className={styles.statLabel}>Баланс</div>
          <div className={styles.statVal}>{(user?.coins ?? 0).toLocaleString('ru-RU')} ◈</div>
          <div className={styles.statSub}>игровых монет</div>
        </div>
        <div className={`${styles.statCard} ${styles.goldBorder}`}>
          <div className={styles.statLabel}>В активных ставках</div>
          <div className={styles.statVal}>{inBets.toLocaleString('ru-RU')} ◈</div>
          <div className={styles.statSub}>{activeBets.length} ставок</div>
        </div>
        <div className={`${styles.statCard} ${streak >= 3 ? styles.greenBorder : ''}`}>
          <div className={styles.statLabel}>Серия побед</div>
          <div className={styles.statVal}>{streak}</div>
          <div className={styles.statSub}>{streak > 0 ? 'подряд 🔥' : 'начни серию!'}</div>
        </div>
      </div>

      {/* ── Два блока: активные ставки + задания ── */}
      <div className={styles.twoCol}>
        {/* Активные ставки */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>⚡ Активные ставки</span>
            <Link to="/active-bets" className={styles.seeAll}>Все →</Link>
          </div>
          {activeBets.length === 0 ? (
            <div className={styles.empty}>
              <p>Нет активных ставок</p>
              <span className={styles.emptyHint}>Выбери монету выше и сделай ставку</span>
            </div>
          ) : (
            <div className={styles.betList}>
              {activeBets.slice(0, 4).map(bet => {
                const coin = COINS[bet.symbol];
                return (
                  <div key={bet.id} className={`${styles.betItem} ${bet.direction === 'bull' ? styles.bullBet : styles.bearBet}`}>
                    <span className={`${styles.betDir} ${bet.direction === 'bull' ? styles.bull : styles.bear}`}>
                      {bet.direction === 'bull' ? '↑' : '↓'}
                    </span>
                    <span className={styles.betTicker}>{coin?.ticker ?? bet.symbol.replace('USDT', '')}</span>
                    <span className={styles.betAmt}>{bet.amount.toLocaleString('ru-RU')} ◈</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Задания */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>◉ Задания</span>
            <Link to="/bonuses" className={styles.seeAll}>Все →</Link>
          </div>
          {quests.length === 0 ? (
            <div className={styles.empty}><p>Нет активных заданий</p></div>
          ) : (
            <div className={styles.questList}>
              {quests.map(q => (
                <div key={q.id} className={`${styles.questItem} ${q.is_completed ? styles.questDone : ''}`}>
                  <div className={styles.questTop}>
                    <span className={styles.questTitle}>{q.title}</span>
                    <span className={styles.questReward}>+{q.reward} ◈</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${Math.min(100, (q.progress / q.target_value) * 100)}%` }}
                    />
                  </div>
                  <div className={styles.progressLabel}>
                    {q.is_completed ? '✓ Выполнено' : `${q.progress} / ${q.target_value}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Как это работает ── */}
      <div className={styles.howSection}>
        <h2 className={styles.howTitle}>Как это работает?</h2>
        <div className={styles.howGrid}>
          {HOW_CARDS.map(card => (
            <div key={card.icon} className={styles.howCard}>
              <div className={styles.howIcon}>{card.icon}</div>
              <div className={styles.howCardTitle}>{card.title}</div>
              <div className={styles.howCardDesc}>{card.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Последние транзакции ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>◷ Последние транзакции</span>
          <Link to="/leaderboard?tab=history" className={styles.seeAll}>Вся история →</Link>
        </div>
        {recent.length === 0 ? (
          <div className={styles.empty}><p>История пуста</p></div>
        ) : (
          <div className={styles.histList}>
            {recent.map(b => {
              const coin = COINS[b.symbol];
              const pnl  = b.status === 'won'  ? b.payout - b.amount
                         : b.status === 'lost' ? -b.amount : 0;
              return (
                <div key={b.id} className={styles.histRow}>
                  <span className={`${styles.histDir} ${b.direction === 'bull' ? styles.bull : styles.bear}`}>
                    {b.direction === 'bull' ? '↑' : '↓'}
                  </span>
                  <span className={styles.histTicker}>{coin?.ticker ?? b.symbol.replace('USDT', '')}</span>
                  <span className={styles.histAmt}>{b.amount} ◈</span>
                  <span className={`${styles.histBadge} ${styles[`badge_${b.status}`]}`}>
                    {b.status === 'won' ? 'WIN' : b.status === 'lost' ? 'LOSE' : 'DRAW'}
                  </span>
                  <span className={`${styles.histPnl} ${pnl > 0 ? styles.bull : pnl < 0 ? styles.bear : styles.muted}`}>
                    {pnl > 0 ? `+${pnl}` : pnl < 0 ? pnl : '±0'} ◈
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
