// GM (oyun yoneticisi) nobeti.
//
// Amac: Metin2/Gameforge resmi Discord'unda bir GM cevrimici olunca tum
// musterilere Telegram'dan "GM aktif, oyunu kapat" uyarisi dusurmek.
//
// Nasil calisir: Vercel serverless oldugu icin surekli acik bir surec yok.
// Disaridan bir zamanlayici (or. cron-job.org) /api/gm ucunu ~30 sn'de bir
// gizli anahtarla durter; o uc de burayi cagirir. Burasi Discord Gateway'e
// (WebSocket) KISA bir baglanti acar, verilen GM isimlerinin cevrimici olup
// olmadigina bakar, baglantiyi kapatir ve sonucu doner.
//
// Discord anahtari SADECE sunucunun ortam degiskeninde (DISCORD_TOKEN) durur;
// musteri exe'sine hicbir sey girmez, kimse gormez.
//
// ENV:
//   DISCORD_TOKEN   Kullanicinin kendi Discord oturum anahtari (user token).
//   DISCORD_GUILD   Izlenecek sunucunun (guild) kimligi.
//   GM_ISIMLER      GM kullanici adlari, virgulle ayrilmis (or. "GM_Ali,GM_Veli").
//   GM_TARA_GIZLI   /api/gm ucunu koruyan gizli anahtar (zamanlayici bunu yollar).
//
// NOT: Discord'un normal hesaplara "su kisi cevrimici mi" diye resmi bir REST
// yolu yok; bu yuzden gercek Discord istemcisinin yaptigi gibi Gateway'den
// okuyoruz. Bu kisim kullanicinin kendi anahtariyla CANLI ayar isteyebilir;
// tek dokunulacak yer asagidaki gatewayGmTara().

const GATEWAY = 'wss://gateway.discord.gg/?v=10&encoding=json';
const AKTIF_DURUMLAR = new Set(['online', 'idle', 'dnd']);

/**
 * ENV'den GM listesini {ad, risk} olarak okur.
 * Bicim: "pegasustr:yuksek, disfrutotr:dusuk"  (risk yazilmazsa 'yuksek').
 * risk sadece 'yuksek' | 'dusuk' olabilir; Telegram bildiriminin tonunu belirler.
 */
