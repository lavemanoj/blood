const router = require('express').Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');

// Get full profile
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let profile = null;
    if (user.role === 'donor') profile = await Donor.findOne({ user: user._id });
    if (user.role === 'hospital') profile = await Hospital.findOne({ user: user._id });
    res.json({ user, profile });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update user info (name, phone, location)
router.put('/user', protect, async (req, res) => {
  try {
    const { name, phone, location } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { ...(name && { name }), ...(phone && { phone }), ...(location && { location }) },
      { new: true }
    ).select('-password');
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update donor health info
router.put('/donor', protect, async (req, res) => {
  try {
    const { bloodType, age, weight, healthInfo, priorityAlertOptIn } = req.body;
    const donor = await Donor.findOneAndUpdate(
      { user: req.user._id },
      { ...(bloodType && { bloodType }), ...(age && { age }), ...(weight && { weight }), ...(healthInfo && { healthInfo }), ...(priorityAlertOptIn !== undefined && { priorityAlertOptIn }) },
      { new: true }
    );
    res.json(donor);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
