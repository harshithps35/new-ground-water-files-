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

const fs = require('fs');

// Serve React production build
const reactBuildPath = path.join(__dirname, 'frontend', 'dist');

if (fs.existsSync(reactBuildPath)) {
  app.use(express.static(reactBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(reactBuildPath, 'index.html'));
  });
  console.log('🚀 Serving Production Build: frontend/dist');
} else {
  console.warn('⚠️ Warning: frontend/dist not found. Run "npm run build" in the frontend directory.');
  app.get('/', (req, res) => {
    res.status(500).send('Frontend build missing. Please run build script.');
  });
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
