# -*- coding: utf-8 -*-
"""K34 Makro - Metin2 icin basit tus makrosu.

- Client (Metin2 penceresi) secilir
- 1-6 ve F1-F6 tuslari icin "kac saniyede bir basilsin" ayarlanir
- Space istenirse surekli basili tutulur
- Baslat / Durdur (ya da F10 kisayolu)

Sadece Windows'ta calisir. Python 3.8+ ile:  python k34_makro.py
"""

import ctypes
import json
import os
import sys
import threading
import time
import tkinter as tk
from ctypes import wintypes
from tkinter import messagebox, simpledialog, ttk

if sys.platform != "win32":
    raise SystemExit("Bu makro sadece Windows'ta calisir.")

user32 = ctypes.WinDLL("user32", use_last_error=True)

# ---------------------------------------------------------------------------
# Tus tanimlari: isim -> (sanal tus kodu, scan kodu)
# ---------------------------------------------------------------------------
TUSLAR = {
    "1": (0x31, 0x02), "2": (0x32, 0x03), "3": (0x33, 0x04),
    "4": (0x34, 0x05), "5": (0x35, 0x06), "6": (0x36, 0x07),
    "F1": (0x70, 0x3B), "F2": (0x71, 0x3C), "F3": (0x72, 0x3D),
    "F4": (0x73, 0x3E), "F5": (0x74, 0x3F), "F6": (0x75, 0x40),
}
SPACE = (0x20, 0x39)
KISAYOL_VK = 0x79  # F10 -> baslat/durdur

WM_KEYDOWN = 0x0100
WM_KEYUP = 0x0101
INPUT_KEYBOARD = 1
KEYEVENTF_KEYUP = 0x0002
KEYEVENTF_SCANCODE = 0x0008
SW_RESTORE = 9

AYAR_DOSYASI = os.path.join(
    os.path.dirname(os.path.abspath(sys.argv[0])), "k34_makro_ayar.json"
)

# ---------------------------------------------------------------------------
# Win32 yardimcilari
# ---------------------------------------------------------------------------
ULONG_PTR = ctypes.c_size_t


class KEYBDINPUT(ctypes.Structure):
    _fields_ = [("wVk", wintypes.WORD), ("wScan", wintypes.WORD),
                ("dwFlags", wintypes.DWORD), ("time", wintypes.DWORD),
                ("dwExtraInfo", ULONG_PTR)]


class MOUSEINPUT(ctypes.Structure):
    _fields_ = [("dx", wintypes.LONG), ("dy", wintypes.LONG),
                ("mouseData", wintypes.DWORD), ("dwFlags", wintypes.DWORD),
                ("time", wintypes.DWORD), ("dwExtraInfo", ULONG_PTR)]


class _INPUTUNION(ctypes.Union):
    _fields_ = [("ki", KEYBDINPUT), ("mi", MOUSEINPUT)]


class INPUT(ctypes.Structure):
    _fields_ = [("type", wintypes.DWORD), ("u", _INPUTUNION)]


EnumWindowsProc = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
user32.EnumWindows.argtypes = [EnumWindowsProc, wintypes.LPARAM]
user32.GetWindowTextLengthW.argtypes = [wintypes.HWND]
user32.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
user32.IsWindowVisible.argtypes = [wintypes.HWND]
user32.IsWindow.argtypes = [wintypes.HWND]
user32.PostMessageW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
user32.SendInput.argtypes = [wintypes.UINT, ctypes.POINTER(INPUT), ctypes.c_int]
user32.GetForegroundWindow.restype = wintypes.HWND
user32.SetForegroundWindow.argtypes = [wintypes.HWND]
user32.ShowWindow.argtypes = [wintypes.HWND, ctypes.c_int]
user32.GetAsyncKeyState.argtypes = [ctypes.c_int]
user32.GetAsyncKeyState.restype = ctypes.c_short


def pencereleri_listele(sadece_metin2=True):
    """Gorunur pencereleri (hwnd, baslik) olarak dondurur."""
    sonuc = []

    def cb(hwnd, _):
        if not user32.IsWindowVisible(hwnd):
            return True
        uzunluk = user32.GetWindowTextLengthW(hwnd)
        if uzunluk == 0:
            return True
        buf = ctypes.create_unicode_buffer(uzunluk + 1)
        user32.GetWindowTextW(hwnd, buf, uzunluk + 1)
        baslik = buf.value
        if not sadece_metin2 or "metin" in baslik.lower():
            sonuc.append((hwnd, baslik))
        return True

    user32.EnumWindows(EnumWindowsProc(cb), 0)
    return sonuc


