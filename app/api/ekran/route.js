import { NextResponse } from 'next/server';
import { sql, tablolariHazirla } from '@/lib/db';
import { lisansDogrula, fotoGonder } from '@/lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Bot, Telegram'dan gelen "ekran goruntusu" komutunu isleyince cektigi resmi
 * buraya yollar; sunucu da resmi isteyen kullaniciya Telegram'dan gonderir.
 *
 * POST { anahtar, hwid, chat_id, resim (base64 / dataURI), pc? }
 *
 * Guvenlik: chat_id, BU lisansa bagli bir Telegram kullanicisi olmali - boylece
 * gecerli bir bot bile rastgele kisilere resim yollayamaz.
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

    const hwid = String(g.hwid || '').toUpperCase();
    const chatId = String(g.chat_id || '');
    const hedef = String(g.hedef || '');

    // Base64 / dataURI coz
    let b64 = String(g.resim || '');
    const virgul = b64.indexOf(',');
    if (b64.startsWith('data:') && virgul > 0) b64 = b64.slice(virgul + 1);
    if (!b64) return NextResponse.json({ ok: false, sebep: 'resim_yok' }, { status: 400 });
    const buf = Buffer.from(b64, 'base64');
    if (!buf.length || buf.length > 10 * 1024 * 1024) {
      return NextResponse.json({ ok: false, sebep: 'boyut' }, { status: 400 });
    }
    const pc = String(g.pc || '').slice(0, 60);

    // ADMIN PANELI hedefi: goruntu Telegram'a degil, admin_ekran tablosuna yazilir.
    if (!chatId && hedef === 'admin') {
      await sql`
        INSERT INTO admin_ekran (lisans_id, hwid, resim, zaman)
        VALUES (${l.id}, ${hwid}, ${'data:image/jpeg;base64,' + b64}, NOW())
        ON CONFLICT (lisans_id, hwid)
        DO UPDATE SET resim = EXCLUDED.resim, zaman = NOW()`;
      return NextResponse.json({ ok: true });
    }

    if (!chatId) return NextResponse.json({ ok: false, sebep: 'chat_yok' }, { status: 400 });
    // chat_id gercekten bu lisansa bagli mi? (rastgele kisiye resim yollanmasin)
    const { rows } = await sql`
      SELECT 1 FROM tg_baglar WHERE chat_id = ${chatId} AND lisans_id = ${l.id} LIMIT 1`;
    if (!rows.length) return NextResponse.json({ ok: false, sebep: 'yetkisiz' }, { status: 403 });

    const saat = new Date().toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
    const r = await fotoGonder(chatId, buf, `📸 <b>${pc || 'PC'}</b> · ${saat}`);
    return NextResponse.json({ ok: !!(r && r.ok) });
  } catch (e) {
    return NextResponse.json({ ok: false, mesaj: String(e.message || e) }, { status: 500 });
  }
}
