/**
 * verify-student.js
 *
 * MAKAUT student verification route handler.
 *
 * Flow:
 *   1. Fetch MAKAUT login page → extract CSRF token + session cookies
 *   2. Fetch the login form to get a fresh _token (form token)
 *   3. POST credentials to /checkLogin with cookie jar maintained
 *   4. On success → GET /student/student-basic-details
 *   5. Parse student HTML with cheerio
 *   6. Return verified student data
 *
 * SECURITY:
 *   - Password is NEVER logged, stored, or forwarded beyond this handler.
 *   - password variable is cleared (set to null) before the function returns.
 */

const express = require('express');
const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { extractResults } = require('../utils/result-parser');
const { supabase } = require('../lib/supabase');

const router = express.Router();

// ─── Constants ────────────────────────────────────────────────────────────────
const MAKAUT_BASE = 'https://makaut1.ucanapply.com/smartexam/public';
const LOGIN_PAGE_URL = `${MAKAUT_BASE}/student`;
const LOGIN_FORM_URL = `${MAKAUT_BASE}/get-login-form?typ=5`;
const CHECK_LOGIN_URL = `${MAKAUT_BASE}/checkLogin`;
const STUDENT_DETAILS_URL = `${MAKAUT_BASE}/student/student-basic-details`;

// Browser-like User-Agent to avoid bot detection
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ─── Debug logger ─────────────────────────────────────────────────────────────
function log(step, message, meta = {}) {
  const ts = new Date().toISOString().slice(11, 23);
  const safeEntries = Object.entries(meta).filter(([k]) => k !== 'password');
  const metaStr = safeEntries.length ? ` ${JSON.stringify(Object.fromEntries(safeEntries))}` : '';
  console.log(`[verify-student][${ts}] [${step}] ${message}${metaStr}`);
}

// ─── Helper: create a fresh axios instance with cookie jar ────────────────────
function createSessionClient() {
  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      maxRedirects: 5,
      timeout: 30_000,
      headers: {
        'User-Agent': USER_AGENT,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    }),
  );
  return { client, jar };
}

// ─── Step 1: Fetch login page and extract page-level CSRF meta token ──────────
async function fetchLoginPage(client) {
  log('STEP-1', 'Fetching MAKAUT login page', { url: LOGIN_PAGE_URL });

  const response = await client.get(LOGIN_PAGE_URL, {
    headers: { Referer: 'https://makaut1.ucanapply.com/' },
  });

  const $ = cheerio.load(response.data);
  const metaCsrf = $('meta[name="csrf-token"]').attr('content');

  if (!metaCsrf) {
    log('STEP-1', 'WARNING: No csrf-token meta tag found on login page');
  } else {
    log('STEP-1', 'CSRF meta token extracted', { csrfLength: metaCsrf.length });
  }

  return { html: response.data, metaCsrf };
}

// ─── Step 2: Fetch the login form JSON to get the form _token ─────────────────
async function fetchLoginForm(client, metaCsrf) {
  log('STEP-2', 'Fetching login form', { url: LOGIN_FORM_URL });

  const response = await client.get(LOGIN_FORM_URL, {
    headers: {
      Referer: LOGIN_PAGE_URL,
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      ...(metaCsrf ? { 'X-CSRF-TOKEN': metaCsrf } : {}),
    },
  });

  if (typeof response.data !== 'object' || !response.data.success) {
    throw new Error(
      `Login form fetch failed: ${JSON.stringify(response.data).slice(0, 200)}`,
    );
  }

  // Extract _token from the returned HTML fragment
  const $ = cheerio.load(response.data.html);
  const formToken = $('input[name="_token"]').val();

  if (!formToken) {
    log('STEP-2', 'WARNING: No _token found in login form HTML');
  } else {
    log('STEP-2', 'Form _token extracted', { tokenLength: formToken.length });
  }

  return formToken;
}

