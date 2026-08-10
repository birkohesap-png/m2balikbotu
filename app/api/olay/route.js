import { NextResponse } from 'next/server';
import { tablolariHazirla } from '@/lib/db';
import { lisansDogrula, lisansaBildir } from '@/lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BASLIK = {
  pm: '💬 <b>Özel mesaj geldi</b>',
  dc: '⚠️ <b>Bağlantı koptu (DC)</b>',
  durdu: '⏹ <b>Bot durdu</b>',
  basladi: '✅ <b>Bot başladı</b>',
  pisirme: '🔥 <b>Pişirme tamamlandı</b>',
  envanter: '📦 <b>Envanter doldu</b>',
  yapboz: '🧩 <b>Yapboz tamamlandı</b>',
  uyari: '⚠️ <b>Uyarı</b>',
};

/**
 * Bot onemli bir olay olunca buraya yollar; sunucu da Telegram'a bildirir.
 * POST { anahtar, hwid, tur, hesap?, gonderen?, mesaj? }
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

    const tur = String(g.tur || 'uyari');
    const kacis = (t) =>
      String(t || '').slice(0, 400).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    let metin = BASLIK[tur] || BASLIK.uyari;
    if (g.hesap) metin += `\n👤 <b>${kacis(g.hesap)}</b>`;
    if (tur === 'pm') {
      metin += `\n\n<b>${kacis(g.gonderen || 'Bilinmeyen')}</b> yazdı:\n<i>${kacis(g.mesaj)}</i>`;
    } else if (g.mesaj) {
      metin += `\n${kacis(g.mesaj)}`;
    }

    const kisi = await lisansaBildir(l.id, metin);
    return NextResponse.json({ ok: true, gonderilen: kisi });
  } catch (e) {
    return NextResponse.json({ ok: false, mesaj: String(e.message || e) }, { status: 500 });
  }
}
