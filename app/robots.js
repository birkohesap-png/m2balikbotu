import { SITE } from '@/lib/site';

/**
 * Yonetim paneli (/k34) BILEREK burada yazmiyor: robots.txt herkese acik bir
 * dosyadir, gizli yolu oraya yazmak onu duyurmak olur. Panel bunun yerine
 * app/k34/layout.js icindeki "noindex" ile aramadan uzak tutuluyor.
 */
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: SITE.url + '/sitemap.xml',
    host: SITE.url,
  };
}
