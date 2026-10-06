const router = require('express').Router();
const { getQuestions, submitAnswers, getChatbotHistory } = require('../controllers/chatbotController');
const { protect } = require('../middleware/auth');
const { getBotResponse } = require('../utils/bloodKnowledge');

router.get('/questions', getQuestions);
router.post('/submit', protect, submitAnswers);
router.get('/history', protect, getChatbotHistory);

// Text chatbot — open to all (no auth required)
router.post('/ask', (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });
  const answer = getBotResponse(message.trim());
  res.json({ answer });
});

module.exports = router;
