const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const proxyRoute = `
  app.get("/api/proxy-pdf", async (req, res) => {
    try {
      const url = req.query.url;
      if (!url || typeof url !== 'string') {
        return res.status(400).send("Missing url parameter");
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

code = code.replace("app.post(\"/api/gemini-chat\",", proxyRoute + "\n  app.post(\"/api/gemini-chat\",");

fs.writeFileSync('server.ts', code);
