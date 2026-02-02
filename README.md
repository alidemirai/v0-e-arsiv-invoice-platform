# e-Arşiv Fatura - Modern Ön Muhasebe Platformu

Türkiye Gelir İdaresi Başkanlığı (GİB) e-Arşiv Portal ile entegre, modern ve kullanıcı dostu fatura ve ön muhasebe yönetim platformu.

## 🚀 Özellikler

### 📊 Dashboard
- **Gerçek Zamanlı KPI'lar**: Aylık gelir, tahmini KDV, onaylı fatura sayısı
- **Son Faturalar**: Durum takibi ile fatura listesi
- **Mali Özet**: Görsel grafikler ve istatistikler

### 📝 Fatura Oluşturucu
- **Tam GİB Uyumluluğu**: e-Arşiv standardına uygun fatura oluşturma
- **Dinamik Satır Öğeleri**: Sınırsız ürün/hizmet ekleme
- **Otomatik Hesaplamalar**:
  - Ara toplam
  - İndirim hesaplaması
  - KDV hesaplaması (özelleştirilebilir oranlar)
  - Genel toplam
- **Müşteri Bilgileri**: Detaylı alıcı bilgisi yönetimi
- **ETTN Oluşturma**: Otomatik elektronik fatura takip numarası
- **İrsaliye Entegrasyonu**: Opsiyonel irsaliye bilgisi
- **Çoklu Para Birimi**: TRY, USD, EUR desteği

### 🧾 Gider Tarayıcı
- **Dosya Yükleme**: Gider belgesi/fatura tarama
- **AI OCR Simülasyonu**: Otomatik veri çıkarma
- **Hızlı Kayıt**: Taranan belgelerden anında fatura oluşturma

### 🔗 GİB Entegrasyonu
- **Güvenli Giriş**: Kullanıcı adı & şifre kimlik doğrulama
- **Test/Production Ortam**: İki ortam desteği
- **Otomatik Senkronizasyon**:
  - Gönderilen faturaları çekme
  - Müşteri listesi güncelleme
  - Gider belgelerini alma
  - Mali raporları indirme
- **Güvenli Oturum**: HTTP-only cookie ile 2 saatlik güvenli oturum

## 🎨 Tasarım

- **Modern Fintech Estetiği**: Profesyonel Royal Blue (#2563EB) renk paleti
- **Tam Responsive**: Mobil, tablet ve desktop uyumlu
- **Koyu/Açık Tema**: Otomatik tema desteği
- **Butter-smooth Animasyonlar**: Akıcı geçişler ve etkileşimler
- **Shadcn/ui**: Modern, accessible komponentler

## 🛠️ Teknoloji Stack

- **Framework**: Next.js 16 App Router
- **UI Library**: React 19.2
- **Styling**: Tailwind CSS v4
- **Components**: Shadcn/ui
- **Icons**: Lucide React
- **State Management**: React Hooks + localStorage
- **API**: Server Actions + SOAP Web Services
- **Security**: HTTP-only cookies, server-side auth

## 📦 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn

### Adımlar

1. Projeyi klonlayın:
\`\`\`bash
git clone <repo-url>
cd e-arsiv-fatura
\`\`\`

2. Bağımlılıkları yükleyin:
\`\`\`bash
npm install
# veya
yarn install
\`\`\`

3. Development server'ı başlatın:
\`\`\`bash
npm run dev
# veya
yarn dev
\`\`\`

4. Tarayıcınızda açın:
\`\`\`
http://localhost:3000
\`\`\`

## 🔐 GİB Entegrasyonu Kurulumu

1. **Test Ortamı için**:
   - GİB'den test kullanıcısı alın
   - Uygulamada "Test Ortamı" seçin
   - Test bilgilerinizle giriş yapın

2. **Production Ortamı için**:
   - Gerçek GİB e-Arşiv Portal bilgilerinizi kullanın
   - VKN, kullanıcı adı ve şifrenizi girin
   - "Canlı Ortam" seçeneğini seçin

Detaylı bilgi için: [GIB-INTEGRATION.md](./GIB-INTEGRATION.md)

## 📱 Kullanım

### Fatura Oluşturma

1. Sol menüden "Fatura Oluştur" seçin
2. Müşteri bilgilerini doldurun
3. Ürün/hizmet satırlarını ekleyin
4. Otomatik hesaplamaları gözlemleyin
5. "Taslak Kaydet" veya "Gönder" butonuna tıklayın

### GİB'den Veri Çekme

1. "GİB Giriş Yap" ile sisteme giriş yapın
2. "Verileri Güncelle" ile son 30 günlük verileri çekin
3. Dashboard'da tüm faturalarınızı görün

### Gider Belgesi Tarama

1. "Gider Tarayıcı" bölümüne gidin
2. Dosya yükleyin (simülasyon)
3. Otomatik çıkarılan bilgileri kontrol edin
4. Fatura olarak kaydedin

## 🗂️ Proje Yapısı

\`\`\`
/
├── app/
│   ├── actions/
│   │   ├── gib-auth.ts      # GİB kimlik doğrulama
│   │   └── gib-data.ts       # GİB veri çekme
│   ├── globals.css           # Global stiller & tema
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Ana uygulama
├── components/
│   ├── ui/                   # Shadcn/ui bileşenleri
│   └── gib-login-modal.tsx   # GİB giriş formu
├── lib/
│   └── utils.ts              # Utility fonksiyonlar
└── GIB-INTEGRATION.md        # GİB entegrasyon dokümanı
\`\`\`

## 🔒 Güvenlik

- ✅ Server-side authentication
- ✅ HTTP-only cookies
- ✅ SOAP API güvenli iletişim
- ✅ Şifreler hiçbir zaman saklanmaz
- ✅ 2 saatlik oturum timeout
- ✅ Input validation & sanitization
- ✅ XSS koruması

## 📊 Veri Saklama

- **localStorage**: Yerel fatura ve taslak yönetimi
- **Server Session**: GİB oturum bilgileri (cookie)
- **GİB Portal**: Ana veri kaynağı (faturalar, müşteriler, raporlar)

## 🎯 Roadmap

- [ ] Çoklu kullanıcı desteği
- [ ] E-imza sertifikası entegrasyonu
- [ ] PDF fatura oluşturma
- [ ] Toplu fatura işlemleri
- [ ] Gelişmiş raporlama
- [ ] E-Fatura entegrasyonu
- [ ] Mobil uygulama

## 🐛 Bilinen Sorunlar

- OCR özelliği şu anda simülasyon modunda
- localStorage kullanımı nedeniyle veriler tarayıcı bazlı

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje GİB e-Arşiv Portal kullanım şartlarına tabidir.

## 📞 Destek

Sorularınız için:
- GitHub Issues
- [GIB e-Arşiv Portal](https://earsivportal.gib.gov.tr)

---

**Not**: Bu uygulama GİB'in gerçek API'sine bağlanır. Test ortamında denemeler yapmanız önerilir.
