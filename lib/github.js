/**
 * GitHub Releases koprusu.
 *
 * Kurulum dosyasi (142 MB) OZEL bir GitHub deposunun Releases bolumunde durur.
 * Depo gizli oldugu icin dosyaya dogrudan link ile ulasilamaz; bu modul sunucu
 * tarafindaki jetonla GitHub'dan KISA OMURLU imzali bir adres alir ve yalnizca
 * lisansi gecerli olan bota verir.
 *
 * Vercel > Settings > Environment Variables:
 *   GH_REPO   = kullanici/depo        (orn: birkohesap-png/k34-surum)
 *   GH_TOKEN  = GitHub Personal Access Token (yalnizca "Contents: read" yetkisi)
 */
const API = 'https://api.github.com';

function ayar() {
  const repo = (process.env.GH_REPO || '').trim();
  const token = (process.env.GH_TOKEN || '').trim();
  if (!repo) throw new Error('GH_REPO tanimli degil');
  return { repo, token };
}

function baslik(token, accept = 'application/vnd.github+json') {
  const h = {
    Accept: accept,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'k34-site',
  };
  // Token YOKSA depo ACIK demektir; GitHub kimliksiz de cevap verir.
  if (token) h.Authorization = 'Bearer ' + token;
  return h;
}

/**
 * Release asset icin kisa omurlu (birkac dakika) imzali indirme adresi uretir.
 * GitHub 302 ile imzali adrese yonlendirir; yonlendirmeyi TAKIP ETMEYIP
 * Location basligini okuyoruz — boylece 142 MB dosya sunucumuzdan gecmez,
 * bot dogrudan GitHub'in CDN'inden indirir.
 */
export async function varlikAdresi(varlikId) {
  const { repo, token } = ayar();
  const c = await fetch(`${API}/repos/${repo}/releases/assets/${varlikId}`, {
    headers: baslik(token, 'application/octet-stream'),
    redirect: 'manual',
    cache: 'no-store',
  });

  const adres = c.headers.get('location');
  if (adres) return adres;

  // Yonlendirme gelmediyse hata sebebini anlamli bicimde yukari tasi.
  const metin = await c.text().catch(() => '');
  throw new Error(`GitHub imzali adres vermedi (HTTP ${c.status}) ${metin.slice(0, 200)}`);
}

/** Depodaki son yayinin dosyalarini listeler — panelde secim kutusu icin. */
export async function sonYayinVarliklari() {
  const { repo, token } = ayar();
  const c = await fetch(`${API}/repos/${repo}/releases?per_page=5`, {
    headers: baslik(token),
    cache: 'no-store',
  });
  if (!c.ok) {
    throw new Error(`GitHub yayin listesi alinamadi (HTTP ${c.status})`);
  }
  const yayinlar = await c.json();
  return (Array.isArray(yayinlar) ? yayinlar : []).flatMap((y) =>
    (y.assets || []).map((v) => ({
      id: String(v.id),
      ad: v.name,
      boyut: v.size,
      yayin: y.tag_name,
      tarih: v.created_at,
    }))
  );
}
