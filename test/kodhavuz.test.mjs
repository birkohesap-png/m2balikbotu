import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kodGecerli, veriCoz, veriOzet, topluDogrula, havuzNormal, KOD_VERI_BAYT, YUKLE_TOPLU_MAX } from '../lib/kodhavuz.js';

const ornek = (b) => Buffer.alloc(KOD_VERI_BAYT, b).toString('base64');

test('kod yalniz 1-4 rakam', () => {
  for (const k of ['0', '7', '47', '9113']) assert.equal(kodGecerli(k), true);
  for (const k of ['', '12345', 'a1', '4 7', null, undefined, '-1']) assert.equal(kodGecerli(k), false);
});

test('veri tam 3600 bayt olmali', () => {
  assert.ok(veriCoz(ornek(5)));
  assert.equal(veriCoz(Buffer.alloc(100).toString('base64')), null);
  assert.equal(veriCoz('!!!'), null);
  assert.equal(veriCoz(''), null);
});

test('ayni resim ayni ozet, farkli resim farkli', () => {
  assert.equal(veriOzet(veriCoz(ornek(1))), veriOzet(veriCoz(ornek(1))));
  assert.notEqual(veriOzet(veriCoz(ornek(1))), veriOzet(veriCoz(ornek(2))));
});

test('toplu: gecersizler sayilir, istek ici tekrar elenir, ust sinir', () => {
  const { iyi, kotu } = topluDogrula([
    { kod: '47', veri: ornek(1) }, { kod: '47', veri: ornek(1) }, { kod: 'x', veri: ornek(2) }, { kod: '12', veri: 'kisa' },
  ]);
  assert.equal(iyi.length, 1);
  assert.equal(kotu, 2);
  const cok = Array.from({ length: 80 }, (_, i) => ({ kod: '1', veri: ornek(i % 250) }));
  assert.ok(topluDogrula(cok).iyi.length <= YUKLE_TOPLU_MAX);
});

test('bilinmeyen havuz anadolu', () => {
  assert.equal(havuzNormal('ANADOLU'), 'anadolu');
  assert.equal(havuzNormal('baska'), 'anadolu');
});
