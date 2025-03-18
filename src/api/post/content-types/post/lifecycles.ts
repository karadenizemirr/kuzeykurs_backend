// src/api/post/content-types/post/lifecycles.ts
import { readingTime } from "../../../../utils/readingTime";

interface Post {
  content?: string;
  read_time?: string;
}

interface CreateEvent {
  params: {
    data: Post;
  };
}

interface UpdateEvent {
  params: {
    data: Partial<Post>;
  };
}

export default {
  beforeCreate(event: CreateEvent) {
    const { data } = event.params;
    
    // İçeriği al (content alanınızın adı farklı olabilir)
    const content = data.content || '';
    
    // Okuma süresini hesapla ve ayarla
    data.read_time = readingTime(content);
  },
  
  beforeUpdate(event: UpdateEvent) {
    const { data } = event.params;
    
    // İçerik güncellendiyse okuma süresini de güncelle
    // Önemli: data.content undefined veya null olduğunda bile güncelleme yapmalıyız
    // çünkü içerik temizlenmiş olabilir
    if (data.content !== undefined) {
      data.read_time = readingTime(data.content);
    }
  },
};