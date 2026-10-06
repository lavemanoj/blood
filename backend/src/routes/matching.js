const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const axios = require('axios');
const BloodRequest = require('../models/BloodRequest');

// Proxy to ML matching service
router.post('/run', protect, async (req, res) => {
  try {
    const result = await axios.post(`${process.env.ML_SERVICE_URL}/match`, req.body);
    res.json(result.data);
  } catch (err) {
    res.status(500).json({ message: 'ML service unavailable', error: err.message });
  }
});

// Blood type compatibility
router.get('/compatibility/:bloodType', protect, (req, res) => {
  const compatibility = {
    'O-':  { canDonateTo: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], canReceiveFrom: ['O-'] },
    'O+':  { canDonateTo: ['A+','B+','AB+','O+'], canReceiveFrom: ['O+','O-'] },
    'A-':  { canDonateTo: ['A+','A-','AB+','AB-'], canReceiveFrom: ['A-','O-'] },
    'A+':  { canDonateTo: ['A+','AB+'], canReceiveFrom: ['A+','A-','O+','O-'] },
    'B-':  { canDonateTo: ['B+','B-','AB+','AB-'], canReceiveFrom: ['B-','O-'] },
    'B+':  { canDonateTo: ['B+','AB+'], canReceiveFrom: ['B+','B-','O+','O-'] },
    'AB-': { canDonateTo: ['AB+','AB-'], canReceiveFrom: ['A-','B-','AB-','O-'] },
    'AB+': { canDonateTo: ['AB+'], canReceiveFrom: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] }
  };
  const result = compatibility[req.params.bloodType];
  if (!result) return res.status(400).json({ message: 'Invalid blood type' });
  res.json(result);
});

// Demand prediction by area — uses historical requests + ML
router.get('/demand-prediction', protect, authorize('admin', 'ngo'), async (req, res) => {
  try {
    // Fetch last 90 days of requests
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const requests = await BloodRequest.find({ createdAt: { $gte: since } })
      .select('location bloodType createdAt status');

    const historical = requests
      .filter(r => r.location?.coordinates)
      .map(r => ({
        lat: r.location.coordinates[1],
        lng: r.location.coordinates[0],
        blood_type: r.bloodType,
        created_at: r.createdAt,
        status: r.status
      }));

    try {
      const mlRes = await axios.post(`${process.env.ML_SERVICE_URL}/demand-prediction`, {
        historical_requests: historical,
        forecast_days: parseInt(req.query.days) || 7
      });
      res.json(mlRes.data);
    } catch {
      // Fallback: simple aggregation if ML service is down
      const agg = {};
      historical.forEach(r => {
        const key = `${Math.round(r.lat * 10) / 10}_${Math.round(r.lng * 10) / 10}_${r.blood_type}`;
        if (!agg[key]) agg[key] = { cell_lat: Math.round(r.lat * 10) / 10, cell_lng: Math.round(r.lng * 10) / 10, blood_type: r.blood_type, request_count: 0, fulfilled_count: 0 };
        agg[key].request_count++;
        if (r.status === 'fulfilled') agg[key].fulfilled_count++;
      });
      const areas = Object.values(agg).map(a => ({ ...a, demand_score: a.request_count, predicted_demand: Math.ceil(a.request_count / 13) }));
      areas.sort((a, b) => b.demand_score - a.demand_score);
      res.json({ areas: areas.slice(0, 50), total_areas: areas.length, forecast_days: 7 });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
