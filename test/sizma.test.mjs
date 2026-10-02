import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ipAl,
  engelDegeriTemizle,
  supheliMi,
  ipMusteriHaritasi,
  KALKAN_SEBEPLERI,
} from '../lib/sizma.js';

test('ipAl: x-forwarded-for ilk eleman, yoksa x-real-ip, yoksa bos', () => {
  assert.equal(ipAl(new Headers({ 'x-forwarded-for': '85.1.2.3, 10.0.0.1' })), '85.1.2.3');
  assert.equal(ipAl(new Headers({ 'x-real-ip': ' 85.9.9.9 ' })), '85.9.9.9');
  assert.equal(ipAl(new Headers()), '');
  assert.equal(ipAl(null), '');
});

test('engelDegeriTemizle: gecerli degerler normalize edilir', () => {
  assert.deepEqual(engelDegeriTemizle('ip', ' 85.1.2.3 '), { ok: true, tur: 'ip', deger: '85.1.2.3' });
  assert.deepEqual(engelDegeriTemizle('ip', '2a02:ff0::1'), { ok: true, tur: 'ip', deger: '2a02:ff0::1' });
  assert.deepEqual(engelDegeriTemizle('hwid', 'ab12cd34ef'), { ok: true, tur: 'hwid', deger: 'AB12CD34EF' });
  assert.deepEqual(engelDegeriTemizle('anahtar', 'k34-abcd-efgh'), { ok: true, tur: 'anahtar', deger: 'K34-ABCD-EFGH' });
});

test('engelDegeriTemizle: tehlikeli / bos / bilinmeyen REDDEDILIR', () => {
  assert.equal(engelDegeriTemizle('ip', '').ok, false);
  assert.equal(engelDegeriTemizle('ip', '-').ok, false); // engelliMi yer tutucusu asla eslesmemeli
  assert.equal(engelDegeriTemizle('ip', "1.2.3.4' OR 1=1").ok, false);
  assert.equal(engelDegeriTemizle('hwid', 'abc').ok, false);
  assert.equal(engelDegeriTemizle('anahtar', 'A'.repeat(65)).ok, false);
  assert.equal(engelDegeriTemizle('musteri', 'X1234').ok, false);
});

test('supheliMi: kalkan ihlali hep supheli, tek yazim hatasi degil', () => {
  assert.equal(supheliMi({ kalkan: true, toplam: 1 }), true);
  assert.equal(supheliMi({ toplam: 1, farkli_anahtar: 1, farkli_hwid: 1 }), false);
  assert.equal(supheliMi({ toplam: 3, farkli_anahtar: 3, farkli_hwid: 1 }), true);
  assert.equal(supheliMi({ toplam: 5, farkli_anahtar: 1, farkli_hwid: 4 }), true);
  assert.equal(supheliMi({ toplam: 15, farkli_anahtar: 1, farkli_hwid: 1 }), true);
  assert.equal(supheliMi(null), false);
});

test('ipMusteriHaritasi: IP basina tekil musteri listesi', () => {
  const h = ipMusteriHaritasi([
    { ip: '85.1.2.3', kim: 'Ali' },
    { ip: '85.1.2.3', kim: 'Ali' },
    { ip: '85.1.2.3', kim: 'Veli' },
    { ip: '', kim: 'Bos' },
    { ip: '9.9.9.9', kim: '' },
  ]);
  assert.deepEqual(h, { '85.1.2.3': ['Ali', 'Veli'] });
});

test('kalkan bildirimi sadece beyaz listedeki sebebi kabul eder', () => {
  assert.deepEqual(KALKAN_SEBEPLERI, ['sahte_modul']);
});
