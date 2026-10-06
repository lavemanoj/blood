const axios = require('axios');

// ─── SMS Queue for retry logic ────────────────────────────────────────────────
const smsQueue = [];
let isProcessing = false;

const TERMII_URL = 'https://v3.api.termii.com/api/sms/send';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Normalize phone number to international format without +
const normalizePhone = (phone) => {
  if (!phone) return null;
  let num = phone.toString().trim().replace(/\s+/g, '');
  // Remove leading +
  if (num.startsWith('+')) num = num.slice(1);
  // Remove leading 00
  if (num.startsWith('00')) num = num.slice(2);
  // Must be numeric only
  if (!/^\d+$/.test(num)) return null;
  return num;
};

// Send a single SMS with retries
const sendSMSWithRetry = async (to, message, attempt = 1) => {
  const apiKey = process.env.TERMII_API_KEY;
  if (!apiKey || apiKey === 'your_termii_api_key') {
    console.warn('Termii: API key not configured, SMS skipped');
    return { success: false, reason: 'no_api_key' };
  }

  const normalized = normalizePhone(to);
  if (!normalized) {
    console.warn(`SMS skipped: invalid phone number "${to}"`);
    return { success: false, reason: 'invalid_number' };
  }

  try {
    const res = await axios.post(TERMII_URL, {
      to: normalized,
      from: process.env.TERMII_SENDER_ID || 'N-Alert',
      sms: message,
      type: 'plain',
      channel: 'generic',
      api_key: apiKey
    }, { timeout: 10000 });

    const data = res.data;
    // Termii success: has message_id or balanceInfo
    if (data?.message_id || data?.balance !== undefined || res.status === 200) {
      console.log(`✅ SMS sent to +${normalized} | MsgID: ${data?.message_id || 'N/A'}`);
      return { success: true };
    } else {
      throw new Error(data?.message || JSON.stringify(data));
    }
  } catch (err) {
    const errMsg = err.response?.data?.message || err.response?.data || err.message;

    // If sender ID not approved, retry with N-Alert
    if (typeof errMsg === 'string' && errMsg.toLowerCase().includes('sender') && attempt === 1) {
      console.warn(`Sender ID issue, retrying with N-Alert...`);
      const origSender = process.env.TERMII_SENDER_ID;
      process.env.TERMII_SENDER_ID = 'N-Alert';
      const result = await sendSMSWithRetry(to, message, MAX_RETRIES); // skip further retries
      process.env.TERMII_SENDER_ID = origSender;
      return result;
    }

    if (attempt < MAX_RETRIES) {
      console.warn(`SMS attempt ${attempt} failed for +${normalized}: ${errMsg}. Retrying in ${RETRY_DELAY_MS * attempt / 1000}s...`);
      await sleep(RETRY_DELAY_MS * attempt);
      return sendSMSWithRetry(to, message, attempt + 1);
    }
    console.error(`❌ SMS failed after ${MAX_RETRIES} attempts for +${normalized}: ${errMsg}`);
    return { success: false, reason: errMsg };
  }
};

// Process SMS queue sequentially to avoid rate limits
const processQueue = async () => {
  if (isProcessing || smsQueue.length === 0) return;
  isProcessing = true;
  while (smsQueue.length > 0) {
    const { to, message } = smsQueue.shift();
    await sendSMSWithRetry(to, message);
    if (smsQueue.length > 0) await sleep(500); // small delay between sends
  }
  isProcessing = false;
};

// ─── Public API ───────────────────────────────────────────────────────────────

// Queue SMS (non-blocking)
exports.sendSMS = (to, message) => {
  smsQueue.push({ to, message });
  // Process async — don't await so it never blocks the main flow
  setImmediate(processQueue);
};

// Send push notification via Firebase
exports.sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;
  try {
    const admin = require('../config/firebase');
    const stringData = {};
    Object.keys(data).forEach(k => { stringData[k] = String(data[k]); });
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: stringData
    });
    console.log(`🔔 Push sent`);
  } catch (err) {
    console.warn('Push notification error:', err.message);
  }
};

// Notify multiple users — push + SMS in parallel
exports.notifyUsers = async (users, title, body, smsMessage) => {
  if (!users?.length) return;
  const promises = users.map(async (user) => {
    if (user.fcmToken) {
      await exports.sendPushNotification(user.fcmToken, title, body);
    }
    if (user.phone && smsMessage) {
      exports.sendSMS(user.phone, smsMessage); // queued, non-blocking
    }
  });
  await Promise.allSettled(promises);
};

// Get current SMS queue status (for debugging)
exports.getSMSQueueStatus = () => ({
  queued: smsQueue.length,
  processing: isProcessing
});
