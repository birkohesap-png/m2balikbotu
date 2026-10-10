import { NextResponse } from 'next/server';
import { sql, tablolariHazirla } from '@/lib/db';
import { lisansDogrula } from '@/lib/telegram';
import { havuzNormal, LISTE_SAYFA } from '@/lib/kodhavuz';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * ORTAK KOD DEPOSU - indirme. Bot son aldigi id'den sonrakileri ister (artimli).
 * POST { anahtar, hwid, havuz:'anadolu', son_id:0 }
 * ->   { ok, kodlar:[{id, kod, veri}], devam:bool }
 * Yalniz gecerli lisans (depo disariya acik degil).
 */
export async function POST(req) {
  let g;
  try { g = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  try {
    await tablolariHazirla();
    const l = await lisansDogrula(g.anahtar, g.hwid);
    if (!l) return NextResponse.json({ ok: false, sebep: 'gecersiz' }, { status: 401 });
    const havuz = havuzNormal(g.havuz);
    const son = Math.max(0, Math.floor(Number(g.son_id) || 0));
    const { rows } = await sql`
      SELECT id, kod, veri FROM kod_havuzu
       WHERE havuz = ${havuz} AND id > ${son}
       ORDER BY id ASC LIMIT ${LISTE_SAYFA}`;
    return NextResponse.json({ ok: true, kodlar: rows, devam: rows.length === LISTE_SAYFA });
  } catch (e) {
    return NextResponse.json({ ok: false, mesaj: String(e.message || e) }, { status: 500 });
  }
}
