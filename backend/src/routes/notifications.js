const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { sendSMS, sendPushNotification, getSMSQueueStatus } = require('../utils/notifications');
// Admin: send manual notification
router.post('/send', protect, authorize('admin'), async (req, res) => {
  try {
    const { fcmToken, phone, title, body, message } = req.body;
    if (fcmToken) await sendPushNotification(fcmToken, title, body);
    if (phone) sendSMS(phone, message);
    res.json({ message: 'Notification queued' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: check SMS queue status
router.get('/sms-status', protect, authorize('admin'), (req, res) => {
  res.json(getSMSQueueStatus());
});

// Test SMS — admin only
router.post('/test-sms', protect, authorize('admin'), async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'phone is required' });
  sendSMS(phone, 'Hemora test message: SMS system is working correctly! 🩸');
  res.json({ message: `Test SMS queued for ${phone}. Check server logs for delivery status.` });
});

module.exports = router;