def _lparam(scan, yukari, tekrar=False):
    lp = 1 | (scan << 16)
    if tekrar or yukari:
        lp |= 1 << 30
    if yukari:
        lp |= 1 << 31
    return lp


def _send_scan(scan, yukari):
    flags = KEYEVENTF_SCANCODE | (KEYEVENTF_KEYUP if yukari else 0)
    inp = INPUT(type=INPUT_KEYBOARD)
    inp.u.ki = KEYBDINPUT(0, scan, flags, 0, 0)
    user32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(INPUT))


class Gonderici:
    """Tusu secili pencereye iletir.

    arka_plan=True  -> PostMessage (pencere arkada olsa da gider, cogu client'ta calisir)
    arka_plan=False -> SendInput (gercek klavye gibi; sadece pencere ondeyken basar)
    """

    def __init__(self, hwnd, arka_plan):
        self.hwnd = hwnd
        self.arka_plan = arka_plan

    def hedef_onde(self):
        return user32.GetForegroundWindow() == self.hwnd

    def bas(self, tus):
        vk, scan = tus
        if self.arka_plan:
            user32.PostMessageW(self.hwnd, WM_KEYDOWN, vk, _lparam(scan, False))
            time.sleep(0.04)
            user32.PostMessageW(self.hwnd, WM_KEYUP, vk, _lparam(scan, True))
        elif self.hedef_onde():
            _send_scan(scan, False)
            time.sleep(0.04)
            _send_scan(scan, True)

    def basili_tut(self, tus, ilk):
        vk, scan = tus
        if self.arka_plan:
            user32.PostMessageW(self.hwnd, WM_KEYDOWN, vk, _lparam(scan, False, tekrar=not ilk))
        elif self.hedef_onde():
            _send_scan(scan, False)

    def birak(self, tus):
        vk, scan = tus
        if self.arka_plan:
            user32.PostMessageW(self.hwnd, WM_KEYUP, vk, _lparam(scan, True))
        else:
            _send_scan(scan, True)


# ---------------------------------------------------------------------------
# Makro dongusu
# ---------------------------------------------------------------------------
class Makro(threading.Thread):
    def __init__(self, gonderici, araliklar, space, durum_cb):
        super().__init__(daemon=True)
        self.g = gonderici
        self.araliklar = araliklar  # {"1": 2.5, "F1": 10, ...}
        self.space = space
        self.durum_cb = durum_cb
        self._dur = threading.Event()

    def durdur(self):
        self._dur.set()

    def run(self):
        simdi = time.monotonic()
        # Ilk basis hemen olsun, sonra her aralikta bir
        siradaki = {ad: simdi for ad in self.araliklar}
        sayac = {ad: 0 for ad in self.araliklar}
        space_ilk = True
        son_space = 0.0
        son_ozet = None
        try:
            while not self._dur.is_set():
                if not user32.IsWindow(self.g.hwnd):
                    self.durum_cb("Client kapandi, makro durdu.", bitti=True)
                    return
                simdi = time.monotonic()
                if self.space and simdi - son_space >= 0.05:
                    self.g.basili_tut(SPACE, space_ilk)
                    space_ilk = False
                    son_space = simdi
                for ad, aralik in self.araliklar.items():
                    if simdi >= siradaki[ad]:
                        self.g.bas(TUSLAR[ad])
                        sayac[ad] += 1
                        siradaki[ad] = simdi + aralik
                ozet = "  ".join(f"{ad}:{n}" for ad, n in sayac.items())
                if ozet != son_ozet:
                    son_ozet = ozet
                    self.durum_cb(f"Calisiyor  |  {ozet or 'Space basili'}")
                self._dur.wait(0.02)
        finally:
            if self.space:
                self.g.birak(SPACE)


