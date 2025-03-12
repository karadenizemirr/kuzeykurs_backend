/**
 * post controller
 */
import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::post.post', ({ strapi }) => ({
  // Mevcut controller metodlarını korur
  
  // Slug ile post getirme metodu
  async findBySlug(ctx) {
    const { slug } = ctx.params;

    // Slug parametresinin kontrolü
    if (!slug) {
      return ctx.badRequest('Slug parametresi gereklidir');
    }

    // Slug'a göre tek bir post bul
    const entity = await strapi.db.query('api::post.post').findOne({
      where: { slug },
      populate: {
        category: true,
        author: {
          populate: ['profile_image'],
        },
        tags: true,
        comments: {
          where: { is_approved: true },
          orderBy: { created_at: 'desc' },
          populate: ['user'],
        },
      },
    });

    // Post bulunamadıysa 404 döndür
    if (!entity) {
      return ctx.notFound('Bu slug ile ilişkili bir yazı bulunamadı');
    }

    // Görüntülenme sayısını arttır
    const updatedEntity = await strapi.db.query('api::post.post').update({
      where: { id: entity.id },
      data: { views: (entity.views || 0) + 1 },
    });

    // Sanitize işlemi (hassas verileri temizleme)
    const sanitizedEntity = await this.sanitizeOutput(updatedEntity, ctx);

    // Formatlı yanıt dön
    return this.transformResponse(sanitizedEntity);
  },
}));