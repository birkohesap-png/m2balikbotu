import { NextResponse } from 'next/server';
import { sql, tablolariHazirla } from '@/lib/db';
import { lisansDogrula, lisansaBildir } from '@/lib/telegram';
import { karar, adayYap, durumuDuzelt, olayMetni } from '@/lib/sira';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const yanit = (o, kod = 200) =>
  NextResponse.json(o, { status: kod, headers: { 'Cache-Control': 'no-store' } });

/**
 * Ayni key'deki bilgisayarlarin cikis/giris sirasi (bkz. lib/sira.js).
 * POST { anahtar, hwid, tur: 'mola'|'reset', tip: 'sor'|'bitti'|'iptal', ad?, sure_sn? }
 * ->   { ok, izin, sebep, sira_no?, toplam?, bekle_sn?, siradaki?, kim? }
 *
 * Iki bilgisayar ayni anda sorarsa ikisine birden izin cikmasin diye yazma
 * SURUM kontrolluyle yapilir; cakisan istek yeniden hesaplanir.
 */
export async function POST(req) {
  let g;
  try {
    g = await req.json();
  } catch {
    return yanit({ ok: false }, 400);
  }

  try {
    await tablolariHazirla();
    const l = await lisansDogrula(g.anahtar, g.hwid);
    if (!l) return yanit({ ok: false, sebep: 'gecersiz' }, 401);

    const istek = {
      hwid: String(g.hwid).toUpperCase(),
      tur: g.tur,
      tip: g.tip,
      ad: g.ad,
      sure_sn: g.sure_sn,
    };

    for (let deneme = 0; deneme < 5; deneme++) {
      await sql`INSERT INTO siralar (lisans_id) VALUES (${l.id}) ON CONFLICT (lisans_id) DO NOTHING`;
      const { rows: s } = await sql`SELECT veri, surum FROM siralar WHERE lisans_id = ${l.id}`;
      const { rows: dr } = await sql`
        SELECT hwid, veri, EXTRACT(EPOCH FROM (NOW() - guncelleme)) AS yas
          FROM durumlar WHERE lisans_id = ${l.id} ORDER BY id ASC`;
      const eski = s[0];

      const sonuc = karar({ durum: eski.veri, adaylar: dr.map(adayYap), istek, simdi: Date.now() });
      const yeniJson = JSON.stringify(sonuc.durum);

      if (yeniJson !== JSON.stringify(durumuDuzelt(eski.veri))) {
        const { rows: u } = await sql`
          UPDATE siralar
             SET veri = ${yeniJson}::jsonb, surum = surum + 1, guncelleme = NOW()
           WHERE lisans_id = ${l.id} AND surum = ${eski.surum}
          RETURNING surum`;
        if (!u.length) continue; // baska bir bilgisayar ayni anda yazdi - yeniden hesapla
      }

      for (const o of sonuc.olaylar) {
        try {
          await lisansaBildir(l.id, olayMetni(o));
        } catch {
          // bildirim gitmese de sira islemeye devam etmeli
        }
      }
      return yanit({ ok: true, ...sonuc.cevap });
    }
    return yanit({ ok: true, izin: false, sebep: 'mesgul', bekle_sn: 5 });
  } catch (e) {
    return yanit({ ok: false, mesaj: String(e.message || e) }, 500);
  }
}
