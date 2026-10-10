import { NextResponse } from 'next/server';
import { sql, tablolariHazirla } from '@/lib/db';
import { lisansDogrula } from '@/lib/telegram';
import { havuzNormal, topluDogrula, GUNLUK_LISANS_MAX } from '@/lib/kodhavuz';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * ORTAK KOD DEPOSU - yukleme. Bot, oyunun KABUL ettigi (panel kapandi) kodu yollar.
 * POST { anahtar, hwid, havuz:'anadolu', sunucu?, kodlar:[{kod:'47', veri:<base64 3600 bayt>}] }
 * ->   { ok, eklenen, zaten, gecersiz }
 * Ayni resim (sha256) bir kez tutulur; ilk gelen kod gecerlidir.
 */
export async function POST(req) {
  let g;
  try { g = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  try {
    await tablolariHazirla();
    const l = await lisansDogrula(g.anahtar, g.hwid);
    if (!l) return NextResponse.json({ ok: false, sebep: 'gecersiz' }, { status: 401 });
    const havuz = havuzNormal(g.havuz);
    const sunucu = String(g.sunucu || '').slice(0, 20);
    const { iyi, kotu } = topluDogrula(g.kodlar);
    if (!iyi.length) return NextResponse.json({ ok: true, eklenen: 0, zaten: 0, gecersiz: kotu });

    const { rows: say } = await sql`
      SELECT COUNT(*)::int AS n FROM kod_havuzu
       WHERE lisans_id = ${l.id} AND zaman > NOW() - INTERVAL '1 day'`;
    if (say[0].n + iyi.length > GUNLUK_LISANS_MAX) {
      return NextResponse.json({ ok: false, sebep: 'gunluk_sinir' }, { status: 429 });
    }
    let eklenen = 0;
    for (const k of iyi) {
      const { rowCount } = await sql`
        INSERT INTO kod_havuzu (havuz, kod, veri, ozet, lisans_id, sunucu)
        VALUES (${havuz}, ${k.kod}, ${k.buf.toString('base64')}, ${k.ozet}, ${l.id}, ${sunucu})
        ON CONFLICT (havuz, ozet) DO NOTHING`;
      eklenen += rowCount || 0;
    }
    return NextResponse.json({ ok: true, eklenen, zaten: iyi.length - eklenen, gecersiz: kotu });
  } catch (e) {
    return NextResponse.json({ ok: false, mesaj: String(e.message || e) }, { status: 500 });
  }
}
