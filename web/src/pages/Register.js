import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../store/slices/authSlice';

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const ROLES = [
  { value: 'donor',     label: 'Blood Donor',          icon: '🩸', desc: 'Donate blood, save lives' },
  { value: 'recipient', label: 'Recipient',             icon: '🏥', desc: 'Request blood for patients' },
  { value: 'hospital',  label: 'Hospital / Blood Bank', icon: '🏨', desc: 'Manage blood inventory' },
  { value: 'ngo',       label: 'NGO / Organization',    icon: '🤝', desc: 'Coordinate blood drives' }
];

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(s => s.auth);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', role: '', age: '',
    bloodType: 'O+', weight: '', priorityAlertOptIn: false,
    hospitalName: '', licenseNumber: '', address: ''
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(register(form));
    if (!result.error) navigate('/');
  };

  return (
    <div style={S.page}>
      <div style={S.bg}><div style={S.orb1} /><div style={S.orb2} /></div>
      <div style={S.container}>
        <div style={S.header}>
          <Link to="/login" style={S.backBtn}>← Back to login</Link>
          <div style={S.logo}>🩸 <span style={S.logoText}>Hemora</span></div>
        </div>

        <div style={S.card}>
          <h2 style={S.title}>Create your account</h2>
          <p style={S.sub}>Join thousands saving lives every day</p>

          {error && <div style={S.errorBox}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <label>Full Name</label>
            <input placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />

            <label>Email Address</label>
            <input type="email" placeholder="john@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />

            <label>Phone Number</label>
            <input placeholder="+1 234 567 8900" value={form.phone} onChange={e => set('phone', e.target.value)} required />

            <label>Password</label>
            <input type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required />

            <label style={{ marginBottom: 12 }}>Select Your Role</label>
            <div style={S.roleGrid}>
              {ROLES.map(r => (
                <div key={r.value}
                  style={{ ...S.roleCard, ...(form.role === r.value ? S.roleCardActive : {}) }}
                  onClick={() => set('role', r.value)}>
                  <span style={S.roleIcon}>{r.icon}</span>
                  <span style={S.roleLabel}>{r.label}</span>
                  <span style={S.roleDesc}>{r.desc}</span>
                  {form.role === r.value && <div style={S.roleCheck}>✓</div>}
                </div>
              ))}
            </div>

            {!form.role && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 16 }}>Please select your role to continue</div>}

            {/* Age field for donors and recipients only */}
            {['donor', 'recipient'].includes(form.role) && (
              <>
                <label>Age</label>
                <input type="number" placeholder="25" min="1" max="120" value={form.age} onChange={e => set('age', e.target.value)} required />
              </>
            )}

            {/* Donor-specific fields */}
            {form.role === 'donor' && (
              <>
                <label>Blood Type</label>
                <div style={S.btGrid}>
                  {BLOOD_TYPES.map(bt => (
                    <div key={bt}
                      style={{ ...S.btCard, ...(form.bloodType === bt ? S.btCardActive : {}) }}
                      onClick={() => set('bloodType', bt)}>{bt}</div>
                  ))}
                </div>
                <label>Weight (kg)</label>
                <input type="number" placeholder="70" value={form.weight} onChange={e => set('weight', e.target.value)} required />
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, marginBottom: 16 }}>
                  <input type="checkbox" style={{ width: 'auto', marginBottom: 0, accentColor: '#ff2d55' }}
                    checked={form.priorityAlertOptIn} onChange={e => set('priorityAlertOptIn', e.target.checked)} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Opt-in for priority emergency alerts</span>
                </label>
              </>
            )}

            {/* Hospital-specific fields */}
            {form.role === 'hospital' && (
              <>
                <label>Hospital / Blood Bank Name</label>
                <input placeholder="City General Hospital" value={form.hospitalName} onChange={e => set('hospitalName', e.target.value)} required />
                <label>License Number</label>
                <input placeholder="LIC-12345" value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} required />
                <label>Address</label>
                <input placeholder="123 Main St" value={form.address} onChange={e => set('address', e.target.value)} />
              </>
            )}

            <button type="submit" style={S.primaryBtn} disabled={loading || !form.role}>
              {loading ? 'Creating account...' : 'Create Account 🩸'}
            </button>
          </form>

          <p style={S.footer}>Already have an account? <Link to="/login" style={{ color: '#ff2d55' }}>Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', position: 'relative', overflow: 'hidden' },
  bg: { position: 'fixed', inset: 0, zIndex: 0 },
  orb1: { position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,45,85,0.12) 0%, transparent 70%)' },
  orb2: { position: 'absolute', bottom: '-20%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(10,132,255,0.1) 0%, transparent 70%)' },
  container: { position: 'relative', zIndex: 1, width: '100%', maxWidth: 520 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' },
  logo: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 20 },
  logoText: { fontWeight: 800, color: 'white' },
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '36px 32px', backdropFilter: 'blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' },
  errorBox: { background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#ff6b6b', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 6 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 24 },
  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 },
  roleCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', transition: 'all 0.2s' },
  roleCardActive: { background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.4)', boxShadow: '0 0 16px rgba(255,45,85,0.1)' },
  roleIcon: { fontSize: 22 },
  roleLabel: { fontSize: 13, fontWeight: 700, color: 'white' },
  roleDesc: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  roleCheck: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', background: '#ff2d55', color: 'white', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  btGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 },
  btCard: { padding: '10px 0', textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.6)', transition: 'all 0.2s' },
  btCardActive: { background: 'rgba(255,45,85,0.15)', border: '1px solid rgba(255,45,85,0.5)', color: '#ff2d55' },
  primaryBtn: { width: '100%', padding: '13px', background: 'linear-gradient(135deg, #ff2d55, #ff6b6b)', border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 16, boxShadow: '0 4px 20px rgba(255,45,85,0.35)', fontFamily: 'Inter, sans-serif', transition: 'opacity 0.2s' },
  footer: { textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.3)' }
};
