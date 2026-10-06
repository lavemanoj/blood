import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import api from '../../utils/api';

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const COLORS = ['#ff2d55','#0a84ff','#30d158','#ff9f0a','#5ac8fa','#bf5af2','#ffd60a','#ff6b6b'];
const TABS = ['overview','campaigns','outreach','requests','donors','demand'];

export default function NGODashboard() {
  const { user } = useSelector(s => s.auth);
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);
  const [demandData, setDemandData] = useState(null);
  const [campaignForm, setCampaignForm] = useState({ title: '', description: '', targetBloodTypes: [], targetUnits: '', location: '', startDate: '', endDate: '' });
  const [outreachForm, setOutreachForm] = useState({ bloodTypes: [], title: '', message: '' });
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => { api.get('/ngo/stats').then(r => setStats(r.data)).catch(() => {}); }, []);
  useEffect(() => {
    if (tab === 'campaigns') api.get('/ngo/campaigns').then(r => setCampaigns(r.data)).catch(() => {});
    if (tab === 'requests') api.get('/ngo/requests').then(r => setRequests(r.data)).catch(() => {});
    if (tab === 'donors') api.get('/ngo/donors').then(r => setDonors(r.data)).catch(() => {});
    if (tab === 'demand') api.get('/matching/demand-prediction?days=7').then(r => setDemandData(r.data)).catch(() => {});
  }, [tab]);

  const createCampaign = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/ngo/campaigns', campaignForm);
      setCampaigns(prev => [res.data, ...prev]);
      setShowCampaignForm(false);
      setCampaignForm({ title: '', description: '', targetBloodTypes: [], targetUnits: '', location: '', startDate: '', endDate: '' });
      toast.success('Campaign created');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const deleteCampaign = async (id) => {
    await api.delete('/ngo/campaigns/' + id);
    setCampaigns(prev => prev.filter(c => c._id !== id));
    toast.info('Campaign deleted');
  };

  const sendOutreach = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.post('/ngo/outreach', outreachForm);
      toast.success(res.data.message);
      setOutreachForm({ bloodTypes: [], title: '', message: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setSending(false);
  };

  const flagRequest = async (id) => {
    await api.put('/ngo/requests/' + id + '/flag');
    toast.warning('Request flagged');
  };

  const toggleBT = (bt, arr, setForm, key) => {
    setForm(f => ({ ...f, [key]: f[key].includes(bt) ? f[key].filter(b => b !== bt) : [...f[key], bt] }));
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 }}>{label}</p>
        <p style={{ color: payload[0].fill || '#ff2d55', fontWeight: 700 }}>{payload[0].value}</p>
      </div>
    );
  };

  return (
    <div style={S.page}>
      <div className="bg-mesh" />
      <div style={S.header}>
        <div>
          <p style={S.greeting}>NGO / Organization</p>
          <h1 style={S.title}>Welcome, {user?.name} 🤝</h1>
        </div>
        <div style={S.headerBadge}><span style={S.liveDot} />Live Dashboard</div>
      </div>

      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t} style={{ ...S.tab, ...(tab === t ? S.tabActive : {}) }} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && stats && (
        <div className="animate-slideUp">
          <div style={S.statsGrid}>
            {[
              { label: 'Total Donors', value: stats.totalDonors, icon: '🩸', color: '#ff2d55' },
              { label: 'Active Donors', value: stats.activeDonors, icon: '✅', color: '#30d158' },
              { label: 'Total Requests', value: stats.totalRequests, icon: '📋', color: '#0a84ff' },
              { label: 'Fulfilled', value: stats.fulfilledRequests, icon: '💉', color: '#30d158' },
              { label: 'Pending', value: stats.pendingRequests, icon: '⏳', color: '#ff9f0a' },
              { label: 'My Campaigns', value: stats.campaigns, icon: '📣', color: '#bf5af2' }
            ].map(s => (
              <div key={s.label} style={S.statCard}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
                <div style={S.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={S.chartGrid}>
            <div style={S.chartCard}>
              <h3 style={S.chartTitle}>Requests by Blood Type</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.bloodTypeStats.map(b => ({ name: b._id, value: b.count }))}
                    dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => name + ': ' + value}>
                    {stats.bloodTypeStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={S.chartCard}>
              <h3 style={S.chartTitle}>Monthly Fulfillment Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.trend.map(t => ({ month: t._id.month + '/' + t._id.year, count: t.count }))} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#ff2d55" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns */}
      {tab === 'campaigns' && (
        <div className="animate-slideUp">
          <div style={S.sectionHeader}>
            <h2 style={S.sectionTitle}>Blood Drive Campaigns</h2>
            <button className="btn btn-primary" onClick={() => setShowCampaignForm(s => !s)}>
              {showCampaignForm ? '✕ Cancel' : '+ New Campaign'}
            </button>
          </div>
          {showCampaignForm && (
            <div style={S.formCard}>
              <form onSubmit={createCampaign}>
                <label>Campaign Title</label>
                <input placeholder="World Blood Donor Day Drive" value={campaignForm.title} onChange={e => setCampaignForm(f => ({ ...f, title: e.target.value }))} required />
                <label>Description</label>
                <textarea rows={2} placeholder="Campaign details..." value={campaignForm.description} onChange={e => setCampaignForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
                <label>Target Blood Types</label>
                <div style={S.btRow}>
                  {BLOOD_TYPES.map(bt => (
                    <button type="button" key={bt} style={{ ...S.btBtn, ...(campaignForm.targetBloodTypes.includes(bt) ? S.btActive : {}) }}
                      onClick={() => toggleBT(bt, campaignForm.targetBloodTypes, setCampaignForm, 'targetBloodTypes')}>{bt}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}><label>Target Units</label><input type="number" placeholder="100" value={campaignForm.targetUnits} onChange={e => setCampaignForm(f => ({ ...f, targetUnits: e.target.value }))} /></div>
                  <div style={{ flex: 1 }}><label>Location</label><input placeholder="City Hall" value={campaignForm.location} onChange={e => setCampaignForm(f => ({ ...f, location: e.target.value }))} /></div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}><label>Start Date</label><input type="date" value={campaignForm.startDate} onChange={e => setCampaignForm(f => ({ ...f, startDate: e.target.value }))} required /></div>
                  <div style={{ flex: 1 }}><label>End Date</label><input type="date" value={campaignForm.endDate} onChange={e => setCampaignForm(f => ({ ...f, endDate: e.target.value }))} required /></div>
                </div>
                <button className="btn btn-primary" type="submit">Create Campaign</button>
              </form>
            </div>
          )}
          {campaigns.length === 0 && <div style={S.empty}><div style={{ fontSize: 40, marginBottom: 12 }}>📣</div><p style={S.emptyTitle}>No campaigns yet</p><p style={S.emptySub}>Create your first blood drive campaign</p></div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {campaigns.map(c => (
              <div key={c._id} style={S.campaignCard}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'white', marginBottom: 4 }}>{c.title}</div>
                  {c.description && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{c.description}</div>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {c.targetBloodTypes.map(bt => <span key={bt} style={S.btTag}>{bt}</span>)}
                    {c.location && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>📍 {c.location}</span>}
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>🎯 {c.targetUnits} units</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{new Date(c.startDate).toLocaleDateString()} → {new Date(c.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <span className={'badge badge-' + (c.status === 'active' ? 'fulfilled' : c.status === 'upcoming' ? 'pending' : 'normal')}>{c.status}</span>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteCampaign(c._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outreach */}
      {tab === 'outreach' && (
        <div className="animate-slideUp" style={S.formCard}>
          <h2 style={{ ...S.sectionTitle, marginBottom: 6 }}>📢 Donor Outreach</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>Send push notifications and SMS to available donors filtered by blood type.</p>
          <form onSubmit={sendOutreach}>
            <label>Target Blood Types (leave empty for all)</label>
            <div style={S.btRow}>
              {BLOOD_TYPES.map(bt => (
                <button type="button" key={bt} style={{ ...S.btBtn, ...(outreachForm.bloodTypes.includes(bt) ? S.btActive : {}) }}
                  onClick={() => toggleBT(bt, outreachForm.bloodTypes, setOutreachForm, 'bloodTypes')}>{bt}</button>
              ))}
            </div>
            <label>Notification Title</label>
            <input placeholder="Urgent: Blood Drive This Weekend!" value={outreachForm.title} onChange={e => setOutreachForm(f => ({ ...f, title: e.target.value }))} />
            <label>Message</label>
            <textarea rows={4} placeholder="We urgently need blood donors..." value={outreachForm.message} onChange={e => setOutreachForm(f => ({ ...f, message: e.target.value }))} required style={{ resize: 'vertical' }} />
            <button className="btn btn-primary btn-lg" type="submit" disabled={sending} style={{ marginTop: 8 }}>
              {sending ? 'Sending...' : '📤 Send to Available Donors'}
            </button>
          </form>
        </div>
      )}

      {/* Requests */}
      {tab === 'requests' && (
        <div className="animate-slideUp" style={S.tableCard}>
          <h2 style={{ ...S.sectionTitle, marginBottom: 16 }}>Blood Requests Overview</h2>
          {requests.length === 0 && <div style={S.empty}><p style={S.emptyTitle}>No requests found</p></div>}
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead><tr><th>Blood Type</th><th>Units</th><th>Urgency</th><th>Status</th><th>Recipient</th><th>Date</th><th>Action</th></tr></thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r._id}>
                    <td><span style={S.btTag}>{r.bloodType}</span></td>
                    <td style={{ color: 'white', fontWeight: 600 }}>{r.units}</td>
                    <td><span className={'badge badge-' + (r.urgency === 'critical' ? 'critical' : r.urgency === 'urgent' ? 'urgent' : 'normal')}>{r.urgency}</span></td>
                    <td><span className={'badge badge-' + (r.status === 'fulfilled' ? 'fulfilled' : 'pending')}>{r.status}</span></td>
                    <td style={{ color: 'rgba(255,255,255,0.6)' }}>{r.recipient?.name || '—'}</td>
                    <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td><button className="btn btn-sm" style={{ background: 'rgba(255,214,10,0.15)', color: '#ffd60a', border: '1px solid rgba(255,214,10,0.3)' }} onClick={() => flagRequest(r._id)}>🚩 Flag</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Donors */}
      {tab === 'donors' && (
        <div className="animate-slideUp" style={S.tableCard}>
          <h2 style={{ ...S.sectionTitle, marginBottom: 16 }}>Donor Registry ({donors.length})</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead><tr><th>Name</th><th>Blood Type</th><th>Donations</th><th>Reliability</th><th>Status</th><th>Phone</th></tr></thead>
              <tbody>
                {donors.map(d => (
                  <tr key={d._id}>
                    <td style={{ color: 'white', fontWeight: 600 }}>{d.user?.name || '—'}</td>
                    <td><span style={S.btTag}>{d.bloodType}</span></td>
                    <td style={{ color: 'rgba(255,255,255,0.7)' }}>{d.totalDonations}</td>
                    <td>
                      <div style={S.relBar}><div style={{ ...S.relFill, width: d.reliabilityScore + '%', background: d.reliabilityScore >= 70 ? '#30d158' : d.reliabilityScore >= 40 ? '#ff9f0a' : '#ff453a' }} /></div>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{d.reliabilityScore}%</span>
                    </td>
                    <td>{d.isBusy ? <span className="badge badge-urgent">Cooldown</span> : d.isAvailable ? <span className="badge badge-fulfilled">Available</span> : <span className="badge badge-pending">Unavailable</span>}</td>
                    <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{d.user?.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Demand Prediction */}
      {tab === 'demand' && (
        <div className="animate-slideUp">
          <div style={S.demandHeader}>
            <div>
              <h2 style={S.sectionTitle}>📊 Demand Prediction by Area</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>Grid-based geospatial analysis — each cell ~11km². 7-day forecast using historical patterns.</p>
            </div>
            {demandData && (
              <div style={S.demandMeta}>
                <div style={S.demandMetaItem}><span style={{ color: '#0a84ff', fontSize: 20, fontWeight: 800 }}>{demandData.total_areas}</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Areas</span></div>
                <div style={S.demandMetaItem}><span style={{ color: '#bf5af2', fontSize: 20, fontWeight: 800 }}>{demandData.forecast_days}</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Day Forecast</span></div>
              </div>
            )}
          </div>
          {!demandData && <div style={S.empty}><div className="spinner" style={{ margin: '0 auto 16px' }} /><p style={S.emptySub}>Loading demand data...</p></div>}
          {demandData && demandData.areas.length === 0 && <div style={S.empty}><div style={{ fontSize: 40, marginBottom: 12 }}>📊</div><p style={S.emptyTitle}>Not enough data yet</p><p style={S.emptySub}>Demand prediction improves as more requests are submitted</p></div>}
          {demandData && demandData.areas.length > 0 && (
            <div style={S.tableCard}>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr><th>#</th><th>Area</th><th>Blood Type</th><th>Requests</th><th>Fulfilled</th><th>Demand Score</th><th>Predicted ({demandData.forecast_days}d)</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {demandData.areas.slice(0, 20).map((area, i) => (
                      <tr key={i} style={{ background: i < 3 ? 'rgba(255,45,85,0.04)' : 'transparent' }}>
                        <td style={{ color: i < 3 ? '#ff2d55' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{i < 3 ? '🔥' : ''} {i + 1}</td>
                        <td>
                          <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)' }}>{area.cell_lat.toFixed(1)}°, {area.cell_lng.toFixed(1)}°</span><br />
                          <a href={'https://www.google.com/maps?q=' + area.cell_lat + ',' + area.cell_lng} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#0a84ff' }}>View on map ↗</a>
                        </td>
                        <td><span style={S.btTag}>{area.blood_type}</span></td>
                        <td style={{ color: 'rgba(255,255,255,0.7)' }}>{area.request_count}</td>
                        <td style={{ color: '#30d158' }}>{area.fulfilled_count}</td>
                        <td>
                          <div style={S.scoreBar}>
                            <div style={{ ...S.scoreFill, width: Math.min(100, (area.demand_score / (demandData.areas[0]?.demand_score || 1)) * 100) + '%', background: i < 3 ? '#ff2d55' : i < 8 ? '#ff9f0a' : '#0a84ff' }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{area.demand_score.toFixed(1)}</span>
                        </td>
                        <td><span style={{ fontWeight: 800, color: area.predicted_demand > 5 ? '#ff453a' : '#30d158', fontSize: 15 }}>{area.predicted_demand}</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>units</span></td>
                        <td>
                          <button className="btn btn-sm" style={{ background: 'rgba(10,132,255,0.15)', color: '#0a84ff', border: '1px solid rgba(10,132,255,0.3)' }}
                            onClick={() => { setOutreachForm({ bloodTypes: [area.blood_type], title: 'Urgent: ' + area.blood_type + ' needed', message: 'High demand predicted for ' + area.blood_type + ' in your area. Please donate!' }); setTab('outreach'); }}>
                            📢 Alert
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const S = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '32px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 4 },
  title: { fontSize: 28, fontWeight: 800, color: 'white' },
  headerBadge: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(191,90,242,0.1)', border: '1px solid rgba(191,90,242,0.2)', borderRadius: 50, padding: '6px 16px', fontSize: 13, color: '#bf5af2', fontWeight: 600 },
  liveDot: { width: 8, height: 8, borderRadius: '50%', background: '#bf5af2', boxShadow: '0 0 8px #bf5af2', animation: 'pulse 2s infinite' },
  tabs: { display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' },
  tab: { padding: '8px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize' },
  tabActive: { background: 'rgba(191,90,242,0.1)', border: '1px solid rgba(191,90,242,0.3)', color: 'white' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 },
  statCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 14px', textAlign: 'center' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8 },
  chartGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 },
  chartCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '24px' },
  chartTitle: { fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 20 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 700, color: 'white' },
  formCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '24px', marginBottom: 16 },
  tableCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '24px', overflow: 'hidden' },
  campaignCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s' },
  btRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  btBtn: { padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.6)', transition: 'all 0.2s' },
  btActive: { background: 'rgba(255,45,85,0.2)', border: '1px solid rgba(255,45,85,0.4)', color: '#ff2d55' },
  btTag: { background: 'rgba(255,45,85,0.15)', color: '#ff2d55', padding: '3px 10px', borderRadius: 6, fontWeight: 700, fontSize: 12 },
  empty: { textAlign: 'center', padding: '48px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 6 },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  relBar: { height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, width: 80, marginBottom: 3, overflow: 'hidden' },
  relFill: { height: '100%', borderRadius: 3 },
  demandHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 },
  demandMeta: { display: 'flex', gap: 20 },
  demandMetaItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 20px' },
  scoreBar: { height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, width: 80, marginBottom: 3, overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: 3, transition: 'width 0.5s' }
};
