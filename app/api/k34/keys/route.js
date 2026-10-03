import { NextResponse } from 'next/server';
import { sql, tablolariHazirla } from '@/lib/db';
import { adminMi, anahtarUret } from '@/lib/auth';
import { PAKET_MAP } from '@/lib/site';
import { lisansUrunNormal } from '@/lib/urun';

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
      COUNT(*) FILTER (WHERE NOT iptal AND bitis > NOW())::int AS aktif,
      COUNT(*) FILTER (WHERE urun = 'tr')::int AS tr,
      COUNT(*) FILTER (WHERE urun = 'pvp')::int AS pvp,
      COUNT(*) FILTER (WHERE urun = '')::int AS secilmemis,
      COUNT(*) FILTER (WHERE urun = '' AND son_urun <> '')::int AS atanabilir,
      COUNT(*) FILTER (WHERE haftasonu_serbest)::int AS haftasonu_serbest
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

  // (3 Eki 2026) Yeni anahtar MUTLAKA bir urune ait: 'tr' | 'pvp' (varsayilan tr).
  const urun = lisansUrunNormal(g.urun) || 'tr';

  const uretilen = [];
  for (let i = 0; i < adet; i++) {
    const a = anahtarUret();
    await sql`
      INSERT INTO lisanslar (anahtar, paket, max_cihaz, sure_saat, musteri, aciklama, urun)
      VALUES (${a}, ${paket}, ${cihaz}, ${saat}, ${musteri}, ${aciklama}, ${urun})`;
    uretilen.push(a);
  }
  return NextResponse.json({ ok: true, anahtarlar: uretilen, urun });
}

/**
 * TOPLU islemler (tum anahtarlar).
 * { islem: 'haftasonuHepsi', serbest: bool } -> tum anahtarlarda hafta sonu kisitini
 *                                               kaldir (true) / geri getir (false)
 * { islem: 'urunOtomatik' }                   -> secilmemis ('') anahtarlari EN SON
 *                                               goruldukleri botun urunune ata
 */
export async function PATCH(req) {
  if (!(await adminMi())) return yasak();
  await tablolariHazirla();

  let g = {};
  try {
    g = await req.json();
  } catch {}

  if (g.islem === 'haftasonuHepsi') {
    const serbest = !!g.serbest;
    const { rows } = await sql`UPDATE lisanslar SET haftasonu_serbest = ${serbest} RETURNING id`;
    return NextResponse.json({
      ok: true,
      mesaj: `${rows.length} anahtarda hafta sonu ${serbest ? 'SERBEST bırakıldı' : 'KISITLANDI'}`,
    });
  }
  if (g.islem === 'urunOtomatik') {
    const { rows } = await sql`
      UPDATE lisanslar SET urun = son_urun
       WHERE urun = '' AND son_urun IN ('tr', 'pvp') RETURNING id`;
    return NextResponse.json({ ok: true, mesaj: `${rows.length} anahtar son görüldüğü ürüne atandı` });
  }
  return NextResponse.json({ ok: false, mesaj: 'Bilinmeyen işlem' }, { status: 400 });
}
