// Sitenin TEK yapilandirma dosyasi. Domain/Telegram/fiyat degisirse SADECE burayi duzenle.

export const SITE = {
  // Canonical alan adi. Tum mutlak URL'ler (sitemap, og:url, schema) bunu kullanir.
  host: 'm2balikbotu.com',
  gorunen: 'm2balikbotu.com',
  get url() {
    return 'https://' + this.host;
  },
  ad: 'K34 Metin2 Balık Botu',
  kisaAd: 'K34 Balık Botu',

  // Telegram: satis ve destek icin ADMIN hesabi
  telegram: 'k34balik',
  get telegramUrl() {
    return 'https://t.me/' + this.telegram;
  },
  // Telegram: herkese acik GENEL SOHBET grubu
  telegramGrup: 'k34genel',
  get telegramGrupUrl() {
    return 'https://t.me/' + this.telegramGrup;
  },

  instagram: 'k34balik',
  get instagramUrl() {
    return 'https://instagram.com/' + this.instagram;
  },

  // YouTube kanali (schema.org sameAs + alt bilgi). Kanal ile site AYNI marka
  // olarak eslesir; Google bunu bilgi paneli / marka aramasinda kullanir.
  youtube: '@K34Official',
  get youtubeUrl() {
    return 'https://www.youtube.com/' + this.youtube;
  },

  // Ana sayfadaki tanitim videosu (YouTube ID). Ayrintilar VIDEOLAR'da.
  // Bos birakilirsa ana sayfada "video yakinda" kutusu gosterilir.
  youtubeId: 't6pTRfLN2HE',
  // K34 PvP tanitim videosu (YouTube ID) - /pvp-balik-botu ve ana sayfa PvP bolumu.
  youtubePvpId: 'DOyj4oopD50',

  // Google Search Console dogrulamasi. Konsoldaki "HTML etiketi" yonteminde
  // verilen content="..." degerini buraya yapistir; bos ise etiket basilmaz.
  googleDogrulama: '',
};

/** Sosyal hesaplar — schema.org sameAs ve alt bilgi baglantilari icin tek kaynak. */
export const SOSYAL = [
  { ad: 'Telegram Destek', kullanici: '@' + SITE.telegram, url: SITE.telegramUrl, ikon: 'telegram' },
  { ad: 'Telegram Grup', kullanici: '@' + SITE.telegramGrup, url: SITE.telegramGrupUrl, ikon: 'telegram' },
  { ad: 'Instagram', kullanici: '@' + SITE.instagram, url: SITE.instagramUrl, ikon: 'instagram' },
  { ad: 'YouTube', kullanici: SITE.youtube, url: SITE.youtubeUrl, ikon: 'youtube' },
];

/* YouTube tanitim videolari - VideoObject semasi ve video sitemap icin TEK kaynak.
   Basliklar/tarihler YouTube'daki gercek degerlerdir (oEmbed + izleme sayfasi). */
export const VIDEOLAR = {
  tanitim: {
    id: SITE.youtubeId,
    baslik: 'Metin2 Balık Botu 2026 | K34\u2019ile Ban YOK',
    aciklama:
      'K34 Metin2 Balık Botu 2026 tanıtımı: otomatik balık tutma, pişirme, Balık Yapboz ' +
      'botu, MultiAcc, Auto Login ve Telegram’dan uzaktan kontrol. Kurulum ve ayarlar.',
    tarih: '2026-09-29T03:50:35-07:00',
    saniye: 193,
  },
  pvp: {
    id: SITE.youtubePvpId,
    baslik: 'Metin2 PvP Balık Botu 2026 | Bütün PvP’lerde Çalışır — Rascal Dahil',
    aciklama:
      'K34 PvP Balık Botu: Rascal dahil koruma sistemli Metin2 PvP sunucularında çalışır. ' +
      'Client seçimi, kırmızı halka balık minigame’i, otomatik envanter bakımı ve MultiAcc.',
    tarih: '2026-09-30T02:17:57-07:00',
    saniye: 57,
  },
};

