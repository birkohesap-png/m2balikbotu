import './globals.css';
import { SITE, PAKETLER, SSS, ANAHTAR_KELIMELER } from '@/lib/site';

const BASLIK = 'Metin2 Balık Botu | K34 — Otomatik Balık Tutma Botu (Metin2 Fish Bot)';
const ACIKLAMA =
  'Metin2 balık botu — K34 Balık Botu ile 7/24 otomatik balık tut, balıkları pişir, ' +
  'Balık Yapboz etkinliğini en az denemeyle bitir. İnsansı fare hareketi, MultiAcc, ' +
  'Auto Login ve Telegram desteği. Metin2 fish bot / fishing bot Türkçe sürüm.';

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: BASLIK, template: '%s | ' + SITE.kisaAd },
  description: ACIKLAMA,
  keywords: ANAHTAR_KELIMELER,
  applicationName: SITE.ad,
  authors: [{ name: SITE.ad }],
  creator: SITE.ad,
  publisher: SITE.ad,
  category: 'technology',
  alternates: {
    canonical: '/',
    languages: {
      'tr-TR': '/',
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: SITE.url,
    siteName: SITE.ad,
    title: BASLIK,
    description: ACIKLAMA,
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Metin2 Balık Botu — K34' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: BASLIK,
    description: ACIKLAMA,
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: { icon: '/logo.png', apple: '/logo.png' },
};

export const viewport = {
  themeColor: '#05070c',
  width: 'device-width',
  initialScale: 1,
};

function YapisalVeri() {
  const veri = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'K34 Metin2 Balık Botu',
      alternateName: ['Metin2 Balık Botu', 'Metin2 Fish Bot', 'Metin2 Fishing Bot', 'K34 Balık Botu'],
      applicationCategory: 'GameApplication',
      operatingSystem: 'Windows 10, Windows 11',
      inLanguage: 'tr',
      description: ACIKLAMA,
      url: SITE.url,
      image: SITE.url + '/logo.png',
      softwareVersion: '2.0',
      featureList: [
        'Otomatik balık tutma',
        'Balık Yapboz etkinliği otomatik oynama',
        'Otomatik pişirme',
        'Auto Login ve DC koruması',
        'MultiAcc çoklu pencere',
        'Telegram uzaktan kontrol',
        'İnsansı fare hareketi',
      ],
      offers: PAKETLER.map((p) => ({
        '@type': 'Offer',
        name: p.ad + ' Paket',
        price: String(p.fiyat),
        priceCurrency: 'TRY',
        availability: 'https://schema.org/InStock',
        url: SITE.url + '/#fiyatlar',
        description: `${p.sure} kullanım, ${p.cihaz} bilgisayar`,
      })),
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '187',
        bestRating: '5',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE.ad,
      url: SITE.url,
      logo: SITE.url + '/logo.png',
      sameAs: [SITE.telegramUrl],
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          availableLanguage: ['Turkish', 'English'],
          url: SITE.telegramUrl,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: SSS.map((x) => ({
        '@type': 'Question',
        name: x.s,
        acceptedAnswer: { '@type': 'Answer', text: x.c },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.ad,
      url: SITE.url,
      inLanguage: 'tr-TR',
    },
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(veri) }}
    />
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
        <YapisalVeri />
      </head>
      <body>{children}</body>
    </html>
  );
}
