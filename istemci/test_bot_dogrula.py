# -*- coding: utf-8 -*-
"""Calistirma:  python -m pytest istemci/test_bot_dogrula.py   (ya da python test_bot_dogrula.py)"""
import os
import sys

import cv2
import numpy as np
import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bot_dogrula as bd  # noqa: E402

W, H = bd.PENCERE_BOYUT
ORIGIN = (478, 207)


def kutu_ciz(sayi, renk=(80, 200, 230), gurultu=0, seed=0):
    x1, y1, x2, y2 = bd.SAYI_KUTUSU
    k = np.full((y2 - y1, x2 - x1, 3), (20, 25, 20), np.uint8)
    cv2.putText(k, sayi, (3, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.75, renk, 2, cv2.LINE_AA)
    if gurultu:
        rng = np.random.default_rng(seed)
        k = np.clip(k.astype(int) + rng.integers(-gurultu, gurultu + 1, k.shape), 0, 255).astype(np.uint8)
    return k


def ekran_ciz(sayi=None, **kw):
    rng = np.random.default_rng(1)
    g = rng.integers(0, 60, (600, 800, 3)).astype(np.uint8)  # sahte oyun arka plani
    if sayi is None:
        return g
    ox, oy = ORIGIN
    p = np.full((H, W, 3), (35, 35, 35), np.uint8)
    cv2.rectangle(p, (0, 0), (W - 1, H - 1), (150, 150, 150), 1)
    for ad, (x, y) in bd.TUSLAR.items():
        cv2.rectangle(p, (x - 15, y - 9), (x + 15, y + 9), (90, 90, 90), -1)
        cv2.putText(p, ad[:2], (x - 8, y + 4), cv2.FONT_HERSHEY_PLAIN, 0.9, (220, 220, 220), 1)
    x1, y1, x2, y2 = bd.SAYI_KUTUSU
    p[y1:y2, x1:x2] = kutu_ciz(sayi, **kw)
    g[oy:oy + H, ox:ox + W] = p
    return g


@pytest.fixture
def klasor(tmp_path):
    """pencere.png + her rakamdan sablon (gercek --ogren hattiyla uretilir)."""
    cv2.imwrite(str(tmp_path / "pencere.png"), ekran_ciz("00")[ORIGIN[1]:ORIGIN[1] + H, ORIGIN[0]:ORIGIN[0] + W])
    (tmp_path / "rakamlar").mkdir()
    for sayi in ["01", "23", "45", "67", "89"]:
        for i, parca in enumerate(bd.rakamlari_ayir(kutu_ciz(sayi))):
            assert parca.shape == (bd.RAKAM_BOYUT[1], bd.RAKAM_BOYUT[0])
            cv2.imwrite(str(tmp_path / "rakamlar" / ("%s_0.png" % sayi[i])), parca)
    return str(tmp_path)


class SahteEkran:
    def __init__(self, sayi, **kw):
        self.sayi, self.kw, self.acik = sayi, kw, True

    def al(self):
        return ekran_ciz(self.sayi if self.acik else None, **self.kw)


class SahteFare:
    """Tiklamalari kaydeder; Clear sonrasi girilenler dogruysa OK'te pencereyi kapatir."""
    def __init__(self, ekran, dogru):
        self.ekran, self.dogru, self.girilen, self.log = ekran, dogru, "", []

    def tikla(self, x, y):
        rx, ry = x - ORIGIN[0], y - ORIGIN[1]
        for ad, (tx, ty) in bd.TUSLAR.items():
            if abs(rx - tx) <= 12 and abs(ry - ty) <= 7:  # tusun icine dusmeli
                self.log.append(ad)
                if ad == "Clear":
                    self.girilen = ""
                elif ad.isdigit():
                    self.girilen += ad
                elif ad == "OK" and self.girilen == self.dogru:
                    self.ekran.acik = False
                return
        self.log.append("ISKA")


def kur(klasor, sayi, **kw):
    e = SahteEkran(sayi, **kw)
    f = SahteFare(e, sayi)
    b = bd.BotDogrula(klasor=klasor, ekran=e, fare=f, log=lambda *a: None)
    return b, e, f


@pytest.fixture(autouse=True)
def hizli(monkeypatch):
    monkeypatch.setattr(bd.time, "sleep", lambda s: None)


def test_pencere_bulunur(klasor):
    b, _, _ = kur(klasor, "94")
    assert b.pencereyi_bul() == ORIGIN


def test_pencere_yoksa_none(klasor):
    b, e, _ = kur(klasor, "94")
    e.acik = False
    assert b.pencereyi_bul() is None and not b.pencere_var_mi()


@pytest.mark.parametrize("sayi", ["94", "07", "38", "51", "26", "40", "19", "83"])
def test_sayi_okunur(klasor, sayi):
    b, _, _ = kur(klasor, sayi)
    assert b.sayiyi_oku() == sayi


def test_farkli_renk_ve_gurultu(klasor):
    b, _, _ = kur(klasor, "94", renk=(60, 230, 90), gurultu=12)  # yesil zemin/rakam, gurultulu
    assert b.sayiyi_oku() == "94"


@pytest.mark.parametrize("sayi", ["94", "05", "78"])
def test_coz_tiklar_ve_kapatir(klasor, sayi):
    b, e, f = kur(klasor, sayi)
    assert b.coz() is True
    assert f.log == ["Clear", sayi[0], sayi[1], "OK"]
    assert "ISKA" not in f.log


def test_yanlis_okuma_tiklamaz(klasor):
    b, e, f = kur(klasor, "94")
    b.okuyucu.sablonlar = []  # sablon yok
    with pytest.raises(bd.DogrulamaHatasi):
        b.sayiyi_oku()
    assert b.coz() is False and f.log == []  # hic tiklanmadi


def test_pencere_kapanmazsa_tekrar_dener(klasor):
    b, e, f = kur(klasor, "94")
    f.dogru = "00"  # OK hic kabul etmesin
    assert b.coz(deneme=2) is False
    assert f.log.count("OK") == 2 and f.log.count("Clear") == 2


def test_sabit_origin_sablon_istemez(tmp_path):
    e = SahteEkran("94")
    f = SahteFare(e, "94")
    b = bd.BotDogrula(klasor=str(tmp_path), ekran=e, fare=f, origin=ORIGIN, log=lambda *a: None)
    assert b.pencereyi_bul() == ORIGIN


def test_bekle_ve_coz_pencere_gelmezse_none(klasor):
    b, e, _ = kur(klasor, "94")
    e.acik = False
    assert b.bekle_ve_coz(zaman_asimi=0) is None


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
