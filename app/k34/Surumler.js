'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { URUN_AD, varlikUrunu } from '@/lib/urun';

const mb = (n) => (n ? (Number(n) / 1048576).toFixed(1) + ' MB' : '—');
const tarih = (t) =>
  t ? new Date(t).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const BOS = { surum: '', varlik_id: '', sha256: '', boyut: 0, notlar: '', zorunlu: false };

/* Urun basina renk + aciklama. TR = altin (site rengi), PvP = PvP botunun turuncusu. */
const URUN_TEMA = {
  tr: {
    renk: '#e7c163',
    zemin: 'rgba(231,193,99,.10)',
    kenar: 'rgba(231,193,99,.45)',
    alt: 'Metin2 TR balık botu',
    ornekSurum: '2.8.0',
    ornekNot: 'Balık Yapboz botu eklendi\nVuruşlar daha insansı hale getirildi',
  },
  pvp: {
    renk: '#f08a4b',
    zemin: 'rgba(240,138,75,.10)',
    kenar: 'rgba(240,138,75,.5)',
    alt: 'PvP sunucuları · client seçimli',
    ornekSurum: '1.2.7',
    ornekNot: 'Minik balıklar da açılıyor\nEnvanter taraması hızlandı',
  },
};

/**
 * Bot surumu yayinlama paneli - IKI URUN: K34 TR ve K34 PvP.
 * Kurulum dosyasi OZEL GitHub deposunun Releases bolumunde durur; burada
 * yalnizca "hangi urun, hangi dosya, hangi surum" kaydi tutulur.
 * Her urunun KENDI aktif surumu vardir; botlar /api/surum'a kendi urunleriyle
 * sorar (PvP botu urun=pvp, TR botu hicbir sey gondermez = tr).
 */
