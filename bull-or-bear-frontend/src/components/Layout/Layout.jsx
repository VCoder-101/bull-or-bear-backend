import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Ticker from '../Ticker/Ticker';
import styles from './Layout.module.css';

const NAV = [
  { to: '/home',        label: 'Главная',   icon: '⊞' },
  { to: '/active-bets', label: 'Ставки',    icon: '⚡' },
  { to: '/bonuses',     label: 'Бонусы',    icon: '◆' },
  { to: '/leaderboard', label: 'Лидерборд', icon: '▲' },
];

const Layout = () => {
  const { user } = useAuth();

  return (
    <div className={styles.wrapper}>
      <Ticker />

      <header className={styles.header}>
        <NavLink to="/home" className={styles.logo}>
          <span className={styles.logoEmoji}>🔷</span>
          <span className={styles.logoText}>kurs-kripto.ru</span>
        </NavLink>

        <nav className={styles.nav}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navActive : ''}`
              }
            >
              <span className={styles.navIcon}>{icon}</span>
              <span className={styles.navLabel}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.right}>
          {user && (
            <>
              <div className={styles.balance}>
                <span className={styles.balanceIcon}>◈</span>
                <span className={styles.balanceVal}>
                  {(user.coins ?? 0).toLocaleString('ru-RU')}
                </span>
              </div>
              <NavLink to="/profile" className={styles.profileBtn}>
                <div className={styles.avatar}>
                  {user.username?.[0]?.toUpperCase() ?? 'U'}
                </div>
              </NavLink>
            </>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
