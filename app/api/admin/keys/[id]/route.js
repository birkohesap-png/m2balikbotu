import { NextResponse } from 'next/server';
import { sql, tablolariHazirla } from '@/lib/db';
import { adminMi } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const yasak = () => NextResponse.json({ ok: false, mesaj: 'Yetkisiz' }, { status: 401 });

/** Tek anahtarin detayi (bagli cihazlar) */
export async function GET(req, { params }) {
  if (!(await adminMi())) return yasak();
  await tablolariHazirla();
  const { id } = await params;
  const { rows } = await sql`SELECT * FROM lisanslar WHERE id = ${id}`;
  const { rows: cihazlar } = await sql`
    SELECT * FROM cihazlar WHERE lisans_id = ${id} ORDER BY ilk ASC`;
  return NextResponse.json({ ok: true, lisans: rows[0] || null, cihazlar });
}

/**
 * islem: iptal | geriAl | uzat (saat) | cihazSifirla | cihazSil (hwid) | duzenle
 */
export async function PATCH(req, { params }) {
  if (!(await adminMi())) return yasak();
  await tablolariHazirla();
  const { id } = await params;

  let g = {};
  try {
    g = await req.json();
  } catch {}

  switch (g.islem) {
    case 'iptal':
      await sql`UPDATE lisanslar SET iptal = TRUE WHERE id = ${id}`;
      break;
    case 'geriAl':
      await sql`UPDATE lisanslar SET iptal = FALSE WHERE id = ${id}`;
      break;
    case 'uzat': {
      const saat = Math.max(1, Math.min(24 * 400, parseInt(g.saat, 10) || 24));
      await sql`
        UPDATE lisanslar
           SET bitis = COALESCE(GREATEST(bitis, NOW()), NOW()) + (${saat} || ' hours')::interval,
               sure_saat = sure_saat + ${saat}
         WHERE id = ${id}`;
      break;
    }
    case 'cihazSifirla':
      await sql`DELETE FROM cihazlar WHERE lisans_id = ${id}`;
      break;
    case 'cihazSil':
      await sql`DELETE FROM cihazlar WHERE lisans_id = ${id} AND hwid = ${String(g.hwid || '')}`;
      break;
    case 'duzenle': {
      const cihaz = Math.max(1, Math.min(64, parseInt(g.max_cihaz, 10) || 1));
      await sql`
        UPDATE lisanslar
           SET musteri = ${String(g.musteri || '').slice(0, 120)},
               max_cihaz = ${cihaz}
         WHERE id = ${id}`;
      break;
    }
    default:
      return NextResponse.json({ ok: false, mesaj: 'Bilinmeyen işlem' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  if (!(await adminMi())) return yasak();
  await tablolariHazirla();
  const { id } = await params;
  await sql`DELETE FROM lisanslar WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
