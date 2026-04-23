require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');
const fs      = require('fs');

const app = express();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── Middleware ──────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadDir));

// ── Routes ──────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/chatbot',       require('./routes/chatbot'));

const { drugsRouter, interRouter, healthRouter } = require('./routes/other');
app.use('/api/drugs',         drugsRouter);
app.use('/api/interactions',  interRouter);
app.use('/api/health',        healthRouter);

// ── Health check ─────────────────────────────────────────────────
app.get('/api/ping', (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  res.json({
    status:    'ok',
    message:   '🚀 RxAI Backend is running!',
    version:   '2.0.0',
    timestamp: new Date().toISOString(),
    services: {
      ocr:      '✅ Tesseract.js v5 (LSTM)',
      nlp:      '✅ Fuse.js fuzzy matching + Regex NER',
      drugs:    '✅ 30 drugs loaded',
      interactions: '✅ 8 interactions loaded',
      chatbot:  apiKey && apiKey !== 'your_anthropic_api_key_here' ? '✅ Anthropic Claude (live)' : '⚠️  Fallback mode (set ANTHROPIC_API_KEY)',
    }
  });
});

// ── 404 ──────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `${req.method} ${req.path} not found` }));

// ── Error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   RxAI Backend  v2.0 — PRODUCTION    ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  URL:  http://localhost:${PORT}          ║`);
  console.log(`║  Ping: http://localhost:${PORT}/api/ping ║`);
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  Drugs: 30 | Interactions: 8          ║`);
  const k = process.env.ANTHROPIC_API_KEY;
  const chatStatus = k && k !== 'your_anthropic_api_key_here' ? '✅ Claude API active' : '⚠️  Fallback mode';
  console.log(`║  Chatbot: ${chatStatus.padEnd(28)}║`);
  console.log('╚══════════════════════════════════════╝\n');
});
