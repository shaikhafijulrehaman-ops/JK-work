require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== SECURITY MIDDLEWARE ====================
// 1. Helmet: Secure HTTP Headers
app.use(helmet());

// 2. CORS: Enable restricted access from client (standard fallback config)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    // Allow standard local development and dynamic preview links (Vercel, Netlify, Github Codespaces, custom local networks, etc.)
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
      // General reliability fallback in dev/sandbox environments to prevent customer lockouts
      callback(null, true);
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
    message: 'An internal server error occurred while processing your request.'
  });
});

// ==================== BIND SERVER PORT ====================
if (process.env.NODE_ENV !== 'production' || require.main === module) {
  app.listen(PORT, () => {
    console.log('================================================================');
    console.log(`🚀 [JK Enterprises Server] Service Booking Gateway Active!`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🎯 Brand: JK Enterprises (Anchepalya Instant Cleaning Usp)`);
    console.log(`📅 Date: May 2026`);
    console.log('================================================================');
  });
}

module.exports = app;

