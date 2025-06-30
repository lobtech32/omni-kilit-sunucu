const express = require('express');
const net = require('net');
const app = express();
const PORT = process.env.PORT || 3000;

// Container ölümlerini önleme
let server;
let isShuttingDown = false;
const activeConnections = new Set();

// SIGTERM Handler (Railway için kritik)
process.on('SIGTERM', () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('🛑 SIGTERM alındı, temiz kapanış başlatılıyor...');
  
  // 1. HTTP sunucusunu kapat
  server.close(() => {
    console.log('✅ HTTP sunucusu kapatıldı');
    
    // 2. TCP bağlantılarını temizle
    activeConnections.forEach(socket => {
      socket.destroy();
      console.log(`🔌 TCP bağlantısı kapatıldı: ${socket.remoteAddress}`);
    });
    
    // 3. Prosesi kapat
    setTimeout(() => {
      console.log('🚪 Proses kapatılıyor');
      process.exit(0);
    }, 3000);
  });

  // 8 sn sonra zorla kapat
  setTimeout(() => {
    console.log('⏰ Timeout, zorla kapatılıyor');
    process.exit(1);
  }, 8000);
});

// Kilit Açma Endpoint'i
app.get('/ac', (req, res) => {
  if (isShuttingDown) return res.status(503).send('Sunucu kapanıyor');

  const socket = net.createConnection({
    host: process.env.TCP_PROXY_HOST || 'metro.proxy.rlwy.net',
    port: process.env.TCP_PROXY_PORT || 14722,
    timeout: 5000
  });

  activeConnections.add(socket);

  socket.on('connect', () => {
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g,'').slice(2,14);
    const komut = `*CMDS,OM,862205059210023,${timestamp},L0,0,12345,${Math.floor(Date.now()/1000)}#\n`;
    socket.write(Buffer.concat([Buffer.from([0xFF, 0xFF]), Buffer.from(komut)]));
  });

  socket.on('data', () => res.send('OK'));
  socket.on('error', () => res.status(500).send('Bağlantı hatası'));
  socket.on('close', () => activeConnections.delete(socket));
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    memory: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB`,
    connections: activeConnections.size
  });
});

// Sunucuyu başlat
server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Production Sunucu ${PORT} portunda (${process.env.NODE_ENV || 'development'})`);
  console.log(`🔗 TCP Proxy: ${process.env.TCP_PROXY_HOST || 'metro.proxy.rlwy.net'}:${process.env.TCP_PROXY_PORT || 14722}`);
});