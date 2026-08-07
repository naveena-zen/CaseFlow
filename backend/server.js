require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Security HTTP Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for local dev with Bootstrap CDN
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Enable CORS
const allowedOrigins = process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN, 'http://localhost:5000', 'http://127.0.0.1:5000'] : '*';
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 login/register attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many authentication attempts. Please try again later.' } }
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve uploads as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/deadlines', require('./routes/deadlines'));

// Fallback: serve index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global 404 Handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'API endpoint not found' } });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred on the server'
    }
  });
});

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 CaseFlow Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  });
}

module.exports = app;
