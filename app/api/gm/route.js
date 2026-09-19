import { NextResponse } from 'next/server';
import { sql, tablolariHazirla } from '@/lib/db';
import { tumMusterilereBildir } from '@/lib/telegram';
import { gatewayGmTara, gmAyarliMi, gmIsimleri, gmRisk, gmGorunen } from '@/lib/gm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const kac = (t) =>
  String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** GM uyarisinin altindaki iki buton (musteri PC kapat / sadece oyun kapat secer). */
function kapatKlavye() {
  return {
    inline_keyboard: [[
      { text: '🖥 PC\'yi kapat', callback_data: 'gmkapat:pc' },
      { text: '❌ Sadece oyunu kapat', callback_data: 'gmkapat:oyun' },
    ]],
  };
}

function gizliMi(req) {
  const beklenen = process.env.GM_TARA_GIZLI;
  if (!beklenen) return false; // ayar yoksa uc kapali
  const u = new URL(req.url);
  const gelen =
    req.headers.get('x-gm-gizli') || u.searchParams.get('anahtar') || '';
  return gelen === beklenen;
}

/**
 * Zamanlayici (cron-job.org vb.) bu ucu ~30 sn'de bir gizli anahtarla durter.
 * Discord'da GM cevrimici mi diye bakar; YENI cevrimici olan GM varsa tum
 * musterilere Telegram'dan uyari + "oyunu kapat" butonlari dusurur.
 *
 * GET/POST /api/gm?anahtar=GIZLI   (veya  x-gm-gizli basligiyla)
 */
async function calis(req) {
  if (!gizliMi(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!gmAyarliMi()) {
    return NextResponse.json(
      { ok: false, sebep: 'ayarsiz', ipucu: 'DISCORD_TOKEN, DISCORD_GUILD, GM_ISIMLER gerekli' },
      { status: 200 }
    );
  }

  await tablolariHazirla();

  const sp = new URL(req.url).searchParams;
  const debugIstendi = sp.get('debug') === '1';
  const ara = String(sp.get('ara') || '').slice(0, 40);
  const { aktif, hata, debug } = await gatewayGmTara({ ara: debugIstendi ? ara : '' });
  const simdi = new Set(aktif);

  // Onceki tarama durumu (debounce): sadece YENI cevrimici olanlar icin uyar.
  await sql`INSERT INTO gm_durum (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;
  const { rows } = await sql`SELECT aktif FROM gm_durum WHERE id = 1`;
  const onceki = new Set(Array.isArray(rows[0]?.aktif) ? rows[0].aktif : []);

  const yeni = [...simdi].filter((ad) => !onceki.has(ad));
  // GM cikisi: onceki taramada aktifti, artik degil. SADECE basarili taramada
  // (hata varsa simdi bos gelir, yanlis "cikti" bildirimi gitmesin).
  const cikan = hata ? [] : [...onceki].filter((ad) => !simdi.has(ad));

  let gonderilen = 0;
  if (yeni.length && !debugIstendi) {
    // Her yeni aktif GM'i risk seviyesine gore ayir (yuksek/dusuk).
    const yuksek = yeni.filter((a) => gmRisk(a) === 'yuksek');
    const dusuk = yeni.filter((a) => gmRisk(a) !== 'yuksek');
    const satirlar = [
      ...yuksek.map((a) => '🔴 <b>' + kac(gmGorunen(a)) + '</b> — YÜKSEK RİSK'),
      ...dusuk.map((a) => '🟡 <b>' + kac(gmGorunen(a)) + '</b> — düşük risk'),
    ].join('\n');

    let metin;
    if (yuksek.length) {
      // En az bir yuksek riskli GM aktif -> sert uyari.
      metin =
        '⚠️ <b>GM AKTİF — YÜKSEK RİSK!</b>\n\n' +
        'Şu an aktif oyun yöneticisi (GM):\n' + satirlar + '\n\n' +
        'Ban riski <b>yüksek</b>. Lütfen oyunu HEMEN kapatın. Aşağıdaki butonla ' +
        'bilgisayarınızı ya da sadece oyunu kapatabilirsiniz.';
    } else {
      // Sadece dusuk riskli GM(ler) -> daha yumusak uyari.
      metin =
        '🟡 <b>GM aktif (düşük risk)</b>\n\n' +
        'Şu an aktif GM:\n' + satirlar + '\n\n' +
        'Ban riski düşük ama dikkatli olun. İstersen aşağıdaki butonla oyunu ' +
        'veya bilgisayarını kapatabilirsin.';
    }
    gonderilen = await tumMusterilereBildir(metin, kapatKlavye());
  }

  // GM cikinca "guvenli" bildirimi (buton yok).
  if (cikan.length && !debugIstendi) {
    const isimler = cikan.map((a) => '⚪ <b>' + kac(gmGorunen(a)) + '</b>').join('\n');
    const metin =
      '✅ <b>GM çıkış yaptı</b>\n\n' + isimler + '\n\n' +
      'Artık çevrimdışı — tehlike geçti. İstersen oyuna devam edebilirsin. 🎣';
    await tumMusterilereBildir(metin);
  }

  // debug=1 KURU MOD: bildirim atmaz, kayit degistirmez (test icin guvenli).
  if (!debugIstendi) {
    // Durumu guncelle. Hata olduysa (baglanti kurulamadi) onceki durumu KORU ki
    // gecici bir hata "GM cikti" gibi algilanip sonra tekrar uyari yagdirmasin.
    if (!hata) {
      await sql`
        UPDATE gm_durum
           SET aktif = ${JSON.stringify([...simdi])}::jsonb,
               son_tarama = NOW(),
               son_bildirim = ${yeni.length ? new Date().toISOString() : null}
         WHERE id = 1`;
    } else {
      await sql`UPDATE gm_durum SET son_tarama = NOW() WHERE id = 1`;
    }
  }

  return NextResponse.json({
    ok: true,
    aktif: [...simdi],
    yeni,
    gonderilen,
    izlenen: gmIsimleri().length,
    ...(hata ? { hata } : {}),
    ...(debugIstendi ? { debug } : {}),
  });
}

export const GET = calis;
export const POST = calis;
