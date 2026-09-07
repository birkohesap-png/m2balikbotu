'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Telegram webhook durumu + tek tikla tamir.
 * Alan adi degistiginde webhook eski adreste kalir ve bot mesaj almayi birakir.
 */
export default function Telegram({ bildir }) {
  const [d, setD] = useState(null);
  const [calisiyor, setCalisiyor] = useState(false);

  const yenile = useCallback(async () => {
    try {
      const r = await fetch('/api/k34/telegram', { cache: 'no-store' });
      setD(await r.json());
    } catch {
      setD({ ok: false, mesaj: 'Sunucuya ulasilamadi' });
    }
  }, []);

  useEffect(() => {
    yenile();
  }, [yenile]);

  async function tamirEt() {
    setCalisiyor(true);
    try {
      const r = await fetch('/api/k34/telegram', { method: 'POST' });
      const c = await r.json();
      bildir?.(c.ok ? 'Telegram webhook yeni adrese bağlandı' : c.mesaj || 'Başarısız');
      yenile();
    } catch (e) {
      bildir?.(String(e));
    } finally {
      setCalisiyor(false);
    }
  }

  const durumRenk = !d ? 'var(--gri2)' : d.dogruMu ? 'var(--yesil)' : 'var(--kirmizi)';
  const durumYazi = !d
    ? 'kontrol ediliyor…'
    : !d.ok
      ? d.mesaj || 'okunamadı'
      : d.dogruMu
        ? 'BAĞLI'
        : 'YANLIŞ ADRESTE';

  return (
    <div style={S.kart}>
      <h2 style={S.h2}>Telegram Botu</h2>

      <div style={S.satir}>
        <span style={S.etiket}>Durum</span>
        <b style={{ color: durumRenk }}>{durumYazi}</b>
      </div>

      {d?.ok && (
        <>
          <div style={S.satir}>
            <span style={S.etiket}>Olması gereken</span>
            <code style={S.kod}>{d.hedef}</code>
          </div>
          <div style={S.satir}>
            <span style={S.etiket}>Şu anki</span>
            <code style={{ ...S.kod, color: d.dogruMu ? 'var(--yesil)' : 'var(--kirmizi)' }}>
              {d.mevcut || '(kurulu değil)'}
            </code>
          </div>
          <div style={S.satir}>
            <span style={S.etiket}>Bekleyen mesaj</span>
            <b>{d.bekleyen}</b>
          </div>
          {d.sonHata && (
            <div style={S.satir}>
              <span style={S.etiket}>Son hata</span>
              <span style={{ color: 'var(--kirmizi)', fontSize: 12 }}>{d.sonHata}</span>
            </div>
          )}
        </>
      )}

      {d?.ok && !d.dogruMu && (
        <div style={S.uyari}>
          Webhook yanlış adreste — bu yüzden bot Telegram&apos;dan mesaj almıyor.
          Aşağıdaki butona basınca doğru adrese yeniden bağlanır.
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <button
          onClick={tamirEt}
          disabled={calisiyor}
          style={{ ...S.btn, ...S.btnAltin, opacity: calisiyor ? 0.5 : 1 }}
        >
          {calisiyor ? 'Bağlanıyor…' : 'Webhook’u bu siteye bağla'}
        </button>
        <button onClick={yenile} style={{ ...S.btn, ...S.btnHayalet }}>
          Yenile
        </button>
      </div>
    </div>
  );
}

const S = {
  kart: {
    background: 'linear-gradient(180deg,#0d1421,#080d16)',
    border: '1px solid rgba(255,255,255,.07)',
    borderRadius: 18,
    padding: 22,
    marginBottom: 18,
  },
  h2: { fontSize: 16, marginBottom: 14 },
  satir: {
    display: 'flex',
    gap: 12,
    alignItems: 'baseline',
    padding: '7px 0',
    borderBottom: '1px solid rgba(255,255,255,.05)',
    flexWrap: 'wrap',
  },
  etiket: { fontSize: 11.5, color: 'var(--gri)', minWidth: 130 },
  kod: {
    fontFamily: 'ui-monospace,Consolas,monospace',
    fontSize: 12,
    wordBreak: 'break-all',
    color: '#c3ccda',
  },
  uyari: {
    marginTop: 14,
    fontSize: 12.5,
    lineHeight: 1.7,
    color: '#e0544f',
    background: 'rgba(224,84,79,.08)',
    border: '1px solid rgba(224,84,79,.3)',
    borderRadius: 11,
    padding: '11px 13px',
  },
  btn: {
    padding: '11px 20px',
    borderRadius: 11,
    fontWeight: 800,
    fontSize: 13.5,
    cursor: 'pointer',
    border: '1px solid transparent',
    fontFamily: 'inherit',
  },
  btnAltin: { background: 'linear-gradient(135deg,#f9e39c,#e7c163 45%,#b8912f)', color: '#241b04' },
  btnHayalet: {
    background: 'rgba(255,255,255,.04)',
    borderColor: 'rgba(255,255,255,.1)',
    color: '#eef2f8',
  },
};
