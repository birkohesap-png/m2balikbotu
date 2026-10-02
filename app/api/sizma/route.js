import { NextResponse } from 'next/server';
import { tablolariHazirla, sizmaKaydet } from '@/lib/db';
import { ipAl, KALKAN_SEBEPLERI } from '@/lib/sizma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const yanit = (o, kod = 200) =>
  NextResponse.json(o, { status: kod, headers: { 'Cache-Control': 'no-store' } });

/**
 * KALKAN IHLAL BILDIRIMI (bot -> sunucu).
 * POST { sebep: 'sahte_modul', ayrinti, hwid, iz, pc }
 *
 * Botun derlenmis pega_kalkan modulu sys.modules'te SAHTE pega_key/lisans
 * yakalayinca (Eyl 2026 kirma yontemi) buraya bir kez haber verir. Kayit,
 * istegin IP'siyle panelde "Sizma Girisimleri" altinda gorunur; admin oradan
 * IP/HWID engeller ve o makine artik /api/check'ten vk alamaz.
 *
 * Kimlik dogrulama YOK (sahte modullu surec anahtar veremez). Bu yuzden:
 * sebep beyaz listede, tum alanlar kirpilir, cevapta hicbir veri donmez ve
 * kayit IP basina sinirli (lib/db.js sizmaKaydet). Sahte bildirim en fazla
 * panele bir satir ekler; engel karari her zaman admindedir.
 */
export async function POST(req) {
  let g = {};
  try {
    g = await req.json();
  } catch {
    return yanit({ ok: false }, 400);
  }
  const sebep = String(g.sebep || '');
  if (!KALKAN_SEBEPLERI.includes(sebep)) return yanit({ ok: false }, 400);

  const temiz = (v, n) => String(v || '').replace(/[\r\n\t]/g, ' ').trim().slice(0, n);
  const hwid = temiz(g.hwid, 64).toUpperCase();
  const ayrinti = [
    temiz(g.pc, 40) && 'PC: ' + temiz(g.pc, 40),
    temiz(g.iz, 32) && 'iz: ' + temiz(g.iz, 32),
    temiz(g.ayrinti, 160),
  ]
    .filter(Boolean)
    .join(' | ');

  try {
    await tablolariHazirla();
    await sizmaKaydet({ ip: ipAl(req.headers), sebep, hwid, ayrinti });
  } catch {
    /* bildirim kritik degil */
  }
  return yanit({ ok: true });
}
