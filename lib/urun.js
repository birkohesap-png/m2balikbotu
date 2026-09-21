/**
 * URUN AYRIMI (otomatik guncelleme).
 *
 * Ayni site ve veritabani IKI ayri botu gunceller:
 *   'tr'  -> K34 (TR) balik botu
 *   'pvp' -> K34 Balik Yapboz Bot PvP
 *
 * Eski/TR botlari istekte urun GONDERMEZ -> 'tr' varsayilir (geriye uyumlu,
 * mevcut TR musterileri hicbir sey fark etmez). PvP botu `urun=pvp` gonderir
 * ve cevapta "urun":"pvp" gormezse guncellemeyi YOK SAYAR - boylece bir
 * urunun kurulumu asla digerinin musterisine inmez.
 */
export const URUNLER = ['tr', 'pvp'];

export const URUN_AD = { tr: 'K34 TR', pvp: 'K34 PvP' };

/** Istekten gelen urun degerini guvenli hale getirir: yalniz 'tr' | 'pvp'. */
export function urunNormal(u) {
  return String(u ?? '').trim().toLowerCase() === 'pvp' ? 'pvp' : 'tr';
}

/**
 * GitHub'daki kurulum dosyasi hangi urune ait? PvP kurulumlari
 * "K34_PvP_Kurulum_x.y.z.exe" adiyla uretilir (yayinla.py).
 */
export function varlikUrunu(ad) {
  return /pvp/i.test(String(ad ?? '')) ? 'pvp' : 'tr';
}
