import { NextResponse } from 'next/server';
import { sql, tablolariHazirla } from '@/lib/db';
import { gonder, duzenle, cevapla, sureMetni } from '@/lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OK = () => NextResponse.json({ ok: true });
const CANLI_SN = 150; // son 2.5 dk icinde haber verdiyse "çevrimiçi"

const YARDIM =
  '<b>K34 Balık Botu — Telegram</b>\n\n' +
  'Komutlar:\n' +
  '<code>/baglan ANAHTAR</code> — lisansını bağla\n' +
  '/hesaplar — açık hesapları gör\n' +
  '/durum — lisans bilgin\n' +
  '/bildirim — özel mesaj bildirimini aç/kapat\n' +
  '/cikis — bağlantıyı kes\n' +
  '/yardim — bu mesaj';

/* ------------------------------------------------------------- yardimcilar */
async function bagliLisans(chatId) {
  const { rows } = await sql`
    SELECT b.chat_id, b.bildirim, l.*
      FROM tg_baglar b JOIN lisanslar l ON l.id = b.lisans_id
     WHERE b.chat_id = ${chatId} LIMIT 1`;
  return rows[0] || null;
}

async function hesaplariTopla(lisansId) {
  const { rows } = await sql`
    SELECT id, hwid, veri, guncelleme FROM durumlar
     WHERE lisans_id = ${lisansId} ORDER BY id ASC`;
  const liste = [];
  for (const r of rows) {
    const canli = (Date.now() - new Date(r.guncelleme).getTime()) / 1000 < CANLI_SN;
    const v = r.veri || {};
    (v.hesaplar || []).forEach((h, i) => {
      liste.push({ ...h, canli, pc: v.pc || r.hwid.slice(0, 8), durumId: r.id, idx: i });
    });
  }
  return liste;
}

function hesapKlavye(liste) {
  return {
    inline_keyboard: [
      ...liste.map((h, i) => [
        {
          text: `${h.canli ? '🟢' : '⚪'} ${h.ad || 'Hesap ' + (i + 1)} — 🐟 ${h.tutulan || 0}`,
          callback_data: `h:${h.durumId}:${h.idx}`,
        },
      ]),
      [{ text: '🔄 Yenile', callback_data: 'yenile' }],
    ],
  };
}

function hesapMetni(h) {
  const sure = h.baslangic ? sureMetni(Date.now() / 1000 - h.baslangic) : '—';
  const toplam = (h.tutulan || 0) + (h.kacan || 0);
  const basari = toplam ? Math.round(((h.tutulan || 0) / toplam) * 100) : 0;
  return (
    `${h.canli ? '🟢 Çevrimiçi' : '⚪ Çevrimdışı'} · <b>${h.ad || 'Hesap'}</b>\n` +
    `💻 ${h.pc}\n\n` +
    `🐟 Tutulan: <b>${h.tutulan || 0}</b>\n` +
    `🏃 Kaçan: <b>${h.kacan || 0}</b>\n` +
    `🗑 Atılan: <b>${h.atilan || 0}</b>\n` +
    `🔁 Tur: <b>${h.tur || 0}</b>\n` +
    `🎯 Başarı: <b>%${basari}</b>\n` +
    `⚙️ Durum: <b>${h.faz || '—'}</b>\n` +
    `⏱ Çalışma: <b>${sure}</b>` +
    (h.yapboz
      ? `\n\n🧩 Yapboz — B:${h.yapboz.buyuk || 0} O:${h.yapboz.orta || 0} K:${h.yapboz.kucuk || 0} · sandık ${h.yapboz.kullanilan || 0}`
      : '')
  );
}

async function hesaplariYaz(chatId, lisansId, messageId) {
  const liste = await hesaplariTopla(lisansId);
  if (!liste.length) {
    const m =
      'Şu an açık hesap görünmüyor.\n\n' +
      'Botu çalıştırdığında hesapların burada listelenir. ' +
      'Bot açıksa bir dakika içinde görünür.';
    return messageId ? duzenle(chatId, messageId, m) : gonder(chatId, m);
  }
  const acik = liste.filter((h) => h.canli).length;
  const metin = `<b>Hesapların</b> — ${acik}/${liste.length} çevrimiçi\n\nDetay için hesaba dokun:`;
  const kb = hesapKlavye(liste);
  return messageId ? duzenle(chatId, messageId, metin, kb) : gonder(chatId, metin, kb);
}

