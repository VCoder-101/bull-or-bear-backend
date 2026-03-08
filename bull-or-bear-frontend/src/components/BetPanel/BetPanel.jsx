import { useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import styles from './BetPanel.module.css';

const DURATIONS = [
  { value: 5,    label: '5с' },
  { value: 10,   label: '10с' },
  { value: 60,   label: '1м' },
  { value: 600,  label: '10м' },
  { value: 3600, label: '1ч' },
];

export default function BetPanel({ symbol, currentPrice, onBetPlaced }) {
  const { user, refreshUser } = useAuth();
  const [direction, setDirection] = useState(null);
  const [amount, setAmount]     = useState('');
  const [duration, setDuration] = useState(60);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);

  const balance      = user?.coins ?? 0;
  const parsedAmount = parseInt(amount) || 0;
  const payout       = Math.floor(parsedAmount * 1.9);
  const amountEmpty  = amount === '';
  const amountTooLow = !amountEmpty && parsedAmount < 10;

  async function handleSubmit() {
    if (!direction) { setError('Выберите направление'); return; }
    setLoading(true); setError(null); setSuccess(null);
    try {
      await api.post('/bets/create/', { symbol, direction, amount: parsedAmount, duration });
      setSuccess(`Ставка ${parsedAmount} ◈ поставлена!`);
      setDirection(null);
      setAmount('');
      refreshUser();
      if (onBetPlaced) onBetPlaced();
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка создания ставки');
    } finally {
      setLoading(false);
    }
  }

  const submitClass = `${styles.submitBtn} ${
    direction === 'bull' ? styles.submitBull : direction === 'bear' ? styles.submitBear : styles.submitDefault
  }`;

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>Сделать ставку</h3>

      {/* Current price */}
      {currentPrice !== null && (
        <div className={styles.priceLine}>
          <span className={styles.priceLabel}>{symbol}</span>
          <span className={styles.priceVal}>
            ${parseFloat(currentPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Direction */}
      <div className={styles.field}>
        <label className={styles.label}>Направление</label>
        <div className={styles.directions}>
          <button
            className={`${styles.dirBtn} ${styles.bullBtn} ${direction === 'bull' ? styles.bullActive : ''}`}
            onClick={() => { setDirection('bull'); setError(null); setSuccess(null); }}
          >
            ↑ Bull
          </button>
          <button
            className={`${styles.dirBtn} ${styles.bearBtn} ${direction === 'bear' ? styles.bearActive : ''}`}
            onClick={() => { setDirection('bear'); setError(null); setSuccess(null); }}
          >
            ↓ Bear
          </button>
        </div>
      </div>

      {/* Duration */}
      <div className={styles.field}>
        <label className={styles.label}>Таймер</label>
        <div className={styles.durations}>
          {DURATIONS.map(d => (
            <button
              key={d.value}
              className={`${styles.durBtn} ${duration === d.value ? styles.durActive : ''}`}
              onClick={() => setDuration(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div className={styles.field}>
        <label className={styles.label}>Сумма</label>
        <div className={styles.amountRow}>
          <input
            type="number"
            step={10}
            min={1}
            value={amount}
            placeholder="Введите сумму"
            onChange={e => {
              const v = e.target.value;
              setAmount(v === '' ? '' : parseInt(v) || '');
            }}
            className={styles.amountInput}
          />
          <button
            className={styles.maxBtn}
            onClick={() => setAmount(String(balance))}
            disabled={balance <= 0}
          >
            Макс
          </button>
        </div>
        <div className={styles.quickAmounts}>
          {[50, 100, 500].map(v => (
            <button key={v} className={styles.quickBtn} onClick={() => setAmount(String(v))}>
              {v}
            </button>
          ))}
        </div>
        {amountTooLow && (
          <div className={styles.amountErr}>Минимальная ставка: 10 монет</div>
        )}
      </div>

      {/* Balance & payout info */}
      <div className={styles.infoBlock}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Доступно</span>
          <span className={styles.infoVal}>{balance.toLocaleString('ru-RU')} ◈</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Выигрыш при победе</span>
          <span className={`${styles.infoVal} ${styles.payoutVal}`}>{payout.toLocaleString('ru-RU')} ◈</span>
        </div>
      </div>

      {/* Messages */}
      {error   && <div className={styles.errorMsg}>{error}</div>}
      {success && <div className={styles.successMsg}>{success}</div>}

      {/* Submit */}
      <button
        className={submitClass}
        onClick={handleSubmit}
        disabled={loading || !direction || amountEmpty || amountTooLow}
      >
        {loading ? 'Ставим...' : `Поставить${parsedAmount > 0 ? ` ${parsedAmount} ◈` : ''}`}
      </button>
    </div>
  );
}
