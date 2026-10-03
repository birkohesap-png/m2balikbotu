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

/* ------------------------------------------------------------ LISANS URUNU
 * (3 Eki 2026) Her anahtar hangi botta calisacagini tasir: lisanslar.urun
 *   'tr'  -> yalniz K34 TR botu
 *   'pvp' -> yalniz K34 PvP botu
 *   ''    -> SECILMEMIS (ayrimdan ONCE uretilmis eski anahtarlar): iki botta da
 *            calisir. Varsayilan bu, cunku mevcut PvP musterilerinin anahtarlari
 *            veritabaninda 'tr'den ayirt edilemiyordu - zorla 'tr' saymak onlari
 *            aninda kilitlerdi. Admin panelden secince ayrim devreye girer.
 *
 * Bot hangi urun? Botlar zaten User-Agent gonderiyor (bot guncellemesi GEREKMEZ):
 *   TR  -> 'K34/2.0'      PvP -> 'K34PvP/2.0'
 */
export const LISANS_URUN_AD = { tr: 'TR', pvp: 'PvP', '': 'Seçilmemiş (TR + PvP)' };

/** Istegi yapan botun urunu (User-Agent'tan). Bilinmeyen -> 'tr'. */
export function botUrunu(userAgent) {
  return /^K34PvP\//i.test(String(userAgent || '').trim()) ? 'pvp' : 'tr';
}

/** Panelden gelen lisans urunu: 'tr' | 'pvp' | '' (secilmemis). */
export function lisansUrunNormal(u) {
  const s = String(u ?? '').trim().toLowerCase();
  return s === 'tr' || s === 'pvp' ? s : '';
}

/** Anahtar bu botta calisabilir mi? Secilmemis anahtar her ikisinde calisir. */
export function urunUyumlu(lisansUrun, botUrun) {
  const l = lisansUrunNormal(lisansUrun);
  return !l || l === botUrun;
}

/**
 * Etkin urunun kurallari. PvP'de hafta sonu kisiti ve gunluk calisma limiti
 * YOK (kullanici istegi). Etkin urun = anahtarin urunu, secilmemisse botun urunu.
 * Doner: { urun, limitSaat, haftasonuSerbest }
 */
export function urunKurallari({ lisansUrun, botUrun, limitSaat, haftasonuSerbest }) {
  const urun = lisansUrunNormal(lisansUrun) || botUrun;
  if (urun === 'pvp') return { urun, limitSaat: 0, haftasonuSerbest: true };
  const ls = Number(limitSaat);
  return { urun, limitSaat: Number.isFinite(ls) ? ls : 14, haftasonuSerbest: !!haftasonuSerbest };
}
