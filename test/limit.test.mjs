import { test } from 'node:test';
import assert from 'node:assert/strict';
import { limitHesapla, DINLENME_SN } from '../lib/limit.js';

const now = 1_700_000_000_000; // sabit epoch ms

test('limit kapali (0 saat) -> aktif degil, sayac islemez', () => {
  const r = limitHesapla({ donemSn: 5 * 3600, calisiyor: true, guncellemeMs: now - 30000, nowMs: now, limitSaat: 0 });
  assert.equal(r.aktif, false);
  assert.equal(r.dinlen, false);
  assert.equal(r.donemSn, 5 * 3600); // dokunulmadi
});

test('calisirken gecen sure eklenir', () => {
  const r = limitHesapla({ donemSn: 100, calisiyor: true, guncellemeMs: now - 30000, nowMs: now, limitSaat: 16 });
  assert.equal(r.donemSn, 130);
  assert.equal(r.dinlen, false);
  assert.equal(r.kalanSn, 16 * 3600 - 130);
});

test('bot durmusken sayac artmaz', () => {
  const r = limitHesapla({ donemSn: 100, calisiyor: false, guncellemeMs: now - 30000, nowMs: now, limitSaat: 16 });
  assert.equal(r.donemSn, 100);
});

test('iki gonderim arasi cok uzunsa en fazla 90 sn sayilir', () => {
  const r = limitHesapla({ donemSn: 0, calisiyor: true, guncellemeMs: now - 3600_000, nowMs: now, limitSaat: 16 });
  assert.equal(r.donemSn, 90); // 1 saat degil, 90 sn
});

test('16 saat dolunca 8 saat dinlenme baslar', () => {
  const r = limitHesapla({ donemSn: 16 * 3600 - 10, calisiyor: true, guncellemeMs: now - 30000, nowMs: now, limitSaat: 16 });
  assert.equal(r.donemSn, 16 * 3600);
  assert.equal(r.dinlen, true);
  assert.equal(r.dinlenmeBitisMs, now + DINLENME_SN * 1000);
  assert.equal(r.dinlenmeKalanSn, DINLENME_SN);
});

test('dinlenme sirasinda calissa bile sayac artmaz, dinlen kalir', () => {
  const bitis = now + 3 * 3600 * 1000; // 3 saat sonra biter
  const r = limitHesapla({ donemSn: 16 * 3600, dinlenmeBitisMs: bitis, calisiyor: true, guncellemeMs: now - 30000, nowMs: now, limitSaat: 16 });
  assert.equal(r.dinlen, true);
  assert.equal(r.donemSn, 16 * 3600);
  assert.equal(r.dinlenmeKalanSn, 3 * 3600);
});

test('dinlenme bitince yeni donem: sayac sifirlanir', () => {
  const bitis = now - 1000; // 1 sn once bitti
  const r = limitHesapla({ donemSn: 16 * 3600, dinlenmeBitisMs: bitis, calisiyor: true, guncellemeMs: now - 30000, nowMs: now, limitSaat: 16 });
  assert.equal(r.dinlen, false);
  // sifirlandiktan sonra bu gonderimdeki 30 sn eklenir
  assert.equal(r.donemSn, 30);
});
