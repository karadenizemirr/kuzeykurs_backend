'use strict';

module.exports = {
  // Yeni başvuru oluşturulduğunda
  async afterCreate(event) {
    const { result } = event;
    
    try {
      // Eğer exam ilişkisi varsa
      if (result.exam) {
        const examId = result.exam.id || result.exam;
        
        // İlgili sınavı bul
        const exam = await strapi.entityService.findOne('api::exam.exam', examId, {});
        
        if (!exam) return;
        
        // Başvuran sayısını artır
        await strapi.entityService.update('api::exam.exam', examId, {
          data: {
            registeredCount: (exam.registeredCount || 0) + 1
          }
        });
        
        // Eğer sınav kontenjanı dolmuşsa, durumunu güncelle (opsiyonel)
        if ((exam.registeredCount + 1) >= exam.quota) {
          await strapi.entityService.update('api::exam.exam', examId, {
            data: {
              examStatus: true // Başvuru kapalı durumuna getir
            }
          });
        }
      }
    } catch (error) {
      console.error('Başvuru sayısını artırırken hata:', error);
    }
  },
  
  // Başvuru silindiğinde
  async beforeDelete(event) {
    const { where } = event.params;
    const id = where?.id || where?.$eq;
    
    if (!id) return;
    
    try {
      // Silinecek kaydı bul
      const registration = await strapi.entityService.findOne('api::exam-registration.exam-registration', id, {
        populate: ['exam'],
      });
      
      if (!registration || !registration.exam) return;
      
      // Exam bilgisini geçici olarak global değişkende sakla
      global.examToUpdate = {
        id: registration.exam.id,
        currentCount: registration.exam.registeredCount || 0
      };
    } catch (error) {
      console.error('Silme öncesi veri hazırlarken hata:', error);
    }
  },
  
  // Başvuru silindikten sonra
  async afterDelete() {
    // Silme öncesinde sakladığımız exam bilgisini kontrol et
    if (global.examToUpdate) {
      try {
        const { id, currentCount } = global.examToUpdate;
        
        // Başvuru sayısını azalt (min. 0)
        await strapi.entityService.update('api::exam.exam', id, {
          data: {
            registeredCount: Math.max(0, currentCount - 1)
          }
        });
        
        // Geçici veriyi temizle
        delete global.examToUpdate;
      } catch (error) {
        console.error('Başvuru sayısını azaltırken hata:', error);
      }
    }
  }
};