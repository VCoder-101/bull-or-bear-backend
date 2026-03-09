import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Ticker from '../components/Ticker/Ticker';
import styles from './auth.module.css';

const FLOAT_ICONS = [
  { char: '₿',  top: '8%',  left: '6%',  size: '72px', dur: '13s', delay: '0s'   },
  { char: 'Ξ',  top: '75%', left: '4%',  size: '56px', dur: '17s', delay: '2s'   },
  { char: '◎',  top: '40%', left: '88%', size: '64px', dur: '15s', delay: '1s'   },
  { char: 'Ð',  top: '85%', left: '82%', size: '52px', dur: '12s', delay: '3.5s' },
  { char: '₳',  top: '18%', left: '80%', size: '48px', dur: '18s', delay: '0.5s' },
  { char: '◈',  top: '90%', left: '45%', size: '60px', dur: '11s', delay: '1.5s' },
];

const Verify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm]     = useState({ email: location.state?.email || '', code: '' });
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/verify/', form);
      navigate('/login', { state: { verified: true } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка подтверждения.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.tickerRow}><Ticker /></div>

      {FLOAT_ICONS.map((ic, i) => (
        <span
          key={i}
          className={styles.floatIcon}
          style={{ top: ic.top, left: ic.left, fontSize: ic.size, '--dur': ic.dur, '--delay': ic.delay }}
        >
          {ic.char}
        </span>
      ))}

      <div className={styles.card}>
        <div className={styles.logo}><span className={styles.logoIcon}>🔷</span></div>
        <h1 className={styles.title}>Подтверждение</h1>
        <p className={styles.subtitle}>Введите код из письма</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.hint}>
            Используйте код <strong>4444</strong>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Код подтверждения</label>
            <input
              className={styles.input}
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="4444"
              required
              autoFocus={!form.email}
            />
          </div>

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? 'Проверяем...' : 'Подтвердить'}
          </button>
        </form>

        <p className={styles.footer}>
          <Link to="/login">← Вернуться ко входу</Link>
        </p>
      </div>
    </div>
  );
};

export default Verify;
