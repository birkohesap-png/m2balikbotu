// Gunluk calisma limiti (16 saat aktif -> 8 saat zorunlu dinlenme).
//
// Kullaniciya bagli DEGIL, KEY'e bagli ve yalnizca admin degistirebilir. Her
// bilgisayar (hwid) kendi donemini tutar: bot calistikca donem_sn artar; limit
// (varsayilan 16 saat) dolunca 8 saatlik dinlenme baslar. Dinlenme bitince
// donem sifirlanir, yeniden 16 saat hak dogar. Sayac SUNUCUDA tutulur; bot
// kapatilip acilinca sifirlanmaz (bkz. app/api/durum).
//
// Bu dosya SAF mantik (yan etkisiz) - test edilebilsin diye. Kalici durum
// app/api/durum'da kullanim tablosuna yazilir.

export const DINLENME_SN = 8 * 3600;      // 16 saat sonrasi zorunlu dinlenme
export const VARSAYILAN_LIMIT_SAAT = 16;
const HEARTBEAT_MAX_SN = 90;              // iki durum gonderimi arasi en fazla bu kadar sn sayilir

/**
 * @param {object} o
 *   donemSn        Su ana kadar bu donemde birikmis aktif saniye
 *   dinlenmeBitisMs Dinlenmenin bitecegi epoch ms (0/undefined = dinlenmede degil)
 *   guncellemeMs   Son durum gonderiminin epoch ms'i (gecen sureyi olcmek icin)
 *   calisiyor      Bot su an balik tutuyor mu
 *   nowMs          Simdiki epoch ms
 *   limitSaat      Bu key icin gunluk limit (saat). 0 = kapali/sinirsiz.
 * @returns yeni durum + bota gonderilecek ozet
 */
export function limitHesapla(o) {
  const nowMs = Number(o.nowMs) || Date.now();
  const limitSaat = Math.max(0, Number(o.limitSaat) || 0);
  const limitSn = Math.round(limitSaat * 3600);
  let donemSn = Math.max(0, Math.floor(Number(o.donemSn) || 0));
  let dinlenmeBitisMs = Number(o.dinlenmeBitisMs) || 0;

  // Dinlenme bittiyse yeni donem baslasin.
  if (dinlenmeBitisMs && nowMs >= dinlenmeBitisMs) {
    donemSn = 0;
    dinlenmeBitisMs = 0;
  }

  const dinleniyor = () => dinlenmeBitisMs > 0 && nowMs < dinlenmeBitisMs;

  // Limit aciksa, bot calisiyorsa ve dinlenmede degilse gecen sureyi ekle.
  if (limitSn > 0 && o.calisiyor && !dinleniyor()) {
    let gecenSn = 0;
    if (o.guncellemeMs) {
      gecenSn = Math.max(0, Math.min(HEARTBEAT_MAX_SN, Math.floor((nowMs - Number(o.guncellemeMs)) / 1000)));
    }
    donemSn += gecenSn;
    if (donemSn >= limitSn) {
      donemSn = limitSn;
      dinlenmeBitisMs = nowMs + DINLENME_SN * 1000; // 8 saat dinlenme basladi
    }
  }

  const dinlen = dinleniyor();
  return {
    aktif: limitSn > 0,
    donemSn,
    dinlenmeBitisMs,
    dinlen,                                   // true ise bot durmali / acilmamali
    gunlukSn: donemSn,                         // bugune kadar aktif calisma
    limitSn,
    kalanSn: limitSn > 0 ? Math.max(0, limitSn - donemSn) : 0,
    dinlenmeKalanSn: dinlenmeBitisMs ? Math.max(0, Math.floor((dinlenmeBitisMs - nowMs) / 1000)) : 0,
  };
}
