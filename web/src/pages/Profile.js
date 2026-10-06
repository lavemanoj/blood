import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../utils/api';

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const COMPATIBILITY = {
  'O-':  { gives: ['Everyone'], receives: ['O-'] },
  'O+':  { gives: ['O+','A+','B+','AB+'], receives: ['O+','O-'] },
  'A-':  { gives: ['A+','A-','AB+','AB-'], receives: ['A-','O-'] },
  'A+':  { gives: ['A+','AB+'], receives: ['A+','A-','O+','O-'] },
  'B-':  { gives: ['B+','B-','AB+','AB-'], receives: ['B-','O-'] },
  'B+':  { gives: ['B+','AB+'], receives: ['B+','B-','O+','O-'] },
  'AB-': { gives: ['AB+','AB-'], receives: ['A-','B-','AB-','O-'] },
  'AB+': { gives: ['AB+'], receives: ['Everyone'] }
};

export default function Profile() {
  const { user } = useSelector(s => s.auth);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [donorForm, setDonorForm] = useState({ bloodType: 'O+', age: '', weight: '', priorityAlertOptIn: false });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('info');

  useEffect(() => {
    api.get('/profile').then(r => {
      setProfile(r.data);
      setForm({ name: r.data.user.name, phone: r.data.user.phone });
      if (r.data.profile) {
        setDonorForm({
          bloodType: r.data.profile.bloodType || 'O+',
          age: r.data.profile.age || '',
          weight: r.data.profile.weight || '',
          priorityAlertOptIn: r.data.profile.priorityAlertOptIn || false
        });
      }
    }).catch(() => {});
  }, []);

  const saveUser = async () => {
    setSaving(true);
    try {
      await api.put('/profile/user', form);
      toast.success('Profile updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const saveDonor = async () => {
    setSaving(true);
    try {
      await api.put('/profile/donor', donorForm);
      toast.success('Donor info updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const bt = donorForm.bloodType;
  const compat = COMPATIBILITY[bt];

  return (
    <div style={S.page}>
      <div className="bg-mesh" />
      <div style={S.header}>
        <div style={S.avatarWrap}>
          <div style={S.avatar}>{user?.name?.charAt(0)?.toUpperCase()}</div>
        </div>
        <div>
          <h1 style={S.name}>{user?.name}</h1>
          <span style={S.roleBadge}>{user?.role?.toUpperCase()}</span>
        </div>
      </div>

      <div style={S.tabs}>
        {['info', user?.role === 'donor' ? 'donor' : null, user?.role === 'donor' ? 'compatibility' : null].filter(Boolean).map(t => (
          <button key={t} style={{ ...S.tab, ...(tab === t ? S.tabActive : {}) }} onClick={() => setTab(t)}>
            {t === 'info' ? '👤 Personal Info' : t === 'donor' ? '🩸 Donor Info' : '🔬 Blood Compatibility'}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div style={S.card}>
          <h2 style={S.cardTitle}>Personal Information</h2>
          <label>Full Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <label>Email</label>
          <input value={user?.email} disabled style={{ opacity: 0.5 }} />
          <label>Phone</label>
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <label>Role</label>
          <input value={user?.role} disabled style={{ opacity: 0.5, textTransform: 'capitalize' }} />
          <button className="btn btn-primary" onClick={saveUser} disabled={saving} style={{ marginTop: 8 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {tab === 'donor' && (
        <div style={S.card}>
          <h2 style={S.cardTitle}>Donor Information</h2>
          <label>Blood Type</label>
          <div style={S.btGrid}>
            {BLOOD_TYPES.map(bt => (
              <div key={bt} style={{ ...S.btCard, ...(donorForm.bloodType === bt ? S.btActive : {}) }}
                onClick={() => setDonorForm(f => ({ ...f, bloodType: bt }))}>
                {bt}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label>Age</label>
              <input type="number" value={donorForm.age} onChange={e => setDonorForm(f => ({ ...f, age: e.target.value }))} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Weight (kg)</label>
              <input type="number" value={donorForm.weight} onChange={e => setDonorForm(f => ({ ...f, weight: e.target.value }))} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, marginBottom: 16 }}>
            <input type="checkbox" style={{ width: 'auto', marginBottom: 0, accentColor: '#ff2d55' }}
              checked={donorForm.priorityAlertOptIn}
              onChange={e => setDonorForm(f => ({ ...f, priorityAlertOptIn: e.target.checked }))} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Opt-in for priority emergency alerts</span>
          </label>
          {profile?.profile && (
            <div style={S.statsRow}>
              <div style={S.statItem}>
                <div style={S.statVal}>{profile.profile.totalDonations}</div>
                <div style={S.statLabel}>Total Donations</div>
              </div>
              <div style={S.statItem}>
                <div style={S.statVal}>{profile.profile.reliabilityScore}%</div>
                <div style={S.statLabel}>Reliability</div>
              </div>
              <div style={S.statItem}>
                <div style={{ ...S.statVal, color: profile.profile.isAvailable ? '#30d158' : '#ff453a' }}>
                  {profile.profile.isBusy ? '⏳ Cooldown' : profile.profile.isAvailable ? '✅ Active' : '❌ Off'}
                </div>
                <div style={S.statLabel}>Status</div>
              </div>
            </div>
          )}
          <button className="btn btn-primary" onClick={saveDonor} disabled={saving}>
            {saving ? 'Saving...' : 'Save Donor Info'}
          </button>
        </div>
      )}

      {tab === 'compatibility' && compat && (
        <div style={S.card}>
          <h2 style={S.cardTitle}>Blood Type Compatibility — {bt}</h2>
          <div style={S.compatGrid}>
            <div style={S.compatBox}>
              <div style={S.compatHeader}>
                <span style={{ fontSize: 24 }}>💉</span>
                <div>
                  <div style={S.compatTitle}>Can Donate To</div>
                  <div style={S.compatSub}>Your blood can help these types</div>
                </div>
              </div>
              <div style={S.btPills}>
                {compat.gives.map(t => (
                  <span key={t} style={{ ...S.pill, background: 'rgba(48,209,88,0.15)', color: '#30d158', border: '1px solid rgba(48,209,88,0.3)' }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={S.compatBox}>
              <div style={S.compatHeader}>
                <span style={{ fontSize: 24 }}>🩸</span>
                <div>
                  <div style={S.compatTitle}>Can Receive From</div>
                  <div style={S.compatSub}>These types are compatible with yours</div>
                </div>
              </div>
              <div style={S.btPills}>
                {compat.receives.map(t => (
                  <span key={t} style={{ ...S.pill, background: 'rgba(255,45,85,0.15)', color: '#ff2d55', border: '1px solid rgba(255,45,85,0.3)' }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div style={S.compatNote}>
            {bt === 'O-' && '🌟 You are the Universal Donor — your blood can be given to anyone in an emergency.'}
            {bt === 'AB+' && '🌟 You are the Universal Recipient — you can receive blood from any blood type.'}
            {bt === 'O+' && 'O+ is the most common blood type and in highest demand.'}
            {bt === 'AB-' && 'AB- is rare — your plasma can be given to all blood types.'}
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: { maxWidth: 800, margin: '0 auto', padding: '32px 24px' },
  header: { display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 },
  avatarWrap: {},
  avatar: { width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #ff2d55, #ff6b6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'white', boxShadow: '0 0 24px rgba(255,45,85,0.4)' },
  name: { fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 6 },
  roleBadge: { background: 'rgba(255,45,85,0.15)', color: '#ff2d55', border: '1px solid rgba(255,45,85,0.3)', padding: '3px 12px', borderRadius: 50, fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' },
  tabs: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tab: { padding: '8px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  tabActive: { background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.3)', color: 'white' },
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 24px' },
  cardTitle: { fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 24 },
  btGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 },
  btCard: { padding: '10px 0', textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.6)', transition: 'all 0.2s' },
  btActive: { background: 'rgba(255,45,85,0.15)', border: '1px solid rgba(255,45,85,0.5)', color: '#ff2d55' },
  statsRow: { display: 'flex', gap: 16, marginBottom: 20 },
  statItem: { flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px', textAlign: 'center' },
  statVal: { fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 4 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8 },
  compatGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  compatBox: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px' },
  compatHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 },
  compatTitle: { fontWeight: 700, color: 'white', fontSize: 14 },
  compatSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  btPills: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  pill: { padding: '4px 12px', borderRadius: 50, fontSize: 13, fontWeight: 700 },
  compatNote: { background: 'rgba(255,214,10,0.08)', border: '1px solid rgba(255,214,10,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#ffd60a', lineHeight: 1.5 }
};
