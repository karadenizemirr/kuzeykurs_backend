/**
 * pre-register service
 */
import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::pre-register.pre-register', ({ strapi }) => ({
  async create(data) {
    try {
      // Kimlik numarası kontrolü
      const identifyNo = data.data?.identifyNo;
      
      // Eğer identifyNo varsa, aynı kimlik numarasıyla daha önce kayıt olup olmadığını kontrol et
      if (identifyNo) {
        const existingRegistration = await strapi.entityService.findMany('api::pre-register.pre-register', {
          filters: {
            identifyNo
          },
        });
        
        // Eğer aynı kimlik numarasıyla kayıt varsa hata fırlat
        if (existingRegistration && existingRegistration.length > 0) {
          throw new Error('Bu kimlik numarası ile daha önce ön kayıt oluşturulmuş. Aynı kişi tekrar kayıt yapamaz.');
        }
      }
      
      // Eğer daha önce kayıt yoksa, yeni kaydı oluştur
      const result = await super.create(data);
      return result;
    } catch (error) {
      console.error('Error in pre-registration process:', error);
      throw error;
    }
  }
}));