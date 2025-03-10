/**
 * system-user controller
 */
import { factories } from '@strapi/strapi';
import bcrypt from 'bcryptjs';


// Interfaces
interface SystemUser {
  id: number;
  email: string;
  password: string;
  role?: {
    type: string;
  };
  [key: string]: any;
}

interface LoginRequest {
  email: string;
  password: string;
}

export default factories.createCoreController('api::system-user.system-user', ({ strapi }) => ({
  // Mevcut controller fonksiyonlarını korur
  
  // Özel login endpoint'i
async login(ctx) {
    const { email, password }: LoginRequest = ctx.request.body;
    
    if (!email || !password) {
      return ctx.badRequest('Email ve şifre gereklidir.');
    }
    
    try {
      // Kullanıcıyı email ile bul
      const user = await strapi.db.query('api::system-user.system-user').findOne({
        where: { email: email.toLowerCase() },
        populate: ['role'],
      }) as SystemUser | null;
      
      if (!user) {
        return ctx.badRequest('Kullanıcı bulunamadı');
      }
      
      // Bcrypt ile şifre doğrulama
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return ctx.badRequest('Şifre hatalı');
      }
      
      // Kullanıcıyı şifre olmadan döndür
      const { password: _, ...userWithoutPassword } = user;
      
      return ctx.send(userWithoutPassword);
    } catch (error) {
      return ctx.badRequest(`Giriş hatası: ${(error as Error).message}`);
    }
  },
  
  // Kullanıcıyı role göre getirme
  async findByRole(ctx) {
    const { role } = ctx.params;
    
    if (!role) {
      return ctx.badRequest('Rol belirtilmelidir');
    }
    
    const users = await strapi.db.query('api::system-user.system-user').findMany({
      where: { role: { type: role } },
      populate: ['role'],
    });
    
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  },
  
  // Aktif kullanıcıları getirme
  async findActive(ctx) {
    const users = await strapi.db.query('api::system-user.system-user').findMany({
      where: { active: true },
      populate: ['role'],
    });
    
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }
}));