/*
 * Simple Express server to handle transactional emails for Campus Hub.
 * Deploy this as a small server or serverless function behind API_CONFIG.BASE_URL.
 *
 * Endpoints:
 *  - POST /api/send-welcome-email
 *
 * Environment variables required:
 *  - SMTP_HOST
 *  - SMTP_PORT
 *  - SMTP_USER
 *  - SMTP_PASS
 *  - FROM_EMAIL
 */

const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { generateWelcomeEmail } = require('./template');

const app = express();
app.use(bodyParser.json());

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@campushub.in';

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.warn('Warning: SMTP not fully configured. Email endpoints will return 503.');
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

app.post('/api/send-welcome-email', async (req, res) => {
  const { fullName, email, rollNumber, appUrl } = req.body || {};
  if (!email || !fullName) return res.status(400).json({ error: 'Missing email or fullName' });

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return res.status(503).json({ error: 'SMTP not configured' });
  }

  try {
    const { subject, html, text } = generateWelcomeEmail({ fullName, rollNumber, appUrl });
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
      text,
    });
    return res.json({ success: true });
  } catch (e) {
    console.error('send-welcome-email failed', e);
    return res.status(500).json({ error: 'Failed to send' });
  }
});

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Email server listening on ${port}`));
