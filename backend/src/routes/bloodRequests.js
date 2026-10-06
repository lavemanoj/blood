const router = require('express').Router();
const {
  createRequest, getRequests, getRequestById,
  acceptRequest, fulfillRequest, cancelRequest
} = require('../controllers/bloodRequestController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('recipient'), createRequest);
router.get('/', protect, getRequests);
router.get('/:id', protect, getRequestById);
router.put('/:id/accept', protect, authorize('donor'), acceptRequest);
router.put('/:id/fulfill', protect, authorize('donor', 'hospital'), fulfillRequest);
router.put('/:id/cancel', protect, authorize('recipient'), cancelRequest);

module.exports = router;
