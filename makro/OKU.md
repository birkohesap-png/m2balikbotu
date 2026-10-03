# K34 Makro

Metin2 için basit tuş makrosu.

## Özellikler
- **Client seçimi:** Açık Metin2 pencereleri listelenir, hangisinde çalışacağını seçersin (`Yenile` ile liste güncellenir). Pencere adı farklı olan serverlar için "Tüm pencereleri göster".
- **1-2-3-4-5-6 ve F1-F6:** Kutuyu işaretleyince "kaç saniyede bir bassın kanka?" diye sorar. Girdiğin saniyede bir o tuşa basar (en az 0.1 sn, ondalık olur: `2.5`).
- **Space:** Aktifse Space sürekli basılı tutulur (otomatik vuruş).
- **Başlat / Durdur:** Butonlardan ya da her yerden **F10** ile.
- **Arka planda çalış:** Açıkken client önde olmasa da tuşlar gider. Bazı serverlarda arka plan tuşu çalışmazsa bu kutuyu kapat; o zaman gerçek klavye gibi basar ama sadece client öndeyken (başka pencereye yanlışlıkla yazmasın diye).
- Ayarlar `k34_makro_ayar.json` dosyasına kaydedilir, bir dahaki açılışta hatırlanır.
- Client kapanırsa makro kendini durdurur.

## Çalıştırma
```
python k34_makro.py
```
Ek kütüphane gerekmez (Python 3.8+, Windows). Client yönetici olarak açıksa makroyu da yönetici olarak çalıştır.

## .exe yapma
`exe_yap.bat` dosyasına çift tıkla → `dist\K34Makro.exe`.
