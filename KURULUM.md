# m2balikbotu.com — Kurulum Rehberi

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

- `m2balikbotu.com`  ← **ana (canonical) alan adı**
- `www.m2balikbotu.com`  → Vercel'de `m2balikbotu.com`'a **Redirect** olarak ayarla

> ### ⚠ Eski alan adını SİLME
> Daha önce dağıtılan bot `.exe`'leri hâlâ eski adrese
> (`xn--m2balkbotu-1ub.com`, yani `m2balıkbotu.com`) bakıyor. Bu alan adı
> **aynı Vercel projesinde bağlı kalmalı**, yoksa eski kurulumlarda lisans
> doğrulaması kırılır ve botlar açılmaz.
>
> - `xn--m2balkbotu-1ub.com`'u Domains listesinde **bırak** ve **yönlendirme (redirect)
>   KURMA** — aynı projeye doğrudan servis etsin.
> - Yönlendirme kurarsan botun `POST /api/check` isteği 301'de GET'e dönüşür ve
>   lisans doğrulaması bozulur. Bu yüzden eski alan adı düz alias olarak kalmalı.
> - Kullanıcıların hepsi yeni sürüme geçtikten sonra kaldırabilirsin.

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

## 6) Yönetim paneli

`https://m2balikbotu.com/k34` → `ADMIN_SIFRE` ile gir.

> Panel adresi eskiden `/admin` idi; sürekli sızma denemesi aldığı için `/k34`
> olarak değiştirildi. Bu yol **robots.txt'e yazılmaz** (yazmak onu duyurmak
> olurdu); bunun yerine `app/k34/layout.js` içindeki `noindex` ile aramadan
> uzak tutulur. Adresi kimseyle paylaşma.

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

## 6.6) Otomatik güncelleme (tek seferlik kurulum)

Amaç: her güncellemede müşterilere tek tek `.exe` göndermeyi bitirmek. Bot
açılışta siteye tek küçük istek atar, yeni sürüm varsa kullanıcıya sorar,
onaylarsa kendisi indirip sessizce kurar ve yeniden açılır.

**Kaynak kodun hiçbir yere gitmez** — GitHub'a konan şey sadece müşteriye
zaten verdiğin derlenmiş kurulum dosyasıdır ve depo **özeldir**.

### a) Sürüm deposunu aç (bir kez)

1. GitHub'da **private** yeni bir depo aç: `k34-surum` (içi boş olabilir).
2. **Settings → Developer settings → Personal access tokens → Fine-grained**
   → yeni token:
   - Repository access: **Only select repositories** → `k34-surum`
   - Permissions → Repository → **Contents: Read-only** (başka hiçbir şey verme)
3. Vercel → Settings → Environment Variables:

| İsim | Değer |
|---|---|
| `GH_REPO` | `kullanıcı-adın/k34-surum` |
| `GH_TOKEN` | az önce ürettiğin token |

Ekledikten sonra **Redeploy**.

### b) Her yeni sürümde (3 adım)

```bash
py -3.11 yayinla.py 2.2.0
```

Bu komut sürüm numarasını yükseltir, arayüzü gömer, exe'yi derler, kurulum
sihirbazını paketler ve **SHA-256**'yı yazar.

1. `cikti\K34_Kurulum_2.2.0.exe` dosyasını `k34-surum` deposunda yeni bir
   **Release**'e yükle.
2. `https://m2balikbotu.com/k34` → **Bot Sürümleri** kartı → dosyayı seç,
   sürümü ve SHA-256'yı yapıştır, notları yaz → **Yayınla**.
3. Bitti. Müşteriler botu bir sonraki açışta güncellemeyi görür.

> **Sürüm numarasını elle değiştirme.** `yayinla.py` tek yerden yönetir.
> Kurulumun içindeki sürüm ile panele yazdığın sürüm farklı olursa bot
> güncellemeyi kurar, açılır, yine "yeni sürüm var" görür ve sonsuz döngüye girer.

### Nasıl çalışıyor?

