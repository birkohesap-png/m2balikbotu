# GM Nöbeti — Kurulum

Discord'da bir **GM (oyun yöneticisi)** çevrimiçi olunca **tüm müşterilere**
Telegram'dan uyarı gider:

> ⚠️ **GM AKTİF — DİKKAT!**
> Şu an Discord'da aktif oyun yöneticisi (GM):
> • **GM_Ali**
> Ban riski var. Lütfen oyunu kapatın.
> `[🖥 PC'yi kapat]` `[❌ Sadece oyunu kapat]`

Müşteri butona basınca bot ~30 sn içinde ya bilgisayarı kapatır ya da sadece
oyunu kapatır.

**Önemli:**
- İzleme **sunucuda (sitede)** çalışır → **senin PC'n kapalıyken de çalışır.**
- Discord anahtarın **sadece Vercel'de** durur → müşteri hiçbir şey görmez/girmez.
- Müşteri tarafında **hiçbir kurulum yok**; sadece Telegram'ı bağlı olması yeter.

Yapman gereken **4 adım**, ~10 dakika.

---

## 1) Discord anahtarını (token) al

> ⚠️ Bu anahtar hesabının **tam yetkisidir**. Kimseyle paylaşma, ekran görüntüsü
> alma. Sadece Vercel'e gireceksin. (Sen "hesabı kullanmıyorum, sorun değil"
> demiştin — yine de anahtarı kimseye gösterme.)

1. Discord'u **tarayıcıdan** aç: <https://discord.com/app> (uygulama değil).
2. Giriş yaptığın hesapla, izlemek istediğin sunucuda ol.
3. `F12` → **Network** (Ağ) sekmesi.
4. Filtreye `/api` yaz. Discord'da herhangi bir kanala tıkla ki istek düşsün.
5. Listeden bir isteğe tıkla → **Headers** → **Request Headers** altında
   `authorization:` satırını bul. Karşısındaki uzun metin senin **token'ın**.
   (Tırnak yok, `Bearer` yok — direkt metin.)
6. Kopyala. Birazdan Vercel'e gireceğiz.

> Alternatif: Console sekmesine geçip şunu yapıştır (Discord bazen Console'u
> kilitler, o zaman yukarıdaki Network yöntemini kullan):
> ```js
> (webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()
> ```

---

## 2) Sunucu (guild) kimliğini ve GM isimlerini hazırla

**Geliştirici Modu'nu aç:** Discord → **Ayarlar** (dişli) → **Gelişmiş** →
**Geliştirici Modu**'nu aç.

**Sunucu kimliği:** İzlemek istediğin sunucunun adına/simgesine **sağ tık** →
**Sunucu Kimliğini Kopyala**. (Sadece rakamlardan oluşur.)

**GM isimleri:** GM'lerin Discord **kullanıcı adları** (username — @'siz, küçük harf).
Her isme risk seviyesi ekleyebilirsin: `:yuksek` veya `:dusuk` (yazmazsan `yuksek` sayılır).

```
pegasustr:yuksek, disfrutotr:dusuk
```

- **yuksek** → Telegram'a sert uyarı gider ("YÜKSEK RİSK, oyunu HEMEN kapatın").
- **dusuk** → daha yumuşak uyarı gider ("düşük risk, dikkatli olun").
- Büyük/küçük harf önemli değil. Hem kullanıcı adı, hem görünen ad, hem takma adla eşleşir.

---

## 3) Vercel'e değerleri gir

Vercel → projen → **Settings** → **Environment Variables**. Şunları ekle:

| Ad | Değer |
|----|-------|
| `DISCORD_TOKEN` | 1. adımda aldığın token |
| `DISCORD_GUILD` | 2. adımdaki sunucu kimliği |
| `GM_ISIMLER` | `GM_Ali,GM Veli` (kendi listen) |
| `GM_TARA_GIZLI` | rastgele bir metin (aşağıda üret) |

`GM_TARA_GIZLI` üretmek için (terminalde):

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

Kaydettikten sonra **Deployments** → son dağıtımı **Redeploy** et (değişkenler
ancak yeniden dağıtımda aktif olur).

---

## 4) 30 saniyede bir yoklayan zamanlayıcıyı kur

Sunucu sürekli açık değil (serverless), o yüzden dışarıdan biri `/api/gm` ucunu
düzenli dürtmeli. Ücretsiz **cron-job.org** kullanıyoruz:

1. <https://cron-job.org> → ücretsiz üye ol.
2. **Create cronjob**.
3. **URL:**
   ```
   https://SENIN-SITEN.vercel.app/api/gm?anahtar=GM_TARA_GIZLI_DEGERI
   ```
   (`SENIN-SITEN` ve `GM_TARA_GIZLI_DEGERI` yerine kendi değerlerini yaz.)
4. **Schedule:** "Every 1 minute" (en sık ücretsiz seçenek). Daha sık istersen
   iki ayrı cronjob'ı 30 sn kaydırarak kurabilirsin, ama 1 dk yeterli.
5. Kaydet. Hepsi bu.

> **Test:** Tarayıcıda `https://SENIN-SITEN.vercel.app/api/gm?anahtar=...`
> adresini aç. `{"ok":true,"aktif":[...],"izlenen":N}` görmelisin.
> - `"ok":false,"sebep":"ayarsiz"` → env değerleri eksik/redeploy yapılmadı.
> - `401` → `anahtar` yanlış.
> - `"hata":"..."` → Discord bağlantısı kurulamadı (token yanlış olabilir).

---

## Nasıl çalışıyor (kısaca)

1. cron-job.org her dakika `/api/gm`'i dürtér.
2. Uç, Discord'a **kısa** bir bağlantı açar, GM'lerin çevrimiçi olup olmadığına
   bakar, kapatır.
3. **Yeni** çevrimiçi olan GM varsa tüm müşterilere Telegram uyarısı gider.
   (Aynı GM açık kaldığı sürece tekrar uyarı gitmez — spam olmaz.)
4. Müşteri butona basınca komut kendi PC'lerine düşer; bot uygular.

## Sık sorulanlar

- **GM listesini değiştirmek:** Vercel'de `GM_ISIMLER`'i güncelle → redeploy. Bot
  güncellemeye gerek yok.
- **Geçici kapatmak:** cron-job.org'daki görevi duraklat. Ya da `GM_TARA_GIZLI`'yi
  değiştir (eski adres çalışmaz olur).
- **Yanlış alarm / hiç alarm gelmiyor:** Discord'un çevrimiçi bilgisini normal
  hesaplara resmî bir yolla vermediği için okuma yöntemi sunucuya göre ayar
  isteyebilir. `/api/gm`'i elle açıp `aktif` listesinde GM'i görüyor musun bak;
  görünmüyorsa bana söyle, okuma yöntemini senin sunucuna göre ayarlayayım.
