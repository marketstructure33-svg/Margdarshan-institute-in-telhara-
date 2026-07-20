const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const proxyRoute = `
  app.get("/api/proxy-pdf", async (req, res) => {
    try {
      let url = req.query.url;
      if (!url || typeof url !== 'string') {
        return res.status(400).send("Missing url parameter");
      }
      
      // Handle Google Drive links
      if (url.includes('drive.google.com')) {
        const match = url.match(/\\/d\\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          url = \`https://drive.google.com/uc?export=download&id=\${match[1]}\`;
        }
      }

      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).send(response.statusText);
      }
      res.setHeader('Content-Type', 'application/pdf');
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);
    } catch (e) {
      res.status(500).send(e.message);
    }
  });
`;

serverCode = serverCode.replace(
  /app\.get\("\/api\/proxy-pdf", async \(req, res\) => \{[\s\S]*?\}\s*\}\);\s*app\.post\("\/api\/gemini-chat"/,
  proxyRoute.trim() + '\n\n  app.post("/api/gemini-chat"'
);

fs.writeFileSync('server.ts', serverCode);

// Update getProxyUrl in frontend files to proxy all http urls
const getProxyUrlStr = `
const getProxyUrl = (url: string) => {
  if (url && url.startsWith('http')) {
    return \`/api/proxy-pdf?url=\${encodeURIComponent(url)}\`;
  }
  return url;
};
`;

let aiQuiz = fs.readFileSync('src/components/sections/AIQuizSection.tsx', 'utf8');
aiQuiz = aiQuiz.replace(
  /const getProxyUrl = \(url\) => \{[\s\S]*?return url;\n\};/,
  getProxyUrlStr.trim()
);
fs.writeFileSync('src/components/sections/AIQuizSection.tsx', aiQuiz);

let pdfSec = fs.readFileSync('src/components/sections/PdfSection.tsx', 'utf8');
pdfSec = pdfSec.replace(
  /const getProxyUrl = \(url\) => \{[\s\S]*?return url;\n\};/,
  getProxyUrlStr.trim()
);
fs.writeFileSync('src/components/sections/PdfSection.tsx', pdfSec);

