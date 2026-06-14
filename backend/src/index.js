/**
 * index.js — Campus Hub Backend Server
 *
 * Starts an Express server with:
 *   - CORS enabled for the Expo app (localhost)
 *   - JSON body parsing
 *   - POST /verify-student  — MAKAUT student verification
 *
 * Environment variables (optional):
 *   PORT  — port to listen on (default: 3000)
 */

const express = require('express');
const cors = require('cors');

const verifyStudentRouter = require('./routes/verify-student');
const resultRouter = require('./routes/result');
const verificationRouter = require('./routes/verification');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────

// Allow requests from the Expo dev server, localhost, and Vercel PWA
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no-origin (curl, Postman, mobile native apps)
      if (!origin) return callback(null, true);

      if (
        origin.startsWith('http://localhost') || 
        origin.startsWith('exp://') || 
        origin.endsWith('.vercel.app') || 
        origin === 'https://campus-hub.vercel.app'
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  }),
);
app.options('*', cors()); // Enable preflight for all routes

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request logger ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[server][${ts}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// MAKAUT verification and results
app.use('/', verifyStudentRouter);
app.use('/', resultRouter);
app.use('/', verificationRouter);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] Campus Hub backend running on http://localhost:${PORT}`);
  console.log(`[server] Health check: http://localhost:${PORT}/health`);
  console.log(`[server] MAKAUT verify: POST http://localhost:${PORT}/verify-student`);
});
