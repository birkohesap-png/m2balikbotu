/**
 * K34 — Telegram bildirim tercihleri (SAF MANTIK, DB/alias importu yok).
 *
 * (KULLANICI ISTEGI 29 Eyl 2026) Kullanici hangi bildirimlerin gelecegini
 * Telegram'dan secebilir. Varsayilan: HEPSI ACIK. Kapatilan kategoriler
 * lisanslar.bildirim_kapali (anahtar listesi) icinde tutulur. GM uyarilari ve
 * sira/giris akis bildirimleri bu tercihlerden ETKILENMEZ.
 */
export const BILDIRIM_KATEGORILER = [
  { key: 'baslat', ad: 'Bot başladı / durdu', turler: ['basladi', 'durdu'] },
  { key: 'baglanti', ad: 'Giriş / Çıkış / DC', turler: ['giris', 'cikis', 'dc'] },
  { key: 'karakter', ad: 'Karakter / Kanal / Mola', turler: ['karakter', 'kanal', 'mola', 'metinreset'] },
  { key: 'pisirme', ad: 'Pişirme / Envanter', turler: ['pisirme', 'envanter'] },
  { key: 'solucan', ad: 'Solucan / Yem', turler: ['solucan', 'yem'] },
  { key: 'yapboz', ad: 'Yapboz', turler: ['yapboz'] },
  { key: 'altinton', ad: 'Altın Ton', turler: ['altinton'] },
  { key: 'pm', ad: 'Özel mesaj / Bot cevabı', turler: ['pm', 'botcevap'] },
  { key: 'olum', ad: 'Karakter öldü', turler: ['olum'] },
  { key: 'uyari', ad: 'Diğer uyarılar', turler: ['uyari'] },
];

/** Bir olay turu hangi kategoriye ait? (bulunamazsa 'uyari'). */
export function turKategorisi(tur) {
  for (const k of BILDIRIM_KATEGORILER) if (k.turler.includes(tur)) return k.key;
  return 'uyari';
}

/** Bu olay turu, verilen kapali-liste ile susturulmus mu? */
export function bildirimKapaliMi(kapaliListe, tur) {
  const kapali = Array.isArray(kapaliListe) ? kapaliListe : [];
  return kapali.includes(turKategorisi(tur));
}
