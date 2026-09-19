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
 * Discord Gateway'e kisa bir baglanti acip verilen GM isimlerinin cevrimici
 * olup olmadigina bakar. Doner: { aktif: [ad,...], debug, hata? }.
 *
 * Kullanici hesaplarina Discord "su kisi cevrimici mi" diye REST vermez; bu
 * yuzden gercek istemcinin yaptigi gibi Gateway'den okuyoruz. Iki yol birden
 * denenir (hangisi calisirsa):
 *   1) op 14 "lazy guild" -> GUILD_MEMBER_LIST_UPDATE: istemcinin sagdaki uye
 *      listesi. Cevrimici uyeler rol gruplari altinda, presence ile gelir.
 *   2) op 8 "Request Guild Members" (presences:true) -> GUILD_MEMBERS_CHUNK.
 * debug: ne geldigini gormek icin (/api/gm?debug=1).
 */
export async function gatewayGmTara({ zamanAsimiMs = 12000 } = {}) {
  const token = process.env.DISCORD_TOKEN;
  const guild = process.env.DISCORD_GUILD;
  const kanalEnv = String(process.env.DISCORD_KANAL || '').trim();
  const isimler = gmIsimleri();
  if (!token || !guild || !isimler.length) {
    return { aktif: [], hata: 'ayarsiz' };
  }
  if (typeof WebSocket === 'undefined') {
    return { aktif: [], hata: 'websocket_yok' };
  }

  const hedef = new Map(isimler.map((a) => [a.toLowerCase(), a]));
  const aktif = new Set();
  const debug = {
    hello: false, ready: false, invalid: false, close: null,
    kanal: kanalEnv || null, olaylar: [], listeGuncelleme: 0,
    chunk: 0, gorulenUye: 0, eslesen: [], presenceOrnek: [],
  };

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
      resolve({ aktif: [...aktif], debug, ...(hata ? { hata } : {}) });
    };
    const sonSure = setTimeout(() => kapat(), zamanAsimiMs);

    try {
      ws = new WebSocket(GATEWAY);
    } catch (e) {
      clearTimeout(sonSure);
      return resolve({ aktif: [], debug, hata: String(e) });
    }

    const yolla = (op, d) => {
      try { ws.send(JSON.stringify({ op, d })); } catch {}
    };

    // Bir uyenin GM listemizle eslesip eslesmedigini soyler (username/ad/nick).
    const uyeAdi = (m) => {
      const u = (m && m.user) || {};
      const adlar = [u.username, u.global_name, m && m.nick]
        .filter(Boolean).map((s) => String(s).toLowerCase());
      for (const ad of adlar) if (hedef.has(ad)) return hedef.get(ad);
      return null;
    };
    const uyeIsle = (m, status) => {
      const es = uyeAdi(m);
      if (!es) return;
      if (debug.presenceOrnek.length < 12) {
        debug.presenceOrnek.push({ ad: es, status: status || 'offline' });
      }
      if (AKTIF_DURUMLAR.has(status)) {
        aktif.add(es);
        if (!debug.eslesen.includes(es)) debug.eslesen.push(es);
      }
    };

    ws.onmessage = (ev) => {
      let p;
      try { p = JSON.parse(ev.data); } catch { return; }
      if (p.s != null) seq = p.s;

      if (p.op === 10) {
        debug.hello = true;
        const aralik = (p.d && p.d.heartbeat_interval) || 41250;
        kalp = setInterval(() => yolla(1, seq), aralik);
        yolla(1, seq);
        // Kullanici hesabi kimligi (gercek istemci gibi).
        yolla(2, {
          token,
          capabilities: 161789,
          properties: {
            os: 'Windows', browser: 'Chrome', device: '',
            system_locale: 'tr-TR',
            browser_user_agent:
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
              '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            browser_version: '124.0.0.0', os_version: '10', release_channel: 'stable',
          },
          presence: { status: 'online', since: 0, activities: [], afk: false },
          compress: false,
          client_state: { guild_versions: {} },
        });
        return;
      }

      if (p.op === 9) { debug.invalid = true; clearTimeout(sonSure); return kapat('gecersiz_oturum'); }
      if (p.op !== 0) return;

      if (debug.olaylar.length < 40) debug.olaylar.push(p.t);

      if (p.t === 'READY') {
        debug.ready = true;
        // Guild'in okunabilir bir metin kanalini bul (op 14 icin gerekli).
        let kanal = kanalEnv;
        if (!kanal) {
          const g = (p.d.guilds || []).find((x) => String(x.id) === String(guild));
          const kanallar = (g && g.channels) || [];
          const metin = kanallar.find((c) => c.type === 0) || kanallar[0];
          if (metin) kanal = metin.id;
          debug.kanal = kanal || null;
        }
        // 1) Uye listesi (istemci yontemi)
        if (kanal) {
          yolla(14, {
            guild_id: guild,
            typing: true, threads: false, activities: true,
            members: [], thread_member_lists: [],
            channels: { [kanal]: [[0, 99], [100, 199]] },
          });
        }
        // 2) Yedek: her GM adini ayri sorgula
        for (const ad of isimler) {
          yolla(8, { guild_id: guild, query: ad, limit: 5, presences: true, nonce: 'k34_' + ad });
        }
        return;
      }

      if (p.t === 'GUILD_MEMBER_LIST_UPDATE') {
        debug.listeGuncelleme++;
        const d = p.d || {};
        for (const op of d.ops || []) {
          const kayitlar = op.items || (op.item ? [op.item] : []);
          for (const it of kayitlar) {
            const m = it && it.member;
            if (!m) continue;
            debug.gorulenUye++;
            const st = (m.presence && m.presence.status) || 'offline';
            uyeIsle(m, st);
          }
        }
        return;
      }

      if (p.t === 'GUILD_MEMBERS_CHUNK') {
        debug.chunk++;
        const d = p.d || {};
        const presById = new Map(
          (d.presences || []).map((pr) => [pr.user && pr.user.id, pr.status])
        );
        for (const m of d.members || []) {
          debug.gorulenUye++;
          const st = presById.get(m.user && m.user.id) || 'offline';
          uyeIsle(m, st);
        }
        return;
      }
    };
    ws.onerror = () => { clearTimeout(sonSure); kapat('baglanti_hatasi'); };
    ws.onclose = (ev) => {
      debug.close = { code: ev && ev.code, reason: (ev && ev.reason) || '' };
      clearTimeout(sonSure);
      kapat();
    };
  });
}
