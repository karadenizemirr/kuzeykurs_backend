// ./src/api/answer/content-types/answer/lifecycles.js

module.exports = {
  beforeCreate(event) {
    const { data } = event.params;
    return validateContent(data);
  },
  
  beforeUpdate(event) {
    const { data } = event.params;
    return validateContent(data);
  }
};

/**
 * Gelişmiş içerik doğrulama ve filtreleme sistemi
 * @param {Object} data - Kayıt edilecek veri
 * @returns {Promise}
 */
async function validateContent(data) {
  // İçerik kontrolü yapılacak alan
  const content = data.content;
  
  if (!content) return;
  
  const strapi = require('@strapi/strapi');
  const { ApplicationError } = require('@strapi/utils').errors;
  
  try {
    // Gelişmiş içerik analizi
    const contentAnalysisResult = await analyzeContent(content);
    
    // Uygunsuz içerik bulunduysa
    if (!contentAnalysisResult.isAppropriate) {
      // Eğer ayarlandıysa, içeriği otomatik maskeleyelim veya reddedelim
      const contentModerationSetting = await strapi.service('api::setting.setting').findOne({
        where: { key: 'content_moderation_strategy' }
      });
      
      if (contentModerationSetting?.value === 'mask') {
        // İçeriği maskele ve devam et
        data.content = contentAnalysisResult.maskedContent;
        data.wasModerated = true;
        data.moderationLog = JSON.stringify(contentAnalysisResult.detections);
        
        // Log kaydı
        strapi.log.info(`Content was automatically moderated: ID=${data.id || 'new'}`);
      } else {
        // İçeriği reddet
        throw new ApplicationError(
          'İçerik Politikası İhlali', 
          {
            message: 'İçeriğiniz topluluk kurallarına aykırı ifadeler içeriyor.',
            details: contentAnalysisResult.detections
          }
        );
      }
    }
  } catch (error) {
    if (error instanceof ApplicationError) {
      throw error;
    }
    
    strapi.log.error('Content moderation error:', error);
    throw new ApplicationError('İçerik kontrolü sırasında bir hata oluştu.');
  }
}

/**
 * İçerik analizi yapan gelişmiş fonksiyon
 * Farklı kategorilerde uygunsuz içerikleri tespit eder
 * @param {string} text - Analiz edilecek metin
 * @returns {Promise<Object>} Analiz sonuçları
 */
