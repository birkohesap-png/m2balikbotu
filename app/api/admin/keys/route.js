import { NextResponse } from 'next/server';
import { sql, tablolariHazirla } from '@/lib/db';
import { adminMi, anahtarUret } from '@/lib/auth';
import { PAKET_MAP } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const yasak = () => NextResponse.json({ ok: false, mesaj: 'Yetkisiz' }, { status: 401 });

/** Anahtar listesi + cihaz bilgileri */
export async function GET(req) {
  if (!(await adminMi())) return yasak();
  await tablolariHazirla();

  const ara = (new URL(req.url).searchParams.get('ara') || '').trim().toUpperCase();
  const { rows } = ara
    ? await sql`
        SELECT l.*,
               (SELECT COUNT(*)::int FROM cihazlar c WHERE c.lisans_id = l.id) AS cihaz_sayisi
          FROM lisanslar l
         WHERE l.anahtar LIKE ${'%' + ara + '%'} OR UPPER(l.musteri) LIKE ${'%' + ara + '%'}
         ORDER BY l.id DESC LIMIT 300`
    : await sql`
        SELECT l.*,
               (SELECT COUNT(*)::int FROM cihazlar c WHERE c.lisans_id = l.id) AS cihaz_sayisi
          FROM lisanslar l
         ORDER BY l.id DESC LIMIT 300`;

  const { rows: ist } = await sql`
    SELECT
      COUNT(*)::int AS toplam,
      COUNT(*) FILTER (WHERE iptal)::int AS iptal,
      COUNT(*) FILTER (WHERE NOT iptal AND aktivasyon IS NULL)::int AS bekleyen,
      COUNT(*) FILTER (WHERE NOT iptal AND bitis > NOW())::int AS aktif
    FROM lisanslar`;

  return NextResponse.json({ ok: true, liste: rows, ist: ist[0] });
}

/** Yeni anahtar(lar) uret */
export async function POST(req) {
  if (!(await adminMi())) return yasak();
  await tablolariHazirla();

  let g = {};
  try {
    g = await req.json();
  } catch {}

  const paket = PAKET_MAP[g.paket] ? g.paket : 'gunluk';
  const p = PAKET_MAP[paket];
  const adet = Math.max(1, Math.min(50, parseInt(g.adet, 10) || 1));
  const musteri = String(g.musteri || '').slice(0, 120);
  const aciklama = String(g.aciklama || '').slice(0, 300);
  // Istege bagli elle ayar (bos ise pakete gore)
  const cihaz = Math.max(1, Math.min(64, parseInt(g.max_cihaz, 10) || p.cihaz));
  const saat = Math.max(1, Math.min(24 * 400, parseInt(g.sure_saat, 10) || p.saat));

  const uretilen = [];
  for (let i = 0; i < adet; i++) {
    const a = anahtarUret();
    await sql`
      INSERT INTO lisanslar (anahtar, paket, max_cihaz, sure_saat, musteri, aciklama)
      VALUES (${a}, ${paket}, ${cihaz}, ${saat}, ${musteri}, ${aciklama})`;
    uretilen.push(a);
  }
  return NextResponse.json({ ok: true, anahtarlar: uretilen });
}
