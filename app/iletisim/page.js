import Link from 'next/link';
import { SITE } from '@/lib/site';
import { JsonLd, sayfaMeta, kirintiSemasi } from '@/lib/seo';
import { TgIkon, IgIkon } from '../Ikonlar';
import Ust from '../Ust';
import Alt from '../Alt';

export const metadata = sayfaMeta({
  baslik: 'İletişim — Telegram Grup, Destek ve Instagram',
  aciklama:
    'K34 Metin2 Balık Botu iletişim kanalları: @k34genel Telegram sohbet grubu, ' +
    '@k34balik satış ve destek hesabı, @k34balik Instagram.',
  yol: '/iletisim',
});

const SEMA = [
  kirintiSemasi([{ ad: 'İletişim', yol: '/iletisim' }]),
  {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'İletişim — ' + SITE.ad,
    inLanguage: 'tr',
    url: SITE.url + '/iletisim',
    mainEntity: { '@id': SITE.url + '/#kurum' },
  },
];

export default function IletisimSayfa() {
  return (
    <>
      <JsonLd veri={SEMA} />
      <Ust />

      <article className="ic-sayfa">
        <div className="sar">
          <nav className="kirinti" aria-label="Sayfa yolu">
            <Link href="/">Ana Sayfa</Link>
            <span>/</span>
            <span>İletişim</span>
          </nav>

          <span className="etiket">İletişim</span>
          <h1>
            Bize <span className="altin-yazi">nereden ulaşırsın?</span>
          </h1>
          <p className="ic-giris">
            Sohbet etmek ve duyuruları takip etmek için genel grubumuza, satın alma ve
            birebir destek için admin hesabımıza yaz.
          </p>

          <div className="iletisim-izgara" style={{ marginTop: 30 }}>
            <a className="iletisim-kart" href={SITE.telegramGrupUrl} target="_blank" rel="noopener">
              <span className="iletisim-ikon">
                <TgIkon />
              </span>
              <h2>Telegram Genel Grup</h2>
              <b>@{SITE.telegramGrup}</b>
              <p>
                Diğer kullanıcılarla sohbet et, sorularını sor, yeni sürüm duyurularını ilk
                sen gör.
              </p>
              <span className="iletisim-git">Gruba katıl →</span>
            </a>

            <a className="iletisim-kart one" href={SITE.telegramUrl} target="_blank" rel="noopener">
              <span className="iletisim-ikon">
                <TgIkon />
              </span>
              <h2>Telegram Admin</h2>
              <b>@{SITE.telegram}</b>
              <p>
                Satın alma, lisans anahtarı, kurulum yardımı ve teknik destek. Satış
                yalnızca bu hesaptan yapılır.
              </p>
              <span className="iletisim-git">Admine yaz →</span>
            </a>

            <a className="iletisim-kart ig" href={SITE.instagramUrl} target="_blank" rel="noopener">
              <span className="iletisim-ikon">
                <IgIkon />
              </span>
              <h2>Instagram</h2>
              <b>@{SITE.instagram}</b>
              <p>Bot kayıtları, yeni özellikler ve kısa videolar burada paylaşılıyor.</p>
              <span className="iletisim-git">Takip et →</span>
            </a>
          </div>

          <div className="uyari-kutu">
            <b>Dolandırıcılığa dikkat</b>
            <p>
              Satış ve lisans işlemleri <b>yalnızca @{SITE.telegram}</b> hesabından yapılır.
              Grupta veya başka bir yerde biri sana özelden satış teklif ederse bize
              danışmadan ödeme yapma.
            </p>
          </div>
        </div>
      </article>

      <Alt />
    </>
  );
}
