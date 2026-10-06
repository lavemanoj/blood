const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  targetBloodTypes: [{ type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-','All'] }],
  targetUnits: { type: Number, default: 0 },
  collectedUnits: { type: Number, default: 0 },
  location: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['upcoming', 'active', 'completed', 'cancelled'], default: 'upcoming' },
  flaggedRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest' }]
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
