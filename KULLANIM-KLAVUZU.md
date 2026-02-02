# e-Arşiv Fatura Kullanım Kılavuzu

## 📖 İçindekiler

1. [Hızlı Başlangıç](#hızlı-başlangıç)
2. [GİB'e Bağlanma](#gibe-bağlanma)
3. [Fatura Oluşturma](#fatura-oluşturma)
4. [Gider Belgesi Tarama](#gider-belgesi-tarama)
5. [Dashboard Kullanımı](#dashboard-kullanımı)
6. [Sık Sorulan Sorular](#sık-sorulan-sorular)

---

## 🚀 Hızlı Başlangıç

### İlk Açılış

1. Uygulamayı açtığınızda Dashboard ekranı karşınıza gelecektir
2. Sol tarafta navigasyon menüsü bulunur:
   - 📊 **Dashboard**: Ana sayfa ve istatistikler
   - 📝 **Fatura Oluştur**: Yeni fatura oluşturma
   - 🧾 **Gider Tarayıcı**: Gider belgesi tarama

### Mobil Kullanım

- Mobil cihazlarda sol üst köşedeki menü ikonuna (☰) tıklayarak yan menüyü açabilirsiniz
- Tüm özellikler mobil uyumludur

---

## 🔗 GİB'e Bağlanma

### Adım 1: Giriş Butonuna Tıklayın

Sol menünün en altında **"GİB Giriş Yap"** butonunu bulacaksınız.

### Adım 2: Bilgilerinizi Girin

Açılan formda şu bilgileri doldurun:

**Ortam Seçimi:**
- 🧪 **Test Ortamı**: Deneme ve geliştirme için
- 🏢 **Canlı Ortam**: Gerçek faturalar için

**Vergi Kimlik Numarası (VKN):**
- 10 haneli şirket VKN'nizi girin
- Örnek: 1234567890

**Kullanıcı Adı:**
- GİB e-Arşiv Portal kullanıcı adınız
- Genellikle e-posta adresi formatında

**Şifre:**
- GİB Portal şifreniz
- Şifreler güvenli bir şekilde işlenir ve saklanmaz

### Adım 3: Giriş Yapın

- Tüm bilgiler doğruysa **"Giriş Yap"** butonuna tıklayın
- Başarılı giriş sonrası otomatik olarak verileriniz çekilir
- Sol menüde "GİB Bağlı" durumunu göreceksiniz

### Verileri Güncelleme

Giriş yaptıktan sonra:
1. **"Verileri Güncelle"** butonuna tıklayın
2. Sistem şunları çeker:
   - Son 30 günlük faturalarınız
   - Müşteri listeniz
   - Gider belgeleriniz
   - Mali raporlarınız

### Çıkış Yapma

- **"GİB Çıkış Yap"** butonuyla güvenli çıkış yapabilirsiniz
- Oturum otomatik olarak 2 saat sonra sona erer

---

## 📝 Fatura Oluşturma

### Adım 1: Fatura Oluştur Sayfasına Gidin

Sol menüden **"Fatura Oluştur"** seçeneğine tıklayın.

### Adım 2: Temel Bilgiler

**Fatura Bilgileri (Otomatik Doldurulur):**
- ✅ ETTN (Elektronik Fatura Takip Numarası)
- ✅ Tarih ve Saat
- ✅ Senaryo (SATIŞ, İADE, vb.)

**Para Birimi:**
- TRY (Türk Lirası) - varsayılan
- USD (Amerikan Doları)
- EUR (Euro)

### Adım 3: Alıcı Bilgileri

**Kimlik Tipi:**
- 🔹 TCKN: Bireysel müşteriler için
- 🔹 VKN: Kurumsal müşteriler için
- 🔹 Yabancı: Yabancı uyruklu müşteriler için

**Gerekli Bilgiler:**
- Kimlik/Vergi Numarası
- Ünvan/Şirket Adı (kurumsal için)
- Ad ve Soyad (bireysel için)
- Vergi Dairesi
- Şehir
- Adres

### Adım 4: Ürün/Hizmet Satırları

**Yeni Satır Eklemek:**
1. **"+ Satır Ekle"** butonuna tıklayın
2. Her satır için:
   - 📦 **Ürün/Hizmet Adı**: Açıklama
   - 🔢 **Miktar**: Adet, kg, m², vb.
   - 📏 **Birim**: Adet, kg, m², Lt, vb.
   - 💰 **Birim Fiyat**: TL cinsinden fiyat
   - 🏷️ **İndirim %**: Varsa indirim oranı
   - 📊 **KDV %**: KDV oranı (0, 1, 10, 20)

**Otomatik Hesaplamalar:**
- Satır toplamı otomatik hesaplanır
- İndirim düşüldükten sonraki tutar
- KDV dahil toplam

**Satır Silme:**
- 🗑️ Çöp kutusu ikonuna tıklayarak silin
- En az 1 satır olmalıdır

### Adım 5: İrsaliye (Opsiyonel)

Eğer irsaliye varsa:
- İrsaliye Numarası
- İrsaliye Tarihi

### Adım 6: Kaydet veya Gönder

**Alt Kısımda Özet:**
- Ara Toplam
- Toplam İndirim
- Matrah (Vergi Matrahı)
- Toplam KDV
- **Genel Toplam**

**Kaydetme Seçenekleri:**
- 💾 **Taslak Kaydet**: Daha sonra düzenlemek için
- 📤 **GİB'e Gönder**: Faturayı onaylamak için
- 📥 **İndir (PDF)**: PDF olarak kaydet

---

## 🧾 Gider Belgesi Tarama

### Adım 1: Gider Tarayıcı Sayfasına Gidin

Sol menüden **"Gider Tarayıcı"** seçeneğine tıklayın.

### Adım 2: Belge Yükleyin

1. **"Dosya Seç"** veya sürükle-bırak alanına tıklayın
2. Gider belgenizi (fatura, fiş, makbuz) seçin
3. Desteklenen formatlar:
   - 📄 PDF
   - 🖼️ JPG, PNG
   - 📸 Fotoğraf

### Adım 3: Otomatik Tarama

- Sistem 2-3 saniye içinde belgeyi tarar
- OCR teknolojisi ile bilgiler çıkarılır:
  - Tedarikçi bilgileri
  - Tutar
  - Tarih
  - Ürün/hizmet bilgileri

### Adım 4: Kontrol ve Kaydet

1. Çıkarılan bilgileri kontrol edin
2. Gerekirse düzenleyin
3. **"Fatura Olarak Kaydet"** butonuna tıklayın
4. Fatura Dashboard'da görünecektir

---

## 📊 Dashboard Kullanımı

### KPI Kartları

Dashboard'da 4 ana KPI kartı bulunur:

**1. 📈 Aylık Gelir**
- Bu aydaki toplam geliriniz
- Onaylı faturalardan hesaplanır
- Yeşil ok: Artış, Kırmızı ok: Azalış

**2. 💰 Tahmini KDV**
- Ödenecek tahmini KDV tutarı
- Aylık gelirin %18'i
- Planlama için kullanışlıdır

**3. ✅ Onaylı Faturalar**
- Toplam onaylı fatura sayısı
- GİB'e gönderilmiş ve onaylanmış

**4. ⏱️ Bekleyen Faturalar**
- Taslak veya onay bekleyen faturalar
- Hızlı erişim için

### Son Faturalar Listesi

**Gösterilen Bilgiler:**
- 📄 ETTN (Elektronik Takip No)
- 👤 Müşteri Adı
- 📅 Tarih
- 💵 Tutar
- 🏷️ Durum (Taslak/Bekliyor/Onaylı)

**Durum Renkleri:**
- 🔵 Mavi: Taslak
- 🟡 Sarı: Bekliyor
- 🟢 Yeşil: Onaylı

**Fatura Detaylarına Erişim:**
- Fatura satırına tıklayarak detay görüntüleyin
- Düzenleyin veya silin

---

## ❓ Sık Sorulan Sorular

### Genel Sorular

**S: Verilerim güvende mi?**
C: Evet! Tüm veriler:
- localStorage'da yerel olarak saklanır
- GİB ile şifreli SOAP protokolü kullanılır
- Şifreler hiçbir zaman saklanmaz
- Oturumlar HTTP-only cookie ile korunur

**S: İnternet bağlantısı olmadan çalışır mı?**
C: Kısmen. Yerel faturalar çalışır ancak GİB senkronizasyonu için internet gerekir.

**S: Birden fazla cihazda kullanabilir miyim?**
C: localStorage kullandığı için her cihaz bağımsızdır. Gelecek sürümlerde bulut senkronizasyonu planlanıyor.

### GİB Entegrasyonu

**S: Test ortamında gerçek fatura kesebilir miyim?**
C: Hayır, test ortamı sadece deneme içindir. Gerçek faturalar için Canlı Ortam kullanın.

**S: "GİB oturumu bulunamadı" hatası alıyorum**
C: Oturumunuzun süresi dolmuş olabilir (2 saat). Yeniden giriş yapın.

**S: Faturalar GİB'den çekilmiyor**
C: Şunları kontrol edin:
- GİB Portal'da fatura var mı?
- Son 30 gün içinde mi?
- İnternet bağlantınız aktif mi?
- Giriş bilgileriniz doğru mu?

### Fatura Oluşturma

**S: KDV oranlarını değiştirebilir miyim?**
C: Evet, her satır için KDV oranını seçebilirsiniz: %0, %1, %10, %20

**S: İndirim nasıl uygulanır?**
C: Her satıra % olarak indirim girebilirsiniz. Önce indirim düşülür, sonra KDV hesaplanır.

**S: Yabancı para biriminde fatura kesebilir miyim?**
C: Evet, USD ve EUR seçenekleri mevcuttur. Döviz kuru otomatik alınır.

**S: ETTN'yi manuel girebilir miyim?**
C: Hayır, ETTN otomatik oluşturulur ve değiştirilemez. Bu GİB standardıdır.

### Teknik Sorular

**S: Hangi tarayıcıları destekliyor?**
C: Modern tüm tarayıcılar:
- Chrome/Edge (Önerilen)
- Firefox
- Safari
- Opera

**S: Mobil uygulama var mı?**
C: Henüz yok, ancak web uygulaması mobil uyumludur. Mobil uygulama roadmap'te.

**S: Verileri nasıl yedeklerim?**
C: 
1. Dashboard'dan tüm faturaları indirin
2. Tarayıcı Developer Tools > Application > localStorage'dan yedek alın
3. Gelecek sürümlerde otomatik yedekleme eklenecek

---

## 🆘 Yardım ve Destek

### Sorun Bildirimi

Bir sorunla karşılaştıysanız:
1. Hata mesajını not edin
2. Ekran görüntüsü alın
3. GitHub Issues'da bildirin
4. Veya [destek e-postasına] yazın

### Özellik İsteği

Yeni özellik önerileriniz için:
- GitHub Issues'da "Feature Request" olarak açın
- Detaylı açıklama yapın
- Kullanım senaryosu belirtin

### Güncelleme Notları

- Uygulama otomatik güncellenir
- Yeni özellikler için kontrol edin
- Değişiklik notları README'de bulunur

---

## 💡 İpuçları ve Püf Noktaları

### Verimlilik İpuçları

**1. Müşteri Şablonları:**
- Sık kullandığınız müşterileri GİB'den çekin
- Hızlı fatura oluşturmak için kullanın

**2. Ürün Tanımları:**
- Standart ürünlerinizin bilgilerini kopyalayın
- Yeni faturada yapıştırın

**3. Toplu İşlemler:**
- Aynı gün birden fazla fatura kesecekseniz
- Bilgileri kopyalayıp yapıştırın

**4. Düzenli Senkronizasyon:**
- Günde en az 1 kez GİB'den veri çekin
- Güncel kalmak için önemli

### Güvenlik İpuçları

**1. Güvenli Çıkış:**
- Paylaşımlı bilgisayarlarda mutlaka çıkış yapın
- Oturum 2 saat sonra otomatik kapanır

**2. Güçlü Şifre:**
- GİB şifrenizi kimseyle paylaşmayın
- Düzenli olarak değiştirin

**3. HTTPS Kullanımı:**
- URL'nin "https://" ile başladığından emin olun
- Güvenli bağlantı kilidi simgesini kontrol edin

---

**Son Güncelleme:** 2025-02-02  
**Versiyon:** 1.0.0  
**İletişim:** GitHub Issues veya [destek@example.com]