/* ------------------------------------------------------------------ webhook */
export async function POST(req) {
  // Telegram'in gonderdigi gizli baslik - baskasi bu ucu cagiramaz
  const gizli = process.env.TELEGRAM_WEBHOOK_GIZLI;
  if (gizli && req.headers.get('x-telegram-bot-api-secret-token') !== gizli) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let u;
  try {
    u = await req.json();
  } catch {
    return OK();
  }

  try {
    await tablolariHazirla();

    /* ---------- butona basildi ---------- */
    if (u.callback_query) {
      const q = u.callback_query;
      const chatId = q.message.chat.id;
      const bag = await bagliLisans(chatId);
      if (!bag) {
        await cevapla(q.id, 'Önce lisansını bağla');
        return OK();
      }
      if (q.data === 'yenile') {
        await hesaplariYaz(chatId, bag.id, q.message.message_id);
        await cevapla(q.id, 'Güncellendi');
        return OK();
      }
      if (q.data === 'geri') {
        await hesaplariYaz(chatId, bag.id, q.message.message_id);
        await cevapla(q.id);
        return OK();
      }
      if (q.data.startsWith('h:')) {
        const [, durumId, idx] = q.data.split(':');
        const liste = await hesaplariTopla(bag.id);
        const h = liste.find((x) => String(x.durumId) === durumId && String(x.idx) === idx);
        if (h) {
          await duzenle(chatId, q.message.message_id, hesapMetni(h), {
            inline_keyboard: [
              [
                { text: '🔄 Yenile', callback_data: q.data },
                { text: '◀️ Hesaplar', callback_data: 'geri' },
              ],
            ],
          });
        }
        await cevapla(q.id);
        return OK();
      }
      await cevapla(q.id);
      return OK();
    }

    /* ---------- mesaj ---------- */
    const m = u.message || u.edited_message;
    if (!m || !m.text) return OK();
    const chatId = m.chat.id;
    const metin = m.text.trim();
    const komut = metin.split(/\s+/)[0].toLowerCase().replace(/@.*$/, '');

    if (komut === '/start' || komut === '/yardim' || komut === '/help') {
      const bag = await bagliLisans(chatId);
      await gonder(
        chatId,
        bag
          ? `Hoş geldin! Lisansın bağlı (<code>${bag.anahtar}</code>).\n\n${YARDIM}`
          : 'Hoş geldin! 👋\n\nBotunu buradan takip edebilmen için önce lisans anahtarını bağla:\n\n' +
              '<code>/baglan K34-XXXXX-XXXXX-XXXXX</code>\n\n' +
              'Anahtarı doğrudan yazsan da olur.'
      );
      return OK();
    }

    if (komut === '/cikis') {
      await sql`DELETE FROM tg_baglar WHERE chat_id = ${chatId}`;
      await gonder(chatId, 'Bağlantı kesildi. Tekrar bağlanmak için /baglan yaz.');
      return OK();
    }

    // /baglan ANAHTAR  ya da dogrudan anahtarin kendisi
    const anahtarAdayi =
      komut === '/baglan'
        ? (metin.split(/\s+/)[1] || '').toUpperCase()
        : /^K34-[A-Z0-9-]+$/i.test(metin)
        ? metin.toUpperCase()
        : null;

    if (anahtarAdayi !== null && anahtarAdayi !== undefined && anahtarAdayi !== '') {
      const { rows } = await sql`
        SELECT * FROM lisanslar WHERE anahtar = ${anahtarAdayi} LIMIT 1`;
      const l = rows[0];
      if (!l) {
        await gonder(chatId, '❌ Böyle bir anahtar yok. Anahtarını kontrol et.');
        return OK();
      }
      if (l.iptal) {
        await gonder(chatId, '❌ Bu anahtar iptal edilmiş.');
        return OK();
      }
      await sql`
        INSERT INTO tg_baglar (chat_id, lisans_id, ad)
        VALUES (${chatId}, ${l.id}, ${String(m.from?.username || m.from?.first_name || '').slice(0, 60)})
        ON CONFLICT (chat_id) DO UPDATE SET lisans_id = EXCLUDED.lisans_id`;
      await gonder(
        chatId,
        `✅ <b>Bağlandı!</b>\n\nPaket: <b>${l.paket}</b>\nBilgisayar hakkı: <b>${l.max_cihaz}</b>\n\n` +
          'Artık /hesaplar ile açık hesaplarını görebilir, birine dokunarak istatistiklerine bakabilirsin.\n' +
          'Sana özel mesaj (PM) gelirse buraya bildirim düşecek.'
      );
      return OK();
    }
    if (komut === '/baglan') {
      await gonder(chatId, 'Kullanım: <code>/baglan K34-XXXXX-XXXXX-XXXXX</code>');
      return OK();
    }

    const bag = await bagliLisans(chatId);
    if (!bag) {
      await gonder(chatId, 'Önce lisansını bağla:\n<code>/baglan K34-XXXXX-XXXXX-XXXXX</code>');
      return OK();
    }

    if (komut === '/hesaplar') {
      await hesaplariYaz(chatId, bag.id);
      return OK();
    }

    if (komut === '/durum') {
      const { rows: c } = await sql`
        SELECT COUNT(*)::int AS n FROM cihazlar WHERE lisans_id = ${bag.id}`;
      const kalan = bag.bitis ? (new Date(bag.bitis).getTime() - Date.now()) / 1000 : 0;
      await gonder(
        chatId,
        `<b>Lisans durumu</b>\n\n` +
          `🔑 <code>${bag.anahtar}</code>\n` +
          `📦 Paket: <b>${bag.paket}</b>\n` +
          `⏳ Kalan: <b>${kalan > 0 ? sureMetni(kalan) : 'süresi doldu'}</b>\n` +
          `💻 Bilgisayar: <b>${c[0].n}/${bag.max_cihaz}</b>\n` +
          `🔔 Bildirim: <b>${bag.bildirim ? 'açık' : 'kapalı'}</b>`
      );
      return OK();
    }

    if (komut === '/bildirim') {
      const { rows } = await sql`
        UPDATE tg_baglar SET bildirim = NOT bildirim
         WHERE chat_id = ${chatId} RETURNING bildirim`;
      await gonder(chatId, rows[0].bildirim ? '🔔 Bildirimler açıldı.' : '🔕 Bildirimler kapatıldı.');
      return OK();
    }

    await gonder(chatId, YARDIM);
    return OK();
  } catch (e) {
    console.error('telegram', e);
    return OK(); // Telegram'a her zaman 200 don, yoksa surekli tekrar gonderir
  }
}

/** Tarayicidan acinca webhook'un ayakta oldugunu gormek icin */
export async function GET() {
  return NextResponse.json({
    ok: true,
    token: Boolean(process.env.TELEGRAM_TOKEN),
    gizli: Boolean(process.env.TELEGRAM_WEBHOOK_GIZLI),
  });
}
