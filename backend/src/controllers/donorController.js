const Donor = require('../models/Donor');
const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');

exports.getDonorProfile = async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user._id }).populate('user', 'name email phone location');
    if (!donor) return res.status(404).json({ message: 'Donor profile not found' });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateDonorProfile = async (req, res) => {
  try {
    const updates = req.body;
    const donor = await Donor.findOneAndUpdate({ user: req.user._id }, updates, { new: true });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleAvailability = async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user._id });
    if (!donor) return res.status(404).json({ message: 'Donor profile not found' });

    // Block toggle if still in cooldown period
    if (donor.isBusy && donor.busyUntil && new Date() < new Date(donor.busyUntil)) {
      const daysLeft = Math.ceil((new Date(donor.busyUntil) - new Date()) / (1000 * 60 * 60 * 24));
      return res.status(403).json({
        message: `You cannot change availability during your cooldown period. ${daysLeft} day(s) remaining until ${new Date(donor.busyUntil).toDateString()}.`,
        busyUntil: donor.busyUntil,
        daysLeft
      });
    }

    donor.isAvailable = !donor.isAvailable;
    await donor.save();
    res.json({ isAvailable: donor.isAvailable });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.togglePriorityAlert = async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user._id });
    donor.priorityAlertOptIn = !donor.priorityAlertOptIn;
    await donor.save();
    res.json({ priorityAlertOptIn: donor.priorityAlertOptIn });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDonationHistory = async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user._id });
    if (!donor) return res.status(404).json({ message: 'Donor profile not found' });

    const history = await BloodRequest.find({
      _id: { $in: donor.acceptedRequests }
    })
      .populate('recipient', 'name phone')
      .populate('matchedHospital', 'name address')
      .sort('-updatedAt');

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getNearbyDonors = async (req, res) => {
  try {
    const { lng, lat, maxDistance = 10000, bloodType } = req.query;

    // Get non-busy AND available donor user IDs
    const availableDonors = await Donor.find({
      isAvailable: true,
      $or: [{ isBusy: false }, { isBusy: null }, { busyUntil: { $lt: new Date() } }],
      ...(bloodType && { bloodType })
    }).select('user');
    const availableUserIds = availableDonors.map(d => d.user);

    const filter = {
      _id: { $in: availableUserIds },
      role: 'donor',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance)
        }
      }
    };

    const donors = await User.find(filter).select('name phone location');
    res.json(donors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
