'use client';

import { useState, useEffect, useCallback } from 'react';

/** Galeri + tıklayınca büyüten lightbox. gorseller = [{src, baslik}, ...] */
export default function Galeri({ gorseller }) {
  const [acik, setAcik] = useState(null); // seçili index veya null

  const gec = useCallback(
    (d) => setAcik((p) => (p === null ? p : (p + d + gorseller.length) % gorseller.length)),
    [gorseller]
  );

  useEffect(() => {
    if (acik === null) return;
    function onKey(e) {
      if (e.key === 'Escape') setAcik(null);
      else if (e.key === 'ArrowRight') gec(1);
      else if (e.key === 'ArrowLeft') gec(-1);
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [acik, gec]);

  if (!gorseller || gorseller.length === 0) {
    return (
      <div className="galeri">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div className="galeri-bos" key={i}>
            Görsel {i}
            <br />
            <span style={{ fontSize: 11 }}>public/galeri klasörüne ekleyin</span>
          </div>
        ))}
      </div>
    );
  }

  const g = acik !== null ? gorseller[acik] : null;

  return (
    <>
      <div className="galeri">
        {gorseller.map((im, i) => (
          <figure key={im.src} onClick={() => setAcik(i)} style={{ cursor: 'zoom-in' }}>
            <img
              src={im.src}
              alt={'Metin2 Balık Botu ekran görüntüsü — ' + im.baslik}
              loading="lazy"
            />
            <figcaption>{im.baslik}</figcaption>
          </figure>
        ))}
      </div>

      {g && (
        <div className="lightbox" onClick={() => setAcik(null)}>
          <button className="lb-kapat" onClick={() => setAcik(null)} aria-label="Kapat">
            ✕
          </button>
          {gorseller.length > 1 && (
            <button
              className="lb-ok lb-sol"
              onClick={(e) => {
                e.stopPropagation();
                gec(-1);
              }}
              aria-label="Önceki"
            >
              ‹
            </button>
          )}
          <figure className="lb-ic" onClick={(e) => e.stopPropagation()}>
            <img src={g.src} alt={g.baslik} />
            <figcaption>
              {g.baslik} &nbsp;·&nbsp; {acik + 1}/{gorseller.length}
            </figcaption>
          </figure>
          {gorseller.length > 1 && (
            <button
              className="lb-ok lb-sag"
              onClick={(e) => {
                e.stopPropagation();
                gec(1);
              }}
              aria-label="Sonraki"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
