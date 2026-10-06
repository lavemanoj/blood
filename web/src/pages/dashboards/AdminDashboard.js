import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import api from '../../utils/api';

const TABS = ['overview','users','requests','fraud','audit'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [audit, setAudit] = useState([]);
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'users') api.get('/admin/users').then(r => setUsers(r.data)).catch(() => {});
    if (tab === 'requests') api.get('/admin/requests').then(r => setRequests(r.data)).catch(() => {});
    if (tab === 'fraud') api.get('/admin/flagged').then(r => setFlagged(r.data)).catch(() => {});
    if (tab === 'audit') api.get('/admin/chatbot-audit').then(r => setAudit(r.data)).catch(() => {});
  }, [tab]);

  const verifyUser = async (id) => {
    await api.put('/admin/users/' + id + '/verify');
    setUsers(prev => prev.map(u => u._id === id ? { ...u, isVerified: true } : u));
    toast.success('User verified');
  };

  const deactivate = async (id) => {
    await api.put('/admin/users/' + id + '/deactivate');
    setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: false } : u));
    toast.info('User deactivated');
  };

  const chartData = stats ? [
    { name: 'Users', value: stats.totalUsers, color: '#0a84ff' },
    { name: 'Donors', value: stats.totalDonors, color: '#ff2d55' },
    { name: 'Hospitals', value: stats.totalHospitals, color: '#30d158' },
    { name: 'Requests', value: stats.totalRequests, color: '#bf5af2' },
    { name: 'Fulfilled', value: stats.fulfilledRequests, color: '#ffd60a' }
  ] : [];

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }}>{label}</p>
          <p style={{ color: payload[0].color || '#ff2d55', fontWeight: 700 }}>{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={styles.page}>
      <div className="bg-mesh" />

      <div style={styles.header}>
        <div>
          <p style={styles.greeting}>System Administration</p>
          <h1 style={styles.title}>Admin Dashboard 🛡️</h1>
        </div>
        <div style={styles.headerBadge}>
          <span style={styles.liveDot} />
          System Online
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {TABS.map(t => (
          <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && stats && (
        <div className="animate-slideUp">
          <div style={styles.statsGrid}>
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#0a84ff' },
              { label: 'Donors', value: stats.totalDonors, icon: '🩸', color: '#ff2d55' },
              { label: 'Hospitals', value: stats.totalHospitals, icon: '🏥', color: '#30d158' },
              { label: 'Total Requests', value: stats.totalRequests, icon: '📋', color: '#bf5af2' },
              { label: 'Pending', value: stats.pendingRequests, icon: '⏳', color: '#ffd60a' },
              { label: 'Fulfilled', value: stats.fulfilledRequests, icon: '✅', color: '#30d158' }
            ].map(s => (
              <div key={s.label} style={styles.statCard}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
                <div style={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={styles.chartGrid}>
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>System Overview</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#ff2d55" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Fulfillment Rate</h3>
              <div style={styles.fulfillmentWrap}>
                <div style={styles.fulfillmentCircle}>
                  <svg viewBox="0 0 100 100" style={{ width: 140, height: 140 }}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#30d158" strokeWidth="8"
                      strokeDasharray={`${stats.totalRequests ? (stats.fulfilledRequests / stats.totalRequests * 251) : 0} 251`}
                      strokeLinecap="round" transform="rotate(-90 50 50)" />
                  </svg>
                  <div style={styles.fulfillmentText}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#30d158' }}>
                      {stats.totalRequests ? Math.round(stats.fulfilledRequests / stats.totalRequests * 100) : 0}%
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Fulfilled</div>
                  </div>
                </div>
                <div style={styles.fulfillmentStats}>
                  {[
                    { label: 'Fulfilled', value: stats.fulfilledRequests, color: '#30d158' },
                    { label: 'Pending', value: stats.pendingRequests, color: '#ffd60a' },
                    { label: 'Total', value: stats.totalRequests, color: '#0a84ff' }
                  ].map(s => (
                    <div key={s.label} style={styles.fulfillmentItem}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{s.label}</span>
                      <span style={{ color: s.color, fontWeight: 700, marginLeft: 'auto' }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="animate-slideUp">
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>🔍</span>
            <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...styles.searchInput }} />
          </div>
          <div style={styles.tableCard}>
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={styles.userCell}>
                        <div style={{ ...styles.userAvatar, background: u.role === 'donor' ? 'rgba(255,45,85,0.2)' : 'rgba(10,132,255,0.2)' }}>
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ color: 'white', fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={'badge badge-' + (u.role === 'donor' ? 'critical' : u.role === 'hospital' ? 'fulfilled' : 'normal')}>{u.role}</span></td>
                    <td>
                      {u.isVerified
                        ? <span className="badge badge-fulfilled">✓ Verified</span>
                        : <span className="badge badge-pending">Unverified</span>}
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {!u.isVerified && (
                          <button className="btn btn-success btn-sm" onClick={() => verifyUser(u._id)}>Verify</button>
                        )}
                        {u.isActive && (
                          <button className="btn btn-danger btn-sm" onClick={() => deactivate(u._id)}>Deactivate</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Requests */}
      {tab === 'requests' && (
        <div className="animate-slideUp">
          <div style={styles.tableCard}>
            <table className="table">
              <thead>
                <tr>
                  <th>Blood Type</th>
                  <th>Units</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Recipient</th>
                  <th>Fraud Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r._id} style={{ background: r.isFlagged ? 'rgba(255,214,10,0.03)' : 'transparent' }}>
                    <td><span style={styles.btTag}>{r.bloodType}</span></td>
                    <td style={{ color: 'white', fontWeight: 600 }}>{r.units}</td>
                    <td><span className={'badge badge-' + (r.urgency === 'critical' ? 'critical' : r.urgency === 'urgent' ? 'urgent' : 'normal')}>{r.urgency}</span></td>
                    <td><span className={'badge badge-' + (r.status === 'fulfilled' ? 'fulfilled' : 'pending')}>{r.status}</span></td>
                    <td style={{ color: 'rgba(255,255,255,0.6)' }}>{r.recipient?.name || '—'}</td>
                    <td>
                      {r.fraudScore > 0 && (
                        <span style={{ color: r.fraudScore >= 50 ? '#ff453a' : r.fraudScore >= 20 ? '#ff9f0a' : '#30d158', fontWeight: 700 }}>
                          {r.isFlagged ? '⚠️ ' : ''}{r.fraudScore}
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fraud Review */}
      {tab === 'fraud' && (
        <div className="animate-slideUp">
          <div style={styles.tableCard}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🚩</span>
              <div>
                <div style={{ fontWeight: 700, color: 'white' }}>Flagged Requests</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Suspicious requests detected by fraud system — review and take action</div>
              </div>
              <span style={{ marginLeft: 'auto', background: 'rgba(255,45,85,0.15)', color: '#ff2d55', border: '1px solid rgba(255,45,85,0.3)', padding: '3px 12px', borderRadius: 50, fontSize: 12, fontWeight: 700 }}>
                {flagged.length} flagged
              </span>
            </div>
            {flagged.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <p>No flagged requests — system is clean</p>
              </div>
            )}
            {flagged.map(r => (
              <div key={r._id} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(255,45,85,0.15)', color: '#ff2d55', padding: '2px 10px', borderRadius: 6, fontWeight: 800, fontSize: 13 }}>{r.bloodType}</span>
                    <span style={{ color: 'white', fontWeight: 600 }}>{r.units} units</span>
                    <span className={'badge badge-' + (r.urgency === 'critical' ? 'critical' : r.urgency === 'urgent' ? 'urgent' : 'normal')}>{r.urgency}</span>
                    <span style={{ background: 'rgba(255,214,10,0.15)', color: '#ffd60a', border: '1px solid rgba(255,214,10,0.3)', padding: '2px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700 }}>
                      ⚠️ Score: {r.fraudScore}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                    Recipient: {r.recipient?.name || '—'} · {r.recipient?.phone || '—'}
                  </div>
                  {r.fraudReasons?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {r.fraudReasons.map((reason, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#ff9f0a' }}>⚠️ {reason}</div>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>{new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button className="btn btn-success btn-sm" onClick={async () => {
                    await api.put('/admin/flagged/' + r._id + '/dismiss');
                    setFlagged(prev => prev.filter(f => f._id !== r._id));
                    toast.success('Flag dismissed');
                  }}>✓ Dismiss</button>
                  <button className="btn btn-danger btn-sm" onClick={async () => {
                    await api.put('/admin/flagged/' + r._id + '/cancel');
                    setFlagged(prev => prev.filter(f => f._id !== r._id));
                    toast.warning('Request cancelled');
                  }}>✕ Cancel</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit */}
      {tab === 'audit' && (        <div className="animate-slideUp">
          <div style={styles.tableCard}>
            <table className="table">
              <thead>
                <tr><th>User</th><th>Eligible</th><th>Score</th><th>Date</th></tr>
              </thead>
              <tbody>
                {audit.map(log => (
                  <tr key={log._id}>
                    <td style={{ color: 'white' }}>{log.user?.name || 'Anonymous'}</td>
                    <td>{log.eligibilityResult?.eligible ? <span className="badge badge-fulfilled">✓ Yes</span> : <span className="badge badge-critical">✗ No</span>}</td>
                    <td style={{ color: log.eligibilityResult?.score >= 60 ? '#30d158' : '#ff453a', fontWeight: 700 }}>{log.eligibilityResult?.score}/100</td>
                    <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{new Date(log.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '32px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 4 },
  title: { fontSize: 28, fontWeight: 800, color: 'white' },
  headerBadge: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.2)', borderRadius: 50, padding: '6px 16px', fontSize: 13, color: '#30d158', fontWeight: 600 },
  liveDot: { width: 8, height: 8, borderRadius: '50%', background: '#30d158', boxShadow: '0 0 8px #30d158', animation: 'pulse 2s infinite' },
  tabs: { display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' },
  tab: { padding: '8px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize' },
  tabActive: { background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.3)', color: 'white' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 },
  statCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 14px', textAlign: 'center' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8 },
  chartGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 },
  chartCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '24px' },
  chartTitle: { fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 20 },
  fulfillmentWrap: { display: 'flex', alignItems: 'center', gap: 24 },
  fulfillmentCircle: { position: 'relative', flexShrink: 0 },
  fulfillmentText: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  fulfillmentStats: { flex: 1, display: 'flex', flexDirection: 'column', gap: 12 },
  fulfillmentItem: { display: 'flex', alignItems: 'center', gap: 10 },
  searchWrap: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  searchIcon: { padding: '0 14px', fontSize: 16 },
  searchInput: { flex: 1, background: 'transparent', border: 'none', padding: '12px 0', color: 'white', fontSize: 14, outline: 'none', marginBottom: 0 },
  tableCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' },
  userCell: { display: 'flex', alignItems: 'center', gap: 10 },
  userAvatar: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 14, flexShrink: 0 },
  btTag: { background: 'rgba(255,45,85,0.15)', color: '#ff2d55', padding: '3px 10px', borderRadius: 6, fontWeight: 700, fontSize: 12 }
};
