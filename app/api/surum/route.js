import { NextResponse } from 'next/server';
import { sql, tablolariHazirla } from '@/lib/db';

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
 * GET /api/surum?surum=2.1.0
 * ->  { ok, surum, notlar[], zorunlu, boyut, sha256, yayin }
 *
 * Lisans istemez: bu yalnizca "yeni surum var mi" bilgisidir, dosya vermez.
 * Indirme adresi icin /api/indir kullanilir ve ORASI lisans ister.
 * Cevap kucuk tutulur (birkac yuz bayt) - bot acilisini yavaslatmasin.
 */
export async function GET() {
  try {
    await tablolariHazirla();
    const { rows } = await sql`
      SELECT surum, notlar, zorunlu, sha256, boyut, yayin
        FROM surumler
       WHERE aktif = TRUE AND varlik_id <> ''
       ORDER BY yayin DESC
       LIMIT 1`;

    const s = rows[0];
    if (!s) return yanit({ ok: false, sebep: 'surum_yok' });

    return yanit({
      ok: true,
      surum: s.surum,
      notlar: Array.isArray(s.notlar) ? s.notlar : [],
      zorunlu: !!s.zorunlu,
      sha256: s.sha256 || '',
      boyut: Number(s.boyut || 0),
      yayin: s.yayin,
    });
  } catch {
    // Veritabani/kurulum sorununda bot etkilenmesin.
    return yanit({ ok: false, sebep: 'hata' });
  }
}
