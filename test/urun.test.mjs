import { test } from 'node:test';
import assert from 'node:assert/strict';
import { urunNormal, varlikUrunu, URUNLER } from '../lib/urun.js';

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
