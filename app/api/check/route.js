import { NextResponse } from 'next/server';
import { sql, tablolariHazirla, engelliMi, sizmaKaydet } from '@/lib/db';
import { lisansJetonu } from '@/lib/auth';
import { ipAl } from '@/lib/sizma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const yanit = (o, kod = 200) =>
  NextResponse.json(o, { status: kod, headers: { 'Cache-Control': 'no-store' } });

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Botun lisans dogrulama ucu.
 * POST { anahtar, hwid, surum? }
 * ->   { ok, sebep, kalan_sn, paket, max_cihaz, cihaz_sayisi, jeton, vk }
 *
 * sebep: gecerli | gecersiz | iptal | suresi_doldu | cihaz_limiti | engelli | hata
 *
 * SIZMA TESPITI (2 Eki 2026): her basarisiz deneme IP'siyle `sizma` tablosuna
 * yazilir (panel -> Sizma Girisimleri). Panelden engellenen IP/HWID/anahtar
 * 'engelli' alir ve vk ALAMAZ -> calinmis gecerli anahtarla bile sablonlar
 * cozulmez. 'engelli' bilerek HTTP 200: bot 4xx'i "baglanti hatasi" sayip
 * onbellekteki oturumla calismaya devam ederdi.
 *
 * vk = VARLIK ANAHTARI. Botun sablon gorselleri ve yapboz beyni bu anahtarla
 * sifreli paketlenir; anahtar olmadan cozulemezler. Eyl 2026'daki kirilmadan
 * sonra eklendi: saldirgan sahte modulle lisans kontrolunu "gecerli" yapmisti,
 * ama lisans artik bir bool degil bir ANAHTAR uretiyor - bool'u True yapmak
 * varliklari cozmuyor.
 *
 * SADECE gecerli lisansa donulur. K34_VARLIK_ANAHTARI ortam degiskeni
 * ayarlanmazsa alan hic gonderilmez ve sifreli surumler calismaz (fail-closed).
 * Deger, bot deposundaki kalkan_gizli.json icindeki "vk" ile AYNI olmali.
 */
