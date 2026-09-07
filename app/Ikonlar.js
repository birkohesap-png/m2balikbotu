/* Sayfalarin ortak kullandigi SVG ikonlar. */

const YOL = {
  fare: 'M4 3l7 17 2.5-6.5L20 11z',
  yapboz:
    'M9 3h6v2.5a1.5 1.5 0 003 0V3h3v3h-2.5a1.5 1.5 0 000 3H21v6h-2.5a1.5 1.5 0 000 3H21v3h-3v-2.5a1.5 1.5 0 00-3 0V21H9v-2.5a1.5 1.5 0 00-3 0V21H3v-6h2.5a1.5 1.5 0 000-3H3V6h2.5a1.5 1.5 0 000-3H3V3h6z',
  ates: 'M12 2c1 3-1 4-1 6a3 3 0 006 0c0-1 0-2-1-3 2 1 4 4 4 8a8 8 0 11-16 0c0-3 2-6 5-8-1 2 0 4 2 4 1-3-2-4-2-7z',
  login: 'M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3',
  multi: 'M16 11a3 3 0 100-6 3 3 0 000 6zm-8 0a3 3 0 100-6 3 3 0 000 6zm0 2c-2.7 0-8 1.3-8 4v3h10M16 13c2.7 0 8 1.3 8 4v3H10',
  telegram: 'M21.9 4.3l-3 14.2c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1-.6-4.7L18.4 6 7.6 12.2l-4.5-1.4L20.6 2.9z',
  filtre: 'M3 5h18l-7 8v6l-4 2v-8z',
  mola: 'M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

export const Ikon = ({ ad }) => (
  <span className="ikon">
    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d={YOL[ad] || YOL.fare} />
    </svg>
  </span>
);

export const Tik = () => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 6" />
  </svg>
);

export const TgIkon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.9 4.3l-3 14.2c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.2.2-.5.5-.9.5l.3-4.7L18.4 6c.4-.3-.1-.5-.6-.2L7.6 12.2l-4.5-1.4c-1-.3-1-.9.2-1.4L20.6 2.9c.8-.3 1.5.2 1.3 1.4z" />
  </svg>
);

export const IgIkon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.6" cy="6.4" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);
