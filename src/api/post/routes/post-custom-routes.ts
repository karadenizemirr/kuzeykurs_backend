// src/api/post/routes/post-custom-routes.ts
export default {
  routes: [
    {
      method: 'GET',
      path: '/posts/slug/:slug',
      handler: 'api::post.post.findBySlug',
      config: {
        auth: false,  // Herkese açık bir endpoint olarak ayarla
      },
    },
  ],
};