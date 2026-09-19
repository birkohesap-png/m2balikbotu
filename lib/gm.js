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
export async function gatewayGmTara({ zamanAsimiMs = 16000 } = {}) {
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
  // Uyeleri ve presence'lari AYRI topla, en sonda birlestir (mesaj sirasi degisken:
  // uye chunk'i presence'tan once/sonra gelebilir).
  const uyeById = new Map();   // userId -> GM adi (bizim listeyle eslesenler)
  const presById = new Map();  // userId -> status
  const aktif = new Set();
  const debug = {
    hello: false, ready: false, invalid: false, close: null,
    kanal: kanalEnv || null, olaylar: [], listeGuncelleme: 0,
    chunk: 0, gorulenUye: 0, gcPres: 0, uyeSayisi: 0, presSayisi: 0,
    eslesen: [], presenceOrnek: [],
  };

  return await new Promise((resolve) => {
    let ws;
    let kalp = null;
    let erken = null;
    let bitti = false;
    let seq = null;

    const kapat = (hata) => {
      if (bitti) return;
      bitti = true;
      if (kalp) clearInterval(kalp);
      if (erken) clearTimeout(erken);
      clearTimeout(sonSure);
      // Uye + presence birlestir -> aktif GM'ler
      debug.uyeSayisi = uyeById.size;
      debug.presSayisi = presById.size;
      for (const [id, ad] of uyeById) {
        const st = presById.get(id) || 'offline';
        if (debug.presenceOrnek.length < 15) debug.presenceOrnek.push({ ad, status: st });
        if (AKTIF_DURUMLAR.has(st)) {
          aktif.add(ad);
          if (!debug.eslesen.includes(ad)) debug.eslesen.push(ad);
        }
      }
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
    // Bir uye kaydini soger: eslesiyorsa uyeById'ye, presence varsa presById'ye.
    const uyeSog = (m) => {
      if (!m || !m.user || !m.user.id) return;
      const ad = uyeAdi(m);
      if (ad) uyeById.set(String(m.user.id), ad);
      const st = m.presence && m.presence.status;
      if (st) presById.set(String(m.user.id), st);
    };
    const presSog = (liste) => {
      for (const pr of liste || []) {
        const id = pr && pr.user && pr.user.id;
        if (id && pr.status) presById.set(String(id), pr.status);
      }
    };

    // Uye listesi (op 14) + yedek sorgu (op 8) - guild HAZIR olunca bir kez yolla.
    let istendi = false;
    const istekleriYolla = (guildObj) => {
      let kanal = kanalEnv || debug.kanal;
      if (!kanal && guildObj) {
        const kanallar = guildObj.channels || [];
        const metin = kanallar.find((c) => c.type === 0)
          || kanallar.find((c) => c.type === 5) || kanallar[0];
        if (metin) kanal = metin.id;
      }
      debug.kanal = kanal || null;
      if (istendi) return;
      istendi = true;
      // op 14: uye listesi (istemcinin sagdaki listesi). Gercek istemci formati.
      const uyeListesiIste = () => {
        if (!kanal) return;
        yolla(14, {
          guild_id: guild,
          typing: true, threads: false, activities: true,
          // Cevrimici uyeler listenin ustunde; genis aralik istersek derindeki
          // GM'leri de yakalariz (hoisted rol gruplari zaten en ustte).
          channels: { [kanal]: [[0, 99], [100, 199], [200, 299], [300, 399], [400, 499]] },
        });
      };
      uyeListesiIste();
      setTimeout(uyeListesiIste, 1500); // guild tam otursun diye bir kez daha
      // Yedek: her GM adini ayri sorgula (uye ID'sini bulmak icin - presence
      // kullanici tokeninde gelmese de uye eslesmesi buradan da olur).
      for (const ad of isimler) {
        yolla(8, { guild_id: guild, query: ad, limit: 5, presences: true, nonce: 'k34_' + ad });
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

      if (p.op === 9) { debug.invalid = true; return kapat('gecersiz_oturum'); }
      if (p.op !== 0) return;

      if (debug.olaylar.length < 40) debug.olaylar.push(p.t);

      if (p.t === 'READY') {
        debug.ready = true;
        // Kucuk guild READY'de tam gelir; buyuk guild "unavailable" gelir, veri
        // GUILD_CREATE'te dolar. Kanali/uyeleri varsa simdi baslat, yoksa bekle.
        const g = (p.d.guilds || []).find((x) => String(x.id) === String(guild));
        if (g) {
          (g.members || []).forEach(uyeSog);
          presSog(g.presences);
          if ((g.channels || []).length) istekleriYolla(g);
        }
        return;
      }

      if (p.t === 'GUILD_CREATE') {
        const d = p.d || {};
        if (String(d.id) !== String(guild)) return;
        (d.members || []).forEach(uyeSog);
        presSog(d.presences);
        debug.gcPres += (d.presences || []).length;
        istekleriYolla(d); // guild artik hazir -> uye listesini iste
        return;
      }

      if (p.t === 'READY_SUPPLEMENTAL') {
        // merged_presences.guilds: guild'lerin presence dizileri (READY sirasiyla).
        const mp = p.d && p.d.merged_presences;
        for (const arr of (mp && mp.guilds) || []) presSog(arr);
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
            uyeSog(m); // op 14 uyeleri presence'i icinde tasir
          }
        }
        // Uye listesi geldi -> kisa sure daha bekleyip kapat (ek op'lar icin).
        if (!erken) erken = setTimeout(() => kapat(), 2500);
        return;
      }

      if (p.t === 'GUILD_MEMBERS_CHUNK') {
        debug.chunk++;
        const d = p.d || {};
        (d.members || []).forEach((m) => { debug.gorulenUye++; uyeSog(m); });
        presSog(d.presences);
        return;
      }
    };
    ws.onerror = () => { kapat('baglanti_hatasi'); };
    ws.onclose = (ev) => {
      debug.close = { code: ev && ev.code, reason: (ev && ev.reason) || '' };
      kapat();
    };
  });
}
