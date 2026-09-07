import Link from 'next/link';
import TelegramSec from './TelegramSec';

/* Menu baglantilari MUTLAK yazilir ("/#ozellikler"), boylece alt sayfalardan da
   dogru yere gider. */
const MENU = [
  { yol: '/yapboz-botu', ad: 'Yapboz Botu' },
  { yol: '/#ozellikler', ad: 'Özellikler' },
  { yol: '/#guvenlik', ad: 'Güvenlik' },
  { yol: '/#fiyatlar', ad: 'Fiyatlar' },
  { yol: '/guncellemeler', ad: 'Güncellemeler' },
  { yol: '/sss', ad: 'S.S.S.' },
];

export default function Ust() {
  return (
    <header className="ust">
      <div className="sar ust-ic">
        <Link className="marka" href="/">
          <img src="/logo.png" alt="K34 Metin2 Balık Botu logo" width="42" height="42" />
          <span>
            K34 BALIK BOTU
            <small>Metin2 Fish Bot</small>
          </span>
        </Link>
        <nav className="menu">
          {MENU.map((m) => (
            <Link key={m.yol} href={m.yol}>
              {m.ad}
            </Link>
          ))}
        </nav>
        <TelegramSec etiket="Satın Al" sinif="btn btn-tg" />
      </div>
    </header>
  );
}
