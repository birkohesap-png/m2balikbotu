'use client';

import { Fragment, useEffect, useState, useCallback } from 'react';

const PAKETLER = [
  { kod: 'gunluk', ad: 'Günlük · 300 TL · 1 PC', cihaz: 1, saat: 24 },
  { kod: 'haftalik', ad: 'Haftalık · 1300 TL · 2 PC', cihaz: 2, saat: 168 },
  { kod: 'aylik', ad: 'Aylık · 2500 TL · 6 PC', cihaz: 6, saat: 720 },
];

const tarih = (t) =>
  t ? new Date(t).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

function kalanMetin(l) {
  if (l.iptal) return { yazi: 'İPTAL', renk: 'var(--kirmizi)' };
  if (!l.aktivasyon) return { yazi: 'Kullanılmadı', renk: 'var(--gri)' };
  const sn = Math.floor((new Date(l.bitis).getTime() - Date.now()) / 1000);
  if (sn <= 0) return { yazi: 'Süresi doldu', renk: 'var(--kirmizi)' };
  const g = Math.floor(sn / 86400);
  const s = Math.floor((sn % 86400) / 3600);
  const d = Math.floor((sn % 3600) / 60);
  return { yazi: g > 0 ? `${g}g ${s}sa` : s > 0 ? `${s}sa ${d}dk` : `${d}dk`, renk: 'var(--yesil)' };
}

