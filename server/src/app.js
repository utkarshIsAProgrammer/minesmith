import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initDatabase } from './db/database.js';
import chatRoutes from './routes/chat.js';
import modRoutes from './routes/mods.js';
import packRoutes from './routes/packs.js';
import settingsRoutes from './routes/settings.js';
import { getUserSettings } from './services/settings.js';
import { requestLogger } from './middleware/logger.js';

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
import versionsRoutes from './routes/versions.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://cdn.modrinth.com", "https://modrinth.com"],
      connectSrc: ["'self'", "https://api.modrinth.com", "https://api.groq.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new TypeError('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
  maxAge: 86400,
}));

// Request logging
app.use(requestLogger);

// Body parsing with size limit
app.use(express.json({ limit: '10kb' }));

// Global rate limiter — 100 requests per minute
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use(globalLimiter);

// Strict rate limiter for chat/AI endpoints — 10 per minute
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI rate limit exceeded. Please wait before trying again.' },
});

// Strict rate limiter for download endpoints — 5 per minute
const downloadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Download rate limit exceeded. Please wait.' },
});

// Input sanitization middleware
function sanitizeInput(req, res, next) {
  if (req.body) {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      }
    }
  }
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    }
  }
  if (req.params) {
    for (const key of Object.keys(req.params)) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = req.params[key].trim();
      }
    }
  }
  next();
}
app.use(sanitizeInput);

// Routes with specific rate limits
app.use('/api/chat', aiLimiter, chatRoutes);
app.use('/api/mods', modRoutes);
app.use('/api/packs', downloadLimiter, packRoutes);
app.use('/api/settings', aiLimiter, settingsRoutes);
app.use('/api/versions', versionsRoutes);

// Health check — basic for public, detailed with ?admin=token
app.get('/api/health', (req, res) => {
  const adminToken = process.env.HEALTH_ADMIN_TOKEN;
  const isAdmin = adminToken && req.query.admin === adminToken;

  const health = {
    status: 'ok',
    service: 'MineSmith API',
    timestamp: new Date().toISOString(),
  };

  if (isAdmin) {
    const uptime = process.uptime();
    const mem = process.memoryUsage();
    const settings = getUserSettings();
    health.uptime = Math.floor(uptime);
    health.uptimeHuman = formatUptime(uptime);
    health.memory = {
      rss: formatBytes(mem.rss),
      heapUsed: formatBytes(mem.heapUsed),
      heapTotal: formatBytes(mem.heapTotal),
    };
    health.providers = {
      groq: { configured: !!settings.groqApiKey, model: settings.groqModel || null },
      ollama: { url: settings.ollamaBaseUrl || 'http://localhost:11434', model: settings.ollamaModel || null },
    };
  }

  res.json(health);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler — no stack traces in production
app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An internal error occurred'
    : err.message;

  res.status(statusCode).json({ error: message });
});

// Log but don't crash on unhandled errors
process.on('uncaughtException', (err) => {
  // Prevent crash — log and continue
});
process.on('unhandledRejection', (err) => {
  // Prevent crash — log and continue
});

// Start server
async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    // Server running — no sensitive info logged
  });
}

start().catch(() => {
  process.exit(1);
});
