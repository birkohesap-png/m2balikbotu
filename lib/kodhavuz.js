/**
 * K34 PvP — ORTAK BOT DOGRULAMA KOD DEPOSU (saf mantik, DB/alias importu yok -> node --test).
 *
 * (KULLANICI ISTEGI 10 Eki 2026) Bir kullanicinin Telegram /kod ile cozdugu (oyunun KABUL ettigi:
 * panel kapandi) kod resmi tum kullanicilara dagitilir. Bot kod kutusunu 40x30 RGB'ye (3600 bayt)
 * indirger; eslestirme zaten bu ozet uzerinden yapilir. Havuz: 'anadolu' (AnadoluMT2 Bot Verify +
 * Ayaz2'nin resimli kodu ayni panel/ayni kodlar).
 */
import { createHash } from 'node:crypto';

export const KOD_VERI_BAYT = 40 * 30 * 3;
export const HAVUZLAR = ['anadolu'];
export const YUKLE_TOPLU_MAX = 50;      // tek istekte en fazla kod
export const GUNLUK_LISANS_MAX = 3000;  // bir lisansin 24 saatte yukleyebilecegi en fazla kod
export const LISTE_SAYFA = 400;         // tek indirmede en fazla kod

export function havuzNormal(h) {
  const s = String(h ?? '').trim().toLowerCase();
  return HAVUZLAR.includes(s) ? s : 'anadolu';
}

/** 1-4 haneli rakam mi? */
export function kodGecerli(k) {
  return /^[0-9]{1,4}$/.test(String(k ?? ''));
}

/** base64 -> Buffer (tam 3600 bayt degilse null). */
export function veriCoz(b64) {
  const s = String(b64 ?? '');
  if (!s || s.length > 6000 || !/^[A-Za-z0-9+/=]+$/.test(s)) return null;
  const buf = Buffer.from(s, 'base64');
  return buf.length === KOD_VERI_BAYT ? buf : null;
}

/** Ayni resim iki kez eklenmesin diye icerik ozeti. */
export function veriOzet(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

/** Gelen toplu listeyi dogrula: gecerli olanlar [{kod, buf, ozet}], gecersiz sayisi. */
export function topluDogrula(liste) {
  const arr = Array.isArray(liste) ? liste.slice(0, YUKLE_TOPLU_MAX) : [];
  const iyi = [];
  let kotu = 0;
  const gorulen = new Set();
  for (const x of arr) {
    const kod = String(x?.kod ?? '');
    const buf = veriCoz(x?.veri);
    if (!kodGecerli(kod) || !buf) { kotu++; continue; }
    const ozet = veriOzet(buf);
    if (gorulen.has(ozet)) continue;
    gorulen.add(ozet);
    iyi.push({ kod, buf, ozet });
  }
  return { iyi, kotu };
}
