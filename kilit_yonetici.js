class KilitYonetici {
  constructor() {
    this.kilitler = new Map(); // IMEI -> KilitBilgisi
  }

  komutIsle(mesaj, socket) {
    const { imei, komut, parametreler } = mesaj;
    
    if (!this.kilitler.has(imei)) {
      this.kilitler.set(imei, { socket, sonGorulme: Date.now() });
    }

    switch(komut) {
      case 'Q0': // Kontrol
        this.kontrolIsle(imei, parametreler);
        break;
      case 'H0': // Kalp atışı
        this.kalpAtisiIsle(imei, parametreler);
        break;
      case 'L0': // Kilidi açma yanıtı
        this.kilidAcmaYanitiIsle(imei, parametreler);
        break;
      // Diğer komutlar...
      default:
        console.log(`Bilinmeyen komut: ${komut}`);
    }
  }

  komutGonder(imei, komut, parametreler) {
    if (!this.kilitler.has(imei)) {
      throw new Error(`${imei} kilit bağlı değil`);
    }
    
    const kilit = this.kilitler.get(imei);
    const zamanDamgasi = this.gecerliZamanDamgasi();
    const mesaj = `*CMDS,OM,${imei},${zamanDamgasi},${komut},${parametreler}#\n`;
    
    // 0xFFFF öneki ekle
    const buffer = Buffer.concat([
      Buffer.from([0xFF, 0xFF]),
      Buffer.from(mesaj)
    ]);
    
    kilit.socket.write(buffer);
  }

  // Komuta özel işleyiciler
  kontrolIsle(imei, voltaj) {
    console.log(`${imei} kilit kontrolü. Voltaj: ${parseInt(voltaj)/100}V`);
  }

  kalpAtisiIsle(imei, parametreler) {
    const [durum, voltaj, sinyal] = parametreler.split(',');
    console.log(`${imei} kalp atışı: Durum=${durum}, Voltaj=${voltaj}, Sinyal=${sinyal}`);
  }

  kilidAcmaYanitiIsle(imei, parametreler) {
    const [sonuc, kullaniciId, zamanDamgasi] = parametreler.split(',');
    console.log(`${imei} kilidi açma sonucu: ${sonuc === '0' ? 'Başarılı' : 'Başarısız'}`);
    this.komutGonder(imei, 'Re', 'L0'); // Onay gönder
  }

  // Yardımcı metodlar
  gecerliZamanDamgasi() {
    const simdi = new Date();
    return `${simdi.getFullYear().toString().substr(2)}${(simdi.getMonth()+1).toString().padStart(2, '0')}${simdi.getDate().toString().padStart(2, '0')}${simdi.getHours().toString().padStart(2, '0')}${simdi.getMinutes().toString().padStart(2, '0')}${simdi.getSeconds().toString().padStart(2, '0')}`;
  }
}

module.exports = KilitYonetici;
