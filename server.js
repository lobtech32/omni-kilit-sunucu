const express = require('express');
const net = require('net');
const app = express();
const PORT = process.env.PORT || 3000; // Railway otomatik port atayabilir

// Health Check Endpoint (Railway için zorunlu)
app.get('/health', (req, res) => res.send('OK'));

// Kilit Açma Endpoint'i
app.get('/ac', (req, res) => {
  try {
    const socket = net.createConnection(14722, 'metro.proxy.rlwy.net', () => {
      const timestamp = new Date().toISOString().replace(/[-:T.Z]/g,'').slice(2,14);
      const komut = `*CMDS,OM,862205059210023,${timestamp},L0,0,12345,${Math.floor(Date.now()/1000)}#\n`;
      socket.write(Buffer.concat([Buffer.from([0xFF, 0xFF]), Buffer.from(komut)]));
      res.send('OK');
    });
  } catch (err) {
    res.status(500).send('Hata: ' + err.message);
  }
});

// Root Endpoint
app.get('/', (req, res) => res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>OMNI Kilit</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { font-family: Arial; text-align: center; margin-top: 50px; }
      button { 
        padding: 15px 30px; 
        font-size: 18px; 
        background: #0066ff; 
        color: white; 
        border: none; 
        border-radius: 5px;
      }
    </style>
  </head>
  <body>
    <h1>OMNI KİLİT KONTROL</h1>
    <button onclick="ac()">KİLİDİ AÇ</button>
    <script>
      function ac() {
        fetch('/ac')
          .then(res => res.ok ? alert('Başarılı!') : alert('Hata!'))
          .catch(err => alert('Bağlantı hatası: ' + err));
      }
    </script>
  </body>
  </html>
`));

app.listen(PORT, '0.0.0.0', () => console.log(`Sunucu ${PORT} portunda çalışıyor`));