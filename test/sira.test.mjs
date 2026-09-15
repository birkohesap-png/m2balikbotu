// K34 sira mantigi testleri:  node --test test/
// Veritabani/ag yok; lib/sira.js'in saf karar fonksiyonu dogrudan calistirilir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SIRA, karar, adayYap, durumuDuzelt, olayMetni, siraMetni, trZaman, resetSaatiMi,
} from '../lib/sira.js';

const DK = 60 * 1000;
const OGLE = Date.UTC(2026, 8, 15, 9, 0, 0); // TR 12:00 - reset saati DISI
const GECE4 = Date.UTC(2026, 8, 15, 1, 0, 0); // TR 04:00

const pc = (hwid, ek = {}) => ({
  hwid, ad: hwid, yas_sn: 10, calisiyor: true,
  mola_cikis: true, mola_hazir: true, reset: false, reset_hazir: false, ...ek,
});

function sor(durum, adaylar, hwid, simdi, tur = 'mola', sure_sn = 15 * 60) {
  return karar({ durum, adaylar, istek: { hwid, tur, tip: 'sor', ad: hwid, sure_sn }, simdi });
}
function bitti(durum, adaylar, hwid, simdi, tur = 'mola', tip = 'bitti') {
  return karar({ durum, adaylar, istek: { hwid, tur, tip, ad: hwid }, simdi });
}

/* ------------------------------------------------------------ birim testleri */

test('ilk izin siradaki ilk bilgisayara, digeri sira_degil', () => {
  const ad = [pc('A'), pc('B'), pc('C')];
  const b = sor({}, ad, 'B', OGLE);
  assert.equal(b.cevap.izin, false);
  assert.equal(b.cevap.sebep, 'sira_degil');
  assert.equal(b.cevap.siradaki, 'A');
  const a = sor(b.durum, ad, 'A', OGLE);
  assert.equal(a.cevap.izin, true);
  assert.equal(a.cevap.sira_no, 1);
  assert.equal(a.cevap.toplam, 3);
  assert.equal(a.olaylar[0].tip, 'basladi');
});

test('ayni anda yalnizca bir bilgisayar disarida', () => {
  const ad = [pc('A'), pc('B')];
  let d = sor({}, ad, 'A', OGLE).durum;
  const b = sor(d, ad, 'B', OGLE + 1000);
  assert.equal(b.cevap.sebep, 'disarida');
  assert.equal(b.cevap.kim, 'A');
  const tekrar = sor(d, ad, 'A', OGLE + 2000);
  assert.equal(tekrar.cevap.izin, true, 'ayni bilgisayar tekrar sorunca izin korunur');
  assert.equal(tekrar.cevap.sebep, 'zaten_senin');
  assert.equal(tekrar.olaylar.length, 0, 'tekrar soru ikinci bildirim uretmez');
});

test('donusten sonra 5 dk beklenir, sonra siradaki', () => {
  const ad = [pc('A'), pc('B')];
  let d = sor({}, ad, 'A', OGLE).durum;
  const bt = bitti(d, ad, 'A', OGLE + 17 * DK);
  d = bt.durum;
  assert.equal(bt.olaylar[0].siradaki, 'B');
  const erken = sor(d, ad, 'B', OGLE + 21 * DK);
  assert.equal(erken.cevap.sebep, 'ara');
  assert.ok(erken.cevap.bekle_sn > 0 && erken.cevap.bekle_sn <= 60);
  const zamaninda = sor(d, ad, 'B', OGLE + 22 * DK);
  assert.equal(zamaninda.cevap.izin, true);
  assert.equal(zamaninda.cevap.sira_no, 2);
});

test('tur bitince 20 dk ara, sonra yeni tur bastan', () => {
  const ad = [pc('A'), pc('B')];
  let t = OGLE;
  let d = sor({}, ad, 'A', t).durum;
  t += 15 * DK; d = bitti(d, ad, 'A', t).durum;
  t += 5 * DK; d = sor(d, ad, 'B', t).durum;
  t += 15 * DK;
  const bt = bitti(d, ad, 'B', t);
  d = bt.durum;
  assert.equal(bt.olaylar[0].siradaki, '', 'son bilgisayar donunce siradaki yok');
  assert.match(olayMetni(bt.olaylar[0]), /Mola turu bitti/);
  const erken = sor(d, ad, 'A', t + 19 * DK);
  assert.equal(erken.cevap.sebep, 'tur_arasi');
  const bErken = sor(d, ad, 'B', t + 19 * DK);
  assert.equal(bErken.cevap.izin, false);
  const yeni = sor(d, ad, 'A', t + 20 * DK);
  assert.equal(yeni.cevap.izin, true);
  assert.equal(yeni.durum.mola.tur_no, 2);
  assert.equal(yeni.cevap.sira_no, 1);
});

