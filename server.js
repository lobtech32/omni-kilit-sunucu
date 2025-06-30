const express = require('express');
const net = require('net');
const app = express();
const PORT = process.env.PORT || 3000; // Railway otomatik port atayacak

// Web Arayüzü
app.get('/', (req, res) => res.send(`
  <h1>Kilit Kontrol</h1>
  <button onclick="fetch('/ac').then(alert)">KİLİDİ AÇ</button>
`));

// Kilidi Açma Endpoint'i
app.get('/ac', (req, res) => {
  const socket = net.createConnection(14722, 'metro.proxy.rlwy.net', () => {
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g,'').slice(2,14);
    const komut = `*CMDS,OM,862205059210023,${timestamp},L0,0,12345,${Math.floor(Date.now()/1000)}#\n`;
    socket.write(Buffer.concat([Buffer.from([0xFF, 0xFF]), Buffer.from(komut)]));
    res.send('Kilidi açma komutu gönderildi!');
  });
});

app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor`));