export const PAKETLER = [
  {
    kod: 'gunluk',
    ad: 'Günlük',
    fiyat: 300,
    sure: '24 saat',
    saat: 24,
    cihaz: 1,
    vurgu: false,
    rozet: null,
    ozet: 'Denemek ve tek seferlik farm için',
    ozellikler: [
      '1 bilgisayarda çalışır',
      'Tüm bot özellikleri açık',
      'Balık Yapboz otomatik oynama',
      'Otomatik pişirme + Auto Login',
      '7/24 Telegram desteği',
      'İlk 48 saat iade garantisi — beğenmezsen para iadesi',
    ],
  },
  {
    kod: 'haftalik',
    ad: 'Haftalık',
    fiyat: 1300,
    sure: '7 gün',
    saat: 168,
    cihaz: 2,
    vurgu: true,
    rozet: 'EN ÇOK TERCİH EDİLEN',
    ozet: 'Düzenli farm yapanlar için en dengeli paket',
    ozellikler: [
      '2 bilgisayarda aynı anda çalışır',
      'Tüm bot özellikleri açık',
      'Balık Yapboz otomatik oynama',
      'Otomatik pişirme + Auto Login',
      'MultiAcc (çoklu pencere) desteği',
      '7/24 Telegram desteği',
      'İlk 48 saat iade garantisi — beğenmezsen para iadesi',
    ],
  },
  {
    kod: 'aylik',
    ad: 'Aylık',
    fiyat: 2500,
    sure: '30 gün',
    saat: 720,
    cihaz: 6,
    vurgu: false,
    rozet: 'VM KURULUMU DAHİL',
    ozet: 'Profesyonel farm — bilgisayarın kaldırdığı kadar sanal makine',
    ozellikler: [
      '6 bilgisayarda aynı anda çalışır',
      'BYPASS’LI SANAL MAKİNE KURULUMU DAHİL',
      'Bilgisayarın kaldırdığı kadar VM kurulur',
      'Ana bilgisayarını rahatça kullanmaya devam et',
      'Bot ve Metin2 sanal makinelerde çalışır',
      'Tüm bot özellikleri + MultiAcc',
      'Öncelikli 7/24 Telegram desteği',
      'İlk 48 saat iade garantisi — beğenmezsen para iadesi',
    ],
  },
];

// Iade / para-geri guvencesi (sayfada guven seridi + SSS icin)
export const IADE = {
  baslik: 'İlk 48 Saat Para İade Garantisi',
  metin:
    'Satın aldıktan sonraki ilk 48 saat içinde botu beğenmezsen paranı iade ediyoruz. ' +
    '48 saatten sonra iade yapılmaz.',
  kisa: 'İlk 48 saat içinde para iadesi',
};

export const PAKET_MAP = Object.fromEntries(PAKETLER.map((p) => [p.kod, p]));

