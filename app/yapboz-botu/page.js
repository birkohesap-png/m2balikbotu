import Link from 'next/link';
import { SITE, YAPBOZ } from '@/lib/site';
import { JsonLd, sayfaMeta, kirintiSemasi } from '@/lib/seo';
import { Tik } from '../Ikonlar';
import TelegramSec from '../TelegramSec';
import Ust from '../Ust';
import Alt from '../Alt';

const ACIKLAMA =
  'Metin2 Balık Yapboz botu: sandığı tahtaya kendisi sürükler, onayı geçer, parçanın ' +
  'şeklini tanır ve önceden çözülmüş karar tablosundan en iyi hamleyi oynar. Gerçek ' +
  'bot kaydını izle.';

export const metadata = sayfaMeta({
  baslik: 'Metin2 Balık Yapboz Botu — Etkinliği Otomatik Oynar',
  aciklama: ACIKLAMA,
  yol: '/yapboz-botu',
  gorsel: YAPBOZ.video.poster,
});

const SEMA = [
  kirintiSemasi([{ ad: 'Balık Yapboz Botu', yol: '/yapboz-botu' }]),
  {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: YAPBOZ.video.baslik,
    description: YAPBOZ.video.aciklama,
    thumbnailUrl: [SITE.url + YAPBOZ.video.poster],
    contentUrl: SITE.url + YAPBOZ.video.src,
    uploadDate: YAPBOZ.video.tarih,
    duration: 'PT' + YAPBOZ.video.saniye + 'S',
    width: YAPBOZ.video.genislik,
    height: YAPBOZ.video.yukseklik,
    inLanguage: 'tr',
    isFamilyFriendly: true,
    publisher: { '@id': SITE.url + '/#kurum' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Metin2 Balık Yapboz etkinliği botla nasıl otomatik oynanır?',
    description: ACIKLAMA,
    inLanguage: 'tr',
    totalTime: 'PT2M',
    step: YAPBOZ.adimlar.map((a, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: a.baslik,
      text: a.metin,
      url: SITE.url + '/yapboz-botu#adim-' + (i + 1),
    })),
  },
];

export default function YapbozSayfa() {
  return (
    <>
      <JsonLd veri={SEMA} />
      <Ust />

      <article className="ic-sayfa">
        <div className="sar">
          <nav className="kirinti" aria-label="Sayfa yolu">
            <Link href="/">Ana Sayfa</Link>
            <span>/</span>
            <span>Balık Yapboz Botu</span>
          </nav>

          <span className="etiket">★ {YAPBOZ.ustBaslik}</span>
          <h1>
            Metin2 <span className="altin-yazi">Balık Yapboz Botu</span>
          </h1>
          <p className="ic-giris">{YAPBOZ.ozet}</p>

          {/* ---- video ---- */}
          <figure className="yapboz-figur">
            <video
              className="video-genis"
              src={YAPBOZ.video.src}
              poster={YAPBOZ.video.poster}
              width={YAPBOZ.video.genislik}
              height={YAPBOZ.video.yukseklik}
              controls
              preload="metadata"
              playsInline
              muted
              loop
              aria-label={YAPBOZ.video.baslik}
            />
            <figcaption>{YAPBOZ.video.aciklama}</figcaption>
          </figure>

          {/* ---- adimlar ---- */}
          <h2>Yapboz botu nasıl çalışır?</h2>
          <ol className="yapboz-adimlar genis">
            {YAPBOZ.adimlar.map((a, i) => (
              <li key={a.baslik} id={'adim-' + (i + 1)}>
                <span className="yapboz-no">{i + 1}</span>
                <div>
                  <h3>{a.baslik}</h3>
                  <p>{a.metin}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* ---- notlar ---- */}
          <h2>Bilmen gerekenler</h2>
          <div className="yapboz-notlar sol">
            {YAPBOZ.notlar.map((n) => (
              <span key={n}>
                <Tik /> {n}
              </span>
            ))}
          </div>

          <h2>Neden elle oynamaktan iyi?</h2>
          <p>
            Balık Yapboz’da her yanlış yerleştirme bir parçayı boşa harcar. Tahtanın
            alabileceği bütün durumlar önceden hesaplanıp bir karar tablosuna yazıldığı
            için bot tahmin yürütmez: elindeki parçayı, kalan tahtayı bitirme ihtimalini
            en yükseğe çıkaracak yere koyar. Sonuç olarak aynı sayıda sandıkla elle
            oynadığından daha fazla tahta bitirirsin — ve başında beklemen gerekmez.
          </p>

          <p>
            Yapboz modülü{' '}
            <Link href="/#fiyatlar" className="ic-link">
              tüm paketlerde
            </Link>{' '}
            açıktır. Botun geri kalan özelliklerini{' '}
            <Link href="/metin2-balik-botu-nedir" className="ic-link">
              Metin2 balık botu nedir?
            </Link>{' '}
            sayfasında bulabilir, sürüm notlarını{' '}
            <Link href="/guncellemeler" className="ic-link">
              güncellemeler
            </Link>{' '}
            sayfasından takip edebilirsin.
          </p>

          <div className="serit" style={{ marginTop: 40 }}>
            <h2 style={{ marginTop: 0 }}>
              Yapboz botunu <span className="altin-yazi">bugün kullan</span>
            </h2>
            <p>Mevcut lisansın varsa güncellemeyle otomatik gelir, ek ücret yok.</p>
            <TelegramSec etiket="Telegram’dan Satın Al" sinif="btn btn-altin" />
          </div>
        </div>
      </article>

      <Alt />
    </>
  );
}
