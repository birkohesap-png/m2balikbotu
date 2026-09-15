/**
 * K34 — KEY SIRASI (sirali mola + Metin+ reset)
 * ============================================
 * Ayni lisans anahtarina bagli bilgisayarlar hesaptan CIKIP GIRME islerini
 * (mola "cikis" modu ve gece Metin+ reset) TEK TEK yapar:
 *
 *   - Ayni anda en fazla BIR bilgisayar disarida olabilir.
 *   - Disaridaki bilgisayar girip baliga baslayinca (bot "bitti" der) ARA_SN
 *     sayilir, sonra siradaki cikar.
 *   - Sira, durumlar tablosundaki kayit sirasidir (Telegram /hesaplar ile ayni).
 *   - MOLA: hazir bilgisayarlarin hepsi bir kez molaya girince tur biter;
 *     TUR_ARASI_SN sonra yeni tur bastan baslar.
 *   - RESET: Turkiye saatiyle RESET_BAS_SAAT'ten sonra her bilgisayar gunde
 *     bir kez; bekleyen reset varken mola verilmez.
 *
 * Bilgisayar kapanir / baglanti koparsa hakki zaman asimiyla duser, sira
 * kilitlenmez.
 *
 * SAF MANTIK: veritabani ve ag YOK. /api/sira bunu okur-hesaplar-yazar;
 * test/sira.test.mjs dogrudan bunu calistirir.
 */

