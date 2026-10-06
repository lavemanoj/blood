import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const BT_COLORS = { 'A+':'#ff2d55','A-':'#ff6b6b','B+':'#0a84ff','B-':'#5ac8fa','AB+':'#bf5af2','AB-':'#da8fff','O+':'#30d158','O-':'#34c759' };

export default function HospitalDashboard() {
  const { user } = useSelector(s => s.auth);
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [inventory, setInventory] = useState({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('inventory');

  useEffect(() => {
    api.get('/hospitals/profile').then(r => {
      setProfile(r.data);
      const inv = {};
      r.data.inventory?.forEach(i => { inv[i.bloodType] = i.units; });
      setInventory(inv);
    }).catch(() => {});
    api.get('/requests').then(r => setRequests(r.data)).catch(() => {});
  }, []);

  const saveInventory = async () => {
    setSaving(true);
    try {
      const inventoryArr = BLOOD_TYPES.map(bt => ({ bloodType: bt, units: parseInt(inventory[bt] || 0) }));
      await api.put('/hospitals/inventory', { inventory: inventoryArr });
      toast.success('Inventory updated');
    } catch { toast.error('Failed to update'); }
    setSaving(false);
  };

  const handleFulfill = async (req) => {
    try {
      await api.post('/hospitals/fulfill', { requestId: req._id, bloodType: req.bloodType, units: req.units });
      toast.success('Request fulfilled');
      setRequests(prev => prev.map(r => r._id === req._id ? { ...r, status: 'fulfilled' } : r));
      setInventory(prev => ({ ...prev, [req.bloodType]: Math.max(0, (parseInt(prev[req.bloodType] || 0) - req.units)) }));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const pending = requests.filter(r => ['pending','matched'].includes(r.status));
  const totalUnits = BLOOD_TYPES.reduce((sum, bt) => sum + parseInt(inventory[bt] || 0), 0);
  const criticalTypes = BLOOD_TYPES.filter(bt => parseInt(inventory[bt] || 0) < 5);

  return (
    <div style={styles.page}>
      <div className="bg-mesh" />

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.hospitalIcon}>🏥</div>
          <div>
            <h1 style={styles.title}>{profile?.name || user?.name}</h1>
            <div style={styles.headerMeta}>
              {profile?.isVerified
                ? <span style={styles.verifiedBadge}>✓ Verified Institution</span>
                : <span style={styles.pendingBadge}>⏳ Pending Verification</span>}
              {profile?.address && <span style={styles.addressText}>📍 {profile.address}</span>}
            </div>
          </div>
        </div>
        <div style={styles.headerStats}>
          <div style={styles.headerStat}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#30d158' }}>{totalUnits}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Total Units</div>
          </div>
          <div style={styles.headerStat}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#ff9f0a' }}>{pending.length}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Pending</div>
          </div>
          <div style={styles.headerStat}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#ff453a' }}>{criticalTypes.length}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Critical Low</div>
          </div>
        </div>
      </div>

      {/* Critical Alert */}
      {criticalTypes.length > 0 && (
        <div style={styles.criticalAlert}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700 }}>Critical Blood Shortage</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              Low stock: {criticalTypes.join(', ')} — Consider requesting donations
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        {['inventory','requests','history'].map(t => (
          <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'requests' && pending.length > 0 && <span style={styles.tabBadge}>{pending.length}</span>}
          </button>
        ))}
      </div>

      {/* Inventory */}
      {tab === 'inventory' && (
        <div className="animate-slideUp">
          <div style={styles.inventoryGrid}>
            {BLOOD_TYPES.map(bt => {
              const units = parseInt(inventory[bt] || 0);
              const color = BT_COLORS[bt];
              const isCritical = units < 5;
              return (
                <div key={bt} style={{ ...styles.btCard, borderColor: isCritical ? 'rgba(255,69,58,0.3)' : 'rgba(255,255,255,0.06)', boxShadow: isCritical ? '0 0 20px rgba(255,69,58,0.1)' : 'none' }}>
                  <div style={{ ...styles.btCircle, background: color + '20', color }}>{bt}</div>
                  <div style={styles.btUnits}>{units}</div>
                  <div style={styles.btLabel}>units</div>
                  <div style={styles.btBar}>
                    <div style={{ ...styles.btBarFill, width: Math.min(100, units * 2) + '%', background: isCritical ? '#ff453a' : color }} />
                  </div>
                  {isCritical && <div style={styles.criticalTag}>⚠️ Low</div>}
                  <input type="number" min="0" value={units}
                    onChange={e => setInventory(prev => ({ ...prev, [bt]: e.target.value }))}
                    style={styles.btInput} />
                </div>
              );
            })}
          </div>
          <button className="btn btn-primary btn-lg" style={{ marginTop: 20 }} onClick={saveInventory} disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Inventory'}
          </button>
        </div>
      )}

      {/* Pending Requests */}
      {tab === 'requests' && (
        <div className="animate-slideUp">
          {pending.length === 0 && (
            <div style={styles.empty}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>All caught up!</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>No pending blood requests</p>
            </div>
          )}
          <div style={styles.reqList}>
            {pending.map(req => (
              <div key={req._id} style={{ ...styles.reqCard, borderLeft: '3px solid ' + (req.urgency === 'critical' ? '#ff453a' : req.urgency === 'urgent' ? '#ff9f0a' : '#0a84ff') }}>
                <div style={{ ...styles.reqBT, background: (BT_COLORS[req.bloodType] || '#ff2d55') + '20', color: BT_COLORS[req.bloodType] || '#ff2d55' }}>{req.bloodType}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>{req.units} unit(s) needed</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>{req.address || 'No address'}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <span className={'badge badge-' + (req.urgency === 'critical' ? 'critical' : req.urgency === 'urgent' ? 'urgent' : 'normal')}>{req.urgency}</span>
                    {req.priorityMode && <span className="badge badge-critical">⚡ Priority</span>}
                  </div>
                </div>
                <div style={styles.reqActions}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
                    Stock: {inventory[req.bloodType] || 0} units
                  </div>
                  <button className="btn btn-primary btn-sm"
                    disabled={parseInt(inventory[req.bloodType] || 0) < req.units}
                    onClick={() => handleFulfill(req)}>
                    Fulfill Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className="animate-slideUp">
          <div style={styles.historyList}>
            {requests.filter(r => r.status === 'fulfilled').map(req => (
              <div key={req._id} style={styles.historyRow}>
                <div style={{ ...styles.reqBT, background: (BT_COLORS[req.bloodType] || '#ff2d55') + '20', color: BT_COLORS[req.bloodType] || '#ff2d55', width: 40, height: 40, fontSize: 12 }}>{req.bloodType}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'white' }}>{req.units} unit(s) fulfilled</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{new Date(req.updatedAt || req.createdAt).toLocaleDateString()}</div>
                </div>
                <span className="badge badge-fulfilled">Fulfilled</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '32px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  hospitalIcon: { fontSize: 48, width: 72, height: 72, background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.2)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 8 },
  headerMeta: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' },
  verifiedBadge: { background: 'rgba(48,209,88,0.15)', color: '#30d158', border: '1px solid rgba(48,209,88,0.3)', padding: '3px 12px', borderRadius: 50, fontSize: 12, fontWeight: 600 },
  pendingBadge: { background: 'rgba(255,214,10,0.15)', color: '#ffd60a', border: '1px solid rgba(255,214,10,0.3)', padding: '3px 12px', borderRadius: 50, fontSize: 12, fontWeight: 600 },
  addressText: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  headerStats: { display: 'flex', gap: 20 },
  headerStat: { textAlign: 'center' },
  criticalAlert: { background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.2)', borderRadius: 14, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, color: '#ff453a' },
  tabs: { display: 'flex', gap: 6, marginBottom: 20 },
  tab: { padding: '8px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 },
  tabActive: { background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.3)', color: 'white' },
  tabBadge: { background: '#ff2d55', color: 'white', borderRadius: 50, padding: '1px 7px', fontSize: 11, fontWeight: 700 },
  inventoryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 },
  btCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid', borderRadius: 16, padding: '20px 16px', textAlign: 'center', position: 'relative', transition: 'all 0.2s' },
  btCircle: { width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, margin: '0 auto 12px' },
  btUnits: { fontSize: 32, fontWeight: 900, color: 'white', marginBottom: 2 },
  btLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10 },
  btBar: { height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 },
  btBarFill: { height: '100%', borderRadius: 2, transition: 'width 0.5s' },
  criticalTag: { position: 'absolute', top: 8, right: 8, fontSize: 10, background: 'rgba(255,69,58,0.2)', color: '#ff453a', padding: '2px 6px', borderRadius: 6, fontWeight: 700 },
  btInput: { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: 'white', fontSize: 13, textAlign: 'center', marginBottom: 0 },
  empty: { textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 },
  reqList: { display: 'flex', flexDirection: 'column', gap: 10 },
  reqCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px', display: 'flex', alignItems: 'center', gap: 16 },
  reqBT: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 },
  reqActions: { textAlign: 'right', flexShrink: 0 },
  historyList: { display: 'flex', flexDirection: 'column', gap: 8 },
  historyRow: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }
};
