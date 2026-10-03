import { SITE } from './site';

/** Sayfaya gomulen JSON-LD blogu. */
export function JsonLd({ veri }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(veri) }}
    />
  );
}

/**
 * Her sayfanin metadata'sini ayni sekilde uretir.
 * canonical'i MUTLAKA verir — Search Console'daki "yinelenen sayfa" ve
 * "alternatif sayfa" uyarilarinin baslica sebebi eksik canonical'dir.
 */
export function sayfaMeta({ baslik, aciklama, yol, gorsel = '/logo.png', tip = 'website' }) {
  const anaSayfa = yol === '/';
  const tamBaslik = anaSayfa ? baslik : baslik + ' | ' + SITE.kisaAd;
  return {
    // Ana sayfada "absolute" sart: yoksa layout'taki "%s | K34 Balık Botu"
    // sablonu basligin sonuna bir kez daha eklenir.
    title: anaSayfa ? { absolute: baslik } : baslik,
    description: aciklama,
    alternates: { canonical: yol },
    openGraph: {
      type: tip,
      locale: 'tr_TR',
      url: SITE.url + (yol === '/' ? '' : yol),
      siteName: SITE.ad,
      title: tamBaslik,
      description: aciklama,
      images: [{ url: gorsel, width: 1200, height: 630, alt: baslik }],
    },
    twitter: {
      card: 'summary_large_image',
      title: tamBaslik,
      description: aciklama,
      images: [gorsel],
    },
  };
}

/** Kirinti navigasyonu — Google sonuc satirinda yol gosterir. */
export function kirintiSemasi(parcalar) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ ad: 'Ana Sayfa', yol: '/' }, ...parcalar].map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.ad,
      item: SITE.url + (p.yol === '/' ? '/' : p.yol),
    })),
  };
}

/** Saniyeyi ISO 8601 sureye cevirir: 193 -> 'PT3M13S'. */
export function isoSure(sn) {
  const n = Math.max(0, Math.round(Number(sn) || 0));
  const d = Math.floor(n / 60);
  const s = n % 60;
  return 'PT' + (d ? d + 'M' : '') + (s || !d ? s + 'S' : '');
}

/**
 * YouTube videosu icin VideoObject semasi (lib/site.js VIDEOLAR girdisinden).
 * YouTube'da gercek dosya adresi olmadigi icin contentUrl YERINE embedUrl verilir;
 * kucuk resim hqdefault (her videoda bulunur - maxresdefault bazilarinda yok).
 */
export function youtubeVideoSemasi(v) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.baslik,
    description: v.aciklama,
    thumbnailUrl: ['https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg'],
    embedUrl: 'https://www.youtube.com/embed/' + v.id,
    url: 'https://www.youtube.com/watch?v=' + v.id,
    uploadDate: v.tarih,
    duration: isoSure(v.saniye),
    inLanguage: 'tr',
    isFamilyFriendly: true,
    publisher: { '@id': SITE.url + '/#kurum' },
  };
}