// ─── Step 3: Submit login credentials ────────────────────────────────────────
async function submitLogin(client, formToken, rollNumber, password) {
  log('STEP-3', 'Submitting login credentials to /checkLogin', {
    url: CHECK_LOGIN_URL,
    rollNumber,
    // password deliberately excluded from log
  });

  const params = new URLSearchParams();
  params.append('_token', formToken || '');
  params.append('typ', '5');
  params.append('username', rollNumber);
  params.append('password', password);

  let response;
  try {
    response = await client.post(CHECK_LOGIN_URL, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: LOGIN_PAGE_URL,
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        ...(formToken ? { 'X-CSRF-TOKEN': formToken } : {}),
      },
      // Don't throw on non-2xx so we can inspect the body
      validateStatus: () => true,
    });
  } finally {
    // Clear password from memory as soon as the request is done
    // eslint-disable-next-line no-param-reassign
    password = null;
  }

  log('STEP-3', 'Login response received', {
    status: response.status,
    contentType: response.headers['content-type'],
    dataType: typeof response.data,
    dataSample:
      typeof response.data === 'string'
        ? response.data.slice(0, 300)
        : JSON.stringify(response.data).slice(0, 300),
  });

  return response;
}

// ─── Step 3b: Detect login failure from response ──────────────────────────────
function detectLoginFailure(response) {
  const data = response.data;

  // JSON response with explicit failure
  if (typeof data === 'object') {
    if (data.success === false || data.status === false) {
      const reason = data.message || data.msg || data.error || 'Authentication rejected';
      log('STEP-3b', 'Login rejected (JSON)', { reason });
      return reason;
    }
    // Some portals return { redirect: '...' } on success
    if (data.redirect || data.url || data.success === true) {
      log('STEP-3b', 'Login appears successful (JSON redirect/success)');
      return null; // no failure
    }
  }

  // HTML response — look for error indicators
  if (typeof data === 'string') {
    const lower = data.toLowerCase();

    // These strings typically appear in error messages
    const errorPatterns = [
      'invalid credentials',
      'invalid username',
      'invalid password',
      'wrong password',
      'authentication failed',
      'login failed',
      'incorrect',
      'does not exist',
      'not found',
      'please check',
    ];

    for (const pattern of errorPatterns) {
      if (lower.includes(pattern)) {
        log('STEP-3b', 'Login failed (HTML error pattern found)', { pattern });
        return 'Invalid credentials';
      }
    }

    // If the response HTML contains the student dashboard elements, login succeeded
    if (
      lower.includes('student-basic-details') ||
      lower.includes('student dashboard') ||
      lower.includes('logout') ||
      lower.includes('welcome')
    ) {
      log('STEP-3b', 'Login appears successful (HTML success markers)');
      return null;
    }

    // HTTP 200 but the login page was re-rendered (redirect back to login = failure)
    if (lower.includes('postlogin') || lower.includes('sign in')) {
      log('STEP-3b', 'Login failed — re-rendered login form detected');
      return 'Invalid credentials';
    }
  }

  // HTTP 4xx / 5xx are failures
  if (response.status >= 400) {
    log('STEP-3b', 'Login failed (HTTP error status)', { status: response.status });
    return `Server returned HTTP ${response.status}`;
  }

  // Default: assume ok and let the next step validate by trying to fetch details
  log('STEP-3b', 'Login outcome ambiguous — will proceed to fetch student details');
  return null;
}

// ─── Step 4: Fetch student basic details page ─────────────────────────────────
async function fetchStudentDetails(client) {
  log('STEP-4', 'Fetching student basic details', { url: STUDENT_DETAILS_URL });

  const response = await client.get(STUDENT_DETAILS_URL, {
    headers: {
      Referer: LOGIN_PAGE_URL,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    },
    validateStatus: () => true,
  });

  log('STEP-4', 'Student details response', {
    status: response.status,
    contentType: response.headers['content-type'],
    bodyLength: typeof response.data === 'string' ? response.data.length : 'N/A',
  });

  return response;
}

