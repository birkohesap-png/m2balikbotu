import { NextResponse } from 'next/server';
import { adminMi } from '@/lib/auth';
import { cagir } from '@/lib/telegram';
import { SITE } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const yanit = (o, kod = 200) =>
  NextResponse.json(o, { status: kod, headers: { 'Cache-Control': 'no-store' } });
const yasak = () => yanit({ ok: false, mesaj: 'Yetkisiz' }, 401);

const HEDEF = SITE.url + '/api/telegram';

/**
 * Telegram webhook durumu ve tamiri.
 *
 * Alan adi degistiginde webhook eski adreste kalir ve bot Telegram'dan
 * mesaj almayi biraktigi icin "telegram gitti" gorunur. Bu uc, sunucudaki
 * TELEGRAM_TOKEN'i kullanarak webhook'u dogru adrese yeniden kurar —
 * boylece token'i kimsenin elle tasimasi gerekmez.
 */
export async function GET() {
  if (!(await adminMi())) return yasak();

  if (!process.env.TELEGRAM_TOKEN) {
    return yanit({ ok: false, mesaj: 'TELEGRAM_TOKEN tanimli degil' });
  }

  const c = await cagir('getWebhookInfo', {});
  const b = c?.result || {};
  return yanit({
    ok: true,
    hedef: HEDEF,
    mevcut: b.url || '',
    dogruMu: b.url === HEDEF,
    gizliVar: !!process.env.TELEGRAM_WEBHOOK_GIZLI,
    bekleyen: b.pending_update_count ?? 0,
    sonHata: b.last_error_message || '',
    sonHataZamani: b.last_error_date
      ? new Date(b.last_error_date * 1000).toISOString()
      : '',
  });
}

/** Webhook'u bu sitenin adresine yeniden kurar. */
export async function POST() {
  if (!(await adminMi())) return yasak();

  if (!process.env.TELEGRAM_TOKEN) {
    return yanit({ ok: false, mesaj: 'TELEGRAM_TOKEN tanimli degil' }, 400);
  }

  const c = await cagir('setWebhook', {
    url: HEDEF,
    secret_token: process.env.TELEGRAM_WEBHOOK_GIZLI || undefined,
    allowed_updates: ['message', 'callback_query'],
    // Eski adreste birikmis guncellemeler yeni adrese dusmesin.
    drop_pending_updates: true,
  });

  if (!c?.ok) {
    return yanit({ ok: false, mesaj: c?.description || c?.mesaj || 'Telegram reddetti' }, 502);
  }
  return yanit({ ok: true, hedef: HEDEF });
}
