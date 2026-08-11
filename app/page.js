import fs from 'node:fs';
import path from 'node:path';
import { SITE, PAKETLER, OZELLIKLER, SSS, GUVENLIK, IADE } from '@/lib/site';
import Galeri from './Galeri';

/* ---------------------------------------------------------------- ikonlar */
const YOL = {
  fare: 'M4 3l7 17 2.5-6.5L20 11z',
  yapboz: 'M9 3h6v2.5a1.5 1.5 0 003 0V3h3v3h-2.5a1.5 1.5 0 000 3H21v6h-2.5a1.5 1.5 0 000 3H21v3h-3v-2.5a1.5 1.5 0 00-3 0V21H9v-2.5a1.5 1.5 0 00-3 0V21H3v-6h2.5a1.5 1.5 0 000-3H3V6h2.5a1.5 1.5 0 000-3H3V3h6z',
  ates: 'M12 2c1 3-1 4-1 6a3 3 0 006 0c0-1 0-2-1-3 2 1 4 4 4 8a8 8 0 11-16 0c0-3 2-6 5-8-1 2 0 4 2 4 1-3-2-4-2-7z',
  login: 'M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3',
  multi: 'M16 11a3 3 0 100-6 3 3 0 000 6zm-8 0a3 3 0 100-6 3 3 0 000 6zm0 2c-2.7 0-8 1.3-8 4v3h10M16 13c2.7 0 8 1.3 8 4v3H10',
  telegram: 'M21.9 4.3l-3 14.2c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1-.6-4.7L18.4 6 7.6 12.2l-4.5-1.4L20.6 2.9z',
  filtre: 'M3 5h18l-7 8v6l-4 2v-8z',
  mola: 'M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};
const Ikon = ({ ad }) => (
  <span className="ikon">
    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d={YOL[ad] || YOL.fare} />
    </svg>
  </span>
);
const Tik = () => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 6" />
  </svg>
);
const TgIkon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.9 4.3l-3 14.2c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.2.2-.5.5-.9.5l.3-4.7L18.4 6c.4-.3-.1-.5-.6-.2L7.6 12.2l-4.5-1.4c-1-.3-1-.9.2-1.4L20.6 2.9c.8-.3 1.5.2 1.3 1.4z" />
  </svg>
);

/* ------------------------------------------------------------------ galeri
   public/galeri klasorune ATTIGIN her gorsel otomatik listelenir.
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

/* -------------------------------------------------------------------- sayfa */
export default function AnaSayfa() {
  const gorseller = galeriOku();

  return (
    <>
      {/* ---------------- ust menu ---------------- */}
      <header className="ust">
        <div className="sar ust-ic">
          <a className="marka" href="#">
            <img src="/logo.png" alt="K34 Metin2 Balık Botu logo" width="42" height="42" />
            <span>
              K34 BALIK BOTU
              <small>Metin2 Fish Bot</small>
            </span>
          </a>
          <nav className="menu">
            <a href="#ozellikler">Özellikler</a>
            <a href="#guvenlik">Güvenlik</a>
            <a href="#video">Tanıtım</a>
            <a href="#galeri">Görüntüler</a>
            <a href="#fiyatlar">Fiyatlar</a>
            <a href="#sss">S.S.S.</a>
          </nav>
          <a className="btn btn-tg" href={SITE.telegramUrl} target="_blank" rel="noopener">
            <TgIkon /> Satın Al
          </a>
        </div>
      </header>

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
              <a className="btn btn-altin" href={SITE.telegramUrl} target="_blank" rel="noopener">
                <TgIkon /> Telegram’dan Satın Al
              </a>
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

      {/* ---------------- video ---------------- */}
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
                <a
                  className={'btn ' + (p.vurgu ? 'btn-altin' : 'btn-hayalet')}
                  href={`${SITE.telegramUrl}?text=${encodeURIComponent(
                    `Merhaba, K34 Metin2 Balık Botu ${p.ad} paketi (${p.fiyat} TL) almak istiyorum.`
                  )}`}
                  target="_blank"
                  rel="noopener"
                >
                  <TgIkon /> Telegram’dan Al
                </a>
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

          <p
            style={{
              textAlign: 'center',
              color: 'var(--gri2)',
              fontSize: 13,
              marginTop: 22,
            }}
          >
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

      {/* ---------------- sss ---------------- */}
      <section className="bolum" id="sss" style={{ paddingTop: 0 }}>
        <div className="sar">
          <div className="bolum-bas">
            <span className="etiket">Sıkça Sorulan Sorular</span>
            <h2>
              Aklındaki <span className="altin-yazi">soruların cevabı</span>
            </h2>
          </div>
          <div className="sss">
            {SSS.map((x) => (
              <details key={x.s}>
                <summary>{x.s}</summary>
                <p>{x.c}</p>
              </details>
            ))}
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
            <a className="btn btn-altin" href={SITE.telegramUrl} target="_blank" rel="noopener">
              <TgIkon /> @{SITE.telegram} — Telegram’dan Yaz
            </a>
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

      {/* ---------------- alt ---------------- */}
      <footer className="alt">
        <div className="sar">
          <div className="alt-ic">
            <div>
              <a className="marka" href="#" style={{ marginBottom: 14 }}>
                <img src="/logo.png" alt="K34 Balık Botu" width="42" height="42" />
                <span>
                  K34 BALIK BOTU
                  <small>{SITE.gorunen}</small>
                </span>
              </a>
              <p>
                Metin2 balık botu — otomatik balık tutma, pişirme ve Balık Yapboz
                etkinliği. Satış ve destek yalnızca Telegram <b>@{SITE.telegram}</b>{' '}
                üzerinden yapılır.
              </p>
            </div>
            <div className="alt-lnk">
              <a href="#ozellikler">Özellikler</a>
              <a href="#fiyatlar">Fiyatlar</a>
              <a href="#sss">S.S.S.</a>
              <a href={SITE.telegramUrl} target="_blank" rel="noopener">
                Telegram
              </a>
            </div>
          </div>
          <div className="alt-son">
            <span>
              © {new Date().getFullYear()} {SITE.gorunen} — Tüm hakları saklıdır.
            </span>
            <span style={{ marginLeft: 'auto', maxWidth: 620 }}>
              Bu site Gameforge veya Metin2 ile resmî bir bağlantıya sahip değildir.
              Metin2, ilgili hak sahiplerinin tescilli markasıdır.
            </span>
          </div>
        </div>
      </footer>

      <a
        className="btn btn-tg yuzen"
        href={SITE.telegramUrl}
        target="_blank"
        rel="noopener"
        aria-label="Telegram’dan yaz"
      >
        <TgIkon /> Telegram
      </a>
    </>
  );
}
