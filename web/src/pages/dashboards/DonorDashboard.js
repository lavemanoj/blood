import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchRequests, acceptRequest } from '../../store/slices/requestSlice';
import { fetchDonorProfile, toggleAvailability } from '../../store/slices/donorSlice';
import { toast } from 'react-toastify';
import ChatbotPanel from '../../components/ChatbotPanel';
import api from '../../utils/api';

export default function DonorDashboard() {
  const dispatch = useDispatch();
  const { list: requests, loading } = useSelector(s => s.requests);
  const { profile } = useSelector(s => s.donor);
  const { user } = useSelector(s => s.auth);
  const [eligibility, setEligibility] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');

  useEffect(() => {
    dispatch(fetchRequests());
    dispatch(fetchDonorProfile());
    api.get('/donors/history').then(r => setHistory(r.data)).catch(() => {});
  }, [dispatch]);

  const isBusy = profile?.isBusy && profile?.busyUntil && new Date() < new Date(profile.busyUntil);
  const pendingRequests = requests.filter(r => ['pending','matched'].includes(r.status));

  const handleAccept = async (id) => {
    const result = await dispatch(acceptRequest(id));
    if (!result.error) {
      toast.success('Request accepted! 90-day cooldown started.');
      dispatch(fetchDonorProfile());
    } else {
      toast.error('Failed to accept request');
    }
  };

  const handleToggle = async () => {
    if (isBusy) {
      const daysLeft = Math.ceil((new Date(profile.busyUntil) - new Date()) / 86400000);
      toast.error('Cooldown active — ' + daysLeft + ' days remaining');
      return;
    }
    const result = await dispatch(toggleAvailability());
    if (result.error) toast.error(result.payload || 'Failed');
    else toast.success('Availability updated');
  };

  return (
    <div style={styles.page}>
      <div className="bg-mesh" />

      {/* Hero Header */}
      <div style={styles.hero}>
        <div style={styles.heroLeft}>
          <div style={styles.avatarWrap}>
            <div style={styles.avatar}>{user?.name?.charAt(0)?.toUpperCase()}</div>
            <div style={{ ...styles.statusDot, background: isBusy ? '#ff9f0a' : profile?.isAvailable ? '#30d158' : '#ff453a' }} />
          </div>
          <div>
            <p style={styles.greeting}>Good day,</p>
            <h1 style={styles.name}>{user?.name}</h1>
            <div style={styles.heroBadges}>
              <span style={styles.bloodBadge}>{profile?.bloodType || '—'}</span>
              <span style={{ ...styles.statusBadge, background: isBusy ? 'rgba(255,159,10,0.15)' : profile?.isAvailable ? 'rgba(48,209,88,0.15)' : 'rgba(255,69,58,0.15)', color: isBusy ? '#ff9f0a' : profile?.isAvailable ? '#30d158' : '#ff453a' }}>
                {isBusy ? '⏳ Cooldown' : profile?.isAvailable ? '● Available' : '● Unavailable'}
              </span>
            </div>
          </div>
        </div>
        <div style={styles.heroRight}>
          <button onClick={handleToggle} disabled={isBusy}
            style={{ ...styles.toggleBtn, opacity: isBusy ? 0.5 : 1, cursor: isBusy ? 'not-allowed' : 'pointer' }}>
            {isBusy ? '🔒 Locked' : profile?.isAvailable ? '🟢 Go Offline' : '🔴 Go Online'}
          </button>
          <Link to="/map" className="btn btn-secondary btn-sm">🗺️ Map</Link>
        </div>
      </div>

      {/* Cooldown Banner */}
      {isBusy && (
        <div style={styles.cooldownBanner}>
          <span style={styles.cooldownIcon}>⏳</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>Donation Cooldown Active</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              Available again on {new Date(profile.busyUntil).toDateString()} — {Math.ceil((new Date(profile.busyUntil) - new Date()) / 86400000)} days remaining
            </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div style={styles.statsGrid}>
        {[
          { label: 'Blood Type', value: profile?.bloodType || '—', icon: '🩸', color: '#ff2d55', glow: 'rgba(255,45,85,0.3)' },
          { label: 'Total Donations', value: profile?.totalDonations || 0, icon: '💉', color: '#30d158', glow: 'rgba(48,209,88,0.3)' },
          { label: 'Reliability Score', value: (profile?.reliabilityScore || 0) + '%', icon: '⭐', color: '#ffd60a', glow: 'rgba(255,214,10,0.3)' },
          { label: 'Eligibility', value: eligibility ? eligibility.score + '%' : profile?.eligibilityScore ? profile.eligibilityScore + '%' : 'Check →', icon: '🩺', color: '#bf5af2', glow: 'rgba(191,90,242,0.3)' }
        ].map(s => (
          <div key={s.label} style={{ ...styles.statCard, boxShadow: '0 0 0 1px ' + s.glow }}>
            <div style={{ ...styles.statIcon, background: s.glow }}>{s.icon}</div>
            <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
            <div style={{ ...styles.statGlow, background: s.glow }} />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={styles.mainGrid}>
        {/* Left: Requests */}
        <div style={{ flex: 2, minWidth: 0 }}>
          {/* Tabs */}
          <div style={styles.tabs}>
            {[['requests', '🩸 Requests', pendingRequests.length], ['history', '📋 History', history.length]].map(([id, label, count]) => (
              <button key={id} style={{ ...styles.tab, ...(activeTab === id ? styles.tabActive : {}) }}
                onClick={() => setActiveTab(id)}>
                {label}
                <span style={{ ...styles.tabCount, background: activeTab === id ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}>{count}</span>
              </button>
            ))}
          </div>

          {activeTab === 'requests' && (
            <div style={styles.requestsList}>
              {loading && <div style={styles.loadingWrap}><div className="spinner" /></div>}
              {!loading && pendingRequests.length === 0 && (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>🩸</div>
                  <p style={styles.emptyTitle}>No active requests nearby</p>
                  <p style={styles.emptySub}>You'll be notified when someone needs your blood type</p>
                </div>
              )}
              {pendingRequests.map((req, i) => (
                <RequestCard key={req._id} request={req} onAccept={handleAccept}
                  disabled={isBusy || !profile?.isAvailable} index={i} />
              ))}
            </div>
          )}

          {activeTab === 'history' && (
            <div style={styles.requestsList}>
              {history.length === 0 && (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>📋</div>
                  <p style={styles.emptyTitle}>No donations yet</p>
                  <p style={styles.emptySub}>Accept a request to start your donation journey</p>
                </div>
              )}
              {history.map(req => (
                <div key={req._id} style={styles.historyCard}>
                  <div style={{ ...styles.historyBT, background: 'rgba(255,45,85,0.15)', color: 'var(--primary)' }}>{req.bloodType}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'white', fontSize: 14 }}>{req.units} unit(s) — {req.hospital || 'No hospital'}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                      Recipient: {req.recipient?.name || 'Anonymous'} · {new Date(req.updatedAt || req.createdAt).toLocaleDateString()}
                    </div>
                    {req.matchedHospital && (
                      <div style={{ fontSize: 12, color: '#5ac8fa', marginTop: 2 }}>🏥 {req.matchedHospital.name}</div>
                    )}
                  </div>
                  <span className={'badge badge-' + (req.status === 'fulfilled' ? 'fulfilled' : 'pending')}>{req.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Chatbot */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <button style={{ ...styles.chatbotToggle, ...(showChatbot ? styles.chatbotToggleActive : {}) }}
            onClick={() => setShowChatbot(s => !s)}>
            <span style={styles.chatbotToggleIcon}>🤖</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{showChatbot ? 'Close Check' : 'Eligibility Check'}</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{showChatbot ? 'Click to close' : 'Am I ready to donate?'}</div>
            </div>
            <span style={{ marginLeft: 'auto', opacity: 0.5 }}>{showChatbot ? '✕' : '→'}</span>
          </button>

          {showChatbot && <div style={{ marginTop: 12 }}><ChatbotPanel onEligibilityResult={r => { setEligibility(r); if (r.eligible) toast.success('You are eligible!'); else toast.warning('Not eligible right now'); }} /></div>}

          {!showChatbot && eligibility && (
            <div style={styles.eligibilityResult}>
              <div style={{ fontSize: 40, textAlign: 'center' }}>{eligibility.eligible ? '✅' : '❌'}</div>
              <div style={{ textAlign: 'center', fontWeight: 700, color: eligibility.eligible ? '#30d158' : '#ff453a', marginTop: 8 }}>
                {eligibility.eligible ? 'Eligible to donate' : 'Not eligible now'}
              </div>
              <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Score: {eligibility.score}/100</div>
              <button className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => setShowChatbot(true)}>Check Again</button>
            </div>
          )}

          {!showChatbot && !eligibility && (
            <div style={styles.eligibilityPrompt}>
              <div style={styles.eligibilityEmoji}>🩺</div>
              <p style={{ fontWeight: 700, color: 'white', marginBottom: 6 }}>Ready to donate?</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16, lineHeight: 1.5 }}>
                Take a quick eligibility check before accepting requests
              </p>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowChatbot(true)}>
                Start Check →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestCard({ request, onAccept, disabled, index }) {
  const urgencyColors = { critical: '#ff453a', urgent: '#ff9f0a', normal: '#0a84ff' };
  const color = urgencyColors[request.urgency] || '#0a84ff';

  const openNav = () => {
    const coords = request.location?.coordinates;
    const dest = coords && coords[0] !== 0 ? coords[1] + ',' + coords[0] : encodeURIComponent(request.address || request.hospital || '');
    if (!dest) { alert('No location available'); return; }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => window.open('https://www.google.com/maps/dir/?api=1&origin=' + pos.coords.latitude + ',' + pos.coords.longitude + '&destination=' + dest + '&travelmode=driving', '_blank'),
        () => window.open('https://www.google.com/maps/dir/?api=1&destination=' + dest + '&travelmode=driving', '_blank')
      );
    } else {
      window.open('https://www.google.com/maps/dir/?api=1&destination=' + dest + '&travelmode=driving', '_blank');
    }
  };

  return (
    <div style={{ ...styles.reqCard, borderLeft: '3px solid ' + color, animationDelay: index * 0.05 + 's' }} className="animate-slideUp">
      <div style={{ ...styles.reqBT, background: color + '20', color }}>{request.bloodType}</div>
      <div style={{ flex: 1 }}>
        <div style={styles.reqTitle}>{request.units} unit(s) needed</div>
        {request.hospital && <div style={styles.reqHospital}>🏥 {request.hospital}</div>}
        {request.address && <div style={styles.reqAddr}>📍 {request.address}</div>}
        <div style={styles.reqBadges}>
          <span style={{ ...styles.urgencyBadge, background: color + '20', color, border: '1px solid ' + color + '40' }}>{request.urgency}</span>
          {request.priorityMode && <span style={styles.priorityBadge}>⚡ Priority</span>}
        </div>
      </div>
      <div style={styles.reqActions}>
        <button style={styles.navBtn} onClick={openNav} title="Navigate">🗺️</button>
        <button style={{ ...styles.acceptBtn, opacity: disabled ? 0.4 : 1 }}
          onClick={() => onAccept(request._id)} disabled={disabled}>
          Accept
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '32px 24px' },
  hero: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 },
  heroLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #ff2d55, #ff6b6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'white', boxShadow: '0 0 20px rgba(255,45,85,0.4)' },
  statusDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: '50%', border: '2px solid #0a0a0f' },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 2 },
  name: { fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 6 },
  heroBadges: { display: 'flex', gap: 8 },
  bloodBadge: { background: 'rgba(255,45,85,0.2)', color: '#ff2d55', border: '1px solid rgba(255,45,85,0.3)', padding: '3px 10px', borderRadius: 50, fontSize: 12, fontWeight: 700 },
  statusBadge: { padding: '3px 10px', borderRadius: 50, fontSize: 12, fontWeight: 600 },
  heroRight: { display: 'flex', gap: 10, alignItems: 'center' },
  toggleBtn: { padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  cooldownBanner: { background: 'linear-gradient(135deg, rgba(255,159,10,0.1), rgba(255,159,10,0.05))', border: '1px solid rgba(255,159,10,0.2)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14, color: '#ff9f0a' },
  cooldownIcon: { fontSize: 28, flexShrink: 0 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 14, marginBottom: 24 },
  statCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 16px', position: 'relative', overflow: 'hidden', transition: 'transform 0.3s', cursor: 'default' },
  statIcon: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 12 },
  statValue: { fontSize: 26, fontWeight: 800, marginBottom: 4 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8 },
  statGlow: { position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', filter: 'blur(20px)', opacity: 0.3 },
  mainGrid: { display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' },
  tabs: { display: 'flex', gap: 6, marginBottom: 14 },
  tab: { padding: '8px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' },
  tabActive: { background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.3)', color: 'white' },
  tabCount: { padding: '1px 7px', borderRadius: 50, fontSize: 11, fontWeight: 700, color: 'white' },
  requestsList: { display: 'flex', flexDirection: 'column', gap: 10 },
  loadingWrap: { display: 'flex', justifyContent: 'center', padding: 40 },
  emptyState: { textAlign: 'center', padding: '48px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 6 },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  reqCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s' },
  reqBT: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 },
  reqTitle: { fontWeight: 700, color: 'white', fontSize: 14, marginBottom: 3 },
  reqHospital: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  reqAddr: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 },
  reqBadges: { display: 'flex', gap: 6 },
  urgencyBadge: { padding: '2px 8px', borderRadius: 50, fontSize: 11, fontWeight: 600 },
  priorityBadge: { background: 'rgba(255,45,85,0.2)', color: '#ff2d55', border: '1px solid rgba(255,45,85,0.3)', padding: '2px 8px', borderRadius: 50, fontSize: 11, fontWeight: 600 },
  reqActions: { display: 'flex', gap: 8, flexShrink: 0 },
  navBtn: { width: 36, height: 36, borderRadius: 10, background: 'rgba(10,132,255,0.15)', border: '1px solid rgba(10,132,255,0.3)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  acceptBtn: { padding: '8px 16px', background: 'linear-gradient(135deg, #ff2d55, #ff6b6b)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,45,85,0.3)', transition: 'all 0.2s' },
  historyCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 },
  historyBT: { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 },
  chatbotToggle: { width: '100%', background: 'rgba(191,90,242,0.08)', border: '1px solid rgba(191,90,242,0.2)', borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.2s', color: 'white' },
  chatbotToggleActive: { background: 'rgba(191,90,242,0.15)', border: '1px solid rgba(191,90,242,0.4)' },
  chatbotToggleIcon: { fontSize: 28, width: 44, height: 44, background: 'rgba(191,90,242,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  eligibilityResult: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20, marginTop: 12 },
  eligibilityPrompt: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '24px 20px', marginTop: 12, textAlign: 'center' },
  eligibilityEmoji: { fontSize: 40, marginBottom: 12 }
};
