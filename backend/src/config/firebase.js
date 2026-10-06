const admin = require('firebase-admin');

let initialized = false;

const initFirebase = () => {
  if (initialized || admin.apps.length) return;
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail ||
        projectId === 'your_firebase_project_id') {
      console.warn('Firebase: credentials not configured, push notifications disabled');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: privateKey.replace(/\\n/g, '\n'),
        clientEmail
      })
    });
    initialized = true;
    console.log('Firebase initialized');
  } catch (err) {
    console.warn('Firebase init failed:', err.message);
  }
};

// Lazy proxy — only init when actually used
module.exports = new Proxy({}, {
  get(_, prop) {
    initFirebase();
    if (!initialized || !admin.apps.length) {
      // Return no-op stubs so app doesn't crash
      if (prop === 'messaging') return () => ({ send: async () => {} });
      return admin[prop];
    }
    return admin[prop];
  }
});
