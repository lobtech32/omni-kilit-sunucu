const express = require('express');
const net = require('net');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Container ölümlerini önleme
let isShuttingDown = false;

// 2. Enhanced TCP Connection Handling
const activeConnections = new Set();

const createConnection = () => {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({
      host: process.env.TCP_PROXY_HOST || 'metro.proxy.rlwy.net',
      port: process.env.TCP_PROXY_PORT || 14722,
      timeout: 5000
    });

    socket.on('connect', () => {
      activeConnections.add(socket);
      resolve(socket);
    });

    socket.on('error', (err) => {
      activeConnections.delete(socket);
      reject(err);
    });

    socket.on('close', () => activeConnections.delete(socket));
  });
};

// 3. Optimized Endpoints
app.get('/ac', async (req, res) => {
  if (isShuttingDown) return res.status(503).send('Server shutting down');

  try {
    const socket = await createConnection();
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g,'').slice(2,14);
    const komut = `*CMDS,OM,862205059210023,${timestamp},L0,0,12345,${Math.floor(Date.now()/1000)}#\n`;
    
    socket.write(Buffer.concat([
      Buffer.from([0xFF, 0xFF]),
      Buffer.from(komut)
    ]));
    
    res.send('OK');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 4. Advanced Process Handling
process.on('SIGTERM', () => {
  isShuttingDown = true;
  console.log('SIGTERM received, cleaning up...');
  
  // Mevcut bağlantıları kapat
  activeConnections.forEach(socket => {
    socket.destroy();
  });

  // 5 sn içinde kapan
  setTimeout(() => {
    console.log('Clean shutdown completed');
    process.exit(0);
  }, 5000);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Production server running on port ${PORT}`);
  console.log(`🔗 TCP Proxy: ${process.env.TCP_PROXY_HOST || 'metro.proxy.rlwy.net'}:${process.env.TCP_PROXY_PORT || 14722}`);
  console.log(`💻 Memory: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB used`);
});