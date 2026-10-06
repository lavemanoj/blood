const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  isVerified: { type: Boolean, default: false },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  address: { type: String },
  inventory: [
    {
      bloodType: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
      units: { type: Number, default: 0 }
    }
  ],
  fulfilledRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest' }],
  priorityAlertOptIn: { type: Boolean, default: true }
}, { timestamps: true });

hospitalSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Hospital', hospitalSchema);