test('tur sirasinda hazir olmayan bilgisayar atlanir, hazir olunca sirasi gelir', () => {
  let ad = [pc('A'), pc('B', { mola_hazir: false }), pc('C')];
  let t = OGLE;
  let d = sor({}, ad, 'A', t).durum;
  t += 10 * DK; d = bitti(d, ad, 'A', t).durum;
  t += 5 * DK;
  const c = sor(d, ad, 'C', t);
  assert.equal(c.cevap.izin, true, 'B hazir degil -> C gecer');
  d = c.durum;
  ad = [pc('A'), pc('B'), pc('C')];
  t += 10 * DK;
  const bt = bitti(d, ad, 'C', t);
  assert.equal(bt.olaylar[0].siradaki, 'B', 'B hazir olunca ayni turda sirasi gelir');
  d = bt.durum;
  const b = sor(d, ad, 'B', t + 5 * DK);
  assert.equal(b.cevap.izin, true);
});

test('tur bittikten sonra gelen bilgisayar yeni turu bekler', () => {
  let ad = [pc('A')];
  let d = sor({}, ad, 'A', OGLE).durum;
  d = bitti(d, ad, 'A', OGLE + 10 * DK).durum; // tur bitti
  ad = [pc('A'), pc('B')];
  const b = sor(d, ad, 'B', OGLE + 16 * DK);
  assert.equal(b.cevap.sebep, 'tur_arasi');
  const b2 = sor(b.durum, ad, 'B', OGLE + 31 * DK);
  assert.equal(b2.cevap.izin, false, 'yeni turda sira A ile baslar');
  assert.equal(b2.cevap.siradaki, 'A');
});

test('tek bilgisayar: her mola donusunden 20 dk sonra tekrar', () => {
  const ad = [pc('A')];
  let d = sor({}, ad, 'A', OGLE).durum;
  d = bitti(d, ad, 'A', OGLE + 15 * DK).durum;
  assert.equal(sor(d, ad, 'A', OGLE + 34 * DK).cevap.izin, false);
  assert.equal(sor(d, ad, 'A', OGLE + 35 * DK).cevap.izin, true);
});

test('disaridaki bilgisayar kapanirsa hakki duser', () => {
  const ad = [pc('A'), pc('B')];
  let d = sor({}, ad, 'A', OGLE).durum;
  const kopukA = [pc('A', { yas_sn: SIRA.KOPUK_SN + 5 }), pc('B')];
  const b = sor(d, kopukA, 'B', OGLE + 6 * DK);
  assert.equal(b.olaylar[0].tip, 'zaman_asimi');
  assert.equal(b.cevap.sebep, 'ara', 'dusurulen haktan sonra da 5 dk beklenir');
  assert.equal(b.durum.aktif, null);
  assert.match(olayMetni(b.olaylar[0]), /zaman aşımı/);
});

test('beklenen sure cok asilirsa hakki duser', () => {
  const ad = [pc('A'), pc('B')];
  let d = sor({}, ad, 'A', OGLE, 'mola', 10 * 60).durum;
  const gec = OGLE + (10 + 10 + 20) * DK + 1000; // sure + giris payi + asim payi
  const b = sor(d, ad, 'B', gec);
  assert.equal(b.olaylar[0].tip, 'zaman_asimi');
  const b2 = sor(b.durum, ad, 'B', gec + 5 * DK);
  assert.equal(b2.cevap.izin, true);
});