export const OZELLIKLER = [
  {
    baslik: 'İnsansı Fare Hareketi',
    metin:
      'Fare asla ışınlanmaz. Her hareket kademeli, jitterli ve her seferinde farklıdır; tıklama zamanlamaları insan tepki süresine göre dalgalanır.',
    ikon: 'fare',
  },
  {
    baslik: 'Balık Yapboz Otomatik',
    metin:
      'Etkinlikteki Balık Yapboz oyununu matematiksel olarak en iyi hamlelerle oynar. 24 hücrenin tüm ihtimalleri önceden çözülmüştür — en az denemeyle en büyük sandık.',
    ikon: 'yapboz',
  },
  {
    baslik: 'Otomatik Pişirme',
    metin:
      'Envanter dolunca karaya çıkar, kamp ateşini yakar, balıkları pişirir ve farma kaldığı yerden devam eder. Sen uyurken bile durmaz.',
    ikon: 'ates',
  },
  {
    baslik: 'Auto Login & DC Koruması',
    metin:
      'Bağlantı koparsa seçtiğin sunucu ve kanala kendi girer, karakteri seçer, balık tutmaya kaldığı yerden devam eder.',
    ikon: 'login',
  },
  {
    baslik: 'MultiAcc — Çoklu Pencere',
    metin:
      'Aynı anda birden fazla Metin2 penceresinde çalışır. Pencereleri kendi dizer, her birini ayrı ayrı yönetir.',
    ikon: 'multi',
  },
  {
    baslik: 'Telegram’dan Tam Kontrol',
    metin:
      'Oyunu aç, botu başlat ya da durdur — hepsi telefondan, bilgisayar seçerek. Başladı, durdu, DC oldu, karakter öldü bildirimleri anında gelir; hangilerini alacağını sen seçersin.',
    ikon: 'telegram',
  },
  {
    baslik: 'Balık Filtresi',
    metin:
      'Hangi balıkları tutacağını sen seç. İstemediklerini otomatik atar, envanterini sadece işine yarayanla doldurur.',
    ikon: 'filtre',
  },
  {
    baslik: 'Mola & Karakter Değişimi',
    metin:
      'Belirlediğin aralıklarla mola verir, karakter ve kanal değiştirir. Her değişimde sıradaki karaktere geçer, böylece bütün karakterlerin sırayla farm yapar.',
    ikon: 'mola',
  },
  {
    baslik: 'GM Nöbeti',
    metin:
      'Oyun yöneticileri (GM) aktif olduğunda Telegram’dan anında uyarı alırsın ve botlarını tek tuşla kapatabilirsin.',
    ikon: 'kalkan',
  },
  {
    baslik: 'Güvenlik Saatleri',
    metin:
      'Hesabını korumak için bot günde en fazla 14 saat çalışır ve hafta sonu GM’lerin yoğun olduğu saatlerde kendini durdurur.',
    ikon: 'takvim',
  },
  {
    baslik: 'PM’lere Otomatik Cevap',
    metin:
      'Oyunda sana özel mesaj atan olursa bot kısa ve doğal bir cevap verir; başında değilken bile yazışan bir oyuncu gibi görünürsün.',
    ikon: 'mesaj',
  },
  {
    baslik: 'Otomatik Güncelleme',
    metin:
      'Yeni sürüm çıktığında bot kendini günceller: indirir, dosyanın doğruluğunu kontrol eder ve kurar. Tekrar indirmekle uğraşmazsın.',
    ikon: 'guncelle',
  },
];

// Guvenlik / ban riski bolumu. Basligi degistirmek istersen SADECE burayi duzenle.
export const GUVENLIK = {
  baslik: 'Hesabın güvende',
  ustBaslik: 'Neden bizde ban derdi yok?',
  giris:
    'Piyasadaki botların çoğu oyunun belleğine girer, DLL enjekte eder veya oyun ' +
    'dosyalarını değiştirir. Anti-cheat tam olarak bunu arar — ve o bilgisayardaki ' +
    'bütün hesaplar birden gider. K34 bunların hiçbirini yapmaz.',
  maddeler: [
    {
      baslik: 'Belleğe dokunmaz, enjeksiyon yok',
      metin:
        'Bot oyunun belleğini okumaz, yazmaz; DLL enjekte etmez, oyun dosyalarına ' +
        'dokunmaz. Sadece ekrana bakar ve fare/klavye kullanır — tıpkı senin gibi.',
    },
    {
      baslik: 'Dışarıdan çalışır',
      metin:
        'Bot ayrı bir programdır, Metin2’nin içine hiçbir şey yüklemez. Anti-cheat’in ' +
        'taradığı süreç bütünlüğü, imza ve hafıza kontrollerinin hiçbirini tetiklemez.',
    },
    {
      baslik: 'İnsansı davranış motoru',
      metin:
        'Fare ışınlanmaz; kademeli, jitterli, her seferinde farklı hareket eder. ' +
        'Tıklama zamanları dalgalanır, bot bilerek balık kaçırır, mola verir, ' +
        'karakter ve kanal değiştirir. Sunucu tarafındaki istatistiksel desen ' +
        'analizine “makine ritmi” bırakmaz.',
    },
    {
      baslik: 'Ana hesabını hiç riske atma',
      metin:
        'Aylık pakette bilgisayarına bypass’lı sanal makineleri biz kuruyoruz. ' +
        'Metin2 ve bot sanal makinenin içinde çalışır; ana bilgisayarındaki ' +
        'hesaplarınla hiçbir bağı olmaz. En temiz kullanım şekli budur.',
    },
  ],
};

