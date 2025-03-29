/**
 * question controller
 */
import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::question.question', ({ strapi }) => ({
  // Mevcut methodlar korunur
  
  // ID'ye göre soru getirme
  async findById(ctx) {
    try {
      const { id } = ctx.params;
      
      if (!id) {
        return ctx.badRequest('ID parametresi gereklidir');
      }
      
      // ID'ye göre soru bulma
      const entity = await strapi.db.query('api::question.question').findOne({
        where: { id: id },
        populate: {
          users_permissions_user: true,
          // İlişkili diğer verileri burada belirtebilirsiniz
        },
      });
      
      if (!entity) {
        return ctx.notFound('Bu ID ile eşleşen soru bulunamadı');
      }
      
      // Sonuçları döndürme
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity);
      
    } catch (error) {
      console.error('Error finding question by ID:', error);
      return ctx.internalServerError('Soru getirilirken bir hata oluştu');
    }
  }
}));