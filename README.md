# Omni Kilit Sunucusu

Omni Horseshoe Kilitleri (OC30/OC32) için TCP/BLE sunucusu.

## Özellikler

- Kilit haberleşmesi için TCP sunucusu
- Komut çözümleme ve işleme
- Temel kilit yönetimi
- Railway deploy hazır

## Kurulum

1. Depoyu klonlayın: `git clone https://github.com/sizin-kullanici-adiniz/omni-kilit-sunucu.git`
2. `.env.ornek` dosyasını `.env` olarak kopyalayın ve düzenleyin
3. Bağımlılıkları yükleyin: `npm install`
4. Sunucuyu başlatın: `npm start`

## Ortam Değişkenleri

- `TCP_PORT`: TCP sunucusu portu (varsayılan: 6789)
- `BLE_AKTIF`: Bluetooth haberleşme (true/false)

## Temel Komutlar

### Kilidi açma (TCP)
```javascript
const imei = '123456789012345'; // Kilit IMEI
const kullaniciId = '1234';
const zamanDamgasi = Math.floor(Date.now() / 1000);

// 0 = sürüş süresini sıfırla, 1 = sıfırlama
kilitYonetici.komutGonder(imei, 'L0', `0,${kullaniciId},${zamanDamgasi}`);
