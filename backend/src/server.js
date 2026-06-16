const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const contentRoutes = require('./routes/content');
const communityRoutes = require('./routes/community');
const searchRoutes = require('./routes/search');
const adminRoutes = require('./routes/admin');

const app = express();

// ─── Connect to MongoDB ──────────────────────────────────────────────────────
connectDB();

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet());

// FIX: Strip trailing slashes from CLIENT_URL before adding to allowedOrigins
// to prevent CORS mismatches (e.g. "https://example.com/" vs "https://example.com")
const normalizeOrigin = (url) => url && url.replace(/\/$/, '');

const allowedOrigins = [
  'http://localhost:3000',
  'https://agri-connect-y6ti.vercel.app',
  normalizeOrigin(process.env.CLIENT_URL),
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);

    if (!allowedOrigins.includes(origin)) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 100 : 5,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' },
  skipSuccessfulRequests: true,
  skip: (req) => req.method === 'OPTIONS',
});

app.use(globalLimiter);

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Agri-Connect API is running',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🌾 Agri-Connect API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

// ─── Keep-alive ping for Render free tier ────────────────────────────────────
// FIX: Only run in production, and guard against missing global fetch
// (Node < 18 doesn't have fetch built-in — use node-fetch or upgrade Node)
if (process.env.NODE_ENV === 'production') {
  const BACKEND_URL =
    process.env.RENDER_EXTERNAL_URL || 'https://agri-connect-yrkl.onrender.com';

  const pingHealth = () => {
    // Guard: global fetch available in Node 18+
    if (typeof fetch !== 'function') {
      console.warn('Keep-alive: fetch not available. Upgrade to Node 18+ or install node-fetch.');
      return;
    }
    fetch(`${BACKEND_URL}/api/health`)
      .then(() => console.log('Keep-alive ping sent'))
      .catch((err) => console.error('Keep-alive failed:', err.message));
  };

  setInterval(pingHealth, 14 * 60 * 1000); // every 14 minutes
}

module.exports = app;
