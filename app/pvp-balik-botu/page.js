import Link from 'next/link';
import { SITE, PVP, VIDEOLAR, IADE } from '@/lib/site';
import { JsonLd, sayfaMeta, kirintiSemasi, youtubeVideoSemasi } from '@/lib/seo';
import { Ikon, Tik } from '../Ikonlar';
import TelegramSec from '../TelegramSec';
import Ust from '../Ust';
import Alt from '../Alt';

const ACIKLAMA =
  'Metin2 PvP balık botu: K34 PvP, Rascal dahil koruma sistemli PvP sunucularında çalışır. ' +
  'Client seçimi, kırmızı halka minigame, otomatik envanter bakımı, MultiAcc. Günlük limit ' +
  've hafta sonu kısıtı yok.';

export const metadata = sayfaMeta({
  baslik: 'Metin2 PvP Balık Botu — Rascal Dahil Çalışır',
  aciklama: ACIKLAMA,
  yol: '/pvp-balik-botu',
  gorsel: 'https://i.ytimg.com/vi/' + VIDEOLAR.pvp.id + '/hqdefault.jpg',
});

/* PvP'ye ozel SSS. FAQPage semasi yalnizca /sss sayfasinda oldugu icin burada
   sadece gorunur metin olarak durur (ayni SSS'yi iki sayfada isaretlemeyiz). */
const PVP_SSS = [
  {
    s: 'K34 PvP hangi sunucularda çalışır?',
    c: 'Metin2 PvP sunucularında çalışır; Rascal dahil koruma sistemi kullanan sunucular da buna dahildir. Bot oyunun belleğine ya da dosyalarına dokunmaz, ekrana bakıp fare ve klavye kullanır.',
  },
  {
    s: 'TR anahtarım PvP botunda çalışır mı?',
    c: 'Hayır. Her anahtar tek bir sürüm içindir: TR anahtarı TR botunda, PvP anahtarı PvP botunda çalışır. Anahtar alırken PvP sürümünü istediğini belirtmen yeterli.',
  },
  {
    s: 'PvP sürümünde günlük limit veya hafta sonu kısıtı var mı?',
    c: 'Hayır. Günlük 14 saat çalışma sınırı ve hafta sonu kısıtı yalnızca TR sürümünde vardır; PvP sürümünde bot istediğin kadar çalışır.',
  },
  {
    s: 'TR ve PvP botunu aynı bilgisayarda kullanabilir miyim?',
    c: 'Evet. İki sürüm ayrı programlardır ve aynı bilgisayara yan yana kurulur; birinin kurulumu ya da güncellemesi diğerini etkilemez.',
  },
  {
    s: 'Balık Yapboz botu PvP sürümünde var mı?',
    c: 'Hayır. Balık Yapboz botu Gameforge TR sunucularındaki etkinlik içindir ve TR sürümündedir. PvP sürümü balık tutma, kırmızı halka minigame ve envanter bakımına odaklanır.',
  },
];

const SEMA = [
  kirintiSemasi([{ ad: 'PvP Balık Botu', yol: '/pvp-balik-botu' }]),
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': SITE.url + '/pvp-balik-botu#urun',
    name: PVP.ad,
    alternateName: ['Metin2 PvP Balık Botu', 'K34 PvP', 'Metin2 PvP Fish Bot'],
    applicationCategory: 'GameApplication',
    operatingSystem: 'Windows 10, Windows 11',
    inLanguage: 'tr',
    description: ACIKLAMA,
    url: SITE.url + '/pvp-balik-botu',
    image: SITE.url + '/logo.png',
    publisher: { '@id': SITE.url + '/#kurum' },
    featureList: PVP.ozellikler.map((o) => o.baslik),
  },
  youtubeVideoSemasi(VIDEOLAR.pvp),
];

export default function PvpSayfa() {
  return (
    <>
      <JsonLd veri={SEMA} />
      <Ust />

      <article className="ic-sayfa">
        <div className="sar">
          <nav className="kirinti" aria-label="Sayfa yolu">
            <Link href="/">Ana Sayfa</Link>
            <span>/</span>
            <span>PvP Balık Botu</span>
          </nav>

          <span className="etiket etiket-pvp">★ {PVP.ustBaslik}</span>
          <h1>
            Metin2 <span className="pvp-yazi">PvP Balık Botu</span> — K34 PvP
          </h1>
          <p className="ic-giris">{PVP.ozet}</p>

          {/* ---- tanitim videosu ---- */}
          <figure className="pvp-figur">
            <div className="video-cerceve">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${VIDEOLAR.pvp.id}`}
                title={VIDEOLAR.pvp.baslik}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
            <figcaption>{VIDEOLAR.pvp.aciklama}</figcaption>
          </figure>

          {/* ---- ozellikler ---- */}
          <h2>K34 PvP neler yapar?</h2>
          <div className="izgara iz-3" style={{ marginTop: 18 }}>
            {PVP.ozellikler.map((o) => (
              <article className="kart" key={o.baslik}>
                <Ikon ad={o.ikon} />
                <h3>{o.baslik}</h3>
                <p>{o.metin}</p>
              </article>
            ))}
          </div>

          {/* ---- TR / PvP farki ---- */}
          <h2>TR sürümünden farkı</h2>
          <div className="nedir-tablo-sar">
            <table className="nedir-tablo pvp-tablo">
              <thead>
                <tr>
                  <th />
                  <th>K34 TR</th>
                  <th>K34 PvP</th>
                </tr>
              </thead>
              <tbody>
                {PVP.farklar.map(([ad, tr, pvp]) => (
                  <tr key={ad}>
                    <th>{ad}</th>
                    <td>{tr}</td>
                    <td>{pvp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ---- PvP SSS ---- */}
          <h2>PvP sürümü hakkında sorular</h2>
          <div className="sss" style={{ marginTop: 16 }}>
            {PVP_SSS.map((x) => (
              <details key={x.s}>
                <summary>{x.s}</summary>
                <p>{x.c}</p>
              </details>
            ))}
          </div>

          <div className="yapboz-notlar sol" style={{ marginTop: 26 }}>
            <span>
              <Tik /> Günlük, Haftalık ve Aylık paketlerle verilir — anahtar alırken PvP’yi belirt.
            </span>
            <span>
              <Tik /> {IADE.kisa}.
            </span>
            <span>
              <Tik /> 7/24 Telegram desteği: @{SITE.telegram}
            </span>
          </div>

          <p style={{ marginTop: 26 }}>
            Gameforge TR sunucularında oynuyorsan{' '}
            <Link href="/" className="ic-link">
              K34 Metin2 Balık Botu
            </Link>{' '}
            ve{' '}
            <Link href="/yapboz-botu" className="ic-link">
              Balık Yapboz botu
            </Link>{' '}
            sana göre. Sürüm notları için{' '}
            <Link href="/guncellemeler" className="ic-link">
              güncellemeler
            </Link>{' '}
            sayfasına bakabilirsin.
          </p>

          <div className="serit" style={{ marginTop: 40 }}>
            <h2 style={{ marginTop: 0 }}>
              PvP sunucunda <span className="pvp-yazi">balığı bota bırak</span>
            </h2>
            <p>Anahtarın dakikalar içinde elinde. Kurulumda bire bir yardımcı oluyoruz.</p>
            <TelegramSec
              etiket="Telegram’dan PvP Anahtarı Al"
              sinif="btn btn-pvp"
              mesaj="Merhaba, K34 PvP Balık Botu için anahtar almak istiyorum."
            />
          </div>
        </div>
      </article>

      <Alt />
    </>
  );
}
