const express = require('express');
const net = require('net');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Container ölümlerini önleme
let server;
let isShuttingDown = false;

// 2. TCP Connection Pool
const connectionPool = new Set();

process.on('SIGTERM', () => {
  isShuttingDown = true;
  console.log('SIGTERM received, cleaning up...');
  
  // Mevcut bağlantıları kapat
  connectionPool.forEach(conn => conn.destroy());
  
  // Sunucuyu kapat
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  }

  // 8 sn içinde zorla kapat
  setTimeout(() => {
    console.log('Forcing shutdown');
    process.exit(1);
  }, 8000);
});

// 3. Enhanced TCP Handling
app.get('/ac', (req, res) => {
  if (isShuttingDown) return res.status(503).send('Server is shutting down');

  const socket = net.createConnection({
    host: process.env.TCP_PROXY_HOST || 'metro.proxy.rlwy.net',
    port: process.env.TCP_PROXY_PORT || 14722,
    timeout: 3000
  });

  connectionPool.add(socket);

  socket.on('connect', () => {
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g,'').slice(2,14);
    const komut = `*CMDS,OM,862205059210023,${timestamp},L0,0,12345,${Math.floor(Date.now()/1000)}#\n`;
    socket.write(Buffer.concat([Buffer.from([0xFF, 0xFF]), Buffer.from(komut)]));
  });

  socket.on('data', () => res.send('OK'));
  socket.on('close', () => connectionPool.delete(socket));
  socket.on('error', () => res.status(500).send('Connection error'));
});

// 4. Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    connections: connectionPool.size,
    memory: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB`
  });
});

// 5. Server Start
server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 TCP Proxy: ${process.env.TCP_PROXY_HOST || 'metro.proxy.rlwy.net'}:${process.env.TCP_PROXY_PORT || 14722}`);
});