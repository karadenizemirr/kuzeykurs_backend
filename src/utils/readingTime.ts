// String olarak depolama için lifecycle hooks
interface Post {
  content?: string;
  read_time?: string; // "5 dakika" formatında string değer
}

export const readingTime = (content: string | undefined | null): string => {
  // İçerik yoksa veya boşsa, minimum süreyi döndür
  if (!content || content.trim() === "") {
    return "1 dakika";
  }

  const wordsPerMinute: number = 200;
  
  // HTML etiketlerini kaldır
  const text: string = content.replace(/<\/?[^>]+(>|$)/g, "");
  
  // Boş olmayan kelimeleri say
  const noOfWords: number = text.split(/\s+/).filter(Boolean).length;
  
  // Kelime yoksa, minimum süreyi döndür
  if (noOfWords <= 0) {
    return "1 dakika";
  }
  
  const minutes: number = noOfWords / wordsPerMinute;
  const readTime: number = Math.ceil(minutes);
  
  // Formatlanmış string değer döndür
  return readTime < 1 ? "1 dakika" : `${readTime} dakika`;
};