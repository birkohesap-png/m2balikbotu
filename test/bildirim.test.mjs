import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BILDIRIM_KATEGORILER, turKategorisi, bildirimKapaliMi } from '../lib/bildirim.js';

test('her kategori benzersiz anahtar + en az bir tur', () => {
  const anahtarlar = new Set();
  for (const c of BILDIRIM_KATEGORILER) {
    assert.ok(c.key && !anahtarlar.has(c.key), 'benzersiz anahtar: ' + c.key);
    anahtarlar.add(c.key);
    assert.ok(Array.isArray(c.turler) && c.turler.length > 0);
  }
});

test('bilinen turler dogru kategoriye eslesir', () => {
  assert.equal(turKategorisi('pisirme'), 'pisirme');
  assert.equal(turKategorisi('envanter'), 'pisirme');
  assert.equal(turKategorisi('giris'), 'baglanti');
  assert.equal(turKategorisi('dc'), 'baglanti');
  assert.equal(turKategorisi('olum'), 'olum');
  assert.equal(turKategorisi('pm'), 'pm');
});

test('bilinmeyen tur uyari kategorisine duser', () => {
  assert.equal(turKategorisi('boyle_bir_tur_yok'), 'uyari');
});

test('varsayilan (bos liste) hicbir sey susturmaz', () => {
  for (const c of BILDIRIM_KATEGORILER) {
    for (const t of c.turler) assert.equal(bildirimKapaliMi([], t), false);
  }
  assert.equal(bildirimKapaliMi(undefined, 'pisirme'), false);
  assert.equal(bildirimKapaliMi(null, 'olum'), false);
});

test('kapatilan kategori o kategorinin TUM turlerini susturur', () => {
  assert.equal(bildirimKapaliMi(['pisirme'], 'pisirme'), true);
  assert.equal(bildirimKapaliMi(['pisirme'], 'envanter'), true);
  // baska kategori etkilenmez
  assert.equal(bildirimKapaliMi(['pisirme'], 'giris'), false);
});

test('olum kategorisi bagimsiz susturulabilir (uyari acik kalir)', () => {
  assert.equal(bildirimKapaliMi(['olum'], 'olum'), true);
  assert.equal(bildirimKapaliMi(['olum'], 'uyari'), false);
});