test('izinden ONCEKI eski "calismiyor" durumu hakki dusurmez, SONRAKI dusurur', () => {
  let d = sor({}, [pc('A'), pc('B')], 'A', OGLE).durum;
  // 20 sn sonra: A'nin kaydi 60 sn eski (izinden once) ve calisiyor=false
  const eski = sor(d, [pc('A', { yas_sn: 60, calisiyor: false }), pc('B')], 'B', OGLE + 20 * 1000);
  assert.equal(eski.cevap.sebep, 'disarida');
  assert.equal(eski.olaylar.length, 0);
  // 3 dk sonra: A'nin kaydi 10 sn eski (izinden sonra) ve calisiyor=false
  const yeni = sor(d, [pc('A', { yas_sn: 10, calisiyor: false }), pc('B')], 'B', OGLE + 3 * DK);
  assert.equal(yeni.olaylar[0].tip, 'zaman_asimi');
});

test('iptal hakki birakir ve bildirim uretir; baskasinin bitti demesi etkisiz', () => {
  const ad = [pc('A'), pc('B')];
  let d = sor({}, ad, 'A', OGLE).durum;
  const yabanci = bitti(d, ad, 'B', OGLE + DK);
  assert.equal(yabanci.durum.aktif.hwid, 'A');
  assert.equal(yabanci.olaylar.length, 0);
  const ip = bitti(d, ad, 'A', OGLE + DK, 'mola', 'iptal');
  assert.equal(ip.durum.aktif, null);
  assert.equal(ip.olaylar[0].tip, 'iptal');
});

test('mola suresi sinirlanir', () => {
  const ad = [pc('A')];
  const kisa = sor({}, ad, 'A', OGLE, 'mola', 5);
  assert.equal(kisa.durum.aktif.beklenen_bitis, OGLE + (SIRA.MOLA_MIN_SN + SIRA.GIRIS_PAYI_SN) * 1000);
  const uzun = sor({}, ad, 'A', OGLE, 'mola', 99999);
  assert.equal(uzun.durum.aktif.beklenen_bitis, OGLE + (SIRA.MOLA_MAX_SN + SIRA.GIRIS_PAYI_SN) * 1000);
});

test('reset: saat disi red, sirayla, gunde bir kez, ertesi gun yeniden', () => {
  const ad = [pc('A', { reset: true, reset_hazir: true }), pc('B', { reset: true, reset_hazir: true })];
  assert.equal(sor({}, ad, 'A', OGLE, 'reset').cevap.sebep, 'saat_disi');
  assert.equal(sor({}, ad, 'A', GECE4 - DK, 'reset').cevap.sebep, 'saat_disi', '03:59 disarida');
  assert.equal(sor({}, ad, 'B', GECE4, 'reset').cevap.sebep, 'sira_degil');
  let r = sor({}, ad, 'A', GECE4, 'reset');
  assert.equal(r.cevap.izin, true);
  let d = bitti(r.durum, ad, 'A', GECE4 + 3 * DK, 'reset').durum;
  assert.equal(sor(d, ad, 'A', GECE4 + 30 * DK, 'reset').cevap.sebep, 'bugun_yapildi');
  assert.equal(sor(d, ad, 'B', GECE4 + 7 * DK, 'reset').cevap.sebep, 'ara');
  const b = sor(d, ad, 'B', GECE4 + 8 * DK, 'reset');
  assert.equal(b.cevap.izin, true);
  assert.equal(b.cevap.sira_no, 2);
  d = bitti(b.durum, ad, 'B', GECE4 + 11 * DK, 'reset').durum;
  const ertesi = sor(d, ad, 'A', GECE4 + 24 * 60 * DK, 'reset');
  assert.equal(ertesi.cevap.izin, true, 'ertesi gun liste sifirlanir');
});

test('bekleyen reset varken mola verilmez, reset bitince mola devam', () => {
  const ad = [
    pc('A', { reset: true, reset_hazir: true }),
    pc('B', { reset: true, reset_hazir: true }),
  ];
  const t = GECE4 + 10 * DK;
  assert.equal(sor({}, ad, 'A', t, 'mola').cevap.sebep, 'reset_oncelikli');
  let d = sor({}, ad, 'A', t, 'reset').durum;
  d = bitti(d, ad, 'A', t + 3 * DK, 'reset').durum;
  d = sor(d, ad, 'B', t + 8 * DK, 'reset').durum;
  d = bitti(d, ad, 'B', t + 11 * DK, 'reset').durum;
  const mola = sor(d, ad, 'A', t + 16 * DK, 'mola');
  assert.equal(mola.cevap.izin, true);
});

