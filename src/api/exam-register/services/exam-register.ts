'use strict';

/**
 * exam-register service
 */
const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::exam-register.exam-register', ({ strapi }) => ({
  // Mevcut servis metodlarını korurken yeni metodları ekliyoruz
  async create(data) {
    try {
      // Öncelikle exam ID'sini alalım
      const examId = data.data?.exam?.id || data.data?.exam;
      
      // Kimlik numarası ve telefon bilgilerini alalım
      const identifyNo = data.data?.identifyNo;
      const phone = data.data?.phone;
      
      // Eğer exam ID ve kimlik numarası veya telefon varsa, kontrol yapalım
      if (examId && (identifyNo || phone)) {
        // Aynı sınav için filtreleme kriteri oluşturalım
        let filters:any = { exam: examId };
        
        // Kimlik numarası ve telefon için OR koşulu oluşturalım
        if (identifyNo && phone) {
          filters.$or = [
            { identifyNo },
            { phone }
          ];
        } else if (identifyNo) {
          filters.identifyNo = identifyNo;
        } else if (phone) {
          filters.phone = phone;
        }
        
        // Aynı kişinin (kimlik no veya telefon) aynı sınava daha önce başvurup başvurmadığını kontrol edelim
        const existingRegistrations = await strapi.entityService.findMany('api::exam-register.exam-register', {
          filters
        });
        
        // Eğer mevcut bir kayıt varsa, hata fırlatalım
        if (existingRegistrations && existingRegistrations.length > 0) {
          throw new Error('Bu kişi zaten bu sınava kayıt olmuş. Aynı kişi aynı sınava tekrar kayıt olamaz.');
        }
      }
      
      // Orijinal create metodunu çağır
      const result = await super.create(data);
      
      try {
        // Eğer exam ilişkisi varsa
        if (result.exam?.id || (data.data?.exam && data.data.exam)) {
          const examId = result.exam?.id || data.data.exam.id || data.data.exam;
          
          // İlgili exam'i bul
          const exam = await strapi.entityService.findOne('api::exam.exam', examId, {});
          
          // registeredCount'u artır
          await strapi.entityService.update('api::exam.exam', examId, {
            data: {
              registeredCount: (exam.registeredCount || 0) + 1,
            },
          });
          
          console.log(`Exam ${examId} registeredCount incremented to ${(exam.registeredCount || 0) + 1}`);
        }
      } catch (error) {
        console.error('Error incrementing exam registeredCount:', error);
      }
      
      return result;
    } catch (error) {
      // Hata durumunda daha açıklayıcı mesaj ile hatayı yukarıya fırlatalım
      console.error('Error in exam registration:', error);
      throw error;
    }
  },
  
  async delete(id) {
    // Silinecek kaydı önce bul
    const recordToDelete = await strapi.entityService.findOne(
      'api::exam-register.exam-register', 
      id,
      { populate: ['exam'] }
    );
    
    // Orijinal delete metodunu çağır
    const result = await super.delete(id);
    
    try {
      // Eğer exam ilişkisi varsa
      if (recordToDelete?.exam?.id) {
        const examId = recordToDelete.exam.id;
        
        // İlgili exam'i bul
        const exam = await strapi.entityService.findOne('api::exam.exam', examId, {});
        
        // registeredCount'u azalt (0'dan küçük olmasını engelle)
        const newCount = Math.max(0, (exam.registeredCount || 0) - 1);
        
        await strapi.entityService.update('api::exam.exam', examId, {
          data: {
            registeredCount: newCount,
          },
        });
        
        console.log(`Exam ${examId} registeredCount decremented to ${newCount}`);
      }
    } catch (error) {
      console.error('Error decrementing exam registeredCount:', error);
    }
    
    return result;
  }
}));