// ─── Step 5: Parse student details from HTML ──────────────────────────────────
function parseStudentDetails(html, rollNumber) {
  log('STEP-5', 'Parsing student HTML', { htmlLength: html.length });

  const $ = cheerio.load(html);

  // Log page title for debugging
  const pageTitle = $('title').text().trim();
  log('STEP-5', 'Page title found', { pageTitle });

  // Dump table structure for debugging
  const tables = $('table');
  log('STEP-5', 'Tables found on page', { count: tables.length });

  /**
   * The MAKAUT student-basic-details page renders a definition/key-value table.
   * We extract values by looking for known label patterns.
   */
  const fields = {
    fullName: '',
    rollNumber: rollNumber, // fallback to input roll number
    registrationNumber: '',
    email: '',
    mobile: '',
    instituteName: '',
    courseName: '',
    abcId: '',
    profilePhotoUrl: '',
    currentSemester: '', // NEW: extracted from MAKAUT portal
  };

  // Strategy 1: Parse <tr> rows where first <td> is label, second <td> is value
  $('tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 2) return;

    const label = $(cells[0]).text().trim().toLowerCase().replace(/\s+/g, ' ');
    const value = $(cells[1]).text().trim();

    if (!value) return;

    log('STEP-5-ROW', 'Table row', { label, value: value.slice(0, 80) });

    if (label.includes('student name') || label.includes('full name') || label.includes('name')) {
      if (!fields.fullName) fields.fullName = value;
    }
    if (label.includes('roll') && (label.includes('no') || label.includes('number'))) {
      fields.rollNumber = value;
    }
    if (label.includes('registration') && (label.includes('no') || label.includes('number'))) {
      fields.registrationNumber = value;
    }
    if (label.includes('email') || label.includes('e-mail')) {
      fields.email = value;
    }
    if (label.includes('mobile') || label.includes('phone') || label.includes('contact')) {
      fields.mobile = value;
    }
    if (label.includes('institute') || label.includes('college') || label.includes('institution')) {
      fields.instituteName = value;
    }
    if (label.includes('course') || label.includes('programme') || label.includes('program')) {
      fields.courseName = value;
    }
    if (label.includes('abc') || label.includes('apaar')) {
      fields.abcId = value;
    }
    
    // NEW: Extract current semester - look for "semester" in label
    if ((label.includes('semester') || label.includes('current sem') || label.includes('sem')) && !fields.currentSemester) {
      // Try to extract a number from the value
      const semMatch = value.match(/(\d+)/);
      if (semMatch && semMatch[1]) {
        const semNum = parseInt(semMatch[1], 10);
        if (semNum >= 1 && semNum <= 8) {
          fields.currentSemester = String(semNum);
          log('STEP-5', 'Current semester extracted from row', { semester: fields.currentSemester });
        }
      }
    }
  });

  // Strategy 2: Look for labeled input elements / definition lists
  $('dt, .label, .field-label, strong, b').each((_, el) => {
    const label = $(el).text().trim().toLowerCase();
    const value =
      $(el).next('dd, .value, .field-value').text().trim() ||
      $(el).parent().next().text().trim();

    if (!value) return;

    if ((label.includes('student name') || label === 'name') && !fields.fullName) {
      fields.fullName = value;
    }
    if (label.includes('registration') && !fields.registrationNumber) {
      fields.registrationNumber = value;
    }
    if (label.includes('email') && !fields.email) {
      fields.email = value;
    }
    if (label.includes('mobile') && !fields.mobile) {
      fields.mobile = value;
    }
    if (label.includes('institute') && !fields.instituteName) {
      fields.instituteName = value;
    }
    if (label.includes('course') && !fields.courseName) {
      fields.courseName = value;
    }
    if (label.includes('abc') && !fields.abcId) {
      fields.abcId = value;
    }
  });

  // Strategy 3: Look for specific CSS classes common in MAKAUT portals
  const profileNameEl = $('.profile-name, .student-name, #studentName, .name-field');
  if (profileNameEl.length && !fields.fullName) {
    fields.fullName = profileNameEl.first().text().trim();
  }

  // Strategy 4: Extract Profile Photo URL
  let photoUrl =
    $('img.profile-img, img.student-photo, img[src*="photo"], img[src*="student"], .profile-photo img').attr('src') ||
    $('img').filter((_, el) => {
      const src = $(el).attr('src') || '';
      return src.toLowerCase().includes('profile') || src.toLowerCase().includes('student');
    }).first().attr('src') ||
    '';

  if (photoUrl) {
    // Make absolute URL if relative
    if (photoUrl.startsWith('/')) {
      photoUrl = `https://makaut1.ucanapply.com${photoUrl}`;
    } else if (!photoUrl.startsWith('http')) {
      photoUrl = `https://makaut1.ucanapply.com/${photoUrl}`;
    }
    fields.profilePhotoUrl = photoUrl;
  }

  // Strategy 5: FALLBACK - If semester not found in tables, try to extract from page text
  if (!fields.currentSemester) {
    // Look for patterns like "Current Semester: 4" or "Semester - 4" in the page text
    const bodyText = $('body').text();
    const semesterPatterns = [
      /current\s*semester[:\s]*(\d+)/i,
      /semester[:\s]*(\d+)/i,
      /sem\s*[-:]\s*(\d+)/i,
      /year\s*sem[:\s]*(\d+)/i,
      /sem\/year[:\s]*(\d+)/i,
    ];
    
    for (const pattern of semesterPatterns) {
      const match = bodyText.match(pattern);
      if (match && match[1]) {
        const semNum = parseInt(match[1], 10);
        if (semNum >= 1 && semNum <= 8) {
          fields.currentSemester = String(semNum);
          log('STEP-5', 'Current semester extracted from page text', { semester: fields.currentSemester, pattern: pattern.source });
          break;
        }
      }
    }
  }

  log('STEP-5', 'Parsed student fields', {
    fullName: fields.fullName,
    rollNumber: fields.rollNumber,
    registrationNumber: fields.registrationNumber,
    email: fields.email ? '***' : '',
    mobile: fields.mobile ? '***' : '',
    instituteName: fields.instituteName,
    courseName: fields.courseName,
    abcId: fields.abcId,
    profilePhotoUrl: fields.profilePhotoUrl ? 'present' : 'none',
    currentSemester: fields.currentSemester || 'not found',
  });

  return fields;
}

