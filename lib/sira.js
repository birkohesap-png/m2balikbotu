/**
 * K34 — KEY SIRASI (sirali giris + mola + Metin+ reset)
 * ====================================================
 * Ayni lisans anahtarina bagli bilgisayarlar hesaba GIRME / cikip girme
 * islerini TEK TEK yapar:
 *
 *   - Ayni anda en fazla BIR bilgisayar disarida / giriste olabilir.
 *   - Isi biten bilgisayar girip baliga baslayinca (bot "bitti" der) ARA_SN
 *     sayilir, sonra siradaki.
 *   - Sira, durumlar tablosundaki kayit sirasidir (Telegram /hesaplar ile ayni).
 *   - GIRIS: internet gidip hesaplar oyundan atilinca hepsi ayni anda girmeye
 *     calisiyor ve oyun saatlerce giris engeli koyuyordu. DC olan bilgisayarlar
 *     sirayla girer. En yuksek oncelik budur.
 *   - RESET: Turkiye saatiyle RESET_BAS_SAAT'ten sonra her bilgisayar gunde
 *     bir kez; bekleyen reset varken mola verilmez.
 *   - MOLA: hazir bilgisayarlarin hepsi bir kez molaya girince tur biter;
 *     TUR_ARASI_SN sonra yeni tur bastan baslar.
 *
 * Bilgisayar kapanir / baglanti koparsa hakki zaman asimiyla duser, sira
 * kilitlenmez.
 *
 * SAF MANTIK: veritabani ve ag YOK. /api/sira bunu okur-hesaplar-yazar;
 * test/sira.test.mjs dogrudan bunu calistirir.
 */

export const SIRA = Object.freeze({
  ARA_SN: 5 * 60, // biten bilgisayar -> siradaki arasi
  TUR_ARASI_SN: 20 * 60, // mola turu bitince yeni tura kadar
  CANLI_SN: 150, // durum bu kadar yeniyse bilgisayar acik sayilir
  KOPUK_SN: 5 * 60, // disaridaki bilgisayar bu kadar sessizse hakki duser
  GIRIS_PAYI_SN: 10 * 60, // cikis + yeniden giris icin pay
  ZAMAN_ASIMI_PAYI_SN: 20 * 60, // beklenen bitisten sonra zorla birak
  GIRIS_TUR_SN: 30 * 60, // bu kadar giris olmazsa sira numarasi bastan sayilir
  RESET_BAS_SAAT: 4, // TR saati
  RESET_BIT_SAAT: 10,
  MOLA_MIN_SN: 60,
  MOLA_MAX_SN: 180 * 60,
  LISTE_MAX: 60,
});

const TURLER = ['mola', 'reset', 'giris'];
const DK = (sn) => Math.max(0, Math.round(sn / 60));