| Adım | Ne olur |
|---|---|
| Bot açılır | Arka planda tek GET → `/api/surum` (≈200 bayt, 6 sn zaman aşımı). Ağ yoksa sessizce vazgeçer, bot normal açılır. |
| Yeni sürüm varsa | Pencere çıkar: sürüm notları + boyut. "Zorunlu" işaretlediysen "Sonra" butonu gizlenir. |
| Kullanıcı onaylar | Bot `/api/indir`'e **lisans anahtarıyla** sorar; site anahtarı doğrular ve GitHub'dan kısa ömürlü imzalı adres üretir. |
| İndirme | Dosya **doğrudan GitHub CDN'inden** iner (siteden geçmez). SHA-256 tutmazsa kurulum yapılmaz. |
| Kurulum | Bot kapanır, sihirbaz `/SILENT` çalışır, bitince botu kendisi geri açar. Yönetici yetkisi istemez. |

---

## 7) Botu siteye bağlama

Bot tarafı hazır — `pega_key.py` içindeki adres:

```python
SUNUCU = 'https://m2balikbotu.com'
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
| Alan adı | `lib/site.js` → `SITE.host` (canonical, sitemap, şema — hepsi buradan) |
| Telegram **admin** hesabı | `lib/site.js` → `SITE.telegram` |
| Telegram **genel grup** | `lib/site.js` → `SITE.telegramGrup` |
| Instagram | `lib/site.js` → `SITE.instagram` |
| **Yeni sayfa / sitemap** | `lib/site.js` → `SAYFALAR` (sitemap ve alt menü otomatik) |
| Sürüm notları | `lib/site.js` → `GUNCELLEMELER` (en yeni en üstte) |
| Yapboz bölümü metni ve videosu | `lib/site.js` → `YAPBOZ` |
| Google Search Console doğrulaması | `lib/site.js` → `SITE.googleDogrulama` |
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

1. [Google Search Console](https://search.google.com/search-console) → **m2balikbotu.com**'u
   yeni mülk olarak ekle (Domain doğrulaması — DNS TXT kaydı).
   - İstersen `lib/site.js` → `SITE.googleDogrulama` alanına konsolun verdiği
     `content="..."` değerini yaz; site o zaman HTML etiketini de basar.
2. **Sitemaps** → `https://m2balikbotu.com/sitemap.xml` gönder.
3. **URL Inspection** → altı sayfanın her birini tek tek "Request Indexing" yap:
   `/`, `/yapboz-botu`, `/metin2-balik-botu-nedir`, `/guncellemeler`, `/sss`, `/iletisim`
4. Eski alan adı için Search Console'da **Change of Address** (Adres değişikliği)
   aracını kullan — böylece eski adresin sıralama gücü yeni adrese aktarılır.
5. [Bing Webmaster Tools](https://www.bing.com/webmasters)'a da ekle (Yandex için de aynısı).

### Sitemap neden bozuktu?

Önceki sürümde sitemap `/#fiyatlar`, `/#sss` gibi **çapa (fragment)** adresleri
içeriyordu. Google çapaları ayrı sayfa saymaz; bu yüzden Search Console
"taranmadı / yinelenen sayfa" diyordu. Artık sitemap yalnızca **gerçek sayfaları**
listeliyor ve kaynağı `lib/site.js` → `SAYFALAR` dizisi.
**Yeni sayfa eklersen sadece o diziye ekle, sitemap kendiliğinden güncellenir.**

Sitede hazır olanlar: `sitemap.xml`, `robots.txt`, `manifest.webmanifest`,
Open Graph, Twitter Card, her sayfada **canonical**, kırıntı navigasyonu
(BreadcrumbList) ve sayfaya özel JSON-LD:

| Sayfa | Şema |
|---|---|
| `/` | SoftwareApplication + AggregateOffer + 2 × VideoObject |
| `/yapboz-botu` | VideoObject + HowTo |
| `/metin2-balik-botu-nedir` | Article + HowTo |
| `/sss` | FAQPage |
| `/guncellemeler` | ItemList |
| `/iletisim` | ContactPage |
| tüm sayfalar | Organization + WebSite (layout'ta) |

> FAQPage şeması **sadece** `/sss` sayfasındadır. Aynı SSS içeriğini birden fazla
> sayfada işaretlemek Google'da yinelenen işaretleme sayılır.

---

## Yerel geliştirme

```bash
cd C:\Users\1453\Desktop\m2balikbotu-site && npm run dev
```

`http://localhost:3000` — veritabanı olmadan sayfa açılır, sadece `/api/*`
uçları hata verir (normal).
