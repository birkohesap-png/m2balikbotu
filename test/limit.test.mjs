import { test } from 'node:test';
import assert from 'node:assert/strict';
import { limitHesapla } from '../lib/limit.js';

// 1 Ocak 2026, 12:00 Turkiye (09:00 UTC). Siradaki sifirlama = 2 Ocak 03:00 TR = 2 Ocak 00:00 UTC.
const now = Date.UTC(2026, 0, 1, 9, 0, 0);
const sifirlama = Date.UTC(2026, 0, 2, 0, 0, 0);

test('limit kapali (0 saat) -> aktif degil, sayac islemez', () => {
  const r = limitHesapla({ donemSn: 5 * 3600, dinlenmeBitisMs: sifirlama, calisiyor: true, guncellemeMs: now - 30000, nowMs: now, limitSaat: 0 });
  assert.equal(r.aktif, false);
  assert.equal(r.dinlen, false);
  assert.equal(r.donemSn, 5 * 3600);
});

test('calisirken gecen sure eklenir, sifirlama 03:00', () => {
  const r = limitHesapla({ donemSn: 100, dinlenmeBitisMs: sifirlama, calisiyor: true, guncellemeMs: now - 30000, nowMs: now, limitSaat: 16 });
  assert.equal(r.donemSn, 130);
  assert.equal(r.dinlen, false);
  assert.equal(r.dinlenmeBitisMs, sifirlama);
  assert.equal(r.kalanSn, 16 * 3600 - 130);
});

test('bot durmusken sayac artmaz', () => {
  const r = limitHesapla({ donemSn: 100, dinlenmeBitisMs: sifirlama, calisiyor: false, guncellemeMs: now - 30000, nowMs: now, limitSaat: 16 });
  assert.equal(r.donemSn, 100);
});

test('iki gonderim arasi cok uzunsa en fazla 90 sn sayilir', () => {
  const r = limitHesapla({ donemSn: 0, dinlenmeBitisMs: sifirlama, calisiyor: true, guncellemeMs: now - 3600_000, nowMs: now, limitSaat: 16 });
  assert.equal(r.donemSn, 90);
});

test('16 saat dolunca dinlen=true, 03:00 sifirlamasina kadar', () => {
  const r = limitHesapla({ donemSn: 16 * 3600 - 10, dinlenmeBitisMs: sifirlama, calisiyor: true, guncellemeMs: now - 30000, nowMs: now, limitSaat: 16 });
  assert.equal(r.donemSn, 16 * 3600);
  assert.equal(r.dinlen, true);
  assert.equal(r.dinlenmeKalanSn, Math.floor((sifirlama - now) / 1000));
});

test('sifirlama gecince sayac SIFIRLANIR (bugun 12sa -> yeni gun taze)', () => {
  const yarin = Date.UTC(2026, 0, 2, 9, 0, 0); // 2 Ocak 12:00 TR, sifirlamayi (2 Ocak 00:00 UTC) gecmis
  const r = limitHesapla({ donemSn: 12 * 3600, dinlenmeBitisMs: sifirlama, calisiyor: true, guncellemeMs: yarin - 30000, nowMs: yarin, limitSaat: 16 });
  assert.equal(r.dinlen, false);
  assert.equal(r.donemSn, 30);
  assert.equal(r.dinlenmeBitisMs, Date.UTC(2026, 0, 3, 0, 0, 0)); // sonraki 03:00
});

test('ilk kez (dinlenmeBitis yok) sifirlama kurulur, sayac 0dan baslar', () => {
  const r = limitHesapla({ donemSn: 0, dinlenmeBitisMs: 0, calisiyor: true, guncellemeMs: now - 30000, nowMs: now, limitSaat: 16 });
  assert.equal(r.dinlenmeBitisMs, sifirlama);
  assert.equal(r.donemSn, 30);
});