function sayi(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function dizi(x) {
  return Array.isArray(x) ? x.filter((h) => typeof h === 'string').slice(-SIRA.LISTE_MAX) : [];
}

function kac(t) {
  return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Turkiye saati (UTC+3, yaz saati yok). Sunucu saatinden hesaplanir; VM saatleri kaysa da etkilenmez. */
export function trZaman(ms) {
  const d = new Date(ms + 3 * 3600 * 1000);
  return { gun: d.toISOString().slice(0, 10), saat: d.getUTCHours() };
}

export function resetSaatiMi(ms) {
  const { saat } = trZaman(ms);
  return saat >= SIRA.RESET_BAS_SAAT && saat < SIRA.RESET_BIT_SAAT;
}

/** Veritabanindan gelen (eksik/bozuk olabilir) sira durumunu guvenli bicime getirir. */
export function durumuDuzelt(ham) {
  const v = ham && typeof ham === 'object' ? ham : {};
  const a = v.aktif && typeof v.aktif === 'object' && typeof v.aktif.hwid === 'string' ? v.aktif : null;
  const m = v.mola && typeof v.mola === 'object' ? v.mola : {};
  const r = v.reset && typeof v.reset === 'object' ? v.reset : {};
  const g = v.giris && typeof v.giris === 'object' ? v.giris : {};
  return {
    aktif: a
      ? {
          hwid: a.hwid,
          ad: String(a.ad || ''),
          tur: TURLER.includes(a.tur) ? a.tur : 'mola',
          baslangic: sayi(a.baslangic),
          beklenen_bitis: sayi(a.beklenen_bitis),
          sira_no: sayi(a.sira_no),
          toplam: sayi(a.toplam),
        }
      : null,
    son_donus: sayi(v.son_donus),
    mola: {
      tur_no: Math.max(1, sayi(m.tur_no)),
      yapanlar: dizi(m.yapanlar),
      son_donus: sayi(m.son_donus),
      tur_bitis: sayi(m.tur_bitis),
    },
    reset: { gun: String(r.gun || ''), yapanlar: dizi(r.yapanlar) },
    giris: { yapanlar: dizi(g.yapanlar), son: sayi(g.son) },
  };
}

/** durumlar satiri ({hwid, veri, yas}) -> sira adayi. */
export function adayYap(satir) {
  const v = (satir && satir.veri) || {};
  const s = v.sira && typeof v.sira === 'object' ? v.sira : {};
  const hesap = Array.isArray(v.hesaplar) && v.hesaplar[0] ? v.hesaplar[0] : {};
  const hwid = String((satir && satir.hwid) || '').toUpperCase();
  return {
    hwid,
    ad: String(hesap.ad || v.pc || hwid.slice(0, 8)).slice(0, 40),
    yas_sn: Math.max(0, sayi(satir && satir.yas)),
    calisiyor: !!(v.bot && v.bot.calisiyor),
    mola_cikis: !!s.mola_cikis,
    mola_hazir: !!s.mola_hazir,
    reset: !!s.reset,
    reset_hazir: !!s.reset_hazir,
    giris: !!s.giris,
    giris_hazir: !!s.giris_hazir,
  };
}

const canli = (a) => a.yas_sn <= SIRA.CANLI_SN;

function ekle(liste, hwid) {
  if (!liste.includes(hwid)) liste.push(hwid);
  if (liste.length > SIRA.LISTE_MAX) liste.splice(0, liste.length - SIRA.LISTE_MAX);
}

/* Istegi yapan bilgisayar su an sorduguna gore hazirdir ve aciktir - durum
   kaydi 30 sn geriden gelse bile. Listede yoksa (ilk kayit) sona eklenir. */
function adaylariHazirla(adaylar, istek) {
  const liste = (adaylar || []).map((a) => ({ ...a }));
  let ben = liste.find((a) => a.hwid === istek.hwid);
  if (!ben) {
    ben = {
      hwid: istek.hwid,
      ad: istek.ad || istek.hwid.slice(0, 8),
      yas_sn: 0,
      calisiyor: true,
      mola_cikis: false,
      mola_hazir: false,
      reset: false,
      reset_hazir: false,
      giris: false,
      giris_hazir: false,
    };
    liste.push(ben);
  }
  if (istek.tip === 'sor') {
    ben.yas_sn = 0;
    ben.calisiyor = true;
    if (istek.ad) ben.ad = istek.ad;
    if (istek.tur === 'mola') {
      ben.mola_cikis = true;
      ben.mola_hazir = true;
    } else if (istek.tur === 'reset') {
      ben.reset = true;
      ben.reset_hazir = true;
    } else {
      ben.giris = true;
      ben.giris_hazir = true;
    }
  }
  return liste;
}

function moladaBekleyenler(d, liste) {
  return liste.filter(
    (a) => canli(a) && a.calisiyor && a.mola_cikis && a.mola_hazir && !d.mola.yapanlar.includes(a.hwid)
  );
}

function resetteBekleyenler(d, liste) {
  return liste.filter(
    (a) => canli(a) && a.calisiyor && a.reset && a.reset_hazir && !d.reset.yapanlar.includes(a.hwid)
  );
}

/* Giris her DC'de yeniden gerekir: "yaptilar" listesi SUZMEZ, sadece numara icin. */
function giristeBekleyenler(liste) {
  return liste.filter((a) => canli(a) && a.calisiyor && a.giris && a.giris_hazir);
}

/* Disaridaki bilgisayarin hakkini bitirir: kaydeder, siradakini bulur, olay uretir. */
function bitir(d, liste, simdi, neden, olaylar) {
  const a = d.aktif;
  if (!a) return;
  d.aktif = null;
  d.son_donus = simdi;
  let siradaki;
  if (a.tur === 'mola') {
    ekle(d.mola.yapanlar, a.hwid);
    d.mola.son_donus = simdi;
    siradaki = moladaBekleyenler(d, liste)[0];
    if (!siradaki) d.mola.tur_bitis = simdi; // tur bitti
  } else if (a.tur === 'reset') {
    const { gun } = trZaman(simdi);
    if (d.reset.gun !== gun) d.reset = { gun, yapanlar: [] };
    ekle(d.reset.yapanlar, a.hwid);
    siradaki = resetteBekleyenler(d, liste)[0];
  } else {
    ekle(d.giris.yapanlar, a.hwid);
    d.giris.son = simdi;
    // Biten bilgisayarin durum kaydi 30 sn geriden "giris bekliyor" diyebilir.
    siradaki = giristeBekleyenler(liste).filter((x) => x.hwid !== a.hwid)[0];
  }
  olaylar.push({
    tur: a.tur,
    tip: neden,
    ad: a.ad,
    sira_no: a.sira_no,
    toplam: a.toplam,
    siradaki: siradaki ? siradaki.ad : '',
  });
}

/* Disaridaki bilgisayar kapandi / sustu / suresini cok astiysa hakkini dusur.
   istekTaze: istegi yapan bilgisayarin KENDI durum kaydi da yeni mi. Internet
   herkese birden geri geldiginde tum kayitlar eskidir; o anda disaridakinin
   "sessiz" gorunmesi kapandigini gostermez, hakki dusurulmez. */
function aktifiTemizle(d, liste, simdi, olaylar, istekTaze) {
  const a = d.aktif;
  if (!a) return;
  const gecenSn = (simdi - a.baslangic) / 1000;
  const pc = liste.find((x) => x.hwid === a.hwid);
  let kopuk;
  if (!pc) {
    kopuk = istekTaze && gecenSn > SIRA.KOPUK_SN;
  } else {
    // "bot durdu" bilgisi ancak izin VERILDIKTEN SONRA gelen bir durumdan
    // okunursa gecerli; izinden onceki eski kayit (bot yeni baslamisken
    // calisiyor=false) hakki yanlislikla dusurmesin.
    const izindenSonra = pc.yas_sn < gecenSn - 5;
    kopuk = (istekTaze && pc.yas_sn > SIRA.KOPUK_SN) || (izindenSonra && canli(pc) && !pc.calisiyor);
  }
  const asim = simdi > a.beklenen_bitis + SIRA.ZAMAN_ASIMI_PAYI_SN * 1000;
  if (kopuk || asim) bitir(d, liste, simdi, 'zaman_asimi', olaylar);
}

function red(sebep, ek = {}) {
  return { izin: false, sebep, ...ek };
}

function ver(d, pc, tur, simdi, paySn, siraNo, toplam, olaylar, sureSn) {
  d.aktif = {
    hwid: pc.hwid,
    ad: pc.ad,
    tur,
    baslangic: simdi,
    beklenen_bitis: simdi + paySn * 1000,
    sira_no: siraNo,
    toplam,
  };
  olaylar.push({ tur, tip: 'basladi', ad: pc.ad, sira_no: siraNo, toplam, sure_sn: sureSn || 0 });
  return { izin: true, sebep: 'izin', sira_no: siraNo, toplam };
}

function sor(d, liste, istek, simdi, olaylar) {
  const { tur, hwid } = istek;

  if (d.aktif) {
    if (d.aktif.hwid === hwid && d.aktif.tur === tur) {
      // Ayni bilgisayar tekrar sordu (onceki cevap agda kayboldu) - izin gecerli.
      return { izin: true, sebep: 'zaten_senin', sira_no: d.aktif.sira_no, toplam: d.aktif.toplam };
    }
    return red('disarida', { kim: d.aktif.ad, kim_tur: d.aktif.tur });
  }

  if (d.son_donus) {
    const kalan = SIRA.ARA_SN * 1000 - (simdi - d.son_donus);
    if (kalan > 0) return red('ara', { bekle_sn: Math.ceil(kalan / 1000) });
  }

  const { gun } = trZaman(simdi);
  if (d.reset.gun !== gun) d.reset = { gun, yapanlar: [] };
  const baskalari = (x) => x.hwid !== hwid;

  // ---- giris (en yuksek oncelik) ----
  if (tur === 'giris') {
    const bek = giristeBekleyenler(liste);
    if (!bek.length || bek[0].hwid !== hwid) {
      return red('sira_degil', { siradaki: bek[0] ? bek[0].ad : '' });
    }
    if (d.giris.yapanlar.length && simdi - d.giris.son > SIRA.GIRIS_TUR_SN * 1000) {
      d.giris.yapanlar = []; // yeni kopma: numara bastan
    }
    const n = d.giris.yapanlar.length;
    return ver(d, bek[0], 'giris', simdi, SIRA.GIRIS_PAYI_SN, n + 1, n + bek.length, olaylar, 0);
  }

  if (giristeBekleyenler(liste).filter(baskalari).length) return red('giris_oncelikli');

  // ---- reset ----
  if (tur === 'reset') {
    if (!resetSaatiMi(simdi)) return red('saat_disi');
    if (d.reset.yapanlar.includes(hwid)) return red('bugun_yapildi');
    const bek = resetteBekleyenler(d, liste);
    if (!bek.length || bek[0].hwid !== hwid) {
      return red('sira_degil', { siradaki: bek[0] ? bek[0].ad : '' });
    }
    const n = d.reset.yapanlar.length;
    return ver(d, bek[0], 'reset', simdi, SIRA.GIRIS_PAYI_SN, n + 1, n + bek.length, olaylar, 0);
  }

  // ---- mola ----
  if (resetSaatiMi(simdi) && resetteBekleyenler(d, liste).filter(baskalari).length) {
    return red('reset_oncelikli');
  }

  let bek = moladaBekleyenler(d, liste);
  if (d.mola.tur_bitis || !bek.length) {
    if (!d.mola.tur_bitis) d.mola.tur_bitis = d.mola.son_donus || simdi;
    const kalan = SIRA.TUR_ARASI_SN * 1000 - (simdi - d.mola.tur_bitis);
    if (kalan > 0) return red('tur_arasi', { bekle_sn: Math.ceil(kalan / 1000) });
    d.mola = { tur_no: d.mola.tur_no + 1, yapanlar: [], son_donus: d.mola.son_donus, tur_bitis: 0 };
    bek = moladaBekleyenler(d, liste);
  }
  if (!bek.length || bek[0].hwid !== hwid) {
    return red('sira_degil', { siradaki: bek[0] ? bek[0].ad : '' });
  }
  const sure = Math.min(SIRA.MOLA_MAX_SN, Math.max(SIRA.MOLA_MIN_SN, sayi(istek.sure_sn) || 15 * 60));
  const n = d.mola.yapanlar.length;
  return ver(d, bek[0], 'mola', simdi, sure + SIRA.GIRIS_PAYI_SN, n + 1, n + bek.length, olaylar, sure);
}

/**
 * Tek bir istegi isler.
 *   durum   : siralar.veri (ham)
 *   adaylar : adayYap(durumlar satirlari) - kayit sirasina gore
 *   istek   : { hwid, tur: 'mola'|'reset'|'giris', tip: 'sor'|'bitti'|'iptal', ad, sure_sn }
 *   simdi   : ms
 * Doner: { durum (yeni), cevap (bota), olaylar (Telegram) }
 */
export function karar({ durum, adaylar, istek, simdi }) {
  const d = durumuDuzelt(JSON.parse(JSON.stringify(durum || {})));
  const ist = {
    hwid: String((istek && istek.hwid) || '').toUpperCase(),
    tur: istek && TURLER.includes(istek.tur) ? istek.tur : 'mola',
    tip: istek && ['sor', 'bitti', 'iptal'].includes(istek.tip) ? istek.tip : 'sor',
    ad: String((istek && istek.ad) || '').slice(0, 40),
    sure_sn: sayi(istek && istek.sure_sn),
  };
  const benKayit = (adaylar || []).find((a) => a.hwid === ist.hwid);
  const istekTaze = !!benKayit && benKayit.yas_sn <= SIRA.CANLI_SN;
  const liste = adaylariHazirla(adaylar, ist);
  const olaylar = [];
  aktifiTemizle(d, liste, simdi, olaylar, istekTaze);

  let cevap;
  if (ist.tip === 'sor') {
    cevap = sor(d, liste, ist, simdi, olaylar);
  } else {
    if (d.aktif && d.aktif.hwid === ist.hwid && d.aktif.tur === ist.tur) {
      bitir(d, liste, simdi, ist.tip, olaylar);
    }
    cevap = { izin: false, sebep: 'kaydedildi' };
  }
  return { durum: d, cevap, olaylar };
}

const BASLIK = {
  mola: '☕ <b>Sıralı mola</b>',
  reset: '🌙 <b>Metin+ reset</b>',
  giris: '🔌 <b>Sıralı giriş (bağlantı sonrası)</b>',
};

/** Olay -> Telegram metni (HTML). */
export function olayMetni(o) {
  const ad = kac(o.ad);
  const sira = o.toplam ? ` (${o.sira_no}/${o.toplam})` : '';
  const baslik = BASLIK[o.tur] || BASLIK.mola;
  if (o.tip === 'basladi') {
    if (o.tur === 'mola') {
      return `${baslik}\n💻 <b>${ad}</b> molaya çıktı${sira}${o.sure_sn ? ` · ~${DK(o.sure_sn)} dk` : ''}`;
    }
    if (o.tur === 'reset') return `${baslik}\n💻 <b>${ad}</b> çıkıp tekrar giriyor${sira}`;
    return `${baslik}\n💻 <b>${ad}</b> oyuna giriyor${sira}`;
  }
  let govde;
  if (o.tip === 'bitti') {
    govde = o.tur === 'mola'
      ? `✅ <b>${ad}</b> moladan döndü, balığa başladı`
      : o.tur === 'reset'
        ? `✅ <b>${ad}</b> çıkıp girdi, balığa başladı`
        : `✅ <b>${ad}</b> oyuna girdi, balığa başladı`;
  } else if (o.tip === 'iptal') {
    govde = o.tur === 'giris'
      ? `⏹ <b>${ad}</b> girişten vazgeçti (zaten oyunda ya da bot durdu)`
      : `⏹ <b>${ad}</b> sırasını tamamlayamadı (bot durdu)`;
  } else {
    govde = `⚠️ <b>${ad}</b> zaman aşımı (bot kapandı ya da bağlantı yok) — sıra devam ediyor`;
  }
  let son;
  if (o.siradaki) {
    son = `\n⏭ Sıradaki: <b>${kac(o.siradaki)}</b> (${DK(SIRA.ARA_SN)} dk sonra)`;
  } else if (o.tur === 'mola') {
    son = `\n🏁 Mola turu bitti — yeni tur ${DK(SIRA.TUR_ARASI_SN)} dk sonra`;
  } else if (o.tur === 'giris') {
    son = '\n🏁 Giriş bekleyen başka bilgisayar yok';
  } else {
    son = '\n🏁 Sırada bekleyen başka bilgisayar yok';
  }
  return `${baslik}\n${govde}${son}`;
}

/** Telegram /sira komutu metni. */
export function siraMetni(durumHam, adaylar, simdi) {
  const d = durumuDuzelt(durumHam);
  const acik = (adaylar || []).filter((a) => canli(a) && a.calisiyor);
  const satirlar = ['<b>Sıra durumu</b>'];
  const disaridaMi = (a, tur) => d.aktif && d.aktif.hwid === a.hwid && d.aktif.tur === tur;

  if (d.aktif) {
    const ne = { mola: 'molada', reset: 'Metin+ reset yapıyor', giris: 'oyuna giriyor' }[d.aktif.tur];
    satirlar.push(
      `\n🚪 Şu an: <b>${kac(d.aktif.ad)}</b> — ${ne} (${DK((simdi - d.aktif.baslangic) / 1000)} dk)`
    );
  } else if (d.son_donus && SIRA.ARA_SN - (simdi - d.son_donus) / 1000 > 0) {
    satirlar.push(`\n⏳ Son dönüşten sonra bekleniyor: ${DK(SIRA.ARA_SN - (simdi - d.son_donus) / 1000)} dk kaldı`);
  } else {
    satirlar.push('\n✅ Dışarıda bilgisayar yok');
  }

  const girisciler = acik.filter((a) => a.giris_hazir || disaridaMi(a, 'giris'));
  if (girisciler.length) {
    satirlar.push('\n🔌 <b>Giriş bekleyenler</b>');
    for (const a of girisciler) satirlar.push(`${disaridaMi(a, 'giris') ? '🚪' : '⏳'} ${kac(a.ad)}`);
  }

  const molacilar = acik.filter((a) => a.mola_cikis);
  if (molacilar.length) {
    let ust = `\n☕ <b>Mola turu ${d.mola.tur_no}</b>`;
    if (d.mola.tur_bitis) {
      const kalan = SIRA.TUR_ARASI_SN - (simdi - d.mola.tur_bitis) / 1000;
      ust += kalan > 0 ? ` — bitti, yeni tur ${DK(kalan)} dk sonra` : ' — bitti, yeni tur başlamak üzere';
    }
    satirlar.push(ust);
    for (const a of molacilar) {
      const isaret = disaridaMi(a, 'mola')
        ? '🚪'
        : d.mola.yapanlar.includes(a.hwid) ? '✅' : a.mola_hazir ? '⏳' : '💤';
      satirlar.push(`${isaret} ${kac(a.ad)}`);
    }
  }

  const resetciler = acik.filter((a) => a.reset);
  if (resetciler.length) {
    const { gun } = trZaman(simdi);
    const yapanlar = d.reset.gun === gun ? d.reset.yapanlar : [];
    satirlar.push(`\n🌙 <b>Metin+ reset (bugün, ${SIRA.RESET_BAS_SAAT}:00 sonrası)</b>`);
    for (const a of resetciler) {
      const isaret = disaridaMi(a, 'reset') ? '🚪' : yapanlar.includes(a.hwid) ? '✅' : '⏳';
      satirlar.push(`${isaret} ${kac(a.ad)}`);
    }
  }

  if (!girisciler.length && !molacilar.length && !resetciler.length) {
    satirlar.push('\nSıralı giriş, sıralı mola ya da Metin+ reset bekleyen bilgisayar yok.');
  }
  satirlar.push('\n🚪 şu an sırada olan · ✅ yaptı · ⏳ bekliyor · 💤 henüz hazır değil');
  return satirlar.join('\n');
}
