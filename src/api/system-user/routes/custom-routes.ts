// src/api/system-user/routes/custom-routes.js
export default {
  routes: [
    {
      method: 'POST',
      path: '/system-users/login',
      handler: 'system-user.login',
      config: {
        auth: false, // Public endpoint
      },
    },
    {
      method: 'GET',
      path: '/system-users/role/:role',
      handler: 'system-user.findByRole',
      config: {
        auth: { strategy: 'admin' }, // Sadece admin erişebilir
      },
    },
    {
      method: 'GET',
      path: '/system-users/active',
      handler: 'system-user.findActive',
      config: {
        auth: { strategy: 'admin' }, // Sadece admin erişebilir
      },
    },
  ],
};