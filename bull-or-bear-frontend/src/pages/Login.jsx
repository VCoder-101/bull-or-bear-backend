import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

const Login = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();
  const [form, setForm]     = useState({ username: '', password: '' });
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const verified = location.state?.verified;

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Ошибка входа'); return; }
      await login(data);
      navigate('/home');
    } catch {
      setError('Ошибка сети. Запущен ли бэкенд?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Плавающие иконки */}
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
        <p className={styles.subtitle}>Войдите в аккаунт</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {verified && <div className={styles.hint}>Аккаунт подтверждён! Можете войти.</div>}
          {error    && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label}>Логин</label>
            <input
              className={styles.input}
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Введите логин"
              required
              autoFocus
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
              placeholder="Введите пароль"
              required
            />
          </div>

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <p className={styles.footer}>
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
