import { useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Ticker from '../components/Ticker/Ticker';
import styles from './Landing.module.css';

// ─── Animated background canvas ───────────────────────────────────────────────
function AnimatedBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let w, h;

    // Floating particles
    const particles = Array.from({ length: 60 }, () => ({
      x:    Math.random() * window.innerWidth,
      y:    Math.random() * window.innerHeight,
      r:    Math.random() * 1.5 + 0.5,
      dx:   (Math.random() - 0.5) * 0.3,
      dy:   (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    // Fake chart line points
    const chartPoints = Array.from({ length: 80 }, (_, i) => ({
      x: (i / 79),
      y: 0.5 + Math.sin(i * 0.3) * 0.1 + (Math.random() - 0.5) * 0.05,
    }));

    const resize = () => {
      w = canvas.width  = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Chart glow line
      ctx.beginPath();
      ctx.moveTo(chartPoints[0].x * w, chartPoints[0].y * h);
      chartPoints.forEach(p => ctx.lineTo(p.x * w, p.y * h));
      ctx.strokeStyle = 'rgba(0, 212, 170, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Fill under chart
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 212, 170, 0.03)';
      ctx.fill();

      // Particles
      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124, 58, 237, ${p.alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.bgCanvas} />;
}

// ─── Main LandingPage ─────────────────────────────────────────────────────────
const LandingPage = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/home" replace />;

  return (
    <div className={styles.page}>
      <Ticker />


      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          <span className={styles.logo}>🔷 kurs-kripto.ru</span>
          <div className={styles.navActions}>
            <Link to="/login"    className={styles.btnOutline}>Войти</Link>
            <Link to="/register" className={styles.btnFilled}>Зарегистрироваться</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <AnimatedBg />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>🚀 Реальные данные Binance · Бесплатно</div>
          <h1 className={styles.heroTitle}>
            Торгуй криптой —<br />
            <span className={styles.heroAccent}>без риска потерять деньги</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Смотри реальные графики BTC, ETH и других монет.<br />
            Делай ставки на рост или падение. Соревнуйся с другими игроками.
          </p>
          <div className={styles.heroButtons}>
            <Link to="/register" className={styles.btnHeroPrimary}>
              Зарегистрироваться бесплатно
            </Link>
            <Link to="/login" className={styles.btnHeroSecondary}>
              Войти в аккаунт
            </Link>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}><strong>8</strong> монет</div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}><strong>1000</strong> монет при старте</div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}><strong>×1.9</strong> выплата победителю</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Как это работает</h2>
          <p className={styles.sectionSubtitle}>Три простых шага до первой победы</p>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNum}>01</div>
              <div className={styles.stepIcon}>📈</div>
              <h3 className={styles.stepTitle}>Смотри графики</h3>
              <p className={styles.stepText}>
                Реальные курсы BTC, ETH, SOL и других топ-криптовалют в реальном времени прямо с биржи Binance
              </p>
            </div>
            <div className={styles.stepArrow}>→</div>
            <div className={styles.step}>
              <div className={styles.stepNum}>02</div>
              <div className={styles.stepIcon}>🎯</div>
              <h3 className={styles.stepTitle}>Делай ставки</h3>
              <p className={styles.stepText}>
                Выбери монету, поставь на рост (Bull) или падение (Bear), выбери время: 5с, 10с, 1м, 10м или 1ч
              </p>
            </div>
            <div className={styles.stepArrow}>→</div>
            <div className={styles.step}>
              <div className={styles.stepNum}>03</div>
              <div className={styles.stepIcon}>🏆</div>
              <h3 className={styles.stepTitle}>Побеждай</h3>
              <p className={styles.stepText}>
                Угадал? Получаешь игровые монеты ×1.9. Соревнуйся за место в топе лидеров
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why safe */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Почему это безопасно</h2>
          <p className={styles.sectionSubtitle}>Весь азарт торговли — без финансового риска</p>
          <div className={styles.cards}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>🎮</div>
              <h3 className={styles.cardTitle}>Только игровые монеты</h3>
              <p className={styles.cardText}>Никаких реальных денег. Тренируй интуицию трейдера без потерь</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>📊</div>
              <h3 className={styles.cardTitle}>Реальные данные Binance</h3>
              <p className={styles.cardText}>Настоящие котировки в реальном времени — как на профессиональной бирже</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>🏅</div>
              <h3 className={styles.cardTitle}>Лидерборд</h3>
              <p className={styles.cardText}>Соревнуйся с другими игроками, занимай место в рейтинге топ-трейдеров</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>🎁</div>
              <h3 className={styles.cardTitle}>Бонусы и задания</h3>
              <p className={styles.cardText}>Ежедневный вход, выполнение заданий, серии побед — зарабатывай монеты без ставок</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaGlow} />
          <h2 className={styles.ctaTitle}>Готов попробовать?</h2>
          <p className={styles.ctaSubtitle}>
            Регистрация бесплатная. Получи 1000 монет прямо сейчас и делай первые ставки
          </p>
          <Link to="/register" className={styles.btnCtaPrimary}>
            Создать аккаунт бесплатно
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerLogo}>🔷 kurs-kripto.ru</span>
          <span className={styles.footerCopy}>© 2025 kurs-kripto.ru — только игровые монеты</span>
          <div className={styles.footerLinks}>
            <Link to="/login"    className={styles.footerLink}>Войти</Link>
            <Link to="/register" className={styles.footerLink}>Регистрация</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
