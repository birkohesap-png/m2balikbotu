import Link from 'next/link';
import { SITE } from '@/lib/site';
import { JsonLd, sayfaMeta, kirintiSemasi } from '@/lib/seo';
import TelegramSec from '../TelegramSec';
import Ust from '../Ust';
import Alt from '../Alt';

const ACIKLAMA =
  'Metin2 balık botu, balık tutma işlemini oyuncu yerine otomatik yapan yardımcı ' +
  'programdır. Nasıl çalıştığını, ne işe yaradığını ve güvenli kullanımını adım adım ' +
  'anlattık.';

export const metadata = sayfaMeta({
  baslik: 'Metin2 Balık Botu Nedir, Nasıl Çalışır?',
  aciklama: ACIKLAMA,
  yol: '/metin2-balik-botu-nedir',
  tip: 'article',
});

const SEMA = [
  kirintiSemasi([{ ad: 'Metin2 Balık Botu Nedir?', yol: '/metin2-balik-botu-nedir' }]),
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Metin2 Balık Botu Nedir, Nasıl Çalışır?',
    description: ACIKLAMA,
    inLanguage: 'tr',
    datePublished: '2026-08-13',
    dateModified: '2026-09-07',
    author: { '@id': SITE.url + '/#kurum' },
    publisher: { '@id': SITE.url + '/#kurum' },
    image: [SITE.url + '/logo.png'],
    mainEntityOfPage: SITE.url + '/metin2-balik-botu-nedir',
    about: [
      { '@type': 'Thing', name: 'Metin2 balık botu' },
      { '@type': 'Thing', name: 'Metin2 fish bot' },
      { '@type': 'VideoGame', name: 'Metin2' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Metin2 balık botu nasıl balık tutar?',
    inLanguage: 'tr',
    step: [
      'Oltayı suya atar ve balığın gelmesini bekler.',
      'Balık ekranı açılınca balığın adını okur.',
      'Seçtiğin balıklar listedeyse tutar, değilse bırakır.',
      'Çöp balıkları envanterden yere atar, değerli olanları saklar.',
      'Envanter dolunca karaya çekilip kamp ateşinde balıkları pişirir.',
      'Balık Yapboz etkinliğini en az denemeyle otomatik bitirir.',
    ].map((t, i) => ({ '@type': 'HowToStep', position: i + 1, text: t })),
  },
];

export default function NedirSayfa() {
  return (
    <>
      <JsonLd veri={SEMA} />
      <Ust />

      <article className="ic-sayfa">
        <div className="sar">
          <nav className="kirinti" aria-label="Sayfa yolu">
            <Link href="/">Ana Sayfa</Link>
            <span>/</span>
            <span>Metin2 Balık Botu Nedir?</span>
          </nav>

          <span className="etiket">Bilgi</span>
          <h1>
            Metin2 Balık Botu <span className="altin-yazi">nedir, nasıl çalışır?</span>
          </h1>

          <div className="nedir-govde" style={{ marginTop: 26 }}>
            <p className="nedir-tanim">
              <strong>Metin2 balık botu</strong>, Metin2 oyununda balık tutma işlemini oyuncu
              yerine otomatik yapan yardımcı programdır. Oltayı kendisi atar, balık ekranını
              okur ve balığı tutar; böylece oyuncu bilgisayar başında beklemek zorunda kalmaz.
            </p>
            <p>
              <strong>K34 Balık Botu</strong>, Metin2 için Türkçe geliştirilmiş bir balık
              botudur. Windows 10 ve 11’de çalışır, kurulum gerektirmez ve tek bir{' '}
              <code>.exe</code> dosyasıdır.
            </p>

            <h2>Metin2 balık botu ne işe yarar?</h2>
            <p>
              Balık tutmak Metin2’de tekrar eden ve uzun süren bir işlemdir. Bot bu işi
              7/24 yaparak oyuncunun yerine balık, Yabbie Yengeci, Altın Sudak ve Balık
              Yapboz sandığı biriktirir. Aylık pakette günde yaklaşık{' '}
              <strong>160 WON</strong> kasma imkânı sağlar.
            </p>

            <h2>Nasıl çalışır?</h2>
            <ol className="nedir-adim">
              <li>Oltayı suya atar ve balığın gelmesini bekler.</li>
              <li>Balık ekranı açılınca balığın adını okur.</li>
              <li>Seçtiğin balıklar listedeyse tutar, değilse bırakır.</li>
              <li>Çöp balıkları envanterden yere atar, değerli olanları saklar.</li>
              <li>Envanter dolunca karaya çekilip kamp ateşinde balıkları pişirir.</li>
              <li>
                <Link href="/yapboz-botu" className="ic-link">
                  Balık Yapboz etkinliğini
                </Link>{' '}
                en az denemeyle otomatik bitirir.
              </li>
            </ol>

            <h2>Güvenli mi?</h2>
            <p>
              Bot oyunun dosyalarına dokunmaz, hafızasına müdahale etmez. Sadece ekranı
              okur ve fareyi insan gibi kademeli hareket ettirir — ışınlanma yoktur.
              Tıklama aralıkları rastgeledir, bu yüzden makine ritmi bırakmaz. Anti-cheat
              sistemlerinin taradığı bellek okuma, DLL enjeksiyonu ve dosya değişikliği
              yöntemlerinin hiçbirini kullanmaz.
            </p>
            <p>
              En güvenli kullanım için aylık pakette bilgisayarına bypass’lı sanal
              makineleri biz kuruyoruz; Metin2 ve bot sanal makinenin içinde çalıştığı için
              ana bilgisayarındaki hesaplarınla hiçbir bağı olmaz.
            </p>

            <h2>Hangi balıkları tutar?</h2>
            <p>
              Hangi balıkların tutulacağını balık filtresinden sen seçersin. İstemediğin
              balıkları bot envanterden yere atar, böylece envanterin sadece işine yarayan
              balıklarla dolar. Yabbie Yengeci, Altın Sudak ve diğer değerli balıklar
              listeye eklenebilir.
            </p>

            <h2>Özet bilgiler</h2>
            <div className="nedir-tablo-sar">
              <table className="nedir-tablo">
                <tbody>
                  <tr><th>Ürün adı</th><td>K34 Metin2 Balık Botu</td></tr>
                  <tr><th>Oyun</th><td>Metin2 (Gameforge TR ve PVP sunucuları)</td></tr>
                  <tr><th>İşletim sistemi</th><td>Windows 10 / Windows 11</td></tr>
                  <tr><th>Kurulum</th><td>Gerekmez — tek .exe dosyası</td></tr>
                  <tr><th>Dil</th><td>Türkçe</td></tr>
                  <tr><th>Fiyat</th><td>Günlük 300₺ · Haftalık 1300₺ · Aylık 2500₺</td></tr>
                  <tr><th>Satış / destek</th><td>Telegram @{SITE.telegram}</td></tr>
                  <tr><th>İade</th><td>Beğenmezsen para iadesi</td></tr>
                </tbody>
              </table>
            </div>

            <p style={{ marginTop: 24 }}>
              Daha fazla soru için{' '}
              <Link href="/sss" className="ic-link">
                sıkça sorulan sorular
              </Link>{' '}
              sayfasına, yeni özellikler için{' '}
              <Link href="/guncellemeler" className="ic-link">
                güncellemeler
              </Link>{' '}
              sayfasına bakabilirsin.
            </p>
          </div>

          <div className="serit" style={{ marginTop: 40 }}>
            <h2 style={{ marginTop: 0 }}>
              Botu <span className="altin-yazi">denemek ister misin?</span>
            </h2>
            <p>Beğenmezsen para iadesi yapıyoruz. Risk sende değil, bizde.</p>
            <TelegramSec etiket="Telegram’dan Satın Al" sinif="btn btn-altin" />
          </div>
        </div>
      </article>

      <Alt />
    </>
  );
}
