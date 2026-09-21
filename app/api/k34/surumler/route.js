import { NextResponse } from 'next/server';
import { sql, tablolariHazirla } from '@/lib/db';
import { adminMi } from '@/lib/auth';
import { sonYayinVarliklari } from '@/lib/github';
import { urunNormal } from '@/lib/urun';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const yanit = (o, kod = 200) =>
  NextResponse.json(o, { status: kod, headers: { 'Cache-Control': 'no-store' } });
const yasak = () => yanit({ ok: false, mesaj: 'Yetkisiz' }, 401);

/** Panel: surum listesi + GitHub'daki yuklu dosyalar. */
export async function GET() {
  if (!(await adminMi())) return yasak();
  await tablolariHazirla();

  const { rows } = await sql`SELECT * FROM surumler ORDER BY yayin DESC LIMIT 50`;

  let varliklar = [];
  let ghHata = '';
  try {
    varliklar = await sonYayinVarliklari();
  } catch (e) {
    ghHata = String(e.message || e);
  }

  return yanit({ ok: true, surumler: rows, varliklar, ghHata });
}

/** Panel: yeni surum yayinla. */
export async function POST(req) {
  if (!(await adminMi())) return yasak();

  let g;
  try {
    g = await req.json();
  } catch {
    return yanit({ ok: false, mesaj: 'Gecersiz istek' }, 400);
  }

  const surum = String(g.surum || '').trim();
  const varlikId = String(g.varlik_id || '').trim();
  const sha256 = String(g.sha256 || '').trim().toLowerCase();

  if (!/^\d+\.\d+(\.\d+)?$/.test(surum)) {
    return yanit({ ok: false, mesaj: 'Surum "2.2" veya "2.2.1" biciminde olmali' }, 400);
  }
  if (!varlikId) return yanit({ ok: false, mesaj: 'GitHub dosyasi secilmedi' }, 400);
  if (sha256 && !/^[0-9a-f]{64}$/.test(sha256)) {
    return yanit({ ok: false, mesaj: 'SHA-256 64 karakterlik hex olmali' }, 400);
  }

  const notlar = (Array.isArray(g.notlar) ? g.notlar : String(g.notlar || '').split('\n'))
    .map((x) => String(x).trim())
    .filter(Boolean)
    .slice(0, 20);

  // URUN AYRIMI: 'tr' (K34) veya 'pvp' (K34 PvP). Her urunun KENDI tek aktif
  // surumu olur; birini yayinlamak digerinin musterilerini ETKILEMEZ.
  const urun = urunNormal(g.urun);

  try {
    await tablolariHazirla();
    // Yeni surum BU URUNDE tek "aktif" olsun; bu urunun eskileri pasife cekilir.
    await sql`UPDATE surumler SET aktif = FALSE WHERE urun = ${urun}`;
    await sql`
      INSERT INTO surumler (urun, surum, notlar, zorunlu, sha256, boyut, varlik_id, aktif)
      VALUES (${urun}, ${surum}, ${JSON.stringify(notlar)}::jsonb, ${!!g.zorunlu},
              ${sha256}, ${Number(g.boyut || 0)}, ${varlikId}, TRUE)
      ON CONFLICT (urun, surum) DO UPDATE SET
        notlar = EXCLUDED.notlar, zorunlu = EXCLUDED.zorunlu,
        sha256 = EXCLUDED.sha256, boyut = EXCLUDED.boyut,
        varlik_id = EXCLUDED.varlik_id, aktif = TRUE, yayin = NOW()`;
    return yanit({ ok: true });
  } catch (e) {
    return yanit({ ok: false, mesaj: String(e.message || e) }, 500);
  }
}

/** Panel: surumu yayindan kaldir / geri al. */
export async function PATCH(req) {
  if (!(await adminMi())) return yasak();

  let g;
  try {
    g = await req.json();
  } catch {
    return yanit({ ok: false, mesaj: 'Gecersiz istek' }, 400);
  }

  const id = Number(g.id || 0);
  if (!id) return yanit({ ok: false, mesaj: 'id gerekli' }, 400);

  try {
    await tablolariHazirla();
    if (g.aktif) {
      // Yalnizca AYNI URUNUN diger surumleri pasife cekilir (TR'yi yayina
      // almak PvP'nin aktif surumunu kapatmasin, tersi de).
      await sql`UPDATE surumler SET aktif = FALSE
                 WHERE urun = (SELECT urun FROM surumler WHERE id = ${id})`;
      await sql`UPDATE surumler SET aktif = TRUE WHERE id = ${id}`;
    } else {
      await sql`UPDATE surumler SET aktif = FALSE WHERE id = ${id}`;
    }
    return yanit({ ok: true });
  } catch (e) {
    return yanit({ ok: false, mesaj: String(e.message || e) }, 500);
  }
}
