// server.js
const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket signaling server is running.\n");
});

const wss = new WebSocketServer({ server });
const clients = new Map();

console.log(`🚀 Signaling server is starting on port ${PORT}...`);

wss.on("connection", (ws) => {
  let clientId = null;

  ws.on("message", (message) => {
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
    } catch (e) {
      console.error("Invalid JSON:", message.toString());
      return;
    }

    if (parsedMessage.type === "register" && parsedMessage.id) {
      clientId = parsedMessage.id;
      clients.set(clientId, ws);
      console.log(`✅ Client registered: ${clientId}`);
      return;
    }

    const { to, from, ...data } = parsedMessage;
    if (to) {
      const targetWs = clients.get(to);
      if (targetWs && targetWs.readyState === WebSocket.OPEN) {
        console.log(`➡️  Forwarding '${data.type}' from ${from} to ${to}`);
        targetWs.send(JSON.stringify({ from, ...data }));
      } else {
        console.warn(`⚠️  Client ${to} not found or not connected.`);
      }
    }
  });

  ws.on("close", () => {
    if (clientId) {
      console.log(`❌ Client disconnected: ${clientId}`);
      clients.delete(clientId);
    }
  });

  ws.on("error", (error) => console.error("WebSocket error:", error));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is listening on http://0.0.0.0:${PORT}`);
});