export function gmListesi() {
  return String(process.env.GM_ISIMLER || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((parca) => {
      const i = parca.lastIndexOf(':');
      let ad = parca;
      let risk = 'yuksek';
      if (i > 0) {
        const son = parca.slice(i + 1).trim().toLowerCase();
        if (son === 'yuksek' || son === 'dusuk') {
          ad = parca.slice(0, i).trim();
          risk = son;
        }
      }
      return { ad, risk };
    })
    .filter((g) => g.ad);
}

/** Sadece GM adlari (Discord'da sorgulamak icin). */
export function gmIsimleri() {
  return gmListesi().map((g) => g.ad);
}

/** Bir GM adinin risk seviyesi ('yuksek' | 'dusuk'). Bulunamazsa 'yuksek'. */
export function gmRisk(ad) {
  const a = String(ad || '').toLowerCase();
  const g = gmListesi().find((x) => x.ad.toLowerCase() === a);
  return g ? g.risk : 'yuksek';
}

export function gmAyarliMi() {
  return !!(process.env.DISCORD_TOKEN && process.env.DISCORD_GUILD && gmIsimleri().length);
}

/**
 * Discord Gateway'e kisa bir baglanti acip verilen isimlerin cevrimici olup
 * olmadigina bakar. Doner: { aktif: [ad,...], hata? }.
 *
 * Akis: Hello -> Identify -> Ready -> her GM icin "Request Guild Members"
 * (op 8, presences:true) -> gelen uyelerin presence.status'una bak.
 */
export async function gatewayGmTara({ zamanAsimiMs = 9000 } = {}) {
  const token = process.env.DISCORD_TOKEN;
  const guild = process.env.DISCORD_GUILD;
  const isimler = gmIsimleri();
  if (!token || !guild || !isimler.length) {
    return { aktif: [], hata: 'ayarsiz' };
  }
  if (typeof WebSocket === 'undefined') {
    return { aktif: [], hata: 'websocket_yok' }; // Node 20+ gerekir
  }

  const hedef = new Map(isimler.map((a) => [a.toLowerCase(), a]));
  const aktif = new Set();

  return await new Promise((resolve) => {
    let ws;
    let kalp = null;
    let bitti = false;
    let seq = null;

    const kapat = (hata) => {
      if (bitti) return;
      bitti = true;
      if (kalp) clearInterval(kalp);
      try { ws && ws.close(); } catch {}
      resolve({ aktif: [...aktif], ...(hata ? { hata } : {}) });
    };
    const sonSure = setTimeout(() => kapat(), zamanAsimiMs);

    try {
      ws = new WebSocket(GATEWAY);
    } catch (e) {
      clearTimeout(sonSure);
      return resolve({ aktif: [], hata: String(e) });
    }

    const yolla = (op, d) => {
      try { ws.send(JSON.stringify({ op, d })); } catch {}
    };

    const uyeIsle = (m) => {
      const kullanici = m && m.user ? m.user : {};
      const adlar = [kullanici.username, kullanici.global_name, m && m.nick]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());
      for (const ad of adlar) {
        if (hedef.has(ad)) return hedef.get(ad);
      }
      return null;
    };

    ws.onmessage = (ev) => {
      let p;
      try { p = JSON.parse(ev.data); } catch { return; }
      if (p.s != null) seq = p.s;

      if (p.op === 10) {
        // Hello -> heartbeat + identify
        const aralik = (p.d && p.d.heartbeat_interval) || 41250;
        kalp = setInterval(() => yolla(1, seq), aralik);
        yolla(1, seq);
        // Kullanici hesabi kimligi (gercek istemci gibi). Bot anahtariysa da
        // Discord bunu genelde kabul eder.
        yolla(2, {
          token,
          capabilities: 30717,
          properties: {
            os: 'Windows',
            browser: 'Chrome',
            device: '',
            system_locale: 'tr-TR',
            browser_user_agent:
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
              '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
          presence: { status: 'invisible', since: 0, activities: [], afk: false },
          compress: false,
          client_state: { guild_versions: {} },
        });
      } else if (p.op === 0 && p.t === 'READY') {
        // Baglandik; her GM adini ayri ayri sorgula (presence ile birlikte).
        for (const ad of isimler) {
          yolla(8, {
            guild_id: guild,
            query: ad,
            limit: 5,
            presences: true,
          });
        }
        // Uyeler gelmezse (buyuk sunucularda gecikmeli) sonSure kapatir.
      } else if (p.op === 0 && p.t === 'GUILD_MEMBERS_CHUNK') {
        const d = p.d || {};
        const presById = new Map(
          (d.presences || []).map((pr) => [pr.user && pr.user.id, pr.status])
        );
        for (const m of d.members || []) {
          const eslesme = uyeIsle(m);
          if (!eslesme) continue;
          const st = presById.get(m.user && m.user.id) || 'offline';
          if (AKTIF_DURUMLAR.has(st)) aktif.add(eslesme);
        }
        // Tum isimler icin en az bir chunk geldiginde erken kapatabiliriz;
        // basitlik icin zaman asimini bekliyoruz (birkac sn).
        if (d.chunk_index != null && d.chunk_count != null &&
            d.chunk_index + 1 >= d.chunk_count && aktif.size >= isimler.length) {
          clearTimeout(sonSure);
          kapat();
        }
      } else if (p.op === 9) {
        // Invalid session
        clearTimeout(sonSure);
        kapat('gecersiz_oturum');
      }
    };
    ws.onerror = () => { clearTimeout(sonSure); kapat('baglanti_hatasi'); };
    ws.onclose = () => { clearTimeout(sonSure); kapat(); };
  });
}