export const SIRA = Object.freeze({
  ARA_SN: 5 * 60, // donen bilgisayar -> siradaki arasi
  TUR_ARASI_SN: 20 * 60, // mola turu bitince yeni tura kadar
  CANLI_SN: 150, // durum bu kadar yeniyse bilgisayar acik sayilir
  KOPUK_SN: 5 * 60, // disaridaki bilgisayar bu kadar sessizse hakki duser
  GIRIS_PAYI_SN: 10 * 60, // cikis + yeniden giris icin pay
  ZAMAN_ASIMI_PAYI_SN: 20 * 60, // beklenen bitisten sonra zorla birak
  RESET_BAS_SAAT: 4, // TR saati
  RESET_BIT_SAAT: 10,
  MOLA_MIN_SN: 60,
  MOLA_MAX_SN: 180 * 60,
  LISTE_MAX: 60,
});

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
  return {
    aktif: a
      ? {
          hwid: a.hwid,
          ad: String(a.ad || ''),
          tur: a.tur === 'reset' ? 'reset' : 'mola',
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
    } else {
      ben.reset = true;
      ben.reset_hazir = true;
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
  } else {
    const { gun } = trZaman(simdi);
    if (d.reset.gun !== gun) d.reset = { gun, yapanlar: [] };
    ekle(d.reset.yapanlar, a.hwid);
    siradaki = resetteBekleyenler(d, liste)[0];
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

/* Disaridaki bilgisayar kapandi / sustu / suresini cok astiysa hakkini dusur. */
function aktifiTemizle(d, liste, simdi, olaylar) {
  const a = d.aktif;
  if (!a) return;
  const gecenSn = (simdi - a.baslangic) / 1000;
  const pc = liste.find((x) => x.hwid === a.hwid);
  let kopuk;
  if (!pc) {
    kopuk = gecenSn > SIRA.KOPUK_SN;
  } else {
    // "bot durdu" bilgisi ancak izin VERILDIKTEN SONRA gelen bir durumdan
    // okunursa gecerli; izinden onceki eski kayit (bot yeni baslamisken
    // calisiyor=false) hakki yanlislikla dusurmesin.
    const izindenSonra = pc.yas_sn < gecenSn - 5;
    kopuk = pc.yas_sn > SIRA.KOPUK_SN || (izindenSonra && canli(pc) && !pc.calisiyor);
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
  if (resetSaatiMi(simdi) && resetteBekleyenler(d, liste).length) return red('reset_oncelikli');

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
 *   istek   : { hwid, tur: 'mola'|'reset', tip: 'sor'|'bitti'|'iptal', ad, sure_sn }
 *   simdi   : ms
 * Doner: { durum (yeni), cevap (bota), olaylar (Telegram) }
 */
export function karar({ durum, adaylar, istek, simdi }) {
  const d = durumuDuzelt(JSON.parse(JSON.stringify(durum || {})));
  const ist = {
    hwid: String((istek && istek.hwid) || '').toUpperCase(),
    tur: istek && istek.tur === 'reset' ? 'reset' : 'mola',
    tip: istek && ['sor', 'bitti', 'iptal'].includes(istek.tip) ? istek.tip : 'sor',
    ad: String((istek && istek.ad) || '').slice(0, 40),
    sure_sn: sayi(istek && istek.sure_sn),
  };
  const liste = adaylariHazirla(adaylar, ist);
  const olaylar = [];
  aktifiTemizle(d, liste, simdi, olaylar);

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

/** Olay -> Telegram metni (HTML). */
export function olayMetni(o) {
  const ad = kac(o.ad);
  const sira = o.toplam ? ` (${o.sira_no}/${o.toplam})` : '';
  const baslik = o.tur === 'mola' ? '☕ <b>Sıralı mola</b>' : '🌙 <b>Metin+ reset</b>';
  if (o.tip === 'basladi') {
    return o.tur === 'mola'
      ? `${baslik}\n💻 <b>${ad}</b> molaya çıktı${sira}${o.sure_sn ? ` · ~${DK(o.sure_sn)} dk` : ''}`
      : `${baslik}\n💻 <b>${ad}</b> çıkıp tekrar giriyor${sira}`;
  }
  let govde;
  if (o.tip === 'bitti') {
    govde = o.tur === 'mola'
      ? `✅ <b>${ad}</b> moladan döndü, balığa başladı`
      : `✅ <b>${ad}</b> çıkıp girdi, balığa başladı`;
  } else if (o.tip === 'iptal') {
    govde = `⏹ <b>${ad}</b> sırasını tamamlayamadı (bot durdu)`;
  } else {
    govde = `⚠️ <b>${ad}</b> zaman aşımı (bot kapandı ya da bağlantı yok) — sıra devam ediyor`;
  }
  let son;
  if (o.siradaki) {
    son = `\n⏭ Sıradaki: <b>${kac(o.siradaki)}</b> (${DK(SIRA.ARA_SN)} dk sonra)`;
  } else if (o.tur === 'mola') {
    son = `\n🏁 Mola turu bitti — yeni tur ${DK(SIRA.TUR_ARASI_SN)} dk sonra`;
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

  if (d.aktif) {
    const tur = d.aktif.tur === 'mola' ? 'molada' : 'Metin+ reset yapıyor';
    satirlar.push(
      `\n🚪 Şu an dışarıda: <b>${kac(d.aktif.ad)}</b> — ${tur} (${DK((simdi - d.aktif.baslangic) / 1000)} dk)`
    );
  } else if (d.son_donus) {
    const kalan = SIRA.ARA_SN - (simdi - d.son_donus) / 1000;
    satirlar.push(
      kalan > 0
        ? `\n⏳ Son dönüşten sonra bekleniyor: ${DK(kalan)} dk kaldı`
        : '\n✅ Dışarıda bilgisayar yok'
    );
  } else {
    satirlar.push('\n✅ Dışarıda bilgisayar yok');
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
      const isaret = d.aktif && d.aktif.hwid === a.hwid && d.aktif.tur === 'mola'
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
      const isaret = d.aktif && d.aktif.hwid === a.hwid && d.aktif.tur === 'reset'
        ? '🚪'
        : yapanlar.includes(a.hwid) ? '✅' : '⏳';
      satirlar.push(`${isaret} ${kac(a.ad)}`);
    }
  }

  if (!molacilar.length && !resetciler.length) {
    satirlar.push('\nSıralı mola ya da Metin+ reset açık bilgisayar yok.');
  }
  satirlar.push('\n🚪 dışarıda · ✅ yaptı · ⏳ sırada · 💤 henüz hazır değil');
  return satirlar.join('\n');
}
