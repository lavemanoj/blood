import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../store/slices/authSlice';

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  delay: Math.random() * 4,
  duration: Math.random() * 4 + 3
}));

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(form));
    if (!result.error) navigate('/');
  };

  return (
    <div style={styles.page}>
      {/* Animated background */}
      <div style={styles.bg}>
        <div style={styles.orb1} />
        <div style={styles.orb2} />
        <div style={styles.orb3} />
        {PARTICLES.map(p => (
          <div key={p.id} style={{
            position: 'absolute',
            left: p.x + '%', top: p.y + '%',
            width: p.size, height: p.size,
            borderRadius: '50%',
            background: 'rgba(255,45,85,0.4)',
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`
          }} />
        ))}
      </div>

      <div style={styles.container}>
        {/* Left panel */}
        <div style={styles.leftPanel}>
          <div style={styles.logoWrap}>
            <div style={styles.logo3d}>🩸</div>
            <div style={styles.logoRing} />
          </div>
          <h1 style={styles.heroTitle}>Hemora</h1>
          <p style={styles.heroSub}>AI-Powered Emergency Blood Donor Matching</p>
          <div style={styles.stats}>
            {[['10K+','Donors'],['500+','Hospitals'],['99%','Uptime']].map(([v,l]) => (
              <div key={l} style={styles.statItem}>
                <span style={styles.statVal}>{v}</span>
                <span style={styles.statLabel}>{l}</span>
              </div>
            ))}
          </div>
          <div style={styles.features}>
            {['Real-time donor matching','AI eligibility screening','Priority emergency alerts','Geolocation navigation'].map(f => (
              <div key={f} style={styles.feature}>
                <span style={styles.featureDot}>✦</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel - form */}
        <div style={styles.formPanel}>
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>Welcome back</h2>
              <p style={styles.formSub}>Sign in to your account</p>
            </div>

            {error && (
              <div style={styles.errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ ...styles.inputWrap, ...(focused === 'email' ? styles.inputWrapFocused : {}) }}>
                <span style={styles.inputIcon}>✉️</span>
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  style={styles.input}
                  required
                />
              </div>

              <div style={{ ...styles.inputWrap, ...(focused === 'password' ? styles.inputWrapFocused : {}) }}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                  style={styles.input}
                  required
                />
                <button type="button" style={styles.eyeBtn} onClick={() => setShowPass(s => !s)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>

              <button type="submit" style={styles.submitBtn} disabled={loading}>
                {loading ? (
                  <><div style={{ ...styles.spinnerSm }} /> Signing in...</>
                ) : (
                  <>Sign In <span>→</span></>
                )}
              </button>
            </form>

            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>New to Hemora?</span>
              <span style={styles.dividerLine} />
            </div>

            <Link to="/register" style={styles.registerBtn}>
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', overflow: 'hidden', position: 'relative' },
  bg: { position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' },
  orb1: { position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,45,85,0.15) 0%, transparent 70%)', animation: 'float 6s ease-in-out infinite' },
  orb2: { position: 'absolute', bottom: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(10,132,255,0.12) 0%, transparent 70%)', animation: 'float 8s ease-in-out 2s infinite' },
  orb3: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(191,90,242,0.05) 0%, transparent 70%)' },
  container: { position: 'relative', zIndex: 1, display: 'flex', width: '100%', maxWidth: 1000, minHeight: '100vh', alignItems: 'center', padding: '40px 24px', gap: 40, flexWrap: 'wrap' },
  leftPanel: { flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 24, padding: '40px 0' },
  logoWrap: { position: 'relative', width: 80, height: 80 },
  logo3d: { fontSize: 56, filter: 'drop-shadow(0 0 20px rgba(255,45,85,0.6))', animation: 'float 3s ease-in-out infinite' },
  logoRing: { position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid rgba(255,45,85,0.3)', animation: 'spin 8s linear infinite' },
  heroTitle: { fontSize: 48, fontWeight: 900, background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 },
  heroSub: { fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 360 },
  stats: { display: 'flex', gap: 32 },
  statItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  statVal: { fontSize: 28, fontWeight: 800, color: '#ff2d55' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  features: { display: 'flex', flexDirection: 'column', gap: 12 },
  feature: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  featureDot: { color: '#ff2d55', fontSize: 10 },
  formPanel: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  formCard: { width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 40, backdropFilter: 'blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)' },
  formHeader: { marginBottom: 32 },
  formTitle: { fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 6 },
  formSub: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  errorBox: { background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: 8 },
  inputWrap: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 14, transition: 'border-color 0.2s, box-shadow 0.2s', overflow: 'hidden' },
  inputWrapFocused: { borderColor: 'rgba(255,45,85,0.5)', boxShadow: '0 0 0 3px rgba(255,45,85,0.1)' },
  inputIcon: { padding: '0 14px', fontSize: 16, flexShrink: 0 },
  input: { flex: 1, background: 'transparent', border: 'none', padding: '14px 0', color: '#fff', fontSize: 14, outline: 'none', marginBottom: 0 },
  eyeBtn: { background: 'none', border: 'none', padding: '0 14px', cursor: 'pointer', fontSize: 16 },
  submitBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #ff2d55, #ff6b6b)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 24px rgba(255,45,85,0.4)', transition: 'all 0.2s', marginTop: 8 },
  spinnerSm: { width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' },
  dividerLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' },
  dividerText: { fontSize: 12, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' },
  registerBtn: { display: 'block', width: '100%', padding: '13px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600, textAlign: 'center', transition: 'all 0.2s', cursor: 'pointer' }
};
