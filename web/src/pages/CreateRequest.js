import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createRequest } from '../store/slices/requestSlice';
import { toast } from 'react-toastify';
import axios from 'axios';

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

export default function CreateRequest() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector(s => s.requests);

  const [form, setForm] = useState({
    bloodType: 'O+', units: 1, urgency: 'normal',
    priorityMode: false, address: '', hospital: '', notes: ''
  });
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const suggestRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-get location on mount
  useEffect(() => {
    getLocation(true);
  }, []);

  const getLocation = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) toast.error('Geolocation not supported');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords([longitude, latitude]);
        setLocating(false);

        // Reverse geocode to get address
        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const addr = res.data?.display_name || '';
          set('address', addr);
          if (!silent) toast.success('Location captured');
        } catch {
          if (!silent) toast.success('Location captured (address lookup failed)');
        }
      },
      (err) => {
        setLocating(false);
        if (!silent) toast.error(`Could not get location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Address autocomplete via Nominatim
  const handleAddressChange = (val) => {
    set('address', val);
    if (searchTimeout) clearTimeout(searchTimeout);
    if (val.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }

    const t = setTimeout(async () => {
      try {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        setSuggestions(res.data || []);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    }, 400);
    setSearchTimeout(t);
  };

  const selectSuggestion = (item) => {
    set('address', item.display_name);
    setCoords([parseFloat(item.lon), parseFloat(item.lat)]);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      location: coords ? { type: 'Point', coordinates: coords } : undefined
    };
    const result = await dispatch(createRequest(payload));
    if (!result.error) {
      toast.success('Blood request submitted! Matching donors...');
      navigate('/');
    } else {
      toast.error(result.payload || 'Failed to create request');
    }
  };

  return (
    <div style={styles.container}>
      <div className="card" style={styles.card}>
        <h2 style={{ color: 'var(--primary)', marginBottom: 8 }}>🩸 New Blood Request</h2>
        <p style={{ color: 'var(--gray)', fontSize: '14px', marginBottom: 24 }}>
          Matching donors will be notified immediately.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label>Blood Type Required</label>
              <select value={form.bloodType} onChange={e => set('bloodType', e.target.value)}>
                {BLOOD_TYPES.map(bt => <option key={bt}>{bt}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>Units Needed</label>
              <input type="number" min="1" max="20" value={form.units}
                onChange={e => set('units', parseInt(e.target.value))} required />
            </div>
          </div>

          <label>Urgency Level</label>
          <select value={form.urgency} onChange={e => set('urgency', e.target.value)}>
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
            <option value="critical">Critical</option>
          </select>

          <label>Hospital Name</label>
          <input placeholder="City General Hospital" value={form.hospital}
            onChange={e => set('hospital', e.target.value)} />

          {/* Address with autocomplete */}
          <label>Address / Location</label>
          <div style={{ position: 'relative' }} ref={suggestRef}>
            <div style={styles.addressRow}>
              <input
                placeholder="Start typing an address..."
                value={form.address}
                onChange={e => handleAddressChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                style={{ marginBottom: 0, flex: 1 }}
              />
              <button type="button" className="btn btn-outline" style={styles.locBtn}
                onClick={() => getLocation(false)} disabled={locating}>
                {locating ? '...' : coords ? '📍' : '📍 Locate'}
              </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div style={styles.suggestions}>
                {suggestions.map((s, i) => (
                  <div key={i} style={styles.suggestion} onClick={() => selectSuggestion(s)}
                    onMouseEnter={e => e.target.style.background = '#f1faee'}
                    onMouseLeave={e => e.target.style.background = 'white'}>
                    📍 {s.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {coords && (
            <div style={styles.coordBadge}>
              ✅ Coordinates captured: {coords[1].toFixed(5)}, {coords[0].toFixed(5)}
            </div>
          )}

          <label style={{ marginTop: 12 }}>Additional Notes</label>
          <textarea rows={3} placeholder="Any additional information..." value={form.notes}
            onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} />

          <div style={styles.priorityRow}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 0 }}>
              <input type="checkbox" style={{ width: 'auto', marginBottom: 0 }}
                checked={form.priorityMode} onChange={e => set('priorityMode', e.target.checked)} />
              <span>⚡ Enable Priority Mode — alerts hospitals first, then opt-in donors</span>
            </label>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 16, padding: '12px' }} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Blood Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 600, margin: '0 auto', padding: '24px 16px' },
  card: { padding: '32px' },
  row: { display: 'flex', gap: 12 },
  addressRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 },
  locBtn: { padding: '10px 14px', whiteSpace: 'nowrap', marginBottom: 0 },
  suggestions: { position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border)', borderRadius: '0 0 8px 8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000, maxHeight: 220, overflowY: 'auto' },
  suggestion: { padding: '10px 14px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f0f0f0', transition: 'background 0.15s' },
  coordBadge: { fontSize: 12, color: 'var(--success)', background: '#d4edda', padding: '6px 12px', borderRadius: 6, marginTop: 6, marginBottom: 4 },
  priorityRow: { background: '#fff3cd', padding: '12px 16px', borderRadius: 6, marginTop: 12 }
};
