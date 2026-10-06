const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bloodType: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], required: true },
  age: { type: Number, required: true },
  weight: { type: Number, required: true }, // kg
  isAvailable: { type: Boolean, default: true },
  isBusy: { type: Boolean, default: false },         // true after accepting a request
  busyUntil: { type: Date, default: null },           // cooldown end date (90 days)
  priorityAlertOptIn: { type: Boolean, default: false },
  lastDonationDate: { type: Date },
  healthInfo: {
    recentIllness: { type: Boolean, default: false },
    onMedication: { type: Boolean, default: false },
    chronicCondition: { type: Boolean, default: false },
    medicationDetails: { type: String }
  },
  reliabilityScore: { type: Number, default: 50, min: 0, max: 100 },
  totalDonations: { type: Number, default: 0 },
  acceptedRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest' }],
  eligibilityScore: { type: Number, default: null } // from ML model
}, { timestamps: true });

module.exports = mongoose.model('Donor', donorSchema);
