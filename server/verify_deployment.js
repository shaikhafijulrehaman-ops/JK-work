require('dotenv').config();
const db = require('./db');

const REQUIRED_ENV = [
  'DATABASE_URL',
  'JWT_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET'
];

async function verify() {
  console.log('🏁 [Deployment Verification] Auditing environment variables...');
  const missing = REQUIRED_ENV.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ [Deployment Verification] Missing critical env variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  console.log('🔌 [Deployment Verification] Connecting to Supabase database...');
  try {
    const connected = await db.connectDb();
    if (!connected) {
      console.error('❌ [Deployment Verification] Unable to connect to PostgreSQL database.');
      process.exit(1);
    }

    console.log('🔍 [Deployment Verification] Verifying critical tables exist...');
    await db.user.findFirst();
    await db.booking.findFirst();
    await db.service.findFirst();
    await db.servicePartner.findFirst();
    await db.review.findFirst();
    await db.promoCode.findFirst();
    await db.notification.findFirst();

    console.log('✅ [Deployment Verification] All checks passed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ [Deployment Verification] Verification failed:', err.message);
    process.exit(1);
  }
}

verify();
