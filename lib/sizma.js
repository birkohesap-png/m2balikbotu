/**
 * SIZMA TESPITI - saf yardimcilar (DB yok, '@/' alias yok -> node --test ile
 * dogrudan test edilir; bkz. test/sizma.test.mjs).
 *
 * Kaynaklar:
 *  - /api/check basarisiz denemeler: gecersiz / iptal / suresi_doldu / cihaz_limiti
 *  - /api/check engelli girisim (engellenmis IP/HWID/anahtar tekrar denedi)
 *  - /api/sizma: botun KALKANI sahte modul yakaladi (kirma girisimi) -> sahte_modul
 */

export const ENGEL_TURLERI = ['ip', 'hwid', 'anahtar'];

/** Botun /api/sizma'ya bildirebilecegi sebepler (beyaz liste). */
export const KALKAN_SEBEPLERI = ['sahte_modul'];

export const SIZMA_SEBEP_AD = {
  gecersiz: 'Geçersiz anahtar denemesi',
  iptal: 'İptal edilmiş anahtarla deneme',
  suresi_doldu: 'Süresi dolmuş anahtarla deneme',
  cihaz_limiti: 'Cihaz limiti aşımı (anahtar paylaşımı?)',
  engelli: 'Engellenmişken tekrar deneme',
  sahte_modul: 'KALKAN: sahte modül — kırma girişimi',
  urun_uyumsuz: 'Yanlış bot (TR anahtarı PvP’de ya da tersi)',
};

/**
 * Istegin gercek (dis) IP'si. Vercel x-forwarded-for'un ILK elemanini istemcinin
 * IP'si olarak koyar. `basliklar` bir Headers nesnesi (.get) olmali.
 */
export function ipAl(basliklar) {
  const al = (ad) => String((basliklar && basliklar.get && basliklar.get(ad)) || '');
  const ilk = al('x-forwarded-for').split(',')[0].trim();
  return (ilk || al('x-real-ip').trim()).slice(0, 64);
}

const DESEN = {
  // IPv4 / IPv6 karakterleri
  ip: /^[0-9a-f:.]{3,64}$/i,
  hwid: /^[A-Z0-9_:-]{4,64}$/,
  anahtar: /^[A-Z0-9-]{4,64}$/,
};

/**
 * Panelden gelen engel istegini dogrular/temizler.
 * Doner: { ok: true, tur, deger } | { ok: false, mesaj }
 */
export function engelDegeriTemizle(tur, deger) {
  const t = String(tur || '').trim();
  if (!ENGEL_TURLERI.includes(t)) return { ok: false, mesaj: 'Geçersiz engel türü' };
  let d = String(deger || '').trim();
  if (t !== 'ip') d = d.toUpperCase();
  if (!DESEN[t].test(d)) return { ok: false, mesaj: 'Geçersiz ' + t + ' değeri' };
  return { ok: true, tur: t, deger: d };
}

/**
 * Bir IP ozetinin supheli olup olmadigi. Musterinin tek bir yazim hatasi
 * supheli sayilmasin diye esikler var; KALKAN ihlali her zaman supheli.
 * o: { toplam, farkli_anahtar, farkli_hwid, kalkan }
 */
export function supheliMi(o) {
  if (!o) return false;
  if (o.kalkan) return true;
  return Number(o.farkli_anahtar) >= 3 || Number(o.farkli_hwid) >= 4 || Number(o.toplam) >= 15;
}

/**
 * durumlar satirlarindan (ip, kim) -> { ip: [kim, ...] } haritasi.
 * Panel, engellemeden ONCE "bu IP'de aktif musterin var" uyarisi gosterir:
 * mobil operatorler (CGNAT) bircok kisiyi AYNI IP'ye koyar; IP engeli masum
 * musteriyi de keser.
 */
export function ipMusteriHaritasi(satirlar) {
  const h = {};
  for (const s of satirlar || []) {
    const ip = String((s && s.ip) || '').trim();
    const kim = String((s && s.kim) || '').trim();
    if (!ip || !kim) continue;
    if (!h[ip]) h[ip] = [];
    if (!h[ip].includes(kim)) h[ip].push(kim);
  }
  return h;
}
