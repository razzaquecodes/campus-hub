Server email function

This folder contains a minimal transactional email server used by Campus Hub.

Trigger location (client): src/services/makaut-auth.service.ts -> upsertStudentProfile
- After upserting the student_profiles row, the client checks student_profiles.welcome_email_sent.
- If not set, the client requests POST /api/send-welcome-email on the configured API server.
- On success the client sets welcome_email_sent=true in the student_profiles row.

Deploy instructions:
- Deploy server/email/index.js as a small Node process or serverless function behind API_CONFIG.BASE_URL.
- Provide SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL environment variables.

Notes:
- Email templates live in server/email/template.js and produce both HTML and plain-text fallbacks.
- The server responds with 200 on success and appropriate error codes on failure.
