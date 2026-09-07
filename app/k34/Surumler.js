'use client';

import { useCallback, useEffect, useState } from 'react';

const mb = (n) => (n ? (Number(n) / 1048576).toFixed(1) + ' MB' : '—');
const tarih = (t) =>
  t ? new Date(t).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const BOS = { surum: '', varlik_id: '', sha256: '', boyut: 0, notlar: '', zorunlu: false };

/**
 * Bot surumu yayinlama paneli.
 * Kurulum dosyasi OZEL GitHub deposunun Releases bolumunde durur; burada
 * yalnizca "hangi dosya, hangi surum" kaydi tutulur. Bot /api/surum'a sorar.
 */
export default function Surumler({ bildir }) {
  const [surumler, setSurumler] = useState([]);
  const [varliklar, setVarliklar] = useState([]);
  const [ghHata, setGhHata] = useState('');
  const [f, setF] = useState(BOS);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const yenile = useCallback(async () => {
    try {
      const r = await fetch('/api/k34/surumler', { cache: 'no-store' });
      const d = await r.json();
      if (d.ok) {
        setSurumler(d.surumler || []);
        setVarliklar(d.varliklar || []);
        setGhHata(d.ghHata || '');
      }
    } catch {
      setGhHata('Sunucuya ulasilamadi');
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    yenile();
  }, [yenile]);

  async function yayinla(e) {
    e.preventDefault();
    setGonderiliyor(true);
    try {
      const r = await fetch('/api/k34/surumler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      const d = await r.json();
      if (d.ok) {
        bildir?.('Sürüm yayınlandı — botlar bir sonraki açılışta görecek');
        setF(BOS);
        yenile();
      } else {
        bildir?.(d.mesaj || 'Yayınlanamadı');
      }
    } catch (x) {
      bildir?.(String(x));
    } finally {
      setGonderiliyor(false);
    }
  }

  async function aktifDegistir(id, aktif) {
    await fetch('/api/k34/surumler', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, aktif }),
    });
    yenile();
  }

  function varlikSec(id) {
    const v = varliklar.find((x) => x.id === id);
    setF((o) => ({ ...o, varlik_id: id, boyut: v ? v.boyut : 0 }));
  }

  return (
    <div style={S.kart}>
      <h2 style={S.h2}>Bot Sürümleri — Otomatik Güncelleme</h2>

      <p style={S.yardim}>
        Kurulum dosyasını önce özel GitHub deposunun <b>Releases</b> bölümüne yükle.
        Sonra burada seç, sürümü ve <code>yayinla.py</code>&apos;nin verdiği SHA-256&apos;yı
        gir. Botlar bir sonraki açılışta güncellemeyi kendileri bulur.
      </p>

      {ghHata && (
        <div style={S.uyari}>
          GitHub bağlantısı yok: {ghHata}
          <br />
          Vercel → Settings → Environment Variables içine <code>GH_REPO</code> ve{' '}
          <code>GH_TOKEN</code> ekle.
        </div>
      )}

      <form onSubmit={yayinla} style={S.form}>
        <label style={{ ...S.lbl, minWidth: 110, flex: '0 0 110px' }}>
          Sürüm
          <input
            value={f.surum}
            onChange={(e) => setF({ ...f, surum: e.target.value })}
            placeholder="2.2.0"
            style={S.input}
            required
          />
        </label>

        <label style={{ ...S.lbl, minWidth: 240 }}>
          GitHub dosyası
          <select
            value={f.varlik_id}
            onChange={(e) => varlikSec(e.target.value)}
            style={S.input}
            required
            disabled={!varliklar.length}
          >
            <option value="">
              {varliklar.length ? 'Dosya seç…' : 'Yüklü dosya yok'}
            </option>
            {varliklar.map((v) => (
              <option key={v.id} value={v.id}>
                {v.ad} ({mb(v.boyut)}) — {v.yayin}
              </option>
            ))}
          </select>
        </label>

        <label style={{ ...S.lbl, minWidth: 300, flex: 2 }}>
          SHA-256 (yayinla.py çıktısından)
          <input
            value={f.sha256}
            onChange={(e) => setF({ ...f, sha256: e.target.value.trim() })}
            placeholder="64 karakterlik hex"
            style={{ ...S.input, fontFamily: 'ui-monospace,Consolas,monospace', fontSize: 12 }}
          />
        </label>

        <label style={{ ...S.lbl, minWidth: '100%' }}>
          Sürüm notları (her satır bir madde — botta bu liste gösterilir)
          <textarea
            value={f.notlar}
            onChange={(e) => setF({ ...f, notlar: e.target.value })}
            rows={4}
            placeholder={'Balık Yapboz botu eklendi\nVuruşlar daha insansı hale getirildi'}
            style={{ ...S.input, resize: 'vertical', lineHeight: 1.6 }}
          />
        </label>

        <label style={{ ...S.lbl, flexDirection: 'row', alignItems: 'center', gap: 9, minWidth: 220, flex: '0 0 auto' }}>
          <input
            type="checkbox"
            checked={f.zorunlu}
            onChange={(e) => setF({ ...f, zorunlu: e.target.checked })}
            style={{ width: 16, height: 16 }}
          />
          Zorunlu güncelleme (&quot;Sonra&quot; butonu gizlenir)
        </label>

        <button
          type="submit"
          disabled={gonderiliyor || !f.varlik_id}
          style={{ ...S.btn, ...S.btnAltin, opacity: gonderiliyor || !f.varlik_id ? 0.5 : 1 }}
        >
          {gonderiliyor ? 'Yayınlanıyor…' : 'Yayınla'}
        </button>
      </form>

      <div style={{ marginTop: 22, overflowX: 'auto' }}>
        <table style={S.tablo}>
          <thead>
            <tr>
              {['Sürüm', 'Durum', 'Boyut', 'Zorunlu', 'Yayın', ''].map((b) => (
                <th key={b} style={S.th}>
                  {b}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {surumler.map((s) => (
              <tr key={s.id}>
                <td style={{ ...S.td, fontWeight: 800 }}>v{s.surum}</td>
                <td style={S.td}>
                  <span style={{ color: s.aktif ? 'var(--yesil)' : 'var(--gri2)' }}>
                    {s.aktif ? 'YAYINDA' : 'pasif'}
                  </span>
                </td>
                <td style={S.td}>{mb(s.boyut)}</td>
                <td style={S.td}>{s.zorunlu ? 'evet' : '—'}</td>
                <td style={S.td}>{tarih(s.yayin)}</td>
                <td style={S.td}>
                  <button
                    onClick={() => aktifDegistir(s.id, !s.aktif)}
                    style={{ ...S.mini, ...(s.aktif ? S.miniKirmizi : {}) }}
                  >
                    {s.aktif ? 'Yayından kaldır' : 'Yayına al'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!yukleniyor && surumler.length === 0 && (
          <div style={{ color: 'var(--gri2)', fontSize: 13, padding: '16px 0' }}>
            Henüz sürüm yayınlanmadı.
          </div>
        )}
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
  h2: { fontSize: 16, marginBottom: 12 },
  yardim: { fontSize: 12.5, color: 'var(--gri)', lineHeight: 1.7, marginBottom: 16 },
  uyari: {
    fontSize: 12.5,
    lineHeight: 1.7,
    color: '#e0544f',
    background: 'rgba(224,84,79,.08)',
    border: '1px solid rgba(224,84,79,.3)',
    borderRadius: 11,
    padding: '11px 13px',
    marginBottom: 16,
  },
  form: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' },
  lbl: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 11.5,
    color: 'var(--gri)',
    flex: 1,
    minWidth: 120,
  },
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
  tablo: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    textAlign: 'left',
    padding: '9px 10px',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'var(--gri2)',
    borderBottom: '1px solid rgba(255,255,255,.09)',
    whiteSpace: 'nowrap',
  },
  td: { padding: '10px', borderBottom: '1px solid rgba(255,255,255,.05)', whiteSpace: 'nowrap' },
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
