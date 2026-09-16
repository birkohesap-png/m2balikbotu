// K34 Telegram hesap listesi testleri:  node --test test/hesap.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HESAP, satirdanHesaplar, calismaSn, kdBilgi, karakterCallback, karakterCallbackCoz,
} from '../lib/hesap.js';

const SIMDI = Date.UTC(2026, 8, 16, 12, 0, 0);
const once = (sn) => new Date(SIMDI - sn * 1000).toISOString();
const satir = (id, hwid, yasSn, veri) => ({ id, hwid, guncelleme: once(yasSn), veri });
const v = (pc, ad, ek = {}) => ({ pc, bot: { calisiyor: true }, hesaplar: [{ ad, tutulan: 1 }], ...ek });

test('ayni PC iki HWID ile kayitli: cevrimdisi eski kayit gizlenir', () => {
  const liste = satirdanHesaplar([
    satir(1, 'ESKI', 3600, v('PC-2', 'Hesap 2')),
    satir(2, 'YENI', 10, v('PC-2', 'Hesap 2')),
    satir(3, 'BASKA', 10, v('PC-3', 'Hesap 3')),
  ], SIMDI);
  assert.deepEqual(liste.map((h) => h.durumId), [2, 3]);
});

test('ikisi de cevrimdisi: yalnizca en yeni kayit gosterilir', () => {
  const liste = satirdanHesaplar([
    satir(1, 'A', 7200, v('PC-2', 'Hesap 2')),
    satir(2, 'B', 3600, v('PC-2', 'Hesap 2')),
  ], SIMDI);
  assert.deepEqual(liste.map((h) => h.durumId), [2]);
  assert.equal(liste[0].canli, false);
});

test('ayni ad ama IKISI DE cevrimici (klon VM): ikisi de kalir', () => {
  const liste = satirdanHesaplar([
    satir(1, 'A', 20, v('PC-1', 'Hesap 1')),
    satir(2, 'B', 25, v('PC-1', 'Hesap 1')),
  ], SIMDI);
  assert.equal(liste.length, 2);
});

test('7 gunden eski kayitlar hic gosterilmez; adsiz kayitlar birlestirilmez', () => {
  const liste = satirdanHesaplar([
    satir(1, 'A', HESAP.ESKI_KAYIT_SN + 60, v('PC-9', 'Hesap 9')),
    satir(2, 'B', 10, { bot: {}, hesaplar: [{ tutulan: 0 }] }),
    satir(3, 'C', 5000, { bot: {}, hesaplar: [{ tutulan: 0 }] }),
  ], SIMDI);
  assert.deepEqual(liste.map((h) => h.durumId), [2, 3]);
});

test('VM saati 2 saat ileride: baslangic ve Altin Ton sunucu saatine cevrilir', () => {
  const ileri = 7200;
  const botSimdi = SIMDI / 1000 - 10 + ileri; // durum 10 sn once, VM saati 2 sa ileri
  const liste = satirdanHesaplar([
    satir(1, 'A', 10, v('PC-2', 'Hesap 2', {
      saat: botSimdi,
      hesaplar: [{ ad: 'Hesap 2', baslangic: botSimdi - 3600, ton_gunluk: { 0: botSimdi - 600 } }],
    })),
  ], SIMDI);
  const h = liste[0];
  assert.ok(Math.abs(calismaSn(h, SIMDI) - 3610) < 2, 'calisma ~1 sa (eksi degil)');
  assert.ok(Math.abs(h.ton_gunluk[0] - (SIMDI / 1000 - 610)) < 2);
});

test('calisma_sn varsa o kullanilir; bot durmussa sure yok', () => {
  const h = { calisma_sn: 1800, calisiyor: true, canli: true, yas: 20 };
  assert.equal(calismaSn(h, SIMDI), 1820);
  assert.equal(calismaSn({ ...h, calisiyor: false }, SIMDI), null);
  assert.equal(calismaSn({}, SIMDI), null);
});

test('karakter degisimi: sure ve balik modu', () => {
  assert.equal(kdBilgi({ kd_acik: false }), null);
  assert.deepEqual(kdBilgi({ kd_acik: true, kd_kalan: 600, yas: 30 }), { mod: 'sure', kalan: 570 });
  assert.deepEqual(kdBilgi({ kd_acik: true, kd_kalan: 0, yas: 5 }), { mod: 'sure', kalan: 0 });
  assert.deepEqual(kdBilgi({ kd_acik: true, kd_mod: 'balik', kd_balik_kalan: 7 }), { mod: 'balik', kalan: 7 });
});

test('karakter butonu verisi uretilip cozuluyor, bozuk/eski veri reddediliyor', () => {
  const d = karakterCallback(123, 0, 3);
  assert.ok(d.length <= 64);
  assert.deepEqual(karakterCallbackCoz(d), { durumId: 123, idx: 0, slot: 3 });
  assert.equal(karakterCallbackCoz('ki:3'), null, 'eski surum butonu');
  assert.equal(karakterCallbackCoz('ki:1:0:9'), null);
  assert.equal(karakterCallbackCoz('ki:x:0:1'), null);
  assert.equal(karakterCallbackCoz('h:1:0'), null);
});
