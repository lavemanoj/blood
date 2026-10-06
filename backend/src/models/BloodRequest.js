const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bloodType: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], required: true },
  units: { type: Number, required: true, min: 1 },
  urgency: { type: String, enum: ['normal', 'urgent', 'critical'], default: 'normal' },
  priorityMode: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending', 'matched', 'accepted', 'fulfilled', 'cancelled', 'expired'],
    default: 'pending'
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  address: { type: String },
  hospital: { type: String },
  notes: { type: String },
  isFlagged: { type: Boolean, default: false },
  fraudScore: { type: Number, default: 0 },
  fraudReasons: [{ type: String }],
  matchedDonors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  matchedHospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  fulfilledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fulfilledAt: { type: Date },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }
}, { timestamps: true });

bloodRequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
