import Link from 'next/link';
import { SITE, GUNCELLEMELER } from '@/lib/site';
import { JsonLd, sayfaMeta, kirintiSemasi } from '@/lib/seo';
import Ust from '../Ust';
import Alt from '../Alt';

export const metadata = sayfaMeta({
  baslik: 'Güncellemeler — K34 Metin2 Balık Botu Sürüm Notları',
  aciklama:
    'K34 Metin2 Balık Botu sürüm notları. Balık Yapboz botu, insansı vuruş hareketi, ' +
    'mini panel, MultiAcc ve Telegram karakter takibi gibi yeniliklerin tam listesi.',
  yol: '/guncellemeler',
});

const tarihYaz = (t) =>
  new Date(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

const SEMA = [
  kirintiSemasi([{ ad: 'Güncellemeler', yol: '/guncellemeler' }]),
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'K34 Metin2 Balık Botu sürüm notları',
    inLanguage: 'tr',
    itemListElement: GUNCELLEMELER.map((g, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `v${g.surum} — ${g.baslik}`,
      url: SITE.url + '/guncellemeler#v' + g.surum,
    })),
  },
];

export default function GuncellemelerSayfa() {
  return (
    <>
      <JsonLd veri={SEMA} />
      <Ust />

      <article className="ic-sayfa">
        <div className="sar">
          <nav className="kirinti" aria-label="Sayfa yolu">
            <Link href="/">Ana Sayfa</Link>
            <span>/</span>
            <span>Güncellemeler</span>
          </nav>

          <span className="etiket">Sürüm Notları</span>
          <h1>
            Bota gelen <span className="altin-yazi">güncellemeler</span>
          </h1>
          <p className="ic-giris">
            Botu sürekli geliştiriyoruz. Yeni özellikler mevcut lisansına ek ücret olmadan
            gelir — güncel sürümü Telegram’dan alman yeterli.
          </p>

          <ol className="surum-listesi">
            {GUNCELLEMELER.map((g) => (
              <li key={g.surum} id={'v' + g.surum} className={g.yeni ? 'yeni' : ''}>
                <div className="surum-bas">
                  <span className="surum-no">v{g.surum}</span>
                  {g.yeni && <span className="surum-rozet">YENİ</span>}
                  <time dateTime={g.tarih}>{tarihYaz(g.tarih)}</time>
                </div>
                <h2>{g.baslik}</h2>
                <ul>
                  {g.maddeler.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          <p style={{ marginTop: 34 }}>
            En son eklenen <Link href="/yapboz-botu" className="ic-link">Balık Yapboz botunu</Link>{' '}
            ayrıntılı incelemek istersen kendi sayfasında video kaydıyla anlattık.
            Duyuruları anında görmek için Telegram grubumuza{' '}
            <a href={SITE.telegramGrupUrl} target="_blank" rel="noopener" className="ic-link">
              @{SITE.telegramGrup}
            </a>{' '}
            katılabilirsin.
          </p>
        </div>
      </article>

      <Alt />
    </>
  );
}