test('adayYap ve durumuDuzelt bozuk veriye dayanikli', () => {
  const a = adayYap({ hwid: 'abc', yas: '12.5', veri: { pc: 'VM1', bot: { calisiyor: true },
    hesaplar: [{ ad: 'Hesap 2' }], sira: { mola_cikis: 1, mola_hazir: 0, reset: true } } });
  assert.deepEqual(a, { hwid: 'ABC', ad: 'Hesap 2', yas_sn: 12.5, calisiyor: true,
    mola_cikis: true, mola_hazir: false, reset: true, reset_hazir: false,
    giris: false, giris_hazir: false });
  const b = adayYap({ hwid: 'X', yas: null, veri: null });
  assert.equal(b.calisiyor, false);
  assert.equal(b.mola_cikis, false);
  const d = durumuDuzelt({ aktif: { hwid: 5 }, mola: 'bozuk', reset: { yapanlar: [1, 'A'] } });
  assert.equal(d.aktif, null);
  assert.deepEqual(d.reset.yapanlar, ['A']);
  assert.equal(d.mola.tur_no, 1);
});

test('eski botlar (sira bayragi yok) kimseyi bekletmez', () => {
  const eskiBot = adayYap({ hwid: 'ESKI', yas: 5, veri: { bot: { calisiyor: true } } });
  const r = sor({}, [eskiBot, pc('YENI')], 'YENI', OGLE);
  assert.equal(r.cevap.izin, true);
});

test('bildirim metinleri HTML kacisli, /sira metni uretiliyor', () => {
  const m = olayMetni({ tur: 'mola', tip: 'basladi', ad: '<b>X</b>', sira_no: 1, toplam: 2, sure_sn: 900 });
  assert.ok(!m.includes('<b>X</b>'));
  assert.match(m, /&lt;b&gt;X&lt;\/b&gt;/);
  assert.match(m, /\(1\/2\)/);
  assert.match(m, /~15 dk/);
  const ad = [pc('A'), pc('B', { reset: true })];
  const d = sor({}, ad, 'A', OGLE).durum;
  const metin = siraMetni(d, ad, OGLE + 2 * DK);
  assert.match(metin, /Şu an: <b>A<\/b> — molada/);
  assert.match(metin, /Mola turu 1/);
  assert.match(metin, /Metin\+ reset/);
  assert.match(siraMetni({}, [], OGLE), /bekleyen bilgisayar yok/);
});

test('TR saati UTC+3', () => {
  assert.deepEqual(trZaman(GECE4), { gun: '2026-09-15', saat: 4 });
  assert.equal(resetSaatiMi(GECE4), true);
  assert.equal(resetSaatiMi(Date.UTC(2026, 8, 15, 7, 0, 0)), false, 'TR 10:00 disarida');
});

/* ------------------------------------------------ sirali giris (DC) */

const dc = (hwid, ek = {}) => pc(hwid, { mola_cikis: false, mola_hazir: false, giris: true, giris_hazir: true, ...ek });

test('giris: sirayla, tek tek, girince 5 dk sonra siradaki', () => {
  const ad = [dc('A'), dc('B'), dc('C')];
  assert.equal(sor({}, ad, 'B', OGLE, 'giris').cevap.sebep, 'sira_degil');
  let r = sor({}, ad, 'A', OGLE, 'giris');
  assert.equal(r.cevap.izin, true);
  assert.equal(r.cevap.sira_no, 1);
  assert.equal(r.cevap.toplam, 3);
  assert.equal(sor(r.durum, ad, 'B', OGLE + DK, 'giris').cevap.sebep, 'disarida');
  // A girdi; A'nin durum kaydi hala "giris bekliyor" diyor olabilir - siradaki B olmali
  const bt = bitti(r.durum, ad, 'A', OGLE + 2 * DK, 'giris');
  assert.equal(bt.olaylar[0].siradaki, 'B');
  const adSonra = [dc('A', { giris_hazir: false }), dc('B'), dc('C')];
  assert.equal(sor(bt.durum, adSonra, 'B', OGLE + 6 * DK, 'giris').cevap.sebep, 'ara');
  r = sor(bt.durum, adSonra, 'B', OGLE + 7 * DK, 'giris');
  assert.equal(r.cevap.izin, true);
  assert.equal(r.cevap.sira_no, 2);
  assert.equal(r.cevap.toplam, 3);
});

