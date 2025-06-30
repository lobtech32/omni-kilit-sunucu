const express = require('express');
const net = require('net');
const app = express();
const PORT = process.env.PORT || 3000;

// Memory Optimizasyon
const MAX_MEMORY = 6144; // 6GB sınır
setInterval(() => {
  const usedMB = process.memoryUsage().rss / 1024 / 1024;
  if(usedMB > MAX_MEMORY) {
    console.warn(`Memory limit aşıldı: ${usedMB.toFixed(2)}MB`);
    process.exit(1);
  }
}, 5000);

// TCP Connection Pool
const socketPool = new Map();

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    memory: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB`,
    connections: socketPool.size
  });
});

// Kilit Açma Endpoint'i
app.get('/ac', async (req, res) => {
  try {
    const socket = net.createConnection({
      host: process.env.TCP_PROXY_HOST || 'metro.proxy.rlwy.net',
      port: process.env.TCP_PROXY_PORT || 14722,
      timeout: 3000
    });

    socket.on('connect', () => {
      const timestamp = new Date().toISOString().replace(/[-:T.Z]/g,'').slice(2,14);
      const komut = `*CMDS,OM,862205059210023,${timestamp},L0,0,12345,${Math.floor(Date.now()/1000)}#\n`;
      socket.write(Buffer.concat([Buffer.from([0xFF, 0xFF]), Buffer.from(komut)]));
      socketPool.set(socket.remoteAddress, socket);
    });

    socket.on('data', () => res.status(200).send('OK'));
    socket.on('error', (err) => res.status(500).send(err.message));
    socket.on('close', () => socketPool.delete(socket.remoteAddress));

  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Graceful Shutdown
['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, () => {
    console.log(`${signal} alındı, ${socketPool.size} bağlantı kapatılıyor...`);
    socketPool.forEach(sock => sock.destroy());
    setTimeout(() => process.exit(0), 5000);
  });
});

// Web Arayüzü
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Production Sunucu ${PORT} portunda (${process.env.NODE_ENV || 'development'})`);
  console.log(`🔗 TCP Proxy: ${process.env.TCP_PROXY_HOST || 'metro.proxy.rlwy.net'}:${process.env.TCP_PROXY_PORT || 14722}`);
});