export const SSS = [
  {
    s: 'Metin2 balık botu nasıl çalışır?',
    c: 'K34 Balık Botu ekran görüntüsünü okuyup fareyi ve klavyeyi insan gibi kullanır. Oltayı atar, balık minigame’inde balığı takip edip vurur, envanter dolunca pişirir ve farma devam eder. Oyunun dosyalarına dokunmaz, bellek okuma veya enjeksiyon yapmaz.',
  },
  {
    s: 'Botu kaç bilgisayarda kullanabilirim?',
    c: 'Aldığın pakete bağlı: Günlük pakette 1, Haftalık pakette 2, Aylık pakette 6 bilgisayar. Anahtarın hangi bilgisayarlarda açıldığı sistem tarafından takip edilir; limiti aşan bilgisayarda çalışmaz.',
  },
  {
    s: 'Aylık paketteki sanal makine (VM) kurulumu nedir?',
    c: 'Aylık pakette bilgisayarına bypass’lı sanal makineleri biz kuruyoruz. Bilgisayarın kaç tane kaldırıyorsa o kadar kurulur. Metin2 ve bot sanal makinelerin içinde çalışır, sen ana bilgisayarında oyun oynamaya, iş yapmaya devam edersin.',
  },
  {
    s: 'Balık Yapboz etkinliğini de oynuyor mu?',
    c: 'Evet. Yapboz oyununu sen açıyorsun, bot devralıyor. Tahtanın 16.777.216 olası durumunun tamamı önceden çözüldüğü için her parçada matematiksel olarak en iyi hamleyi yapar ve mümkün olan en az denemeyle bitirir. Deluxe sandığa dokunmaz, sadece normal sandıkla oynar.',
  },
  {
    s: 'Metin2 balık yapboz botu nasıl çalışır?',
    c: 'Yapboz sandığını envanterden bulup tahtaya sürükler, çıkan onay penceresini kendisi geçer, tahtaya düşen parçanın şeklini ve rengini görüntü eşleştirmesiyle tanır ve önceden hesaplanmış karar tablosundan en iyi hamleyi oynar. Tahta dolunca ödülü onaylar, sandık kaldıysa yeni tura başlar. Yapboz çalışırken balık botu otomatik duraklar, iş bitince kaldığı yerden devam eder.',
  },
  {
    s: 'Yapboz botu ek ücretli mi?',
    c: 'Hayır. Balık Yapboz botu Günlük, Haftalık ve Aylık paketlerin hepsinde açıktır, ek ücret alınmaz. Mevcut anahtarın varsa güncellemeyle birlikte otomatik olarak gelir.',
  },
  {
    s: 'Telegram grubunuz var mı?',
    c: 'Evet. @k34genel genel sohbet grubumuzdur; diğer kullanıcılarla konuşabilir, duyuruları takip edebilirsin. Satın alma, lisans ve birebir destek için ise @k34balik admin hesabına yazman gerekir. Instagram’dan da @k34balik hesabımızdan bize ulaşabilirsin.',
  },
  {
    s: 'Ödeme ve teslimat nasıl oluyor?',
    c: 'Satışlar sadece Telegram üzerinden @k34balik hesabından yapılır. Ödeme sonrası lisans anahtarın anında üretilip sana iletilir. Kurulum ve ilk çalıştırmada bire bir yardımcı oluyoruz.',
  },
  {
    s: 'Bot kullanınca ban yer miyim?',
    c: 'K34 oyunun belleğine dokunmaz, DLL enjekte etmez, oyun dosyalarını değiştirmez — sadece ekrana bakıp fare ve klavye kullanır. Anti-cheat’in taradığı yöntemlerin hiçbirini kullanmadığı için bilinen bir tespit yöntemiyle yakalanmaz. Buna ek olarak insansı fare hareketi, kasıtlı hata payı, molalar ve karakter/kanal değişimi ile makine ritmi bırakmaz. En güvenli kullanım için aylık pakette sanal makine kurulumunu biz yapıyoruz; böylece ana bilgisayarındaki hesaplarınla botun hiçbir bağı olmuyor.',
  },
  {
    s: 'Beğenmezsem para iademi alabilir miyim?',
    c: 'Evet, satın aldıktan sonraki ilk 48 saat içinde. Botu deneyip memnun kalmazsan bu süre içinde iade talebini Telegram @k34balik üzerinden ilet, paranı iade edelim. 48 saat geçtikten sonra iade yapılmaz.',
  },
  {
    s: 'Metin2 PvP sunucularında çalışıyor mu?',
    c: 'Evet. K34 PvP, PvP sunucuları için ayrı geliştirilmiş bir sürümdür ve Rascal dahil koruma sistemi kullanan PvP sunucularında çalışır. Açık client’ları listeler, hangisinde çalışacağını sen seçersin; kırmızı halka balık minigame’ini oynar ve envanterini düzenler (balıkları açar, gereksizleri atar). PvP sürümünde günlük çalışma limiti ve hafta sonu kısıtı yoktur. Anahtar alırken PvP sürümünü istediğini belirtmen yeterli: TR anahtarı PvP botunda, PvP anahtarı TR botunda çalışmaz.',
  },
  {
    s: 'Günlük kullanım sınırı var mı?',
    c: 'TR sürümünde hesabını korumak için bot günde en fazla 14 saat çalışır; sayaç her gece 03:00’te sıfırlanır. Ayrıca GM’lerin yoğun olduğu hafta sonu saatlerinde bot kendini durdurur: Cumartesi yalnızca 12:50–17:45 arasında çalışır, Pazar çalışmaz. Bu kısıtlar PvP sürümünde yoktur. Özel bir durumun varsa @k34balik hesabına yaz.',
  },
  {
    s: 'Botu telefondan yönetebilir miyim?',
    c: 'Evet. Botu Telegram’a bağladıktan sonra telefondan oyunu açabilir, botu başlatıp durdurabilir ve hangi bilgisayarda ne olduğunu görebilirsin. Bot başladığında, durduğunda, DC olduğunda ya da karakterin öldüğünde bildirim gelir; hangi bildirimleri alacağını kendin seçersin.',
  },
  {
    s: 'Bot kendini güncelliyor mu?',
    c: 'Evet. Yeni sürüm yayınlandığında bot açılışta bunu görür, dosyayı indirir, doğruluğunu kontrol eder ve kendini günceller. Yeni özellikler mevcut anahtarınla ek ücret olmadan gelir.',
  },
  {
    s: 'Destek alabiliyor muyum?',
    c: '7/24 Telegram desteği veriyoruz. Kurulum, ayarlar, güncellemeler ve karşılaştığın her sorunda @k34balik üzerinden bize yazabilirsin.',
  },
  {
    s: 'Anahtarımın süresi ne zaman başlar?',
    c: 'Süre, anahtarı ürettiğimiz anda değil, botta ilk kez giriş yaptığın anda başlar. Yani anahtarı alıp istediğin zaman kullanmaya başlayabilirsin.',
  },
];

