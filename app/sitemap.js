import { SITE, SAYFALAR, VIDEOLAR, YAPBOZ } from '@/lib/site';

/**
 * Sitemap SADECE gercek sayfalari listeler.
 * Onceki surumde "/#fiyatlar" gibi capa (fragment) adresleri vardi; Google bunlari
 * ayri sayfa saymaz ve Search Console'da "taranmadi / yinelenen sayfa" hatasi verir.
 * Yeni sayfa eklemek icin lib/site.js icindeki SAYFALAR dizisine ekle, burasi
 * kendiliginden guncellenir.
 *
 * VIDEO SITEMAP (3 Eki 2026): videolu sayfalar <video:video> girdisi tasir; Google
 * video sonuclarinda ve AI ozetlerindeki video kartinda bu sayfalari gosterebilir.
 * DIKKAT: Next bu alanlari XML'e KACISSIZ yazar -> metinler burada kacirilir.
 */
const xml = (t) =>
  String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function youtubeVideo(v) {
  return {
    title: xml(v.baslik),
    description: xml(v.aciklama),
    thumbnail_loc: 'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg',
    player_loc: 'https://www.youtube.com/embed/' + v.id,
    duration: v.saniye,
    publication_date: v.tarih,
    family_friendly: 'yes',
  };
}

const VIDEOLU = {
  '/': [youtubeVideo(VIDEOLAR.tanitim), youtubeVideo(VIDEOLAR.pvp)],
  '/pvp-balik-botu': [youtubeVideo(VIDEOLAR.pvp)],
  '/yapboz-botu': [
    {
      title: xml(YAPBOZ.video.baslik),
      description: xml(YAPBOZ.video.aciklama),
      thumbnail_loc: SITE.url + YAPBOZ.video.poster,
      content_loc: SITE.url + YAPBOZ.video.src,
      duration: YAPBOZ.video.saniye,
      publication_date: YAPBOZ.video.tarih,
      family_friendly: 'yes',
    },
  ],
};

export default function sitemap() {
  const now = new Date();
  return SAYFALAR.map((s) => ({
    url: SITE.url + s.yol,
    lastModified: now,
    changeFrequency: s.siklik,
    priority: s.oncelik,
    ...(VIDEOLU[s.yol] ? { videos: VIDEOLU[s.yol] } : {}),
  }));
}
