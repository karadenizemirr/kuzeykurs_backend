// src/api/system-user/content-types/system-user/lifecycles.ts
import bcrypt from 'bcryptjs';


interface Event {
  params: {
    data: {
      password?: string;
      [key: string]: any;
    };
  };
}

export default {
  beforeCreate: async (event: Event) => {
    if (event.params.data.password) {
      const salt = await bcrypt.genSalt(10);
      event.params.data.password = await bcrypt.hash(event.params.data.password, salt);
    }
  },
  beforeUpdate: async (event: Event) => {
    // Şifre değiştiriliyorsa hashle
    if (event.params.data.password) {
      const salt = await bcrypt.genSalt(10);
      event.params.data.password = await bcrypt.hash(event.params.data.password, salt);
    }
  },
};