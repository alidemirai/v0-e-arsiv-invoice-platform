# GIB Proxy Server - Kurulum ve Kullanım Kilavuzu

Bu dosya, GIB e-Arşiv verilerine Vercel uygulamasından erişmek için gerekli bir proxy sunucusunun kurulum adımlarını anlatır.

## Neden Gerekli?

- GIB sunucusu CORS engellemesi yapıyor
- Vercel'deki IP'ler GIB tarafından sınırlandırılıyor
- Kendi PC'nizde bir proxy çalıştırarak bu kısıtlamaları aşabiliriz

## Kurulum (5 Dakika)

### 1. Node.js Kur
Henüz kurulu değilse: https://nodejs.org/en/ (LTS sürümü indir)

### 2. Proxy Sunucuyu Ayarla

**Windows:**
\`\`\`bash
# Komut istemi veya PowerShell'i aç ve şu komutları çalıştır:
cd C:\Users\[KullaniciAdi]\Desktop
mkdir gib-proxy
cd gib-proxy
\`\`\`

**Mac/Linux:**
\`\`\`bash
cd ~/Desktop
mkdir gib-proxy
cd gib-proxy
\`\`\`

### 3. Gerekli Dosyaları Kopyala

1. Vercel projesindeki `gib-proxy-server.js` dosyasını indir
2. `gib-proxy-package.json` dosyasını `package.json` olarak kaydet
3. Her iki dosyayı da `gib-proxy` klasörüne kopyala

### 4. Bağımlılıkları Yükle

Terminal/Komut İstemi'nde (gib-proxy klasörünün içinde):
\`\`\`bash
npm install
\`\`\`

### 5. Proxy Sunucuyu Başlat

\`\`\`bash
npm start
\`\`\`

Başarılı olursa şöyle görünecek:
\`\`\`
╔════════════════════════════════════════════╗
║     GIB Proxy Server Baslatildi             ║
║                                            ║
║  Sunucu: http://localhost:3001            ║
║  Telefon/Tabletten baglanti icin:         ║
║  http://[PC-IP]:3001                      ║
╚════════════════════════════════════════════╝
\`\`\`

## PC'nin IP Adresini Bul

**Windows:**
- Komut İstemi'ni aç ve yazın: `ipconfig`
- "IPv4 Address" satırını ara (örn: 192.168.1.100)

**Mac:**
- Terminal'i aç ve yazın: `ifconfig`
- "inet" satırını ara (en.x veya en.y)

**Linux:**
- Terminal'i aç ve yazın: `hostname -I`

## Vercel Uygulamasında Proxy Sunucuyu Kullan

Uygulamayı açarken:
- PC'niz açıksa: Otomatik olarak PC'deki proxy sunucuya bağlanır
- Telefonda kullanırken: Telefon ile PC'nin aynı WiFi'de olması gerekir

## Sorun Giderme

**"ECONNREFUSED" hatası:**
- Proxy sunucunun çalışıp çalışmadığını kontrol et
- `npm start` ile yeniden başlat

**Telefon bağlanamıyor:**
- PC ve telefon aynı WiFi'de mi?
- PC'nin firewall'ında port 3001'i aç

**GIB giriş hatası:**
- Kullanıcı kodu ve şifreyi kontrol et
- ivd.gib.gov.tr'de hesabına giriş yap

## Alternatif: Cloudflare Workers (24/7)

PC açık olmak istemiyorsan, Cloudflare Workers'ı kullanabilirsin (tamamen ücretsiz, 24/7):
1. Cloudflare.com'a git (kayıt ol)
2. Workers seçeneğini aç
3. `gib-proxy-cloudflare.js` dosyasını dağıt

(Bunu sonra ekleyeceğim)
