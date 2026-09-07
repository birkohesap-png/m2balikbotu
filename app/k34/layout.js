// Yonetim paneli arama motorlarindan TAMAMEN gizli olmali.
// robots.txt'e yazmiyoruz — orada yazmak yolu herkese duyurmak olurdu.
export const metadata = {
  title: 'Panel',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function PanelLayout({ children }) {
  return children;
}
