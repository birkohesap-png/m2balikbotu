import { NextResponse } from 'next/server';
import { sql, tablolariHazirla } from '@/lib/db';
import { gonder, duzenle, cevapla, sureMetni } from '@/lib/telegram';
import { adayYap, siraMetni } from '@/lib/sira';
import {
  satirdanHesaplar, calismaSn, kdBilgi, karakterCallback, karakterCallbackCoz,
} from '@/lib/hesap';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OK = () => NextResponse.json({ ok: true });
const kac = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CANLI_SN = 150; // son 2.5 dk icinde haber verdiyse "çevrimiçi"

const YARDIM =
  '<b>K34 Balık Botu — Telegram</b>\n\n' +
  'Komutlar:\n' +
  '<code>/baglan ANAHTAR</code> — lisansını bağla\n' +
  '/hesaplar — açık hesapları gör\n' +
  '/sira — sıralı mola ve Metin+ reset sırası\n' +
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
  // Ayni PC'nin eski (HWID'i degismis) kaydi gizlenir, bot saati sunucu saatine
  // cevrilir - bkz. lib/hesap.js.
  return satirdanHesaplar(rows, Date.now());
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

/* Karakter degisimine kalan: "12dk" ya da "7🐟" (20 balik modu). null = kapali. */
function kdKisa(h) {
  const k = kdBilgi(h);
  if (!k) return null;
  return k.mod === 'balik' ? k.kalan + '🐟' : sureMetni(k.kalan);
}

/* Altin Ton her karakterde 24 saatte bir tutulabilir. Slot icin:
   {alindi:bool, kalan:sn} - kalan, tonun yeniden tutulabilecegi ana kadar. */
function tonDurum(h, slot) {
  const kayit = h.ton_gunluk || {};
  const t = Number(kayit[String(slot)] || 0);
  if (!t) return { alindi: false, kalan: 0 };
  const periyot = Number(h.ton_periyot || 86400);
  const gecen = Date.now() / 1000 - t;
  if (gecen >= periyot) return { alindi: false, kalan: 0 };
  return { alindi: true, kalan: Math.round(periyot - gecen) };
}

function karakterListesi(h) {
  const ham = Array.isArray(h.karakterler) ? h.karakterler : [];
  const adet = Math.max(2, Math.min(5, h.kd_adet || ham.filter(Boolean).length || 0));
  const bitenler = Array.isArray(h.solucan_biten) ? h.solucan_biten.map(Number) : [];
  return ham.slice(0, adet).map((ad, i) => ({
    slot: i + 1,
    ad: ad || 'Slot ' + (i + 1),
    aktif: i === (h.aktif_slot || 0),
    ton: tonDurum(h, i),
    // (YENI) Bu karakterin solucani bitti mi? Telegram'da 🪱❌ ile gosterilir.
    solucanBitti: bitenler.includes(i),
  }));
}

function kdDurumMetni(h) {
  if (h.kd_degisiyor) return 'şu an değişiyor…';
  const k = kdBilgi(h);
  if (!k) return 'karakter değişimi kapalı';
  if (k.mod === 'balik') return k.kalan > 0 ? `${k.kalan} balık sonra` : 'birazdan';
  return k.kalan > 0 ? sureMetni(k.kalan) : 'birazdan';
}

function karakterMetni(h) {
  const liste = karakterListesi(h);
  const satir = liste.map(
    (k) => (k.aktif ? '\u{1F7E2}' : '\u{1F534}') + ' <b>' + k.slot + '. ' + k.ad + '</b>' +
           (k.solucanBitti ? ' \u{1FAB1}❌' : '') +
           (k.aktif ? ' \u2014 şu an oynanıyor' : '') +
           (k.ton.alindi
             ? '\n     \u{1F3C6} Altın Ton alındı \u00b7 yenilenmesine ' + sureMetni(k.ton.kalan)
             : '\n     \u{1F41F} Altın Ton hazır')
  );
  return (
    '\u{1F3AD} <b>Karakterler</b> \u2014 ' + (h.ad || 'Hesap') + '\n' +
    (h.canli ? '\u{1F7E2} Çevrimiçi' : '\u26AA Çevrimdışı') + ' \u00B7 \u{1F4BB} ' + h.pc + '\n\n' +
    (satir.length ? satir.join('\n') : 'Karakter listesi henüz okunmadı.') +
    '\n\n\u{1F504} Sıradaki değişim: <b>' + kdDurumMetni(h) + '</b>' +
    '\n\u{1F449} Karaktere dokun: bot o karaktere geçer' +
    (liste.length
      ? '\n\u{1F3C6} Günlük ton: ' + liste.filter((k) => k.ton.alindi).length + '/' + liste.length + '\n\u{1F4CB} Sıra: ' + liste.map((k) => k.ad).join(' \u2192 ') + ' \u2192 ' + liste[0].ad
      : '')
  );
}

