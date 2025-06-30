const express = require('express');
const net = require('net');
const app = express();
const PORT = process.env.PORT || 3000;

// Health Check
app.get('/health', (req, res) => res.send('OK'));

// Kilit Açma Endpoint
app.get('/ac', (req, res) => {
  const socket = net.createConnection({
    host: 'metro.proxy.rlwy.net',
    port: 14722,
    timeout: 5000
  }, () => {
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g,'').slice(2,14);
    const komut = `*CMDS,OM,862205059210023,${timestamp},L0,0,12345,${Math.floor(Date.now()/1000)}#\n`;
    socket.write(Buffer.concat([Buffer.from([0xFF, 0xFF]), Buffer.from(komut)]));
    res.send('OK');
  });
  
  socket.on('error', (err) => res.status(500).send('Hata: '+err.message));
});

// Web Arayüz
app.get('/', (req, res) => res.sendFile(__dirname+'/index.html'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
  console.log(`TCP Proxy: 6789 portuna yönlendirme yapılıyor`);
});