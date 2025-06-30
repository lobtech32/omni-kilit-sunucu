// Graceful Shutdown için gelişmiş handler
let isShuttingDown = false;

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
    
    // 3. 3 sn içinde çık
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