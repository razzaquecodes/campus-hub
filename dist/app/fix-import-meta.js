const fs = require('fs');
const path = require('path');

// Directories requested for the search
const directoriesToSearch = ['src', 'app', 'services', 'hooks', 'utils', 'repositories', 'public'];

function walkAndReplace(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkAndReplace(fullPath);
    } else if (/\.(js|jsx|ts|tsx)$/.test(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes('import.meta.env')) {
        console.log(`[FIXED] Replaced import.meta.env in: ${fullPath}`);
        content = content.replace(/import\.meta\.env/g, 'process.env');
        fs.writeFileSync(fullPath, content, 'utf8');
      }
      
      if (content.match(/import\.meta\.(url|hot)/)) {
        console.warn(`[WARNING] Manual fix required for import.meta.url/hot in: ${fullPath}`);
      }
    }
  }
}

console.log('Searching for import.meta usage...');
directoriesToSearch.forEach(walkAndReplace);
console.log('Done!');