import Link from 'next/link';
import { SITE, GUNCELLEMELER } from '@/lib/site';
import { JsonLd, sayfaMeta, kirintiSemasi } from '@/lib/seo';
import Ust from '../Ust';
import Alt from '../Alt';

export const metadata = sayfaMeta({
  baslik: 'Güncellemeler — K34 Metin2 Balık Botu Sürüm Notları',
  aciklama:
    'K34 Metin2 Balık Botu ve K34 PvP sürüm notları: Telegram’dan tam kontrol, GM nöbeti, ' +
    'Balık Yapboz botu, PvP sürümü, MultiAcc ve güvenlik yeniliklerinin tam listesi.',
  yol: '/guncellemeler',
});

// PvP surumleri ayni listede; etiket ve capa (id) urune gore ayrilir.
const etiket = (g) => (g.urun === 'pvp' ? 'PvP v' : 'v') + g.surum;
const capa = (g) => (g.urun === 'pvp' ? 'pvp-v' : 'v') + g.surum;

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
      name: `${etiket(g)} — ${g.baslik}`,
      url: SITE.url + '/guncellemeler#' + capa(g),
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
            gelir — bot yeni sürümü açılışta kendisi indirip kurar.
          </p>

          <ol className="surum-listesi">
            {GUNCELLEMELER.map((g) => (
              <li key={capa(g)} id={capa(g)} className={g.yeni ? 'yeni' : ''}>
                <div className="surum-bas">
                  <span className="surum-no">{etiket(g)}</span>
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
            <Link href="/yapboz-botu" className="ic-link">Balık Yapboz botunu</Link> ve{' '}
            <Link href="/pvp-balik-botu" className="ic-link">K34 PvP sürümünü</Link> ayrıntılı
            incelemek istersen kendi sayfalarında video kaydıyla anlattık.
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
