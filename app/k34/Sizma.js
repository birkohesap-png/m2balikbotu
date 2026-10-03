'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';

const SEBEP_AD = {
  gecersiz: 'Geçersiz anahtar',
  iptal: 'İptal anahtar',
  suresi_doldu: 'Süresi dolmuş',
  cihaz_limiti: 'Cihaz limiti',
  engelli: 'Engelliyken deneme',
  sahte_modul: '🛡️ KALKAN İHLALİ',
  urun_uyumsuz: 'Yanlış bot (TR/PvP)',
};

const tarih = (t) =>
  t ? new Date(t).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

/**
 * Sizma girisimleri: basarisiz lisans denemeleri + kalkan ihlalleri (IP bazli)
 * ve tek tikla IP / HWID / anahtar engelleme. Engellenen /api/check'ten vk alamaz.
 */
export default function Sizma({ bildir }) {
  const [d, setD] = useState(null);
  const [acikIp, setAcikIp] = useState(null);

  const yenile = useCallback(async () => {
    try {
      const r = await fetch('/api/k34/sizma', { cache: 'no-store' });
      setD(await r.json());
    } catch {
      setD({ ok: false, mesaj: 'Sunucuya ulaşılamadı' });
    }
  }, []);

  useEffect(() => {
    yenile();
  }, [yenile]);

  async function gonder(govde) {
    try {
      const r = await fetch('/api/k34/sizma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(govde),
      });
      const c = await r.json();
      bildir?.(c.mesaj || (c.ok ? 'Tamam' : 'Başarısız'));
    } catch (e) {
      bildir?.(String(e));
    }
    yenile();
  }

  const engelliMi = (tur, deger) =>
    (d?.engeller || []).some((e) => e.tur === tur && e.deger === deger);

  function engelle(tur, deger, musteriler = []) {
    let soru = `${tur.toUpperCase()} engellensin mi?\n\n${deger}\n\nEngellenen artık lisans doğrulayamaz (bot çalışmaz).`;
    if (musteriler.length) {
      soru =
        `⚠ DİKKAT: Bu IP'de son 3 günde AKTİF MÜŞTERİN var:\n${musteriler.join(', ')}\n\n` +
        `Mobil internette (CGNAT) birçok kişi aynı IP'yi paylaşır; IP engeli bu müşterileri de keser.\n` +
        `Mümkünse IP yerine HWID engelle.\n\n` +
        soru;
    }
    if (!confirm(soru)) return;
    const aciklama = prompt('Not (isteğe bağlı):', '') || '';
    gonder({ islem: 'engelle', tur, deger, aciklama });
  }

  if (!d) {
    return (
      <div style={S.kart}>
        <h2 style={S.h2}>🛡️ Sızma Girişimleri</h2>
        <div style={S.bilgi}>Yükleniyor…</div>
      </div>
    );
  }
  if (!d.ok) {
    return (
      <div style={S.kart}>
        <h2 style={S.h2}>🛡️ Sızma Girişimleri</h2>
        <div style={{ ...S.bilgi, color: 'var(--kirmizi)' }}>{d.mesaj || 'Okunamadı'}</div>
      </div>
    );
  }

  const ozet = d.ozet || [];
  const supheliSay = ozet.filter((o) => o.supheli).length;

  return (
    <div style={S.kart}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <h2 style={{ ...S.h2, marginBottom: 0 }}>🛡️ Sızma Girişimleri</h2>
        {supheliSay > 0 && (
          <span style={{ ...S.rozet, ...S.rozetKirmizi }}>{supheliSay} şüpheli IP</span>
        )}
        <button onClick={yenile} style={{ ...S.mini, marginLeft: 'auto' }}>
          Yenile
        </button>
        <button
          onClick={() => confirm('Tüm sızma kayıtları silinsin mi? (Engeller kalır)') && gonder({ islem: 'temizle' })}
          style={S.mini}
        >
          Kayıtları temizle
        </button>
      </div>
      <div style={{ ...S.bilgi, marginBottom: 14 }}>
        Başarısız lisans denemeleri ve botun kalkanının yakaladığı kırma girişimleri (son 30 gün).
        Engellenen IP / HWID / anahtar lisans doğrulayamaz → şablonlar çözülmez, bot çalışmaz.
      </div>

      {ozet.length === 0 ? (
        <div style={S.bilgi}>Kayıt yok. 👍</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={S.tablo}>
            <thead>
              <tr>
                {['IP', 'Deneme', 'Farklı anahtar', 'Farklı HWID', 'Sebepler', 'Son', ''].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ozet.map((o) => {
                const ipEngelli = engelliMi('ip', o.ip);
                const satirlar = (d.kayitlar || []).filter((k) => k.ip === o.ip);
                return (
                  <Fragment key={o.ip || '(bos)'}>
                    <tr style={o.supheli ? { background: 'rgba(224,84,79,.07)' } : undefined}>
                      <td style={{ ...S.td, fontFamily: 'Consolas,monospace' }}>
                        {o.ip || '(bilinmiyor)'}
                        {ipEngelli && <span style={{ ...S.rozet, ...S.rozetKirmizi, marginLeft: 6 }}>ENGELLİ</span>}
                        {o.musteriler?.length > 0 && (
                          <div style={{ fontSize: 11, color: 'var(--altin2)', marginTop: 3 }}>
                            ⚠ Aktif müşteri: {o.musteriler.join(', ')}
                          </div>
                        )}
                      </td>
                      <td style={S.td}>{o.toplam}</td>
                      <td style={S.td}>{o.farkli_anahtar}</td>
                      <td style={S.td}>{o.farkli_hwid}</td>
                      <td style={S.td}>
                        {(o.sebepler || []).map((s) => (
                          <span
                            key={s}
                            style={{ ...S.rozet, ...(s === 'sahte_modul' ? S.rozetKirmizi : {}), marginRight: 4 }}
                          >
                            {SEBEP_AD[s] || s}
                          </span>
                        ))}
                      </td>
                      <td style={{ ...S.td, whiteSpace: 'nowrap' }}>{tarih(o.son)}</td>
                      <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                        <button onClick={() => setAcikIp(acikIp === o.ip ? null : o.ip)} style={S.mini}>
                          {acikIp === o.ip ? 'Kapat' : 'Detay'}
                        </button>{' '}
                        {o.ip && !ipEngelli && (
                          <button
                            onClick={() => engelle('ip', o.ip, o.musteriler || [])}
                            style={{ ...S.mini, ...S.miniKirmizi }}
                          >
                            IP engelle
                          </button>
                        )}{' '}
                        <button
                          onClick={() => confirm('Bu IP\'nin kayıtları silinsin mi?') && gonder({ islem: 'kayitSil', ip: o.ip })}
                          style={S.mini}
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                    {acikIp === o.ip && (
                      <tr>
                        <td colSpan={7} style={S.detay}>
                          {satirlar.length === 0 && <div style={S.bilgi}>Detay kaydı yok.</div>}
                          {satirlar.map((k) => (
                            <div key={k.id} style={S.kayit}>
                              <span style={{ ...S.rozet, ...(k.sebep === 'sahte_modul' ? S.rozetKirmizi : {}) }}>
                                {SEBEP_AD[k.sebep] || k.sebep}
                              </span>
                              <span>×{k.adet}</span>
                              {k.anahtar && k.anahtar !== '*' && (
                                <span style={S.kod}>🔑 {k.anahtar}</span>
                              )}
                              {k.hwid && k.hwid !== '*' && <span style={S.kod}>💻 {k.hwid}</span>}
                              {k.anahtar === '*' && <span style={S.bilgi}>(çok fazla deneme — birleştirildi)</span>}
                              {k.ayrinti && <span style={S.bilgi}>{k.ayrinti}</span>}
                              <span style={{ ...S.bilgi, marginLeft: 'auto' }}>
                                {tarih(k.ilk)} → {tarih(k.son)}
                              </span>
                              {k.hwid && k.hwid !== '*' && !engelliMi('hwid', k.hwid) && (
                                <button onClick={() => engelle('hwid', k.hwid)} style={{ ...S.mini, ...S.miniKirmizi }}>
                                  HWID engelle
                                </button>
                              )}
                              {k.anahtar && k.anahtar !== '*' && !engelliMi('anahtar', k.anahtar) && (
                                <button onClick={() => engelle('anahtar', k.anahtar)} style={{ ...S.mini, ...S.miniKirmizi }}>
                                  Anahtar engelle
                                </button>
                              )}
                            </div>
                          ))}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h3 style={{ fontSize: 14, margin: '20px 0 10px' }}>Engellenenler ({(d.engeller || []).length})</h3>
      {(d.engeller || []).length === 0 ? (
        <div style={S.bilgi}>Engellenen yok.</div>
      ) : (
        (d.engeller || []).map((e) => (
          <div key={e.id} style={S.kayit}>
            <span style={{ ...S.rozet, ...S.rozetKirmizi }}>{e.tur.toUpperCase()}</span>
            <span style={S.kod}>{e.deger}</span>
            {e.aciklama && <span style={S.bilgi}>{e.aciklama}</span>}
            <span style={{ ...S.bilgi, marginLeft: 'auto' }}>{tarih(e.zaman)}</span>
            <button
              onClick={() => confirm('Engel kaldırılsın mı?\n\n' + e.deger) && gonder({ islem: 'kaldir', id: e.id })}
              style={S.mini}
            >
              Engeli kaldır
            </button>
          </div>
        ))
      )}
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
  h2: { fontSize: 16, marginBottom: 16 },
  bilgi: { fontSize: 12, color: 'var(--gri)' },
  tablo: { width: '100%', borderCollapse: 'collapse', minWidth: 820 },
  th: {
    textAlign: 'left',
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'var(--gri2)',
    padding: '0 10px 10px',
    borderBottom: '1px solid rgba(255,255,255,.07)',
    whiteSpace: 'nowrap',
  },
  td: { padding: '10px 10px', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,.04)', verticalAlign: 'top' },
  detay: { padding: '12px 12px 16px', background: 'rgba(255,255,255,.02)', borderBottom: '1px solid rgba(255,255,255,.07)' },
  kayit: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: '8px 11px',
    background: 'rgba(255,255,255,.03)',
    borderRadius: 9,
    marginBottom: 6,
    fontSize: 12.5,
  },
  kod: {
    background: 'rgba(231,193,99,.1)',
    border: '1px solid rgba(231,193,99,.25)',
    color: '#f9e39c',
    borderRadius: 7,
    padding: '3px 8px',
    fontSize: 11.5,
    fontFamily: 'Consolas,monospace',
    wordBreak: 'break-all',
  },
  rozet: {
    display: 'inline-block',
    fontSize: 10.5,
    fontWeight: 800,
    padding: '2px 7px',
    borderRadius: 6,
    background: 'rgba(255,255,255,.06)',
    border: '1px solid rgba(255,255,255,.1)',
    color: '#c3ccda',
  },
  rozetKirmizi: { background: 'rgba(224,84,79,.12)', borderColor: 'rgba(224,84,79,.4)', color: '#e0544f' },
  mini: {
    background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(255,255,255,.1)',
    color: '#c3ccda',
    borderRadius: 8,
    padding: '5px 10px',
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  miniKirmizi: { borderColor: 'rgba(224,84,79,.4)', color: '#e0544f' },
};
