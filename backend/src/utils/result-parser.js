const cheerio = require('cheerio');

function extractResults(html) {
  const $ = cheerio.load(html);
  
  let semester = null;
  let sgpa = null;
  let cgpa = null;
  let rawResultStatus = '';
  let backlog = false;

  const diagnostics = [];
  const log = (msg) => diagnostics.push(msg);

  log('Parser initialized');

  // Find all text and look for keywords
  const allText = $('body').text().replace(/\s+/g, ' ').toUpperCase();

  // Detect backlog keywords
  const backlogKeywords = ['FAIL', 'XP', 'BACKLOG', 'ABSENT', 'NOT QUALIFIED'];
  for (const keyword of backlogKeywords) {
    if (allText.includes(keyword)) {
      backlog = true;
      rawResultStatus = keyword;
      log(`Backlog detected via keyword: ${keyword}`);
      break;
    }
  }

  // Strategy: look for tables and cells
  $('td, th, span, div, strong, b').each((i, el) => {
    const text = $(el).text().trim().toUpperCase();
    
    // SGPA
    if (text === 'SGPA' || text.includes('SGPA:')) {
      const value = $(el).next().text().trim() || $(el).parent().next().text().trim() || text.replace(/[^0-9.]/g, '');
      const num = parseFloat(value);
      if (!isNaN(num) && sgpa === null) {
        sgpa = num;
        log(`Found SGPA: ${sgpa}`);
      }
    }

    // CGPA / YGPA
    if (text === 'CGPA' || text.includes('CGPA:') || text === 'YGPA' || text.includes('YGPA:')) {
      const value = $(el).next().text().trim() || $(el).parent().next().text().trim() || text.replace(/[^0-9.]/g, '');
      const num = parseFloat(value);
      if (!isNaN(num) && cgpa === null) {
        cgpa = num;
        log(`Found CGPA/YGPA: ${cgpa}`);
      }
    }

    // Semester
    if (text.includes('SEMESTER') && semester === null) {
      // Try to extract semester number
      const match = text.match(/SEMESTER\s*-?\s*(\d+)/) || $(el).next().text().trim().match(/(\d+)/);
      if (match && match[1]) {
        semester = match[1];
        log(`Found Semester: ${semester}`);
      }
    }
    
    // Status (if not already backlog)
    if (text === 'RESULT' || text === 'STATUS') {
      const value = $(el).next().text().trim() || $(el).parent().next().text().trim();
      if (value && !rawResultStatus) {
        rawResultStatus = value;
        log(`Found Result Status: ${rawResultStatus}`);
        
        // Double check backlog keywords
        for (const keyword of backlogKeywords) {
          if (value.toUpperCase().includes(keyword)) {
            backlog = true;
            log(`Backlog confirmed from status value: ${keyword}`);
            break;
          }
        }
      }
    }
  });

  if (backlog) {
    sgpa = null;
    cgpa = null;
    log('Backlog active, nullified SGPA and CGPA');
  }

  // Fallback defaults
  if (!semester) semester = '1';

  return {
    semester,
    sgpa,
    cgpa,
    backlog,
    rawResultStatus: rawResultStatus || (backlog ? 'BACKLOG' : 'PASS'),
    diagnostics
  };
}

module.exports = { extractResults };
