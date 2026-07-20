const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('/api/health')) {
  code = code.replace("app.use(express.json({ limit: '50mb' }));", "app.use(express.json({ limit: '50mb' }));\n  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));");
  fs.writeFileSync('server.ts', code);
}
