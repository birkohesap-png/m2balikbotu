/**
 * K34 — Telegram hesap listesi yardimcilari (SAF MANTIK, veritabani yok).
 *
 * 1) CIFT KAYIT: Ayni bilgisayarin HWID'i degisince (Windows ag bagdastiricisi
 *    sirasi degisince MAC farkli okunabiliyordu) sunucuda ikinci bir durum
 *    satiri olusuyor ve Telegram'da ayni PC iki kez gorunuyordu. Ayni bilgisayar
 *    adi + ayni hesap adina sahip satirlardan cevrimici olanlar kalir; hicbiri
 *    cevrimici degilse yalnizca en yenisi gosterilir. 7 gunden eski kayitlar hic
 *    gosterilmez.
 * 2) SAAT FARKI: VM'lerde saat senkronu kapali olabiliyor; botun gonderdigi mutlak
 *    zamanlar (baslangic, Altin Ton) sunucu saatine cevrilir. Calisma suresi
 *    artik bottan GORELI (calisma_sn) gelir, saat farkindan etkilenmez.
 */
export const HESAP = Object.freeze({
  CANLI_SN: 150,
  ESKI_KAYIT_SN: 7 * 86400,
});

const ms = (r) => new Date(r.guncelleme).getTime();

function grupAnahtari(r) {
  const v = r.veri || {};
  const h0 = (Array.isArray(v.hesaplar) && v.hesaplar[0]) || {};
  return (String(v.pc || '') + '|' + String(h0.ad || '')).toLowerCase();
}

/** durumlar satirlari ({id, hwid, veri, guncelleme}) -> Telegram hesap listesi. */
export function satirdanHesaplar(rows, simdiMs) {
  const tazeler = (rows || []).filter((r) => (simdiMs - ms(r)) / 1000 <= HESAP.ESKI_KAYIT_SN);
  const gruplar = new Map();
  for (const r of tazeler) {
    const k = grupAnahtari(r);
    if (!gruplar.has(k)) gruplar.set(k, []);
    gruplar.get(k).push(r);
  }
  const secilen = new Set();
  for (const [k, liste] of gruplar) {
    if (k === '|') {
      liste.forEach((r) => secilen.add(r.id)); // adi bilinmeyen kayitlar birlestirilmez
      continue;
    }
    const canlilar = liste.filter((r) => (simdiMs - ms(r)) / 1000 <= HESAP.CANLI_SN);
    if (canlilar.length) canlilar.forEach((r) => secilen.add(r.id));
    else secilen.add(liste.reduce((a, b) => (ms(a) >= ms(b) ? a : b)).id);
  }

  const sonuc = [];
  for (const r of rows || []) {
    if (!secilen.has(r.id)) continue;
    const v = r.veri || {};
    const yas = Math.max(0, (simdiMs - ms(r)) / 1000);
    const canli = yas <= HESAP.CANLI_SN;
    const botSaat = Number(v.saat);
    const fark = Number.isFinite(botSaat) && botSaat > 0 ? ms(r) / 1000 - botSaat : 0;
    const calisiyor = !!(v.bot && v.bot.calisiyor);
    (Array.isArray(v.hesaplar) ? v.hesaplar : []).forEach((h, i) => {
      const d = { ...h };
      if (Number(d.baslangic)) d.baslangic = Number(d.baslangic) + fark;
      if (d.ton_gunluk && typeof d.ton_gunluk === 'object') {
        d.ton_gunluk = Object.fromEntries(
          Object.entries(d.ton_gunluk).map(([s, t]) => [s, Number(t) ? Number(t) + fark : 0])
        );
      }
      sonuc.push({
        ...d,
        canli,
        calisiyor,
        yas,
        pc: v.pc || String(r.hwid || '').slice(0, 8),
        durumId: r.id,
        idx: i,
        hwid: r.hwid,
      });
    });
  }
  return sonuc;
}

/** Calisma suresi (sn) ya da null (bilinmiyor / bot durmus). */
export function calismaSn(h, simdiMs) {
  if (h.calisma_sn !== undefined && h.calisma_sn !== null && Number.isFinite(Number(h.calisma_sn))) {
    if (!h.calisiyor) return null;
    return Math.max(0, Number(h.calisma_sn) + (h.canli ? Number(h.yas || 0) : 0));
  }
  if (Number(h.baslangic)) return Math.max(0, simdiMs / 1000 - Number(h.baslangic));
  return null;
}

/** Karakter degisimi: {mod: 'sure'|'balik', kalan} ya da null (kapali). */
export function kdBilgi(h) {
  if (!h || !h.kd_acik) return null;
  if (h.kd_mod === 'balik') {
    return { mod: 'balik', kalan: Math.max(0, Math.round(Number(h.kd_balik_kalan || 0))) };
  }
  if (h.kd_kalan === undefined || h.kd_kalan === null) return null;
  return { mod: 'sure', kalan: Math.max(0, Math.round(Number(h.kd_kalan) - Number(h.yas || 0))) };
}

/** Telegram karakter butonu verisi (64 bayt siniri icinde). */
export function karakterCallback(durumId, idx, slot) {
  return `ki:${durumId}:${idx}:${slot}`;
}

export function karakterCallbackCoz(data) {
  const p = String(data || '').split(':');
  if (p[0] !== 'ki' || p.length !== 4) return null;
  const [durumId, idx, slot] = p.slice(1).map(Number);
  if (![durumId, idx, slot].every(Number.isInteger) || durumId < 1 || idx < 0 || slot < 1 || slot > 5) {
    return null;
  }
  return { durumId, idx, slot };
}
