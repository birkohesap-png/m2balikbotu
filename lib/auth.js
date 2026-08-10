import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'k34_admin';

function gizli() {
  const s = process.env.ADMIN_GIZLI || process.env.LISANS_GIZLI;
  if (!s) throw new Error('ADMIN_GIZLI environment degiskeni tanimli degil');
  return s;
}

function imzala(veri) {
  return crypto.createHmac('sha256', gizli()).update(veri).digest('base64url');
}

/** Sabit zamanli karsilastirma - zamanlama saldirisina kapali. */
export function esitMi(a, b) {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

export function tokenUret(saat = 12) {
  const bitis = Date.now() + saat * 3600 * 1000;
  return bitis + '.' + imzala(String(bitis));
}

export function tokenGecerliMi(token) {
  if (!token || typeof token !== 'string') return false;
  const [bitis, imza] = token.split('.');
  if (!bitis || !imza) return false;
  if (!esitMi(imza, imzala(bitis))) return false;
  return Number(bitis) > Date.now();
}

export async function adminMi() {
  try {
    const c = await cookies();
    return tokenGecerliMi(c.get(COOKIE)?.value);
  } catch {
    return false;
  }
}

export const ADMIN_COOKIE = COOKIE;

/**
 * Bota verilen lisans jetonu. Bot bunu YEREL olarak dogrulayabilir (internet
 * kesildiginde kisa sureli devam icin) ama URETEMEZ — imza sunucudadir.
 */
export function lisansJetonu(anahtar, hwid, bitisEpoch) {
  const s = process.env.LISANS_GIZLI || process.env.ADMIN_GIZLI || '';
  const govde = `${anahtar}|${hwid}|${bitisEpoch}`;
  const imza = crypto.createHmac('sha256', s).update(govde).digest('base64url');
  return `${bitisEpoch}.${imza}`;
}

/** Yeni lisans anahtari: K34-XXXXX-XXXXX-XXXXX (karisan harfler cikarildi) */
export function anahtarUret() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const blok = () =>
    Array.from(crypto.randomBytes(5))
      .map((b) => abc[b % abc.length])
      .join('');
  return `K34-${blok()}-${blok()}-${blok()}`;
}
