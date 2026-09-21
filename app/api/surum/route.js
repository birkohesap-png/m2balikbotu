import { NextResponse } from 'next/server';
import { sql, tablolariHazirla } from '@/lib/db';
import { urunNormal } from '@/lib/urun';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const yanit = (o, kod = 200) =>
  NextResponse.json(o, { status: kod, headers: { 'Cache-Control': 'no-store' } });

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Botun acilista sordugu SURUM KONTROLU ucu.
 *
 * GET /api/surum?surum=2.1.0[&urun=pvp]
 * ->  { ok, urun, surum, notlar[], zorunlu, boyut, sha256, yayin }
 *
 * urun: 'tr' (varsayilan - eski/TR botlari gondermez) veya 'pvp'. Her urunun
 * KENDI aktif surumu doner; PvP botu cevapta "urun":"pvp" yoksa yok sayar.
 * Lisans istemez: bu yalnizca "yeni surum var mi" bilgisidir, dosya vermez.
 * Indirme adresi icin /api/indir kullanilir ve ORASI lisans ister.
 * Cevap kucuk tutulur (birkac yuz bayt) - bot acilisini yavaslatmasin.
 */
export async function GET(req) {
  let urun = 'tr';
  try {
    urun = urunNormal(new URL(req.url).searchParams.get('urun'));
  } catch {
    urun = 'tr';
  }
  try {
    await tablolariHazirla();
    const { rows } = await sql`
      SELECT surum, notlar, zorunlu, sha256, boyut, yayin
        FROM surumler
       WHERE aktif = TRUE AND varlik_id <> '' AND urun = ${urun}
       ORDER BY yayin DESC
       LIMIT 1`;

    const s = rows[0];
    if (!s) return yanit({ ok: false, urun, sebep: 'surum_yok' });

    return yanit({
      ok: true,
      urun,
      surum: s.surum,
      notlar: Array.isArray(s.notlar) ? s.notlar : [],
      zorunlu: !!s.zorunlu,
      sha256: s.sha256 || '',
      boyut: Number(s.boyut || 0),
      yayin: s.yayin,
    });
  } catch {
    // Veritabani/kurulum sorununda bot etkilenmesin.
    return yanit({ ok: false, urun, sebep: 'hata' });
  }
}
