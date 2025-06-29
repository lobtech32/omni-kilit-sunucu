const net = require('net');
const KilitYonetici = require('./kilit_yonetici');
const config = require('./config');

class TCPSunucu {
  constructor() {
    this.sunucu = net.createServer(this.baglantiyiIsle.bind(this));
    this.kilitYonetici = new KilitYonetici();
  }

  baslat() {
    this.sunucu.listen(config.tcp.port, () => {
      console.log(`TCP sunucusu ${config.tcp.port} portunda dinleniyor`);
    });
  }

  baglantiyiIsle(socket) {
    console.log('Yeni kilit bağlantısı:', socket.remoteAddress);
    
    socket.on('data', (veri) => {
      try {
        const mesaj = this.mesajiCoz(veri);
        this.kilitYonetici.komutIsle(mesaj, socket);
      } catch (hata) {
        console.error('Mesaj işleme hatası:', hata);
      }
    });

    socket.on('end', () => {
      console.log('Kilit bağlantısı kesildi');
    });
  }

  mesajiCoz(veri) {
    // 0xFFFF önekini kaldır
    const buffer = veri.slice(0, 2).toString('hex') === 'ffff' ? veri.slice(2) : veri;
    const mesajStr = buffer.toString().trim();
    
    // Mesaj formatı: *CMDR,OM,IMEI,zamanDamgasi,komut,parametreler#
    const parcalar = mesajStr.split(',');
    return {
      baslik: parcalar[0],
      uretici: parcalar[1],
      imei: parcalar[2],
      zamanDamgasi: parcalar[3],
      komut: parcalar[4],
      parametreler: parcalar.slice(5).join(',').replace('#', '')
    };
  }
}

module.exports = TCPSunucu;
