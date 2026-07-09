const fs = require('fs');

function addTools(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');

  // For the ones using direct fetch that don't have tools array yet
  const fetchBlockRegex = /const response = await fetch\(`https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-3\.5-flash:generateContent\?key=\$\{apiKey\}`,\s*\{\s*method:\s*'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json'\s*\},\s*body:\s*JSON\.stringify\(\{([\s\S]*?)\}\)\s*\}\);/g;

  code = code.replace(fetchBlockRegex, (match, p1) => {
    if (p1.includes('googleSearch')) return match;
    return `
      const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=\${apiKey}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ${p1.trim()},
          tools: [{ googleSearch: {} }]
        })
      });
    `;
  });

  fs.writeFileSync(filepath, code);
}

addTools('src/components/sections/AIStudyPlannerSection.tsx');
addTools('src/components/sections/NotesSection.tsx');

