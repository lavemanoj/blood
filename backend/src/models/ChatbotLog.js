const mongoose = require('mongoose');

const chatbotLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String, required: true },
  responses: [
    {
      question: String,
      answer: String,
      step: Number
    }
  ],
  eligibilityResult: {
    eligible: Boolean,
    score: Number,
    reasons: [String]
  },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('ChatbotLog', chatbotLogSchema);
