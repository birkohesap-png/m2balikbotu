import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  urunNormal,
  varlikUrunu,
  URUNLER,
  botUrunu,
  lisansUrunNormal,
  urunUyumlu,
  urunKurallari,
} from '../lib/urun.js';

test('urun gondermeyen (eski/TR) bot -> tr', () => {
  assert.equal(urunNormal(undefined), 'tr');
  assert.equal(urunNormal(null), 'tr');
  assert.equal(urunNormal(''), 'tr');
});

test('pvp botu -> pvp (buyuk/kucuk harf, bosluk)', () => {
  assert.equal(urunNormal('pvp'), 'pvp');
  assert.equal(urunNormal(' PvP '), 'pvp');
});

test('bilinmeyen deger tr ye duser (enjeksiyon/cop kabul edilmez)', () => {
  assert.equal(urunNormal("pvp'; DROP TABLE surumler;--"), 'tr');
  assert.equal(urunNormal('baska'), 'tr');
});

test('GitHub dosya adindan urun', () => {
  assert.equal(varlikUrunu('K34_PvP_Kurulum_1.2.7.exe'), 'pvp');
  assert.equal(varlikUrunu('K34_Kurulum_2.7.3.exe'), 'tr');
  assert.equal(varlikUrunu(''), 'tr');
});

test('yalniz iki urun var', () => {
  assert.deepEqual(URUNLER, ['tr', 'pvp']);
});

/* ---------------- (3 Eki 2026) LISANS URUNU: TR / PvP anahtar ayrimi ---------------- */

test('botUrunu: User-Agent ile bot tespiti (mevcut botlar zaten gonderiyor)', () => {
  assert.equal(botUrunu('K34PvP/2.0'), 'pvp');
  assert.equal(botUrunu('k34pvp/1.2.16'), 'pvp');
  assert.equal(botUrunu('K34/2.0'), 'tr');
  assert.equal(botUrunu(''), 'tr');
  assert.equal(botUrunu(null), 'tr');
  assert.equal(botUrunu('Mozilla/5.0 K34PvP/2.0'), 'tr'); // yalniz BASTA ise PvP
});

test('lisansUrunNormal: yalniz tr | pvp | bos (secilmemis)', () => {
  assert.equal(lisansUrunNormal('PVP'), 'pvp');
  assert.equal(lisansUrunNormal(' tr '), 'tr');
  assert.equal(lisansUrunNormal(''), '');
  assert.equal(lisansUrunNormal('her ikisi'), '');
  assert.equal(lisansUrunNormal(undefined), '');
});

test('urunUyumlu: SECILMEMIS eski anahtar iki botta da calisir (mevcut musteri kilitlenmez)', () => {
  assert.equal(urunUyumlu('', 'tr'), true);
  assert.equal(urunUyumlu('', 'pvp'), true);
  assert.equal(urunUyumlu(null, 'pvp'), true);
  assert.equal(urunUyumlu('tr', 'tr'), true);
  assert.equal(urunUyumlu('pvp', 'pvp'), true);
  assert.equal(urunUyumlu('tr', 'pvp'), false);
  assert.equal(urunUyumlu('pvp', 'tr'), false);
});

test('urunKurallari: PvP de gunluk limit ve hafta sonu kisiti YOK', () => {
  assert.deepEqual(urunKurallari({ lisansUrun: 'pvp', botUrun: 'pvp', limitSaat: 14, haftasonuSerbest: false }), {
    urun: 'pvp',
    limitSaat: 0,
    haftasonuSerbest: true,
  });
  // Secilmemis anahtar PvP botunda -> PvP kurallari
  assert.equal(urunKurallari({ lisansUrun: '', botUrun: 'pvp', limitSaat: 14 }).limitSaat, 0);
  // Secilmemis anahtar TR botunda -> TR kurallari (anahtarin kendi ayari)
  assert.deepEqual(urunKurallari({ lisansUrun: '', botUrun: 'tr', limitSaat: 14, haftasonuSerbest: true }), {
    urun: 'tr',
    limitSaat: 14,
    haftasonuSerbest: true,
  });
});

test('urunKurallari: TR anahtarinin limiti/hafta sonu ayari korunur, bozuk limit 14 olur', () => {
  assert.equal(urunKurallari({ lisansUrun: 'tr', botUrun: 'tr', limitSaat: 0 }).limitSaat, 0); // admin sinirsiz yapmis
  assert.equal(urunKurallari({ lisansUrun: 'tr', botUrun: 'tr', limitSaat: 10 }).limitSaat, 10);
  assert.equal(urunKurallari({ lisansUrun: 'tr', botUrun: 'tr', limitSaat: null }).limitSaat, 0);
  assert.equal(urunKurallari({ lisansUrun: 'tr', botUrun: 'tr', limitSaat: 'abc' }).limitSaat, 14);
  assert.equal(urunKurallari({ lisansUrun: 'tr', botUrun: 'tr', haftasonuSerbest: false }).haftasonuSerbest, false);
});
