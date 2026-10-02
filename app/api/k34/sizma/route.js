import { NextResponse } from 'next/server';
import { sql, tablolariHazirla } from '@/lib/db';
import { adminMi } from '@/lib/auth';
import { engelDegeriTemizle, supheliMi, ipMusteriHaritasi } from '@/lib/sizma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const yasak = () => NextResponse.json({ ok: false, mesaj: 'Yetkisiz' }, { status: 401 });

/**
 * Sizma girisimleri: IP bazli ozet + son kayitlar + engel listesi.
 * 30 gunden eski kayitlar burada budanir (tablo sismesin).
 */
export async function GET() {
  if (!(await adminMi())) return yasak();
  await tablolariHazirla();

  await sql`DELETE FROM sizma WHERE son < NOW() - INTERVAL '30 days'`;

  const { rows: ozet } = await sql`
    SELECT ip,
           SUM(adet)::int AS toplam,
           COUNT(DISTINCT NULLIF(NULLIF(anahtar, ''), '*'))::int AS farkli_anahtar,
           COUNT(DISTINCT NULLIF(NULLIF(hwid, ''), '*'))::int AS farkli_hwid,
           BOOL_OR(sebep = 'sahte_modul') AS kalkan,
           ARRAY_AGG(DISTINCT sebep) AS sebepler,
           MAX(son) AS son
      FROM sizma
     GROUP BY ip
     ORDER BY BOOL_OR(sebep = 'sahte_modul') DESC, MAX(son) DESC
     LIMIT 100`;

  const { rows: kayitlar } = await sql`
    SELECT id, ip, sebep, anahtar, hwid, ayrinti, adet, ilk, son
      FROM sizma ORDER BY son DESC LIMIT 300`;

  const { rows: engeller } = await sql`SELECT * FROM engelliler ORDER BY zaman DESC`;

  // Son 3 gunde bot calistiran musterilerin IP'leri (durumlar.veri.ip).
  const { rows: musteriIp } = await sql`
    SELECT d.veri->>'ip' AS ip, COALESCE(NULLIF(l.musteri, ''), l.anahtar) AS kim
      FROM durumlar d JOIN lisanslar l ON l.id = d.lisans_id
     WHERE d.guncelleme > NOW() - INTERVAL '3 days'`;
  const harita = ipMusteriHaritasi(musteriIp);

  return NextResponse.json({
    ok: true,
    ozet: ozet.map((o) => ({ ...o, supheli: supheliMi(o), musteriler: harita[o.ip] || [] })),
    kayitlar,
    engeller,
  });
}

/**
 * { islem: 'engelle', tur: 'ip'|'hwid'|'anahtar', deger, aciklama }
 * { islem: 'kaldir', id }          -> engeli kaldir
 * { islem: 'kayitSil', ip }        -> o IP'nin kayitlarini sil
 * { islem: 'temizle' }             -> tum sizma kayitlarini sil (engeller kalir)
 */
export async function POST(req) {
  if (!(await adminMi())) return yasak();
  await tablolariHazirla();

  let g = {};
  try {
    g = await req.json();
  } catch {}

  switch (g.islem) {
    case 'engelle': {
      const t = engelDegeriTemizle(g.tur, g.deger);
      if (!t.ok) return NextResponse.json({ ok: false, mesaj: t.mesaj }, { status: 400 });
      await sql`
        INSERT INTO engelliler (tur, deger, aciklama)
        VALUES (${t.tur}, ${t.deger}, ${String(g.aciklama || '').slice(0, 200)})
        ON CONFLICT (tur, deger) DO NOTHING`;
      return NextResponse.json({ ok: true, mesaj: t.tur.toUpperCase() + ' engellendi: ' + t.deger });
    }
    case 'kaldir': {
      const id = parseInt(g.id, 10);
      if (!Number.isFinite(id)) return NextResponse.json({ ok: false, mesaj: 'Geçersiz id' }, { status: 400 });
      await sql`DELETE FROM engelliler WHERE id = ${id}`;
      return NextResponse.json({ ok: true, mesaj: 'Engel kaldırıldı' });
    }
    case 'kayitSil':
      await sql`DELETE FROM sizma WHERE ip = ${String(g.ip || '').slice(0, 64)}`;
      return NextResponse.json({ ok: true, mesaj: 'Kayıtlar silindi' });
    case 'temizle':
      await sql`DELETE FROM sizma`;
      return NextResponse.json({ ok: true, mesaj: 'Tüm sızma kayıtları silindi' });
    default:
      return NextResponse.json({ ok: false, mesaj: 'Bilinmeyen işlem' }, { status: 400 });
  }
}
