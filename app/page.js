import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { SITE, PAKETLER, OZELLIKLER, SSS, GUVENLIK, IADE, YAPBOZ } from '@/lib/site';
import { JsonLd, sayfaMeta } from '@/lib/seo';
import { Ikon, Tik, TgIkon, IgIkon } from './Ikonlar';
import TelegramSec from './TelegramSec';
import Ust from './Ust';
import Alt from './Alt';
import Galeri from './Galeri';

export const metadata = sayfaMeta({
  baslik: 'Metin2 Balık Botu | K34 — Otomatik Balık Tutma ve Yapboz Botu',
  aciklama:
    'Metin2 balık botu — K34 ile 7/24 otomatik balık tut, balıkları pişir ve Balık Yapboz ' +
    'etkinliğini en az denemeyle bitir. İnsansı fare hareketi, MultiAcc, Auto Login ve ' +
    '7/24 Telegram desteği.',
  yol: '/',
});

/* public/galeri klasorune ATTIGIN her gorsel otomatik listelenir.
   Dosya adi basliga donusur:  "01-ana-ekran.png"  ->  "Ana ekran" */
function galeriOku() {
  try {
    const kls = path.join(process.cwd(), 'public', 'galeri');
    return fs
      .readdirSync(kls)
      .filter((f) => /\.(png|jpe?g|webp|gif|avif)$/i.test(f))
      .sort()
      .map((f) => ({
        src: '/galeri/' + f,
        baslik: f
          .replace(/\.[^.]+$/, '')
          .replace(/^\d+[-_\s]*/, '')
          .replace(/[-_]+/g, ' ')
          .replace(/^\w/, (c) => c.toUpperCase()),
      }));
  } catch {
    return [];
  }
}

/* Ana sayfaya OZEL semalar. Kurum/WebSite semasi app/layout.js icindedir. */
const SEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': SITE.url + '/#urun',
    name: 'K34 Metin2 Balık Botu',
    alternateName: ['Metin2 Balık Botu', 'Metin2 Fish Bot', 'Metin2 Fishing Bot', 'K34 Balık Botu'],
    applicationCategory: 'GameApplication',
    operatingSystem: 'Windows 10, Windows 11',
    inLanguage: 'tr',
    description:
      'Metin2 için otomatik balık tutma botu. Oltayı atar, balığı tutar, balıkları pişirir ' +
      've Balık Yapboz etkinliğini matematiksel olarak en iyi hamlelerle bitirir.',
    url: SITE.url,
    image: SITE.url + '/logo.png',
    softwareVersion: '2.1',
    datePublished: '2026-08-13',
    dateModified: YAPBOZ.video.tarih,
    publisher: { '@id': SITE.url + '/#kurum' },
    featureList: [
      'Otomatik balık tutma',
      'Balık Yapboz etkinliği otomatik oynama',
      'Otomatik pişirme',
      'Auto Login ve DC koruması',
      'MultiAcc çoklu pencere',
      'Telegram uzaktan kontrol',
      'İnsansı fare hareketi',
      'Balık filtresi',
    ],
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'TRY',
      lowPrice: String(Math.min(...PAKETLER.map((p) => p.fiyat))),
      highPrice: String(Math.max(...PAKETLER.map((p) => p.fiyat))),
      offerCount: String(PAKETLER.length),
      availability: 'https://schema.org/InStock',
      url: SITE.url + '/#fiyatlar',
      offers: PAKETLER.map((p) => ({
        '@type': 'Offer',
        name: p.ad + ' Paket',
        price: String(p.fiyat),
        priceCurrency: 'TRY',
        availability: 'https://schema.org/InStock',
        url: SITE.url + '/#fiyatlar',
        description: `${p.sure} kullanım, ${p.cihaz} bilgisayar`,
      })),
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '187',
      bestRating: '5',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: 'Metin2 Balık Botu ile 1000+ Yabbie Yengeci — canlı bot kaydı',
    description:
      'K34 Metin2 Balık Botu başında beklemeden 1000’den fazla Yabbie Yengeci topluyor. ' +
      'Bot oltayı atar, balığı tutar, filtredeki balıkları saklar, çöp balıkları yere atar ve pişirir.',
    thumbnailUrl: [SITE.url + '/video/1000-yabbi-poster.jpg'],
    contentUrl: SITE.url + '/video/1000-yabbi.mp4',
    uploadDate: '2026-08-13',
    duration: 'PT19S',
    inLanguage: 'tr',
    isFamilyFriendly: true,
    publisher: { '@id': SITE.url + '/#kurum' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: 'Metin2 TR Balık Botu Nasıl Kullanılır? Kurulum ve Ayarlar (2026)',
    description:
      'K34 Metin2 Balık Botu tanıtım videosu: kurulum, ayarlar, balık filtresi, otomatik pişirme ' +
      've Balık Yapboz özelliklerinin adım adım anlatımı.',
    thumbnailUrl: ['https://i.ytimg.com/vi/' + SITE.youtubeId + '/maxresdefault.jpg'],
    embedUrl: 'https://www.youtube.com/embed/' + SITE.youtubeId,
    contentUrl: 'https://www.youtube.com/watch?v=' + SITE.youtubeId,
    uploadDate: '2026-08-26',
    inLanguage: 'tr',
    isFamilyFriendly: true,
    publisher: { '@id': SITE.url + '/#kurum' },
  },
];

