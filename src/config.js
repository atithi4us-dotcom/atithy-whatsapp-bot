require('dotenv').config();
const path = require('path');

function requiredEnv(name) {
  return process.env[name] || '';
}

function parsePrivateKey(value) {
  return (value || '').replace(/\\n/g, '\n');
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:3000',
  graphApiVersion: process.env.WHATSAPP_GRAPH_API_VERSION || 'v23.0',
  whatsappToken: requiredEnv('WHATSAPP_ACCESS_TOKEN'),
  whatsappPhoneNumberId: requiredEnv('WHATSAPP_PHONE_NUMBER_ID'),
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'atithy-whatsapp-webhook',
  dryRun: process.env.WHATSAPP_DRY_RUN === 'true',
  reviewerPhone: (process.env.AADHAAR_REVIEWER_PHONE || '919446600809').replace(/\D/g, ''),
  firebaseProjectId: requiredEnv('FIREBASE_PROJECT_ID'),
  firebaseClientEmail: requiredEnv('FIREBASE_CLIENT_EMAIL'),
  firebasePrivateKey: parsePrivateKey(requiredEnv('FIREBASE_PRIVATE_KEY')),
  firebaseStorageBucket: requiredEnv('FIREBASE_STORAGE_BUCKET'),
  googleApplicationCredentials: requiredEnv('GOOGLE_APPLICATION_CREDENTIALS'),
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: requiredEnv('ADMIN_PASSWORD'),
  sessionSecret: process.env.SESSION_SECRET || 'atithy-session-secret',
  sessionTtlMs: Number(process.env.SESSION_TTL_HOURS || 12) * 60 * 60 * 1000,
  atithySyncUrl: requiredEnv('ATITHY_APP_SYNC_URL'),
  atithySyncSecret: requiredEnv('ATITHY_APP_SYNC_SECRET'),
  publicDir: path.join(__dirname, 'public')
};
