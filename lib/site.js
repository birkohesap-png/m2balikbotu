// Sitenin TEK yapilandirma dosyasi. Domain/Telegram/fiyat degisirse SADECE burayi duzenle.

export const SITE = {
  // Punycode (ASCII) hali — canonical/sitemap/DNS bunu kullanir
  host: 'xn--m2balkbotu-1ub.com',
  // Kullaniciya gosterilen (Turkce) hali
  gorunen: 'm2balıkbotu.com',
  get url() {
    return 'https://' + this.host;
  },
  ad: 'K34 Metin2 Balık Botu',
  kisaAd: 'K34 Balık Botu',
  telegram: 'k34balik',
  get telegramUrl() {
    return 'https://t.me/' + this.telegram;
  },
  // Tanitim videosu: YouTube video ID'sini buraya yaz (orn: 'dQw4w9WgXcQ').
  // Bos birakilirsa ana sayfada "video yakinda" kutusu gosterilir.
  youtubeId: '',
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
    ],
  },
];

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
    s: 'Ödeme ve teslimat nasıl oluyor?',
    c: 'Satışlar sadece Telegram üzerinden @k34balik hesabından yapılır. Ödeme sonrası lisans anahtarın anında üretilip sana iletilir. Kurulum ve ilk çalıştırmada bire bir yardımcı oluyoruz.',
  },
  {
    s: 'Bot kullanınca ban yer miyim?',
    c: 'K34 oyunun belleğine dokunmaz, DLL enjekte etmez, oyun dosyalarını değiştirmez — sadece ekrana bakıp fare ve klavye kullanır. Anti-cheat’in taradığı yöntemlerin hiçbirini kullanmadığı için bilinen bir tespit yöntemiyle yakalanmaz. Buna ek olarak insansı fare hareketi, kasıtlı hata payı, molalar ve karakter/kanal değişimi ile makine ritmi bırakmaz. En güvenli kullanım için aylık pakette sanal makine kurulumunu biz yapıyoruz; böylece ana bilgisayarındaki hesaplarınla botun hiçbir bağı olmuyor.',
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
];
