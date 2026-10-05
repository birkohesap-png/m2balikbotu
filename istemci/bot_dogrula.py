# -*- coding: utf-8 -*-
"""
bot_dogrula.py - Oyunun "Bot Verify" (bot dogrulama) penceresini cozer.

Akis:
  1. Ekranda dogrulama penceresini bulur (pencere.png sablonu ya da sabit konum).
  2. Soldaki kutudaki sayiyi okur (rakamlar/ klasorundeki sablonlarla).
  3. Numpad tuslarina mouse ile tek tek tiklar, sonra OK'e basar.
  4. Pencere kapandiysa basarili sayar; kapanmadiysa Clear + tekrar dener.

Bagimsiz calisir: botun kaynagina dokunmaz. Bota baglamak icin:

    from bot_dogrula import BotDogrula
    bd = BotDogrula(klasor=r"C:\\...\\istemci")
    if bd.pencere_var_mi():
        ok = bd.coz()          # True/False
        if not ok: ...         # botu durdur / Telegram'a haber ver

Gereken paketler:  pip install numpy opencv-python mss pyautogui
Komut satiri (ilk kurulum / test):
    python bot_dogrula.py --pencere-kaydet   # pencere.png sablonunu olusturur
    python bot_dogrula.py --ogren            # rakam sablonu toplar (pencere acikken)
    python bot_dogrula.py --test             # sayiyi okur, TIKLAMAZ
    python bot_dogrula.py --coz              # penceresi aciksa cozer

NOT: Konumlar ve rakam sablonlari gercek oyun ekraniyla kalibre edilmelidir.
Asagidaki sabitler 800x600 ornek ekran goruntusunden olculmustur.
"""
import os
import random
import sys
import time

import cv2
import numpy as np

# ---- Pencere geometrisi (pencerenin SOL UST kosesine gore, piksel) ----------
PENCERE_BOYUT = (142, 166)  # genislik, yukseklik (sablon kirpma boyu)
TUSLAR = {
    "1": (35, 55), "2": (74, 55), "3": (119, 55),
    "4": (35, 80), "5": (74, 80), "6": (119, 80),
    "7": (35, 104), "8": (74, 104), "9": (119, 104),
    "Clear": (35, 128), "0": (74, 128), "Delete": (119, 128),
    "OK": (73, 154),
}
SAYI_KUTUSU = (8, 6, 47, 36)  # x1, y1, x2, y2 (sayinin cizildigi kutu)

RAKAM_BOYUT = (16, 24)        # sablon karsilastirma boyutu (genislik, yukseklik)
ESIK_GUVEN = 0.55             # bunun altindaki rakam okumasi guvenilmez sayilir
SABLON_ESIK = 0.80            # pencere sablonu eslesme esigi


class DogrulamaHatasi(Exception):
    pass


# ---- Arka uclar (testte sahte olanlar verilir) ------------------------------
class EkranMss:
    def __init__(self):
        import mss
        self._mss = mss.mss()

    def al(self):
        """Tum ana ekrani BGR numpy dizisi olarak dondurur."""
        ham = self._mss.grab(self._mss.monitors[1])
        return np.ascontiguousarray(np.array(ham)[:, :, :3])


class FarePyAutoGui:
    def __init__(self):
        import pyautogui
        pyautogui.FAILSAFE = False
        self._p = pyautogui

    def tikla(self, x, y):
        self._p.moveTo(x, y, duration=random.uniform(0.08, 0.22))
        time.sleep(random.uniform(0.04, 0.10))
        self._p.click()

    def konum(self):
        return tuple(self._p.position())


