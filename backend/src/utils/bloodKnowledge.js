// Blood donation knowledge base for the text chatbot
const knowledge = [
  // Eligibility
  { keywords: ['age', 'old', 'young', 'minimum age', 'maximum age'], answer: 'You must be between 18 and 60 years old to donate blood. Some countries allow 16-17 with parental consent.' },
  { keywords: ['weight', 'heavy', 'light', 'kg', 'minimum weight'], answer: 'You must weigh at least 50kg (110 lbs) to donate blood safely.' },
  { keywords: ['pregnant', 'pregnancy', 'breastfeeding', 'nursing'], answer: 'Pregnant women and breastfeeding mothers cannot donate blood. Wait at least 6 months after delivery or after stopping breastfeeding.' },
  { keywords: ['medication', 'medicine', 'drug', 'pills', 'antibiotics'], answer: 'Some medications disqualify you temporarily. Antibiotics require a 7-day wait after finishing. Blood thinners like warfarin may permanently disqualify you. Always inform the staff about your medications.' },
  { keywords: ['tattoo', 'piercing', 'ink'], answer: 'If you got a tattoo or piercing in the last 6 months, you may need to wait before donating, depending on local regulations and whether a licensed facility was used.' },
  { keywords: ['travel', 'malaria', 'country', 'abroad'], answer: 'Travel to malaria-endemic regions may require a 3-12 month deferral. Check with your local blood bank for specific country restrictions.' },
  { keywords: ['alcohol', 'drink', 'drunk', 'beer', 'wine'], answer: 'Do not donate if you have consumed alcohol in the last 24 hours. Alcohol dehydrates you and affects blood quality.' },
  { keywords: ['sick', 'cold', 'flu', 'fever', 'illness', 'infection'], answer: 'Do not donate if you have a cold, flu, fever, or any active infection. Wait until you have fully recovered for at least 2 weeks.' },
  { keywords: ['diabetes', 'diabetic', 'insulin'], answer: 'Diabetics on oral medication can usually donate. Those on insulin are generally deferred. Consult your doctor and the blood bank.' },
  { keywords: ['blood pressure', 'hypertension', 'bp'], answer: 'You can donate if your blood pressure is between 90/60 and 180/100 mmHg at the time of donation. Controlled hypertension on medication is usually acceptable.' },
  { keywords: ['heart', 'cardiac', 'heart disease', 'heart attack'], answer: 'People with heart disease, history of heart attack, or cardiac surgery are generally deferred from donating blood.' },
  { keywords: ['cancer', 'tumor'], answer: 'Most cancer patients are deferred from donating. Some cancers in full remission may be eligible after several years — consult your blood bank.' },
  { keywords: ['hiv', 'aids', 'hepatitis', 'std', 'sexually transmitted'], answer: 'People with HIV, AIDS, or active Hepatitis B/C cannot donate blood. This is to protect recipients.' },

  // Process
  { keywords: ['how long', 'duration', 'time', 'takes'], answer: 'The whole donation process takes about 45-60 minutes. The actual blood draw takes only 8-10 minutes. Registration and health screening take the rest of the time.' },
  { keywords: ['how much', 'units', 'volume', 'ml', 'pint'], answer: 'A standard whole blood donation is about 450-500ml (roughly 1 pint). This is less than 10% of your total blood volume.' },
  { keywords: ['pain', 'hurt', 'needle', 'painful'], answer: 'You may feel a small pinch when the needle is inserted, but the donation itself is not painful. Most donors describe it as a minor discomfort.' },
  { keywords: ['recover', 'recovery', 'after donation', 'feel after'], answer: 'Your body replaces the donated plasma within 24 hours. Red blood cells are fully replaced within 4-6 weeks. Most donors feel fine immediately after.' },
  { keywords: ['eat', 'food', 'before donation', 'fasting', 'drink water'], answer: 'Eat a healthy meal and drink plenty of water before donating. Avoid fatty foods. After donation, have a snack and extra fluids.' },
  { keywords: ['how often', 'frequency', 'again', 'next donation', 'interval'], answer: 'Whole blood can be donated every 90 days (3 months). Platelets can be donated every 2 weeks. Plasma every 28 days.' },
  { keywords: ['blood type', 'type o', 'type a', 'type b', 'ab', 'universal'], answer: 'O- is the universal donor (can give to anyone). AB+ is the universal recipient (can receive from anyone). Knowing your blood type helps match you with recipients faster.' },

  // Benefits
  { keywords: ['benefit', 'why donate', 'reason', 'good for', 'health benefit'], answer: 'Donating blood can reduce iron levels (beneficial for some), may lower risk of heart disease, and gives you a free mini health check. Most importantly, one donation can save up to 3 lives!' },
  { keywords: ['save', 'lives', 'impact', 'help'], answer: 'One blood donation can save up to 3 lives. Blood is needed every 2 seconds somewhere in the world. There is no substitute for human blood.' },

  // After donation
  { keywords: ['dizzy', 'faint', 'lightheaded', 'nausea', 'side effect'], answer: 'Some donors feel dizzy or lightheaded after donating. Lie down, raise your legs, and drink fluids. This usually passes quickly. Inform the staff immediately if you feel unwell.' },
  { keywords: ['exercise', 'gym', 'workout', 'sport', 'physical activity'], answer: 'Avoid strenuous exercise or heavy lifting for 24 hours after donating. Light activity is fine.' },
  { keywords: ['bruise', 'bruising', 'mark', 'arm'], answer: 'Some bruising at the needle site is normal. Apply a cold pack and keep the bandage on for a few hours. It should fade within a week.' },

  // General
  { keywords: ['where', 'location', 'blood bank', 'center', 'donate where'], answer: 'You can donate at hospitals, blood banks, or mobile donation drives. Use the Map section in this app to find the nearest blood bank.' },
  { keywords: ['safe', 'safety', 'sterile', 'clean', 'needle reuse'], answer: 'Blood donation is completely safe. All needles and equipment are sterile and used only once. You cannot get any disease from donating blood.' },
  { keywords: ['blood shortage', 'shortage', 'demand', 'supply'], answer: 'Blood cannot be manufactured — it can only come from donors. Shortages are common, especially for rare blood types. Regular donors are critically important.' },
  { keywords: ['first time', 'first donation', 'new donor', 'never donated'], answer: 'Welcome! First-time donors go through a health screening, fill a form, and are monitored closely. Staff will guide you through every step. It\'s a simple and rewarding experience.' },
  { keywords: ['reward', 'paid', 'money', 'compensation'], answer: 'In most countries, blood donation is voluntary and unpaid. Some centers offer small refreshments or tokens of appreciation, but selling blood is generally not allowed.' }
];

// Find best matching answer
const getBotResponse = (message) => {
  const lower = message.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const item of knowledge) {
    const score = item.keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && bestScore > 0) return bestMatch.answer;

  // Fallback responses
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return 'Hello! 👋 I\'m BloodBot. Ask me anything about blood donation — eligibility, process, benefits, or what to expect!';
  }
  if (lower.includes('thank')) {
    return 'You\'re welcome! Every question you ask brings you one step closer to saving a life. 🩸';
  }

  return 'I\'m not sure about that. Try asking about eligibility, the donation process, blood types, recovery, or benefits. You can also contact your nearest blood bank for specific questions.';
};

module.exports = { getBotResponse };
