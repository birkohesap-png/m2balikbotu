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
RENK = {
    "zemin": "#111318", "kart": "#1b1e26", "kart2": "#242833", "kenar": "#2e3340",
    "yazi": "#e8eaf0", "soluk": "#8a90a0", "vurgu": "#f5b81c",
    "yesil": "#22c55e", "yesil2": "#16a34a", "kirmizi": "#ef4444", "kirmizi2": "#dc2626",
}
FONT = "Segoe UI"


def _dpi_ayarla():
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except Exception:
        pass


class TusKarti(tk.Frame):
    """Tiklayinca acilip kapanan tus kutusu + altinda saniye girisi."""

    def __init__(self, ust, ad, acik_var, sure_var, tikla_cb):
        super().__init__(ust, bg=RENK["kart2"], highlightthickness=2,
                         highlightbackground=RENK["kenar"], cursor="hand2")
        self.acik_var = acik_var
        self.ad_lbl = tk.Label(self, text=ad, font=(FONT, 15, "bold"),
                               bg=RENK["kart2"], fg=RENK["soluk"], width=4, cursor="hand2")
        self.ad_lbl.pack(pady=(8, 2))
        alt = tk.Frame(self, bg=RENK["kart2"])
        alt.pack(pady=(0, 8))
        self.giris = tk.Entry(alt, textvariable=sure_var, width=5, justify="center",
                              font=(FONT, 10), bg=RENK["zemin"], fg=RENK["yazi"],
                              insertbackground=RENK["yazi"], relief="flat",
                              highlightthickness=1, highlightbackground=RENK["kenar"],
                              highlightcolor=RENK["vurgu"])
        self.giris.pack(side="left", ipady=2)
        self.sn_lbl = tk.Label(alt, text="sn", font=(FONT, 9), bg=RENK["kart2"], fg=RENK["soluk"])
        self.sn_lbl.pack(side="left", padx=(3, 0))
        for w in (self, self.ad_lbl):
            w.bind("<Button-1>", lambda e: tikla_cb())
        acik_var.trace_add("write", lambda *_: self.boya())
        self.boya()

    def boya(self):
        acik = self.acik_var.get()
        self.configure(highlightbackground=RENK["vurgu"] if acik else RENK["kenar"])
        self.ad_lbl.configure(fg=RENK["vurgu"] if acik else RENK["soluk"])


class Anahtar(tk.Canvas):
    """Basit acik/kapali anahtari (toggle switch)."""

    def __init__(self, ust, var, bg):
        super().__init__(ust, width=40, height=22, bg=bg, highlightthickness=0, cursor="hand2")
        self.var = var
        self.bind("<Button-1>", lambda e: self.var.set(not self.var.get()))
        var.trace_add("write", lambda *_: self.ciz())
        self.ciz()

    def ciz(self):
        self.delete("all")
        acik = self.var.get()
        renk = RENK["yesil"] if acik else RENK["kenar"]
        self.create_oval(1, 1, 21, 21, fill=renk, outline=renk)
        self.create_oval(19, 1, 39, 21, fill=renk, outline=renk)
        self.create_rectangle(11, 1, 29, 21, fill=renk, outline=renk)
        x = 20 if acik else 2
        self.create_oval(x + 1, 3, x + 17, 19, fill="#ffffff", outline="")