// Google/uluslararasi arama icin anahtar kelime havuzu
export const ANAHTAR_KELIMELER = [
  'metin2 balık botu', 'metin2 balik botu', 'metin2 fish bot', 'metin2 fishing bot',
  'metin2 balık bot', 'balık botu metin2', 'metin2 fisch bot', 'metin2 angelbot',
  'metin2 bot pescuit', 'metin2 bot de pescuit', 'metin2 bot wędkarski',
  'metin2 bot pesca', 'metin2 рыбалка бот', 'metin2 fish farm bot',
  'metin2 otomatik balık tutma', 'metin2 balık makrosu', 'metin2 yapboz botu',
  'metin2 balık yapboz', 'k34 balık botu', 'metin2 bot', 'metin2 farm bot',
  'metin2 balık yapboz botu', 'balık yapboz botu', 'metin2 yapboz çözücü',
  'metin2 balık yapboz nasıl yapılır', 'metin2 yapboz sandık', 'metin2 puzzle bot',
  'metin2 fishing puzzle bot', 'metin2 tr balık botu', 'metin2 balık botu indir',
  'metin2 balık botu satın al', 'en iyi metin2 balık botu', 'metin2 balık botu 2026',
  'metin2 auto fish', 'metin2 balık tutma botu', 'metin2 multiacc bot',
  'metin2 pvp balık botu', 'pvp balık botu', 'metin2 pvp bot', 'metin2 pvp fish bot',
  'rascal balık botu', 'metin2 pvp sunucu balık botu', 'k34 pvp', 'k34 bot',
  'm2balikbotu', 'm2 balık botu', 'k34 metin2',
];

