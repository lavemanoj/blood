const router = require('express').Router();
const { getHospitalProfile, updateInventory, fulfillRequest, getAllHospitals } = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getAllHospitals);
router.get('/profile', protect, authorize('hospital'), getHospitalProfile);
router.put('/inventory', protect, authorize('hospital'), updateInventory);
router.post('/fulfill', protect, authorize('hospital'), fulfillRequest);

module.exports = router;
