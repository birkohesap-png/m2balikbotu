// Gunluk calisma limiti: bir "gun" icinde en fazla N saat (varsayilan 16).
//
// Sayac her gun (Turkiye saatiyle GECE 03:00) sifirlanir. Gece yarisi degil 03:00
// cunku gece 12 gibi acan kullanici "sinir yok" sanmasin. "Bugun 12 saat tuttu,
// (03:00 gecince) taze 16 saat" -> eski surumde toplaniyordu, duzeltildi.
//
// Key'e bagli, yalnizca admin degistirir. Sayac SUNUCUDA (kullanim tablosu)
// tutulur; bot kapatilip acilinca sifirlanmaz. `dinlenme_bitis` kolonu artik
// "siradaki sifirlama ani (03:00)" olarak kullanilir - o an gelince sifirlar.

export const VARSAYILAN_LIMIT_SAAT = 16;
const HEARTBEAT_MAX_SN = 90;          // iki durum gonderimi arasi en fazla bu kadar sn sayilir
const TR_OFSET_MS = 3 * 3600 * 1000;  // Turkiye UTC+3 (DST yok)
const SIFIRLAMA_SAAT = 3;             // gunluk sayac Turkiye saatiyle 03:00'te sifirlanir

/** Verilen ana gore SIRADAKI sifirlama aninin (Turkiye 03:00) epoch ms'i. */
function sonrakiSifirlamaMs(nowMs) {
  const trMs = nowMs + TR_OFSET_MS;                 // Turkiye duvar saati (ms)
  const gun = Math.floor(trMs / 86400000);
  let sifirTr = gun * 86400000 + SIFIRLAMA_SAAT * 3600000; // bugun 03:00 (TR ms)
  if (trMs >= sifirTr) sifirTr += 86400000;         // gectiyse yarin 03:00
  return sifirTr - TR_OFSET_MS;                      // UTC'ye cevir
}

/**
 * @param {object} o
 *   donemSn        Bugun birikmis aktif saniye
 *   dinlenmeBitisMs "Gunun bitisi" (siradaki gece yarisi) epoch ms - gecince sifirlanir
 *   guncellemeMs   Son durum gonderiminin epoch ms'i
 *   calisiyor      Bot su an balik tutuyor mu
 *   nowMs          Simdiki epoch ms
 *   limitSaat      Bu key icin gunluk limit (saat). 0 = kapali/sinirsiz.
 */
export function limitHesapla(o) {
  const nowMs = Number(o.nowMs) || Date.now();
  const limitSaat = Math.max(0, Number(o.limitSaat) || 0);
  const limitSn = Math.round(limitSaat * 3600);
  let donemSn = Math.max(0, Math.floor(Number(o.donemSn) || 0));
  let gunBitisMs = Number(o.dinlenmeBitisMs) || 0;

  // Sifirlama ani (03:00) gectiyse (veya ilk kez) sayaci sifirla, yenisini kur.
  if (!gunBitisMs || nowMs >= gunBitisMs) {
    donemSn = 0;
    gunBitisMs = sonrakiSifirlamaMs(nowMs);
  }

  const dolu = () => limitSn > 0 && donemSn >= limitSn;

  // Limit aciksa, bot calisiyorsa ve gun hakki dolmadiysa gecen sureyi ekle.
  if (limitSn > 0 && o.calisiyor && !dolu()) {
    let gecenSn = 0;
    if (o.guncellemeMs) {
      gecenSn = Math.max(0, Math.min(HEARTBEAT_MAX_SN, Math.floor((nowMs - Number(o.guncellemeMs)) / 1000)));
    }
    donemSn += gecenSn;
    if (donemSn > limitSn) donemSn = limitSn;
  }

  const dinlen = dolu(); // gun hakki bitti -> bot durmali/acilmamali (gece yarisina kadar)
  return {
    aktif: limitSn > 0,
    donemSn,
    dinlenmeBitisMs: gunBitisMs,               // kolona "gunun bitisi" yazilir
    dinlen,
    gunlukSn: donemSn,
    limitSn,
    kalanSn: limitSn > 0 ? Math.max(0, limitSn - donemSn) : 0,
    // Dolduysa: gece yarisina kalan sure (o zaman sifirlanir). Dolmadiysa 0.
    dinlenmeKalanSn: dinlen ? Math.max(0, Math.floor((gunBitisMs - nowMs) / 1000)) : 0,
  };
}
