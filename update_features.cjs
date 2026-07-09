const fs = require('fs');

function patchFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');

  // Find the fetch block
  const fetchBlockRegex = /const res = await fetch\(`https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/(.*?):generateContent\?key=\$\{apiKey\}`,\s*\{\s*method:\s*'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json'\s*\},\s*body:\s*JSON\.stringify\(\{([\s\S]*?)\}\)\s*\}\);/g;

  code = code.replace(fetchBlockRegex, (match, p1, p2) => {
    // Add logic to choose model based on if images are present
    // AdminAILab uses m.base64Images, AIChatSection uses m.image
    return `
      let modelToUse = 'gemini-1.5-flash';
      const hasImages = formattedMessages.some(m => m.parts.some(p => p.inlineData));
      if (hasImages) {
        modelToUse = 'gemini-1.5-pro';
      }

      const res = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/\${modelToUse}:generateContent?key=\${apiKey}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ${p2.trim()},
          tools: [{ googleSearch: {} }]
        })
      });
    `;
  });

  fs.writeFileSync(filepath, code);
}

patchFile('src/components/admin/AdminAILab.tsx');
patchFile('src/components/sections/AIChatSection.tsx');
