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
  await sql`ALTER TABLE lisanslar ADD COLUMN IF NOT EXISTS gunluk_limit_saat INTEGER NOT NULL DEFAULT 16`;
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
  await sql`CREATE INDEX IF NOT EXISTS lisans_anahtar_idx ON lisanslar (anahtar)`;
  await sql`CREATE INDEX IF NOT EXISTS tg_lisans_idx ON tg_baglar (lisans_id)`;
  await sql`CREATE INDEX IF NOT EXISTS surum_aktif_idx ON surumler (aktif, yayin DESC)`;
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

export { sql };