# ---------------------------------------------------------------------------
# Arayuz
# ---------------------------------------------------------------------------
class Uygulama(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("K34 Makro")
        self.resizable(False, False)
        self.attributes("-topmost", True)

        self.makro = None
        self.pencereler = []
        self.tus_acik = {ad: tk.BooleanVar() for ad in TUSLAR}
        self.tus_sure = {ad: tk.StringVar() for ad in TUSLAR}
        self.space_var = tk.BooleanVar()
        self.arka_plan_var = tk.BooleanVar(value=True)
        self.tum_pencereler_var = tk.BooleanVar()
        self.durum_var = tk.StringVar(value="Hazir. Client sec, tuslari ayarla, Baslat'a bas.")
        self._f10_onceki = False

        self._arayuz()
        self._ayar_yukle()
        self.yenile()
        self.after(100, self._kisayol_kontrol)
        self.protocol("WM_DELETE_WINDOW", self._kapat)

    # --- arayuz kurulumu ---
    def _arayuz(self):
        p = {"padx": 6, "pady": 4}

        cf = ttk.LabelFrame(self, text="Client Secimi")
        cf.grid(row=0, column=0, sticky="ew", **p)
        self.client_cb = ttk.Combobox(cf, state="readonly", width=42)
        self.client_cb.grid(row=0, column=0, **p)
        ttk.Button(cf, text="Yenile", command=self.yenile).grid(row=0, column=1, **p)
        ttk.Checkbutton(cf, text="Tum pencereleri goster (Metin2 adi farkliysa)",
                        variable=self.tum_pencereler_var,
                        command=self.yenile).grid(row=1, column=0, columnspan=2, sticky="w", padx=6)
        ttk.Checkbutton(cf, text="Arka planda calis (client ondeyken olmasa da basar)",
                        variable=self.arka_plan_var).grid(row=2, column=0, columnspan=2, sticky="w", padx=6)

        tf = ttk.LabelFrame(self, text="Tuslar  (kutuyu isaretle, kac saniyede bir basilacagini yaz)")
        tf.grid(row=1, column=0, sticky="ew", **p)
        for i, ad in enumerate(TUSLAR):
            satir, sutun = i % 6, (i // 6) * 3
            ttk.Checkbutton(tf, text=ad, width=4, variable=self.tus_acik[ad],
                            command=lambda a=ad: self._tus_degisti(a)
                            ).grid(row=satir, column=sutun, sticky="w", padx=(8, 0), pady=2)
            ttk.Entry(tf, width=7, textvariable=self.tus_sure[ad]
                      ).grid(row=satir, column=sutun + 1, pady=2)
            ttk.Label(tf, text="sn").grid(row=satir, column=sutun + 2, sticky="w", padx=(2, 14))

        sf = ttk.LabelFrame(self, text="Space")
        sf.grid(row=2, column=0, sticky="ew", **p)
        ttk.Checkbutton(sf, text="Space'i surekli basili tut (otomatik vurus)",
                        variable=self.space_var).grid(row=0, column=0, sticky="w", **p)

        bf = ttk.Frame(self)
        bf.grid(row=3, column=0, sticky="ew", **p)
        self.baslat_btn = ttk.Button(bf, text="BASLAT  (F10)", command=self.baslat)
        self.baslat_btn.pack(side="left", expand=True, fill="x", padx=3)
        self.durdur_btn = ttk.Button(bf, text="DURDUR  (F10)", command=self.durdur, state="disabled")
        self.durdur_btn.pack(side="left", expand=True, fill="x", padx=3)

        ttk.Label(self, textvariable=self.durum_var, foreground="#555",
                  wraplength=380).grid(row=4, column=0, sticky="w", padx=8, pady=(0, 8))

    def _tus_degisti(self, ad):
        """Kutu isaretlenince sure bossa kullaniciya sor."""
        if not self.tus_acik[ad].get() or self.tus_sure[ad].get().strip():
            return
        sure = simpledialog.askfloat(
            "Sure", f"{ad} tusuna kac saniyede bir bassin kanka?",
            parent=self, minvalue=0.1, maxvalue=86400)
        if sure is None:
            self.tus_acik[ad].set(False)
        else:
            self.tus_sure[ad].set(f"{sure:g}")

    # --- client listesi ---
    def yenile(self):
        secili = self._secili_hwnd()
        self.pencereler = [(h, b) for h, b in pencereleri_listele(not self.tum_pencereler_var.get())
                           if b != self.title()]
        self.client_cb["values"] = [f"{b}  [{h}]" for h, b in self.pencereler]
        hwndler = [h for h, _ in self.pencereler]
        if secili in hwndler:
            self.client_cb.current(hwndler.index(secili))
        elif self.pencereler:
            self.client_cb.current(0)
        else:
            self.client_cb.set("")
            self.durum_var.set("Metin2 client bulunamadi. Oyunu ac ve Yenile'ye bas.")

    def _secili_hwnd(self):
        i = self.client_cb.current()
        return self.pencereler[i][0] if 0 <= i < len(self.pencereler) else None

    # --- baslat / durdur ---
    def baslat(self):
        if self.makro:
            return
        hwnd = self._secili_hwnd()
        if not hwnd or not user32.IsWindow(hwnd):
            messagebox.showwarning("K34 Makro", "Once bir Metin2 client sec.", parent=self)
            return
        araliklar = {}
        for ad in TUSLAR:
            if not self.tus_acik[ad].get():
                continue
            try:
                sure = float(self.tus_sure[ad].get().replace(",", "."))
                if sure < 0.1:
                    raise ValueError
            except ValueError:
                messagebox.showwarning("K34 Makro", f"{ad} icin gecerli bir saniye gir (en az 0.1).",
                                       parent=self)
                return
            araliklar[ad] = sure
        if not araliklar and not self.space_var.get():
            messagebox.showwarning("K34 Makro", "En az bir tus ya da Space sec.", parent=self)
            return

        arka_plan = self.arka_plan_var.get()
        if not arka_plan:
            user32.ShowWindow(hwnd, SW_RESTORE)
            user32.SetForegroundWindow(hwnd)

        self._ayar_kaydet()
        self.makro = Makro(Gonderici(hwnd, arka_plan), araliklar, self.space_var.get(), self._durum)
        self.makro.start()
        self.baslat_btn["state"] = "disabled"
        self.durdur_btn["state"] = "normal"
        self.client_cb["state"] = "disabled"
        self.durum_var.set("Calisiyor...")

    def durdur(self):
        if self.makro:
            self.makro.durdur()
            self.makro.join(timeout=1)
            self.makro = None
        self.baslat_btn["state"] = "normal"
        self.durdur_btn["state"] = "disabled"
        self.client_cb["state"] = "readonly"
        self.durum_var.set("Durduruldu.")

    def _durum(self, mesaj, bitti=False):
        # Makro thread'inden gelir; arayuzu ana thread'de guncelle
        def guncelle():
            if bitti:
                self.durdur()
            self.durum_var.set(mesaj)
        self.after(0, guncelle)

    def _kisayol_kontrol(self):
        basili = bool(user32.GetAsyncKeyState(KISAYOL_VK) & 0x8000)
        if basili and not self._f10_onceki:
            self.durdur() if self.makro else self.baslat()
        self._f10_onceki = basili
        self.after(50, self._kisayol_kontrol)

    # --- ayarlar ---
    def _ayar_kaydet(self):
        veri = {
            "tuslar": {ad: {"acik": self.tus_acik[ad].get(), "sure": self.tus_sure[ad].get()}
                       for ad in TUSLAR},
            "space": self.space_var.get(),
            "arka_plan": self.arka_plan_var.get(),
        }
        try:
            with open(AYAR_DOSYASI, "w", encoding="utf-8") as f:
                json.dump(veri, f, ensure_ascii=False, indent=2)
        except OSError:
            pass

    def _ayar_yukle(self):
        try:
            with open(AYAR_DOSYASI, encoding="utf-8") as f:
                veri = json.load(f)
        except (OSError, ValueError):
            return
        for ad, t in veri.get("tuslar", {}).items():
            if ad in TUSLAR:
                self.tus_acik[ad].set(bool(t.get("acik")))
                self.tus_sure[ad].set(str(t.get("sure", "")))
        self.space_var.set(bool(veri.get("space")))
        self.arka_plan_var.set(bool(veri.get("arka_plan", True)))

    def _kapat(self):
        self.durdur()
        self._ayar_kaydet()
        self.destroy()


if __name__ == "__main__":
    Uygulama().mainloop()