// ─── POST /verify-student ─────────────────────────────────────────────────────
router.post('/verify-student', async (req, res) => {
  const requestStart = Date.now();
  log('REQUEST', 'POST /verify-student received', {
    ip: req.ip,
    contentType: req.headers['content-type'],
  });

  // ── 1. Validate input ──────────────────────────────────────────────────────
  const { rollNumber, password } = req.body;

  if (!rollNumber || typeof rollNumber !== 'string') {
    return res.status(400).json({ verified: false, message: 'rollNumber is required.' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ verified: false, message: 'password is required.' });
  }

  const trimmedRoll = rollNumber.trim();
  if (trimmedRoll.length < 3) {
    return res.status(400).json({ verified: false, message: 'rollNumber appears invalid.' });
  }

  log('REQUEST', 'Input validated', { rollNumber: trimmedRoll });

  // ── 2. Create session client ───────────────────────────────────────────────
  const { client } = createSessionClient();

  try {
    // ── STEP 1: Fetch login page, get CSRF meta token ──────────────────────
    let metaCsrf;
    try {
      ({ metaCsrf } = await fetchLoginPage(client));
    } catch (err) {
      log('STEP-1', 'ERROR fetching login page', { error: err.message });
      return res.status(502).json({
        verified: false,
        message: 'Unable to reach MAKAUT portal. Please try again later.',
        debug: { step: 'fetchLoginPage', error: err.message },
      });
    }

    // ── STEP 2: Fetch login form, get form _token ──────────────────────────
    let formToken;
    try {
      formToken = await fetchLoginForm(client, metaCsrf);
    } catch (err) {
      log('STEP-2', 'ERROR fetching login form', { error: err.message });
      return res.status(502).json({
        verified: false,
        message: 'Unable to load MAKAUT login form. Please try again later.',
        debug: { step: 'fetchLoginForm', error: err.message },
      });
    }

    // ── STEP 3: Submit credentials ─────────────────────────────────────────
    let loginResponse;
    try {
      loginResponse = await submitLogin(client, formToken, trimmedRoll, password);
    } catch (err) {
      log('STEP-3', 'ERROR submitting login', { error: err.message });
      return res.status(502).json({
        verified: false,
        message: 'Login request failed. Please check your connection and try again.',
        debug: { step: 'submitLogin', error: err.message },
      });
    }

    // ── STEP 3b: Detect login failure ──────────────────────────────────────
    const loginError = detectLoginFailure(loginResponse);
    if (loginError) {
      log('RESULT', 'Authentication failed', { reason: loginError });
      return res.status(401).json({
        verified: false,
        message: 'Invalid MAKAUT credentials',
        debug: { reason: loginError },
      });
    }

    // ── STEP 4: Fetch student details ──────────────────────────────────────
    let detailsResponse;
    try {
      detailsResponse = await fetchStudentDetails(client);
    } catch (err) {
      log('STEP-4', 'ERROR fetching student details', { error: err.message });
      return res.status(502).json({
        verified: false,
        message: 'Failed to retrieve student profile after login.',
        debug: { step: 'fetchStudentDetails', error: err.message },
      });
    }

    // If details page redirected back to login, credentials were wrong
    if (
      detailsResponse.status === 302 ||
      (typeof detailsResponse.data === 'string' &&
        detailsResponse.data.toLowerCase().includes('postlogin'))
    ) {
      log('RESULT', 'Redirected to login after trying to access details — credentials invalid');
      return res.status(401).json({
        verified: false,
        message: 'Invalid MAKAUT credentials',
      });
    }

    if (detailsResponse.status !== 200) {
      log('STEP-4', 'Unexpected HTTP status on details page', {
        status: detailsResponse.status,
      });
      return res.status(502).json({
        verified: false,
        message: `MAKAUT portal returned HTTP ${detailsResponse.status} for student details.`,
      });
    }

    // ── STEP 5: Parse student HTML ─────────────────────────────────────────
    let student;
    try {
      student = parseStudentDetails(detailsResponse.data, trimmedRoll);
    } catch (err) {
      log('STEP-5', 'ERROR parsing student HTML', { error: err.message });
      return res.status(500).json({
        verified: false,
        message: 'Failed to parse student data from MAKAUT portal.',
        debug: { step: 'parseStudentDetails', error: err.message },
      });
    }

    // ── STEP 5b: RESULT PAGE CAPTURE ───────────────────────────────────────
    try {
      const RESULT_URL = `${MAKAUT_BASE}/student/student-activity`;
      log('STEP-5b', 'Fetching student result activity', { url: RESULT_URL });
      
      const resultResponse = await client.get(RESULT_URL, {
        headers: { Referer: STUDENT_DETAILS_URL },
        validateStatus: () => true,
      });

      if (resultResponse.status === 200 && typeof resultResponse.data === 'string') {
        const html = resultResponse.data;
        
        // 1. Save debug HTML
        const debugDir = path.join(__dirname, '../../debug');
        if (!fs.existsSync(debugDir)) {
          fs.mkdirSync(debugDir, { recursive: true });
        }
        fs.writeFileSync(path.join(debugDir, 'result.html'), html);
        log('RESULT PARSER', 'Saved debug/result.html', { length: html.length });

        // 2. Parse Results
        const parsedResult = extractResults(html);
        log('RESULT PARSER', 'Parsed Result', parsedResult);

        // 3. Upsert to Supabase
        if (parsedResult.semester) {
          const { error: dbError } = await supabase
            .from('student_results')
            .upsert({
              roll_number: student.rollNumber,
              semester: parsedResult.semester,
              sgpa: parsedResult.sgpa,
              cgpa: parsedResult.cgpa,
              backlog: parsedResult.backlog,
              raw_result_status: parsedResult.rawResultStatus,
              updated_at: new Date().toISOString()
            }, { onConflict: 'roll_number, semester' });
            
          if (dbError) {
            log('RESULT DB', 'Failed to upsert student_results', { error: dbError.message });
          } else {
            log('RESULT DB', 'Successfully upserted student_results', { roll: student.rollNumber, semester: parsedResult.semester });
          }
        }
      } else {
        log('STEP-5b', 'Failed to fetch result page', { status: resultResponse.status });
      }
    } catch (err) {
      log('RESULT', 'Non-fatal error capturing result page', { error: err.message });
    }

    // ── SUCCESS ────────────────────────────────────────────────────────────
    const elapsedMs = Date.now() - requestStart;
    log('RESULT', 'Verification successful', {
      rollNumber: student.rollNumber,
      instituteName: student.instituteName,
      currentSemester: student.currentSemester || 'unknown',
      elapsedMs,
    });

    // Include currentSemester in the response
    const response = {
      verified: true,
      student: {
        ...student,
        // Ensure currentSemester is included (defaults to '1' if not found)
        currentSemester: student.currentSemester || '1',
      },
    };
    
    return res.status(200).json(response);
  } catch (unexpectedErr) {
    // Catch-all — should never reach here but guard anyway
    log('ERROR', 'Unexpected error in /verify-student', {
      error: unexpectedErr.message,
      stack: unexpectedErr.stack?.slice(0, 500),
    });
    return res.status(500).json({
      verified: false,
      message: 'An unexpected error occurred. Please try again.',
      debug: { error: unexpectedErr.message },
    });
  }
});

module.exports = router;
