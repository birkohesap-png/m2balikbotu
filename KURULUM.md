# m2balıkbotu.com — Kurulum Rehberi

GitHub → Vercel akışı. Toplam **10-15 dakika**.

---

## 1) GitHub'a yükle

```bash
cd C:\Users\1453\Desktop\m2balikbotu-site
git init
git add .
git commit -m "K34 Metin2 Balik Botu - web sitesi"
```

GitHub'da **boş** bir repo aç (README ekleme!), sonra:

```bash
git remote add origin https://github.com/KULLANICI_ADIN/m2balikbotu.git
git branch -M main
git push -u origin main
```

---

## 2) Vercel'e bağla

1. [vercel.com/new](https://vercel.com/new) → GitHub reposunu seç → **Import**
2. Framework otomatik **Next.js** görünecek, ayara dokunma → **Deploy**
3. İlk deploy hata verecek (veritabanı ve şifre yok) — normal, 3. adımda düzelecek

---

## 3) Veritabanı (Neon Postgres)

Vercel proje sayfasında:

1. **Storage** sekmesi → **Create Database** → **Neon (Postgres)** → Free plan
2. **Connect** ile projeye bağla

`POSTGRES_URL` ve diğer değişkenler **otomatik** eklenir; elle bir şey yazmana gerek yok.
Tablolar ilk istekte kendiliğinden oluşur (`lisanslar`, `cihazlar`).

---

## 4) Ortam değişkenleri

Vercel → **Settings → Environment Variables** → 3 değişken ekle
(hepsinde **Production + Preview + Development** işaretli olsun):

| İsim | Değer |
|---|---|
| `ADMIN_SIFRE` | Panel şifren. Uzun ve tahmin edilemez olsun. |
| `ADMIN_GIZLI` | 64 karakterlik rastgele hex |
| `LISANS_GIZLI` | Başka bir 64 karakterlik rastgele hex |

Rastgele değer üretmek için (bilgisayarında):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ekledikten sonra **Deployments → ⋯ → Redeploy**.

---

## 5) Alan adını bağla

Vercel → **Settings → Domains** → ekle:

- `xn--m2balkbotu-1ub.com`  ← **m2balıkbotu.com'un gerçek (punycode) hali, bunu yaz**
- `www.xn--m2balkbotu-1ub.com`

Sonra alan adı sağlayıcında (GoDaddy/Natro/İsimtescil vb.) Vercel'in gösterdiği
kayıtları gir:

| Tip | İsim | Değer |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

> Vercel ekranda hangi değerleri istiyorsa **onlar** geçerlidir — yukarıdaki tablo
> tipik değerlerdir, farklıysa Vercel'inkini kullan.

DNS yayılması 5 dk – 24 saat sürebilir.

---

## 6) Admin paneli

`https://m2balıkbotu.com/admin` → `ADMIN_SIFRE` ile gir.

Panelden:
- **Yeni anahtar üret** — paket seç (Günlük/Haftalık/Aylık), adet gir, müşteri adı yaz
- Üretilen anahtarlara **tıklayınca kopyalanır** → Telegram'dan müşteriye gönder
- **İptal** — anahtar en geç 10 dakika içinde botta çalışmayı durdurur
- **+1 gün / +7 gün** — süre uzatma
- **Detay** — anahtarın hangi bilgisayarlarda açıldığı (HWID), ilk/son kullanım
- **Cihazları sıfırla** — müşteri bilgisayar değiştirdiğinde

Süre, anahtar üretildiğinde değil **botta ilk giriş yapıldığında** başlar.

---

## 6.5) Telegram botu

Ayrı rehber: **TELEGRAM_KURULUM.md** (BotFather → 2 env değişkeni → webhook).

---

## 7) Botu siteye bağlama

Bot tarafı hazır — `pega_key.py` içindeki adres:

```python
SUNUCU = 'https://xn--m2balkbotu-1ub.com'
```

Site yayına girdikten sonra botu yeniden derle:

```bash
cd "C:\Users\1453\Desktop\K34-BalikBotu-Kaynak" && python -m PyInstaller --noconfirm --clean "K34_TekDosya.spec"
```

Test: panelden 1 günlük anahtar üret → botu aç → anahtarı gir → panelde **Detay**'da
o bilgisayarın HWID'si görünmeli.

---

## Sonradan değiştirmek isteyeceklerin

| Ne | Nerede |
|---|---|
| Fiyat / paket / cihaz sayısı | `lib/site.js` → `PAKETLER` |
| Telegram kullanıcı adı | `lib/site.js` → `SITE.telegram` |
| **YouTube tanıtım videosu** | `lib/site.js` → `SITE.youtubeId` (sadece video ID'si, örn. `dQw4w9WgXcQ`) |
| Bot ekran görüntüleri | `public/galeri/` klasörüne at — **otomatik listelenir**. Dosya adı başlık olur: `01-ana-ekran.png` → "Ana ekran" |
| Güvenlik/ban metni | `lib/site.js` → `GUVENLIK` |
| S.S.S. | `lib/site.js` → `SSS` |
| Özellikler | `lib/site.js` → `OZELLIKLER` |

Değişiklikten sonra:

```bash
git add . && git commit -m "guncelleme" && git push
```

Vercel otomatik yeniden yayınlar.

---

## SEO — yayına girdikten sonra yapılacaklar

1. [Google Search Console](https://search.google.com/search-console) → alan adını ekle (DNS doğrulaması)
2. **Sitemaps** → `https://m2balıkbotu.com/sitemap.xml` gönder
3. **URL Inspection** → ana sayfayı "Request Indexing"
4. [Bing Webmaster Tools](https://www.bing.com/webmasters)'a da ekle (Yandex için de aynısı)

Sitede hazır olanlar: `sitemap.xml`, `robots.txt`, Open Graph, Twitter Card,
JSON-LD (SoftwareApplication + Offer + FAQPage + Organization + WebSite),
"Metin2 Balık Botu / Metin2 Fish Bot / Metin2 Angelbot / Bot de pescuit"
anahtar kelimeleri ve İngilizce/Almanca/Romence tanıtım bölümü.

---

## Yerel geliştirme

```bash
cd C:\Users\1453\Desktop\m2balikbotu-site && npm run dev
```

`http://localhost:3000` — veritabanı olmadan sayfa açılır, sadece `/api/*`
uçları hata verir (normal).
