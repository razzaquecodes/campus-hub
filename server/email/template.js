function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateWelcomeEmail({ fullName, rollNumber, appUrl }) {
  const safeName = escapeHtml(fullName || 'Student');
  const safeRoll = escapeHtml(rollNumber || '');
  const openUrl = appUrl || 'https://app.campushub.in';

  const subject = `Welcome to Campus Hub, ${safeName}`;

  const html = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      /* Simple responsive styles suitable for Gmail / Apple Mail / Outlook */
      body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background:#f4f6fb; }
      .container { max-width: 680px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; }
      .header { background: linear-gradient(90deg,#2563eb,#1d4ed8); color: #fff; padding: 20px; text-align: left; }
      .brand { font-weight: 800; font-size: 20px; }
      .content { padding: 24px; color: #111827; }
      .button { display:inline-block; padding: 12px 18px; background: #1d4ed8; color: #fff; border-radius: 8px; text-decoration:none; }
      .footer { font-size:12px; color:#6b7280; padding: 16px 24px; }
      @media only screen and (max-width:480px) { .content { padding:16px; } .header { padding:16px; } }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="brand">Campus Hub</div>
        <div style="margin-top:6px; opacity:0.95; font-size:13px;">Your official academic companion</div>
      </div>
      <div class="content">
        <h1 style="margin:0 0 8px 0; font-size:20px;">Welcome, ${safeName} 👋</h1>
        <p style="margin:0 0 16px 0; color:#374151;">Thanks for verifying your MAKAUT account (Roll: ${safeRoll}). Campus Hub will keep you updated on results, announcements, attendance and more.</p>

        <p style="margin:0 0 18px 0;"><a class="button" href="${openUrl}">Open Campus Hub</a></p>

        <h3 style="margin-top:20px; font-size:15px;">Install on iPhone</h3>
        <ol>
          <li>Open Safari and navigate to ${openUrl}.</li>
          <li>Tap the Share button and choose "Add to Home Screen".</li>
          <li>Confirm to install Campus Hub on your Home Screen.</li>
        </ol>

        <h3 style="margin-top:12px; font-size:15px;">Install on Android</h3>
        <ol>
          <li>Open Chrome and go to ${openUrl}.</li>
          <li>Tap the browser menu (⋮) and select "Install app" or "Add to Home screen".</li>
          <li>Confirm to install Campus Hub.</li>
        </ol>

        <div style="margin-top:16px; padding:12px; background:#f3f4f6; border-radius:8px;">
          <strong>Security notice:</strong>
          <p style="margin:6px 0 0 0;">Campus Hub does not permanently store your MAKAUT password.</p>
        </div>

        <p style="margin-top:18px; color:#6b7280; font-size:13px;">If you did not sign up for Campus Hub, you can ignore this email.</p>
      </div>
      <div class="footer">© ${new Date().getFullYear()} Campus Hub — To manage preferences, contact your campus administrator.</div>
    </div>
  </body>
  </html>`;

  const text = `Welcome to Campus Hub, ${fullName}\n\n` +
    `Thanks for verifying your MAKAUT account (Roll: ${rollNumber}).\n` +
    `Open Campus Hub: ${openUrl}\n\n` +
    `Install on iPhone: Open Safari → Share → Add to Home Screen.\n` +
    `Install on Android: Open Chrome → Menu → Install app / Add to Home screen.\n\n` +
    `Security notice: Campus Hub does not permanently store your MAKAUT password.\n\n` +
    `If you did not sign up, ignore this message.`;

  return { subject, html, text };
}

module.exports = { generateWelcomeEmail };
