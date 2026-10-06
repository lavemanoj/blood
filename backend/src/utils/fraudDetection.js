const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');

const FRAUD_RULES = {
  MAX_REQUESTS_PER_HOUR: 3,
  MAX_REQUESTS_PER_DAY: 5,
  MAX_UNITS_PER_REQUEST: 10,
  DUPLICATE_WINDOW_HOURS: 24
};

/**
 * Run fraud detection on a new blood request before saving.
 * Returns { isFraud, score, reasons, action }
 * action: 'allow' | 'flag' | 'block'
 */
const detectFraud = async (recipientId, bloodType, units, isVerified) => {
  const reasons = [];
  let score = 0; // higher = more suspicious

  const now = new Date();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

  // Rule 1: Unverified account
  if (!isVerified) {
    score += 10;
    reasons.push('Unverified account');
  }

  // Rule 2: Too many requests in last hour
  const recentHourCount = await BloodRequest.countDocuments({
    recipient: recipientId,
    createdAt: { $gte: oneHourAgo },
    status: { $nin: ['cancelled'] }
  });
  if (recentHourCount >= FRAUD_RULES.MAX_REQUESTS_PER_HOUR) {
    score += 40;
    reasons.push(`${recentHourCount} requests submitted in the last hour (max ${FRAUD_RULES.MAX_REQUESTS_PER_HOUR})`);
  }

  // Rule 3: Too many requests in last 24 hours
  const recentDayCount = await BloodRequest.countDocuments({
    recipient: recipientId,
    createdAt: { $gte: oneDayAgo },
    status: { $nin: ['cancelled'] }
  });
  if (recentDayCount >= FRAUD_RULES.MAX_REQUESTS_PER_DAY) {
    score += 30;
    reasons.push(`${recentDayCount} requests submitted in the last 24 hours (max ${FRAUD_RULES.MAX_REQUESTS_PER_DAY})`);
  }

  // Rule 4: Duplicate request — same blood type, same recipient, within 24h, still active
  const duplicate = await BloodRequest.findOne({
    recipient: recipientId,
    bloodType,
    createdAt: { $gte: oneDayAgo },
    status: { $in: ['pending', 'matched', 'accepted'] }
  });
  if (duplicate) {
    score += 50;
    reasons.push(`Duplicate: active ${bloodType} request already exists (ID: ${duplicate._id})`);
  }

  // Rule 5: Abnormally high units
  if (units > FRAUD_RULES.MAX_UNITS_PER_REQUEST) {
    score += 20;
    reasons.push(`Unusually high units requested: ${units} (max recommended: ${FRAUD_RULES.MAX_UNITS_PER_REQUEST})`);
  }

  // Determine action
  let action = 'allow';
  if (score >= 50) action = 'block';
  else if (score >= 20) action = 'flag';

  return {
    isFraud: action === 'block',
    score,
    reasons,
    action,
    duplicateId: duplicate?._id || null
  };
};

module.exports = { detectFraud };
