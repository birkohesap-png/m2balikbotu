import { sql, tablolariHazirla } from '@/lib/db';

const API = () => 'https://api.telegram.org/bot' + (process.env.TELEGRAM_TOKEN || '');

async function cagir(metot, govde) {
  if (!process.env.TELEGRAM_TOKEN) return { ok: false, mesaj: 'TELEGRAM_TOKEN yok' };
  try {
    const r = await fetch(API() + '/' + metot, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(govde),
    });
    return await r.json();
  } catch (e) {
    return { ok: false, mesaj: String(e) };
  }
}

export const gonder = (chat_id, text, reply_markup) =>
  cagir('sendMessage', {
    chat_id,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(reply_markup ? { reply_markup } : {}),
  });

export const duzenle = (chat_id, message_id, text, reply_markup) =>
  cagir('editMessageText', {
    chat_id,
    message_id,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(reply_markup ? { reply_markup } : {}),
  });

export const cevapla = (callback_query_id, text) =>
  cagir('answerCallbackQuery', { callback_query_id, text: text || '' });

/** Bir lisansa bagli, bildirimi acik tum Telegram sohbetlerine mesaj yollar. */
export async function lisansaBildir(lisansId, metin) {
  await tablolariHazirla();
  const { rows } = await sql`
    SELECT chat_id FROM tg_baglar WHERE lisans_id = ${lisansId} AND bildirim = TRUE`;
  await Promise.all(rows.map((r) => gonder(r.chat_id, metin)));
  return rows.length;
}

/** Bota gonderilen anahtar+hwid gercekten gecerli mi? */
export async function lisansDogrula(anahtar, hwid) {
  await tablolariHazirla();
  const a = String(anahtar || '').trim().toUpperCase();
  const h = String(hwid || '').trim().toUpperCase();
  if (!a || !h) return null;
  const { rows } = await sql`
    SELECT l.* FROM lisanslar l
     WHERE l.anahtar = ${a}
       AND NOT l.iptal
       AND l.bitis > NOW()
       AND EXISTS (SELECT 1 FROM cihazlar c WHERE c.lisans_id = l.id AND c.hwid = ${h})
     LIMIT 1`;
  return rows[0] || null;
}

/** Saniyeyi "2g 5sa" gibi okunakli hale getirir. */
export function sureMetni(sn) {
  sn = Math.max(0, Math.floor(sn));
  const g = Math.floor(sn / 86400);
  const s = Math.floor((sn % 86400) / 3600);
  const d = Math.floor((sn % 3600) / 60);
  if (g) return `${g}g ${s}sa`;
  if (s) return `${s}sa ${d}dk`;
  return `${d}dk`;
}
