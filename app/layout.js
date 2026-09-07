import './globals.css';
import { SITE, SOSYAL, ANAHTAR_KELIMELER } from '@/lib/site';
import { JsonLd } from '@/lib/seo';

const BASLIK = 'Metin2 Balık Botu | K34 — Otomatik Balık Tutma ve Yapboz Botu';
const ACIKLAMA =
  'Metin2 balık botu — K34 ile 7/24 otomatik balık tut, balıkları pişir ve Balık Yapboz ' +
  'etkinliğini en az denemeyle bitir. İnsansı fare hareketi, MultiAcc, Auto Login ve ' +
  '7/24 Telegram desteği. Metin2 fish bot Türkçe sürüm.';

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: BASLIK, template: '%s | ' + SITE.kisaAd },
  description: ACIKLAMA,
  keywords: ANAHTAR_KELIMELER,
  applicationName: SITE.ad,
  authors: [{ name: SITE.ad, url: SITE.url }],
  creator: SITE.ad,
  publisher: SITE.ad,
  category: 'technology',
  manifest: '/manifest.webmanifest',
  formatDetection: { telephone: false, email: false, address: false },
  alternates: {
    canonical: '/',
    languages: { 'tr-TR': '/', 'x-default': '/' },
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
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: { icon: '/logo.png', apple: '/logo.png' },
  // Search Console dogrulamasi: lib/site.js icindeki googleDogrulama dolduruldugunda basilir.
  ...(SITE.googleDogrulama ? { verification: { google: SITE.googleDogrulama } } : {}),
};

export const viewport = {
  themeColor: '#05070c',
  width: 'device-width',
  initialScale: 1,
};

/* Site GENELINDE gecerli semalar. Sayfaya ozel semalar (SSS, video, urun)
   ilgili sayfanin kendi dosyasinda durur — her sayfada tekrarlanmalari
   Google tarafindan yinelenen icerik olarak degerlendirilir. */
const SITE_SEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': SITE.url + '/#kurum',
    name: SITE.ad,
    alternateName: SITE.kisaAd,
    url: SITE.url,
    logo: { '@type': 'ImageObject', url: SITE.url + '/logo.png', width: 512, height: 512 },
    sameAs: SOSYAL.map((s) => s.url),
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
    '@type': 'WebSite',
    '@id': SITE.url + '/#site',
    name: SITE.ad,
    url: SITE.url,
    inLanguage: 'tr-TR',
    publisher: { '@id': SITE.url + '/#kurum' },
  },
];

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
        <JsonLd veri={SITE_SEMA} />
      </head>
      <body>{children}</body>
    </html>
  );
}