export default function AnaSayfa() {
  const gorseller = galeriOku();
  const sssOzet = SSS.slice(0, 6);

  return (
    <>
      <JsonLd veri={SEMA} />
      <Ust />

      {/* ---------------- hero ---------------- */}
      <section className="hero">
        <div className="sar hero-ic">
          <div>
            <span className="etiket">● 7/24 AKTİF · TÜRKİYE’NİN BALIK BOTU</span>
            <h1>
              <span className="altin-yazi">Metin2 Balık Botu</span>
              <br />
              sen uyurken bile farm yapar
            </h1>
            <p className="aciklama">
              K34 Balık Botu; oltayı atar, balığı insan gibi yakalar, envanter dolunca
              kamp ateşinde pişirir ve <b>Balık Yapboz</b> etkinliğini matematiksel olarak
              en iyi hamlelerle bitirir. <b style={{ color: 'var(--altin2)' }}>Aylık pakette
              günlük 160 WON kasma imkanı.</b>
            </p>
            <div className="hero-btn">
              <TelegramSec etiket="Telegram’dan Satın Al" sinif="btn btn-altin" />
              <a className="btn btn-hayalet" href="#fiyatlar">
                Fiyatları Gör
              </a>
            </div>
            <div className="guven">
              <div>
                <b>7/24</b>Telegram desteği
              </div>
              <div>
                <b>6</b>bilgisayara kadar
              </div>
              <div>
                <b>VM</b>kurulumu dahil
              </div>
              <div>
                <b>%100</b>Türkçe arayüz
              </div>
            </div>
          </div>
          <div className="hero-gorsel">
            <div className="hero-halka" />
            <img
              className="hero-logo"
              src="/logo.png"
              alt="Metin2 Balık Botu K34 — otomatik balık tutma botu"
              width="340"
              height="340"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      {/* ---------------- ozellikler ---------------- */}
      <section className="bolum" id="ozellikler">
        <div className="sar">
          <div className="bolum-bas">
            <span className="etiket">Özellikler</span>
            <h2>
              Bir botun yapması gereken <span className="altin-yazi">her şey</span>
            </h2>
            <p>
              Metin2 balık botu denince akla gelen tüm ihtiyaçlar tek programda —
              üstelik yakalanma riskini düşüren insansı davranış motoruyla.
            </p>
          </div>
          <div className="izgara iz-4">
            {OZELLIKLER.map((o) => (
              <article className="kart" key={o.baslik}>
                <Ikon ad={o.ikon} />
                <h3>{o.baslik}</h3>
                <p>{o.metin}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- YAPBOZ BOTU (yeni modul) ---------------- */}
      <section className="bolum" id="yapboz" style={{ paddingTop: 0 }}>
        <div className="sar">
          <div className="bolum-bas">
            <span className="etiket">★ {YAPBOZ.ustBaslik}</span>
            <h2>
              <span className="altin-yazi">Balık Yapboz</span> etkinliğini de bot oynuyor
            </h2>
            <p>{YAPBOZ.ozet}</p>
          </div>

          <div className="yapboz-ic">
            <div className="yapboz-video">
              <video
                className="video-genis"
                src={YAPBOZ.video.src}
                poster={YAPBOZ.video.poster}
                width={YAPBOZ.video.genislik}
                height={YAPBOZ.video.yukseklik}
                controls
                preload="none"
                playsInline
                muted
                loop
                aria-label={YAPBOZ.video.baslik}
              />
              <p className="video-alt" style={{ marginTop: 14 }}>
                Gerçek kayıt: bot sandığı sürüklüyor, onayı geçiyor ve parçayı yerleştiriyor.
              </p>
            </div>

            <ol className="yapboz-adimlar">
              {YAPBOZ.adimlar.map((a, i) => (
                <li key={a.baslik}>
                  <span className="yapboz-no">{i + 1}</span>
                  <div>
                    <h3>{a.baslik}</h3>
                    <p>{a.metin}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="yapboz-notlar">
            {YAPBOZ.notlar.map((n) => (
              <span key={n}>
                <Tik /> {n}
              </span>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 26 }}>
            <Link className="btn btn-hayalet" href="/yapboz-botu">
              Yapboz botunu detaylı incele →
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- guvenlik / ban ---------------- */}
      <section className="bolum" id="guvenlik" style={{ paddingTop: 0 }}>
        <div className="sar">
          <div className="kalkan">
            <div className="kalkan-sol">
              <span className="etiket">Güvenlik</span>
              <h2 style={{ fontSize: 'clamp(26px,3.6vw,38px)', margin: '16px 0 14px' }}>
                {GUVENLIK.ustBaslik}
                <br />
                <span className="altin-yazi">{GUVENLIK.baslik}</span>
              </h2>
              <p style={{ color: 'var(--gri)', fontSize: 15 }}>{GUVENLIK.giris}</p>
              <div className="rozetler">
                <span>Bellek okuma yok</span>
                <span>DLL enjeksiyonu yok</span>
                <span>Dosya değişikliği yok</span>
                <span>Sanal makine desteği</span>
              </div>
            </div>
            <div className="kalkan-sag">
              {GUVENLIK.maddeler.map((m) => (
                <div className="kalkan-madde" key={m.baslik}>
                  <span className="kalkan-tik">
                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </span>
                  <div>
                    <h3>{m.baslik}</h3>
                    <p>{m.metin}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- tanitim videosu ---------------- */}
      <section className="bolum" id="video" style={{ paddingTop: 0 }}>
        <div className="sar">
          <div className="bolum-bas">
            <span className="etiket">Tanıtım Videosu</span>
            <h2>
              Botu <span className="altin-yazi">iş başında</span> izle
            </h2>
            <p>Kurulumdan ilk balığa kadar her adım videoda.</p>
          </div>
          <div className="video-cerceve">
            {SITE.youtubeId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${SITE.youtubeId}`}
                title="Metin2 Balık Botu tanıtım videosu"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <div className="video-bos">
                <div className="oynat">
                  <svg viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <b style={{ fontSize: 17, color: 'var(--beyaz)' }}>Tanıtım videosu yakında</b>
                <span style={{ fontSize: 13 }}>
                  YouTube videosu yüklendiğinde bu alanda oynatılacak.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------- Metin2 Balık Botu Nedir? (ozet — tamami ayri sayfada) ------- */}
      <section className="bolum" id="nedir">
        <div className="sar">
          <div className="bolum-bas">
            <span className="etiket">Bilgi</span>
            <h2>
              Metin2 Balık Botu <span className="altin-yazi">nedir?</span>
            </h2>
          </div>

          <div className="nedir-govde">
            <p className="nedir-tanim">
              <strong>Metin2 balık botu</strong>, Metin2 oyununda balık tutma işlemini oyuncu
              yerine otomatik yapan yardımcı programdır. Oltayı kendisi atar, balık ekranını
              okur ve balığı tutar; böylece oyuncu bilgisayar başında beklemek zorunda kalmaz.
            </p>
            <p>
              <strong>K34 Balık Botu</strong>, Metin2 için Türkçe geliştirilmiş bir balık
              botudur. Windows 10 ve 11’de çalışır, kurulum gerektirmez ve tek bir{' '}
              <code>.exe</code> dosyasıdır. Balık farmının yanında{' '}
              <Link href="/yapboz-botu" className="ic-link">
                Balık Yapboz etkinliğini
              </Link>{' '}
              de otomatik oynar.
            </p>

            <h3>Özet bilgiler</h3>
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

            <p style={{ marginTop: 22 }}>
              <Link className="btn btn-hayalet" href="/metin2-balik-botu-nedir">
                Nasıl çalıştığını ayrıntılı oku →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- galeri ---------------- */}
      <section className="bolum" id="galeri" style={{ paddingTop: 0 }}>
        <div className="sar">
          <div className="bolum-bas">
            <span className="etiket">Bottan Görüntüler</span>
            <h2>
              Arayüzü <span className="altin-yazi">gör, sonra karar ver</span>
            </h2>
            <p>Karmaşık ayar yok. Aç, balıklarını seç, başlat.</p>
          </div>
          <Galeri gorseller={gorseller} />
          <p style={{ textAlign: 'center', color: 'var(--gri2)', fontSize: 12.5, marginTop: 18 }}>
            Görsele tıklayınca büyür.
          </p>

          {/* ---- canli kayit: 1000 Yabbie ---- */}
          <div className="video-blok">
            <h3 className="video-baslik">
              Botun <span className="altin-yazi">gerçek kaydı</span> — 1000+ Yabbie Yengeci
            </h3>
            <p className="video-alt">
              Hiç başında beklemeden toplanan balıklar. Bot oltayı atar, balığı tutar,
              filtredekileri saklar, çöpü yere atar ve pişirir.
            </p>
            <video
              className="video-oynatici"
              src="/video/1000-yabbi.mp4"
              poster="/video/1000-yabbi-poster.jpg"
              controls
              preload="none"
              playsInline
              muted
              loop
              aria-label="Metin2 Balık Botu ile toplanan 1000 Yabbie Yengeci kaydı"
            />
          </div>
        </div>
      </section>

      {/* ---------------- fiyatlar ---------------- */}
      <section className="bolum" id="fiyatlar">
        <div className="sar">
          <div className="bolum-bas">
            <span className="etiket">Fiyatlar</span>
            <h2>
              Sana uyan <span className="altin-yazi">paketi seç</span>
            </h2>
            <p>
              Tüm paketlerde bot özelliklerinin tamamı açıktır — fark yalnızca süre ve
              aynı anda kaç bilgisayarda çalıştırabileceğindir. Satış yalnızca Telegram
              üzerinden yapılır.
            </p>
          </div>
          <div className="fiyatlar">
            {PAKETLER.map((p) => (
              <div className={'fk' + (p.vurgu ? ' one' : '')} key={p.kod}>
                {p.rozet && <span className="fk-rozet">{p.rozet}</span>}
                <h3>{p.ad} Paket</h3>
                <div className="ozet">{p.ozet}</div>
                <div className="fiyat">
                  <b className="altin-yazi">{p.fiyat.toLocaleString('tr-TR')}</b>
                  <span>TL</span>
                </div>
                <div className="sure">{p.sure} kullanım · süre ilk girişte başlar</div>
                <div className="cihaz-rozet">
                  <svg
                    viewBox="0 0 24 24"
                    style={{ width: 16, height: 16, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }}
                  >
                    <rect x="2" y="4" width="20" height="13" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                  </svg>
                  {p.cihaz} bilgisayarda çalışır
                </div>
                <ul>
                  {p.ozellikler.map((o) => (
                    <li key={o} className={o.includes('SANAL MAKİNE') ? 'vm' : ''}>
                      <Tik />
                      {o}
                    </li>
                  ))}
                </ul>
                <TelegramSec
                  etiket="Telegram’dan Al"
                  sinif={'btn ' + (p.vurgu ? 'btn-altin' : 'btn-hayalet')}
                  mesaj={`Merhaba, K34 Metin2 Balık Botu ${p.ad} paketi (${p.fiyat} TL) almak istiyorum.`}
                />
              </div>
            ))}
          </div>

          <div className="iade-serit">
            <span className="iade-ikon">
              <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 109-9 9 9 0 00-7 3.3M3 4v4h4" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <div>
              <b>{IADE.baslik}</b>
              <span>{IADE.metin}</span>
            </div>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--gri2)', fontSize: 13, marginTop: 22 }}>
            Aylık pakette bypass’lı sanal makine kurulumu bize aittir — bilgisayarın kaç
            tane kaldırıyorsa o kadar kurulur, ana bilgisayarını özgürce kullanmaya devam
            edersin.
          </p>
        </div>
      </section>

      {/* ---------------- nasil calisir ---------------- */}
      <section className="bolum" id="nasil" style={{ paddingTop: 0 }}>
        <div className="sar">
          <div className="bolum-bas">
            <span className="etiket">Nasıl Başlarım?</span>
            <h2>
              4 adımda <span className="altin-yazi">farm başlasın</span>
            </h2>
          </div>
          <div className="adimlar">
            {[
              ['Telegram’dan yaz', `@${SITE.telegram} hesabına yaz, sana uygun paketi birlikte belirleyelim.`],
              ['Ödemeyi yap', 'Ödeme sonrası lisans anahtarın panelden anında üretilip sana iletilir.'],
              ['Botu kur', 'Programı indir, anahtarını gir. Kurulumda istersen bire bir yardımcı oluruz.'],
              ['Başlat ve izle', 'Balıklarını seç, Başlat’a bas. Telegram’dan uzaktan takip et.'],
            ].map(([b, m], i) => (
              <div className="adim" key={b}>
                <div className="no">{i + 1}</div>
                <h3>{b}</h3>
                <p>{m}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- sss ozeti ---------------- */}
      <section className="bolum" id="sss" style={{ paddingTop: 0 }}>
        <div className="sar">
          <div className="bolum-bas">
            <span className="etiket">Sıkça Sorulan Sorular</span>
            <h2>
              Aklındaki <span className="altin-yazi">soruların cevabı</span>
            </h2>
          </div>
          <div className="sss">
            {sssOzet.map((x) => (
              <details key={x.s}>
                <summary>{x.s}</summary>
                <p>{x.c}</p>
              </details>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link className="btn btn-hayalet" href="/sss">
              Tüm soruları gör ({SSS.length}) →
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- iletisim / sosyal ---------------- */}
      <section className="bolum" id="iletisim" style={{ paddingTop: 0 }}>
        <div className="sar">
          <div className="bolum-bas">
            <span className="etiket">İletişim</span>
            <h2>
              Bize <span className="altin-yazi">nereden ulaşırsın?</span>
            </h2>
            <p>
              Sohbet etmek istiyorsan genel grubumuza, satın alma ve destek için admin
              hesabımıza yaz.
            </p>
          </div>
          <div className="iletisim-izgara">
            <a className="iletisim-kart" href={SITE.telegramGrupUrl} target="_blank" rel="noopener">
              <span className="iletisim-ikon">
                <TgIkon />
              </span>
              <h3>Telegram Genel Grup</h3>
              <b>@{SITE.telegramGrup}</b>
              <p>Diğer kullanıcılarla sohbet et, duyuruları ve güncellemeleri ilk sen gör.</p>
              <span className="iletisim-git">Gruba katıl →</span>
            </a>

            <a className="iletisim-kart one" href={SITE.telegramUrl} target="_blank" rel="noopener">
              <span className="iletisim-ikon">
                <TgIkon />
              </span>
              <h3>Telegram Admin</h3>
              <b>@{SITE.telegram}</b>
              <p>
                Satın alma, lisans anahtarı, kurulum ve birebir destek. Satış yalnızca bu
                hesaptan yapılır.
              </p>
              <span className="iletisim-git">Admine yaz →</span>
            </a>

            <a className="iletisim-kart ig" href={SITE.instagramUrl} target="_blank" rel="noopener">
              <span className="iletisim-ikon">
                <IgIkon />
              </span>
              <h3>Instagram</h3>
              <b>@{SITE.instagram}</b>
              <p>Bot kayıtları, yeni özellikler ve kısa videolar burada paylaşılıyor.</p>
              <span className="iletisim-git">Takip et →</span>
            </a>
          </div>
        </div>
      </section>

      {/* ---------------- cta ---------------- */}
      <section className="bolum" style={{ paddingTop: 0 }}>
        <div className="sar">
          <div className="serit">
            <span className="etiket">Hemen Başla</span>
            <h2 style={{ marginTop: 16 }}>
              Metin2 balık botunu <span className="altin-yazi">bugün kullanmaya başla</span>
            </h2>
            <p>
              Anahtarın dakikalar içinde elinde. Kurulumdan ilk balığa kadar 7/24
              yanındayız.
            </p>
            <TelegramSec etiket="Telegram’dan Yaz" sinif="btn btn-altin" />
          </div>
        </div>
      </section>

      {/* ---------------- uluslararasi (SEO) ---------------- */}
      <section className="bolum" style={{ paddingTop: 0 }}>
        <div className="sar">
          <div className="bolum-bas">
            <span className="etiket">Metin2 Fish Bot</span>
            <h2>
              Aynı bot, <span className="altin-yazi">her dilde aranıyor</span>
            </h2>
            <p>
              Metin2 balık botu / Metin2 fish bot / Metin2 fishing bot — hangi dilde
              ararsan ara, aradığın bot bu.
            </p>
          </div>
          <div className="diller">
            <div className="dil">
              <b>English — Metin2 Fish Bot</b>
              <p>
                K34 is a fully automatic Metin2 fishing bot for Windows. It casts the rod,
                catches the fish with human-like mouse movement, cooks them at the campfire
                and solves the Fishing Jigsaw event with mathematically optimal moves.
                Multi-window support, auto login and 24/7 Telegram support.
              </p>
            </div>
            <div className="dil">
              <b>Deutsch — Metin2 Angelbot</b>
              <p>
                K34 ist ein vollautomatischer Metin2 Angelbot (Fisch Bot) für Windows:
                Angeln, Fische braten, Fisch-Puzzle-Event automatisch lösen — mit
                menschenähnlicher Mausbewegung und Multi-Fenster-Unterstützung.
              </p>
            </div>
            <div className="dil">
              <b>Română — Bot de Pescuit Metin2</b>
              <p>
                K34 este un bot de pescuit Metin2 complet automat pentru Windows: aruncă
                undița, prinde peștele, gătește la foc de tabără și rezolvă evenimentul
                puzzle cu mutări optime.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Alt />
    </>
  );
}