/* ------------------------------------------------------------------ yapboz
   Balik Yapboz etkinligini otomatik oynayan modulun tanitim icerigi.
   Hem /yapboz-botu sayfasi hem de ana sayfadaki ozet bunu kullanir. */
export const YAPBOZ = {
  baslik: 'Balık Yapboz Botu',
  ustBaslik: 'Yeni modül',
  ozet:
    'Metin2’nin Balık Yapboz etkinliğini senin yerine, matematiksel olarak en iyi ' +
    'hamlelerle oynayan modül. Tahtanın tüm olası durumları önceden çözüldüğü için ' +
    'bot her parçada mümkün olan en az denemeyle sandığı bitirir.',
  video: {
    // Dikey telefon kaydi (540x960). Sayfalarda .video-dikey ile gosterilir.
    src: '/video/yapboz-botu-2.mp4',
    poster: '/video/yapboz-botu-2-poster.jpg',
    genislik: 540,
    yukseklik: 960,
    saniye: 30,
    baslik: 'Balık Yapboz botu aynı anda birden fazla sanal makinede çalışıyor',
    aciklama:
      'K34 Balık Yapboz botu birden fazla sanal makinede aynı anda çalışıyor: sandığı ' +
      'tahtaya sürüklüyor, onay penceresini kendisi geçiyor, parçayı tanıyıp tahtadaki ' +
      'en doğru yere yerleştiriyor. Gerçek kayıt.',
    tarih: '2026-10-03',
  },
  adimlar: [
    {
      baslik: 'Sandığı kendisi sürükler',
      metin:
        'Yapboz sandığını envanterden bulup tahtaya sürükler ve çıkan “Bu nesneyi ' +
        'gerçekten düşürmek istiyor musun?” onayını kendisi geçer. Sen sadece ' +
        'etkinlik penceresini açık bırakırsın.',
    },
    {
      baslik: 'Parçayı görerek tanır',
      metin:
        'Tahtaya düşen parçanın şeklini ve rengini şablon eşleştirmeyle tanır — ' +
        'oyunun belleğini okumaz. Kare, nokta, mavi, sarı, yeşil ve kırmızı ' +
        'parçaların hepsi tanımlıdır.',
    },
    {
      baslik: 'En iyi hamleyi hesaplar',
      metin:
        'Tahtanın 16.777.216 olası durumunun tamamı önceden çözülüp bir karar ' +
        'tablosuna yazılmıştır. Bot her parçada bu tablodan bakarak matematiksel ' +
        'olarak en iyi hamleyi oynar — tahmin yürütmez.',
    },
    {
      baslik: 'Ödülü alır, devam eder',
      metin:
        'Tahta dolunca ödül penceresini onaylar, sandığı toplar ve elinde sandık ' +
        'kaldıysa yeni tura başlar. Bittiğinde balık farmına kaldığı yerden döner.',
    },
  ],
  notlar: [
    'Deluxe sandığa dokunmaz — yalnızca normal yapboz sandığıyla oynar.',
    'Yapboz çalışırken balık botu otomatik duraklar, bitince kendi kaldığı yerden devam eder.',
    'Tüm paketlerde açıktır; ek ücret yoktur.',
  ],
};

/* --------------------------------------------------------------------- pvp
   K34 PvP - PvP sunuculari icin ayri urun. /pvp-balik-botu sayfasi ve ana
   sayfadaki PvP bolumu bunu kullanir. */
