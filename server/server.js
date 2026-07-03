require('dotenv').config();

// ==================== ENVIRONMENT VARIABLE AUDIT ====================
const REQUIRED_ENV = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM'
];

const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  console.error('❌ [JK Enterprises Server] Missing Critical Environment Variables:');
  missingEnv.forEach(key => console.error(`   - ${key}`));
  console.error('💥 Crashing startup immediately for safety.');
  process.exit(1);
} else {
  console.log('✅ [JK Enterprises Server] Environment Variable Audit Passed.');
}

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const compression = require('compression');

const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable response compression (Gzip/Brotli)
app.use(compression());

// ==================== STRUCTURED LOGGER MIDDLEWARE ====================
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 500) {
      console.warn(`⚠️  [PERFORMANCE WARNING] ${req.method} ${req.originalUrl} took ${duration}ms (exceeds 500ms limit)`);
    } else {
      console.log(`[HTTP LOG] 🌍 ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Time: ${duration}ms | IP: ${req.ip}`);
    }
  });
  next();
});

// ==================== SECURITY MIDDLEWARE ====================
// 1. Helmet: Secure HTTP Headers with custom policies for third-party scripts (e.g. Razorpay)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

// Set explicit Permissions-Policy to allow Razorpay sensors and payments
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(self "https://api.razorpay.com" "https://checkout.razorpay.com"), gyroscope=(self "https://api.razorpay.com" "https://checkout.razorpay.com"), magnetometer=(self "https://api.razorpay.com" "https://checkout.razorpay.com"), payment=*'
  );
  next();
});

// 2. CORS: Enable restricted access from client
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Check custom whitelist from environment variables first
    if (process.env.ALLOWED_ORIGINS) {
      const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
    }

    // Allow standard local development and dynamic preview links
    const isAllowed = origin.startsWith('http://localhost') || 
                      origin.startsWith('http://127.0.0.1') || 
                      origin.includes('vercel.app') || 
                      origin.includes('netlify.app') ||
                      origin.includes('gitpod') ||
                      origin.includes('github') ||
                      origin.includes('codespace') ||
                      origin.includes('192.168.'); // local IP subnetworks
    
    if (isAllowed) {
      callback(null, true);
    } else {
      if (process.env.NODE_ENV === 'production') {
        callback(new Error('Not allowed by CORS'));
      } else {
        // Fallback for non-production environments to prevent customer lockouts
        callback(null, true);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature']
}));

// ==================== PARSER MIDDLEWARE ====================
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// ==================== LOGGER MIDDLEWARE ====================
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ==================== MOUNT API ROUTER ====================
app.use('/api', apiRouter);

// ==================== ROOT PING ENDPOINT ====================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '⚡ JK Enterprises Instant Home Services Platform API running successfully.',
    environment: process.env.NODE_ENV || 'development',
    dispatchUsp: 'Anchepalya in 9 Minutes'
  });
});

// ==================== HEALTH MONITORING ENDPOINTS ====================
const db = require('./db');
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');

// 1. General Health Check
app.get('/health', async (req, res) => {
  const dbHealth = await db.ping();
  res.status(200).json({
    status: 'UP',
    database: dbHealth.connected ? 'CONNECTED' : 'DISCONNECTED',
    timestamp: new Date()
  });
});

// 2. Database Health Check
app.get('/health/db', async (req, res) => {
  const dbHealth = await db.ping();
  if (dbHealth.connected) {
    return res.status(200).json({ status: 'UP', database: 'CONNECTED', message: 'Database connection verified.' });
  } else {
    return res.status(503).json({ 
      status: 'DOWN', 
      database: 'DISCONNECTED', 
      error: dbHealth.error || 'Database is offline.' 
    });
  }
});

// 3. Email/SMTP Health Check
app.get('/health/email', async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    await transporter.verify();
    return res.status(200).json({ status: 'UP', email: 'CONNECTED', message: 'SMTP connection verified.' });
  } catch (err) {
    return res.status(503).json({ status: 'DOWN', email: 'DISCONNECTED', error: err.message });
  }
});

// 4. Payment Gateway Health Check (Razorpay)
app.get('/health/payment', async (req, res) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    
    await razorpay.orders.all({ count: 1 });
    return res.status(200).json({ status: 'UP', payment: 'CONNECTED', message: 'Razorpay connection verified.' });
  } catch (err) {
    return res.status(503).json({ status: 'DOWN', payment: 'DISCONNECTED', error: err.message });
  }
});

// ==================== 404 CATCHALL ====================
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API resource path not found on JK Enterprises server.'
  });
});

// ==================== GLOBAL ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error('Unhandled System Exception:', err);
  res.status(500).json({
    success: false,
    message: 'We are currently experiencing a temporary service disruption. Please try again shortly.'
  });
});

// ==================== BIND SERVER PORT ====================
async function startServer() {
  // Bind the port immediately so that Render detects an open port
  app.listen(PORT, async () => {
    console.log('================================================================');
    console.log(`🚀 [JK Enterprises Server] Service Booking Gateway Active!`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🎯 Brand: JK Enterprises (Anchepalya Instant Cleaning Usp)`);
    console.log(`📅 Date: May 2026`);
    console.log('================================================================');

    console.log('🏁 [JK Enterprises Server] Running startup health checks...');
    
    // 1. Database Connection Check
    try {
      const dbConnected = await db.connectDb();
      if (!dbConnected) {
        console.error('❌ Startup check failed: Database connectivity verification failed.');
        if (process.env.NODE_ENV === 'production') {
          console.error('💥 Crashing server in production due to DB connection failure.');
          process.exit(1);
        }
      }
    } catch (err) {
      console.error('❌ Startup check failed: Exception during database verification:', err.message);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }

    // 2. SMTP Connectivity Check (with timeout to prevent hanging)
    try {
      console.log('🔌 Verifying SMTP email server connection...');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: parseInt(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        connectionTimeout: 10000, // 10s connection timeout
        greetingTimeout: 10000,   // 10s greeting timeout
        socketTimeout: 10000      // 10s socket timeout
      });
      await transporter.verify();
      console.log('✉️ [SMTP Gateway] Connection verified successfully.');
    } catch (err) {
      console.error('⚠️ [SMTP Gateway] Warning: SMTP email gateway verification failed:', err.message);
      // Do not hard-crash the entire HTTP server in production just because email is down/unreachable,
      // but print a clear warning so the admin can fix SMTP credentials.
    }

    console.log('✅ Startup health checks sequence completed.');
  });
}

if (process.env.NODE_ENV !== 'production' || require.main === module) {
  startServer();
}

module.exports = app;

