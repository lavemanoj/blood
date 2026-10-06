const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStats, getCampaigns, createCampaign, updateCampaign, deleteCampaign,
  sendOutreach, getAllRequests, flagRequest, getDonors
} = require('../controllers/ngoController');

router.use(protect, authorize('ngo'));

router.get('/stats', getStats);
router.get('/campaigns', getCampaigns);
router.post('/campaigns', createCampaign);
router.put('/campaigns/:id', updateCampaign);
router.delete('/campaigns/:id', deleteCampaign);
router.post('/outreach', sendOutreach);
router.get('/requests', getAllRequests);
router.put('/requests/:id/flag', flagRequest);
router.get('/donors', getDonors);

module.exports = router;
