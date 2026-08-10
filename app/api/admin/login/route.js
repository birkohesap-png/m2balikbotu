import { NextResponse } from 'next/server';
import { tokenUret, esitMi, ADMIN_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Kaba kuvvete karsi basit gecikme + IP basina deneme sayaci (in-memory)
const denemeler = new Map();

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'yerel';
  const d = denemeler.get(ip) || { n: 0, t: 0 };
  if (d.n >= 8 && Date.now() - d.t < 10 * 60 * 1000) {
    return NextResponse.json(
      { ok: false, mesaj: 'Çok fazla hatalı deneme. 10 dakika sonra tekrar dene.' },
      { status: 429 }
    );
  }

  let sifre = '';
  try {
    sifre = String((await req.json()).sifre || '');
  } catch {}

  const dogru = process.env.ADMIN_SIFRE || '';
  await new Promise((r) => setTimeout(r, 400)); // zamanlama saldirisini yavaslat

  if (!dogru || !esitMi(sifre, dogru)) {
    denemeler.set(ip, { n: d.n + 1, t: Date.now() });
    return NextResponse.json({ ok: false, mesaj: 'Şifre hatalı' }, { status: 401 });
  }

  denemeler.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, tokenUret(12), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 12 * 3600,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