test('giris: ayni PC tekrar DC olursa yine girebilir (gunluk liste gibi suzmez)', () => {
  const ad = [dc('A')];
  let d = sor({}, ad, 'A', OGLE, 'giris').durum;
  d = bitti(d, ad, 'A', OGLE + 2 * DK, 'giris').durum;
  const tekrar = sor(d, ad, 'A', OGLE + 8 * DK, 'giris');
  assert.equal(tekrar.cevap.izin, true);
  const uzun = sor(bitti(tekrar.durum, ad, 'A', OGLE + 9 * DK, 'giris').durum, ad, 'A', OGLE + 60 * DK, 'giris');
  assert.equal(uzun.cevap.sira_no, 1, '30 dk sonra yeni kopma: numara bastan');
});

test('giris onceligi: DC bekleyen varken mola ve reset verilmez', () => {
  const ad = [pc('A', { reset: true, reset_hazir: true }), dc('B')];
  assert.equal(sor({}, ad, 'A', OGLE, 'mola').cevap.sebep, 'giris_oncelikli');
  assert.equal(sor({}, ad, 'A', GECE4, 'reset').cevap.sebep, 'giris_oncelikli');
  let d = sor({}, ad, 'B', OGLE, 'giris').durum;
  d = bitti(d, [pc('A'), dc('B', { giris_hazir: false })], 'B', OGLE + 2 * DK, 'giris').durum;
  assert.equal(sor(d, [pc('A'), dc('B', { giris_hazir: false })], 'A', OGLE + 7 * DK, 'mola').cevap.izin, true);
});

test('isteyenin KENDI eski kaydi onceligi bozmaz', () => {
  // A mola istiyor ama durum kaydi 30 sn onceki "giris bekliyorum" hali
  const ad = [pc('A', { giris: true, giris_hazir: true })];
  assert.equal(sor({}, ad, 'A', OGLE, 'mola').cevap.izin, true);
});

test('internet herkese birden donunce disaridakinin hakki yanlislikla dusmez', () => {
  let d = sor({}, [dc('A'), dc('B')], 'A', OGLE, 'giris').durum;
  // 10 dk internet yok; donuste B soruyor, B'nin KENDI kaydi da eski
  const eskiler = [dc('A', { yas_sn: 600 }), dc('B', { yas_sn: 600 })];
  const b = sor(d, eskiler, 'B', OGLE + 10 * DK, 'giris');
  assert.equal(b.cevap.sebep, 'disarida');
  assert.equal(b.olaylar.length, 0);
  // B'nin kaydi yenilendi ama A hala sessiz -> A gercekten kopuk
  const b2 = sor(d, [dc('A', { yas_sn: 600 }), dc('B', { yas_sn: 10 })], 'B', OGLE + 11 * DK, 'giris');
  assert.equal(b2.olaylar[0].tip, 'zaman_asimi');
});

test('giris bildirim metinleri', () => {
  assert.match(olayMetni({ tur: 'giris', tip: 'basladi', ad: 'VM2', sira_no: 1, toplam: 4 }), /Sıralı giriş[\s\S]*VM2<\/b> oyuna giriyor \(1\/4\)/);
  assert.match(olayMetni({ tur: 'giris', tip: 'bitti', ad: 'VM2', siradaki: 'VM3' }), /oyuna girdi[\s\S]*Sıradaki: <b>VM3/);
  assert.match(olayMetni({ tur: 'giris', tip: 'iptal', ad: 'VM2' }), /girişten vazgeçti/);
  const ad = [dc('A'), dc('B')];
  const d = sor({}, ad, 'A', OGLE, 'giris').durum;
  const m = siraMetni(d, ad, OGLE + DK);
  assert.match(m, /oyuna giriyor/);
  assert.match(m, /Giriş bekleyenler[\s\S]*🚪 A[\s\S]*⏳ B/);
});

/* ---------------------------------------------------------- simulasyon */

