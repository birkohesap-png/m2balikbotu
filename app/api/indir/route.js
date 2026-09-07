import { NextResponse } from 'next/server';
import { sql, tablolariHazirla, lisansGecerliMi } from '@/lib/db';
import { varlikAdresi } from '@/lib/github';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const yanit = (o, kod = 200) =>
  NextResponse.json(o, { status: kod, headers: { 'Cache-Control': 'no-store' } });

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

// Ayni anahtarin indirme adresini surekli istemesini engelle (kaba kuvvet/sizinti).
const istekler = new Map();
const PENCERE = 10 * 60 * 1000;
const AZAMI = 6;

function hizSinirAsildi(anahtar) {
  const simdi = Date.now();
  const k = istekler.get(anahtar);
  if (!k || simdi - k.t > PENCERE) {
    istekler.set(anahtar, { n: 1, t: simdi });
    return false;
  }
  k.n += 1;
  return k.n > AZAMI;
}

/**
 * Guncelleme dosyasi icin KISA OMURLU indirme adresi verir.
 *
 * POST { anahtar, hwid, surum? }
 * ->   { ok, url, surum, sha256, boyut }
 *
 * Dosya OZEL bir GitHub deposunda durur; adres burada uretilir ve yalnizca
 * lisansi gecerli olan bota verilir. 142 MB dosya bu sunucudan GECMEZ,
 * bot dogrudan GitHub CDN'inden indirir.
 */
export async function POST(req) {
  let govde;
  try {
    govde = await req.json();
  } catch {
    return yanit({ ok: false, sebep: 'hata', mesaj: 'Gecersiz istek' }, 400);
  }

  const anahtar = String(govde.anahtar || '').trim().toUpperCase();
  if (!anahtar) return yanit({ ok: false, sebep: 'gecersiz', mesaj: 'Anahtar gerekli' }, 400);

  if (hizSinirAsildi(anahtar)) {
    return yanit({ ok: false, sebep: 'cok_istek', mesaj: 'Cok fazla deneme, sonra tekrar dene' }, 429);
  }

  try {
    await tablolariHazirla();

    const l = await lisansGecerliMi(anahtar);
    if (!l.ok) {
      return yanit({ ok: false, sebep: l.sebep, mesaj: 'Gecerli lisans bulunamadi' }, 403);
    }

    const { rows } = await sql`
      SELECT surum, sha256, boyut, varlik_id
        FROM surumler
       WHERE aktif = TRUE AND varlik_id <> ''
       ORDER BY yayin DESC
       LIMIT 1`;
    const s = rows[0];
    if (!s) return yanit({ ok: false, sebep: 'surum_yok', mesaj: 'Yayinlanmis surum yok' }, 404);

    const url = await varlikAdresi(s.varlik_id);
    return yanit({
      ok: true,
      url,
      surum: s.surum,
      sha256: s.sha256 || '',
      boyut: Number(s.boyut || 0),
    });
  } catch (e) {
    return yanit({ ok: false, sebep: 'hata', mesaj: String(e.message || e) }, 500);
  }
}
