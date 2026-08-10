import { NextResponse } from 'next/server';
import { sql, tablolariHazirla } from '@/lib/db';
import { lisansDogrula } from '@/lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Bot her ~30 sn'de bir buraya kendi durumunu yollar.
 * POST { anahtar, hwid, pc, bot: {calisiyor,...}, hesaplar: [ {...}, ... ] }
 */
export async function POST(req) {
  let g;
  try {
    g = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await tablolariHazirla();
    const l = await lisansDogrula(g.anahtar, g.hwid);
    if (!l) return NextResponse.json({ ok: false, sebep: 'gecersiz' }, { status: 401 });

    const veri = {
      pc: String(g.pc || '').slice(0, 60),
      bot: g.bot || {},
      hesaplar: Array.isArray(g.hesaplar) ? g.hesaplar.slice(0, 20) : [],
    };

    await sql`
      INSERT INTO durumlar (lisans_id, hwid, veri, guncelleme)
      VALUES (${l.id}, ${String(g.hwid).toUpperCase()}, ${JSON.stringify(veri)}::jsonb, NOW())
      ON CONFLICT (lisans_id, hwid)
      DO UPDATE SET veri = EXCLUDED.veri, guncelleme = NOW()`;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, mesaj: String(e.message || e) }, { status: 500 });
  }
}
