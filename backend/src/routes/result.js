const express = require('express');
const fs = require('fs');
const path = require('path');
const { supabase } = require('../lib/supabase');
const { extractResults } = require('../utils/result-parser');

const router = express.Router();

function log(step, message, meta = {}) {
  const ts = new Date().toISOString().slice(11, 23);
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  console.log(`[RESULT API][${ts}] [${step}] ${message}${metaStr}`);
}

// ─── GET /student/:rollNumber/result ──────────────────────────────────────────
router.get('/student/:rollNumber/result', async (req, res) => {
  const { rollNumber } = req.params;
  
  if (!rollNumber) {
    return res.status(400).json({ success: false, message: 'rollNumber is required' });
  }

  log('REQUEST', `Fetching result for ${rollNumber}`);

  try {
    const { data, error } = await supabase
      .from('student_results')
      .select('*')
      .eq('roll_number', rollNumber)
      .order('semester', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        log('RESULT', `No results found for ${rollNumber}`);
        return res.status(404).json({ success: false, message: 'No results found' });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({ success: false, message: 'No results found' });
    }

    log('RESULT', `Fetched latest result for ${rollNumber}`, { semester: data.semester });

    return res.json({
      success: true,
      semester: parseInt(data.semester, 10) || data.semester,
      sgpa: data.sgpa,
      cgpa: data.cgpa,
      backlog: data.backlog
    });

  } catch (err) {
    log('ERROR', 'Failed to fetch result from DB', { error: err.message });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── GET /debug/result ────────────────────────────────────────────────────────
router.get('/debug/result', (req, res) => {
  log('REQUEST', 'GET /debug/result');
  
  const debugPath = path.join(__dirname, '../../debug/result.html');
  
  if (!fs.existsSync(debugPath)) {
    return res.status(404).json({ success: false, message: 'No debug HTML found. Please login first.' });
  }

  try {
    const html = fs.readFileSync(debugPath, 'utf8');
    const parsed = extractResults(html);

    return res.json({
      success: true,
      summary: {
        semester: parsed.semester,
        sgpa: parsed.sgpa,
        cgpa: parsed.cgpa,
        backlog: parsed.backlog,
        rawResultStatus: parsed.rawResultStatus
      },
      diagnostics: parsed.diagnostics
    });
  } catch (err) {
    log('ERROR', 'Failed to parse debug HTML', { error: err.message });
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