export default function Surumler({ bildir }) {
  const [surumler, setSurumler] = useState([]);
  const [varliklar, setVarliklar] = useState([]);
  const [ghHata, setGhHata] = useState('');
  const [urun, setUrun] = useState('tr');
  const [f, setF] = useState(BOS);
  const [tumDosyalar, setTumDosyalar] = useState(false);
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

  const tema = URUN_TEMA[urun];
  const urunuDegistir = (u) => {
    setUrun(u);
    setF(BOS);                 // baska urunun formu tasinmasin (yanlis yayin olmasin)
    setTumDosyalar(false);
  };

  // Her urunun su an yayindaki surumu (secicide gosterilir).
  const aktifler = useMemo(() => {
    const o = {};
    for (const s of surumler) {
      const u = s.urun || 'tr';
      if (s.aktif && !o[u]) o[u] = s;
    }
    return o;
  }, [surumler]);

  const urunSurumleri = surumler.filter((s) => (s.urun || 'tr') === urun);
  const uygunDosyalar = varliklar.filter((v) => varlikUrunu(v.ad) === urun);
  const gosterilenDosyalar = tumDosyalar ? varliklar : uygunDosyalar;
  const seciliDosya = varliklar.find((x) => x.id === f.varlik_id);
  const dosyaUyumsuz = seciliDosya && varlikUrunu(seciliDosya.ad) !== urun;

  async function yayinla(e) {
    e.preventDefault();
    if (dosyaUyumsuz) {
      const tamam = window.confirm(
        `DİKKAT: "${seciliDosya.ad}" dosyası ${URUN_AD[varlikUrunu(seciliDosya.ad)]} ` +
          `kurulumuna benziyor ama ${URUN_AD[urun]} olarak yayınlamak üzeresin.\n\n` +
          `Bu, ${URUN_AD[urun]} müşterilerine YANLIŞ botu kurdurur. Yine de devam edilsin mi?`,
      );
      if (!tamam) return;
    }
    setGonderiliyor(true);
    try {
      const r = await fetch('/api/k34/surumler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, urun }),
      });
      const d = await r.json();
      if (d.ok) {
        bildir?.(`${URUN_AD[urun]} v${f.surum} yayınlandı — botlar bir sonraki açılışta görecek`);
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

      {/* ---- URUN SECICI: TR / PvP ---- */}
      <div style={S.secici} role="tablist" aria-label="Ürün seç">
        {['tr', 'pvp'].map((u) => {
          const t = URUN_TEMA[u];
          const sec = u === urun;
          const a = aktifler[u];
          return (
            <button
              key={u}
              type="button"
              role="tab"
              aria-selected={sec}
              onClick={() => urunuDegistir(u)}
              style={{
                ...S.secBtn,
                border: '1px solid ' + (sec ? t.kenar : 'rgba(255,255,255,.08)'),
                background: sec ? t.zemin : 'rgba(255,255,255,.02)',
                boxShadow: sec ? `0 0 0 1px ${t.kenar} inset, 0 8px 24px -12px ${t.renk}` : 'none',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ ...S.nokta, background: t.renk, opacity: sec ? 1 : 0.45 }} />
                <span style={{ fontWeight: 800, fontSize: 15, color: sec ? t.renk : '#c3ccda' }}>
                  {URUN_AD[u]}
                </span>
              </span>
              <span style={S.secAlt}>{t.alt}</span>
              <span style={{ ...S.secAktif, color: a ? 'var(--yesil)' : 'var(--gri2)' }}>
                {a ? `Yayında: v${a.surum}` : 'Yayında sürüm yok'}
              </span>
            </button>
          );
        })}
      </div>

      <p style={S.yardim}>
        Kurulum dosyasını önce özel GitHub deposunun <b>Releases</b> bölümüne yükle. Sonra
        yukarıdan <b style={{ color: tema.renk }}>{URUN_AD[urun]}</b> seçiliyken dosyayı seç,
        sürümü ve <code>yayinla.py</code>&apos;nin verdiği SHA-256&apos;yı gir.{' '}
        {urun === 'pvp'
          ? 'Yalnızca PvP botları bu güncellemeyi görür; TR müşterileri etkilenmez.'
          : 'Yalnızca TR botları bu güncellemeyi görür; PvP müşterileri etkilenmez.'}
      </p>

      {ghHata && (
        <div style={S.uyari}>
          GitHub bağlantısı yok: {ghHata}
          <br />
          Vercel → Settings → Environment Variables içine <code>GH_REPO</code> ve{' '}
          <code>GH_TOKEN</code> ekle.
        </div>
      )}

      <form
        onSubmit={yayinla}
        style={{ ...S.form, border: '1px solid ' + tema.kenar, background: tema.zemin }}
      >
        <div style={{ ...S.formBaslik, color: tema.renk }}>
          {URUN_AD[urun]} için yeni sürüm yayınla
        </div>

        <label style={{ ...S.lbl, minWidth: 110, flex: '0 0 110px' }}>
          Sürüm
          <input
            value={f.surum}
            onChange={(e) => setF({ ...f, surum: e.target.value })}
            placeholder={tema.ornekSurum}
            style={S.input}
            required
          />
        </label>

        <label style={{ ...S.lbl, minWidth: 260 }}>
          <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span>GitHub dosyası ({URUN_AD[urun]})</span>
            {varliklar.length > uygunDosyalar.length && (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setTumDosyalar((x) => !x);
                }}
                style={{ color: 'var(--gri2)', fontSize: 11 }}
              >
                {tumDosyalar ? 'yalnız uygun olanlar' : 'tüm dosyaları göster'}
              </a>
            )}
          </span>
          <select
            value={f.varlik_id}
            onChange={(e) => varlikSec(e.target.value)}
            style={{ ...S.input, border: dosyaUyumsuz ? '1px solid rgba(224,84,79,.7)' : S.input.border }}
            required
            disabled={!gosterilenDosyalar.length}
          >
            <option value="">
              {gosterilenDosyalar.length
                ? 'Dosya seç…'
                : urun === 'pvp'
                  ? 'PvP dosyası yok (adında "PvP" geçmeli)'
                  : 'TR dosyası yok'}
            </option>
            {gosterilenDosyalar.map((v) => (
              <option key={v.id} value={v.id}>
                {v.ad} ({mb(v.boyut)}) — {v.yayin}
              </option>
            ))}
          </select>
          {dosyaUyumsuz && (
            <span style={{ color: '#e0544f', fontSize: 11.5 }}>
              Bu dosya {URUN_AD[varlikUrunu(seciliDosya.ad)]} kurulumuna benziyor!
            </span>
          )}
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
            placeholder={tema.ornekNot}
            style={{ ...S.input, resize: 'vertical', lineHeight: 1.6 }}
          />
        </label>

        <label
          style={{ ...S.lbl, flexDirection: 'row', alignItems: 'center', gap: 9, minWidth: 220, flex: '0 0 auto' }}
        >
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
          style={{
            ...S.btn,
            ...(urun === 'pvp' ? S.btnPvp : S.btnAltin),
            opacity: gonderiliyor || !f.varlik_id ? 0.5 : 1,
          }}
        >
          {gonderiliyor ? 'Yayınlanıyor…' : `${URUN_AD[urun]} olarak yayınla`}
        </button>
      </form>

      <div style={{ marginTop: 22, overflowX: 'auto' }}>
        <table style={S.tablo}>
          <thead>
            <tr>
              {['Ürün', 'Sürüm', 'Durum', 'Boyut', 'Zorunlu', 'Yayın', ''].map((b) => (
                <th key={b} style={S.th}>
                  {b}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {urunSurumleri.map((s) => {
              const t = URUN_TEMA[s.urun || 'tr'];
              return (
                <tr key={s.id}>
                  <td style={S.td}>
                    <span style={{ ...S.rozet, color: t.renk, border: '1px solid ' + t.kenar, background: t.zemin }}>
                      {(s.urun || 'tr').toUpperCase()}
                    </span>
                  </td>
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
              );
            })}
          </tbody>
        </table>
        {!yukleniyor && urunSurumleri.length === 0 && (
          <div style={{ color: 'var(--gri2)', fontSize: 13, padding: '16px 0' }}>
            {URUN_AD[urun]} için henüz sürüm yayınlanmadı.
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
  h2: { fontSize: 16, marginBottom: 14 },
  secici: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
    gap: 12,
    marginBottom: 16,
  },
  secBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 5,
    textAlign: 'left',
    padding: '14px 16px',
    borderRadius: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background .15s, border-color .15s, box-shadow .15s',
  },
  nokta: { width: 10, height: 10, borderRadius: 99, display: 'inline-block' },
  secAlt: { fontSize: 11.5, color: 'var(--gri2)' },
  secAktif: { fontSize: 12, fontWeight: 700 },
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
  form: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    borderRadius: 14,
    padding: 16,
  },
  formBaslik: { width: '100%', fontWeight: 800, fontSize: 13, letterSpacing: 0.3 },
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
  btnPvp: { background: 'linear-gradient(135deg,#ffc39a,#f08a4b 45%,#b9531c)', color: '#2a1004' },
  rozet: {
    display: 'inline-block',
    fontSize: 10.5,
    fontWeight: 800,
    letterSpacing: 1,
    padding: '3px 8px',
    borderRadius: 99,
  },
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
