import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchRequests } from '../../store/slices/requestSlice';

const STATUS = {
  pending: { color: '#ffd60a', bg: 'rgba(255,214,10,0.15)', label: 'Pending' },
  matched: { color: '#0a84ff', bg: 'rgba(10,132,255,0.15)', label: 'Matched' },
  accepted: { color: '#30d158', bg: 'rgba(48,209,88,0.15)', label: 'Accepted' },
  fulfilled: { color: '#30d158', bg: 'rgba(48,209,88,0.15)', label: 'Fulfilled' },
  cancelled: { color: '#ff453a', bg: 'rgba(255,69,58,0.15)', label: 'Cancelled' },
  expired: { color: '#ff9f0a', bg: 'rgba(255,159,10,0.15)', label: 'Expired' }
};

export default function RecipientDashboard() {
  const dispatch = useDispatch();
  const { list: requests, loading } = useSelector(s => s.requests);
  const { user } = useSelector(s => s.auth);

  useEffect(() => { dispatch(fetchRequests()); }, [dispatch]);

  const mine = requests.filter(r => r.recipient?._id === user?._id || r.recipient === user?._id);
  const active = mine.filter(r => !['fulfilled','cancelled','expired'].includes(r.status));
  const done = mine.filter(r => ['fulfilled','cancelled','expired'].includes(r.status));
  const fulfilled = mine.filter(r => r.status === 'fulfilled').length;

  return (
    <div style={styles.page}>
      <div className="bg-mesh" />

      {/* Header */}
      <div style={styles.header}>
        <div>
          <p style={styles.greeting}>Welcome back,</p>
          <h1 style={styles.name}>{user?.name} 👋</h1>
        </div>
        <Link to="/request/new" style={styles.newBtn}>
          <span>+</span> New Blood Request
        </Link>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          { label: 'Total Requests', value: mine.length, icon: '📋', color: '#0a84ff' },
          { label: 'Active', value: active.length, icon: '🔄', color: '#ff9f0a' },
          { label: 'Fulfilled', value: fulfilled, icon: '✅', color: '#30d158' },
          { label: 'Success Rate', value: mine.length ? Math.round(fulfilled / mine.length * 100) + '%' : '—', icon: '📊', color: '#bf5af2' }
        ].map(s => (
          <div key={s.label} style={styles.statCard}>
            <div style={{ ...styles.statIcon, color: s.color }}>{s.icon}</div>
            <div style={{ ...styles.statVal, color: s.color }}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Active Requests */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Active Requests</h2>
          <span style={styles.sectionCount}>{active.length}</span>
        </div>
        {loading && <div style={styles.loadingWrap}><div className="spinner" /></div>}
        {!loading && active.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>🩸</div>
            <p style={styles.emptyTitle}>No active requests</p>
            <p style={styles.emptySub}>Create a new request to find matching donors</p>
            <Link to="/request/new" className="btn btn-primary" style={{ marginTop: 16 }}>Create Request</Link>
          </div>
        )}
        <div style={styles.grid}>
          {active.map(req => <RequestCard key={req._id} req={req} />)}
        </div>
      </div>

      {/* History */}
      {done.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>History</h2>
            <span style={styles.sectionCount}>{done.length}</span>
          </div>
          <div style={styles.historyList}>
            {done.map(req => (
              <div key={req._id} style={styles.historyRow}>
                <div style={{ ...styles.btBadge, background: 'rgba(255,45,85,0.15)', color: '#ff2d55' }}>{req.bloodType}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'white', fontSize: 14 }}>{req.units} unit(s) — {req.hospital || 'No hospital'}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{new Date(req.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {req.priorityMode && <span className="badge badge-critical">⚡</span>}
                  <span style={{ ...styles.statusPill, background: STATUS[req.status]?.bg, color: STATUS[req.status]?.color }}>
                    {STATUS[req.status]?.label || req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RequestCard({ req }) {
  const s = STATUS[req.status] || STATUS.pending;
  const urgencyColor = { critical: '#ff453a', urgent: '#ff9f0a', normal: '#0a84ff' };
  const uc = urgencyColor[req.urgency] || '#0a84ff';
  const isFulfilled = req.status === 'fulfilled';
  const sourceType = req.matchedHospital ? 'hospital' : req.fulfilledBy?.role === 'donor' ? 'donor' : null;

  return (
    <div style={{ ...styles.reqCard, borderTop: '2px solid ' + uc }}>
      <div style={styles.reqTop}>
        <div style={{ ...styles.btCircle, background: uc + '20', color: uc }}>{req.bloodType}</div>
        <div style={{ ...styles.statusPill, background: s.bg, color: s.color }}>{s.label}</div>
      </div>
      <div style={styles.reqUnits}>{req.units} unit(s)</div>
      {req.hospital && <div style={styles.reqHospital}>🏥 {req.hospital}</div>}
      {req.address && <div style={styles.reqAddr}>📍 {req.address}</div>}

      {isFulfilled && sourceType && (
        <div style={styles.sourceBox}>
          <div style={styles.sourceTitle}>🩸 Blood received from</div>
          {sourceType === 'hospital' && req.matchedHospital && (
            <div style={styles.sourceRow}>
              <div style={styles.sourceIconWrap}>🏥</div>
              <div>
                <div style={styles.sourceName}>{req.matchedHospital.name}</div>
                {req.matchedHospital.address && <div style={styles.sourceAddr}>{req.matchedHospital.address}</div>}
                <div style={styles.sourceTag}>Blood Bank / Hospital</div>
              </div>
            </div>
          )}
          {sourceType === 'donor' && req.fulfilledBy && (
            <div style={styles.sourceRow}>
              <div style={styles.sourceIconWrap}>🩸</div>
              <div>
                <div style={styles.sourceName}>{req.fulfilledBy.name}</div>
                <div style={styles.sourceTag}>Individual Donor</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={styles.reqFooter}>
        <span style={{ ...styles.urgencyTag, background: uc + '15', color: uc }}>{req.urgency}</span>
        {req.priorityMode && <span style={styles.priorityTag}>⚡ Priority</span>}
        <span style={styles.reqDate}>{new Date(req.createdAt).toLocaleDateString()}</span>
      </div>
      {req.matchedDonors?.length > 0 && req.status !== 'fulfilled' && (
        <div style={styles.matchedInfo}>✓ {req.matchedDonors.length} donor(s) matched</div>
      )}
      {req.status === 'fulfilled' && (req.matchedHospital || req.fulfilledBy) && (
        <div style={styles.sourceBox}>
          <div style={styles.sourceTitle}>🩸 Blood received from</div>
          {req.matchedHospital ? (
            <div style={styles.sourceRow}>
              <span style={{ fontSize: 20 }}>🏥</span>
              <div>
                <div style={styles.sourceName}>{req.matchedHospital.name}</div>
                {req.matchedHospital.address && <div style={styles.sourceAddr}>{req.matchedHospital.address}</div>}
                <div style={styles.sourceTag}>Blood Bank / Hospital</div>
              </div>
            </div>
          ) : (
            <div style={styles.sourceRow}>
              <span style={{ fontSize: 20 }}>🩸</span>
              <div>
                <div style={styles.sourceName}>{req.fulfilledBy?.name || 'Anonymous Donor'}</div>
                <div style={styles.sourceTag}>Individual Donor</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


const styles = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '32px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 4 },
  name: { fontSize: 28, fontWeight: 800, color: 'white' },
  newBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'linear-gradient(135deg, #ff2d55, #ff6b6b)', borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 20px rgba(255,45,85,0.4)', transition: 'all 0.2s' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 14, marginBottom: 28 },
  statCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px', textAlign: 'center', transition: 'transform 0.3s' },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statVal: { fontSize: 28, fontWeight: 800, marginBottom: 4 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8 },
  section: { marginBottom: 28 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: 'white' },
  sectionCount: { background: 'rgba(255,45,85,0.2)', color: '#ff2d55', padding: '2px 10px', borderRadius: 50, fontSize: 12, fontWeight: 700 },
  loadingWrap: { display: 'flex', justifyContent: 'center', padding: 40 },
  empty: { textAlign: 'center', padding: '48px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 6 },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 },
  reqCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px', transition: 'all 0.2s' },
  reqTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  btCircle: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 },
  statusPill: { padding: '4px 12px', borderRadius: 50, fontSize: 12, fontWeight: 600 },
  reqUnits: { fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 6 },
  reqHospital: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 3 },
  reqAddr: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 },
  reqFooter: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  urgencyTag: { padding: '2px 8px', borderRadius: 50, fontSize: 11, fontWeight: 600 },
  priorityTag: { background: 'rgba(255,45,85,0.2)', color: '#ff2d55', padding: '2px 8px', borderRadius: 50, fontSize: 11, fontWeight: 600 },
  reqDate: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' },
  matchedInfo: { marginTop: 10, fontSize: 12, color: '#30d158', background: 'rgba(48,209,88,0.1)', padding: '6px 10px', borderRadius: 8 },
  sourceBox: { marginTop: 10, background: 'rgba(255,45,85,0.08)', border: '1px solid rgba(255,45,85,0.2)', borderRadius: 10, padding: '12px 14px' },
  sourceTitle: { fontSize: 11, fontWeight: 700, color: '#ff2d55', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  sourceRow: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  sourceName: { fontWeight: 700, color: 'white', fontSize: 14 },
  sourceAddr: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  sourceTag: { fontSize: 11, color: '#ff2d55', marginTop: 3, fontWeight: 600 },
  historyList: { display: 'flex', flexDirection: 'column', gap: 8 },
  historyRow: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 },
  btBadge: { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }
};