export const PVP = {
  ad: 'K34 PvP Balık Botu',
  ustBaslik: 'Yeni ürün',
  ozet:
    'Metin2 PvP sunucuları için ayrı geliştirilmiş balık botu. Rascal dahil koruma ' +
    'sistemi kullanan PvP sunucularında çalışır: client’ı sen seçersin, bot kırmızı ' +
    'halka balık minigame’ini oynar ve envanterini kendisi düzenler.',
  ozellikler: [
    {
      baslik: 'Rascal dahil korumalarda çalışır',
      metin:
        'Oyunun belleğine dokunmaz, DLL enjekte etmez; ekrana bakıp fare ve klavye ' +
        'kullanır. Bu yüzden Rascal dahil koruma sistemli PvP sunucularında çalışır.',
      ikon: 'kalkan',
    },
    {
      baslik: 'Her PvP client’ında',
      metin:
        'Pencere başlığına bağlı değildir: açık client’ları listeler, hangisinde ' +
        'çalışacağını sen seçersin. Client kapanıp açılsa da aynı client’ı tanır.',
      ikon: 'multi',
    },
    {
      baslik: 'Kırmızı halka minigame',
      metin:
        'PvP sunucularındaki halka balık oyununu tanır; halka kırmızıya döndüğünde ' +
        'çemberin içine insansı, her seferinde farklı noktaya tıklar.',
      ikon: 'fare',
    },
    {
      baslik: 'Otomatik envanter bakımı',
      metin:
        'Belirli aralıklarla balıkları açar, saç boyası gibi gereksizleri yere atar, ' +
        'istiridye ve kılçık gibi eşyaları ikinci sayfaya taşır. Eşyayı adından tanır; ' +
        'iksirlere ve değerli eşyalara dokunmaz.',
      ikon: 'filtre',
    },
    {
      baslik: 'MultiAcc',
      metin:
        'Aynı anda birden fazla client’ta balık tutar; her client’ın bakımını sırayla ' +
        'yapar, biri çalışırken diğeri bekler.',
      ikon: 'login',
    },
    {
      baslik: 'Sınırsız çalışma',
      metin:
        'PvP sürümünde günlük çalışma limiti ve hafta sonu kısıtı yoktur. Telegram ' +
        'bildirimleri ve uzaktan kontrol TR sürümündeki gibi çalışır.',
      ikon: 'mola',
    },
  ],
  farklar: [
    ['Sunucu', 'Gameforge Metin2 TR', 'Metin2 PvP sunucuları (Rascal dahil)'],
    ['Balık minigame’i', 'Balık takibi', 'Kırmızı halka'],
    ['Client seçimi', 'Otomatik (METIN2 penceresi)', 'Listeden sen seçersin'],
    ['Balık Yapboz botu', 'Var', '—'],
    ['Envanter bakımı', 'Pişirme + balık filtresi', 'Balık açma, boya atma, eşya taşıma'],
    ['Günlük 14 saat limiti', 'Var', 'Yok'],
    ['Hafta sonu kısıtı', 'Var', 'Yok'],
    ['Lisans anahtarı', 'TR anahtarı', 'PvP anahtarı'],
  ],
};

/* ----------------------------------------------------------- guncellemeler
   Musteriye donuk surum notlari. En yeni EN USTTE olsun. Tarih ISO (YYYY-AA-GG). */
