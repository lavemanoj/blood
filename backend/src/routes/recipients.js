const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const BloodRequest = require('../models/BloodRequest');

// Get recipient's own requests
router.get('/requests', protect, authorize('recipient'), async (req, res) => {
  try {
    const requests = await BloodRequest.find({ recipient: req.user._id }).sort('-createdAt');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