# ---- Sayi okuma -------------------------------------------------------------
def _on_isle(kutu_bgr):
    """Kutuyu ikili goruntuye cevirir (rakam = beyaz). Renk/koyu-acik fark etmez."""
    gri = cv2.cvtColor(kutu_bgr, cv2.COLOR_BGR2GRAY)
    gri = cv2.resize(gri, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)
    gri = cv2.GaussianBlur(gri, (3, 3), 0)
    _, ikili = cv2.threshold(gri, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    if np.count_nonzero(ikili) > ikili.size / 2:  # rakam azinlikta olmali
        ikili = cv2.bitwise_not(ikili)
    ikili = cv2.morphologyEx(ikili, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    return ikili


def rakamlari_ayir(kutu_bgr):
    """Kutudan soldan saga sirali rakam goruntulerini (RAKAM_BOYUT) dondurur."""
    ikili = _on_isle(kutu_bgr)
    h = ikili.shape[0]
    kapali = cv2.morphologyEx(ikili, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    konturlar, _ = cv2.findContours(kapali, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    kutular = [cv2.boundingRect(c) for c in konturlar]
    kutular = [b for b in kutular if b[3] >= 0.35 * h and b[2] >= 0.08 * h]
    kutular.sort(key=lambda b: b[0])
    # Birbirine degen rakamlar tek parca cikarsa ikiye bol
    if len(kutular) == 1 and kutular[0][2] > 0.9 * kutular[0][3]:
        x, y, w, hh = kutular[0]
        kutular = [(x, y, w // 2, hh), (x + w // 2, y, w - w // 2, hh)]
    parcalar = []
    for x, y, w, hh in kutular:
        parca = ikili[y:y + hh, x:x + w]
        parcalar.append(cv2.resize(parca, RAKAM_BOYUT, interpolation=cv2.INTER_AREA))
    return parcalar


class RakamOkuyucu:
    """rakamlar/<rakam>_*.png dosyalarindan sablon yukler; en yakin rakami secer."""

    def __init__(self, klasor):
        self.klasor = klasor
        self.sablonlar = []  # (rakam, goruntu)
        self.yukle()

    def yukle(self):
        self.sablonlar = []
        if not os.path.isdir(self.klasor):
            return
        for ad in sorted(os.listdir(self.klasor)):
            if not ad.lower().endswith(".png") or not ad[0].isdigit():
                continue
            g = cv2.imread(os.path.join(self.klasor, ad), cv2.IMREAD_GRAYSCALE)
            if g is None:
                continue
            g = cv2.resize(g, RAKAM_BOYUT, interpolation=cv2.INTER_AREA)
            self.sablonlar.append((ad[0], g))

    def rakam_tani(self, parca):
        """(rakam, guven) dondurur. Sablon yoksa DogrulamaHatasi."""
        if not self.sablonlar:
            raise DogrulamaHatasi("rakam sablonu yok - once --ogren calistir")
        en_iyi, en_guven = None, -1.0
        for rakam, s in self.sablonlar:
            puan = float(cv2.matchTemplate(parca, s, cv2.TM_CCOEFF_NORMED)[0][0])
            if puan > en_guven:
                en_iyi, en_guven = rakam, puan
        return en_iyi, en_guven

    def oku(self, kutu_bgr):
        """Kutudaki sayiyi string olarak dondurur; emin degilse DogrulamaHatasi."""
        parcalar = rakamlari_ayir(kutu_bgr)
        if not parcalar:
            raise DogrulamaHatasi("kutuda rakam bulunamadi")
        sonuc = ""
        for p in parcalar:
            r, guven = self.rakam_tani(p)
            if guven < ESIK_GUVEN:
                raise DogrulamaHatasi("dusuk guven (%.2f) - rakam sablonu eksik" % guven)
            sonuc += r
        return sonuc


# ---- Ana sinif --------------------------------------------------------------
class BotDogrula:
    def __init__(self, klasor=None, ekran=None, fare=None, okuyucu=None,
                 origin=None, log=print):
        """
        klasor : pencere.png ve rakamlar/ klasorunun bulundugu yer (varsayilan: bu dosya)
        origin : pencere sol-ust kosesi (x, y) sabitse; verilirse sablon aranmaz
        ekran/fare/okuyucu : test icin degistirilebilir
        """
        self.klasor = klasor or os.path.dirname(os.path.abspath(__file__))
        self._ekran = ekran
        self._fare = fare
        self.okuyucu = okuyucu or RakamOkuyucu(os.path.join(self.klasor, "rakamlar"))
        self.origin = origin
        self.log = log
        self._sablon = None

    # arka uclar tembel acilir (import hatasi sadece kullanilinca cikar)
    @property
    def ekran(self):
        if self._ekran is None:
            self._ekran = EkranMss()
        return self._ekran

    @property
    def fare(self):
        if self._fare is None:
            self._fare = FarePyAutoGui()
        return self._fare

    def _pencere_sablonu(self):
        if self._sablon is None:
            yol = os.path.join(self.klasor, "pencere.png")
            self._sablon = cv2.imread(yol, cv2.IMREAD_COLOR)
        return self._sablon

    def pencereyi_bul(self, goruntu=None):
        """Pencerenin sol-ust (x, y) konumunu dondurur; yoksa None."""
        goruntu = self.ekran.al() if goruntu is None else goruntu
        if self.origin is not None:
            return self.origin
        s = self._pencere_sablonu()
        if s is None:
            raise DogrulamaHatasi("pencere.png yok - once --pencere-kaydet calistir")
        sh, sw = s.shape[:2]
        if goruntu.shape[0] < sh or goruntu.shape[1] < sw:
            return None
        sonuc = cv2.matchTemplate(goruntu, s, cv2.TM_CCOEFF_NORMED)
        _, en, _, konum = cv2.minMaxLoc(sonuc)
        return konum if en >= SABLON_ESIK else None

    def pencere_var_mi(self):
        return self.pencereyi_bul() is not None

    def sayiyi_oku(self, goruntu=None, konum=None):
        goruntu = self.ekran.al() if goruntu is None else goruntu
        konum = konum or self.pencereyi_bul(goruntu)
        if konum is None:
            raise DogrulamaHatasi("dogrulama penceresi bulunamadi")
        x, y = konum
        x1, y1, x2, y2 = SAYI_KUTUSU
        return self.okuyucu.oku(goruntu[y + y1:y + y2, x + x1:x + x2])

    def _tikla(self, konum, ad):
        ox, oy = TUSLAR[ad]
        # Tusun ortasindan +-2 piksel sapma (insan gibi)
        self.fare.tikla(konum[0] + ox + random.randint(-2, 2),
                        konum[1] + oy + random.randint(-2, 2))
        time.sleep(random.uniform(0.12, 0.30))

    def coz(self, deneme=3, bekle=1.0):
        """Pencereyi cozer. Pencere kapandiysa True, vazgecerse False."""
        for n in range(1, deneme + 1):
            goruntu = self.ekran.al()
            konum = self.pencereyi_bul(goruntu)
            if konum is None:
                return n > 1  # onceki denemede kapanmis olabilir
            try:
                sayi = self.sayiyi_oku(goruntu, konum)
            except DogrulamaHatasi as e:
                self.log("[dogrula] okuma basarisiz: %s" % e)
                return False
            self.log("[dogrula] deneme %d: sayi=%s" % (n, sayi))
            self._tikla(konum, "Clear")
            for ch in sayi:
                self._tikla(konum, ch)
            self._tikla(konum, "OK")
            time.sleep(bekle)
            if self.pencereyi_bul() is None:
                self.log("[dogrula] tamam")
                return True
            self.log("[dogrula] pencere hala acik, tekrar deneniyor")
        return False

    def bekle_ve_coz(self, zaman_asimi=10.0, aralik=0.5):
        """Pencere acilana kadar bekler (en fazla zaman_asimi sn), sonra cozer."""
        bitis = time.time() + zaman_asimi
        while time.time() < bitis:
            if self.pencere_var_mi():
                return self.coz()
            time.sleep(aralik)
        return None  # pencere hic acilmadi


# ---- Kalibrasyon / komut satiri ---------------------------------------------
def _geri_sayim(sn, mesaj):
    for i in range(sn, 0, -1):
        print("%s (%d)" % (mesaj, i))
        time.sleep(1)


def pencere_kaydet(bd):
    _geri_sayim(5, "Fareyi dogrulama penceresinin SOL UST kosesine gotur")
    x, y = bd.fare.konum()
    g = bd.ekran.al()
    w, h = PENCERE_BOYUT
    yol = os.path.join(bd.klasor, "pencere.png")
    cv2.imwrite(yol, g[y:y + h, x:x + w])
    print("Kaydedildi:", yol, "- ayni pencere ekrandayken --test ile dene")


def ogren(bd):
    klasor = os.path.join(bd.klasor, "rakamlar")
    os.makedirs(klasor, exist_ok=True)
    g = bd.ekran.al()
    konum = bd.pencereyi_bul(g)
    if konum is None:
        sys.exit("Pencere bulunamadi")
    x, y = konum
    x1, y1, x2, y2 = SAYI_KUTUSU
    kutu = g[y + y1:y + y2, x + x1:x + x2]
    cv2.imwrite(os.path.join(klasor, "_son_kutu.png"), kutu)
    cevap = input("Kutudaki sayi nedir? ").strip()
    parcalar = rakamlari_ayir(kutu)
    if len(parcalar) != len(cevap) or not cevap.isdigit():
        sys.exit("Ayrilan parca (%d) != rakam sayisi (%d); _son_kutu.png'yi bana gonder"
                 % (len(parcalar), len(cevap)))
    for ch, p in zip(cevap, parcalar):
        cv2.imwrite(os.path.join(klasor, "%s_%d.png" % (ch, int(time.time() * 1000))), p)
        time.sleep(0.002)
    print("%d rakam sablonu eklendi. Her rakamdan 3-5 ornek toplamak dogruluyu arttirir."
          % len(cevap))


def main(argv):
    bd = BotDogrula()
    if "--pencere-kaydet" in argv:
        pencere_kaydet(bd)
    elif "--ogren" in argv:
        ogren(bd)
    elif "--test" in argv:
        print("Okunan sayi:", bd.sayiyi_oku())
    elif "--coz" in argv:
        print("Sonuc:", bd.coz())
    else:
        print(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