function prng(tohum) {
  let a = tohum >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Bilgisayarlari bota benzer davranan modellerle calistirir:
   - bot basladiktan ilkMolaDk sonra mola ister (karakter modu yok)
   - talep baslayinca durumu 2 sn icinde yayinlar, ilk soruyu 45 sn sonra sorar
   - 20 sn'de bir sorar; izin gelince ~30 sn icinde cikar, mola + 2 dk giris
   - reset istiyorsa TR 04-10 arasi ve bugun yapmadiysa once reseti sorar */
function simule({ n, bas, sureSaat, tohum = 7, mola = true, reset = false, olay = () => {}, ilkMolaDk = 20 }) {
  const rnd = prng(tohum);
  const pcs = Array.from({ length: n }, (_, i) => ({
    hwid: 'PC' + (i + 1), basla: bas, disarida: null, talepBas: null, sonSor: 0,
    acik: true, resetGun: '',
  }));
  let durum = {};
  const kayit = []; // {hwid, tur, cikis, donus}
  const bildirim = [];
  const bitis = bas + sureSaat * 3600 * 1000;
  const adim = 5000;

  const adaylar = (t) => pcs.map((p) => {
    const hazir = !!p.talepBas && !p.disarida && t - p.talepBas >= 2000;
    return {
      hwid: p.hwid, ad: p.hwid, yas_sn: p.acik ? 15 : 9999, calisiyor: p.acik,
      mola_cikis: mola, mola_hazir: hazir && p.istenen === 'mola',
      reset, reset_hazir: hazir && p.istenen === 'reset',
    };
  });

  for (let t = bas; t <= bitis; t += adim) {
    olay(t, pcs);
    // her adimda bilgisayarlar farkli sirada davranir (yaris kosullari)
    const sira = [...pcs].sort(() => rnd() - 0.5);
    for (const p of sira) {
      if (!p.acik) continue;
      if (p.disarida) {
        if (t >= p.disarida.donus) {
          const r = karar({ durum, adaylar: adaylar(t), simdi: t,
            istek: { hwid: p.hwid, tur: p.disarida.tur, tip: 'bitti', ad: p.hwid } });
          durum = r.durum; bildirim.push(...r.olaylar);
          kayit.push({ hwid: p.hwid, tur: p.disarida.tur, cikis: p.disarida.cikis, donus: t });
          if (p.disarida.tur === 'reset') p.resetGun = trZaman(t).gun;
          p.disarida = null; p.talepBas = null; p.sonSor = t;
        }
        continue;
      }
      const { gun } = trZaman(t);
      let istenen = null;
      if (reset && resetSaatiMi(t) && p.resetGun !== gun) istenen = 'reset';
      else if (mola && t - p.basla >= ilkMolaDk * DK) istenen = 'mola';
      if (!istenen) { p.talepBas = null; continue; }
      if (p.istenen !== istenen || !p.talepBas) { p.istenen = istenen; p.talepBas = t; }
      if (t - p.talepBas < 45000 || t - p.sonSor < 20000) continue;
      p.sonSor = t;
      const sure = Math.round(15 * 60 * (0.9 + 0.2 * rnd()));
      const r = karar({ durum, adaylar: adaylar(t), simdi: t,
        istek: { hwid: p.hwid, tur: istenen, tip: 'sor', ad: p.hwid, sure_sn: sure } });
      durum = r.durum; bildirim.push(...r.olaylar);
      if (r.cevap.sebep === 'bugun_yapildi') p.resetGun = gun;
      if (r.cevap.izin) {
        const cikis = t + 30000;
        const disari = istenen === 'mola' ? sure * 1000 : 0;
        p.disarida = { tur: istenen, cikis, donus: cikis + disari + 2.5 * DK };
      }
    }
  }
  return { kayit, bildirim, durum };
}

function cakismaYok(kayit) {
  const s = [...kayit].sort((a, b) => a.cikis - b.cikis);
  for (let i = 1; i < s.length; i++) {
    assert.ok(s[i].cikis >= s[i - 1].donus,
      `${s[i].hwid} disari cikti ama ${s[i - 1].hwid} daha donmemisti`);
    // izin donusten >= 5 dk sonra verilir; cikis izinden 30 sn sonra
    assert.ok(s[i].cikis - s[i - 1].donus >= SIRA.ARA_SN * 1000,
      `${s[i].hwid} ile onceki donus arasi 5 dk'dan az`);
  }
}

test('SIMULASYON: 4 PC, 8 saat mola - cakisma yok, sira korunur, turlar arasi 20 dk', () => {
  const { kayit } = simule({ n: 4, bas: OGLE - 2 * 3600 * 1000, sureSaat: 8 });
  assert.ok(kayit.length >= 12, 'yeterince mola yapildi: ' + kayit.length);
  cakismaYok(kayit);
  assert.ok(kayit[0].cikis - (OGLE - 2 * 3600 * 1000) >= 20 * DK, 'ilk mola 20. dakikadan once degil');
  // turlar: PC1..PC4 sirasi her turda tekrar
  for (let i = 0; i < kayit.length; i++) {
    assert.equal(kayit[i].hwid, 'PC' + ((i % 4) + 1), `${i}. mola sirasi`);
  }
  for (let i = 4; i < kayit.length; i += 4) {
    assert.ok(kayit[i].cikis - kayit[i - 1].donus >= SIRA.TUR_ARASI_SN * 1000,
      `tur ${i / 4 + 1} baslamadan 20 dk beklenmedi`);
  }
});

test('SIMULASYON: 10 PC, farkli tohumlar - hic cakisma yok', () => {
  for (const tohum of [1, 2, 3, 42, 99]) {
    const { kayit } = simule({ n: 10, bas: OGLE - 3 * 3600 * 1000, sureSaat: 10, tohum });
    assert.ok(kayit.length >= 10);
    cakismaYok(kayit);
    const sayilar = {};
    for (const k of kayit) sayilar[k.hwid] = (sayilar[k.hwid] || 0) + 1;
    const degerler = Object.values(sayilar);
    assert.equal(degerler.length, 10, 'her PC en az bir mola yapti');
    assert.ok(Math.max(...degerler) - Math.min(...degerler) <= 1, 'molalar adil dagildi');
  }
});

test('SIMULASYON: disaridaki PC kapanirsa sira kilitlenmez', () => {
  const bas = OGLE - 2 * 3600 * 1000;
  let kapandi = false;
  const { kayit, bildirim } = simule({
    n: 3, bas, sureSaat: 5,
    olay: (t, pcs) => {
      const p2 = pcs[1];
      if (!kapandi && p2.disarida && t >= p2.disarida.cikis + 60000) {
        p2.acik = false; p2.disarida = null; kapandi = true;
      }
    },
  });
  assert.ok(kapandi, 'senaryo tetiklendi');
  assert.ok(bildirim.some((o) => o.tip === 'zaman_asimi' && o.ad === 'PC2'));
  const sonraki = kayit.filter((k) => k.hwid !== 'PC2');
  assert.ok(sonraki.length >= 4, 'PC1 ve PC3 molaya devam etti');
  cakismaYok(kayit);
});

/* Internet kopmasi: tum PC'ler ayni anda oyundan atilir, internet bir sure
   yok (kimse ne sorar ne durum yollar), sonra geri gelir. Durum kayitlari
   internet donduktan sonra ilk 40 sn eski gorunur. */
function simuleDC({ n, bas, kopus, yokDk, sureSaat, tohum = 5, molaAcik = true }) {
  const rnd = prng(tohum);
  const kopusBitis = kopus + yokDk * DK;
  const pcs = Array.from({ length: n }, (_, i) => ({
    hwid: 'PC' + (i + 1), bagli: true, disarida: null, talepBas: null, istenen: null, sonSor: 0,
  }));
  let durum = {};
  const kayit = [];
  const internetYok = (t) => t >= kopus && t < kopusBitis;
  const yas = (t) => (internetYok(t) ? (t - kopus) / 1000 + 15 : t - kopusBitis < 40000 ? (kopusBitis - kopus) / 1000 : 15);

  const adaylar = (t) => pcs.map((p) => {
    const hazir = !!p.talepBas && !p.disarida && t - p.talepBas >= 2000;
    return {
      hwid: p.hwid, ad: p.hwid, yas_sn: yas(t), calisiyor: true,
      mola_cikis: molaAcik, mola_hazir: hazir && p.istenen === 'mola',
      reset: false, reset_hazir: false,
      giris: true, giris_hazir: hazir && p.istenen === 'giris',
    };
  });

  for (let t = bas; t <= bas + sureSaat * 3600 * 1000; t += 5000) {
    if (t === kopus || (t > kopus && t - 5000 < kopus)) {
      for (const p of pcs) if (!p.disarida) { p.bagli = false; p.talepBas = null; }
    }
    if (internetYok(t)) continue;
    const sira = [...pcs].sort(() => rnd() - 0.5);
    for (const p of sira) {
      if (p.disarida) {
        if (t >= p.disarida.donus) {
          const r = karar({ durum, adaylar: adaylar(t), simdi: t,
            istek: { hwid: p.hwid, tur: p.disarida.tur, tip: 'bitti', ad: p.hwid } });
          durum = r.durum;
          kayit.push({ hwid: p.hwid, tur: p.disarida.tur, cikis: p.disarida.cikis, donus: t });
          p.bagli = true; p.disarida = null; p.talepBas = null; p.sonSor = t;
        }
        continue;
      }
      const istenen = !p.bagli ? 'giris' : (molaAcik && t - bas >= 20 * DK ? 'mola' : null);
      if (!istenen) { p.talepBas = null; continue; }
      if (p.istenen !== istenen || !p.talepBas) { p.istenen = istenen; p.talepBas = t; }
      if (t - p.talepBas < 45000 || t - p.sonSor < 20000) continue;
      p.sonSor = t;
      const sure = 10 * 60;
      const r = karar({ durum, adaylar: adaylar(t), simdi: t,
        istek: { hwid: p.hwid, tur: istenen, tip: 'sor', ad: p.hwid, sure_sn: sure } });
      durum = r.durum;
      if (r.cevap.izin) {
        const cikis = t + 10000;
        const disari = istenen === 'mola' ? sure * 1000 : 0;
        p.disarida = { tur: istenen, cikis, donus: cikis + disari + 2 * DK };
      }
    }
  }
  return kayit;
}

test('SIMULASYON: internet kopunca 6 PC tek tek girer, girisler arasi >= 5 dk, arada mola yok', () => {
  for (const tohum of [3, 8, 21]) {
    const bas = OGLE - 3 * 3600 * 1000;
    const kopus = bas + 47 * DK; // biri molada olabilir
    const kayit = simuleDC({ n: 6, bas, kopus, yokDk: 12, sureSaat: 3, tohum });
    const girisler = kayit.filter((k) => k.tur === 'giris' && k.cikis >= kopus);
    const disaridaKalan = kayit.filter((k) => k.tur === 'mola' && k.cikis < kopus && k.donus > kopus).length;
    assert.equal(girisler.length + disaridaKalan, 6, 'kopan her PC bir kez girdi (tohum ' + tohum + ')');
    const sirasi = girisler.map((k) => Number(k.hwid.slice(2)));
    assert.deepEqual(sirasi, [...sirasi].sort((a, b) => a - b), 'girisler PC sirasiyla');
    cakismaYok(kayit);
    const sonGiris = girisler[girisler.length - 1].donus;
    for (const k of kayit.filter((x) => x.tur === 'mola')) {
      // kopmadan ONCE baslamis mola serbest; kopmadan sonra baslayan mola
      // ancak tum girisler bittikten sonra olabilir
      assert.ok(k.cikis < kopus || k.cikis >= sonGiris, 'girisler bitmeden kimse molaya cikmadi');
    }
  }
});

test('SIMULASYON: gece reset - her PC bir kez, sirayla, 5 dk arayla, molalar reset bitince', () => {
  const bas = Date.UTC(2026, 8, 15, 0, 30, 0); // TR 03:30
  const { kayit } = simule({ n: 5, bas, sureSaat: 4, reset: true, mola: true, ilkMolaDk: 20 });
  const resetler = kayit.filter((k) => k.tur === 'reset');
  assert.deepEqual(resetler.map((k) => k.hwid), ['PC1', 'PC2', 'PC3', 'PC4', 'PC5']);
  for (const r of resetler) assert.ok(resetSaatiMi(r.cikis - 30000), 'reset penceresinde');
  const molalar = kayit.filter((k) => k.tur === 'mola');
  const resetSonu = resetler[resetler.length - 1].donus;
  const resetBasi = resetler[0].cikis;
  for (const m of molalar) {
    assert.ok(m.donus <= resetBasi || m.cikis >= resetSonu, 'reset serisinin ortasina mola girmedi');
  }
  cakismaYok(kayit);
});
