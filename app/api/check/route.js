import { NextResponse } from 'next/server';
import { sql, tablolariHazirla } from '@/lib/db';
import { lisansJetonu } from '@/lib/auth';

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
 * ->   { ok, sebep, kalan_sn, paket, max_cihaz, cihaz_sayisi, jeton }
 *
 * sebep: gecerli | gecersiz | iptal | suresi_doldu | cihaz_limiti | hata
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

  try {
    await tablolariHazirla();

    const { rows } = await sql`SELECT * FROM lisanslar WHERE anahtar = ${anahtar} LIMIT 1`;
    const l = rows[0];
    if (!l) return yanit({ ok: false, sebep: 'gecersiz', kalan_sn: 0 });
    if (l.iptal) return yanit({ ok: false, sebep: 'iptal', kalan_sn: 0 });

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
    if (kalanSn <= 0) return yanit({ ok: false, sebep: 'suresi_doldu', kalan_sn: 0 });

    // --- Cihaz limiti ---
    const { rows: mevcut } = await sql`
      SELECT id FROM cihazlar WHERE lisans_id = ${l.id} AND hwid = ${hwid} LIMIT 1`;

    if (mevcut.length === 0) {
      const { rows: say } = await sql`
        SELECT COUNT(*)::int AS n FROM cihazlar WHERE lisans_id = ${l.id}`;
      if (say[0].n >= l.max_cihaz) {
        return yanit({
          ok: false,
          sebep: 'cihaz_limiti',
          kalan_sn: 0,
          max_cihaz: l.max_cihaz,
          cihaz_sayisi: say[0].n,
        });
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
    });
  } catch (e) {
    return yanit({ ok: false, sebep: 'hata', mesaj: String(e.message || e) }, 500);
  }
}