export default function Admin() {
  const [girisli, setGirisli] = useState(false);
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [liste, setListe] = useState([]);
  const [ist, setIst] = useState({});
  const [ara, setAra] = useState('');
  const [yeni, setYeni] = useState({ paket: 'gunluk', adet: 1, musteri: '', aciklama: '' });
  const [uretilen, setUretilen] = useState([]);
  const [acik, setAcik] = useState(null);
  const [cihazlar, setCihazlar] = useState([]);
  const [mesaj, setMesaj] = useState('');

  const yukle = useCallback(async (q = '') => {
    const r = await fetch('/api/admin/keys?ara=' + encodeURIComponent(q), { cache: 'no-store' });
    if (r.status === 401) {
      setGirisli(false);
      return;
    }
    const d = await r.json();
    if (d.ok) {
      setListe(d.liste);
      setIst(d.ist);
      setGirisli(true);
    }
  }, []);

  useEffect(() => {
    yukle();
  }, [yukle]);

  async function girisYap(e) {
    e.preventDefault();
    setHata('');
    const r = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sifre }),
    });
    const d = await r.json();
    if (d.ok) {
      setSifre('');
      yukle();
    } else setHata(d.mesaj || 'Giriş başarısız');
  }

  async function cikis() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setGirisli(false);
    setListe([]);
  }

  async function uret(e) {
    e.preventDefault();
    const r = await fetch('/api/admin/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(yeni),
    });
    const d = await r.json();
    if (d.ok) {
      setUretilen(d.anahtarlar);
      setYeni({ ...yeni, adet: 1, musteri: '', aciklama: '' });
      yukle(ara);
      bildir(d.anahtarlar.length + ' anahtar üretildi');
    }
  }

  async function islem(id, govde) {
    await fetch('/api/admin/keys/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(govde),
    });
    yukle(ara);
    if (acik === id) detay(id);
  }

  async function sil(id) {
    if (!confirm('Bu anahtar tamamen silinsin mi? (Geri alınamaz)')) return;
    await fetch('/api/admin/keys/' + id, { method: 'DELETE' });
    setAcik(null);
    yukle(ara);
  }

  async function detay(id) {
    if (acik === id) {
      setAcik(null);
      return;
    }
    const r = await fetch('/api/admin/keys/' + id, { cache: 'no-store' });
    const d = await r.json();
    if (d.ok) {
      setCihazlar(d.cihazlar);
      setAcik(id);
    }
  }

  function bildir(m) {
    setMesaj(m);
    setTimeout(() => setMesaj(''), 2600);
  }

  function kopyala(t) {
    navigator.clipboard?.writeText(t);
    bildir('Kopyalandı: ' + t);
  }

  /* ------------------------------------------------------------- giris */
  if (!girisli) {
    return (
      <div style={S.girisSar}>
        <form onSubmit={girisYap} style={S.girisKutu}>
          <img src="/logo.png" alt="K34" width="66" height="66" style={{ borderRadius: 18, margin: '0 auto 18px' }} />
          <h1 style={{ fontSize: 21, textAlign: 'center', marginBottom: 6 }}>Yönetim Paneli</h1>
          <p style={{ textAlign: 'center', color: 'var(--gri)', fontSize: 13, marginBottom: 22 }}>
            K34 Balık Botu — lisans anahtarı yönetimi
          </p>
          <input
            type="password"
            autoFocus
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            placeholder="Yönetici şifresi"
            style={S.input}
          />
          {hata && <div style={{ color: 'var(--kirmizi)', fontSize: 13, marginTop: 10 }}>{hata}</div>}
          <button style={{ ...S.btn, ...S.btnAltin, width: '100%', marginTop: 16 }}>Giriş Yap</button>
        </form>
      </div>
    );
  }

  /* -------------------------------------------------------------- panel */
  return (
    <div style={{ padding: '26px 0 70px' }}>
      <div style={S.sar}>
        <header style={S.ust}>
          <img src="/logo.png" alt="" width="40" height="40" style={{ borderRadius: 12 }} />
          <div>
            <div style={{ fontWeight: 900, letterSpacing: -0.3 }}>K34 — Yönetim Paneli</div>
            <div style={{ fontSize: 11.5, color: 'var(--gri2)' }}>Lisans anahtarı üretimi ve takibi</div>
          </div>
          <button onClick={cikis} style={{ ...S.btn, ...S.btnHayalet, marginLeft: 'auto' }}>
            Çıkış
          </button>
        </header>

        <div style={S.istIzgara}>
          {[
            ['Toplam anahtar', ist.toplam, 'var(--beyaz)'],
            ['Şu an aktif', ist.aktif, 'var(--yesil)'],
            ['Kullanılmamış', ist.bekleyen, 'var(--altin2)'],
            ['İptal edilmiş', ist.iptal, 'var(--kirmizi)'],
          ].map(([a, v, c]) => (
            <div key={a} style={S.istKart}>
              <div style={{ fontSize: 11, color: 'var(--gri)', letterSpacing: 1, textTransform: 'uppercase' }}>{a}</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: c, letterSpacing: -1 }}>{v ?? 0}</div>
            </div>
          ))}
        </div>

        {/* ---- yeni anahtar ---- */}
        <form onSubmit={uret} style={S.kart}>
          <h2 style={S.h2}>Yeni Anahtar Üret</h2>
          <div style={S.form}>
            <label style={S.lbl}>
              Paket
              <select
                value={yeni.paket}
                onChange={(e) => setYeni({ ...yeni, paket: e.target.value })}
                style={S.input}
              >
                {PAKETLER.map((p) => (
                  <option key={p.kod} value={p.kod}>
                    {p.ad}
                  </option>
                ))}
              </select>
            </label>
            <label style={S.lbl}>
              Adet
              <input
                type="number"
                min="1"
                max="50"
                value={yeni.adet}
                onChange={(e) => setYeni({ ...yeni, adet: e.target.value })}
                style={S.input}
              />
            </label>
            <label style={{ ...S.lbl, flex: 2 }}>
              Müşteri (Telegram / isim)
              <input
                value={yeni.musteri}
                onChange={(e) => setYeni({ ...yeni, musteri: e.target.value })}
                placeholder="@kullanici"
                style={S.input}
              />
            </label>
            <label style={{ ...S.lbl, flex: 2 }}>
              Not
              <input
                value={yeni.aciklama}
                onChange={(e) => setYeni({ ...yeni, aciklama: e.target.value })}
                placeholder="ödeme, kampanya vb."
                style={S.input}
              />
            </label>
            <button style={{ ...S.btn, ...S.btnAltin, alignSelf: 'flex-end' }}>Üret</button>
          </div>

          {uretilen.length > 0 && (
            <div style={S.uretilen}>
              <div style={{ fontSize: 12, color: 'var(--gri)', marginBottom: 8 }}>
                Üretilen anahtarlar — tıklayarak kopyala:
              </div>
              {uretilen.map((a) => (
                <code key={a} onClick={() => kopyala(a)} style={S.kod}>
                  {a}
                </code>
              ))}
              <button
                type="button"
                onClick={() => kopyala(uretilen.join('\n'))}
                style={{ ...S.btn, ...S.btnHayalet, marginTop: 10, fontSize: 12, padding: '8px 14px' }}
              >
                Hepsini kopyala
              </button>
            </div>
          )}
        </form>

        {/* ---- liste ---- */}
        <div style={S.kart}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <h2 style={{ ...S.h2, marginBottom: 0 }}>Anahtarlar</h2>
            <input
              value={ara}
              onChange={(e) => {
                setAra(e.target.value);
                yukle(e.target.value);
              }}
              placeholder="Anahtar veya müşteri ara…"
              style={{ ...S.input, marginLeft: 'auto', maxWidth: 280 }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={S.tablo}>
              <thead>
                <tr>
                  {['Anahtar', 'Paket', 'Cihaz', 'Kalan', 'Müşteri', 'Üretim', 'İşlem'].map((b) => (
                    <th key={b} style={S.th}>
                      {b}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liste.map((l) => {
                  const k = kalanMetin(l);
                  return (
                    <Fragment key={l.id}>
                      <tr style={{ opacity: l.iptal ? 0.5 : 1 }}>
                        <td style={S.td}>
                          <code onClick={() => kopyala(l.anahtar)} style={{ ...S.kod, margin: 0 }}>
                            {l.anahtar}
                          </code>
                        </td>
                        <td style={S.td}>{l.paket}</td>
                        <td style={S.td}>
                          <span style={{ color: l.cihaz_sayisi >= l.max_cihaz ? 'var(--kirmizi)' : 'var(--beyaz)' }}>
                            {l.cihaz_sayisi}/{l.max_cihaz}
                          </span>
                        </td>
                        <td style={{ ...S.td, color: k.renk, fontWeight: 700 }}>{k.yazi}</td>
                        <td style={S.td}>{l.musteri || '—'}</td>
                        <td style={{ ...S.td, color: 'var(--gri2)', fontSize: 11.5 }}>{tarih(l.olusturma)}</td>
                        <td style={S.td}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button onClick={() => detay(l.id)} style={S.mini}>
                              {acik === l.id ? 'Kapat' : 'Detay'}
                            </button>
                            {l.iptal ? (
                              <button onClick={() => islem(l.id, { islem: 'geriAl' })} style={S.mini}>
                                Aktif et
                              </button>
                            ) : (
                              <button onClick={() => islem(l.id, { islem: 'iptal' })} style={{ ...S.mini, ...S.miniKirmizi }}>
                                İptal
                              </button>
                            )}
                            <button onClick={() => islem(l.id, { islem: 'uzat', saat: 24 })} style={S.mini}>
                              +1 gün
                            </button>
                            <button onClick={() => islem(l.id, { islem: 'uzat', saat: 168 })} style={S.mini}>
                              +7 gün
                            </button>
                          </div>
                        </td>
                      </tr>
                      {acik === l.id && (
                        <tr>
                          <td colSpan="7" style={S.detay}>
                            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 12 }}>
                              <span style={S.bilgi}>
                                <b>Aktivasyon:</b> {tarih(l.aktivasyon)}
                              </span>
                              <span style={S.bilgi}>
                                <b>Bitiş:</b> {tarih(l.bitis)}
                              </span>
                              <span style={S.bilgi}>
                                <b>Son görülme:</b> {tarih(l.son_gorulme)}
                              </span>
                              {l.aciklama && (
                                <span style={S.bilgi}>
                                  <b>Not:</b> {l.aciklama}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--gri)', marginBottom: 8 }}>
                              Bağlı bilgisayarlar ({cihazlar.length}/{l.max_cihaz}):
                            </div>
                            {cihazlar.length === 0 && (
                              <div style={{ color: 'var(--gri2)', fontSize: 12.5 }}>Henüz hiçbir bilgisayarda açılmamış.</div>
                            )}
                            {cihazlar.map((c) => (
                              <div key={c.id} style={S.cihaz}>
                                <code style={{ fontSize: 11.5, color: 'var(--altin2)' }}>{c.hwid}</code>
                                <span style={{ fontSize: 11.5, color: 'var(--gri2)' }}>ilk: {tarih(c.ilk)}</span>
                                <span style={{ fontSize: 11.5, color: 'var(--gri2)' }}>son: {tarih(c.son)}</span>
                                <button
                                  onClick={() => islem(l.id, { islem: 'cihazSil', hwid: c.hwid })}
                                  style={{ ...S.mini, ...S.miniKirmizi, marginLeft: 'auto' }}
                                >
                                  Kaldır
                                </button>
                              </div>
                            ))}
                            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                              <button onClick={() => islem(l.id, { islem: 'cihazSifirla' })} style={S.mini}>
                                Tüm cihazları sıfırla
                              </button>
                              <button onClick={() => sil(l.id)} style={{ ...S.mini, ...S.miniKirmizi }}>
                                Anahtarı sil
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {liste.length === 0 && (
            <div style={{ color: 'var(--gri2)', fontSize: 13, padding: '18px 0' }}>Kayıt yok.</div>
          )}
        </div>
      </div>

      {mesaj && <div style={S.bildirim}>{mesaj}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ stil */
const S = {
  sar: { width: 'min(1240px,94vw)', margin: '0 auto' },
  girisSar: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  girisKutu: {
    width: 'min(380px,92vw)',
    background: 'linear-gradient(180deg,#0d1421,#080d16)',
    border: '1px solid rgba(231,193,99,.18)',
    borderRadius: 22,
    padding: 32,
    boxShadow: '0 30px 80px -35px #000',
  },
  ust: { display: 'flex', alignItems: 'center', gap: 13, marginBottom: 24 },
  istIzgara: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 13, marginBottom: 18 },
  istKart: {
    background: 'linear-gradient(180deg,#0d1421,#080d16)',
    border: '1px solid rgba(255,255,255,.07)',
    borderRadius: 16,
    padding: '16px 18px',
  },
  kart: {
    background: 'linear-gradient(180deg,#0d1421,#080d16)',
    border: '1px solid rgba(255,255,255,.07)',
    borderRadius: 18,
    padding: 22,
    marginBottom: 18,
  },
  h2: { fontSize: 16, marginBottom: 16 },
  form: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' },
  lbl: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5, color: 'var(--gri)', flex: 1, minWidth: 120 },
  input: {
    background: '#111826',
    border: '1px solid rgba(255,255,255,.09)',
    borderRadius: 11,
    padding: '11px 13px',
    color: '#eef2f8',
    fontSize: 13.5,
    fontFamily: 'inherit',
    width: '100%',
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
  btnHayalet: { background: 'rgba(255,255,255,.04)', borderColor: 'rgba(255,255,255,.1)', color: '#eef2f8' },
  uretilen: { marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.07)' },
  kod: {
    display: 'inline-block',
    background: 'rgba(231,193,99,.1)',
    border: '1px solid rgba(231,193,99,.25)',
    color: '#f9e39c',
    borderRadius: 8,
    padding: '6px 11px',
    fontSize: 12.5,
    fontFamily: 'Consolas,monospace',
    margin: '0 7px 7px 0',
    cursor: 'pointer',
    letterSpacing: 0.4,
  },
  tablo: { width: '100%', borderCollapse: 'collapse', minWidth: 900 },
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
  td: { padding: '11px 10px', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,.04)', verticalAlign: 'middle' },
  detay: { padding: '14px 12px 18px', background: 'rgba(255,255,255,.02)', borderBottom: '1px solid rgba(255,255,255,.07)' },
  bilgi: { fontSize: 12, color: 'var(--gri)' },
  cihaz: {
    display: 'flex',
    gap: 14,
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: '8px 11px',
    background: 'rgba(255,255,255,.03)',
    borderRadius: 9,
    marginBottom: 6,
  },
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
  bildirim: {
    position: 'fixed',
    bottom: 22,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg,#f9e39c,#e7c163)',
    color: '#241b04',
    padding: '11px 22px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 800,
    zIndex: 90,
  },
};
