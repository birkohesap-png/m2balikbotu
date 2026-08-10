# Telegram Botu — Kurulum

Kullanıcı Telegram'da anahtarını girer → açık hesaplarını görür → hesaba dokununca
istatistiklerini görür → kendisine PM gelince bildirim alır.

Site kodu hazır. Yapman gereken **3 adım**, ~5 dakika.

---

## 1) BotFather'dan bot aç

Telegram'da [@BotFather](https://t.me/BotFather):

```
/newbot
```

- **Bot adı:** `K34 Balık Botu`
- **Kullanıcı adı:** `k34balikbot` (sonu `bot` ile bitmeli, doluysa başka dene)

BotFather sana şuna benzer bir **token** verir — kimseyle paylaşma:

```
8123456789:AAH7yQ-abcdefGHIJKLmnopQRSTuvwx1234
```

İsteğe bağlı ama güzel durur:

```
/setdescription  -> K34 Metin2 Balık Botu'nu telefonundan takip et.
/setabouttext    -> Hesaplarını izle, istatistikleri gör, PM bildirimi al.
/setuserpic      -> (K34 logosunu yükle)
/setcommands
```

`/setcommands` için şunu yapıştır:

```
baglan - Lisans anahtarını bağla
hesaplar - Açık hesaplarını gör
durum - Lisans bilgin
bildirim - PM bildirimini aç/kapat
cikis - Bağlantıyı kes
yardim - Komut listesi
```

---

## 2) Vercel'e 2 değişken ekle

Vercel → projen → **Settings → Environment Variables**:

| İsim | Değer |
|---|---|
| `TELEGRAM_TOKEN` | BotFather'ın verdiği token |
| `TELEGRAM_WEBHOOK_GIZLI` | Rastgele bir metin (aşağıdaki komutla üret) |

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

Ekledikten sonra **Redeploy**.

---

## 3) Webhook'u bağla

Tarayıcının adres çubuğuna yapıştır — `TOKEN` ve `GIZLI` yerine kendi değerlerini yaz:

```
https://api.telegram.org/botTOKEN/setWebhook?url=https://xn--m2balkbotu-1ub.com/api/telegram&secret_token=GIZLI
```

`{"ok":true,"result":true,...}` görürsen tamamdır.

**Kontrol:** `https://m2balıkbotu.com/api/telegram` adresini aç —
`{"ok":true,"token":true,"gizli":true}` dönmeli.

---

## Kullanıcı nasıl kullanacak?

1. Telegram'da botu açar → `/start`
2. `/baglan K34-XXXXX-XXXXX-XXXXX` (ya da anahtarı direkt yazar)
3. `/hesaplar` → açık hesaplar listelenir:
   ```
   🟢 Hesap 1 — 🐟 412
   🟢 Hesap 2 — 🐟 388
   ⚪ Hesap 3 — 🐟 51
   🔄 Yenile
   ```
4. Hesaba dokunur → o hesabın detayı:
   ```
   🟢 Çevrimiçi · Hesap 1
   💻 MASAUSTU-PC

   🐟 Tutulan: 412
   🏃 Kaçan: 27
   🗑 Atılan: 88
   🔁 Tur: 527
   🎯 Başarı: %94
   ⚙️ Durum: BALIK TUTUYOR
   ⏱ Çalışma: 6sa 12dk

   🧩 Yapboz — B:3 O:5 K:0 · sandık 91
   ```
5. Birisi ona PM atarsa Telegram'a düşer:
   ```
   💬 Özel mesaj geldi
   Oyuncu123 yazdı:
   "kardeşim bot musun"
   ```

Ayrıca bot başladı/durdu, DC oldu, pişirme bitti, yapboz tamamlandı, lisans
uyarısı olaylarında da bildirim gider. Kullanıcı istemezse `/bildirim` ile kapatır.

---

## Nasıl çalışıyor (teknik)

```
BOT (masaüstü)                    SİTE (Vercel)                TELEGRAM
─────────────                     ─────────────                ────────
pega_bulut.py
 ├ her 30 sn ──POST /api/durum──> durumlar tablosu
 └ olay olunca ─POST /api/olay──> tg_baglar'dan chat_id  ──────> bildirim
                                        ▲
kullanıcı /hesaplar ────────────> /api/telegram (webhook)
```

- `/api/durum` ve `/api/olay` **lisans + HWID doğrular**; geçersiz anahtarla
  kimse veri yazamaz.
- `/api/telegram` yalnızca `TELEGRAM_WEBHOOK_GIZLI` başlığıyla gelen isteği kabul
  eder; başkası bu ucu çağıramaz.
- Bot geçerli lisans yoksa hiçbir şey göndermez.
- "Çevrimiçi" = son 2,5 dakika içinde haber vermiş demektir.

Yeni tablolar (`durumlar`, `tg_baglar`) ilk istekte otomatik oluşur.
