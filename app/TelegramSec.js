'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SITE } from '@/lib/site';
import { TgIkon } from './Ikonlar';

/**
 * Telegram butonu. Basinca kullaniciya "genel sohbet grubu mu, admin mi?"
 * diye sorar ve secimine gore ilgili Telegram adresine gonderir.
 *
 * mesaj  : admin secilirse hazir gelecek metin (satin alma butonlari icin)
 * etiket : buton yazisi
 * sinif  : butonun CSS sinifi
 */
export default function TelegramSec({ etiket = 'Telegram', sinif = 'btn btn-tg', mesaj = '' }) {
  const [acik, setAcik] = useState(false);
  const [binmis, setBinmis] = useState(false);

  useEffect(() => setBinmis(true), []);

  useEffect(() => {
    if (!acik) return;
    const kacis = (e) => e.key === 'Escape' && setAcik(false);
    document.addEventListener('keydown', kacis);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', kacis);
      document.body.style.overflow = '';
    };
  }, [acik]);

  const adminUrl = mesaj
    ? `${SITE.telegramUrl}?text=${encodeURIComponent(mesaj)}`
    : SITE.telegramUrl;

  const kapat = () => setAcik(false);

  /* Modal document.body'ye tasiniyor: fiyat karti gibi uzerinde transform olan bir
     kapsayicinin icinde kalirsa position:fixed viewport'a degil o karta gore
     konumlanir ve modal ekranin ortasina gelmez. */
  const modal = (
    <div
      className="tgsec-perde"
      onClick={kapat}
      role="dialog"
      aria-modal="true"
      aria-label="Telegram bağlantısı seç"
    >
      <div className="tgsec-kutu" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tgsec-kapat" onClick={kapat} aria-label="Kapat">
          ×
        </button>

        <span className="etiket">Telegram</span>
        <h3 className="tgsec-baslik">Nereye gitmek istersin?</h3>
        <p className="tgsec-alt">
          Sohbet etmek için gruba, satın alma ve destek için admin hesabına git.
        </p>

        <a
          className="tgsec-secenek"
          href={SITE.telegramGrupUrl}
          target="_blank"
          rel="noopener"
          onClick={kapat}
        >
          <span className="tgsec-ikon">
            <TgIkon />
          </span>
          <span className="tgsec-metin">
            <b>Genel Sohbet Grubu</b>
            <small>@{SITE.telegramGrup} — diğer kullanıcılarla konuş, duyuruları gör</small>
          </span>
          <span className="tgsec-ok">→</span>
        </a>

        <a
          className="tgsec-secenek one"
          href={adminUrl}
          target="_blank"
          rel="noopener"
          onClick={kapat}
        >
          <span className="tgsec-ikon">
            <TgIkon />
          </span>
          <span className="tgsec-metin">
            <b>Satın Al &amp; Destek (Admin)</b>
            <small>@{SITE.telegram} — lisans satın al, birebir yardım al</small>
          </span>
          <span className="tgsec-ok">→</span>
        </a>

        <p className="tgsec-not">
          Satış ve lisans işlemleri <b>yalnızca @{SITE.telegram}</b> hesabından yapılır.
          Grupta kimse sana özelden satış teklif ederse dikkatli ol.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <button type="button" className={sinif} onClick={() => setAcik(true)}>
        <TgIkon /> {etiket}
      </button>
      {acik && binmis && createPortal(modal, document.body)}
    </>
  );
}