async function analyzeContent(text) {
  // Kategoriler (daha kapsamlı bir uygulama için veritabanından çekilebilir)
const categories = {
  profanity: {
    terms: [
      // Küfürler - gerçek uygulamada actual küfürlerin kendisi eklenecek
      "amk", "aq", "mk", "oç", "piç", "yavşak", "siktir", "gerizekalı",
      "salak", "aptal", "mal", "dangalak", "hıyar", "göt", "pezevenk", 
      "puşt", "ibne", "gavat", "dalyarak", "yarrak", "sikim", "orospu",
      // Alternatif yazılışlar
      "s!ktir", "s1kt1r", "5iktir", "a.m.k", "a-m-k", "a q", "a.q", "m.k",
      "g*t", "p*ç", "o.ç", "y*rrak", "s*kim", "or*spu", "p*zevenk", "i*ne",
      // Maskeli yazımlar
      "s*kt*r", "a*k", "o*ç", "p*ç", "g*t", "amın*", "sik*m",
      "or**pu", "yav**k", "ib*e",
    ],
    severity: 'high',
    description: 'küfür/hakaret içeriği'
  },
  
  insult: {
    terms: [
      // Hakaretler
      "ahmak", "beyinsiz", "embesil", "geri zekalı", "eşek", "eşşek", "eşşoğlu", 
      "odun", "angut", "andaval", "mankafa", "keriz", "ezik", "zavallı", "haysiyetsiz",
      "şerefsiz", "onursuz", "karaktersiz", "ahlaksız", "namussuz", 
      "haysiyetini", "şerefini", "onurunu", "karakterini", "ahlakını",
      // Kişilik hakaretleri
      "yalancı", "şarlatan", "sahtekâr", "sahtekar", "dolandırıcı", "üçkağıtçı",
      "köpek", "it", "domuz", "eşek", "maymun", "ayı", "öküz", "inek", "dana", "baban",
      "ananı", "bacını", "karını", "aileni", "sülaleni",
    ],
    severity: 'medium',
    description: 'hakaret içeriği'
  },
  
  hate: {
    terms: [
      // Etnik/Irksal nefret söylemleri
      "k*ro", "kürt", "arap", "yallah arabistana", "ermeni dölü", "ermeni tohumu", 
      "rum dölü", "suriyeli", "mülteci", "yunan dölü", "yahudi dölü", "cuhapa", "çingene",
      "çingen", "roman", "zenci", "karaboğa", "roman", "kürdistan", "ırkını",
      // Dinsel nefret söylemleri
      "allahını", "dinini", "imanını", "dinsiz", "imansız", "gavur", "kafir", "müslüman olmayan",
      "hristiyan köpeği", "musevi köpeği", "lanetli", "şeytan", "dinden çıkmış", "dinsiz imansız",
      "dini bozuk", "görünüşüne soktuğum",
      // Etnik/ırksal ayrımcı içerikler
      "ırkınızı", "etnik kökeninizi", "milletinizi", "ülkenizi", "ulusunuzu",
      "kanı bozuk", "soyu bozuk", "piçin evladı", "evladı", "defol", "siktir git", "ülkene dön",
      // Cinsiyet ayrımcılığı
      "feminist", "feminazi", "erkek düşmanı", "kadın düşmanı", "karı gibi", 
      "kadın gibi", "erkek adam", "karı kılıklı", "erkek milletini", "kadın milletini"
    ],
    severity: 'high',
    description: 'nefret söylemi'
  },
  
  lgbtHate: {
    terms: [
      // LGBTQ+ karşıtı nefret söylemleri
      "ibne", "nonoş", "götlek", "top", "dönme", "homo", "eşcinsel", "ibnelik", 
      "lezzo", "sapık", "sapkın", "travesti", "sapıklık", "anormal", "doğaya aykırı",
      "hastalıklı", "tedavi edilmeli", "normale dönmeli", "lgbti", "lgbt", "gay", "lezbiyen",
      "transseksüel", "eşcinsellik", "homoseksüel",
      "doğaya aykırı", "tedavi edilmeli"
    ],
    severity: 'high',
    description: 'cinsel yönelim temelli nefret söylemi'
  },
  
  violence: {
    terms: [
      // Şiddet
      "öldürmek", "kesmek", "katletmek", "doğramak", "boğmak", "kurşunlamak", "silahla vurmak",
      "kafasını ezmek", "kafana sıkmak", "geberteceğim", "öldüreceğim", "infaz edeceğim", 
      "canını alacağım", "mezarını kazacağım", "cenazende", "tabutunu", "kafa koparacağım",
      // Şiddet tehditleri
      "öldürürüm", "keserim", "döverim", "dövmek", "dayak atacağım", "dayak atarım", "seni bulacağım",
      "evini basacağım", "evine geleceğim", "kafanı kıracağım", "kolunu kıracağım", "gözünü çıkaracağım",
      "bulacağım", "adresini bulacağım", "gelip", "vuracağım", "ödettirecek", "patlatacağım",
      // Silah
      "bıçaklarım", "silahla", "pompalı", "tabanca", "mermi", "kurşun", "bıçağı", "sokmak",
      "döverim", "kırarım", "parçalarım", "ezerim", "biçerim", "gebertirim",
      // İntihara yönlendirme
      "kendini öldür", "kendini as", "intihar et", "bileklerini kes", "yüksekten atla",
      "ilaç iç", "hap iç", "zehir iç", "canına kıy", "ölsen iyi olur"
    ],
    severity: 'high',
    description: 'şiddet içeriği'
  },
  
  sexual: {
    terms: [
      // Müstehcen içerikler
      "seks", "sikişmek", "sikiş", "sikik", "sikmek", "s1kmek", "s*kmek", "s1k1s", "sıkış",
      "amcık", "am", "göt", "g*t", "meme", "memeler", "yarrak", "yarak", "y@rak", "penis",
      "vajina", "am", "a.m", "amc*k", "memeler", "kalça", "sevişmek", "s.e.k.s", "seqz", 
      "31", "otuzbir", "31 çekmek", "mastürbasyon", "masturbasyon", "boşalmak", "bosalmak",
      // Cinsel eylemler
      "sert sik", "hardcore", "ağza almak", "deepthroat", "deep throat", "blowjob", "blow job",
      "sakso", "oral seks", "ön sevişme", "zevk suyu", "boşalmak", "döl", "meni", "sperm", 
      "domalma", "arkadan", "götten", "anal", "ağızdan"
    ],
    severity: 'high',
    description: 'müstehcen içerik'
  },
  
  harassment: {
    terms: [
      // Taciz
      "taciz", "rahatsız", "sıkıştırmak", "yavşamak", "elleme", "sarkıntılık", "asılmak",
      "tecavüz", "tacizci", "sapık", "sapıklık", "rahatsız etmek", "ısrar etmek", "zorlamak",
      "ısrarcı olmak", "stalk", "stalklama", "stalklıyorum", "takip ediyorum", "peşini bırakmam",
      "elbiseni", "giyimin", "dış görünüşün", "vücudun", "fiziksel", "fiziki", "nude", "nudes", 
      "çıplak fotoğraf", "özel fotoğraf", "ifşa", "ifşalamak"
    ],
    severity: 'high',
    description: 'taciz ve rahatsız edici içerik'
  },
  
  illegalActivities: {
    terms: [
      // Yasa dışı aktiviteler
      "uyuşturucu", "eroin", "esrar", "kokain", "marijuana", "ganja", "kenevir", "joint", "ot", 
      "ectasy", "ekstazi", "metamfetamin", "meth", "bonzai", "captagon", "hap", "haze", "skunk",
      "crystal meth", "kristal", "afyon", "haşhaş", "krak", "crack", "fentanil", "fentanyl",
      "uyarıcı madde", "keyif verici madde", "kafayı bulmak",
      // Kumar
      "bahis", "illegal bahis", "kaçak bahis", "casino", "rulet", "poker", "blackjack", "slot", "tombala",
      "casino siteleri", "canlı bahis", "canlı casino", "bahis siteleri", "yasa dışı bahis", 
      "bahis oynamak", "para kazanmak", "kolay para", "yasa dışı para",
      // Dolandırıcılık
      "saadet zinciri", "piramit şeması", "dolandırmak", "bedava para", "kısa yoldan zengin olmak",
      "zenginlik sırrı", "milyoner olmak", "hızlı zengin olmak", "küçük yatırım", "büyük kazanç",
      // Hack/Siber suçlar
      "hack", "hackleme", "şifre kırma", "hesap çalma", "hesap kırma", "kredi kartı bilgileri",
      "kimlik bilgileri", "facebook şifre", "instagram şifre", "twitter şifre", "mail şifre",
      "phishing", "oltalama", "trojan", "malware", "ransomware", "keylogger", "hesapları ele geçirmek",
      "instagram hackleme", "facebook hackleme", "hesabı hackleme", "hesaba giriş",
      // Kaçakçılık
      "kaçakçılık", "insan kaçakçılığı", "silah kaçakçılığı", "yasa dışı göç", "organ ticareti",
      "kaçak göçmen", "kaçak geçiş", "kaçak yolculuk", "yasa dışı ticaret"
    ],
    severity: 'high',
    description: 'yasa dışı faaliyetler'
  },
  
  terrorism: {
    terms: [
      // Terör propagandası
      "terör", "terörist", "bombalama", "cihat", "cihad", "mücahit", "militanlar", "gerilla",
      "patlayıcı", "bomba yapımı", "silah yapımı", "katliam", "infaz", "canlı bomba", "eylem",
      // Terör örgütleri 
      "deaş", "işid", "el kaide", "el nusra", "pkk", "dhkp-c", "fetö", "hizbullah",
      "taliban", "isis", "isil", "boko haram", "propaganda", "örgüt propagandası",
      "gerilla", "terörizm", "örgüt", "militanlar", "silahlı mücadele", 
      "eylem", "direniş", "diriliş"
    ],
    severity: 'high',
    description: 'terör propagandası içeriği'
  },
  
  selfHarm: {
    terms: [
      // Kendine zarar verme
      "kendimi kesiyorum", "bileğimi kesiyorum", "kolumu kesiyorum", "kan akıtıyorum",
      "jilet", "jiletle", "kendime zarar", "intihar", "intihar düşüncesi", "intihar etmek",
      "ölmek istiyorum", "yaşamak istemiyorum", "canıma kıymak", "hayata son vermek",
      "kendini asmak", "asmak", "hap içmek", "yüksekten atlamak", "ölmek istiyorum",
      "yaşamak istemiyorum", "hayata son vermek", "kendimi öldüreceğim"
    ],
    severity: 'high',
    description: 'kendine zarar vermeye yönelik içerik'
  },
  
  misinformation: {
    terms: [
      // Dezenformasyon/Yanlış bilgi
      "sahte haber", "yalan haber", "komplo teorisi", "covid yalanı", "aşı yalanı", "5g yalanı",
      "düz dünya", "dünya düz", "uzaylılar aramızda", "illuminati", "masonlar", "gizli örgüt",
      "derin devlet", "büyük oyun", "planları", "amaçları", "kandırmaca", "oyun", "büyük resim",
      "siyonist", "protokoller", "küresel elit", "yeni dünya düzeni", "chemtrails", "kimyasal iz",
      "havadaki çizgiler", "ilaçlanan", "yanlış tedavi", "şifa", "şifalı", "alternatif tıp",
      "konvansiyonel tıp", "ilaç firmaları", "sağlık", "hastalık", "tedavi", "kür", "iyileşme",
      "garantili tedavi", "mucizevi iyileşme", "şifa kaynağı", "ölümcül hastalık", "kanser tedavisi",
      "doktorların bilmediği", "bilim insanları gizliyor", "gizlenen gerçek", "gizli bilgi", 
      "sana söylenmeyen", "medya gizliyor"
    ],
    severity: 'medium',
    description: 'yanlış bilgi yayan içerik'
  },
  
  fraudScam: {
    terms: [
      // Dolandırıcılık/Sahtecilik
      "zengin olma fırsatı", "kolay para", "evden çalışarak", "hızlı para kazanma",
      "yatırımsız para", "para kazanma yöntemi", "şansınızı deneyin", "şans oyunu",
      "yatırımınızı katlayın", "bitcoin fırsatı", "kripto fırsatı", "para iade garantisi",
      "bedava", "ücretsiz", "kazanç garantisi", "yüksek getiri", "risk yok",
      "dolandırıcılık", "sahtecilik", "sahte", "klonlama", "klonlamak", "kandırmak",
      "kandırıcı", "tuzak", "tezgah", "düzen", "kurnazlık", "üçkağıt", "üçkağıtçılık",
      "kandırmaca", "yalan söylemek", "aldatmak", "aldatıcı", "manipüle etmek",
      "manipülasyon", "sahte kimlik", "sahte belge", "sahte evrak", "sahte profil"
    ],
    severity: 'medium',
    description: 'dolandırıcılık/sahtecilik içeriği'
  },
  
  private: {
    terms: [
      // Özel/Kişisel Bilgiler
      "tc kimlik", "tc no", "tc numarası", "kimlik no", "kimlik numarası", "kredi kartı", 
      "kredi kartı numarası", "kart numarası", "cvv", "son kullanma tarihi", "kart şifresi",
      "banka şifresi", "internet bankacılığı", "şifre", "parola", "kullanıcı adı", "adres",
      "ev adresi", "iş adresi", "telefon numarası", "telefon no", "cep numarası", "cep no",
      "açık adres", "mail adresi", "e-mail", "email", "elektronik posta", "sosyal güvenlik",
      "sgk no", "sigorta no", "vergi no", "doğum tarihi", "doğum yeri", "anne kızlık soyadı",
      "özel bilgi", "kişisel bilgi", "mahrem", "şahsi", "özel hayat", "gizli bilgi", "sır"
    ],
    severity: 'high',
    description: 'özel/kişisel bilgi paylaşımı'
  },
  
  copyright: {
    terms: [
      // Telif ihlali/Korsan içerik
      "torrent", "warez", "crack", "serial", "keygen", "nulled", "patched", "telif",
      "telif hakkı", "korsan", "korsan içerik", "bedava film", "bedava dizi", "bedava oyun",
      "ücretsiz film", "ücretsiz dizi", "ücretsiz oyun", "ücretsiz yazılım", "film indir",
      "dizi indir", "oyun indir", "yazılım indir", "program indir", "kitap indir", "pdf indir",
      "müzik indir", "mp3 indir", "albüm indir", "film izle", "dizi izle", "full izle", "hd izle",
      "netflix ücretsiz", "spotify ücretsiz", "premium hesap", "hesap paylaşımı", "crack yapma",
      "lisans kırma", "lisans", "serial key", "ürün anahtarı", "aktivasyon kodu", "bedava kod"
    ],
    severity: 'medium',
    description: 'telif hakkı ihlali/korsan içerik'
  }
};
  
  // Kelime manipülasyonlarını tespit etmek için regex eşleşmeleri
  const wordManipulations = [
    { pattern: /\s+/, replacement: "" },       // Boşlukları kaldır
    { pattern: /[.*_\-+?^${}()|[\]\\]/g, replacement: "" }, // Özel karakterleri kaldır
    { pattern: /0/g, replacement: "o" },       // 0 -> o
    { pattern: /1/g, replacement: "i" },       // 1 -> i
    { pattern: /3/g, replacement: "e" },       // 3 -> e
    { pattern: /4/g, replacement: "a" },       // 4 -> a
    { pattern: /5/g, replacement: "s" },       // 5 -> s
    { pattern: /\$/g, replacement: "s" },      // $ -> s
    { pattern: /@/g, replacement: "a" },       // @ -> a
  ];
  
  // Temizlenmiş metin versiyonları oluştur
  const originalText = text.toLowerCase();
  let normalizedText = originalText;
  
  // Tüm manipülasyonları uygula
  wordManipulations.forEach(({ pattern, replacement }) => {
    normalizedText = normalizedText.replace(pattern, replacement);
  });
  
  // Sonuçları topla
  const results = {
    isAppropriate: true,
    maskedContent: text,
    detections: [],
    categories: {}
  };
  
  // Her kategori için kontrol
  for (const [categoryName, category] of Object.entries(categories)) {
    const detectedTerms = [];
    
    // Her terimi orijinal ve normalleştirilmiş metinde kontrol et
    for (const term of category.terms) {
      const termRegex = new RegExp(`\\b${term}\\b`, 'i');
      
      if (termRegex.test(originalText) || termRegex.test(normalizedText)) {
        detectedTerms.push(term);
        
        // İçeriği maskele (yıldızla değiştir)
        const maskRegex = new RegExp(term, 'gi');
        results.maskedContent = results.maskedContent.replace(
          maskRegex, 
          match => '*'.repeat(match.length)
        );
      }
    }
    
    // Kategoride uygunsuz terim bulunduysa
    if (detectedTerms.length > 0) {
      results.isAppropriate = false;
      results.categories[categoryName] = {
        detected: true,
        terms: detectedTerms,
        severity: category.severity
      };
      
      // Tespit bilgilerini ekle
      results.detections.push({
        category: categoryName,
        description: category.description,
        detectedTerms,
        severity: category.severity
      });
    } else {
      results.categories[categoryName] = {
        detected: false,
        terms: [],
        severity: 'none'
      };
    }
  }
  
  // İçerik dış API ile analiz edilebilir (opsiyonel)
  // Bu entegrasyon, daha kapsamlı bir içerik analizi için kullanılabilir
  try {
    const externalAnalysisEnabled = await strapi.service('api::setting.setting')
      .findOne({ where: { key: 'enable_external_content_analysis' } });
      
    if (externalAnalysisEnabled?.value === true) {
      const externalResults = await analyzeWithExternalAPI(text);
      
      // Dış API sonuçlarını mevcut sonuçlarla birleştir
      if (!externalResults.isAppropriate) {
        results.isAppropriate = false;
        
        // Kategorileri birleştir
        for (const [catName, catData] of Object.entries(externalResults.categories)) {
          if (catData.detected) {
            results.categories[catName] = catData;
            
            // Tespitleri ekle
            results.detections.push({
              category: catName,
              description: `Dış API tarafından tespit edilen ${catName}`,
              detectedTerms: catData.terms,
              severity: catData.severity,
              source: 'external'
            });
            
            // Maskeli içeriği güncelle
            results.maskedContent = externalResults.maskedContent;
          }
        }
      }
    }
  } catch (error) {
    strapi.log.error('External content analysis error:', error);
    // Dış API hatası durumunda, sadece yerel analiz sonuçlarını kullan
  }
  
  return results;
}

/**
 * Dış API ile içerik analizi (mock örnek - gerçek uygulamada API entegrasyonu olacak)
 * @param {string} text - Analiz edilecek metin
 * @returns {Promise<Object>} Analiz sonuçları
 */
async function analyzeWithExternalAPI(text) {
  // Bu fonksiyon örnek amaçlıdır
  // Gerçek uygulamada Azure Content Moderator, Amazon Comprehend veya 
  // Google Cloud Natural Language API gibi servisler entegre edilebilir
  
  /* Örnek bir implementasyon:
  const axios = require('axios');
  
  const response = await axios.post('https://content-moderation-api.example.com/analyze', {
    text,
    categories: ['profanity', 'hate', 'violence', 'sexual']
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.CONTENT_MODERATION_API_KEY}`
    }
  });
  
  return response.data;
  */
  
  // Mock sonuç
  return {
    isAppropriate: true,
    maskedContent: text,
    categories: {
      profanity: { detected: false, terms: [], severity: 'none' },
      hate: { detected: false, terms: [], severity: 'none' },
      violence: { detected: false, terms: [], severity: 'none' },
      sexual: { detected: false, terms: [], severity: 'none' }
    }
  };
}