export const GUNCELLEMELER = [
  {
    surum: '2.8',
    tarih: '2026-10-03',
    baslik: 'Telegram’dan tam kontrol ve yeni güvenlik katmanı',
    yeni: true,
    maddeler: [
      'Telegram’dan oyunu açma, botu başlatma ve durdurma — bilgisayar seçerek, telefondan.',
      'Karakter ölünce Telegram bildirimi; hangi bildirimleri alacağını tek tek seçebiliyorsun.',
      'Karakter değişimi artık her seferinde sıradaki karaktere geçiyor; bütün karakterler sırayla farm yapıyor.',
      'Bağlantı yavaşken (lag) balık minigame’i geç açılırsa bot daha sabırlı bekliyor.',
      'Özel mesajlara (PM) cevaplar daha doğal; seviye, ekipman gibi sorular kibarca savuşturuluyor.',
      'Hesap güvenliği: günlük 14 saat çalışma ve hafta sonu GM saatlerinde otomatik duraklama.',
      'Lisans koruması güçlendirildi: kırma girişimleri tespit ediliyor ve engelleniyor.',
    ],
  },
  {
    surum: '1.2',
    urun: 'pvp',
    tarih: '2026-09-30',
    baslik: 'K34 PvP sürümü yayında',
    maddeler: [
      'Metin2 PvP sunucuları için ayrı bot: Rascal dahil koruma sistemli sunucularda çalışır.',
      'Client seçimi, kırmızı halka balık minigame’i ve MultiAcc.',
      'Otomatik envanter bakımı: balıkları açar, gereksizleri atar, eşyaları ikinci sayfaya taşır.',
      'TR sürümüyle aynı bilgisayara yan yana kurulabilir.',
    ],
  },
  {
    surum: '2.7',
    tarih: '2026-09-19',
    baslik: 'GM nöbeti ve uzaktan yönetim',
    maddeler: [
      'GM nöbeti: oyun yöneticileri aktifken Telegram’dan uyarı ve tek tuşla botları kapatma.',
      'Bot açılışta pencereyi küçültüyor; arka planda sessizce çalışıyor.',
      'Uzaktan bilgisayar kapatma ve ekran görüntüsü desteği.',
    ],
  },
  {
    surum: '2.1',
    tarih: '2026-09-07',
    baslik: 'Balık Yapboz botu',
    maddeler: [
      'Balık Yapboz etkinliği baştan sona otomatik oynanıyor: sandığı sürükleme, onayı geçme, parçayı tanıma ve yerleştirme.',
      'Tahtanın tüm olası durumları önceden çözüldü — bot her parçada en az denemeyle bitiriyor.',
      'Yapboz çalışırken balık botu duraklıyor, iş bitince kaldığı yerden devam ediyor.',
    ],
  },
  {
    surum: '2.0',
    tarih: '2026-08-26',
    baslik: 'İnsansı vuruş ve mini panel',
    maddeler: [
      'Balık vuruşları artık tıklama değil sürükleme hareketiyle yapılıyor — çok daha doğal görünüyor.',
      'Vuruş ve olta zamanlamaları her turda dalgalanıyor; bot sabit bir ritim bırakmıyor.',
      'Mini panel: küçültünce sadece durum, çalışma sayacı ve Tutulan/Kaçan/Atılan/Tur istatistikleri görünüyor.',
    ],
  },
  {
    surum: '1.9',
    tarih: '2026-08-13',
    baslik: 'Telegram karakter takibi',
    maddeler: [
      'Telegram bildirimleri artık hangi hesap ve karakterden geldiğini etiketliyor.',
      'MultiAcc kullanırken her pencere ayrı ayrı takip edilebiliyor.',
      'Auto Login ve DC koruması: bağlantı koparsa bot sunucuya ve kanala kendi giriyor.',
    ],
  },
];

/* --------------------------------------------------------------- sayfalar
   Sitemap ve gezinme icin TEK kaynak. Buraya eklenen sayfa otomatik olarak
   sitemap.xml'e girer — elle sitemap duzenlemeye gerek yok.
   ONEMLI: buraya sadece GERCEK sayfalar girer, "#bolum" capalari GIRMEZ;
   Google capa URL'lerini ayri sayfa saymaz ve Search Console'da hata verir. */
export const SAYFALAR = [
  {
    yol: '/',
    baslik: 'Metin2 Balık Botu',
    oncelik: 1,
    siklik: 'weekly',
    menu: false,
  },
  {
    yol: '/metin2-balik-botu-nedir',
    baslik: 'Metin2 Balık Botu Nedir?',
    oncelik: 0.8,
    siklik: 'monthly',
    menu: true,
  },
  {
    yol: '/yapboz-botu',
    baslik: 'Balık Yapboz Botu',
    oncelik: 0.9,
    siklik: 'monthly',
    menu: true,
  },
  {
    yol: '/pvp-balik-botu',
    baslik: 'PvP Balık Botu',
    oncelik: 0.9,
    siklik: 'monthly',
    menu: true,
  },
  {
    yol: '/guncellemeler',
    baslik: 'Güncellemeler',
    oncelik: 0.7,
    siklik: 'weekly',
    menu: true,
  },
  {
    yol: '/sss',
    baslik: 'Sıkça Sorulan Sorular',
    oncelik: 0.7,
    siklik: 'monthly',
    menu: true,
  },
  {
    yol: '/iletisim',
    baslik: 'İletişim',
    oncelik: 0.6,
    siklik: 'monthly',
    menu: true,
  },
];
