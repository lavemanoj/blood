const router = require('express').Router();
const { getDonorProfile, updateDonorProfile, toggleAvailability, togglePriorityAlert, getNearbyDonors, getDonationHistory } = require('../controllers/donorController');
const { protect, authorize } = require('../middleware/auth');

router.get('/profile', protect, authorize('donor'), getDonorProfile);
router.put('/profile', protect, authorize('donor'), updateDonorProfile);
router.put('/availability', protect, authorize('donor'), toggleAvailability);
router.put('/priority-alert', protect, authorize('donor'), togglePriorityAlert);
router.get('/nearby', protect, getNearbyDonors);
router.get('/history', protect, authorize('donor'), getDonationHistory);

module.exports = router;
