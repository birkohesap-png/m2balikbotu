import { NextResponse } from 'next/server';
import { sql, tablolariHazirla } from '@/lib/db';
import { adminMi } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin paneli: bir cihazdan istenen ekran goruntusunu okur.
 * Once keys/[id] PATCH 'ekranIste' ile komut birakilir; bot goruntuyu
 * /api/ekran'a yollayinca admin_ekran'a duser; panel burayi kisa araliklarla
 * yoklar. GET /api/k34/ekran?id=<lisans_id>&hwid=<HWID>
 */
export async function GET(req) {
  if (!(await adminMi())) {
    return NextResponse.json({ ok: false, mesaj: 'Yetkisiz' }, { status: 401 });
  }
  await tablolariHazirla();
  const u = new URL(req.url);
  const id = u.searchParams.get('id');
  const hwid = String(u.searchParams.get('hwid') || '');
  if (!id || !hwid) {
    return NextResponse.json({ ok: false, mesaj: 'id ve hwid gerekli' }, { status: 400 });
  }
  const { rows } = await sql`
    SELECT resim, EXTRACT(EPOCH FROM (NOW() - zaman)) AS yas
      FROM admin_ekran WHERE lisans_id = ${id} AND hwid = ${hwid} LIMIT 1`;
  if (!rows.length) return NextResponse.json({ ok: true, hazir: false });
  return NextResponse.json({ ok: true, hazir: true, resim: rows[0].resim, yas: Number(rows[0].yas) });
}
