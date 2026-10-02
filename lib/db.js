import { sql } from '@vercel/postgres';

let kuruldu = false;

/** Tablolar yoksa olusturur. Her API cagrisinin basinda cagrilir (ucuz, IF NOT EXISTS). */
export async function tablolariHazirla() {
  if (kuruldu) return;
  await sql`
    CREATE TABLE IF NOT EXISTS lisanslar (
      id          SERIAL PRIMARY KEY,
      anahtar     TEXT UNIQUE NOT NULL,
      paket       TEXT NOT NULL,
      max_cihaz   INTEGER NOT NULL,
      sure_saat   INTEGER NOT NULL,
      musteri     TEXT DEFAULT '',
      aciklama    TEXT DEFAULT '',
      olusturma   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      aktivasyon  TIMESTAMPTZ,
      bitis       TIMESTAMPTZ,
      iptal       BOOLEAN NOT NULL DEFAULT FALSE,
      son_gorulme TIMESTAMPTZ
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS cihazlar (
      id        SERIAL PRIMARY KEY,
      lisans_id INTEGER NOT NULL REFERENCES lisanslar(id) ON DELETE CASCADE,
      hwid      TEXT NOT NULL,
      ad        TEXT DEFAULT '',
      ilk       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      son       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (lisans_id, hwid)
    )`;
  // Botun bildirdigi canli durum (her bilgisayar icin bir satir)
  await sql`
    CREATE TABLE IF NOT EXISTS durumlar (
      id         SERIAL PRIMARY KEY,
      lisans_id  INTEGER NOT NULL REFERENCES lisanslar(id) ON DELETE CASCADE,
      hwid       TEXT NOT NULL,
      veri       JSONB NOT NULL DEFAULT '{}'::jsonb,
      guncelleme TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (lisans_id, hwid)
    )`;
  // Ayni key'deki bilgisayarlarin sirali cikis/giris durumu (bkz. lib/sira.js).
  // Lisans basina tek satir; surum, es zamanli iki istegin ikisine birden izin
  // cikmasini engeller.
  await sql`
    CREATE TABLE IF NOT EXISTS siralar (
      lisans_id  INTEGER PRIMARY KEY REFERENCES lisanslar(id) ON DELETE CASCADE,
      veri       JSONB NOT NULL DEFAULT '{}'::jsonb,
      surum      INTEGER NOT NULL DEFAULT 0,
      guncelleme TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  // Telegram'dan bota giden komutlar (or. "su karaktere gec"). Bot her durum
  // gonderiminde kendi bekleyen komutlarini alir; teslim edilen isaretlenir.
  await sql`
    CREATE TABLE IF NOT EXISTS komutlar (
      id        SERIAL PRIMARY KEY,
      lisans_id INTEGER NOT NULL REFERENCES lisanslar(id) ON DELETE CASCADE,
      hwid      TEXT NOT NULL,
      tur       TEXT NOT NULL,
      veri      JSONB NOT NULL DEFAULT '{}'::jsonb,
      olusturma TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      teslim    TIMESTAMPTZ
    )`;
  await sql`CREATE INDEX IF NOT EXISTS komut_bekleyen_idx ON komutlar (lisans_id, hwid, teslim)`;
  // Telegram hesabi <-> lisans baglantisi
  await sql`
    CREATE TABLE IF NOT EXISTS tg_baglar (
      chat_id    BIGINT PRIMARY KEY,
      lisans_id  INTEGER NOT NULL REFERENCES lisanslar(id) ON DELETE CASCADE,
      ad         TEXT DEFAULT '',
      bildirim   BOOLEAN NOT NULL DEFAULT TRUE,
      olusturma  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  // Bot surumleri. Bot acilista /api/surum'a sorar; yeni varsa /api/indir'den
  // lisansiyla gecici indirme adresi alir. Dosyanin kendisi GitHub Releases'te
  // durur; varlik_id o dosyanin release asset kimligidir.
  await sql`
    CREATE TABLE IF NOT EXISTS surumler (
      id        SERIAL PRIMARY KEY,
      surum     TEXT UNIQUE NOT NULL,
      notlar    JSONB NOT NULL DEFAULT '[]'::jsonb,
      zorunlu   BOOLEAN NOT NULL DEFAULT FALSE,
      sha256    TEXT NOT NULL DEFAULT '',
      boyut     BIGINT NOT NULL DEFAULT 0,
      varlik_id TEXT NOT NULL DEFAULT '',
      yayin     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      aktif     BOOLEAN NOT NULL DEFAULT TRUE
    )`;
  // Gunluk calisma limiti: her key icin admin ayarlar (varsayilan 16 saat,
  // 0 = kapali). Tablo zaten varsa kolonu ekler.
  await sql`ALTER TABLE lisanslar ADD COLUMN IF NOT EXISTS gunluk_limit_saat INTEGER NOT NULL DEFAULT 14`;
  // (KULLANICI ISTEGI 1 Eki 2026) Gunluk limit 16 -> 14 saat. Mevcut key'ler
  // DEFAULT 16 ile olusmustu; TEK SEFERLIK (flag'li) olarak 16 olanlari 14 yap.
  // Flag sayesinde admin sonradan bir key'i bilerek 16 yaparsa TEKRAR ezilmez.
  await sql`ALTER TABLE lisanslar ADD COLUMN IF NOT EXISTS limit14_uygulandi BOOLEAN NOT NULL DEFAULT FALSE`;
  await sql`UPDATE lisanslar SET gunluk_limit_saat = 14, limit14_uygulandi = TRUE
             WHERE limit14_uygulandi = FALSE AND gunluk_limit_saat = 16`;
  // (KULLANICI ISTEGI 29 Eyl 2026) Telegram bildirim tercihleri: kullanicinin
  // KAPATTIGI bildirim kategorileri (anahtar listesi). Bos = hepsi acik (varsayilan).
  await sql`ALTER TABLE lisanslar ADD COLUMN IF NOT EXISTS bildirim_kapali JSONB NOT NULL DEFAULT '[]'::jsonb`;
  // (KULLANICI ISTEGI 2 Eki 2026) Key bazinda hafta sonu MUAFIYETI. Varsayilan
  // FALSE (hafta sonu kisitli); admin panelden bir key'i serbest birakabilir.
  await sql`ALTER TABLE lisanslar ADD COLUMN IF NOT EXISTS haftasonu_serbest BOOLEAN NOT NULL DEFAULT FALSE`;
  // Her bilgisayarin (hwid) gunluk limit sayaci. donem_sn: bu donemde birikmis
  // aktif saniye; dinlenme_bitis: doluysa 8 saatlik dinlenmenin bitis ani.
  // Bot kapanip acilsa da burada durur (sunucu tarafi - sifirlanamaz).
  await sql`
    CREATE TABLE IF NOT EXISTS kullanim (
      lisans_id     INTEGER NOT NULL REFERENCES lisanslar(id) ON DELETE CASCADE,
      hwid          TEXT NOT NULL,
      donem_sn      INTEGER NOT NULL DEFAULT 0,
      dinlenme_bitis TIMESTAMPTZ,
      guncelleme    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (lisans_id, hwid)
    )`;
  // Admin panelinden istenen anlik ekran goruntusu (base64 JPEG). Bot yakalayip
  // /api/ekran'a yollar; admin paneli buradan okur. Cihaz basina son goruntu.
  await sql`
    CREATE TABLE IF NOT EXISTS admin_ekran (
      lisans_id INTEGER NOT NULL REFERENCES lisanslar(id) ON DELETE CASCADE,
      hwid      TEXT NOT NULL,
      resim     TEXT NOT NULL DEFAULT '',
      zaman     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (lisans_id, hwid)
    )`;
  // GM (oyun yoneticisi) nobeti. Discord'da GM cevrimici mi diye periyodik bakan
  // zamanlayici (/api/gm), en son kimlerin aktif oldugunu buraya yazar. Ayni GM
  // icin tekrar tekrar bildirim gitmesin diye "aktif" durumu burada tutulur.
  await sql`
    CREATE TABLE IF NOT EXISTS gm_durum (
      id           INTEGER PRIMARY KEY DEFAULT 1,
      aktif        JSONB NOT NULL DEFAULT '[]'::jsonb,
      son_tarama   TIMESTAMPTZ,
      son_bildirim TIMESTAMPTZ,
      CHECK (id = 1)
    )`;
  // (KULLANICI ISTEGI 2 Eki 2026) SIZMA TESPITI. Basarisiz lisans denemeleri ve
  // kalkan ihlalleri TOPLANARAK tutulur (ayni ip+sebep+anahtar+hwid tek satir,
  // adet artar) -> saldirgan istek yagdirsa da tablo sismez. bkz. lib/sizma.js
  await sql`
    CREATE TABLE IF NOT EXISTS sizma (
      id      SERIAL PRIMARY KEY,
      ip      TEXT NOT NULL DEFAULT '',
      sebep   TEXT NOT NULL,
      anahtar TEXT NOT NULL DEFAULT '',
      hwid    TEXT NOT NULL DEFAULT '',
      ayrinti TEXT NOT NULL DEFAULT '',
      adet    INTEGER NOT NULL DEFAULT 1,
      ilk     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      son     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (ip, sebep, anahtar, hwid)
    )`;
  await sql`CREATE INDEX IF NOT EXISTS sizma_ip_son_idx ON sizma (ip, son DESC)`;
  // Panelden engellenen IP / HWID / anahtarlar. /api/check bunlara vk VERMEZ.
  await sql`
    CREATE TABLE IF NOT EXISTS engelliler (
      id       SERIAL PRIMARY KEY,
      tur      TEXT NOT NULL,
      deger    TEXT NOT NULL,
      aciklama TEXT NOT NULL DEFAULT '',
      zaman    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (tur, deger)
    )`;
  await sql`CREATE INDEX IF NOT EXISTS lisans_anahtar_idx ON lisanslar (anahtar)`;
  await sql`CREATE INDEX IF NOT EXISTS tg_lisans_idx ON tg_baglar (lisans_id)`;
  await sql`CREATE INDEX IF NOT EXISTS surum_aktif_idx ON surumler (aktif, yayin DESC)`;
  // URUN AYRIMI: ayni tablo K34 TR ('tr') ve K34 PvP ('pvp') surumlerini tutar.
  // Mevcut satirlar DEFAULT ile 'tr' olur -> TR botlari hicbir sey fark etmez.
  // Surum numarasi artik URUN ICINDE benzersiz (TR 1.2.0 ile PvP 1.2.0 cakismasin).
  await sql`ALTER TABLE surumler ADD COLUMN IF NOT EXISTS urun TEXT NOT NULL DEFAULT 'tr'`;
  await sql`ALTER TABLE surumler DROP CONSTRAINT IF EXISTS surumler_surum_key`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS surum_urun_uniq ON surumler (urun, surum)`;
  await sql`CREATE INDEX IF NOT EXISTS surum_urun_aktif_idx ON surumler (urun, aktif, yayin DESC)`;
  kuruldu = true;
}

/**
 * Bir lisans anahtarinin su an gecerli olup olmadigini soyler.
 * /api/indir bunu kullanir - indirme adresi yalnizca gecerli lisansa verilir.
 * Doner: { ok, sebep, lisans? }
 */
export async function lisansGecerliMi(anahtar) {
  const a = String(anahtar || '').trim().toUpperCase();
  if (!a || a.length > 64) return { ok: false, sebep: 'gecersiz' };

  const { rows } = await sql`SELECT * FROM lisanslar WHERE anahtar = ${a} LIMIT 1`;
  const l = rows[0];
  if (!l) return { ok: false, sebep: 'gecersiz' };
  if (l.iptal) return { ok: false, sebep: 'iptal' };
  // Henuz aktive edilmemis anahtar da gecerlidir (musteri daha kurmamis olabilir).
  if (l.bitis && new Date(l.bitis).getTime() <= Date.now()) {
    return { ok: false, sebep: 'suresi_doldu' };
  }
  return { ok: true, sebep: 'gecerli', lisans: l };
}

/**
 * IP / HWID / anahtar engelli mi? Engelliyse turunu ('ip'|'hwid'|'anahtar'),
 * degilse null doner. Bos degerler '-' ile aranir; engelDegeriTemizle en az 3-4
 * karakter istedigi icin '-' hicbir engelle eslesmez.
 */
export async function engelliMi(ip, hwid, anahtar) {
  const { rows } = await sql`
    SELECT tur FROM engelliler
     WHERE (tur = 'ip' AND deger = ${ip || '-'})
        OR (tur = 'hwid' AND deger = ${hwid || '-'})
        OR (tur = 'anahtar' AND deger = ${anahtar || '-'})
     LIMIT 1`;
  return rows[0] ? rows[0].tur : null;
}

// Bir IP'nin 24 saatte acabilecegi en fazla AYRI kayit. Asilirsa yeni denemeler
// o IP'nin tek bir "tasma" satirinda (anahtar/hwid = '*') sayilir.
const IP_KAYIT_SINIRI = 40;

/**
 * Basarisiz giris / kalkan ihlali kaydi. ASLA hata firlatmaz: kayit
 * dusmese de cagiran (or. /api/check) cevabini normal vermeli.
 */
export async function sizmaKaydet({ ip = '', sebep, anahtar = '', hwid = '', ayrinti = '' }) {
  try {
    const i = String(ip || '').slice(0, 64);
    const { rows } = await sql`
      SELECT COUNT(*)::int AS n FROM sizma
       WHERE ip = ${i} AND son > NOW() - INTERVAL '1 day'`;
    const tasma = rows[0].n >= IP_KAYIT_SINIRI;
    const a = tasma ? '*' : String(anahtar || '').slice(0, 64);
    const h = tasma ? '*' : String(hwid || '').slice(0, 64);
    await sql`
      INSERT INTO sizma (ip, sebep, anahtar, hwid, ayrinti)
      VALUES (${i}, ${String(sebep).slice(0, 40)}, ${a}, ${h}, ${String(ayrinti || '').slice(0, 300)})
      ON CONFLICT (ip, sebep, anahtar, hwid)
      DO UPDATE SET adet = sizma.adet + 1, son = NOW(), ayrinti = EXCLUDED.ayrinti`;
  } catch {
    /* kayit kritik degil */
  }
}

export { sql };
