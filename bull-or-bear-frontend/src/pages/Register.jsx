import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import styles from './auth.module.css';

const FLOAT_ICONS = [
  { char: '₿',  top: '8%',  left: '6%',  size: '72px', dur: '13s', delay: '0s'   },
  { char: 'Ξ',  top: '75%', left: '4%',  size: '56px', dur: '17s', delay: '2s'   },
  { char: '◎',  top: '40%', left: '88%', size: '64px', dur: '15s', delay: '1s'   },
  { char: 'Ð',  top: '85%', left: '82%', size: '52px', dur: '12s', delay: '3.5s' },
  { char: '₳',  top: '18%', left: '80%', size: '48px', dur: '18s', delay: '0.5s' },
  { char: 'B',  top: '60%', left: '92%', size: '44px', dur: '14s', delay: '4s'   },
  { char: 'X',  top: '5%',  left: '55%', size: '40px', dur: '16s', delay: '2.5s' },
  { char: '◈',  top: '90%', left: '45%', size: '60px', dur: '11s', delay: '1.5s' },
];

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ username: '', email: '', password: '' });
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/register/', form);
      navigate('/verify', { state: { email: form.email } });
    } catch (err) {
      const d = err.response?.data;
      setError(d?.email?.[0] || d?.username?.[0] || d?.password?.[0] || d?.detail || 'Ошибка регистрации.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
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
        <div className={styles.logo}><span className={styles.logoIcon}>◈</span></div>
        <h1 className={styles.title}>BullOrBear</h1>
        <p className={styles.subtitle}>Создайте аккаунт</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label}>Логин</label>
            <input
              className={styles.input}
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Придумайте логин"
              required
              autoFocus
            />
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
            <label className={styles.label}>Пароль</label>
            <input
              className={styles.input}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Минимум 8 символов"
              required
              minLength={8}
            />
          </div>

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? 'Регистрируем...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className={styles.footer}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
