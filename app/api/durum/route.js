import { NextResponse } from 'next/server';
import { sql, tablolariHazirla } from '@/lib/db';
import { lisansDogrula } from '@/lib/telegram';
import { limitHesapla } from '@/lib/limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KOMUT_OMUR_DK = 10; // bundan eski teslim edilmemis komut bota gonderilmez

/**
 * Bot her ~30 sn'de bir buraya kendi durumunu yollar.
 * POST { anahtar, hwid, pc, saat, bot: {calisiyor,...}, hesaplar: [ {...}, ... ] }
 * ->   { ok, komutlar: [ {id, tur, veri} ] }
 *
 * komutlar: Telegram'dan bu bilgisayara gonderilmis, henuz teslim edilmemis
 * istekler (or. "su karaktere gec"). Cevapta verilince teslim edilmis sayilir.
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

    const hwid = String(g.hwid).toUpperCase();
    const s = g.sira && typeof g.sira === 'object' ? g.sira : {};
    const saat = Number(g.saat);
    // Musterinin genel (dis) IP'si - admin panelinde "hangi key'de hangi IP".
    const ip = String(req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '')
      .split(',')[0].trim().slice(0, 45);
    const veri = {
      pc: String(g.pc || '').slice(0, 60),
      ip,
      bot: g.bot || {},
      hesaplar: Array.isArray(g.hesaplar) ? g.hesaplar.slice(0, 20) : [],
      // Botun kendi saati (epoch sn). VM saati kayabildigi icin Telegram'da
      // mutlak zamanlar bu farkla sunucu saatine cevrilir (lib/hesap.js).
      saat: Number.isFinite(saat) && saat > 0 ? saat : 0,
      // Sirali giris / mola / Metin+ reset bayraklari (bkz. lib/sira.js). Eski
      // botlar gondermez -> hepsi false -> siraya hic girmezler.
      sira: {
        mola_cikis: !!s.mola_cikis,
        mola_hazir: !!s.mola_hazir,
        reset: !!s.reset,
        reset_hazir: !!s.reset_hazir,
        giris: !!s.giris,
        giris_hazir: !!s.giris_hazir,
      },
      // HWID teshisi (hangi kaynaktan geldigi) - cift kayit arastirmasi icin.
      kimlik: g.kimlik && typeof g.kimlik === 'object'
        ? { kaynak: String(g.kimlik.kaynak || '').slice(0, 20) }
        : undefined,
    };

    await sql`
      INSERT INTO durumlar (lisans_id, hwid, veri, guncelleme)
      VALUES (${l.id}, ${hwid}, ${JSON.stringify(veri)}::jsonb, NOW())
      ON CONFLICT (lisans_id, hwid)
      DO UPDATE SET veri = EXCLUDED.veri, guncelleme = NOW()`;

    // --- Gunluk calisma limiti (16 saat aktif -> 8 saat dinlenme) ---
    // Key'e bagli, admin ayarlar. Sayac SUNUCUDA (kullanim tablosu) tutulur;
    // bot kapatilip acilinca sifirlanmaz.
    let limit = { aktif: false };
    try {
      const limitSaat = Number(l.gunluk_limit_saat);
      const { rows: kr } = await sql`
        SELECT donem_sn, dinlenme_bitis, guncelleme FROM kullanim
         WHERE lisans_id = ${l.id} AND hwid = ${hwid}`;
      const onceki = kr[0];
      const h = limitHesapla({
        donemSn: onceki ? onceki.donem_sn : 0,
        dinlenmeBitisMs: onceki && onceki.dinlenme_bitis ? new Date(onceki.dinlenme_bitis).getTime() : 0,
        guncellemeMs: onceki && onceki.guncelleme ? new Date(onceki.guncelleme).getTime() : 0,
        calisiyor: !!(g.bot && g.bot.calisiyor),
        nowMs: Date.now(),
        limitSaat: Number.isFinite(limitSaat) ? limitSaat : 16,
      });
      const dbBitis = h.dinlenmeBitisMs ? new Date(h.dinlenmeBitisMs).toISOString() : null;
      await sql`
        INSERT INTO kullanim (lisans_id, hwid, donem_sn, dinlenme_bitis, guncelleme)
        VALUES (${l.id}, ${hwid}, ${h.donemSn}, ${dbBitis}, NOW())
        ON CONFLICT (lisans_id, hwid)
        DO UPDATE SET donem_sn = ${h.donemSn}, dinlenme_bitis = ${dbBitis}, guncelleme = NOW()`;
      limit = {
        aktif: h.aktif,
        dinlen: h.dinlen,
        gunluk_sn: h.gunlukSn,
        limit_sn: h.limitSn,
        kalan_sn: h.kalanSn,
        dinlenme_kalan_sn: h.dinlenmeKalanSn,
      };
    } catch {
      limit = { aktif: false }; // limit hatasi durum gonderimini bozmasin
    }

    const { rows: komutlar } = await sql`
      SELECT id, tur, veri FROM komutlar
       WHERE lisans_id = ${l.id} AND hwid = ${hwid} AND teslim IS NULL
         AND olusturma > NOW() - (${KOMUT_OMUR_DK} || ' minutes')::interval
       ORDER BY id ASC LIMIT 5`;
    for (const k of komutlar) {
      await sql`UPDATE komutlar SET teslim = NOW() WHERE id = ${k.id}`;
    }

    return NextResponse.json({
      ok: true,
      komutlar: komutlar.map((k) => ({ id: k.id, tur: k.tur, veri: k.veri || {} })),
      limit,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, mesaj: String(e.message || e) }, { status: 500 });
  }
}
