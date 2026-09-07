import { SITE, SAYFALAR } from '@/lib/site';

/**
 * Sitemap SADECE gercek sayfalari listeler.
 * Onceki surumde "/#fiyatlar" gibi capa (fragment) adresleri vardi; Google bunlari
 * ayri sayfa saymaz ve Search Console'da "taranmadi / yinelenen sayfa" hatasi verir.
 * Yeni sayfa eklemek icin lib/site.js icindeki SAYFALAR dizisine ekle, burasi
 * kendiliginden guncellenir.
 */
export default function sitemap() {
  const now = new Date();
  return SAYFALAR.map((s) => ({
    url: SITE.url + s.yol,
    lastModified: now,
    changeFrequency: s.siklik,
    priority: s.oncelik,
  }));
}
