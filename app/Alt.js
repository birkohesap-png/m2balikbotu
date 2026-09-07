import Link from 'next/link';
import { SITE, SAYFALAR } from '@/lib/site';
import { TgIkon, IgIkon } from './Ikonlar';
import TelegramSec from './TelegramSec';

export default function Alt() {
  const sayfalar = SAYFALAR.filter((s) => s.menu);

  return (
    <>
      <footer className="alt">
        <div className="sar">
          <div className="alt-ic">
            <div>
              <Link className="marka" href="/" style={{ marginBottom: 14 }}>
                <img src="/logo.png" alt="K34 Balık Botu" width="42" height="42" />
                <span>
                  K34 BALIK BOTU
                  <small>{SITE.gorunen}</small>
                </span>
              </Link>
              <p>
                Metin2 balık botu — otomatik balık tutma, pişirme ve Balık Yapboz
                etkinliği. Satış ve lisans işlemleri yalnızca Telegram{' '}
                <b>@{SITE.telegram}</b> hesabından yapılır.
              </p>

              <div className="sosyal">
                <a
                  className="sosyal-btn"
                  href={SITE.telegramGrupUrl}
                  target="_blank"
                  rel="noopener"
                >
                  <TgIkon />
                  <span>
                    <b>Telegram Grup</b>
                    <small>@{SITE.telegramGrup}</small>
                  </span>
                </a>
                <a className="sosyal-btn" href={SITE.telegramUrl} target="_blank" rel="noopener">
                  <TgIkon />
                  <span>
                    <b>Telegram Destek</b>
                    <small>@{SITE.telegram}</small>
                  </span>
                </a>
                <a className="sosyal-btn ig" href={SITE.instagramUrl} target="_blank" rel="noopener">
                  <IgIkon />
                  <span>
                    <b>Instagram</b>
                    <small>@{SITE.instagram}</small>
                  </span>
                </a>
              </div>
            </div>

            <div className="alt-lnk">
              {sayfalar.map((s) => (
                <Link key={s.yol} href={s.yol}>
                  {s.baslik}
                </Link>
              ))}
              <Link href="/#fiyatlar">Fiyatlar</Link>
              <Link href="/#guvenlik">Güvenlik</Link>
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

      <TelegramSec etiket="Telegram" sinif="btn btn-tg yuzen" />
    </>
  );
}
