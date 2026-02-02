# Vercel'e Deploy Rehberi - GİB e-Arşiv Platform

## Adım 1: Değişiklikleri GitHub'a Push Edin

```bash
git add .
git commit -m "GIB API integration ve full entegrasyon"
git push origin main
```

## Adım 2: Vercel'de Deploy

1. **Vercel Dashboard'a gidin**: https://vercel.com/dashboard
2. **"New Project" tıklayın**
3. **GitHub repo'nuzü seçin**
4. **Deploy'e tıklayın**

Vercel otomatik build ve deploy yapacak.

## Adım 3: Telefondan Erişim

Vercel size verdiği URL'i telefonunuzun tarayıcısına yapıştırın:
- Örn: `https://e-arsiv-platform.vercel.app`
- Bookmarks'e kaydedin
- Her yerden erişebilirsiniz

## Nasıl Çalışıyor?

1. **Login Sayfası**: GİB kimlik bilgilerinizi girin
2. **Backend API**: `/api/gib/authenticate` endpoint'i GİB'e bağlanır
3. **Token Yönetimi**: Token localStorage'da saklanır
4. **Veri Senkronizasyonu**: `/api/gib/invoices`, `/api/gib/customers`, `/api/gib/expenses` endpoint'leri verilerinizi çeker

## Test Modu

Başlangıçta test ortamında çalışacak ve örnek veriler gösterecektir. Vercel'de deploy olunca gerçek GİB API'lerine bağlanacaktır.

## Sorun Giderme

- **"Token gerekli" hatası**: Login sayfasına dönüp tekrar giriş yapın
- **Veri görünmüyor**: "Verileri Güncelle" butonuna tıklayın
- **GİB bağlantı hatası**: Kimlik bilgilerinizi kontrol edin
