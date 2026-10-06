const ChatbotLog = require('../models/ChatbotLog');
const Donor = require('../models/Donor');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Chosen-type chatbot questions
const CHATBOT_QUESTIONS = [
  { step: 1, question: 'How old are you?', options: ['Under 18', '18-25', '26-40', '41-60', 'Over 60'], key: 'age_range' },
  { step: 2, question: 'What is your weight?', options: ['Under 50kg', '50-70kg', '71-90kg', 'Over 90kg'], key: 'weight_range' },
  { step: 3, question: 'Have you donated blood in the last 3 months?', options: ['Yes', 'No'], key: 'recent_donation' },
  { step: 4, question: 'Are you currently on any medication?', options: ['Yes', 'No'], key: 'on_medication' },
  { step: 5, question: 'Have you had any illness in the last 2 weeks?', options: ['Yes', 'No'], key: 'recent_illness' },
  { step: 6, question: 'Do you have any chronic conditions? (diabetes, heart disease, etc.)', options: ['Yes', 'No'], key: 'chronic_condition' },
  { step: 7, question: 'Have you consumed alcohol in the last 24 hours?', options: ['Yes', 'No'], key: 'alcohol_recent' },
  { step: 8, question: 'Are you feeling well today?', options: ['Yes', 'No', 'Not sure'], key: 'feeling_well' }
];

exports.getQuestions = (req, res) => {
  res.json({ questions: CHATBOT_QUESTIONS, sessionId: uuidv4() });
};

exports.submitAnswers = async (req, res) => {
  try {
    const { sessionId, responses } = req.body;

    // Call ML eligibility scoring
    const mlPayload = {};
    responses.forEach(r => { mlPayload[r.key] = r.answer; });

    let eligibilityResult;
    try {
      const mlRes = await axios.post(`${process.env.ML_SERVICE_URL}/eligibility`, mlPayload);
      eligibilityResult = mlRes.data;
    } catch {
      // Fallback rule-based scoring if ML service unavailable
      eligibilityResult = ruleBasedEligibility(responses);
    }

    // Save log
    const log = await ChatbotLog.create({
      user: req.user?._id,
      sessionId,
      responses,
      eligibilityResult,
      completedAt: new Date()
    });

    // Update donor eligibility score if logged in donor
    if (req.user?.role === 'donor') {
      await Donor.findOneAndUpdate(
        { user: req.user._id },
        { eligibilityScore: eligibilityResult.score }
      );
    }

    res.json({ sessionId, eligibilityResult, logId: log._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const ruleBasedEligibility = (responses) => {
  let score = 100;
  const reasons = [];

  const get = (key) => responses.find(r => r.key === key)?.answer;

  if (get('age_range') === 'Under 18' || get('age_range') === 'Over 60') {
    score -= 40; reasons.push('Age outside eligible range (18-60)');
  }
  if (get('weight_range') === 'Under 50kg') {
    score -= 30; reasons.push('Weight below minimum (50kg)');
  }
  if (get('recent_donation') === 'Yes') {
    score -= 30; reasons.push('Donated within last 3 months');
  }
  if (get('on_medication') === 'Yes') {
    score -= 20; reasons.push('Currently on medication');
  }
  if (get('recent_illness') === 'Yes') {
    score -= 25; reasons.push('Recent illness in last 2 weeks');
  }
  if (get('chronic_condition') === 'Yes') {
    score -= 20; reasons.push('Chronic health condition');
  }
  if (get('alcohol_recent') === 'Yes') {
    score -= 15; reasons.push('Alcohol consumed in last 24 hours');
  }
  if (get('feeling_well') === 'No') {
    score -= 20; reasons.push('Not feeling well today');
  }

  score = Math.max(0, score);
  return { eligible: score >= 60, score, reasons };
};

exports.getChatbotHistory = async (req, res) => {
  try {
    const logs = await ChatbotLog.find({ user: req.user._id }).sort('-createdAt').limit(10);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
