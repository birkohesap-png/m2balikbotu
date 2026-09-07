import Link from 'next/link';
import { SSS } from '@/lib/site';
import { JsonLd, sayfaMeta, kirintiSemasi } from '@/lib/seo';
import TelegramSec from '../TelegramSec';
import Ust from '../Ust';
import Alt from '../Alt';

export const metadata = sayfaMeta({
  baslik: 'Sıkça Sorulan Sorular — Metin2 Balık Botu',
  aciklama:
    'Metin2 balık botu hakkında merak edilenler: ban riski, kaç bilgisayarda çalışır, ' +
    'yapboz botu, sanal makine kurulumu, ödeme, iade ve destek soruları.',
  yol: '/sss',
});

/* FAQPage semasi SADECE bu sayfada. Ayni SSS icerigini birden fazla sayfada
   isaretlemek Google tarafindan yinelenen isaretleme sayilir. */
const SEMA = [
  kirintiSemasi([{ ad: 'Sıkça Sorulan Sorular', yol: '/sss' }]),
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'tr',
    mainEntity: SSS.map((x) => ({
      '@type': 'Question',
      name: x.s,
      acceptedAnswer: { '@type': 'Answer', text: x.c },
    })),
  },
];

export default function SssSayfa() {
  return (
    <>
      <JsonLd veri={SEMA} />
      <Ust />

      <article className="ic-sayfa">
        <div className="sar">
          <nav className="kirinti" aria-label="Sayfa yolu">
            <Link href="/">Ana Sayfa</Link>
            <span>/</span>
            <span>S.S.S.</span>
          </nav>

          <span className="etiket">Sıkça Sorulan Sorular</span>
          <h1>
            Aklındaki <span className="altin-yazi">soruların cevabı</span>
          </h1>
          <p className="ic-giris">
            Metin2 balık botu hakkında en çok sorulan sorular ve net cevapları. Aradığını
            bulamazsan Telegram’dan yazman yeterli.
          </p>

          <div className="sss" style={{ marginTop: 30 }}>
            {SSS.map((x) => (
              <details key={x.s}>
                <summary>{x.s}</summary>
                <p>{x.c}</p>
              </details>
            ))}
          </div>

          <div className="serit" style={{ marginTop: 40 }}>
            <h2 style={{ marginTop: 0 }}>
              Cevabını <span className="altin-yazi">bulamadın mı?</span>
            </h2>
            <p>Telegram’dan yaz, 7/24 yanındayız.</p>
            <TelegramSec etiket="Telegram’dan Sor" sinif="btn btn-altin" />
          </div>
        </div>
      </article>

      <Alt />
    </>
  );
}
