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

  // Tanitim videosu: YouTube video ID'sini buraya yaz (orn: 'dQw4w9WgXcQ').
  // Bos birakilirsa ana sayfada "video yakinda" kutusu gosterilir.
  youtubeId: '3has1DqonVI',

  // Google Search Console dogrulamasi. Konsoldaki "HTML etiketi" yonteminde
  // verilen content="..." degerini buraya yapistir; bos ise etiket basilmaz.
  googleDogrulama: '',
};

/** Sosyal hesaplar — schema.org sameAs ve alt bilgi baglantilari icin tek kaynak. */
export const SOSYAL = [
  { ad: 'Telegram Destek', kullanici: '@' + SITE.telegram, url: SITE.telegramUrl, ikon: 'telegram' },
  { ad: 'Telegram Grup', kullanici: '@' + SITE.telegramGrup, url: SITE.telegramGrupUrl, ikon: 'telegram' },
  { ad: 'Instagram', kullanici: '@' + SITE.instagram, url: SITE.instagramUrl, ikon: 'instagram' },
];

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
      'İade garantisi — beğenmezsen para iadesi',
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
      'İade garantisi — beğenmezsen para iadesi',
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
      'İade garantisi — beğenmezsen para iadesi',
    ],
  },
];

// Iade / para-geri guvencesi (sayfada guven seridi + SSS icin)
export const IADE = {
  baslik: 'Para İade Garantisi',
  metin: 'Botu beğenmezsen paranı iade ediyoruz. Risk sana değil, bize ait.',
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
    baslik: 'Telegram’dan Uzaktan Kontrol',
    metin:
      'Botu telefonundan izle ve yönet. Başladı, durdu, pişirme bitti, DC oldu — hepsi anında Telegram’a düşer.',
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
      'Belirlediğin aralıklarla mola verir, karakter değiştirir, kanal değiştirir. Sürekli aynı ritimde farm yapan bir hesap izlenimi bırakmaz.',
    ikon: 'mola',
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
    c: 'Evet. Botu deneyip memnun kalmazsan paranı iade ediyoruz. Amacımız memnun kalmadığın bir ürünü sana bırakmak değil; iade talebini Telegram @k34balik üzerinden ilet, yardımcı olalım.',
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
    src: '/video/yapboz-botu.mp4',
    poster: '/video/yapboz-botu-poster.jpg',
    genislik: 754,
    yukseklik: 592,
    saniye: 15,
    baslik: 'Balık Yapboz botu iş başında — sandığı otomatik açıyor',
    aciklama:
      'K34 Balık Yapboz botu sandığı envanterden tahtaya sürüklüyor, çıkan onay ' +
      'penceresini kendisi geçiyor, parçanın şeklini tanıyıp tahtadaki en doğru ' +
      'yere yerleştiriyor. Kayıt sanal makinede alınmıştır.',
    tarih: '2026-09-07',
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

/* ----------------------------------------------------------- guncellemeler
   Musteriye donuk surum notlari. En yeni EN USTTE olsun. Tarih ISO (YYYY-AA-GG). */
export const GUNCELLEMELER = [
  {
    surum: '2.1',
    tarih: '2026-09-07',
    baslik: 'Balık Yapboz botu',
    yeni: true,
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
