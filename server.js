const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// API Routes
const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

// Auth Routes
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// Serve React build if it exists (production mode)
const reactBuildPath = path.join(__dirname, 'frontend', 'dist');
const fs = require('fs');

if (fs.existsSync(reactBuildPath)) {
  // Production: serve React build
  app.use(express.static(reactBuildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(reactBuildPath, 'index.html'));
  });

  console.log('📦 Serving React production build from frontend/dist');
} else {
  // Development fallback: serve old public/ files
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  console.log('🔧 Dev mode: serving public/ (use Vite for React frontend)');
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AquaTrace Groundwater Intelligence API',
    version: '2.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET  /api/summary',
      'GET  /api/zones',
      'GET  /api/zones/:id',
      'GET  /api/grace',
      'GET  /api/rainfall',
      'GET  /api/recharge-zones',
      'POST /api/predict',
      'GET  /api/iot/sensors',
      'POST /api/auth/register',
      'POST /api/auth/login',
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║  💧 AquaTrace — Groundwater Intelligence API         ║
║  Server running at http://localhost:${PORT}              ║
║  API available at http://localhost:${PORT}/api          ║
║  Health check at http://localhost:${PORT}/health        ║
╚══════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