export async function POST(req) {
  let govde;
  try {
    govde = await req.json();
  } catch {
    return yanit({ ok: false, sebep: 'hata', mesaj: 'Gecersiz istek' }, 400);
  }

  const anahtar = String(govde.anahtar || govde.license_key || '').trim().toUpperCase();
  const hwid = String(govde.hwid || '').trim().toUpperCase().slice(0, 64);

  if (!anahtar || anahtar.length > 64 || !hwid) {
    return yanit({ ok: false, sebep: 'gecersiz', kalan_sn: 0 });
  }

  const ip = ipAl(req.headers);
  const kaydet = (sebep, ayrinti = '') => sizmaKaydet({ ip, sebep, anahtar, hwid, ayrinti });

  try {
    await tablolariHazirla();

    const engel = await engelliMi(ip, hwid, anahtar);
    if (engel) {
      await sizmaKaydet({ ip, sebep: 'engelli', ayrinti: 'engel: ' + engel });
      return yanit({ ok: false, sebep: 'engelli', kalan_sn: 0 });
    }

    const { rows } = await sql`SELECT * FROM lisanslar WHERE anahtar = ${anahtar} LIMIT 1`;
    const l = rows[0];
    if (!l) {
      await kaydet('gecersiz');
      return yanit({ ok: false, sebep: 'gecersiz', kalan_sn: 0 });
    }
    if (l.iptal) {
      await kaydet('iptal', l.musteri || '');
      return yanit({ ok: false, sebep: 'iptal', kalan_sn: 0 });
    }

    // --- Ilk kullanim: sure SIMDI baslar ---
    let bitis = l.bitis ? new Date(l.bitis) : null;
    if (!l.aktivasyon) {
      const { rows: g } = await sql`
        UPDATE lisanslar
           SET aktivasyon = NOW(),
               bitis = NOW() + (${l.sure_saat} || ' hours')::interval
         WHERE id = ${l.id} AND aktivasyon IS NULL
        RETURNING bitis`;
      if (g[0]) bitis = new Date(g[0].bitis);
      else {
        const { rows: t } = await sql`SELECT bitis FROM lisanslar WHERE id = ${l.id}`;
        bitis = new Date(t[0].bitis);
      }
    }

    const kalanSn = Math.floor((bitis.getTime() - Date.now()) / 1000);
    if (kalanSn <= 0) {
      await kaydet('suresi_doldu', l.musteri || '');
      return yanit({ ok: false, sebep: 'suresi_doldu', kalan_sn: 0 });
    }

    // --- Cihaz limiti ---
    const { rows: mevcut } = await sql`
      SELECT id FROM cihazlar WHERE lisans_id = ${l.id} AND hwid = ${hwid} LIMIT 1`;

    if (mevcut.length === 0) {
      const { rows: say } = await sql`
        SELECT COUNT(*)::int AS n FROM cihazlar WHERE lisans_id = ${l.id}`;
      if (say[0].n >= l.max_cihaz) {
        // Spoofer HWID'i degistirince ESKI kayit "olu" kalir ve limiti doldurur.
        // Cozum: UZUN SUREDIR (20 dk+) gorulmeyen = OFFLINE en eski cihazi geri
        // donustur. Boylece ayni PC tekrar sigar; ama HEPSI aktifse (gercekten
        // max_cihaz kadar es zamanli PC) reddedilir -> per-PC koruma bozulmaz.
        const { rows: olu } = await sql`
          SELECT id FROM cihazlar
           WHERE lisans_id = ${l.id} AND son < NOW() - INTERVAL '20 minutes'
           ORDER BY son ASC LIMIT 1`;
        if (olu.length) {
          await sql`DELETE FROM cihazlar WHERE id = ${olu[0].id}`;
        } else {
          await kaydet('cihaz_limiti', (l.musteri || '') + ' ' + say[0].n + '/' + l.max_cihaz);
          return yanit({
            ok: false,
            sebep: 'cihaz_limiti',
            kalan_sn: 0,
            max_cihaz: l.max_cihaz,
            cihaz_sayisi: say[0].n,
          });
        }
      }
      await sql`
        INSERT INTO cihazlar (lisans_id, hwid) VALUES (${l.id}, ${hwid})
        ON CONFLICT (lisans_id, hwid) DO NOTHING`;
    } else {
      await sql`UPDATE cihazlar SET son = NOW() WHERE id = ${mevcut[0].id}`;
    }

    await sql`UPDATE lisanslar SET son_gorulme = NOW() WHERE id = ${l.id}`;

    const { rows: say2 } = await sql`
      SELECT COUNT(*)::int AS n FROM cihazlar WHERE lisans_id = ${l.id}`;

    const bitisEpoch = Math.floor(bitis.getTime() / 1000);
    return yanit({
      ok: true,
      sebep: 'gecerli',
      kalan_sn: kalanSn,
      paket: l.paket,
      max_cihaz: l.max_cihaz,
      cihaz_sayisi: say2[0].n,
      bitis: bitisEpoch,
      jeton: lisansJetonu(anahtar, hwid, bitisEpoch),
      vk: process.env.K34_VARLIK_ANAHTARI || undefined,
      // Gunluk calisma limiti (saat). 0 = kapali. Bot acilis uyarisinda kullanir;
      // asil sayac /api/durum'da tutulur.
      gunluk_limit: Number.isFinite(Number(l.gunluk_limit_saat)) ? Number(l.gunluk_limit_saat) : 14,
      // (KULLANICI ISTEGI) Key hafta sonu kisitindan muaf mi? Bot bunu okuyup
      // muafsa hafta sonu kisitini uygulamaz.
      haftasonu_serbest: !!l.haftasonu_serbest,
    });
  } catch (e) {
    return yanit({ ok: false, sebep: 'hata', mesaj: String(e.message || e) }, 500);
  }
}
