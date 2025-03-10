// src/api/exam/services/exam-date-checker.js
'use strict';

/**
 * Sınav tarihi geçmiş sınavları kontrol eden ve durumunu güncelleyen servis
 */
module.exports = {
  /**
   * Sınav tarihi geçmiş sınavların durumunu günceller
   */
  async checkExamDates() {
    try {
      // Şimdiki tarih
      const now = new Date();
      
      // Sınav durumu açık (examStatus = false) olan sınavları getir
      const exams = await strapi.entityService.findMany('api::exam.exam', {
        filters: {
          examStatus: false,
        },
      });
      
      // Log kaydı
      console.log(`${new Date().toISOString()} - Toplam ${exams.length} açık sınav kontrol ediliyor...`);
      
      let updatedCount = 0;
      
      // Her sınavın tarihini kontrol et
      for (const exam of exams) {
        // startDate veya endDate'i kullan (examDate yerine)
        // İhtiyaca göre startDate veya endDate seçin
        const examDate = new Date(exam?.startDate || exam?.endDate);
        
        // Tarih geçerli mi kontrol et
        if (isNaN(examDate.getTime())) {
          console.log(`Sınav ID: ${exam.id} - "${exam.name}" - Geçerli bir tarih bulunamadı, atlanıyor.`);
          continue;
        }
        
        // Eğer sınav tarihi geçmişse, durumunu güncelle
        if (examDate < now) {
          await strapi.entityService.update('api::exam.exam', exam.id, {
            data: {
              examStatus: true, // Sınav durumunu kapalı yap
              // Burada başka güncellemeler de yapabilirsiniz
            }
          });
          
          console.log(`Sınav ID: ${exam.id} - "${exam.name}" - Tarihi geçti (${examDate.toLocaleDateString()}), durumu kapatıldı.`);
          updatedCount++;
        }
      }
      
      console.log(`${new Date().toISOString()} - Toplam ${updatedCount} sınavın durumu güncellendi.`);
      
      return { success: true, updated: updatedCount };
    } catch (error) {
      console.error('Sınav tarihi kontrolü sırasında hata:', error);
      return { success: false, error: error.message };
    }
  }
};