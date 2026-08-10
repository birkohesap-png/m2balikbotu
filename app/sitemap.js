import { SITE } from '@/lib/site';

export default function sitemap() {
  const now = new Date();
  return [
    { url: SITE.url + '/', lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: SITE.url + '/#ozellikler', lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: SITE.url + '/#fiyatlar', lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: SITE.url + '/#galeri', lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: SITE.url + '/#sss', lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];
}
