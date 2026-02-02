# GİB e-Arşiv Portal Entegrasyonu

Bu uygulama, Türkiye Gelir İdaresi Başkanlığı (GİB) e-Arşiv Portal ile gerçek zamanlı entegrasyon sağlar.

## Özellikler

### ✅ Tamamlanan Entegrasyonlar

1. **Kimlik Doğrulama**
   - Kullanıcı adı & şifre ile güvenli giriş
   - Test ve Production ortam desteği
   - 2 saat geçerli oturum yönetimi
   - HTTP-only cookie ile güvenli token saklama

2. **Veri Senkronizasyonu**
   - Gönderilen faturaları çekme
   - Müşteri listesi senkronizasyonu
   - Gider belgelerini alma
   - Mali raporları indirme

3. **Güvenlik**
   - SOAP API üzerinden güvenli iletişim
   - Server-side authentication
   - Şifreli session yönetimi

## Kullanım

### 1. GİB'e Giriş Yapma

1. Sol sidebar'daki "GİB Giriş Yap" butonuna tıklayın
2. Formu doldurun:
   - **Ortam**: Test veya Production seçin
   - **VKN**: 10 haneli Vergi Kimlik Numaranız
   - **Kullanıcı Adı**: GİB kullanıcı adınız
   - **Şifre**: GİB şifreniz
3. "Giriş Yap" butonuna tıklayın

### 2. Verileri Güncelleme

Giriş yaptıktan sonra:
- Sidebar'da "Verileri Güncelle" butonuna tıklayın
- Sistem otomatik olarak şunları çeker:
  - Son 30 günlük faturalar
  - Müşteri listesi
  - Gider belgeleri
  - Mali raporlar

### 3. Çıkış Yapma

- "GİB Çıkış Yap" butonuna tıklayarak oturumu sonlandırın

## API Endpoints

### Test Ortamı
\`\`\`
https://earsivportaltest.gib.gov.tr/earsiv-services/EarsivWebService
\`\`\`

### Production Ortamı
\`\`\`
https://earsivportal.gib.gov.tr/earsiv-services/EarsivWebService
\`\`\`

## SOAP Servisleri

Uygulama şu SOAP servislerini kullanır:

1. **login** - Kimlik doğrulama
2. **logout** - Oturum sonlandırma
3. **getInvoiceList** - Fatura listesi
4. **getCustomerList** - Müşteri listesi
5. **getExpenseDocuments** - Gider belgeleri
6. **getFinancialReport** - Mali raporlar

## Veri Yapısı

### Faturalar
\`\`\`typescript
{
  id: string
  ettn: string
  date: string
  time: string
  status: 'approved' | 'pending' | 'draft'
  grandTotal: number
  currency: string
  recipient: {
    title: string
    idNumber: string
    taxOffice: string
  }
}
\`\`\`

### Müşteriler
\`\`\`typescript
{
  id: string
  title: string
  idNumber: string
  taxOffice: string
  address: string
  city: string
  country: string
}
\`\`\`

## Güvenlik Notları

⚠️ **Önemli Güvenlik Bilgileri:**

1. Giriş bilgileriniz sadece GİB ile iletişim için kullanılır
2. Şifreler hiçbir zaman veritabanına kaydedilmez
3. Session bilgileri HTTP-only cookie'de saklanır
4. Oturum 2 saat sonra otomatik olarak sona erer
5. Production ortamında HTTPS kullanılması zorunludur

## Sorun Giderme

### "GİB oturumu bulunamadı" Hatası
- Yeniden giriş yapın
- Oturumun süresi dolmuş olabilir (2 saat)

### "GİB API Error: 401"
- Kullanıcı adı veya şifre yanlış
- VKN kontrol edin

### Veriler Gelmiyor
- İnternet bağlantınızı kontrol edin
- GİB Portal'ın aktif olduğundan emin olun
- Test ortamında veri olmayabilir

## Geliştirme

### Server Actions

Tüm GİB işlemleri server-side'da gerçekleşir:

- `/app/actions/gib-auth.ts` - Kimlik doğrulama
- `/app/actions/gib-data.ts` - Veri çekme işlemleri

### Bileşenler

- `/components/gib-login-modal.tsx` - Giriş formu
- `/app/page.tsx` - Ana uygulama ve GİB entegrasyonu

## Test Ortamı

Test ortamında deneme yapmak için:
1. GİB'den test kullanıcısı alın
2. Giriş formunda "Test Ortamı" seçin
3. Test kullanıcı bilgilerinizi girin

## Lisans

Bu entegrasyon GİB e-Arşiv Portal API'sinin kullanım şartlarına tabidir.