class Uygulama(tk.Tk):
    def __init__(self):
        _dpi_ayarla()
        super().__init__()
        self.title("K34 Makro")
        self.configure(bg=RENK["zemin"])
        self.resizable(False, False)
        self.attributes("-topmost", True)

        self.makro = None
        self.pencereler = []
        self.tus_acik = {ad: tk.BooleanVar() for ad in TUSLAR}
        self.tus_sure = {ad: tk.StringVar() for ad in TUSLAR}
        self.space_var = tk.BooleanVar()
        self.arka_plan_var = tk.BooleanVar(value=True)
        self.tum_pencereler_var = tk.BooleanVar()
        self.ustte_var = tk.BooleanVar(value=True)
        self.durum_var = tk.StringVar(value="Hazır — client seç, tuşları ayarla, Başlat'a bas.")
        self._f10_onceki = False

        self._stil()
        self._arayuz()
        self._ayar_yukle()
        self.ustte_var.trace_add("write", lambda *_: self.attributes("-topmost", self.ustte_var.get()))
        self.tum_pencereler_var.trace_add("write", lambda *_: self.yenile())
        self.yenile()
        self.after(100, self._kisayol_kontrol)
        self.protocol("WM_DELETE_WINDOW", self._kapat)

    # --- arayuz kurulumu ---
    def _stil(self):
        s = ttk.Style(self)
        s.theme_use("clam")
        s.configure("K.TCombobox", fieldbackground=RENK["kart2"], background=RENK["kart2"],
                    foreground=RENK["yazi"], arrowcolor=RENK["vurgu"], bordercolor=RENK["kenar"],
                    lightcolor=RENK["kart2"], darkcolor=RENK["kart2"], padding=6)
        s.map("K.TCombobox",
              fieldbackground=[("readonly", RENK["kart2"]), ("disabled", RENK["kart"])],
              foreground=[("readonly", RENK["yazi"]), ("disabled", RENK["soluk"])],
              selectbackground=[("readonly", RENK["kart2"])],
              selectforeground=[("readonly", RENK["yazi"])])
        self.option_add("*TCombobox*Listbox.background", RENK["kart2"])
        self.option_add("*TCombobox*Listbox.foreground", RENK["yazi"])
        self.option_add("*TCombobox*Listbox.selectBackground", RENK["vurgu"])
        self.option_add("*TCombobox*Listbox.selectForeground", "#000000")
        self.option_add("*TCombobox*Listbox.font", (FONT, 10))

    def _kart(self, baslik):
        dis = tk.Frame(self, bg=RENK["kart"], highlightthickness=1,
                       highlightbackground=RENK["kenar"])
        dis.pack(fill="x", padx=14, pady=(0, 10))
        tk.Label(dis, text=baslik, font=(FONT, 9, "bold"), bg=RENK["kart"],
                 fg=RENK["soluk"]).pack(anchor="w", padx=12, pady=(10, 4))
        ic = tk.Frame(dis, bg=RENK["kart"])
        ic.pack(fill="x", padx=12, pady=(0, 12))
        return ic

    def _satir_anahtar(self, ust, yazi, var):
        f = tk.Frame(ust, bg=RENK["kart"])
        f.pack(fill="x", pady=3)
        Anahtar(f, var, RENK["kart"]).pack(side="left")
        lbl = tk.Label(f, text=yazi, font=(FONT, 10), bg=RENK["kart"], fg=RENK["yazi"],
                       cursor="hand2")
        lbl.pack(side="left", padx=8)
        lbl.bind("<Button-1>", lambda e: var.set(not var.get()))

    def _buton(self, ust, yazi, komut, renk, renk2, fg="#ffffff", **kw):
        b = tk.Label(ust, text=yazi, bg=renk, fg=fg, cursor="hand2", **kw)
        b.bind("<Button-1>", lambda e: komut())
        b.bind("<Enter>", lambda e: b.configure(bg=b.renk2))
        b.bind("<Leave>", lambda e: b.configure(bg=b.renk))
        b.renk, b.renk2 = renk, renk2
        return b

    def _arayuz(self):
        # Baslik
        bas = tk.Frame(self, bg=RENK["zemin"])
        bas.pack(fill="x", padx=14, pady=(14, 10))
        tk.Label(bas, text="K34", font=(FONT, 20, "bold"), bg=RENK["zemin"],
                 fg=RENK["vurgu"]).pack(side="left")
        tk.Label(bas, text=" MAKRO", font=(FONT, 20, "bold"), bg=RENK["zemin"],
                 fg=RENK["yazi"]).pack(side="left")
        self.rozet = tk.Label(bas, text="● DURDU", font=(FONT, 9, "bold"),
                              bg=RENK["kart2"], fg=RENK["soluk"], padx=10, pady=3)
        self.rozet.pack(side="right")

        # Client
        c = self._kart("CLIENT")
        ust = tk.Frame(c, bg=RENK["kart"])
        ust.pack(fill="x")
        self.client_cb = ttk.Combobox(ust, state="readonly", style="K.TCombobox",
                                      font=(FONT, 10), width=36)
        self.client_cb.pack(side="left", fill="x", expand=True)
        self._buton(ust, "⟳", self.yenile, RENK["kart2"], RENK["kenar"], fg=RENK["vurgu"],
                    font=(FONT, 13, "bold"), padx=10, pady=2).pack(side="left", padx=(8, 0))
        tk.Frame(c, bg=RENK["kart"], height=6).pack()
        self._satir_anahtar(c, "Arka planda çalış (client önde olmasa da basar)", self.arka_plan_var)
        self._satir_anahtar(c, "Tüm pencereleri göster", self.tum_pencereler_var)

        # Tuslar
        t = self._kart("TUŞLAR  —  tıkla, kaç saniyede bir basacağını yaz")
        izgara = tk.Frame(t, bg=RENK["kart"])
        izgara.pack()
        for i, ad in enumerate(TUSLAR):
            TusKarti(izgara, ad, self.tus_acik[ad], self.tus_sure[ad],
                     lambda a=ad: self._tus_tikla(a)
                     ).grid(row=i // 6, column=i % 6, padx=4, pady=4)

        # Space
        s = self._kart("SPACE")
        self._satir_anahtar(s, "Space'i sürekli basılı tut (otomatik vuruş)", self.space_var)

        # Baslat/Durdur
        self.ana_btn = self._buton(self, "▶  BAŞLAT   (F10)", self._ana_tikla, RENK["yesil2"], RENK["yesil"],
                                   font=(FONT, 14, "bold"), pady=12)
        self.ana_btn.pack(fill="x", padx=14, pady=(2, 8))

        alt = tk.Frame(self, bg=RENK["zemin"])
        alt.pack(fill="x", padx=14, pady=(0, 12))
        tk.Label(alt, textvariable=self.durum_var, font=(FONT, 9), bg=RENK["zemin"],
                 fg=RENK["soluk"], anchor="w").pack(side="left")
        ustte = tk.Frame(alt, bg=RENK["zemin"])
        ustte.pack(side="right")
        tk.Label(ustte, text="Üstte tut", font=(FONT, 9),
                 bg=RENK["zemin"], fg=RENK["soluk"]).pack(side="left", padx=(0, 6))
        Anahtar(ustte, self.ustte_var, RENK["zemin"]).pack(side="left")

    def _tus_tikla(self, ad):
        if self.makro:
            return
        if self.tus_acik[ad].get():
            self.tus_acik[ad].set(False)
            return
        if not self.tus_sure[ad].get().strip():
            sure = simpledialog.askfloat(
                "K34 Makro", f"{ad} tuşuna kaç saniyede bir bassın kanka?",
                parent=self, minvalue=0.1, maxvalue=86400)
            if sure is None:
                return
            self.tus_sure[ad].set(f"{sure:g}")
        self.tus_acik[ad].set(True)

    def _ana_tikla(self):
        self.durdur() if self.makro else self.baslat()

    def _calisiyor_gorunumu(self, calisiyor):
        b = self.ana_btn
        if calisiyor:
            b.renk, b.renk2 = RENK["kirmizi2"], RENK["kirmizi"]
            b.configure(text="■  DURDUR   (F10)", bg=b.renk)
            self.rozet.configure(text="● ÇALIŞIYOR", fg=RENK["yesil"])
            self.client_cb["state"] = "disabled"
        else:
            b.renk, b.renk2 = RENK["yesil2"], RENK["yesil"]
            b.configure(text="▶  BAŞLAT   (F10)", bg=b.renk)
            self.rozet.configure(text="● DURDU", fg=RENK["soluk"])
            self.client_cb["state"] = "readonly"

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
            self.durum_var.set("Metin2 client bulunamadı — oyunu aç ve ⟳'ye bas.")

    def _secili_hwnd(self):
        i = self.client_cb.current()
        return self.pencereler[i][0] if 0 <= i < len(self.pencereler) else None

    # --- baslat / durdur ---
    def baslat(self):
        if self.makro:
            return
        hwnd = self._secili_hwnd()
        if not hwnd or not user32.IsWindow(hwnd):
            messagebox.showwarning("K34 Makro", "Önce bir Metin2 client seç.", parent=self)
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
                messagebox.showwarning("K34 Makro", f"{ad} için geçerli bir saniye gir (en az 0.1).",
                                       parent=self)
                return
            araliklar[ad] = sure
        if not araliklar and not self.space_var.get():
            messagebox.showwarning("K34 Makro", "En az bir tuş ya da Space seç.", parent=self)
            return

        arka_plan = self.arka_plan_var.get()
        if not arka_plan:
            user32.ShowWindow(hwnd, SW_RESTORE)
            user32.SetForegroundWindow(hwnd)

        self._ayar_kaydet()
        self.makro = Makro(Gonderici(hwnd, arka_plan), araliklar, self.space_var.get(), self._durum)
        self.makro.start()
        self._calisiyor_gorunumu(True)
        self.durum_var.set("Çalışıyor...")

    def durdur(self):
        if self.makro:
            self.makro.durdur()
            self.makro.join(timeout=1)
            self.makro = None
        self._calisiyor_gorunumu(False)
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
            self._ana_tikla()
        self._f10_onceki = basili
        self.after(50, self._kisayol_kontrol)

    # --- ayarlar ---
    def _ayar_kaydet(self):
        veri = {
            "tuslar": {ad: {"acik": self.tus_acik[ad].get(), "sure": self.tus_sure[ad].get()}
                       for ad in TUSLAR},
            "space": self.space_var.get(),
            "arka_plan": self.arka_plan_var.get(),
            "ustte": self.ustte_var.get(),
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
        self.ustte_var.set(bool(veri.get("ustte", True)))
        self.attributes("-topmost", self.ustte_var.get())

    def _kapat(self):
        self.durdur()
        self._ayar_kaydet()
        self.destroy()


if __name__ == "__main__":
    Uygulama().mainloop()