function karakterKlavye(h, geriData) {
  const kisa = kdKisa(h);
  const liste = karakterListesi(h);
  return {
    inline_keyboard: [
      ...liste.map((k) => [
        {
          text:
            (k.aktif ? '\u{1F7E2}' : '\u{1F534}') + ' ' + k.slot + '. ' + k.ad +
            (k.ton.alindi ? ' \u{1F3C6}' : '') +
            (k.aktif && kisa !== null ? ' \u00B7 ' + kisa : ''),
          callback_data: karakterCallback(h.durumId, h.idx, k.slot),
        },
      ]),
      [
        { text: '\u{1F504} Yenile', callback_data: 'k:' + h.durumId + ':' + h.idx },
        { text: '\u25C0\uFE0F Geri', callback_data: geriData },
      ],
    ],
  };
}

function hesapMetni(h) {
  const csn = calismaSn(h, Date.now());
  const sure = csn === null ? (h.calisiyor ? '—' : 'bot durdu') : sureMetni(csn);
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
    (h.karakter ? `🎭 Karakter: <b>${h.karakter}</b>\n` : '') +
    (kdBilgi(h) !== null
      ? `🔄 Karakter değişimi: <b>${kdDurumMetni(h)}</b>\n`
      : '') +
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
      if (q.data.startsWith('ki:')) {
        // (KULLANICI ISTEGI 16 Eyl 2026) Karaktere dokununca bot o karaktere
        // gecer. Sunucu bota dogrudan ulasamaz: komut kaydedilir, bot bir sonraki
        // durum gonderiminde (en gec ~30 sn) alir; 30 sn bekleyip karaktere girer.
        const c = karakterCallbackCoz(q.data);
        if (!c) {
          await cevapla(q.id, 'Liste eski — 🔄 Yenile tuşuna bas');
          return OK();
        }
        const liste = await hesaplariTopla(bag.id);
        const h = liste.find((x) => x.durumId === c.durumId && x.idx === c.idx);
        const k = h ? karakterListesi(h).find((x) => x.slot === c.slot) : null;
        if (!h || !k) {
          await cevapla(q.id, 'Hesap bulunamadı — listeyi yenile');
          return OK();
        }
        if (!h.canli || !h.calisiyor) {
          await cevapla(q.id, 'Bot çalışmıyor — önce botu başlat');
          return OK();
        }
        if (k.aktif) {
          await cevapla(q.id, 'Zaten bu karakterde');
          return OK();
        }
        if (h.kd_degisiyor) {
          await cevapla(q.id, 'Şu an karakter değişiyor, biraz sonra dene');
          return OK();
        }
        await sql`
          DELETE FROM komutlar
           WHERE (lisans_id = ${bag.id} AND hwid = ${h.hwid} AND tur = 'karakter' AND teslim IS NULL)
              OR olusturma < NOW() - INTERVAL '1 day'`;
        await sql`
          INSERT INTO komutlar (lisans_id, hwid, tur, veri)
          VALUES (${bag.id}, ${h.hwid}, 'karakter', ${JSON.stringify({ slot: k.slot, ad: k.ad })}::jsonb)`;
        await cevapla(q.id, '✅ ' + k.ad + ' seçildi');
        await gonder(
          chatId,
          `🎭 <b>${kac(k.ad)}</b> karakterine geçiş istendi · 💻 ${kac(h.pc)}\n\n` +
            'Bot en geç ~30 sn içinde komutu alır, balık tutmayı bırakıp 30 sn bekler, ' +
            'karaktere girer ve kaldığı yerden devam eder.'
        );
        return OK();
      }
      if (q.data.startsWith('k:')) {
        const [, durumId, idx] = q.data.split(':');
        const liste = await hesaplariTopla(bag.id);
        const h = liste.find((x) => String(x.durumId) === durumId && String(x.idx) === idx);
        if (h) {
          await duzenle(chatId, q.message.message_id, karakterMetni(h),
                        karakterKlavye(h, `h:${durumId}:${idx}`));
        }
        await cevapla(q.id);
        return OK();
      }
      if (q.data.startsWith('h:')) {
        const [, durumId, idx] = q.data.split(':');
        const liste = await hesaplariTopla(bag.id);
        const h = liste.find((x) => String(x.durumId) === durumId && String(x.idx) === idx);
        if (h) {
          const satirlar = [
            [
              { text: '🔄 Yenile', callback_data: q.data },
              { text: '◀️ Hesaplar', callback_data: 'geri' },
            ],
          ];
          // Karakter listesi okunduysa ayri bir "Karakterler" gorunumu sun
          if (karakterListesi(h).length) {
            satirlar.unshift([
              { text: '🎭 Karakterler', callback_data: `k:${durumId}:${idx}` },
            ]);
          }
          await duzenle(chatId, q.message.message_id, hesapMetni(h), {
            inline_keyboard: satirlar,
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

    if (komut === '/sira') {
      const { rows: s } = await sql`SELECT veri FROM siralar WHERE lisans_id = ${bag.id}`;
      const { rows: dr } = await sql`
        SELECT hwid, veri, EXTRACT(EPOCH FROM (NOW() - guncelleme)) AS yas
          FROM durumlar WHERE lisans_id = ${bag.id} ORDER BY id ASC`;
      await gonder(chatId, siraMetni(s[0] ? s[0].veri : {}, dr.map(adayYap), Date.now()));
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
