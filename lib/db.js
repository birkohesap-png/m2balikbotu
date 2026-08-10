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
  // Telegram hesabi <-> lisans baglantisi
  await sql`
    CREATE TABLE IF NOT EXISTS tg_baglar (
      chat_id    BIGINT PRIMARY KEY,
      lisans_id  INTEGER NOT NULL REFERENCES lisanslar(id) ON DELETE CASCADE,
      ad         TEXT DEFAULT '',
      bildirim   BOOLEAN NOT NULL DEFAULT TRUE,
      olusturma  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await sql`CREATE INDEX IF NOT EXISTS lisans_anahtar_idx ON lisanslar (anahtar)`;
  await sql`CREATE INDEX IF NOT EXISTS tg_lisans_idx ON tg_baglar (lisans_id)`;
  kuruldu = true;
}

export { sql };
