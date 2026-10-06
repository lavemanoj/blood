const router = require('express').Router();
const { register, login, getMe, updateFCMToken } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/fcm-token', protect, updateFCMToken);

module.exports = router;
