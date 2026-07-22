const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes("const whiteboardWss")) {
  code = code.replace(
    /const wss = new WebSocketServer\(\{ server, path: '\/live' \}\);/,
    `const wss = new WebSocketServer({ server, path: '/live' });

  const whiteboardWss = new WebSocketServer({ server, path: '/whiteboard-sync' });
  whiteboardWss.on("connection", (clientWs) => {
    clientWs.on("message", (msg) => {
      // Broadcast to all other clients
      whiteboardWss.clients.forEach((client) => {
        if (client !== clientWs && client.readyState === 1 /* OPEN */) {
          client.send(msg);
        }
      });
    });
  });`
  );
  fs.writeFileSync('server.ts', code);
}
