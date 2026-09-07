import { SITE } from '@/lib/site';

export default function manifest() {
  return {
    name: SITE.ad,
    short_name: SITE.kisaAd,
    description: 'Metin2 için otomatik balık tutma ve Balık Yapboz botu.',
    start_url: '/',
    display: 'standalone',
    background_color: '#05070c',
    theme_color: '#05070c',
    lang: 'tr-TR',
    categories: ['games', 'utilities'],
    icons: [
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
